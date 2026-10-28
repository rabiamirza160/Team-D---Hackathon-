import { useEffect, useRef, useState } from "react";
import { sendChat } from "../api";

function ChatPanel() {
  const [isOpen, setIsOpen] = useState(true);
  const [message, setMessage] = useState("");
  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: "ai",
      text: "👋 Welcome! Ask me anything about government forms, services, or required documents."
    }
  ]);

  const messagesEndRef = useRef(null);

  // Scroll to the newest message whenever the list changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    const text = message.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { type: "user", text }]);
    setMessage("");
    setLoading(true);

    try {
      const data = await sendChat(text, language);
      setMessages((prev) => [
        ...prev,
        { type: "ai", text: data.answer, sources: data.sources }
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          type: "ai",
          text:
            language === "fr"
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
                <span>{language === "fr" ? "Sources :" : "Sources:"}</span>
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