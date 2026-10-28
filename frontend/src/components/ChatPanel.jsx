import { useEffect, useRef, useState } from "react";
import { sendChat } from "../api";
import ReadAloudButton from "./ReadAloudButton";

const WELCOME = {
  en: "👋 Welcome! Ask me anything about government forms, services, or required documents.",
  fr: "👋 Bienvenue! Posez-moi vos questions sur les formulaires, les services ou les documents requis du gouvernement."
};

// Default the toggle to the browser's language (French browsers start in French)
const initialLanguage = navigator.language?.toLowerCase().startsWith("fr") ? "fr" : "en";

function ChatPanel() {
  const [isOpen, setIsOpen] = useState(true);
  const [message, setMessage] = useState("");
  const [language, setLanguage] = useState(initialLanguage);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { type: "ai", lang: initialLanguage, text: WELCOME[initialLanguage] }
  ]);

  const messagesEndRef = useRef(null);

  // Scroll to the newest message whenever the list changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    const text = message.trim();
    if (!text || loading) return;

    const toggleLang = language; // used as a fallback if the backend can't tell

    setMessages((prev) => [...prev, { type: "user", text }]);
    setMessage("");
    setLoading(true);

    try {
      const data = await sendChat(text, toggleLang);
      setMessages((prev) => [
        ...prev,
        {
          type: "ai",
          lang: data.language || toggleLang, // the language the answer is actually in
          text: data.answer,
          sources: data.sources
        }
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          type: "ai",
          lang: toggleLang,
          text:
            toggleLang === "fr"
              ? "Désolé, je n'arrive pas à joindre le serveur. Veuillez réessayer."
              : "Sorry, I couldn't reach the server. Please try again."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  if (!isOpen) {
    return (
      <button
        className="open-chat-btn"
        onClick={() => setIsOpen(true)}
      >
        💬 Ask GovernmentGuide AI
      </button>
    );
  }

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div>
          <h2>GovGuide AI</h2>
          <p>Government Form Helper & Service Navigator</p>
        </div>

        <div className="header-actions">
          <button
            className="lang-toggle"
            onClick={() => setLanguage(language === "en" ? "fr" : "en")}
            title="Switch language / Changer de langue"
          >
            {language === "en" ? "FR" : "EN"}
          </button>

          <button
            className="collapse-btn"
            onClick={() => setIsOpen(false)}
          >
            ✕
          </button>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={
              msg.type === "user"
                ? "user-message"
                : "ai-message"
            }
          >
            <div className="message-text">{msg.text}</div>

            {msg.sources && msg.sources.length > 0 && (
              <div className="sources">
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

            {msg.type === "ai" && (
              <div className="message-actions">
                <ReadAloudButton text={msg.text} language={msg.lang} />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="ai-message thinking">
            {language === "fr" ? "Réflexion en cours…" : "Thinking…"}
          </div>
        )}

        <div className="suggestions">
          <button
            onClick={() =>
              setMessage(
                "How do I apply for a passport?"
              )
            }
          >
            Passport Application
          </button>

          <button
            onClick={() =>
              setMessage(
                "How do I apply for student aid?"
              )
            }
          >
            Student Aid
          </button>

          <button
            onClick={() =>
              setMessage(
                "What documents do I need for a health card?"
              )
            }
          >
            Health Card
          </button>

          <button
            onClick={() =>
              setMessage(
                "What documents do I need for Employment Insurance?"
              )
            }
          >
            Employment Insurance
          </button>
        </div>

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <input
          type="text"
          value={message}
          placeholder={language === "fr" ? "Posez une question..." : "Ask a question..."}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />

        <button onClick={sendMessage} disabled={loading}>
          {language === "fr" ? "Envoyer" : "Send"}
        </button>
      </div>
    </div>
  );
}

export default ChatPanel;