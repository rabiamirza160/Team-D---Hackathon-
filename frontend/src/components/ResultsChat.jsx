import { useEffect, useRef, useState } from "react";
import { sendChat } from "../api";

function welcomeMessage(language) {
  return {
    type: "ai",
    lang: language,
    text:
      language === "fr"
        ? "Posez une question sur votre situation. Je m’appuierai sur les pages officielles lorsque c’est possible."
        : "Ask a follow-up about your situation. I’ll use official sources whenever possible.",
  };
}

function latestAi(messages) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].type === "ai") return messages[i];
  }
  return null;
}

export default function ResultsChat({ language, situation, copy, onSpeakTargetChange }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState(() => [welcomeMessage(language)]);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, loading]);

  useEffect(() => {
    const ai = latestAi(messages);
    onSpeakTargetChange?.({
      text: ai?.text || "",
      language: ai?.lang || language,
    });
  }, [messages, language, onSpeakTargetChange]);

  const send = async () => {
    const text = message.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { type: "user", text }]);
    setMessage("");
    setLoading(true);

    const contextual = situation
      ? `${text}\n\n(My situation: ${situation})`
      : text;

    try {
      const data = await sendChat(contextual, language);
      setMessages((prev) => [
        ...prev,
        {
          type: "ai",
          lang: data.language || language,
          text: data.answer,
          sources: data.sources,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          type: "ai",
          lang: language,
          text:
            language === "fr"
              ? "Désolé, je n’arrive pas à joindre le serveur. Réessayez."
              : "Sorry, I couldn’t reach the server. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="results-chat">
      <div className="results-chat__messages" role="log" aria-live="polite">
        {messages.map((msg, index) => (
          <div
            key={`${msg.type}-${index}`}
            className={
              msg.type === "user"
                ? "results-chat__bubble results-chat__bubble--user"
                : "results-chat__bubble results-chat__bubble--ai"
            }
          >
            <div className="results-chat__text">{msg.text}</div>

            {msg.sources?.length > 0 && (
              <div className="results-chat__sources">
                <span>{msg.lang === "fr" ? "Sources :" : "Sources:"}</span>
                <ul>
                  {msg.sources.map((source) => (
                    <li key={source.url}>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {source.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="results-chat__bubble results-chat__bubble--ai is-thinking">
            {language === "fr" ? "Réflexion en cours…" : "Thinking…"}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form
        className="results-chat__composer"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={copy.chatPlaceholder}
          disabled={loading}
          aria-label={copy.chatPlaceholder}
        />
        <button type="submit" disabled={loading || !message.trim()}>
          {copy.chatSend}
        </button>
      </form>
    </div>
  );
}
