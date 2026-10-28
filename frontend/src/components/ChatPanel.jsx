import { useState } from "react";

function ChatPanel() {
  const [isOpen, setIsOpen] = useState(true);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      type: "ai",
      text: "👋 Welcome! Ask me anything about government forms, services, or required documents."
    }
  ]);

  const sendMessage = () => {
    if (!message.trim()) return;

    setMessages([
      ...messages,
      {
        type: "user",
        text: message
      }
    ]);

    setMessage("");
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

        <button
          className="collapse-btn"
          onClick={() => setIsOpen(false)}
        >
          ✕
        </button>
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
            {msg.text}
          </div>
        ))}

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
      </div>

      <div className="chat-input">
        <input
          type="text"
          value={message}
          placeholder="Ask a question..."
          onChange={(e) => setMessage(e.target.value)}
        />

        <button onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
}

export default ChatPanel;