
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Send, Bot, User, Loader2, Sparkles, AlertCircle, Trash2, Database, TrendingUp, Users, Trophy } from 'lucide-react';
import { dataService } from '../services/dataService';
import { Player, TrainingSession, MatchRecord } from '../types';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export const AICoach: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('basketcoach_ai_messages');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [loading, setLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Team context state
  const [teamData, setTeamData] = useState<{
    players: Player[];
    sessions: TrainingSession[];
    matches: MatchRecord[];
  } | null>(null);

  useEffect(() => {
    localStorage.setItem('basketcoach_ai_messages', JSON.stringify(messages));
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Load team data for context
  useEffect(() => {
    const loadContext = async () => {
      try {
        const [p, s, m] = await Promise.all([
          dataService.getPlayers(),
          dataService.getSessions(),
          dataService.getMatches()
        ]);
        setTeamData({ players: p, sessions: s, matches: m });
      } catch (err) {
        console.error("Failed to load team context for AI", err);
      }
    };
    loadContext();
  }, []);

  const generateContextString = () => {
    if (!teamData) return "Ingen lagdata tillgänglig för tillfället.";

    const { players, sessions, matches } = teamData;
    
    let context = `LAGKONTEXT:\n`;
    context += `- Antal spelare: ${players.length}\n`;
    context += `- Genomförda träningar: ${sessions.length}\n`;
    context += `- Spelade matcher: ${matches.length}\n\n`;

    // Beräkna närvaro
    if (sessions.length > 0) {
      const totalPossible = sessions.length * players.length;
      let totalAttended = 0;
      sessions.forEach(s => {
        totalAttended += s.attendance.filter(a => a.status === 'närvarande' || a.status === 'delvis').length;
      });
      const attendanceRate = ((totalAttended / totalPossible) * 100).toFixed(1);
      context += `STATISTIK:\n`;
      context += `- Genomsnittlig närvaro: ${attendanceRate}%\n`;
      
      // Hitta spelare med låg närvaro (under 50%)
      const lowAttendancePlayers = players.filter(p => {
        const attended = sessions.filter(s => s.attendance.find(a => a.playerId === p.id && (a.status === 'närvarande' || a.status === 'delvis'))).length;
        return (attended / sessions.length) < 0.5;
      });
      if (lowAttendancePlayers.length > 0) {
        context += `- Spelare med låg närvaro: ${lowAttendancePlayers.map(p => p.name).join(', ')}\n`;
      }
      context += `\n`;
    }

    // Matchanalys
    if (matches.length > 0) {
      context += `SENASTE MATCHER:\n`;
      matches.slice(0, 3).forEach(m => {
        context += `- vs ${m.opponent}: ${m.score}-${m.opponentScore} (${m.score > m.opponentScore ? 'Vinst' : 'Förlust'})\n`;
        if (m.teamSummary) context += `  Summering: ${m.teamSummary}\n`;
      });
      
      // Aggregera feedback
      const allFeedback = matches.flatMap(m => m.feedbacks);
      if (allFeedback.length > 0) {
        const avgEffort = (allFeedback.reduce((acc, f) => acc + f.effort, 0) / allFeedback.length).toFixed(1);
        const avgTeamwork = (allFeedback.reduce((acc, f) => acc + f.teamwork, 0) / allFeedback.length).toFixed(1);
        context += `- Genomsnittlig insats (1-5): ${avgEffort}\n`;
        context += `- Genomsnittligt lagarbete (1-5): ${avgTeamwork}\n`;
      }
      context += `\n`;
    }

    // Spelarutveckling
    const playersWithAssessments = players.filter(p => p.skillAssessment && Object.keys(p.skillAssessment).length > 0);
    if (playersWithAssessments.length > 0) {
      context += `SPELARFOKUS:\n`;
      // Hitta lägsta snitt-skills för laget
      const skillSums: Record<string, number> = {};
      const skillCounts: Record<string, number> = {};
      playersWithAssessments.forEach(p => {
        Object.entries(p.skillAssessment!).forEach(([skill, val]) => {
          skillSums[skill] = (skillSums[skill] || 0) + val;
          skillCounts[skill] = (skillCounts[skill] || 0) + 1;
        });
      });
      
      const avgSkills = Object.entries(skillSums).map(([skill, sum]) => ({
        skill,
        avg: sum / skillCounts[skill]
      })).sort((a, b) => a.avg - b.avg);
      
      if (avgSkills.length > 0) {
        context += `- Lagets svagaste områden: ${avgSkills.slice(0, 2).map(s => `${s.skill} (${s.avg.toFixed(1)})`).join(', ')}\n`;
        context += `- Lagets starkaste områden: ${avgSkills.slice(-2).reverse().map(s => `${s.skill} (${s.avg.toFixed(1)})`).join(', ')}\n`;
      }
    }

    return context;
  };

  const handleSend = async (e?: React.FormEvent, overrideInput?: string) => {
    e?.preventDefault();
    const messageText = overrideInput || input;
    if (!messageText.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setIsAnalyzing(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const contextString = generateContextString();
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: messageText,
        config: {
          systemInstruction: `You are an expert basketball coach assistant for a youth team. 
          You have access to the following team data to provide personalized advice:
          
          ${contextString}
          
          Guidelines:
          1. Use the provided data to make your answers specific. If the coach asks for a training plan, look at recent match results or training focus.
          2. Be encouraging, concise, and professional.
          3. Always answer in Swedish.
          4. Keep answers actionable and focused on player development and SBBF standards (Knäkontroll, Rörelseförståelse).
          5. If data is missing or sparse, give general expert advice but mention that more data would help.`,
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
      setIsAnalyzing(false);
    }
  };

  const clearChat = () => {
      setMessages([]);
  };

  const suggestedQuestions = [
    { text: "Analysera vårt senaste matchresultat", icon: Trophy },
    { text: "Föreslå nästa träningspass baserat på vår form", icon: TrendingUp },
    { text: "Hur kan vi förbättra närvaron i laget?", icon: Users },
    { text: "Ge mig en övning för knäkontroll", icon: Sparkles }
  ];

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col pb-6">
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <h3 className="text-xl md:text-3xl font-black italic uppercase tracking-tighter flex items-center gap-2 text-white">
            <Bot className="text-blue-500" /> AI Assistent <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full ml-2 normal-case font-bold tracking-normal">Kontext-medveten</span>
          </h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Din virtuella assisterande coach med koll på lagets data</p>
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
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 z-0">
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner border border-white/5">
               <Sparkles size={40} className="text-blue-500 animate-pulse" />
            </div>
            <h4 className="text-xl font-black text-white uppercase italic mb-2">Hur kan jag hjälpa laget idag?</h4>
            <p className="text-sm text-slate-400 max-w-sm mb-8">
              Jag har analyserat er lagstatistik och är redo att ge specifika råd för era kommande träningar och matcher.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {suggestedQuestions.map((q, i) => (
                  <button 
                    key={i}
                    onClick={() => handleSend(undefined, q.text)}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-[10px] font-black uppercase text-slate-400 hover:border-blue-500 hover:text-white hover:bg-slate-800 transition-all flex items-center gap-3 text-left group"
                  >
                    <div className="p-2 rounded-lg bg-slate-900 group-hover:bg-blue-600 transition-colors">
                      <q.icon size={14} className="text-blue-500 group-hover:text-white" />
                    </div>
                    {q.text}
                  </button>
                ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar relative z-10">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in`}>
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-orange-600' : 'bg-blue-600'}`}>
                {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
              </div>
              <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-xl ${msg.role === 'user' ? 'bg-slate-800 text-slate-200 rounded-tr-none border border-white/5' : 'bg-blue-600/10 border border-blue-500/20 text-slate-200 rounded-tl-none'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
             <div className="flex gap-4 animate-in">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shrink-0 shadow-lg">
                    <Loader2 size={16} className="text-white animate-spin" />
                </div>
                <div className="p-4 rounded-2xl bg-blue-600/10 border border-blue-500/20 rounded-tl-none flex flex-col gap-2 min-w-[150px]">
                    <div className="flex items-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">
                      <Database size={12} className="animate-pulse" /> Analyserar lagdata...
                    </div>
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-100"></span>
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200"></span>
                    </div>
                </div>
             </div>
          )}
          <div ref={scrollRef} />
        </div>

        <div className="p-4 bg-slate-950 border-t border-slate-800 relative z-20">
          <form onSubmit={handleSend} className="relative flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Fråga om lagets utveckling, övningar eller taktik..."
              className="w-full bg-slate-900 border border-slate-800 text-white placeholder:text-slate-600 rounded-xl py-4 pl-4 pr-12 focus:border-blue-500 outline-none transition-all shadow-inner"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="absolute right-2 p-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:bg-slate-800 text-white rounded-lg transition-all shadow-lg active:scale-95"
            >
              <Send size={18} />
            </button>
          </form>
          <div className="mt-2 flex items-center justify-center gap-4">
             <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${teamData ? 'bg-emerald-500' : 'bg-slate-600'}`}></div>
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Lagdata synkad</span>
             </div>
             <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Gemini 3 Flash</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
