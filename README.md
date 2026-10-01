# AIVOA — AI-Powered Deviation Intake & Copilot Module

A production-grade, AI-powered Quality Management System (QMS) Deviation Intake Module designed for Active Pharmaceutical Ingredient (API) and drug product manufacturing facilities.

Operators and QA teams can log, update, question, and persist deviations via natural language conversation, raw text paste, or direct document upload (PDF, DOCX, TXT, XLSX, JPG, PNG). The system features an autonomous LangGraph agent pipeline backed by Groq LLMs, complete with clinical risk assessment, automated field diffing, missing field detection, and dual-mode database persistence.

> A focused prototype for QA review workflows. The application is self-contained in this repository; local secrets and generated database files are intentionally ignored.

[![Backend](https://img.shields.io/badge/backend-FastAPI-009688?logo=fastapi&logoColor=white)](backend/main.py) [![Frontend](https://img.shields.io/badge/frontend-React%2018-61DAFB?logo=react&logoColor=111827)](frontend/package.json) [![AI](https://img.shields.io/badge/AI-LangGraph%20%2B%20Groq-111827)](backend/agent.py)

---

## 🏛 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                 PRESENTATION LAYER                              │
│                                                                                 │
│   ┌───────────────────────────────────┐     ┌────────────────────────────────┐  │
│   │         DeviationForm.jsx         │     │        CopilotPanel.jsx        │  │
│   │  • Read-only compliance inputs    │     │  • ChatGPT-style thread        │  │
│   │  • 1.5s flash highlight on change │     │  • Paperclip & Drag-and-Drop   │  │
│   │  • Missing field amber alerts     │     │  • Interactive starter chips   │  │
│   │  • Dynamic Status Pill            │     │  • Client-side type & size val │  │
│   │  • Pinned Reset & Save actions    │     │  • Inline RiskAssessment cards │  │
│   └─────────────────▲─────────────────┘     └───────────────┬────────────────┘  │
│                     │                                       │                   │
│                     └───────────────────┬───────────────────┘                   │
│                                         │                                       │
│                       Redux Toolkit Atomic Store (store.js)                     │
└─────────────────────────────────────────┼───────────────────────────────────────┘
                                          │ FormData (msg, form, risk, history, file)
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                  BACKEND API                                    │
│                                                                                 │
│               FastAPI (main.py) — Unified POST /api/chat                        │
│          • Multipart/form-data & application/json dual support                  │
│          • File buffer extraction (PDF, DOCX, XLSX, TXT, OCR)                   │
└─────────────────────────────────────────┼───────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          LANGGRAPH AGENT ENGINE (agent.py)                      │
│                                                                                 │
│     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌─────────┐  │
│     │    Router    │ ──► │   Extract    │ ──► │   Validate   │ ──► │  Merge  │  │
│     │  Classifier  │     │   Groq LLM   │     │  Pydantic &  │     │  Diff & │  │
│     │(log/edit/q)  │     │  JSON Output │     │  Rules Engine│     │ History │  │
│     └──────────────┘     └──────────────┘     └──────────────┘     └─────────┘  │
└─────────────────────────────────────────┼───────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                               PERSISTENCE LAYER (db.py)                         │
│                                                                                 │
│     • Primary: PostgreSQL 16 (via Docker Compose)                               │
│     • Automatic Fallback: Local SQLite (deviations.db) — Zero Setup Needed!     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📂 Project Folder Architecture

```
 aivoa-deviation/                         # Application root
├── DEVLOG.md                             # Architectural decision log
├── README.md                             # Setup, architecture, and test guide
├── docker-compose.yml                    # PostgreSQL 16 container definition
│   │
├── backend/                              # FastAPI & LangGraph backend service
│   │   ├── agent.py                     # LangGraph state graph, prompts & file parsing
│   │   ├── create_sample_pdfs.py        # PDF generator for acceptance testing
│   │   ├── db.py                        # SQLAlchemy ORM + automatic SQLite fallback
│   │   ├── main.py                      # FastAPI application & unified /api/chat route
│   │   ├── requirements.txt             # Python backend dependencies
│   │   ├── schemas.py                   # Pydantic schemas (form, risk, chat, save)
│   │   ├── test_e2e_scenarios.py        # Automated test suite for 10 acceptance tests
│   │   └── .env.example                 # Example environment template
│   │
├── frontend/                             # React 18 + Redux + Vite SPA
│   │   ├── index.html                   # HTML entry point with Noto Sans fonts
│   │   ├── package.json                 # Node dependencies (lucide-react, redux toolkit)
│   │   ├── vite.config.js               # Vite configuration
│   │   └── src/
│   │       ├── main.jsx                 # React root + Redux Provider
│   │       ├── App.jsx                  # Two-panel responsive workspace layout
│   │       ├── api.js                   # Fetch client for chat, extract, deviations
│   │       ├── store.js                 # Redux Toolkit slice + configureStore
│   │       ├── index.css                # Impeccable CSS system (no bounce easing, tokens)
│   │       └── components/
│   │           ├── DeviationForm.jsx    # Left QMS form with status pill & flash animations
│   │           ├── CopilotPanel.jsx     # Right ChatGPT-style copilot with pinned composer
│   │           └── RiskAssessment.jsx   # Collapsible risk assessment cards
│   │
└── sample_docs/                          # Optional local test documents
│       └── (optional local test documents)
│
```

---

## ⚡ Quick Start

### 1. Prerequisites
- **Node.js**: v18+
- **Python**: v3.11+
- **Groq API Key**: Free at [console.groq.com](https://console.groq.com)
- *(Optional)* **Docker Desktop**: Only required if running PostgreSQL locally; if Docker is absent, the backend automatically uses SQLite (`deviations.db`) with zero setup.

### 2. Backend Setup
```bash
cd aivoa-deviation/backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure API key
copy .env.example .env    # On Windows
# cp .env.example .env    # On macOS/Linux
# Edit .env to set GROQ_API_KEY=gsk_...

# Start backend server
python main.py
```
*Backend runs on `http://localhost:8000` (Swagger interactive docs at `http://localhost:8000/docs`).*

### 3. Frontend Setup
```bash
cd aivoa-deviation/frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 🎯 Acceptance Test Coverage (10/10 Passed)

The suite has been validated both programmatically via `backend/test_e2e_scenarios.py` and interactively in the browser:

1. **Empty State**: Placeholders show *"Awaiting AI extraction..."*, status pill is *Awaiting Input*, right panel has welcome message & 3 starter chips.
2. **Attach Flow (`01_Reactor_Temperature_Excursion.pdf`)**: Paperclip file attachment triggers extraction, populates 9/9 fields, flashes updated fields, renders Risk Assessment card, and updates pill to *Pending Review*.
3. **Natural Language Edit**: *"Sorry, the batch number is MFH260914B and the batch size is 900 kg."* updates only the target fields, renders changed chips, and refreshes the risk assessment while collapsing earlier assessments.
4. **Missing Field Prompting (`02_Email_OOS_Dissolution.pdf`)**: Omitted dates trigger an amber border and *"Not found. Tell the copilot."* hint; typing *"The testing was done on 16-09-2026."* clears the warning and updates the field.
5. **Conversational Questioning**: *"Why did you pick that severity?"* returns a quality assurance justification in chat without modifying form values or risk cards.
6. **Scanned PDF Support (`04_Scanned_Lab_Report.pdf`)**: Extracts data accurately from scanned/image-backed lab report records.
7. **Direct Text Paste**: Pasting multi-line incident logs directly into the composer works seamlessly with no separate paste modal.
8. **Drag & Drop**: Dragging files anywhere over the right panel shows the dashed "Drop file to attach" overlay.
9. **Client-Side Validation**: `.zip` archives and files >10 MB are rejected immediately client-side with red assistant error bubbles.
10. **Database Persistence**: Clicking *Save Deviation* writes the record to PostgreSQL or SQLite, returns an auto-incremented ID, and updates the pill to *Saved · #ID*.

---

## 🧪 Running Automated Tests

```bash
cd aivoa-deviation/backend
.venv\Scripts\python -u test_e2e_scenarios.py
```
Output:
```
============================================================
STARTING AIVOA COPILOT VERIFICATION SUITE
============================================================
--- TEST 1: Backend Health & Deviations List --- [PASSED]
--- TEST 2: Attach Flow (01_Reactor_Temperature_Excursion.pdf) --- [PASSED]
--- TEST 3: Edit Flow --- [PASSED]
--- TEST 4: Missing Fields (02_Email_OOS_Dissolution.pdf) --- [PASSED]
--- TEST 5: Question Intent --- [PASSED]
--- TEST 6: Scanned PDF Extraction (04_Scanned_Lab_Report.pdf) --- [PASSED]
--- TEST 7: Plain Text Paste --- [PASSED]
--- TEST 10: Save Deviation to Database --- [PASSED]
============================================================
ALL CORE BACKEND SCENARIOS PASSED WITH 100% SUCCESS
============================================================
```

---

## 🎨 UI/UX Craft Standards (Impeccable Guidelines)

- **Typography**: Dual font hierarchy utilizing `Noto Sans Yi` for titles and section dividers, paired with `Noto Sans` for inputs and tabular numerals.
- **Micro-Interactions**: Smooth exponential easing (`cubic-bezier(0.16, 1, 0.3, 1)`) on focus rings, drop overlays, and button rotations; zero bounce or elastic easing.
- **Accessibility & Contrast**: Body text and placeholder ratios exceed WCAG AA 4.5:1 standards.
- **Audit Tooling**: Validated with `.agents/skills/impeccable/scripts/impeccable detect` returning 0 defects.
