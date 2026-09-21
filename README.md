# Studique Question Bank & Sample Paper Generator

An internal tool for Studique's Faculty/Content team (SRM Institute of Science and Technology campus app).
Ingests previous-year question paper (PYQ) PDFs for a subject and produces two watermarked, print-ready PDFs:
1. **Question Bank (QB)**: Every unique question ever asked, verbatim, grouped by unit and part, each tagged with historical exam sessions.
2. **Sample Paper (SP)**: A newly generated paper in the exact SRM format (20x1 Part A, 5x8 Part B with OR choice, 1x15 Part C; Total 75 marks), with zero duplicate questions.

---

## Tech Stack
- **Frontend**: Next.js (App Router / Pages) + TypeScript + Tailwind CSS + `lucide-react`.
- **Backend**: Python 3.11 + FastAPI + SQLAlchemy + Alembic.
- **Database**: PostgreSQL 16 with `pgvector` extension.
- **Background Jobs**: `jobs` database table with a dedicated Python worker process.
- **PDF Extraction**: PyMuPDF & LLM vision pass.
- **PDF Rendering**: Jinja2 + KaTeX (math formatting) + Playwright/Chromium print-to-PDF with Studique watermark.

---

## Local Development Setup

### 1. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Set your Anthropic API Key in `.env`:
```env
ANTHROPIC_API_KEY=your_actual_anthropic_api_key
```

### 2. Run with Docker Compose (Recommended)
Launch Postgres (pgvector), FastAPI backend, worker process, and Next.js frontend:
```bash
docker compose up --build
```

Services will be accessible at:
- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **FastAPI Backend API**: [http://localhost:8000](http://localhost:8000)
- **API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Login Credentials (Seeded)
- **Email**: `faculty@studique.in`
- **Password**: `srm_faculty_2026!`

---

## Running Backend Tests Locally
To run automated tests on the backend API:
```bash
cd backend
python -m pytest tests/
```

---

## Milestone Status & Progress
- [x] **Milestone 1**: Monorepo setup, Docker Compose, DB migrations & pgvector extension, Auth login API, design system tokens, reusable component library (`AppShell`, `Sidebar`, `TickerBar`, `PageHeader`, `StatCard`, `FeatureCard`, `HeroPanel`, `Stepper`, `DropZone`, `DataTable`, `StatusBadge`, `ProgressList`, `Modal`, `Toast`, `EmptyState`), Login page, and Dashboard with live progress hero panel.
- [ ] **Milestone 2**: Upload flow, jobs system, extraction pipeline with validation, gold-set evaluation script.
- [ ] **Milestone 3**: Unit tagging, dedupe, occurrence records, QB generation and PDF.
- [ ] **Milestone 4**: Blueprint sampler, slot generation, similarity gate, SP PDF, draft/approve flow.
- [ ] **Milestone 5**: Wizard UI wired to API, Review Queue, Library, Subjects & Syllabus.
- [ ] **Milestone 6**: Hardening: error states, second-subject test, README update, demo data.
