"""
schemas.py — Pydantic models for request/response validation.
"""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel


# ── Form sub-model ─────────────────────────────────────────────────────────────

class DeviationForm(BaseModel):
    site_plant: Optional[str] = None
    date_of_occurrence: Optional[str] = None
    title: Optional[str] = None
    source: Optional[str] = None
    related_product: Optional[str] = None
    batch_lot_number: Optional[str] = None
    # Product Details
    product_strength: Optional[str] = None
    product_amount: Optional[str] = None
    dosage_form: Optional[str] = None
    manufacturing_date: Optional[str] = None
    expiry_date: Optional[str] = None
    # Deviation Details
    detailed_description: Optional[str] = None
    initial_impact: Optional[str] = None
    initial_severity: Optional[str] = None


# ── Risk Assessment sub-model ──────────────────────────────────────────────────

class RiskAssessment(BaseModel):
    severity: Optional[str] = None          # Minor | Major | Critical
    impact: Optional[str] = None
    reason: Optional[str] = None
    next_action: Optional[str] = None
    containment: Optional[str] = None
    root_cause_hints: Optional[List[str]] = None


# ── Standard AI response shape ─────────────────────────────────────────────────

class AIResponse(BaseModel):
    intent: Optional[str] = "log"           # log | edit | question
    form: DeviationForm
    changed_fields: List[str] = []
    risk: RiskAssessment
    reply: str
    missing_fields: List[str] = []


# ── Request bodies ─────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    current_form: Optional[DeviationForm] = None


# ── Save request ───────────────────────────────────────────────────────────────

class SaveRequest(BaseModel):
    form: DeviationForm
    risk: RiskAssessment


# ── DB response ───────────────────────────────────────────────────────────────

class DeviationOut(BaseModel):
    id: int
    site_plant: Optional[str]
    date_of_occurrence: Optional[str]
    title: Optional[str]
    source: Optional[str]
    related_product: Optional[str]
    batch_lot_number: Optional[str]
    product_strength: Optional[str]
    product_amount: Optional[str]
    dosage_form: Optional[str]
    manufacturing_date: Optional[str]
    expiry_date: Optional[str]
    detailed_description: Optional[str]
    initial_impact: Optional[str]
    initial_severity: Optional[str]
    ai_severity: Optional[str]
    ai_impact: Optional[str]
    ai_reason: Optional[str]
    next_action: Optional[str]
    containment: Optional[str]
    root_cause_hints: Optional[List[str]]
    created_at: Any

    model_config = {"from_attributes": True}
