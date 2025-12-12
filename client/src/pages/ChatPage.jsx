import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { sendMessage } from "../api/chat";
import ReactMarkdown from "react-markdown";
import "./ChatPage.css";

export const ChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const messageMutation = useMutation({
    mutationFn: (message) => sendMessage(message, sessionId),
    onMutate: (message) => {
      setMessages((prev) => [...prev, { role: "user", content: message }]);
      setInputValue("");
    },
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message },
      ]);
      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId);
      }
    },
    onError: (error) => {
      setMessages((prev) => [
        ...prev,
        { role: "error", content: `Error: ${error.message}` },
      ]);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const message = inputValue.trim();
    if (!message || messageMutation.isPending) return;
    messageMutation.mutate(message);
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1>RAG Chatbot</h1>
      </div>

      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            <strong>{msg.role === "user" ? "You:" : "AI:"}</strong>
            <div className="message-content">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        {messageMutation.isPending && (
          <div className="message assistant">
            <strong>AI:</strong>
            <p>Thinking...</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <form onSubmit={handleSubmit} className="chat-input-form">
          <input
            type="text"
            className="chat-input"
            placeholder="Type your message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={messageMutation.isPending}
          />
          <button
            type="submit"
            className="send-button"
            disabled={!inputValue.trim() || messageMutation.isPending}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};
