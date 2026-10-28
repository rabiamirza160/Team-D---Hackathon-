import os

import httpx


def ask_llm(system_prompt: str, user_prompt: str) -> str:
    """
    The ONLY place that talks to the LLM.
    LLM_PROVIDER in .env picks the implementation:
      - "stub": placeholder answers, no LLM needed
      - "openai_compatible": Ollama locally, or any OpenAI-compatible API
    """
    provider = os.getenv("LLM_PROVIDER", "stub")

    if provider == "stub":
        return _stub(user_prompt)
    if provider == "openai_compatible":
        return _openai_compatible(system_prompt, user_prompt)

    raise NotImplementedError(f"Unknown LLM_PROVIDER '{provider}'")


def _stub(user_prompt: str) -> str:
    return (
        "(placeholder answer) The real LLM isn't connected yet. "
        "Once it is, this answer will be written from the sources listed below."
    )


def _openai_compatible(system_prompt: str, user_prompt: str) -> str:
    base_url = (os.getenv("LLM_BASE_URL") or "http://localhost:11434/v1").rstrip("/")
    model = os.getenv("LLM_MODEL") or "llama3.2:3b"
    api_key = os.getenv("LLM_API_KEY") or ""

    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    response = httpx.post(
        f"{base_url}/chat/completions",
        headers=headers,
        json={
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.2,  # low = sticks closer to the sources
        },
        timeout=120,  # local models on a laptop can be slow
    )
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"].strip()