import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getAuthHeaders } from '../lib/api';
import { MessageSquare, X, Send, User, Bot, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const Chatbot: React.FC = () => {
  const { session } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hi! I am the ResumeZ AI Career Consultant. How can I assist you with your resume, portfolio, or interview preparation today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: getAuthHeaders(session?.access_token),
        body: JSON.stringify({
          history: messages,
          message: userMsg,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to get a response');
      }

      setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
    } catch (err: any) {
      console.error(err);
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again later.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#C6A75E] text-[#080711] shadow-2xl shadow-[#C6A75E]/30 transition-transform hover:scale-105 hover:bg-[#E1C77A] cursor-pointer"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[520px] w-[360px] flex-col overflow-hidden rounded-3xl border border-[#292344] bg-[#151329] shadow-2xl text-[#F5F1E8] sm:w-[400px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#292344] bg-[#1D1938] p-4 text-[#F5F1E8]">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#C6A75E]/15 border border-[#C6A75E]/30 text-[#C6A75E]">
                <Bot className="h-4 w-4" />
              </div>
              <h3 className="font-semibold text-sm text-[#F5F1E8]">ResumeZ AI Consultant</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 text-[#706C7C] hover:bg-[#1B1833] hover:text-[#F5F1E8] transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#080711]">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                    msg.role === 'user'
                      ? 'bg-[#C6A75E]/20 text-[#E1C77A]'
                      : 'bg-[#312E63] text-[#E1C77A] border border-[#6366A8]/40'
                  }`}
                >
                  {msg.role === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                </div>
                <div
                  className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'btn-gold-primary rounded-tr-sm text-[#080711] font-medium'
                      : 'bg-[#151329] border border-[#292344] text-[#F5F1E8] shadow-sm rounded-tl-sm'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="markdown-body prose prose-xs prose-invert max-w-none text-[#F5F1E8]">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#312E63] text-[#E1C77A] border border-[#6366A8]/40">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="max-w-[78%] rounded-2xl bg-[#151329] border border-[#292344] px-4 py-2.5 shadow-sm rounded-tl-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-[#C6A75E]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-[#292344] bg-[#151329] p-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your career, resume, or code..."
                className="flex-1 rounded-xl border border-[#292344] bg-[#0E0C1B] px-3.5 py-2 text-xs text-[#F5F1E8] placeholder-[#706C7C] focus:border-[#C6A75E] focus:outline-none"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl btn-gold-primary transition disabled:opacity-50 cursor-pointer"
              >
                <Send className="h-4 w-4 text-[#080711]" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
