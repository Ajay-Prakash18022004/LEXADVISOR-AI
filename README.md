# LexAdvisor AI &mdash; Indian Legal Decision Support System

> **A Proactive Legal Decision-Support System featuring Telangana (TS) & Andhra Pradesh (AP) Stamp Paper Auditing, AI Contract Risk Analysis, and Action Plan Recommendations.**

![LexAdvisor AI Architecture](https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18.3+-61DAFB?logo=react&logoColor=black)
![Jurisdiction](https://img.shields.io/badge/Jurisdiction-Telangana%20%7C%20Andhra%20Pradesh-14213D)

---

## 🏛️ Problem Addressed & System Outcome

Traditional legal chatbots remain **strictly reactive** &mdash; they only answer questions the user thinks to ask. However, clients and non-lawyer users typically:
1. **Do not know what statutory violations to check for** (e.g. deficient stamp duty rendering an agreement inadmissible in court under Section 35 of the Indian Stamp Act).
2. **Overlook one-sided covenants** (such as uncapped unilateral indemnities, summary termination without cure notice, or penal lock-in period forfeitures).
3. **Lack guidance on immediate legal remedies** (preserving Section 65B electronic evidence, RPAD demand notice drafting, pre-institution mediation).

**LexAdvisor AI** converts the assistant into a **proactive legal decision-support system**:
- **Stamp Paper & E-Stamp Analyzer**: Automatically verifies Telangana and Andhra Pradesh stamp papers and e-stamps using official schedules (`stamp_rules.json`), validating denomination, serial/UIN regex patterns, SHCIL portal registration, date precedence, and Error Level Analysis (ELA) tampering indicators.
- **AI Contract Risk Analyzer**: Compares contracts against standard statutory checklists (`clause_checklist.json`), detecting missing clauses and unfavorable terms.
- **Legal Action Recommendation Engine**: Formulates a prioritized, step-by-step legal roadmap including evidence preservation, voluntary stamping, RPAD demand notices, and advocate consultation briefs.

---

## 📂 Project Architecture

```
LexAdvisor-AI/
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI app, static mounting, CORS
│   │   ├── core/
│   │   │   ├── config.py               # Settings from .env
│   │   │   ├── security.py             # Password hashing, JWT token creation
│   │   │   ├── dependencies.py         # DB session, current authenticated user
│   │   │   ├── logging.py              # Structured logger
│   │   │   └── scoring.py              # Stamp confidence & risk score formulas
│   │   ├── db/
│   │   │   ├── database.py             # SQLite engine + session
│   │   │   ├── models.py               # User, Document, StampReport, RiskReport, ActionPlan
│   │   │   └── chroma_client.py        # ChromaDB & embedded vector engine
│   │   ├── schemas/                    # Pydantic request & response models
│   │   │   ├── auth.py, document.py, chat.py, generation.py
│   │   │   ├── stamp.py, risk.py, actions.py, advocate.py
│   │   ├── routers/
│   │   │   ├── auth.py, documents.py, chat.py, summary.py, clauses.py
│   │   │   ├── generation.py, pdf.py, advocates.py
│   │   │   ├── stamp.py                # POST /stamp/analyze
│   │   │   ├── risk.py                 # POST /risk/analyze, POST /risk/{doc_id}
│   │   │   ├── actions.py              # POST /actions/recommend, POST /actions/{doc_id}
│   │   │   └── analysis.py             # POST /analysis/full, POST /analysis/{doc_id}/run
│   │   ├── services/
│   │   │   ├── llm_service.py          # Unified LLM wrapper (Gemini + Indian Legal Engine)
│   │   │   ├── embedding_service.py    # Vector representations
│   │   │   ├── document_parser.py      # PDF, DOCX, and Image extraction
│   │   │   ├── chunking.py             # Semantic clause chunking
│   │   │   ├── rag_service.py          # ChromaDB retrieval + QA
│   │   │   ├── summarizer.py, clause_extractor.py, doc_generator.py, email_notice_drafter.py
│   │   │   ├── pdf_service.py          # ReportLab court-ready PDF generation
│   │   │   ├── advocate_service.py     # Geolocation & specialization search
│   │   │   ├── stamp/
│   │   │   │   ├── ocr_service.py      # PDF/image to text & page images
│   │   │   │   ├── stamp_extractor.py  # Structured extraction + regex validation
│   │   │   │   ├── stamp_rules.py      # TS & AP statutory rules validation
│   │   │   │   ├── qr_service.py       # QR & UIN verification check
│   │   │   │   └── forensics.py        # ELA, sharpness, & color profile checks
│   │   │   ├── risk_analyzer.py        # Missing clauses & high-risk term detection
│   │   │   ├── action_engine.py        # Prioritized legal action roadmap
│   │   │   └── analysis_pipeline.py    # One-shot orchestration pipeline
│   │   ├── prompts/                    # Externalized prompt templates
│   │   ├── data/
│   │   │   ├── stamp_rules.json        # Telangana & Andhra Pradesh stamp schedules
│   │   │   ├── clause_checklist.json   # Contract checklists per agreement category
│   │   │   └── advocates_seed.json     # Hyderabad, Vizag, Vijayawada advocate directory
│   │   └── static/                     # Full web frontend served directly by FastAPI
│   │       ├── index.html
│   │       ├── css/style.css           # Exact custom typography and styles
│   │       └── js/app.js
│   ├── storage/                        # SQLite DB, uploads, and PDFs
│   ├── tests/                          # Pytest suites
│   ├── requirements.txt
│   └── run.py                          # Backend launcher
├── frontend/                           # Full React + Vite application
│   ├── src/
│   │   ├── api/, components/, pages/, context/, routes/
│   │   ├── App.jsx, main.jsx, index.css
│   └── package.json
└── run.py                              # Root launcher
```

---

## ⚡ Quick Start (Run Locally)

### 1. Launch FastAPI Backend & Web Interface
In your terminal, simply execute:
```bash
python run.py
```
Open **[http://localhost:8000](http://localhost:8000)** in your browser.
The complete application is immediately active!

Interactive Swagger API Documentation:
- **[http://localhost:8000/docs](http://localhost:8000/docs)**

---

## 🧪 Running Automated Tests
```bash
python -m pytest backend/tests/
```

---

## 📝 Configuration (`.env`)
Create a `.env` file in the root or `backend/` directory if you wish to configure an external Gemini API key:
```env
LLM_API_KEY=your_gemini_api_key_here
LLM_MODEL=gemini-1.5-flash
JWT_SECRET=your_custom_jwt_secret
```
*Note: If no API key is provided, LexAdvisor AI automatically uses its built-in Indian Legal Reasoning Engine.*
