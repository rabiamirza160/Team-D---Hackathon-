import json
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()  # loads .env from the repo root before anything reads env vars

from typing import Literal

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from language import detect_language
from llm import ask_llm
from prompts import (
    NO_ANSWER,
    NO_ANSWER_SIGNAL,
    TRANSLATE_SYSTEM,
    build_chat_prompt,
    build_checklist_prompt,
    chat_system_prompt,
    checklist_system_prompt,
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
    language: Literal["en", "fr"] = "en"  # UI toggle; used as fallback only


class ChecklistItem(BaseModel):
    task: str
    form: str
    url: str


class ChecklistResponse(BaseModel):
    items: list[ChecklistItem]


class DetectRequest(BaseModel):
    text: str
    fallback: Literal["en", "fr"] = "en"


class DetectResponse(BaseModel):
    language: Literal["en", "fr"]


# ---------- Helpers ----------

@lru_cache(maxsize=256)
def search_query_for(message: str, language: str) -> str:
    """
    Our data is in English, so French questions are translated to English
    for searching only. The answer is still written in French.
    Cached so asking the same question twice doesn't translate twice.
    """
    if language != "fr":
        return message
    try:
        translated = ask_llm(TRANSLATE_SYSTEM, message).strip()
    except Exception as e:
        print(f"[search] translation failed, searching original text: {e}")
        return message
    if not translated:
        return message
    translated = translated.splitlines()[0].strip().strip('"').strip("«»").strip()
    print(f"[search] FR -> EN: {message!r} -> {translated!r}")
    return translated or message


def unique_sources(chunks: list[dict]) -> list[Source]:
    """One source per URL, in the order they were retrieved."""
    seen = set()
    sources = []
    for c in chunks:
        if c["url"] not in seen:
            seen.add(c["url"])
            sources.append(Source(title=c["title"], url=c["url"]))
    return sources


def parse_checklist(raw: str, valid_urls: set[str]) -> list[ChecklistItem]:
    """
    Parse the LLM's JSON output and keep only items that link to a real source page.
    Small models sometimes invent plausible-looking URLs; those are dropped.
    Returns [] if the output isn't valid JSON or nothing survives.
    """
    text = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    try:
        data = json.loads(text)
        items = [ChecklistItem(**item) for item in data]
    except (json.JSONDecodeError, TypeError, ValueError):
        return []

    kept = []
    for item in items:
        if item.url not in valid_urls:
            print(f"[checklist] dropped item with made-up link: {item.url}")
            continue
        if item.form.strip().lower() in ("none", "n/a", "null", "-"):
            item.form = ""
        kept.append(item)
    return kept


# ---------- Endpoints ----------

@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/detect-language", response_model=DetectResponse)
def detect(req: DetectRequest):
    """Lets the UI switch languages instantly, before the answer comes back."""
    return DetectResponse(language=detect_language(req.text, fallback=req.fallback))


@app.post("/api/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    # Answer in the language of the question; the UI toggle is only a fallback
    language = detect_language(req.message, fallback=req.language)

    chunks = search(search_query_for(req.message, language), k=5)

    # Scope rule: if the data doesn't cover it, say so instead of guessing
    if not chunks:
        return ChatResponse(answer=NO_ANSWER[language], sources=[], language=language)

    try:
        answer = ask_llm(
            chat_system_prompt(language),
            build_chat_prompt(req.message, chunks),  # original question, so it answers in that language
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM error: {e}")

    # The model signals when the sources