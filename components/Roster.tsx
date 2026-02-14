
import React, { useState, useMemo, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { User, Plus, X, Trash2, Star, ClipboardList, PenTool, MessageSquare, PlusCircle, Target, Check, Save, Loader2, Key, Dumbbell, ExternalLink, RefreshCw, Eye, BookPlus, ChevronRight, BrainCircuit, Zap, Heart, Trophy } from 'lucide-react';
import { Player, Exercise, Phase, MatchRecord } from '../types';

interface RosterProps {
    onSimulatePlayerLogin?: (player: Player) => void;
}

// Global färgskala för alla bedömningar
export const SKILL_COLORS: Record<string, string> = {
    'Skytte': 'bg-rose-500',
    'Skott': 'bg-rose-500',
    'Dribbling': 'bg-amber-500',
    'Passning': 'bg-blue-500',
    'Passningar': 'bg-blue-500',
    'Försvar': 'bg-emerald-500',
    'Spelförståelse': 'bg-purple-500',
    'Basket-IQ': 'bg-purple-500',
    'Kondition': 'bg-cyan-500',
    'Fysik': 'bg-indigo-500',
    'Transition': 'bg-orange-500'
};

// Den "syrade cirkeln" (Radargraf)
const RadarChart = ({ skills }: { skills: Record<string, number> }) => {
    const entries = Object.entries(skills);
    const numPoints = entries.length;
    const radius = 70;
    const center = 100;

    const points = entries.map(([name, value], i) => {
        const angle = (Math.PI * 2 * i) / numPoints - Math.PI / 2;
        const r = (value / 10) * radius;
        return {
            x: center + r * Math.cos(angle),
            y: center + r * Math.sin(angle),
            label: name
        };
    });

    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

    return (
        <div className="relative w-full aspect-square max-w-[240px] mx-auto animate-in zoom-in duration-700">
            <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
                {[0.2, 0.4, 0.6, 0.8, 1.0].map((scale, idx) => (
                    <circle key={idx} cx={center} cy={center} r={radius * scale} fill="none" stroke="white" strokeWidth="0.5" strokeOpacity="0.05" />
                ))}
                {points.map((p, i) => {
                    const angle = (Math.PI * 2 * i) / numPoints - Math.PI / 2;
                    return <line key={i} x1={center} y1={center} x2={center + radius * Math.cos(angle)} y2={center + radius * Math.sin(angle)} stroke="white" strokeWidth="0.5" strokeOpacity="0.1" />;
                })}
                <path d={pathData} fill="rgba(249, 115, 22, 0.15)" stroke="#f97316" strokeWidth="2.5" className="drop-shadow-[0_0_10px_rgba(249,115,22,0.4)] transition-all duration-500" />
                {points.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#fff" className="drop-shadow-[0_0_3px_rgba(255,255,255,0.8)]" />
                ))}
            </svg>
        </div>
    );
};

