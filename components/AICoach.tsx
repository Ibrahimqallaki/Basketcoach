
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Send, Bot, User, Loader2, Sparkles, AlertCircle, Trash2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export const AICoach: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: input,
        config: {
          systemInstruction: "You are an expert basketball coach assistant. You help with drills, tactics, player psychology, and practice planning. You are encouraging, concise, and professional. You prefer to answer in Swedish but can answer in English if asked. Keep answers actionable.",
        },
      });

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text || "Jag kunde inte generera ett svar just nu.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Ett fel uppstod. Kontrollera din anslutning eller API-nyckel.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
      setMessages([]);
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col pb-6">
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <h3 className="text-xl md:text-3xl font-black italic uppercase tracking-tighter flex items-center gap-2">
            <Bot className="text-blue-500" /> AI Assistent
          </h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Din virtuella assisterande coach</p>
        </div>
        <button 
            onClick={clearChat}
            className="p-2 rounded-xl text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
            title="Rensa chatt"
        >
            <Trash2 size={18} />
        </button>
      </div>

      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden flex flex-col shadow-2xl relative">
        {messages.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 opacity-50 pointer-events-none">
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
               <Sparkles size={40} className="text-blue-500" />
            </div>
            <h4 className="text-xl font-black text-white uppercase italic mb-2">Hur kan jag hjälpa dig?</h4>
            <p className="text-sm text-slate-400 max-w-sm">
              Fråga mig om nya övningar, hur man bryter ett zonförsvar, eller tips för att peppa laget i halvtid.
            </p>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                <button className="p-3 rounded-xl border border-slate-700 text-[10px] font-bold uppercase text-slate-400" disabled>Ge mig en bra skottövning</button>
                <button className="p-3 rounded-xl border border-slate-700 text-[10px] font-bold uppercase text-slate-400" disabled>Förklara "Shell Drill"</button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-orange-600' : 'bg-blue-600'}`}>
                {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
              </div>
              <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-slate-800 text-slate-200 rounded-tr-none' : 'bg-blue-600/10 border border-blue-500/20 text-slate-200 rounded-tl-none'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
             <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                    <Loader2 size={16} className="text-white animate-spin" />
                </div>
                <div className="p-4 rounded-2xl bg-blue-600/10 border border-blue-500/20 rounded-tl-none flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-100"></span>
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200"></span>
                </div>
             </div>
          )}
          <div ref={scrollRef} />
        </div>

        <div className="p-4 bg-slate-950 border-t border-slate-800">
          <form onSubmit={handleSend} className="relative flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Skriv din fråga här..."
              className="w-full bg-slate-900 border border-slate-800 text-white placeholder:text-slate-600 rounded-xl py-4 pl-4 pr-12 focus:border-blue-500 outline-none transition-all"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="absolute right-2 p-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:bg-slate-800 text-white rounded-lg transition-all"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
