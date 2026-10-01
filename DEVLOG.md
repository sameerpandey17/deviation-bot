# DEVLOG — AIVOA Deviation Intake Module

## Decision Log

All decisions made during the build are recorded here per the decision-log skill.

---

### 2026-09-24 — Project Kickoff

**Decision**: Follow build order from MASTER_PROMPT.md exactly (db → agent → main → frontend → docs).

**Decisions on silent points:**
- Vite chosen as the frontend bundler (explicitly allowed).
- `@reduxjs/toolkit` and `react-redux` for state management.
- `axios` replaced with native `fetch` per api.js design.
- `python-multipart` added to backend for file upload handling.
- OCR fallback via `pytesseract` will require Tesseract binary installed separately — documented in README.
- All Groq structured output uses `response_format={"type":"json_object"}` with explicit JSON schema in the system prompt.
- CORS origin set to `http://localhost:5173` (Vite default dev port).
- `ai_filled_fields` stored client-side only; DB stores final values + AI suggestions for auditability.
- Progress bar messages: "Thinking…" → "Extracting details…" → "Assessing risk…" → "Done".
- Draft/Saved badge implemented as a boolean `saved` flag in Redux slice.
- `.env.example` created alongside `.env` per rule 4.

---

### Step 1 — Docker Compose + db.py + schemas.py

Postgres launched via docker-compose. `db.py` defines engine, session, and `Deviation` ORM model with all form fields plus AI suggestion columns. `schemas.py` defines Pydantic models for request/response shapes.

---

### Step 2 — agent.py

LangGraph graph built with 4 nodes: router → extract → validate → merge. Single Groq call in extract node returns `{form, risk, reply, missing_fields}` as JSON. File parsing helpers added for PDF (PyMuPDF), DOCX (python-docx), XLSX (openpyxl), TXT (direct), images (pytesseract OCR).

---

### Step 3 — main.py

FastAPI app with `/api/chat`, `/api/extract`, `/api/deviations` (POST + GET). CORS enabled for Vite dev server. `/api/extract` uses multipart form data. All endpoints tested with curl.

---

### Step 4 — Frontend: store, api.js, layout

Redux slice created with `form`, `aiFilledFields`, `risk`, `messages`, `status`, `progress`, `saved`, `deviationId`. Single dispatch after each AI response. `api.js` wraps fetch calls.

---

### Step 5 — Components

`DeviationForm` (left panel): all fields disabled, AI badge on filled fields, Reset + Save buttons. `AssistantPanel` (right panel): file upload + chat. `RiskAssessment` card inside right panel.

---

### Step 6 — Sample Docs + End-to-End Testing

Sample PDF and TXT email created in `sample_docs/`. End-to-end flow tested: chat fills form, edit merges fields, upload extracts and fills, Save writes to Postgres.

---

### Step 7 — README + Final DEVLOG update

README written with full setup steps. DEVLOG finalised.

---

### Step 8 — UI Typography, Wide Layout & Component Polish (Impeccable Pass)

- **Layout Span**: Expanded `.page` container from narrow 1360px to 1680px with proportional grid columns (`minmax(0, 1.35fr) minmax(460px, 1fr)`), eliminating dead gutters on modern wide viewports.
- **Typography & Font System**: Integrated Google Fonts `Noto Sans Yi` and `Noto Sans` (weights 300 to 900). Enhanced typographic hierarchy:
  - Form Title: 24px bold (weight 800) with tight tracking.
  - Topic / Section Headers: 13px uppercase, bold (weight 800) with clean dividing borders.
  - Field Labels: 13.5px semibold (weight 650) for immediate scanability.
  - Inputs & Textareas: 14px comfortable baseline with 42px min-height.
  - Tabular numerals (`font-variant-numeric: tabular-nums`) applied to character counters and percentages.
- **Navbar Enhancement**: Taller 64px header, larger 36x36px AIVOA brand icon with linear gradient, 18px brand title, 14px navigation links with dedicated active indicator bar, and enhanced company status badge.
- **Reset Form Button Micro-Interaction**: Upgraded with crisp border, subtle hover elevation, and a smooth ease-out-expo SVG icon rotation (-180deg) without dated bounce easing.
- **Mechanical Quality**: Checked against the `impeccable` craft floor and ran the `impeccable detect` scanner, resolving all findings to 0 defects.

---

### Step 9 — Docker Independence & Zero-Setup Fallback

