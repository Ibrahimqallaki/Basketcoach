
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Player, MatchRecord, TrainingSession, Badge, Exercise } from '../types';
import { dataService } from '../services/dataService';
import { SKILL_COLORS } from './Roster';
import { 
  Trophy, Target, CheckCircle2, Zap, Heart, BrainCircuit, LogOut, Dumbbell, Eye, Star, Award, Lock, Play, Youtube, X, Info, Lightbulb, Egg, GlassWater, Moon, Carrot, Send, Bot, Loader2, Maximize2, Minimize2, ChevronRight, BookOpen
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

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

// Radar Chart Helper
const RadarChart = ({ skills, colors }: { skills: Record<string, number>, colors: Record<string, string> }) => {
    const entries = Object.entries(skills);
    const numPoints = entries.length;
    const radius = 80;
    const center = 100;

    const points = entries.map(([name, value], i) => {
        const angle = (Math.PI * 2 * i) / numPoints - Math.PI / 2;
        const r = (value / 10) * radius;
        return {
            x: center + r * Math.cos(angle),
            y: center + r * Math.sin(angle),
            label: name,
            value
        };
    });

    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

    return (
        <div className="relative w-full aspect-square max-w-[280px] mx-auto animate-in zoom-in duration-1000">
            <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
                {/* Background Circles */}
                {[0.2, 0.4, 0.6, 0.8, 1.0].map((scale, idx) => (
                    <circle 
                        key={idx} 
                        cx={center} cy={center} r={radius * scale} 
                        fill="none" stroke="white" strokeWidth="0.5" strokeOpacity="0.05" 
                    />
                ))}
                
                {/* Spikes */}
                {points.map((p, i) => {
                    const angle = (Math.PI * 2 * i) / numPoints - Math.PI / 2;
                    const endX = center + radius * Math.cos(angle);
                    const endY = center + radius * Math.sin(angle);
                    return <line key={i} x1={center} y1={center} x2={endX} y2={endY} stroke="white" strokeWidth="0.5" strokeOpacity="0.1" />;
                })}

                {/* Data Polygon */}
                <path 
                    d={pathData} 
                    fill="rgba(249, 115, 22, 0.15)" 
                    stroke="#f97316" 
                    strokeWidth="2.5" 
                    className="drop-shadow-[0_0_8px_rgba(249,115,22,0.5)] transition-all duration-1000 ease-out"
                />

                {/* Labels and Value Dots */}
                {points.map((p, i) => {
                    const angle = (Math.PI * 2 * i) / numPoints - Math.PI / 2;
                    const labelRadius = radius + 25;
                    const lx = center + labelRadius * Math.cos(angle);
                    const ly = center + labelRadius * Math.sin(angle);
                    const colorClass = colors[p.label]?.replace('bg-', '') || 'orange-500';

                    return (
                        <g key={i}>
                            <circle cx={p.x} cy={p.y} r="3" fill="#fff" className="drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]" />
                            <text 
                                x={lx} y={ly} 
                                textAnchor="middle" 
                                className="text-[7px] font-black uppercase tracking-tighter" 
                                fill="white" 
                                style={{ opacity: 0.6 }}
                            >
                                {p.label}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

export const PlayerPortal: React.FC<PlayerPortalProps> = ({ player, onLogout, isPreview = false }) => {
  const [activeTab, setActiveTab] = useState<'career' | 'training' | 'fuel' | 'matches'>('career');
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [myPlayer, setMyPlayer] = useState<Player>(player);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVideoExpanded, setIsVideoExpanded] = useState(false);
  const [showAiChat, setShowAiChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const [fuelTasks, setFuelTasks] = useState(
      [{ id: 'protein', label: 'Ägg/Protein Frukost', type: 'protein' as const, completed: false },
       { id: 'water', label: 'Drick 1.5L Vatten', type: 'hydration' as const, completed: false },
       { id: 'greens', label: 'Frukt/Grönt Snack', type: 'greens' as const, completed: false },
       { id: 'sleep', label: '8h Sömn inatt', type: 'recovery' as const, completed: false }]
  );

  useEffect(() => {
    const loadData = async () => {
      const [allMatches, allSessions, phases] = await Promise.all([
          dataService.getMatches(),
          dataService.getSessions(),
          dataService.getUnifiedPhases()
      ]);
      const myMatches = allMatches.filter(m => m.feedbacks.some(f => f.playerId === player.id));
      setMatches(myMatches);
      setSessions(allSessions);
      setAllExercises(phases.flatMap(p => p.exercises));
      setLoading(false);
    };
    loadData();
  }, [player.id]);

  const handleAiAsk = async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!chatInput.trim() || !selectedExercise) return;
      const userMsg: ChatMessage = { role: 'user', text: chatInput };
      setChatMessages(prev => [...prev, userMsg]);
      setChatInput("");
      setIsAiLoading(true);
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const response = await ai.models.generateContent({ 
              model: 'gemini-3-flash-preview', 
              contents: `Du är AI Coachen. Fråga om: "${selectedExercise.title}". "${chatInput}". Svara kort på svenska.` 
          });
          setChatMessages(prev => [...prev, { role: 'model', text: response.text || "Problem." }]);
      } catch (err) {
          setChatMessages(prev => [...prev, { role: 'model', text: "Nätverksfel." }]);
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
      const nextLevelXp = Math.pow(level, 2) * 100;
      const currentLevelBaseXp = Math.pow(level - 1, 2) * 100;
      const progressToNext = Math.min(100, Math.max(0, ((xp - currentLevelBaseXp) / (nextLevelXp - currentLevelBaseXp)) * 100));

      const skills = Object.values(myPlayer.skillAssessment || {}) as number[];
      const avgSkill = skills.length > 0 ? skills.reduce((a, b) => a + b, 0) / skills.length : 5;
      const ovr = Math.min(99, Math.round(50 + (avgSkill * 5)));

      const hasDoneAllHomework = myPlayer.homework && myPlayer.homework.length > 0 && myPlayer.homework.every(h => h.completed);

      const badges: Badge[] = [
          { id: 'sniper', label: 'Sniper', icon: 'crosshair', description: 'Skytte-betyg över 8', color: 'text-rose-500', unlocked: (myPlayer.skillAssessment?.['Skytte'] || 0) >= 8 },
          { id: 'professor', label: 'The Professor', icon: 'book', description: 'Gjort alla uppdrag', color: 'text-indigo-400', unlocked: !!hasDoneAllHomework },
          { id: 'gymrat', label: 'Gym Rat', icon: 'dumbbell', description: 'Hög närvaro', color: 'text-blue-500', unlocked: dataService.calculateAttendanceRate(sessions) > 80 },
          { id: 'mvp', label: 'Heart & Soul', icon: 'heart', description: 'Matchinsatser', color: 'text-orange-500', unlocked: matches.length > 0 }
      ];

      return { xp, level, progressToNext, badges, ovr };
  }, [sessions, matches, myPlayer, fuelTasks]);

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-orange-500" /></div>;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans pb-24 relative overflow-x-hidden">
       <header className="relative pt-12 pb-24 px-6 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-[#020617] to-[#020617]"></div>
          <div className="relative z-10 max-w-sm mx-auto">
             <div className="bg-gradient-to-br from-slate-800 to-slate-950 rounded-[3rem] border-4 border-slate-800 shadow-2xl overflow-hidden">
                <div className="flex justify-between items-start p-6 relative z-10">
                    <div className="flex flex-col items-center">
                        <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-orange-400 to-orange-600 leading-none tracking-tighter drop-shadow-[0_0_15px_rgba(249,115,22,0.3)]">{gamification.ovr}</div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">OVR Rating</div>
                    </div>
                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-700 shadow-inner"><Trophy size={20} className="text-orange-500" /></div>
                </div>

                <div className="relative h-44 flex items-end justify-center -mt-8">
                    <div className="w-36 h-36 bg-slate-950 rounded-full border-4 border-slate-800 flex items-center justify-center relative overflow-hidden shadow-2xl group">
                        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 to-transparent"></div>
                        <span className="text-5xl font-black text-slate-800 group-hover:text-slate-700 transition-colors">#{player.number}</span>
                    </div>
                    <div className="absolute bottom-0 right-1/2 translate-x-16 translate-y-2 bg-gradient-to-r from-orange-600 to-orange-400 px-4 py-1.5 rounded-full border-2 border-slate-900 shadow-xl z-20">
                        <span className="text-[11px] font-black text-white uppercase italic tracking-widest">Lvl {gamification.level}</span>
                    </div>
                </div>

                <div className="bg-slate-900/90 backdrop-blur-md p-6 pt-8 text-center border-t border-slate-800/50">
                    <h1 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none mb-4">{player.name}</h1>
                    <div className="relative h-2 bg-slate-950 rounded-full overflow-hidden shadow-inner">
                        <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-600 to-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.5)]" style={{ width: `${gamification.progressToNext}%` }}></div>
                    </div>
                    <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase mt-2 tracking-widest"><span>Nivå {gamification.level}</span><span>{Math.round(gamification.progressToNext)}% till nästa</span></div>
                </div>
             </div>
          </div>
          <button onClick={onLogout} className="absolute top-6 right-6 p-2.5 bg-slate-800/50 rounded-full text-slate-500 hover:text-white backdrop-blur-sm z-50"><LogOut size={16} /></button>
       </header>

       <main className="max-w-lg mx-auto px-4 -mt-12 relative z-20 space-y-6">
          <div className="flex p-1.5 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 shadow-2xl overflow-x-auto gap-1">
             {['career', 'training', 'fuel', 'matches'].map((tab) => (
                 <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 min-w-[70px] py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500'}`}>{tab === 'career' ? 'Profil' : tab === 'fuel' ? 'Kost' : tab === 'matches' ? 'Match' : 'Träning'}</button>
             ))}
          </div>

          {activeTab === 'career' && (
             <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
                <div className="p-8 rounded-[3rem] bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Star size={120} /></div>
                   <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-8"><Star size={14} className="text-yellow-500" /> Din Spelarprofil</h3>
                   <RadarChart skills={myPlayer.skillAssessment || {}} colors={SKILL_COLORS} />
                   <div className="mt-8 space-y-3">
                       {Object.entries(myPlayer.skillAssessment || {}).map(([skill, val]) => (
                           <div key={skill} className="flex items-center gap-4">
                               <span className="text-[9px] font-black uppercase text-slate-400 w-24 truncate">{skill}</span>
                               <div className="flex-1 h-1.5 bg-slate-950 rounded-full overflow-hidden">
                                   <div className={`h-full rounded-full ${SKILL_COLORS[skill] || 'bg-orange-500'}`} style={{ width: `${(val as number) * 10}%` }}></div>
                               </div>
                               <span className="text-[10px] font-black text-white w-4">{val}</span>
                           </div>
                       ))}
                   </div>
                </div>

                <div className="space-y-3">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 flex items-center gap-2"><Award size={14} /> Trofésamling</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {gamification.badges.map(badge => (
                            <div key={badge.id} className={`p-4 rounded-2xl border flex items-center gap-4 transition-all ${badge.unlocked ? 'bg-slate-900 border-slate-800 shadow-xl' : 'bg-slate-900/50 border-slate-800/50 opacity-60'}`}>
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${badge.unlocked ? 'bg-slate-950 shadow-inner' : 'bg-slate-900'}`}>
                                    {badge.unlocked ? (
                                        badge.id === 'professor' ? <BookOpen size={20} className={badge.color} /> : 
                                        badge.id === 'sniper' ? <Target size={20} className={badge.color} /> :
                                        badge.id === 'gymrat' ? <Dumbbell size={20} className={badge.color} /> :
                                        <Heart size={20} className={badge.color} />
                                    ) : <Lock size={16} className="text-slate-600" />}
                                </div>
                                <div className="min-w-0">
                                    <div className={`text-[10px] font-black uppercase truncate ${badge.unlocked ? 'text-white' : 'text-slate-500'}`}>{badge.label}</div>
                                    <div className="text-[8px] text-slate-500 font-bold leading-tight line-clamp-2">{badge.description}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
             </div>
          )}

          {activeTab === 'training' && (
             <div className="space-y-6 animate-in slide-in-from-right duration-300">
                <div className="space-y-3">
                   <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 flex items-center gap-2"><Dumbbell size={14} /> Coachuppdrag</h3>
                   {(myPlayer.homework || []).map(hw => (
                      <div key={hw.id} onClick={async () => {
                          const updated = (myPlayer.homework || []).map(h => h.id === hw.id ? {...h, completed: !h.completed} : h);
                          setMyPlayer({...myPlayer, homework: updated});
                          await dataService.toggleHomework(player.id, hw.id);
                      }} className={`p-4 rounded-2xl border flex items-center gap-4 transition-all cursor-pointer ${hw.completed ? 'bg-blue-900/10 border-blue-500/30' : 'bg-slate-900 border-slate-800'}`}>
                         <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 ${hw.completed ? 'bg-blue-500 border-blue-500 text-white shadow-lg' : 'border-slate-700'}`}><CheckCircle2 size={16} /></div>
                         <div className="flex-1"><h4 className={`text-xs font-black uppercase ${hw.completed ? 'text-slate-500 line-through' : 'text-white'}`}>{hw.title}</h4></div>
                      </div>
                   ))}
                </div>
                {/* Individual Plan Exercises Here... */}
             </div>
          )}

          {activeTab === 'fuel' && (
             <div className="space-y-6 animate-in slide-in-from-right duration-300">
                <div className="p-10 rounded-[3rem] bg-gradient-to-br from-emerald-900/20 to-slate-900 border border-emerald-500/20 text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/5 via-transparent to-transparent"></div>
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-1 relative z-10">Fuel Station</h2>
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest relative z-10">Optimera din återhämtning</p>
                </div>
                <div className="space-y-3">
                    {fuelTasks.map(task => {
                        const Icon = task.type === 'protein' ? Egg : task.type === 'hydration' ? GlassWater : task.type === 'recovery' ? Moon : Carrot;
                        return (
                            <div key={task.id} onClick={() => setFuelTasks(prev => prev.map(t => t.id === task.id ? {...t, completed: !t.completed} : t))} className={`p-4 rounded-2xl border flex items-center gap-4 transition-all cursor-pointer ${task.completed ? 'bg-emerald-900/10 border-emerald-500/30 shadow-lg' : 'bg-slate-900 border-slate-800'}`}>
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${task.completed ? 'bg-emerald-600 text-white' : 'bg-slate-950 text-slate-600'}`}><Icon size={20} /></div>
                                <div className="flex-1"><h4 className={`text-xs font-black uppercase ${task.completed ? 'text-emerald-400' : 'text-white'}`}>{task.label}</h4></div>
                                {task.completed && <CheckCircle2 size={20} className="text-emerald-500" />}
                            </div>
                        );
                    })}
                </div>
             </div>
          )}
          {/* Matches Tab Here... */}
       </main>
    </div>
  );
};
