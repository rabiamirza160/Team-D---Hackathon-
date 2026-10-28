import json

from dotenv import load_dotenv

load_dotenv()  # loads .env from the repo root before anything reads env vars

from typing import Literal

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from language import detect_language
from llm import ask_llm
from prompts import (
    CHECKLIST_SYSTEM,
    NO_ANSWER,
    build_chat_prompt,
    build_checklist_prompt,
    chat_system_prompt,
)
from retrieval import search

app = FastAPI(title="Form Helper API")


# ---------- Contract models (must match README) ----------

class Source(BaseModel):
    title: str
    url: str


class ChatRequest(BaseModel):
    message: str
    language: Literal["en", "fr"] = "en"  # UI toggle; used as fallback only


class ChatResponse(BaseModel):
    answer: str
    sources: list[Source]
    language: Literal["en", "fr"]  # language the answer is written in


class ChecklistRequest(BaseModel):
    situation: str


class ChecklistItem(BaseModel):
    task: str
    form: str
    url: str


class ChecklistResponse(BaseModel):
    items: list[ChecklistItem]


# ---------- Helpers ----------

def unique_sources(chunks: list[dict]) -> list[Source]:
    """One source per URL, in the order they were retrieved."""
    seen = set()
    sources = []
    for c in chunks:
        if c["url"] not in seen:
            seen.add(c["url"])
            sources.append(Source(title=c["title"], url=c["url"]))
    return sources


def parse_checklist(raw: str) -> list[ChecklistItem]:
    """Parse the LLM's JSON output. Returns [] if it isn't valid."""
    text = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    try:
        data = json.loads(text)
        return [ChecklistItem(**item) for item in data]
    except (json.JSONDecodeError, TypeError, ValueError):
        return []


# ---------- Endpoints ----------

@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    # Answer in the language of the question; the UI toggle is only a fallback
    language = detect_language(req.message, fallback=req.language)

    chunks = search(req.message, k=5)

    # Scope rule: if the data doesn't cover it, say so instead of guessing
    if not chunks:
        return ChatResponse(answer=NO_ANSWER[language], sources=[], language=language)

    try:
        answer = ask_llm(
            chat_system_prompt(language),
            build_chat_prompt(req.message, chunks),
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM error: {e}")

    return ChatResponse(answer=answer, sources=unique_sources(chunks), language=language)


@app.post("/api/checklist", response_model=ChecklistResponse)
def checklist(req: ChecklistRequest):
    chunks = search(req.situation, k=8)
    if not chunks:
        return ChecklistResponse(items=[])

    try:
        raw = ask_llm(CHECKLIST_SYSTEM, build_checklist_prompt(req.situation, chunks))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM error: {e}")

    items = parse_checklist(raw)

    # Fallback: if the LLM didn't return valid JSON, list the relevant forms directly
    if not items:
        items = [
            ChecklistItem(task=f"Review: {c['title']}", form=c["title"], url=c["url"])
            for c in chunks
        ]

    return ChecklistResponse(items=items)