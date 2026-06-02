import React, { useState } from 'react';
import axios from 'axios';
import { MessageCircle, X, Send } from 'lucide-react';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Chat memory: Shuru mein ek welcome message
  const [messages, setMessages] = useState([
    { sender: "ai", text: "Hello! How can i assist you?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    // 1. User ka message screen par dikhao
    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput(""); // Input box khali karo
    setIsLoading(true); // "Typing..." shuru karo

    try {
      // 2. Python (FastAPI) ko message bhejo
      // Dhyan de: URL port 8000 hai, Node.js (5000) nahi!
      const response = await axios.post(`${import.meta.env.VITE_AI_URL || "http://127.0.0.1:8000"}/chat`, {
        query: userMessage.text 
      });

      // 3. AI ka jawab screen par dikhao
      const aiMessage = { sender: "ai", text: response.data.response };
      setMessages((prev) => [...prev, aiMessage]);

    } catch (error) {
      console.error("AI Error:", error);
      setMessages((prev) => [...prev, { sender: "ai", text: "Sorry, mera connection toot gaya hai. Server check karein." }]);
    } finally {
      setIsLoading(false); // "Typing..." band karo
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      
      {/* Chat Window (Jab Open ho) */}
      {isOpen && (
        <div className="bg-gray-900 border border-gray-700 w-80 h-96 rounded-2xl shadow-2xl flex flex-col mb-4 overflow-hidden transition-all">
          
          {/* Header */}
          <div className="bg-cyan-600 p-4 flex justify-between items-center text-white">
            <h3 className="font-bold flex items-center gap-2">
               KhanCare Assistant
            </h3>
            <button onClick={() => setIsOpen(false)} className="hover:text-gray-200">
              <X size={20} />
            </button>
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#0a0a0a]">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`p-3 rounded-2xl max-w-[80%] text-sm ${
                  msg.sender === "user" ? "bg-cyan-600 text-white rounded-br-none" : "bg-gray-800 text-gray-200 rounded-bl-none"
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 text-gray-400 p-3 rounded-2xl rounded-bl-none text-xs italic">
                  AI is typing...
                </div>
              </div>
            )}
          </div>

          {/* Input Box */}
          <div className="p-3 bg-gray-900 border-t border-gray-700 flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()} // Enter dabane par send ho jaye
              placeholder="Ask about symptoms..."
              className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-xl outline-none focus:border focus:border-cyan-500"
            />
            <button 
              onClick={sendMessage}
              className="bg-cyan-600 hover:bg-cyan-500 p-2 rounded-xl text-white transition-colors"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Floating Button (Jab Close ho) */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-cyan-600 hover:bg-cyan-500 p-4 rounded-full text-white shadow-lg shadow-cyan-500/30 transition-transform hover:scale-105"
        >
          <MessageCircle size={28} />
        </button>
      )}
    </div>
  );
};

export default ChatWidget;