- **What if Docker is not used?**: Docker was only required for running the local PostgreSQL container. We added an automatic, seamless SQLite fallback in `db.py`:
  - If PostgreSQL is reachable at `DATABASE_URL`, the application connects to PostgreSQL.
  - If PostgreSQL / Docker is not running, it automatically falls back to a local SQLite database (`deviations.db`) created inside `backend/`.
  - All features (`POST /api/deviations`, `GET /api/deviations`, saving audit fields and JSON `root_cause_hints`) work with zero setup and zero external dependencies.
- **Groq Model Availability**: Added graceful model resolution in `agent.py` to ensure high availability across Groq model updates.
- **Backend Running Status**: Verified and active on `http://localhost:8000`. Tested end-to-end with chat extraction, risk assessment, and deviation persistence.

---

### Step 10 — ChatGPT-Style Copilot Refactor & Acceptance Test Results

Per `MASTER_PROMPT_UI_REFACTOR (3).md` and `impeccable` craft floor guidelines:
- **Right Panel (`CopilotPanel.jsx`)**:
  - Replaced separate upload boxes, buttons, and progress meters with a unified, full-height chat interface.
  - Header: `FlaskConical` icon, "AIVOA Copilot", gray description, live status dot (solid indigo when idle, pulsing when busy).
  - Scrolling message thread with 85% width bubbles, 32px assistant avatar with `Zap` icon, indigo user bubbles with attached file chips.
  - Welcome assistant bubble with 3 interactive starter chips: "Log a deviation from text", "Upload a deviation report", "Ask about severity".
  - Pinned composer with paperclip file picker, auto-growing textarea, file preview chip with remove button, client-side format/size validation, and drag-and-drop overlay.
  - Collapsible inline `RiskAssessment.jsx` cards inside the conversation thread (latest card expanded, earlier assessments collapsed to summary row).
  - Progress indicator with real step tracking or animated typing dots without fake steps.
- **Left Form (`DeviationForm.jsx`)**:
  - Independent scrolling with pinned bottom action bar (`Reset Form` + `Save Deviation`).
  - Dynamic status pill: *Awaiting Input* (gray) → *Pending Review* (amber) → *Saved · #ID* (emerald green).
  - Empty-state placeholders: *"Awaiting AI extraction..."*, *"Awaiting AI classification..."*, *"AI will synthesize..."*.
  - 1.5s soft indigo flashing highlight on fields updated by the AI, with persistent AI badge.
  - Missing field detection with amber border outline and *"Not found. Tell the copilot."* helper text.
- **Backend (`main.py`, `agent.py`, `schemas.py`)**:
  - Unified `POST /api/chat` supporting both `multipart/form-data` and `application/json` with parameters `message`, `current_form`, `current_risk`, `history`, and `file`.
  - LangGraph pipeline with automated diffing returning `changed_fields`, `missing_fields`, `intent` (`log`, `edit`, `question`), and contextual conversational `reply`.
- **Impeccable Verification**:
  - Ran `impeccable detect` across all JSX and CSS files, fixed bounce easing, achieved 0 defects.
- **Acceptance Tests (1 to 10)**:
  1. *Empty state*: Verified left form placeholders, *Awaiting Input* pill, right Copilot welcome message, and 3 starter chips.
  2. *Attach flow (`01_Reactor_Temperature_Excursion.pdf`)*: Verified paperclip attach, file chip, user bubble, AI extraction filling 9/9 fields, flash highlight, risk card, and pill turning *Pending Review*.
  3. *Edit flow*: Verified natural language edit ("batch number is MFH260914B..."), only `batch_lot_number` updated in `changed_fields`, changed chips displayed, previous card collapsed.
  4. *Missing fields (`02_Email_OOS_Dissolution.pdf`)*: Verified missing `date_of_occurrence` triggered amber outline & hint; follow-up reply *"The testing was done on 16-09-2026."* populated date and cleared hint.
  5. *Question intent*: Verified *"Why did you pick that severity?"* answered with clinical/quality rationale without mutating form fields or risk card.
  6. *Scanned PDF (`04_Scanned_Lab_Report.pdf`)*: Processed with document parser, extracted Paracetamol 650mg deviation details accurately.
  7. *Plain text paste*: Verified pasting multi-line text into composer extracted fields without needing a separate button.
  8. *Drag and drop*: Verified dragging file displays "Drop file to attach" dashed overlay and attaches file to composer chip.
  9. *Client validation*: Verified `.zip` files and files >10MB trigger assistant error bubble and are rejected before network send.
  10. *Save Deviation*: Verified clicking *Save Deviation* persists deviation to database, returns ID, and updates status pill to *Saved · #ID*.

