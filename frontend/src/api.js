// All backend calls live here. Matches the API contract in the README.

export async function sendChat(message, language = "en", context = "") {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      language,
      ...(context ? { context } : {}),
    }),
  });
  if (!res.ok) throw new Error(`Chat request failed: ${res.status}`);
  return res.json(); // { answer, sources: [{ title, url }] }
}

export async function getChecklist(situation, language = "en") {
  const res = await fetch("/api/checklist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ situation, language }),
  });
  if (!res.ok) throw new Error(`Checklist request failed: ${res.status}`);
  return res.json(); // { items: [{ task, form, url }] }
}

export async function detectLanguage(text, fallback = "en") {
  const res = await fetch("/api/detect-language", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, fallback }),
  });
  if (!res.ok) throw new Error(`Detect-language request failed: ${res.status}`);
  return res.json(); // { language: "en" | "fr" }
}