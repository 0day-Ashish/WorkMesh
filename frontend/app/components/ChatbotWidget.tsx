"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, X, Bot, Sparkles } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I am your WorkMesh AI Assistant. Ask me anything about your attendance punches, leave balances, or payroll slips!"
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue("");

    // Append user message
    const updatedMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages })
      });

      const data = await response.json();
      if (data.message) {
        setMessages(prev => [...prev, { role: "assistant" as const, content: data.message }]);
      } else if (data.error) {
        setMessages(prev => [...prev, { role: "assistant" as const, content: `Error: ${data.error}` }]);
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { role: "assistant" as const, content: "Failed to connect to assistant service." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 no-print font-sans">
      {/* Chat Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-12 h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-full border border-black shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer group relative"
        >
          <MessageSquare className="w-5 h-5 group-hover:rotate-6 transition-transform" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-80 sm:w-96 bg-white border border-black rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 transform scale-100 origin-bottom-right">
          {/* Header */}
          <div className="bg-slate-900 text-white px-4 py-3.5 border-b border-black flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div>
                <p className="text-xs font-black uppercase tracking-wider leading-none">WorkMesh Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Message History */}
          <div
            ref={scrollRef}
            data-lenis-prevent
            className="flex-1 p-4 max-h-[350px] min-h-[250px] overflow-y-auto bg-slate-50 space-y-3"
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-2.5 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`p-3 rounded-xl text-xs leading-relaxed border ${msg.role === "user"
                      ? "bg-slate-900 text-white border-black rounded-tr-none"
                      : "bg-white text-slate-800 border-slate-200/80 rounded-tl-none font-semibold"
                    }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Typing Loader */}
            {isLoading && (
              <div className="flex gap-2.5 max-w-[85%] mr-auto">
                <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                  <Bot className="w-3.5 h-3.5 animate-pulse" />
                </div>
                <div className="p-3 bg-white text-slate-400 border border-slate-200/80 rounded-xl rounded-tl-none text-xs flex items-center gap-1 font-bold italic">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-black bg-white flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask me a question..."
              className="flex-1 bg-slate-50 border border-black rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-600 transition-colors"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="p-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white border border-black rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
