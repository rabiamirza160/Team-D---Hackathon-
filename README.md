# Government Form Helper & Service Navigator

CanAI Garage Fall Hackathon 2026 — Team D

An AI assistant that explains Manitoba government forms in plain language, builds personalized document checklists, and points users to the right online service, with a link to the official source for every answer. Supports English and French.

---

## Project structure

```
backend/          FastAPI server, LLM calls, prompts
frontend/         React (Vite) app
data/
  raw/            Scraped Manitoba data, exactly as provided (committed)
  ingest.py       Cleans + chunks raw data, builds the search index
  chunks.jsonl    One chunk per line (generated)
  index/          Vector index (generated, NOT committed)
docs/             Slides, screenshots, demo script, test scenarios
```

---

## Setup

### 1. Clone and configure

```bash
git clone https://github.com/rabiamirza160/Team-D---Hackathon-.git
cd Team-D---Hackathon-
cp .env.example .env
```

Fill in `.env` with the keys shared in team chat. **Never commit `.env`.**

### 2. Build the data index (run once, and again whenever `ingest.py` changes)

```bash
python3 data/ingest.py
```

### 3. Run the backend (port 8000)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 4. Run the frontend (port 5173)

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

---

## Git workflow

- Branch off `main`: `feature/<short-name>`
- Pull `main` into your branch often: `git pull origin main --no-edit`
- Add specific files only (**no `git add -A`**)
- Open a PR, one teammate reviews, then merge
- Only one person edits the README at a time
- **Demo freeze:** Thursday Oct 29, evening (bug fixes only after that)

---

## Team roles

| Role | Owns | Branch | Who |
|------|------|--------|-----|
| Data & retrieval | Load scraped data, chunk + embed, `search(query)` returning top chunks with URLs | `feature/ingestion` | |
| Backend & prompts | FastAPI server, `/api/chat` + `/api/checklist`, prompt design, LLM calls | `feature/api` | |
| Frontend | React app: chat view with source links, checklist view, EN/FR toggle | `feature/frontend` | |
| Presentation & testing | Slides (6 required sections), test scenarios, demo script, backup demo video | `docs/` | |

---

## API contract

Frontend and backend both build against this. **Change it only after posting in team chat and updating this section.**

```
POST /api/chat
  request:  { "message": "...", "language": "en" | "fr" }
  response: { "answer": "...", "sources": [{ "title": "...", "url": "..." }] }

POST /api/checklist
  request:  { "situation": "I just moved to Winnipeg with two kids" }
  response: { "items": [{ "task": "...", "form": "...", "url": "..." }] }
```

### Working in parallel

- **Frontend:** all API calls live in `frontend/src/api.ts`, with a `USE_MOCK` flag that returns fake data in the contract shape. Flip it to `false` once the backend is running.
- **Backend:** the first version of each endpoint returns a hardcoded response in the contract shape. Real search and LLM logic gets added behind it.
- **Connecting:** `frontend/vite.config.ts` proxies `/api` to `http://localhost:8000`, so there are no CORS issues.

---

## Data

Every chunk in `data/chunks.jsonl` looks like this:

```json
{"id": "mb-0042", "text": "...", "title": "Manitoba Health Registration", "url": "https://...", "lang": "en"}
```

Keep `title` and `url` through every step, since they power the source links in answers.

The backend calls one function from the data layer:

```python
def search(query: str, k: int = 5) -> list[dict]:
    # returns [{"text": ..., "title": ..., "url": ..., "lang": ...}, ...]
```

As long as that shape stays the same, the storage underneath (Chroma, FAISS, etc.) can change without breaking the backend.

---

## Timeline

| When | Goal |
|------|------|
| **Wed Oct 28** | End to end: ask a question in the browser, get a real answer with a source link |
| **Thu Oct 29 AM** | Checklist feature, French support, better answer quality |
| **Thu Oct 29 PM** | UI polish, slides with real screenshots, full run-through |
| **Thu Oct 29 evening** | Demo freeze, record backup demo video |
| **Fri Oct 30** | Final rehearsal, then present (8 min + 2 min Q&A) |

Check-ins in team chat: **lunch** and **end of day**.

---

## Scope rules

- No login, no database, no deployment. We run locally and screen-share for the demo.
- If the checklist isn't working by Thursday noon, cut it and polish chat instead.
- Every answer must link to an official source. If the data doesn't cover a question, the assistant says so instead of guessing.