export const Roster: React.FC<RosterProps> = ({ onSimulatePlayerLogin }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{ show: boolean, mode: 'add' | 'edit', player?: Player }>({ show: false, mode: 'add' });
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  
  const isSuperAdmin = dataService.isSuperAdmin();
  const [newHomework, setNewHomework] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [p, ph, m] = await Promise.all([
        dataService.getPlayers(),
        dataService.getUnifiedPhases(),
        dataService.getMatches()
      ]);
      setPlayers(p);
      setPhases(ph);
      setMatches(m);
      if (p.length > 0 && !selectedPlayerId) setSelectedPlayerId(p[0].id);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const player = useMemo(() => players.find(p => p.id === selectedPlayerId), [players, selectedPlayerId]);

  const playerMatchStats = useMemo(() => {
      if (!player) return null;
      const feedbacks = matches.flatMap(m => m.feedbacks).filter(f => f.playerId === player.id);
      if (feedbacks.length === 0) return null;
      const avg = (key: 'effort' | 'teamwork' | 'learning') => 
        (feedbacks.reduce((acc, f) => acc + f[key], 0) / feedbacks.length).toFixed(1);
      return { effort: avg('effort'), teamwork: avg('teamwork'), learning: avg('learning') };
  }, [player, matches]);

  const currentSkills = useMemo((): Record<string, number> => {
    const defaultSkills = { 'Skytte': 5, 'Dribbling': 5, 'Passning': 5, 'Försvar': 5, 'Spelförståelse': 5, 'Kondition': 5, 'Fysik': 5 };
    return player?.skillAssessment || defaultSkills;
  }, [player]);

  const allExercises = useMemo(() => phases.flatMap(p => p.exercises), [phases]);

  const handleUpdateAssessment = async (category: string, value: number) => {
    if (!selectedPlayerId) return;
    const updatedAssessment = { ...currentSkills, [category]: value };
    const updated = await dataService.updatePlayer(selectedPlayerId, { skillAssessment: updatedAssessment });
    setPlayers(updated);
  };

  const handleToggleExercise = async (exId: string) => {
    if (!player) return;
    const currentPlan = player.individualPlan || [];
    const newPlan = currentPlan.includes(exId) ? currentPlan.filter(id => id !== exId) : [...currentPlan, exId];
    const updated = await dataService.updatePlayer(player.id, { individualPlan: newPlan });
    setPlayers(updated);
  };

  if (loading && players.length === 0) return <div className="h-full w-full flex flex-col items-center justify-center"><Loader2 className="w-12 h-12 text-orange-500 animate-spin" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xl md:text-3xl font-black italic uppercase tracking-tighter text-white">Laget</h3>
        <button onClick={() => setModalState({ show: true, mode: 'add' })} className="px-6 py-3 bg-orange-600 rounded-xl text-[10px] font-black uppercase text-white shadow-lg shadow-orange-900/20 hover:bg-orange-500 transition-all flex items-center gap-2"><Plus size={16} /> Lägg till</button>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className={`lg:col-span-3 space-y-2 ${mobileDetailOpen ? 'hidden lg:block' : 'block'}`}>
          {players.map(p => (
            <div key={p.id} onClick={() => { setSelectedPlayerId(p.id); setMobileDetailOpen(true); }} className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${selectedPlayerId === p.id ? 'bg-orange-600/10 border-orange-500 shadow-lg' : 'bg-slate-900 border-slate-800'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${selectedPlayerId === p.id ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-500'}`}>#{p.number}</div>
                <div className="font-bold text-slate-200 text-xs">{p.name}</div>
              </div>
            </div>
          ))}
        </div>

        <div className={`lg:col-span-9 ${mobileDetailOpen ? 'block' : 'hidden lg:block'}`}>
          {player ? (
            <div className="space-y-6 animate-in slide-in-from-bottom">
              <button onClick={() => setMobileDetailOpen(false)} className="lg:hidden flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase mb-2"><X size={14}/> Tillbaka</button>

              {/* SPELAR-INFO HEADER */}
              <div className="p-6 md:p-8 rounded-[2rem] bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                   <div className="flex items-center gap-6">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-3xl font-black text-orange-500 shadow-inner">{player.number}</div>
                      <div>
                        <h2 className="text-2xl md:text-3xl font-black text-white italic uppercase tracking-tighter">{player.name}</h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">{player.position} • {player.age} år</p>
                      </div>
                   </div>
                   <div className="flex gap-2 w-full md:w-auto">
                      {player.accessCode && onSimulatePlayerLogin && <button onClick={() => onSimulatePlayerLogin(player)} className="p-3 bg-blue-600/10 text-blue-400 border border-blue-500/20 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Eye size={18}/></button>}
                      <button className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-slate-800 text-slate-400 text-[9px] font-black uppercase flex items-center justify-center gap-2 hover:text-white transition-all"><PenTool size={14}/> Redigera</button>
                   </div>
                </div>
              </div>

              {/* 1. HEMLÄXOR (TOPP) */}
              <div className="p-6 md:p-8 rounded-[2rem] bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
                 <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Dumbbell size={14} className="text-blue-400" /> Hemläxor & Uppdrag</h3>
                 <div className="flex gap-2">
                     <input type="text" value={newHomework} onChange={(e) => setNewHomework(e.target.value)} placeholder="T.ex. Skjut 50 straffkast..." className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-blue-500" />
                     <button onClick={async () => { if(!newHomework.trim()) return; await dataService.addHomework(player.id, newHomework); setNewHomework(""); const updated = await dataService.getPlayers(); setPlayers(updated); }} className="px-4 py-3 bg-blue-600 rounded-xl text-white font-black uppercase text-[10px] hover:bg-blue-500 transition-colors">Lägg till</button>
                 </div>
                 <div className="space-y-2">
                     {(player.homework || []).map(hw => (
                         <div key={hw.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-4 group">
                             <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${hw.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-700'}`}>{hw.completed && <Check size={12} className="text-white" />}</div>
                             <div className="flex-1 text-xs font-bold text-white">{hw.title}</div>
                         </div>
                     ))}
                 </div>
              </div>

              {/* 2. INDIVIDUELL PLAN (MITTEN) */}
              <div className="p-6 md:p-8 rounded-[2rem] bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
                  <div className="flex justify-between items-center">
                      <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><BookPlus size={14} className="text-purple-400" /> Individuell Utvecklingsplan</h3>
                      <button onClick={() => setShowExercisePicker(true)} className="px-3 py-1.5 bg-purple-600/10 text-purple-400 border border-purple-500/20 rounded-lg text-[9px] font-black uppercase hover:bg-purple-600 hover:text-white transition-all">Välj Övningar</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(player.individualPlan || []).map(exId => {
                          const ex = allExercises.find(e => e.id === exId);
                          if (!ex) return null;
                          return (
                              <div key={exId} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between group">
                                  <div className="flex items-center gap-3">
                                      <div className={`w-8 h-8 rounded-lg ${SKILL_COLORS[ex.category] || 'bg-orange-500'} flex items-center justify-center text-white`}><Target size={14} /></div>
                                      <div className="text-[10px] font-black text-white uppercase truncate">{ex.title}</div>
                                  </div>
                                  <button onClick={() => handleToggleExercise(exId)} className="text-slate-700 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><X size={14}/></button>
                              </div>
                          );
                      })}
                  </div>
              </div>

              {/* 3. MATCHBEDÖMNING (SISU) */}
              <div className="p-6 md:p-8 rounded-[2rem] bg-slate-900 border border-slate-800 space-y-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Trophy size={80} /></div>
                <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><BrainCircuit size={14} className="text-indigo-400" /> Matchstatistik (SISU-index)</h3>
                {playerMatchStats ? (
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-[9px] font-black uppercase text-slate-400"><span>Ansträngning</span><span className="text-yellow-500">{playerMatchStats.effort}/5</span></div>
                            <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden"><div className="h-full bg-yellow-500 rounded-full" style={{ width: `${(parseFloat(playerMatchStats.effort)/5)*100}%` }}></div></div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-[9px] font-black uppercase text-slate-400"><span>Laganda</span><span className="text-rose-500">{playerMatchStats.teamwork}/5</span></div>
                            <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden"><div className="h-full bg-rose-500 rounded-full" style={{ width: `${(parseFloat(playerMatchStats.teamwork)/5)*100}%` }}></div></div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-[9px] font-black uppercase text-slate-400"><span>Lärande</span><span className="text-emerald-500">{playerMatchStats.learning}/5</span></div>
                            <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(parseFloat(playerMatchStats.learning)/5)*100}%` }}></div></div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-4 border border-dashed border-slate-800 rounded-2xl text-[10px] font-bold text-slate-600 uppercase italic">Ingen matchdata än</div>
                )}
              </div>

              {/* 4. FÄRDIGHETSBEDÖMNING (SYRAD CIRKEL LÄNGST NER) */}
              <div className="p-6 md:p-8 rounded-[2rem] bg-slate-900 border border-slate-800 space-y-6 shadow-2xl relative overflow-hidden">
                  <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Star size={14} className="text-yellow-500" /> Färdighetsbedömning</h3>
                  <div className="grid md:grid-cols-2 gap-12 items-center">
                      <div className="space-y-5">
                          {Object.entries(currentSkills).map(([skill, val]) => (
                              <div key={skill} className="space-y-2 group">
                                  <div className="flex justify-between text-[9px] font-black uppercase text-slate-400 group-hover:text-slate-200 transition-colors">
                                      <span>{skill}</span>
                                      <span className="font-mono text-white">{val}/10</span>
                                  </div>
                                  <div className="relative h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
                                      <div className={`absolute top-0 left-0 h-full transition-all duration-700 rounded-full ${SKILL_COLORS[skill] || 'bg-orange-500'} shadow-[0_0_10px_rgba(255,255,255,0.1)]`} style={{ width: `${(val as number) * 10}%` }} />
                                  </div>
                                  <input type="range" min="1" max="10" value={val} onChange={(e) => handleUpdateAssessment(skill, parseInt(e.target.value))} className="w-full h-1.5 bg-transparent appearance-none cursor-pointer accent-white relative z-10 -mt-4 opacity-0 hover:opacity-100 transition-opacity" />
                              </div>
                          ))}
                      </div>
                      <div className="bg-slate-950 rounded-[3rem] border border-slate-800 p-8 shadow-inner flex flex-col items-center group relative">
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-500/5 via-transparent to-transparent"></div>
                          <RadarChart skills={currentSkills} />
                          <div className="mt-4 text-center">
                              <h4 className="text-xs font-black text-white uppercase italic tracking-widest">Utvecklingsgraf</h4>
                              <p className="text-[8px] text-slate-500 uppercase mt-1">Realtidssynk till portal</p>
                          </div>
                      </div>
                  </div>
              </div>
            </div>
          ) : (
            <div className="h-64 border-2 border-dashed border-slate-800 rounded-[2rem] flex flex-col items-center justify-center text-slate-700"><User size={32} className="opacity-10 mb-2" /><p className="text-[10px] font-bold uppercase tracking-widest">Välj spelare i listan</p></div>
          )}
        </div>
      </div>

      {/* ÖVNINGSVÄLJARE MODAL */}
      {showExercisePicker && (
          <div className="fixed inset-0 z-[700] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
              <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95">
                  <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900 shrink-0">
                      <div>
                        <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Välj övningar för {player?.name}</h3>
                        <p className="text-[9px] font-bold text-slate-500 uppercase">Dessa visas i spelarens utbildningsplan</p>
                      </div>
                      <button onClick={() => setShowExercisePicker(false)} className="p-2 rounded-full hover:bg-slate-800 text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-slate-950/20">
                      {phases.map(phase => (
                          <div key={phase.id} className="space-y-4">
                              <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-2 border-l-4 border-orange-500 pl-3">{phase.title}</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                  {phase.exercises.map(ex => {
                                      const isSelected = player?.individualPlan?.includes(ex.id);
                                      const isFys = ex.category === 'Fysik' || ex.category === 'Kondition';
                                      return (
                                          <button key={ex.id} onClick={() => handleToggleExercise(ex.id)} className={`p-4 rounded-2xl border text-left transition-all group flex flex-col gap-2 ${isSelected ? 'bg-orange-600 border-orange-400 shadow-lg shadow-orange-900/20' : 'bg-slate-900 border-slate-800 hover:border-slate-600'}`}>
                                              <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded ${isSelected ? 'bg-white/20 text-white' : isFys ? 'bg-blue-600/20 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>{ex.category}</span>
                                              <div className={`text-[10px] font-black uppercase leading-tight ${isSelected ? 'text-white' : 'text-slate-300'}`}>{ex.title}</div>
                                          </button>
                                      );
                                  })}
                              </div>
                          </div>
                      ))}
                  </div>
                  <div className="p-6 border-t border-slate-800 bg-slate-900 shrink-0"><button onClick={() => setShowExercisePicker(false)} className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-black uppercase text-xs tracking-widest transition-all">Klar</button></div>
              </div>
          </div>
      )}
    </div>
  );
};
