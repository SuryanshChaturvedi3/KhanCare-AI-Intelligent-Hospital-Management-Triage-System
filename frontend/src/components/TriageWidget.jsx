import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Stethoscope, X, Send, AlertTriangle, Calendar } from "lucide-react";

const TRIAGE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/triage/chat`;

export default function TriageWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "Hello! I'm MediStep AI 🩺 Please describe your symptoms and I'll help route you to the right specialist.",
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
      const res = await axios.post(TRIAGE_URL, {
        message: text,
        thread_id: threadId,
      });
      const { reply, department, is_emergency, thread_id } = res.data;
      if (thread_id) setThreadId(thread_id);
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: reply, department, is_emergency },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "MediStep AI is temporarily unavailable. Please contact the hospital reception.",
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
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="fixed bottom-24 right-6 z-50 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full p-3 shadow-lg transition-all"
        title="MediStep AI Triage"
      >
        <Stethoscope size={22} />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-40 right-6 z-50 w-80 rounded-xl shadow-2xl flex flex-col bg-white border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-emerald-600 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <Stethoscope size={16} />
              MediStep AI
            </div>
            <button onClick={() => setIsOpen(false)}>
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-72 bg-gray-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[85%]">
                  {msg.sender === "ai" && msg.is_emergency ? (
                    <div className="bg-red-600 text-white rounded-lg px-3 py-2 text-xs flex gap-2 items-start">
                      <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                      <span>{msg.text}</span>
                    </div>
                  ) : (
                    <div
                      className={`rounded-lg px-3 py-2 text-xs whitespace-pre-wrap ${
                        msg.sender === "user"
                          ? "bg-emerald-600 text-white"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {msg.text}
                    </div>
                  )}
                  {/* Book Appointment button */}
                  {msg.sender === "ai" && !msg.is_emergency && msg.department && (
                    <button
                      onClick={() => bookAppointment(msg.department)}
                      className="mt-1 flex items-center gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded-md"
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
                <div className="bg-gray-100 text-gray-500 rounded-lg px-3 py-2 text-xs italic">
                  MediStep is analyzing your symptoms...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-2 border-t border-gray-200 bg-white">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your symptoms..."
              disabled={isLoading}
              className="flex-1 text-xs border border-gray-300 rounded-lg px-2 py-1.5 outline-none focus:border-emerald-500 disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg p-1.5 disabled:opacity-50"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
