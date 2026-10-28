# Government Form Helper & Service Navigator

CanAI Garage Fall Hackathon 2026 — AI assistant that explains Manitoba government forms in plain language, builds personalized document checklists, and points users to the right service.

## Structure

| Folder      | What goes here                              |
|-------------|---------------------------------------------|
| `backend/`  | API, LLM calls, retrieval (RAG)             |
| `frontend/` | React app                                   |
| `data/`     | Scraped form/service data + ingestion scripts |
| `docs/`     | Presentation notes, screenshots, demo plan  |

## Setup

1. Clone the repo
2. Copy `.env.example` to `.env` and fill in the keys (shared in team chat, never committed)

## Workflow

- Branch off `main`: `feature/<short-name>`
- Commit specific files (no `git add -A`)
- Open a PR, one teammate reviews, then merge
- Pull `main` into your branch often
- Demo freeze on `main`: Oct 30, noon (fixes only after that)
