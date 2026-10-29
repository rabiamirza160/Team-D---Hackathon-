NO_ANSWER = {
    "en": "I couldn't find information about that in the government sources I have. "
          "I can currently help with Manitoba Student Aid, Manitoba Income Support, "
          "and Saskatchewan Student Aid. Try rephrasing, or visit https://www.gov.mb.ca for more help.",
    "fr": "Je n'ai pas trouvé d'information à ce sujet dans les sources gouvernementales dont je dispose. "
          "Je peux actuellement vous aider avec l'Aide aux étudiants du Manitoba, le Soutien du revenu "
          "du Manitoba et l'Aide aux étudiants de la Saskatchewan. Essayez de reformuler, ou consultez "
          "https://www.gov.mb.ca pour plus d'aide.",
}

# The model replies with exactly this when the sources don't answer the question.
# main.py swaps it for the NO_ANSWER message above and hides the sources.
NO_ANSWER_SIGNAL = "NO_ANSWER"


def chat_system_prompt(language: str) -> str:
    lang_name = "French" if language == "fr" else "English"
    return f"""You are a helpful assistant that explains government programs and forms in plain language.

Rules:
- Use ONLY facts that are explicitly written in the numbered sources. Never add documents, steps, amounts, dates, or eligibility rules that the sources do not state.
- If the sources do not contain the answer to the question (for example, they are about a different program or province), reply with exactly: {NO_ANSWER_SIGNAL}
- Say which program and province the information is for (for example, "For Manitoba Student Aid...").
- Use simple, friendly language a first-time applicant would understand.
- Refer to sources by number only, like [1] or [2]. Do not write URLs or markdown links.
- Write plain text. For steps, use a numbered list (1. 2. 3.). For other lists, start lines with "- ". No bold, no headings.
- Keep answers short: a few sentences, or a short list.
- Respond in {lang_name}."""


def format_sources(chunks: list[dict]) -> str:
    return "\n\n".join(
        f"[{i}] {c['title']}\n{c['text']}"
        for i, c in enumerate(chunks, start=1)
    )


def build_chat_prompt(question: str, chunks: list[dict]) -> str:
    return f"Sources:\n{format_sources(chunks)}\n\nQuestion: {question}"


CHECKLIST_SYSTEM = """You help people figure out which government forms and documents they need for their situation.

Rules:
- Use ONLY the numbered sources provided. Never invent forms or documents.
- Return ONLY a JSON array, with no explanation and no markdown.
- Each item must look like: {"task": "...", "form": "...", "url": "..."}
- "url" must be one of the source URLs listed.
- Order items by what the person should do first.
- Only include items relevant to their situation."""


def format_checklist_sources(chunks: list[dict]) -> str:
    return "\n\n".join(
        f"[{i}] {c['title']} ({c['url']})\n{c['text']}"
        for i, c in enumerate(chunks, start=1)
    )


def build_checklist_prompt(situation: str, chunks: list[dict]) -> str:
    return f"Sources:\n{format_checklist_sources(chunks)}\n\nSituation: {situation}"