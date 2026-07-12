import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Stethoscope, X, Send, AlertTriangle, Calendar } from "lucide-react";

const API_URL = import.meta.env.VITE_AI_URL || "http://127.0.0.1:8000";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "Hello! I'm KhanCare AI 🩺\n\nI can help you with:\n• Medicine prices (Jan Aushadhi)\n• Symptom analysis & department routing\n\nHow can I assist you today?",
      department: null,
      is_emergency: false,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const bookAppointment = async (department) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login first to book an appointment.");
      return;
    }
    try {
      const today = new Date().toISOString().split("T")[0];
      await axios.post(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/appointments/appointment`,
        { department, date: today },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`✅ Appointment booked with ${department}!`);
    } catch (err) {
      alert(err?.response?.data?.message || "Booking failed. Please try again.");
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setMessages((prev) => [...prev, { sender: "user", text }]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await axios.post(`${API_URL}/chat`, {
        query: text,
        thread_id: threadId,
      });

      const { response, department, is_emergency, thread_id } = res.data;
      if (thread_id) setThreadId(thread_id);

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: response,
          department: department || null,
          is_emergency: is_emergency || false,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Sorry, I'm temporarily unavailable. Please try again or contact hospital reception.",
          is_emergency: false,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Stethoscope Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full p-4 shadow-lg shadow-emerald-500/30 transition-transform hover:scale-105"
          title="KhanCare AI Assistant"
        >
          <Stethoscope size={28} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-80 h-[28rem] rounded-2xl shadow-2xl flex flex-col bg-gray-900 border border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="bg-emerald-600 px-4 py-3 flex items-center justify-between text-white">
            <div className="flex items-center gap-2 font-bold text-sm">
              <Stethoscope size={18} />
              KhanCare AI
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:text-gray-200">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#0a0a0a]">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[85%]">
                  {msg.sender === "ai" && msg.is_emergency ? (
                    <div className="bg-red-600 text-white rounded-2xl rounded-bl-none px-3 py-2 text-sm flex gap-2 items-start">
                      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                      <span>{msg.text}</span>
                    </div>
                  ) : (
                    <div
                      className={`rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                        msg.sender === "user"
                          ? "bg-emerald-600 text-white rounded-br-none"
                          : "bg-gray-800 text-gray-200 rounded-bl-none"
                      }`}
                    >
                      {msg.text}
                    </div>
                  )}
                  {/* Book Appointment button */}
                  {msg.sender === "ai" && !msg.is_emergency && msg.department && (
                    <button
                      onClick={() => bookAppointment(msg.department)}
                      className="mt-2 flex items-center gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Calendar size={12} />
                      Book: {msg.department}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 text-gray-400 rounded-2xl rounded-bl-none px-3 py-2 text-sm italic">
                  AI is thinking...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-3 border-t border-gray-700 bg-gray-900">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about medicines or symptoms..."
              disabled={isLoading}
              className="flex-1 bg-gray-800 text-white text-sm px-4 py-2 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl p-2 transition-colors disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
