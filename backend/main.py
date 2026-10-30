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
    source_programs,
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
    # Short program/province from the guided profile (optional). Used to scope
    # search for vague follow-ups without rewriting the user's question.
    context: str = ""


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


# ---------- Caches ----------
# Answers are cached in memory after the first time a question is asked, so
# repeated questions (like warmed-up demo questions) return instantly.
# The cache resets whenever the server restarts.
CHAT_CACHE: dict[tuple[str, str], ChatResponse] = {}
CHECKLIST_CACHE: dict[tuple[str, str], ChecklistResponse] = {}


def cache_key(text: str, language: str, context: str = "") -> tuple[str, str, str]:
    return (
        " ".join(text.lower().split()),
        language,
        " ".join((context or "").lower().split()),
    )


# ---------- Helpers ----------

@lru_cache(maxsize=256)
def search_query_for(message: str, language: str) -> str:
    """
    Our data is in English, so French questions are translated to English
    for searching only. The answer is still written in French.
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


def answer_mismatches_source_province(answer: str, chunks: list[dict]) -> bool:
    """
    Small models sometimes open with the wrong province (e.g. Manitoba) even when
    every retrieved chunk is Saskatchewan Student Aid. Detect that clear mismatch.
    """
    programs = " ".join(source_programs(chunks)).lower()
    text = answer.lower()
    if not programs:
        return False

    sources_sk = "saskatchewan" in programs
    sources_mb_student = "manitoba student" in programs
    answer_sk = "saskatchewan" in text
    answer_mb_student = "manitoba student" in text

    if sources_sk and not sources_mb_student and answer_mb_student:
        return True
    if sources_mb_student and not sources_sk and answer_sk and "manitoba" not in text:
        return True
    return False


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
    context = (req.context or "").strip()

    key = cache_key(req.message, language, context)
    if key in CHAT_CACHE:
        print(f"[cache] chat hit: {req.message!r}")
        return CHAT_CACHE[key]

    # Bias retrieval with selected program/province; keep the user text for the LLM
    search_text = search_query_for(req.message, language)
    if context:
        search_text = f"{search_text} {context}".strip()
    chunks = search(search_text, k=5)

    # Scope rule: if the data doesn't cover it, say so instead of guessing
    if not chunks:
        response = ChatResponse(answer=NO_ANSWER[language], sources=[], language=language)
        CHAT_CACHE[key] = response
        return response

    try:
        answer = ask_llm(
            chat_system_prompt(language),
            build_chat_prompt(req.message, chunks, context=context),
        )
        # One retry if the model names the wrong province vs the retrieved sources
        if answer_mismatches_source_province(answer, chunks):
            programs = ", ".join(source_programs(chunks)) or "the programs in the sources"
            print(f"[chat] province mismatch, retrying for: {programs}")
            answer = ask_llm(
                chat_system_prompt(language),
                build_chat_prompt(req.message, chunks, context=context)
                + f"\n\nCorrection: Your previous draft named the wrong province. "
                f"Answer again using only: {programs}.",
            )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM error: {e}")  # errors are never cached

    # The model signals when the sources don't answer the question
    if NO_ANSWER_SIGNAL in answer:
        response = ChatResponse(answer=NO_ANSWER[language], sources=[], language=language)
    else:
        response = ChatResponse(answer=answer, sources=unique_sources(chunks), language=language)

    CHAT_CACHE[key] = response
    return response


@app.post("/api/checklist", response_model=ChecklistResponse)
def checklist(req: ChecklistRequest):
    language = detect_language(req.situation, fallback=req.language)

    key = cache_key(req.situation, language)
    if key in CHECKLIST_CACHE:
        print(f"[cache] checklist hit: {req.situation!r}")
        return CHECKLIST_CACHE[key]

    chunks = search(search_query_for(req.situation, language), k=8)
    if not chunks:
        return ChecklistResponse(items=[])

    valid_urls = {c["url"] for c in chunks}
    items: list[ChecklistItem] = []

    try:
        raw = ask_llm(
            checklist_system_prompt(language),
            build_checklist_prompt(req.situation, chunks),
        )
        items = parse_checklist(raw, valid_urls)
    except Exception as e:
        # Don't block forms when the LLM is slow/down — still return real pages
        print(f"[checklist] LLM failed, using retrieval fallback: {e}")

    # Fallback: if the LLM's output was invalid, empty, or unavailable,
    # list the real relevant pages directly
    if not items:
        items = [
            ChecklistItem(task=f"Review: {s.title}", form="", url=s.url)
            for s in unique_sources(chunks)
        ]

    response = ChecklistResponse(items=items)
    CHECKLIST_CACHE[key] = response
    return response