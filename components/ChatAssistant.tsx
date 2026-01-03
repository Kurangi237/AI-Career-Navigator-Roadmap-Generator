import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../services/geminiService';
import { ChatMessage } from '../types';

interface Props {
  onBack: () => void;
}

const ChatAssistant: React.FC<Props> = ({ onBack }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', content: "Hello! I'm AI Career Coach. I can help you with coding doubts, career advice, and finding resources on GeeksforGeeks or LeetCode. Ask me anything!", timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Helper to remove any leftover Markdown that the model might output despite instructions
  const cleanMessage = (text: string) => {
    return text.replace(/[*#]/g, ''); // Removes * and # characters
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: ChatMessage = { role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // Construct history for API
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      const responseText = await sendChatMessage(history, userMsg.content);
      
      const modelMsg: ChatMessage = { role: 'model', content: responseText, timestamp: Date.now() };
      setMessages(prev => [...prev, modelMsg]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', content: "Sorry, I encountered an error. Please check your connection.", timestamp: Date.now() }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="bg-[#2f8d46] p-4 text-white font-bold">
            AI Career Coach
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-[#2f8d46] text-white rounded-br-none' 
                  : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
              }`}>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{cleanMessage(msg.content)}</p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
               <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-3 flex gap-2 items-center">
                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></div>
               </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        
        <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-200 flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about coding, algorithms, or career..."
            className="flex-1 bg-slate-50 text-slate-900 border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#2f8d46] focus:border-transparent outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="bg-[#2f8d46] text-white p-2 rounded-lg hover:bg-[#1e6b30] transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9-2-9-18-9 18 9-2zm0 0v-8"></path></svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatAssistant;
