
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Send, Bot, User, Loader2, Sparkles, AlertCircle, Trash2, Key } from 'lucide-react';

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

  // Vi kollar nyckeln vid rendering bara för placeholder-texten
  const hasKeySet = !!(process.env.API_KEY && process.env.API_KEY.length > 5);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleOpenKeySelection = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    // Hämta den absolut senaste nyckeln från miljön
    const apiKey = process.env.API_KEY;

    if (!apiKey || apiKey.length < 5) {
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: 'model',
        text: "⚠️ Ingen API-nyckel hittades. Klicka på nyckel-ikonen eller knappen nedan för att välja en.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
      handleOpenKeySelection();
      return;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: currentInput,
        config: {
          systemInstruction: "Du är en expertcoach i basket för ungdomar. Hjälp till med övningar, taktik och ledarskap. Svara uppmuntrande och konkret på svenska. Håll svaren korta och handlingskraftiga.",
        },
      });

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text || "Jag kunde inte generera ett svar just nu.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMsg]);
    } catch (error: any) {
      console.error("Gemini Error:", error);
      
      let errorText = "Kunde inte ansluta till AI. Kontrollera din anslutning eller nyckel.";
      
      if (error.message?.includes("503") || error.message?.includes("demand")) {
        errorText = "Googles AI-server är hårt belastad just nu. Vänta 30 sekunder och försök igen.";
      } else if (error.message?.includes("not found")) {
        errorText = "Din API-nyckel verkar inte vara giltig för den här modellen. Testa att välja om nyckeln.";
      }

      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: `⚠️ ${errorText}`,
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
          <h3 className="text-xl md:text-3xl font-black italic uppercase tracking-tighter flex items-center gap-2 text-white">
            <Bot className="text-blue-500" /> AI Assistent
          </h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
            Din digitala coach-mentor 
            {hasKeySet && <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={handleOpenKeySelection}
                className="p-2 rounded-xl text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 transition-all"
                title="Välj/Byt API-nyckel"
            >
                <Key size={18} />
            </button>
            <button 
                onClick={clearChat}
                className="p-2 rounded-xl text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                title="Rensa chatt"
            >
                <Trash2 size={18} />
            </button>
        </div>
      </div>

      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden flex flex-col shadow-2xl relative">
        {messages.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 opacity-80 z-10">
            <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mb-6 shadow-inner border border-slate-700 text-blue-500">
               <Sparkles size={40} />
            </div>
            <h4 className="text-xl font-black text-white uppercase italic mb-2">Redo för tips & taktik</h4>
            <p className="text-sm text-slate-400 max-w-sm mb-6">
              Fråga mig om nya övningar, hur man bryter ett zonförsvar, eller tips för matchen.
            </p>
            {!hasKeySet && (
              <button 
                onClick={handleOpenKeySelection}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg transition-all"
              >
                <Key size={14} /> Aktivera med API-nyckel
              </button>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-orange-600 shadow-lg shadow-orange-900/20' : 'bg-blue-600 shadow-lg shadow-blue-900/20'}`}>
                {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
              </div>
              <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-xl ${msg.role === 'user' ? 'bg-slate-800 text-slate-200 rounded-tr-none border border-slate-700' : 'bg-blue-600/10 border border-blue-500/20 text-slate-200 rounded-tl-none'}`}>
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
              autoFocus
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="absolute right-2 p-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:bg-slate-800 text-white rounded-lg transition-all"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </form>
          {!hasKeySet && (
              <div onClick={handleOpenKeySelection} className="mt-3 cursor-pointer p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[9px] font-black text-rose-500 uppercase tracking-widest text-center flex items-center justify-center gap-2 hover:bg-rose-500/20 transition-all">
                  <AlertCircle size={10} /> Ingen API-nyckel aktiv. Klicka här för att välja nyckel.
              </div>
          )}
        </div>
      </div>
    </div>
  );
};
