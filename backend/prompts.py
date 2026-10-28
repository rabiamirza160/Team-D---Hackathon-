NO_ANSWER = {
    "en": "I couldn't find information about that in the Manitoba government sources "
          "I have. Try rephrasing, or visit https://www.gov.mb.ca for more help.",
    "fr": "Je n'ai pas trouvé d'information à ce sujet dans les sources du gouvernement "
          "du Manitoba dont je dispose. Essayez de reformuler, ou consultez "
          "https://www.gov.mb.ca pour plus d'aide.",
}


def chat_system_prompt(language: str) -> str:
    lang_name = "French" if language == "fr" else "English"
    return f"""You are a helpful assistant that explains Manitoba government forms and services in plain language.

Rules:
- Answer ONLY using the numbered sources provided. Do not use outside knowledge.
- If the sources don't contain the answer, say so clearly and don't guess.
- Use simple, friendly language a first-time applicant would understand.
- Refer to sources by number, like [1] or [2].
- Keep answers short: a few sentences, or a short list of steps.
- Respond in {lang_name}."""


def format_sources(chunks: list[dict]) -> str:
    return "\n\n".join(
        f"[{i}] {c['title']} ({c['url']})\n{c['text']}"
        for i, c in enumerate(chunks, start=1)
    )


def build_chat_prompt(question: str, chunks: list[dict]) -> str:
    return f"Sources:\n{format_sources(chunks)}\n\nQuestion: {question}"


CHECKLIST_SYSTEM = """You help people figure out which Manitoba government forms and documents they need for their situation.

Rules:
- Use ONLY the numbered sources provided.
- Return ONLY a JSON array, with no explanation and no markdown.
- Each item must look like: {"task": "...", "form": "...", "url": "..."}
- "url" must be copied exactly from one of the sources.
- Order items by what the person should do first.
- Only include items relevant to their situation."""


def build_checklist_prompt(situation: str, chunks: list[dict]) -> str:
    return f"Sources:\n{format_sources(chunks)}\n\nSituation: {situation}"
    