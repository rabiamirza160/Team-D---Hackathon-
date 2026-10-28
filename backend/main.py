from typing import Literal

from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Form Helper API")


# ---------- Contract models (must match README) ----------

class Source(BaseModel):
    title: str
    url: str


class ChatRequest(BaseModel):
    message: str
    language: Literal["en", "fr"] = "en"


class ChatResponse(BaseModel):
    answer: str
    sources: list[Source]


class ChecklistRequest(BaseModel):
    situation: str


class ChecklistItem(BaseModel):
    task: str
    form: str
    url: str


class ChecklistResponse(BaseModel):
    items: list[ChecklistItem]


# ---------- Endpoints (stubbed for now) ----------

@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    # TODO: retrieve chunks with search(req.message), then call the LLM
    return ChatResponse(
        answer=f"(stub) You asked: {req.message}",
        sources=[Source(title="Manitoba Government", url="https://www.gov.mb.ca")],
    )


@app.post("/api/checklist", response_model=ChecklistResponse)
def checklist(req: ChecklistRequest):
    # TODO: retrieve relevant forms, ask the LLM to build the checklist
    return ChecklistResponse(
        items=[
            ChecklistItem(
                task="Register for Manitoba Health coverage",
                form="Manitoba Health Registration Form",
                url="https://www.gov.mb.ca/health/mhsip/",
            )
        ]
    )