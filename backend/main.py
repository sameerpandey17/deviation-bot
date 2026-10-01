"""
main.py — FastAPI application with /api/chat, /api/extract, /api/deviations.
"""
import json
import os
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from agent import extract_text_from_file, run_agent
from db import Deviation, get_db, init_db
from schemas import AIResponse, ChatRequest, DeviationForm, DeviationOut, RiskAssessment, SaveRequest

load_dotenv()

app = FastAPI(title="AIVOA Deviation API", version="1.0.0")

# ── CORS (allow Vite dev server) ───────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Create tables on startup ───────────────────────────────────────────────────
@app.on_event("startup")
def on_startup():
    try:
        init_db()
    except Exception as e:
        print(f"[WARN] DB not available at startup: {e}")
        print("[WARN] /api/deviations endpoints will fail until Postgres is running.")



# ══════════════════════════════════════════════════════════════════════════════
#  ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@app.post("/api/chat", response_model=AIResponse)
async def chat(request: Request):
    """
    Unified Copilot endpoint:
    Accepts multipart/form-data with message, current_form, current_risk, history, and optional file.
    Also accepts application/json body for backwards compatibility.
    """
    msg_str = ""
    form_dict = {}
    risk_dict = {}
    history_list = []
    file_text = None

    content_type = request.headers.get("content-type", "")

    if "application/json" in content_type:
        try:
            body = await request.json()
            msg_str = body.get("message") or ""
            form_dict = body.get("current_form") or {}
            risk_dict = body.get("current_risk") or {}
            history_list = body.get("history") or []
        except Exception:
            pass
    else:
        # Multipart form-data
        try:
            form_data = await request.form()
        except Exception:
            form_data = {}

        msg_str = form_data.get("message") or ""
        current_form = form_data.get("current_form")
        current_risk = form_data.get("current_risk")
        history = form_data.get("history")
        file_obj = form_data.get("file")

        if current_form:
            try:
                form_dict = json.loads(current_form) if isinstance(current_form, str) else current_form
            except Exception:
                form_dict = {}
        if current_risk:
            try:
                risk_dict = json.loads(current_risk) if isinstance(current_risk, str) else current_risk
            except Exception:
                risk_dict = {}
        if history:
            try:
                history_list = json.loads(history) if isinstance(history, str) else history
            except Exception:
                history_list = []

        if file_obj is not None and hasattr(file_obj, "filename") and file_obj.filename:
            MAX_BYTES = 10 * 1024 * 1024
            file_bytes = await file_obj.read()
            if len(file_bytes) > MAX_BYTES:
                raise HTTPException(status_code=413, detail="File exceeds 10 MB limit.")
            file_text = extract_text_from_file(file_obj.filename, file_bytes)
            if not file_text.strip():
                raise HTTPException(status_code=422, detail="Could not extract text from the uploaded file.")

    result = run_agent(
        message=msg_str,
        current_form=form_dict,
        current_risk=risk_dict,
        history=history_list,
        file_text=file_text,
    )
    return _build_response(result)


@app.post("/api/extract", response_model=AIResponse)
async def extract(
    file: UploadFile = File(...),
    current_form: str = Form(default="{}"),
    current_risk: str = Form(default="{}"),
):
    """
    Document extraction alias (calls unified agent pipeline).
    """
    MAX_BYTES = 10 * 1024 * 1024
    file_bytes = await file.read()
    if len(file_bytes) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="File exceeds 10 MB limit.")

    file_text = extract_text_from_file(file.filename or "upload.txt", file_bytes)
    if not file_text.strip():
        raise HTTPException(status_code=422, detail="Could not extract text from the uploaded file.")

    try:
        form_dict = json.loads(current_form)
    except Exception:
        form_dict = {}

    try:
        risk_dict = json.loads(current_risk)
    except Exception:
        risk_dict = {}

    result = run_agent(
        message="Extract all deviation details from this document.",
        current_form=form_dict,
        current_risk=risk_dict,
        file_text=file_text,
    )
    return _build_response(result)


@app.post("/api/deviations", response_model=DeviationOut)
def save_deviation(request: SaveRequest, db: Session = Depends(get_db)):
    """Save the final deviation form + risk assessment to Postgres."""
    f = request.form
    r = request.risk

    record = Deviation(
        site_plant=f.site_plant,
        date_of_occurrence=f.date_of_occurrence,
        title=f.title,
        source=f.source,
        related_product=f.related_product,
        batch_lot_number=f.batch_lot_number,
        detailed_description=f.detailed_description,
        initial_impact=f.initial_impact,
        initial_severity=f.initial_severity,
        ai_severity=r.severity if r else None,
        ai_impact=r.impact if r else None,
        ai_reason=r.reason if r else None,
        next_action=r.next_action if r else None,
        containment=r.containment if r else None,
        root_cause_hints=r.root_cause_hints if r else None,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@app.get("/api/deviations", response_model=List[DeviationOut])
def list_deviations(db: Session = Depends(get_db)):
    """List all saved deviation records (for verification)."""
    return db.query(Deviation).order_by(Deviation.created_at.desc()).all()


# ══════════════════════════════════════════════════════════════════════════════
#  HELPERS
# ══════════════════════════════════════════════════════════════════════════════

def _build_response(result: dict) -> AIResponse:
    """Convert agent output dict to AIResponse Pydantic model."""
    form_data = result.get("form") or {}
    risk_data = result.get("risk") or {}
    return AIResponse(
        intent=result.get("intent") or "log",
        form=DeviationForm(**{k: v for k, v in form_data.items() if k in DeviationForm.model_fields}),
        changed_fields=result.get("changed_fields") or [],
        risk=RiskAssessment(**{k: v for k, v in risk_data.items() if k in RiskAssessment.model_fields}),
        reply=result.get("reply", ""),
        missing_fields=result.get("missing_fields", []),
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
