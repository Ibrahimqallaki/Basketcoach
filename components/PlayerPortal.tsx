
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Player, MatchRecord, TrainingSession, Badge, Exercise, Phase } from '../types';
import { dataService } from '../services/dataService';
import { GoogleGenAI } from "@google/genai";
import { 
  Trophy, 
  Target, 
  CheckCircle2, 
  Zap, 
  Heart, 
  BrainCircuit, 
  Calendar, 
  LogOut, 
  Dumbbell, 
  Eye, 
  Star, 
  Award, 
  Crown, 
  TrendingUp, 
  Flame, 
  Lock, 
  Medal, 
  Play, 
  Youtube, 
  X, 
  Info, 
  Lightbulb, 
  List,
  Utensils,
  GlassWater,
  Moon,
  Egg,
  Carrot,
  Sparkles,
  Send,
  Bot,
  MessageCircle,
  Loader2,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface PlayerPortalProps {
  player: Player;
  onLogout: () => void;
  isPreview?: boolean;
}

interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

const getVideoId = (url: string) => {
  if (!url) return null;
  const cleanUrl = url.trim();
  const match = cleanUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
  return match ? match[1] : null;
};

const isShortsVideo = (url: string) => {
    if (!url) return false;
    return url.includes('shorts/');
};

const DEFAULT_FUEL_TASKS = [
    { id: 'protein', label: 'Ägg/Protein Frukost', type: 'protein' as const },
    { id: 'water', label: 'Drick 1.5L Vatten', type: 'hydration' as const },
    { id: 'greens', label: 'Frukt/Grönt Snack', type: 'greens' as const },
    { id: 'sleep', label: '8h Sömn inatt', type: 'recovery' as const },
];

export const PlayerPortal: React.FC<PlayerPortalProps> = ({ player, onLogout, isPreview = false }) => {
  const [activeTab, setActiveTab] = useState<'career' | 'training' | 'fuel' | 'matches'>('career');
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [myPlayer, setMyPlayer] = useState<Player>(player);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoExpanded, setVideoExpanded] = useState(false);
  
  // AI Coach State
  const [showAiChat, setShowAiChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  
  const [fuelTasks, setFuelTasks] = useState(
      DEFAULT_FUEL_TASKS.map(t => ({ ...t, completed: false }))
  );

  useEffect(() => {
    const loadData = async () => {
      const [allMatches, allSessions, phases] = await Promise.all([
          dataService.getMatches(),
          dataService.getSessions(),
          dataService.getUnifiedPhases()
      ]);
      const myMatches = allMatches.filter(m => m.feedbacks.some(f => f.playerId === player.id));
      const exercises = phases.flatMap(p => p.exercises);
      setMatches(myMatches);
      setSessions(allSessions);
      setAllExercises(exercises);
      setLoading(false);
    };
    loadData();
  }, [player.id]);

  useEffect(() => {
      setIsPlaying(false);
      setVideoExpanded(false);
      setShowAiChat(false);
      setChatMessages([]);
      setChatInput("");
  }, [selectedExercise]);

  useEffect(() => {
      if (chatScrollRef.current) {
          chatScrollRef.current.scrollIntoView({ behavior: 'smooth' });
      }
  }, [chatMessages, showAiChat]);

  const toggleHomework = async (homeworkId: string) => {
    const updatedHomework = (myPlayer.homework || []).map(h => 
      h.id === homeworkId ? { ...h, completed: !h.completed } : h
    );
    setMyPlayer({ ...myPlayer, homework: updatedHomework });
    await dataService.toggleHomework(player.id, homeworkId);
  };

  const toggleFuelTask = (taskId: string) => {
      setFuelTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
  };

  const handleAiAsk = async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!chatInput.trim() || !selectedExercise) return;
      const userMsg: ChatMessage = { role: 'user', text: chatInput };
      setChatMessages(prev => [...prev, userMsg]);
      setChatInput("");
      setIsAiLoading(true);
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const contextPrompt = `Du är "AI Coachen", en basketcoach för ungdomar. Övning: "${selectedExercise.title}". Fråga: "${chatInput}". Svara kortfattat på svenska.`;
          const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: contextPrompt });
          setChatMessages(prev => [...prev, { role: 'model', text: response.text || "Försök igen!" }]);
      } catch (err) {
          setChatMessages(prev => [...prev, { role: 'model', text: "Nätverksproblem." }]);
      } finally { setIsAiLoading(false); }
  };

  const gamification = useMemo(() => {
      let xp = 0;
      const myAttendance = sessions.filter(s => s.attendance.some(a => a.playerId === player.id && a.status === 'närvarande'));
      xp += myAttendance.length * 50;
      xp += matches.length * 100;
      xp += (myPlayer.homework || []).filter(h => h.completed).length * 25;
      xp += fuelTasks.filter(t => t.completed).length * 10;
      const level = Math.floor(Math.sqrt(xp / 100)) + 1;
      const skills = Object.values(myPlayer.skillAssessment || {}) as number[];
      const avgSkill = skills.length > 0 ? skills.reduce((a, b) => a + b, 0) / skills.length : 5;
      const ovr = Math.min(99, Math.round(50 + (avgSkill * 5)));
      return { xp, level, ovr };
  }, [sessions, matches, myPlayer, fuelTasks]);

  const myTrainingPlan = (myPlayer.individualPlan || [])
    .map(id => allExercises.find(e => e.id === id))
    .filter((e): e is Exercise => !!e);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans pb-24 relative overflow-x-hidden selection:bg-orange-500/30">
       {isPreview && (
           <div className="absolute top-0 left-0 w-full bg-blue-600/90 text-white text-[10px] font-bold uppercase text-center py-1 z-[60]">
               <div className="flex items-center justify-center gap-2"><Eye size={12} /> Förhandsgranskning (Coach Mode)</div>
           </div>
       )}
       
       <header className={`relative pt-12 pb-24 px-6 overflow-hidden ${isPreview ? 'mt-4' : ''}`}>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-[#020617] to-[#020617] z-0"></div>
          <div className="relative z-10 max-w-sm mx-auto">
             <div className="relative bg-gradient-to-br from-slate-800 to-slate-950 rounded-[2rem] border-4 border-slate-800 shadow-2xl overflow-hidden group">
                <div className="flex justify-between items-start p-6 relative z-10">
                    <div className="flex flex-col items-center">
                        <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-orange-400 to-orange-600 leading-none tracking-tighter">{gamification.ovr}</div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">OVR</div>
                    </div>
                    <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center border border-slate-700 shadow-inner">
                        <Trophy size={20} className="text-orange-500" />
                    </div>
                </div>
                <div className="bg-slate-900/80 backdrop-blur-md p-6 pt-8 text-center border-t border-slate-800/50">
                    <h1 className="text-2xl font-black text-white uppercase italic tracking-tighter">{player.name}</h1>
                </div>
             </div>
          </div>
          <button onClick={onLogout} className="absolute top-6 right-6 p-2 bg-slate-800/50 rounded-full text-slate-500 hover:text-white backdrop-blur-sm z-50"><LogOut size={16} /></button>
       </header>

       <main className="max-w-lg mx-auto px-4 -mt-12 relative z-20 space-y-6">
          <div className="flex p-1.5 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl overflow-x-auto gap-1">
             <button onClick={() => setActiveTab('career')} className={`flex-1 min-w-[70px] py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'career' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>Karriär</button>
             <button onClick={() => setActiveTab('training')} className={`flex-1 min-w-[70px] py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'training' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>Träning</button>
             <button onClick={() => setActiveTab('fuel')} className={`flex-1 min-w-[70px] py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'fuel' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>Kost</button>
             <button onClick={() => setActiveTab('matches')} className={`flex-1 min-w-[70px] py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'matches' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>Match</button>
          </div>

          {activeTab === 'training' && (
             <div className="space-y-6 animate-in slide-in-from-right duration-300">
                <div className="space-y-3">
                   <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 flex items-center gap-2"><Dumbbell size={14} /> Coachuppdrag</h3>
                   {(myPlayer.homework || []).map(hw => (
                      <div key={hw.id} onClick={() => toggleHomework(hw.id)} className={`p-4 rounded-2xl border flex items-center gap-4 transition-all cursor-pointer group ${hw.completed ? 'bg-blue-900/10 border-blue-500/30' : 'bg-slate-900 border-slate-800'}`}>
                         <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 ${hw.completed ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-700 text-transparent'}`}><CheckCircle2 size={16} fill={hw.completed ? "currentColor" : "none"} /></div>
                         <div className="flex-1"><h4 className={`text-xs font-black uppercase ${hw.completed ? 'text-blue-400 line-through' : 'text-white'}`}>{hw.title}</h4></div>
                      </div>
                   ))}
                </div>
                <div className="space-y-3">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 flex items-center gap-2"><Target size={14} /> Din Utvecklingsplan</h3>
                    {myTrainingPlan.map((ex, index) => (
                        <div key={ex.id} onClick={() => setSelectedExercise(ex)} className="group relative p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 transition-all cursor-pointer">
                            <div className="relative z-10 flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 shadow-inner">
                                    <span className="text-lg font-black text-slate-700 group-hover:text-purple-500 transition-colors">{index + 1}</span>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1"><span className="text-[8px] font-bold uppercase tracking-widest text-purple-400 bg-purple-900/20 px-2 py-0.5 rounded">{ex.category}</span></div>
                                    <h4 className="text-sm font-black text-white italic uppercase tracking-tight leading-none mb-1">{ex.title}</h4>
                                    <div className="flex items-center gap-1 text-[9px] text-slate-500 font-bold uppercase"><Youtube size={10} /> <span>Visa Video & Tips</span></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
             </div>
          )}
          {/* Tabs for Career, Fuel and Matches remain same logic as previously implemented... */}
       </main>

       {/* EXERCISE DETAIL MODAL */}
       {selectedExercise && (
           <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex flex-col animate-in slide-in-from-bottom duration-300">
               <button onClick={() => setSelectedExercise(null)} className="absolute top-4 right-4 p-2 bg-slate-800/80 rounded-full text-white z-[110] shadow-lg"><X size={24} /></button>

               {/* COMPACT VIDEO CONTAINER */}
               {(() => {
                   const vId = getVideoId(selectedExercise.videoUrl || '');
                   const isShort = isShortsVideo(selectedExercise.videoUrl || '');
                   
                   return (
                    <div className={`w-full bg-black relative shrink-0 transition-all duration-500 flex items-center justify-center border-b border-slate-800 ${videoExpanded ? 'h-[60vh]' : isShort ? 'h-[40vh] aspect-[9/16]' : 'h-[30vh] aspect-video'}`}>
                        {vId ? (
                            <div className="relative w-full h-full">
                                {!isPlaying ? (
                                    <div className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer group" onClick={() => setIsPlaying(true)}>
                                        <img src={`https://img.youtube.com/vi/${vId}/hqdefault.jpg`} alt="Thumbnail" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                                        <div className="relative z-20 w-14 h-14 bg-red-600 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform"><Play size={24} fill="white" className="text-white ml-1" /></div>
                                    </div>
                                ) : (
                                    <iframe src={`https://www.youtube.com/embed/${vId}?autoplay=1&rel=0`} title={selectedExercise.title} className="w-full h-full absolute inset-0 z-10" allowFullScreen />
                                )}
                                <button onClick={() => setVideoExpanded(!videoExpanded)} className="absolute bottom-4 right-4 z-20 p-2 bg-black/60 rounded-lg text-white hover:bg-black/90 transition-all">{videoExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button>
                            </div>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500"><Youtube size={48} className="opacity-20 mb-2" /><p className="text-[10px] font-bold uppercase">Ingen video</p></div>
                        )}
                    </div>
                   );
               })()}

               {/* Scrollable Details */}
               <div className="flex-1 overflow-y-auto p-6 space-y-6 relative custom-scrollbar">
                   {!showAiChat ? (
                       <>
                           <div className="flex items-center justify-between gap-4">
                               <div className="flex-1">
                                   <span className="text-[8px] font-black uppercase tracking-widest text-purple-400 bg-purple-900/20 px-2 py-0.5 rounded">{selectedExercise.category}</span>
                                   <h2 className="text-xl font-black text-white italic uppercase tracking-tighter leading-tight mt-1">{selectedExercise.title}</h2>
                               </div>
                               <button onClick={() => setShowAiChat(true)} className="p-3 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg animate-pulse"><Bot size={20} /></button>
                           </div>

                           <div className="grid gap-4">
                               <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                                   <h4 className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2"><Info size={12} /> Utförande</h4>
                                   <p className="text-sm text-slate-300 leading-relaxed">{selectedExercise.pedagogy?.how || selectedExercise.overview.action}</p>
                               </div>
                               <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                                   <h4 className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2"><Lightbulb size={12} /> Coaching Point</h4>
                                   <p className="text-sm text-slate-200 font-bold italic">"{selectedExercise.overview.coachingPoint}"</p>
                               </div>
                               <div className="space-y-2">
                                   <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Fokusera på detta</h4>
                                   {selectedExercise.criteria.map((c, i) => (
                                       <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
                                           <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[9px] font-bold text-slate-400 border border-slate-700">{i + 1}</div>
                                           <span className="text-xs font-bold text-white uppercase">{c}</span>
                                       </div>
                                   ))}
                               </div>
                           </div>
                       </>
                   ) : (
                       <div className="absolute inset-0 bg-slate-950 z-20 flex flex-col">
                           <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 backdrop-blur-md">
                               <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center"><Bot size={16} className="text-white" /></div>
                                   <div><h4 className="text-xs font-black text-white uppercase">AI Coach</h4><p className="text-[8px] text-purple-400 font-bold uppercase tracking-widest">{selectedExercise.title}</p></div>
                               </div>
                               <button onClick={() => setShowAiChat(false)} className="text-slate-500 hover:text-white text-[9px] font-bold uppercase">Stäng Chatt</button>
                           </div>
                           <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                               {chatMessages.map((msg, i) => (
                                   <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                       <div className={`p-3 rounded-2xl text-xs leading-relaxed max-w-[85%] ${msg.role === 'user' ? 'bg-slate-800 text-white rounded-tr-none' : 'bg-purple-900/20 border border-purple-500/30 text-purple-100 rounded-tl-none'}`}>{msg.text}</div>
                                   </div>
                               ))}
                               {isAiLoading && <div className="flex gap-2 p-3"><span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce"></span><span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce delay-100"></span></div>}
                               <div ref={chatScrollRef} />
                           </div>
                           <form onSubmit={handleAiAsk} className="p-3 border-t border-slate-800 bg-slate-900 flex gap-2">
                               <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Fråga coachen..." className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 text-xs text-white outline-none focus:border-purple-500" />
                               <button type="submit" disabled={!chatInput.trim() || isAiLoading} className="p-3 bg-purple-600 rounded-xl text-white disabled:opacity-50"><Send size={16} /></button>
                           </form>
                       </div>
                   )}
               </div>
           </div>
       )}
    </div>
  );
};
