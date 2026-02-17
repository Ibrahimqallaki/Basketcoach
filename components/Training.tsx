
import React, { useState, useMemo, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { 
  Play, Pause, RotateCcw, X, ChevronRight, Save, Check, Trophy, Loader2, 
  Dumbbell, Layout, ChevronLeft, UserCheck, Activity, BrainCircuit, 
  Target, Zap, MessageSquare, Mic, Eye, Shield, Flame, Timer, Star, 
  ArrowUpCircle, Scaling, Trash2
} from 'lucide-react';
import { Exercise, Player, Evaluation, Phase, TrainingSession } from '../types';

type TrainingStep = 'selection' | 'checkin' | 'live';

// Unika bedömningskriterier för de två lägena
const BASKET_CRITERIA = [
  { label: 'Teknik', icon: Target, desc: 'Precision & utförande' },
  { label: 'Intensitet', icon: Flame, desc: 'Tempo & närkamp' },
  { label: 'Beslut', icon: BrainCircuit, desc: 'Spelförståelse/IQ' },
  { label: 'Kommunikation', icon: Mic, desc: 'Röst & lagstöd' },
  { label: 'Fokus', icon: Eye, desc: 'Koncentration' }
];

const FYS_CRITERIA = [
  { label: 'Hållning', icon: Shield, desc: 'Form & säkerhet' },
  { label: 'Kraft', icon: Zap, desc: 'Explosivitet & push' },
  { label: 'Uthållighet', icon: Timer, desc: 'Rytm & energi' },
  { label: 'Stabilitet', icon: Scaling, desc: 'Balans & kontroll' },
  { label: 'Vilja', icon: ArrowUpCircle, desc: 'Mental inställning' }
];

export const Training: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sessions' | 'active'>('sessions');
  const [step, setStep] = useState<TrainingStep>('selection');
  const [phases, setPhases] = useState<Phase[]>([]);
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [gradingPlayer, setGradingPlayer] = useState<Player | null>(null);
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const [viewMode, setViewMode] = useState<'basket' | 'fys'>('basket');
  const [timer, setTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState<Record<string, 'närvarande' | 'delvis' | 'frånvarande'>>({});
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [allSessions, setAllSessions] = useState<TrainingSession[]>([]);

  // Betygs-state för en spelare
  const [currentScores, setCurrentScores] = useState<number[]>([]);
  const [currentNote, setCurrentNote] = useState<string>("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [p, s, ph] = await Promise.all([
        dataService.getPlayers(),
        dataService.getSessions(),
        dataService.getUnifiedPhases()
      ]);
      setPlayers(p);
      setAllSessions(s);
      setPhases(ph);
      if (ph.length > 0 && !selectedPhase) setSelectedPhase(ph[0]);
      
      const initialAttendance: any = {};
      p.forEach(player => initialAttendance[player.id] = 'närvarande');
      setAttendance(initialAttendance);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [activeTab]);

  useEffect(() => {
    let interval: number;
    if (step === 'live' && !isPaused) {
      interval = window.setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, isPaused]);

  const activeCriteria = viewMode === 'basket' ? BASKET_CRITERIA : FYS_CRITERIA;

  const handleStartGradingPlayer = (p: Player) => {
    if(!selectedExercise) return;
    setGradingPlayer(p);
    const existing = evaluations.find(e => e.playerId === p.id);
    if (existing) {
      setCurrentScores([...existing.scores]);
      setCurrentNote(existing.note || "");
    } else {
      // Skapa alltid 5 poäng oavsett övningens egna kriterier för enhetlighet i DB
      setCurrentScores(new Array(5).fill(3));
      setCurrentNote("");
    }
  };

  const savePlayerEvaluation = () => {
    if (!gradingPlayer || !selectedExercise) return;
    const newEval: Evaluation = { 
        playerId: gradingPlayer.id, 
        exerciseId: selectedExercise.id, 
        scores: currentScores, 
        note: currentNote, 
        timestamp: new Date().toISOString() 
    };
    setEvaluations(prev => [...prev.filter(e => e.playerId !== gradingPlayer.id), newEval]);
    setGradingPlayer(null);
  };

  const handleFinalizeSession = async () => {
    if(!selectedPhase || !selectedExercise) return;
    setIsSaving(true);
    try {
      await dataService.saveSession({
        date: new Date().toISOString().split('T')[0],
        phaseId: selectedPhase.id,
        exerciseIds: [selectedExercise.id],
        attendance: players.map(p => ({ playerId: p.id, status: attendance[p.id] || 'frånvarande' })),
        evaluations: evaluations
      });
      setShowSaveSuccess(true);
      setTimeout(() => {
        setShowSaveSuccess(false);
        setStep('selection');
        setEvaluations([]);
        setTimer(0);
        setActiveTab('sessions');
      }, 1500);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!confirm("Är du säker på att du vill ta bort detta pass? Historiken och XP försvinner för spelarna.")) return;
      const updated = await dataService.deleteSession(id);
      setAllSessions(updated);
      if (selectedSession?.id === id) setSelectedSession(null);
  };

  if (loading && players.length === 0) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-orange-500" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 relative">
      {showSaveSuccess && (
        <div className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center animate-in zoom-in">
          <div className="text-center space-y-4">
            <Trophy size={64} className="text-orange-500 mx-auto drop-shadow-[0_0_20px_rgba(249,115,22,0.4)]" />
            <h2 className="text-3xl font-black italic uppercase text-white tracking-tighter">Träningspass Sparat!</h2>
            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Data har synkats till spelarportalerna</p>
          </div>
        </div>
      )}

      <div className="flex gap-1 p-1 bg-slate-900 rounded-2xl w-full sm:w-fit border border-slate-800 shadow-xl">
          <button onClick={() => setActiveTab('sessions')} className={`flex-1 sm:px-8 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'sessions' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Historik</button>
          <button onClick={() => setActiveTab('active')} className={`flex-1 sm:px-8 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'active' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Starta Träning</button>
      </div>

      {activeTab === 'sessions' ? (
          <div className="grid lg:grid-cols-12 gap-6 animate-in slide-in-from-right duration-500">
              <div className={`${selectedSession ? 'hidden lg:block' : ''} lg:col-span-4 space-y-2`}>
                {allSessions.length > 0 ? allSessions.map(s => (
                  <div key={s.id} onClick={() => setSelectedSession(s)} className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all group ${selectedSession?.id === s.id ? 'bg-orange-600/10 border-orange-500' : 'bg-slate-900 border-slate-800 hover:border-slate-600'}`}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-950 flex items-center justify-center font-black text-xs text-white border border-slate-800">{s.date.split('-')[2]}</div>
                        <div className="text-xs font-black text-slate-300 uppercase tracking-tighter">Fas {s.phaseId} Pass</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={(e) => handleDeleteSession(s.id, e)}
                            className="p-2 text-slate-700 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                            title="Ta bort pass"
                        >
                            <Trash2 size={14} />
                        </button>
                        <ChevronRight size={14} className="text-slate-700" />
                    </div>
                  </div>
                )) : <p className="text-slate-600 p-8 text-center text-xs font-bold uppercase tracking-widest border-2 border-dashed border-slate-900 rounded-3xl">Inga sparade pass än.</p>}
              </div>
              {selectedSession && (
                  <div className="lg:col-span-8 p-6 md:p-10 rounded-[2.5rem] bg-slate-900 border border-slate-800 shadow-2xl space-y-8 animate-in slide-in-from-right relative overflow-hidden">
                      <button onClick={() => setSelectedSession(null)} className="lg:hidden absolute top-6 right-6 text-slate-500"><X size={20}/></button>
                      <div className="flex justify-between items-center">
                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3"><Activity className="text-orange-500" /> {selectedSession.date}</h3>
                        <span className="text-[10px] font-black text-slate-500 uppercase">Fas {selectedSession.phaseId}</span>
                      </div>
                      <div className="space-y-3">
                          {selectedSession.attendance.map(a => {
                              const p = players.find(player => player.id === a.playerId);
                              const ev = selectedSession.evaluations.find(e => e.playerId === a.playerId);
                              return (
                                  <div key={a.playerId} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                      <div className="flex items-center gap-4">
                                          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center font-black text-[10px] text-slate-400">#{p?.number}</div>
                                          <span className="text-xs font-black text-white uppercase">{p?.name}</span>
                                      </div>
                                      <div className="flex items-center gap-6">
                                          <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg ${a.status === 'närvarande' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>{a.status}</span>
                                          {ev && (
                                              <div className="flex gap-1.5 bg-slate-900 p-2 rounded-xl border border-slate-800">
                                                  {ev.scores.slice(0,5).map((s, i) => (
                                                      <div key={i} className="flex flex-col items-center gap-1">
                                                          <div className="w-4 h-1.5 rounded-full bg-slate-800 overflow-hidden"><div className="h-full bg-orange-500 shadow-[0_0_5px_rgba(249,115,22,0.5)]" style={{ width: `${(s/5)*100}%` }}></div></div>
                                                          <span className="text-[6px] font-black text-slate-600">{s}</span>
                                                      </div>
                                                  ))}
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                  </div>
              )}
          </div>
      ) : (
          <div className="space-y-6">
              {step === 'selection' && (
                  <div className="p-8 md:p-12 rounded-[3rem] bg-slate-900 border border-slate-800 space-y-10 shadow-2xl animate-in slide-in-from-bottom relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-5"><BrainCircuit size={120} /></div>
                      <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                          <div>
                            <h3 className="text-3xl md:text-5xl font-black text-white italic uppercase tracking-tighter leading-none">Tränings-setup</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">Välj passets huvudfokus</p>
                          </div>
                          <div className="flex p-1.5 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner">
                              <button onClick={() => setViewMode('basket')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'basket' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}><Layout size={14}/> Basket</button>
                              <button onClick={() => setViewMode('fys')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'fys' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}><Dumbbell size={14}/> Fys</button>
                          </div>
                      </div>
                      <div className="grid md:grid-cols-12 gap-8 relative z-10">
                          <div className="md:col-span-4 grid grid-cols-4 gap-2">
                              {phases.map(p => (
                                  <button key={p.id} onClick={() => setSelectedPhase(p)} className={`py-4 rounded-xl font-black text-sm border transition-all ${selectedPhase?.id === p.id ? (viewMode === 'fys' ? 'bg-blue-600 border-blue-400' : 'bg-orange-600 border-orange-400') + ' text-white shadow-lg scale-105' : 'bg-slate-950 border-slate-800 text-slate-600 hover:border-slate-600'}`}>{p.id}</button>
                              ))}
                          </div>
                          <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {selectedPhase?.exercises.filter(ex => {
                                  const isFys = ex.category === 'Fysik' || ex.category === 'Kondition';
                                  return viewMode === 'fys' ? isFys : !isFys;
                              }).map(ex => (
                                  <button key={ex.id} onClick={() => setSelectedExercise(ex)} className={`p-4 rounded-xl text-left border text-[10px] font-black uppercase transition-all ${selectedExercise?.id === ex.id ? 'border-orange-500 bg-orange-500/10 text-orange-400 shadow-inner' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}>{ex.title}</button>
                              ))}
                          </div>
                      </div>
                      <button disabled={!selectedExercise} onClick={() => setStep('checkin')} className="w-full py-6 rounded-[2rem] bg-slate-800 hover:bg-slate-700 text-white font-black uppercase text-xs shadow-xl active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3">Fortsätt till närvaro <ChevronRight size={18}/></button>
                  </div>
              )}

              {step === 'checkin' && selectedExercise && (
                  <div className="p-8 md:p-12 rounded-[3rem] bg-slate-900 border border-slate-800 space-y-8 shadow-2xl animate-in slide-in-from-right">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-6">
                        <div>
                            <button onClick={() => setStep('selection')} className="text-slate-500 hover:text-white flex items-center gap-1 text-[9px] font-black uppercase mb-2"><ChevronLeft size={14}/> Ändra övning</button>
                            <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">Närvarokontroll</h3>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                            <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Aktiv Övning</div>
                            <div className="text-xs font-black text-orange-500 uppercase">{selectedExercise.title}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {players.map(p => (
                              <div key={p.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between group">
                                  <div className="flex items-center gap-4">
                                      <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center font-black text-xs text-slate-600">#{p.number}</div>
                                      <span className="text-xs font-black text-white uppercase">{p.name}</span>
                                  </div>
                                  <div className="flex gap-1">
                                      {['frånvarande', 'delvis', 'närvarande'].map((s: any) => (
                                          <button key={s} onClick={() => setAttendance({...attendance, [p.id]: s})} className={`px-2 py-1.5 rounded-lg text-[7px] font-black uppercase transition-all ${attendance[p.id] === s ? (s === 'närvarande' ? 'bg-emerald-600 text-white' : s === 'delvis' ? 'bg-amber-600 text-white' : 'bg-rose-600 text-white') : 'bg-slate-900 text-slate-600'}`}>{s.slice(0,3)}</button>
                                      ))}
                                  </div>
                              </div>
                          ))}
                      </div>
                      <button onClick={() => setStep('live')} className="w-full py-6 rounded-[2rem] bg-orange-600 text-white font-black uppercase text-xs shadow-xl shadow-orange-900/20 flex items-center justify-center gap-3">Starta Passet <Play size={18} fill="currentColor"/></button>
                  </div>
              )}

              {step === 'live' && selectedExercise && (
                  <div className="space-y-4">
                      <div className="p-8 rounded-[3rem] bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
                          <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                              <div className="text-center md:text-left">
                                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-center md:justify-start gap-2 mb-2">
                                      <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`}></div>
                                      {isPaused ? 'Pausad' : 'Träning Pågår'}
                                  </div>
                                  <h3 className="text-3xl md:text-4xl font-black text-white italic uppercase tracking-tighter leading-none">{selectedExercise.title}</h3>
                                  <div className="flex gap-2 mt-4 justify-center md:justify-start overflow-x-auto hide-scrollbar pb-1">
                                      {activeCriteria.map((c, i) => (
                                          <div key={i} className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 shrink-0">
                                              <c.icon size={10} className={viewMode === 'basket' ? 'text-orange-500' : 'text-blue-500'} />
                                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{c.label}</span>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                              <div className="flex flex-col items-center gap-4">
                                  <div className="text-6xl md:text-7xl font-black text-white font-mono tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                                      {Math.floor(timer/60)}:{String(timer%60).padStart(2, '0')}
                                  </div>
                                  <div className="flex gap-2">
                                      <button onClick={() => setIsPaused(!isPaused)} className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isPaused ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20' : 'bg-amber-500 hover:bg-amber-400 shadow-amber-900/20'} text-white shadow-xl transition-all`}>{isPaused ? <Play size={24} fill="currentColor" /> : <Pause size={24} fill="currentColor" />}</button>
                                      <button onClick={() => { setTimer(0); setIsPaused(true); }} className="w-14 h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 flex items-center justify-center transition-all"><RotateCcw size={20} /></button>
                                  </div>
                              </div>
                          </div>
                      </div>

                      <div className="grid md:grid-cols-12 gap-6 items-start">
                        <div className="md:col-span-8 p-8 rounded-[3rem] bg-slate-900 border border-slate-800 space-y-6 shadow-2xl relative overflow-hidden">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-2"><UserCheck size={14} /> Spelarbedömning</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {players.filter(p => attendance[p.id] === 'närvarande' || attendance[p.id] === 'delvis').map(p => {
                                    const isGraded = evaluations.some(e => e.playerId === p.id);
                                    const scoreAvg = isGraded ? (evaluations.find(e => e.playerId === p.id)?.scores.reduce((a,b)=>a+b,0)! / 5).toFixed(1) : null;
                                    return (
                                        <button key={p.id} onClick={() => handleStartGradingPlayer(p)} className={`p-4 rounded-[1.5rem] border flex items-center justify-between transition-all group ${isGraded ? 'border-emerald-500/50 bg-emerald-500/5 shadow-inner' : 'bg-slate-950 border-slate-800 hover:border-orange-500/50'}`}>
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${isGraded ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-900 text-slate-500'}`}>#{p.number}</div>
                                                <div className="text-left">
                                                    <div className={`text-xs font-black uppercase ${isGraded ? 'text-emerald-400' : 'text-white'}`}>{p.name}</div>
                                                    {isGraded ? (
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <div className="flex gap-0.5">
                                                                {[1,2,3,4,5].map(v => <div key={v} className={`w-1.5 h-1.5 rounded-full ${v <= Math.round(parseFloat(scoreAvg!)) ? 'bg-emerald-500' : 'bg-slate-800'}`}></div>)}
                                                            </div>
                                                            <span className="text-[8px] font-black text-emerald-500">{scoreAvg} snitt</span>
                                                        </div>
                                                    ) : <div className="text-[8px] text-slate-700 font-bold uppercase">Klicka för betyg</div>}
                                                </div>
                                            </div>
                                            {isGraded ? <Check size={18} className="text-emerald-500 animate-in zoom-in" /> : <ChevronRight size={18} className="text-slate-800 group-hover:text-white" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="md:col-span-4 p-8 rounded-[3rem] bg-slate-900 border border-slate-800 shadow-2xl space-y-6 text-center">
                            <div className="w-16 h-16 bg-emerald-600/10 rounded-2xl flex items-center justify-center mx-auto text-emerald-500 border border-emerald-500/20 shadow-inner"><Save size={32}/></div>
                            <h4 className="text-xl font-black text-white italic uppercase leading-none">Avsluta Träning</h4>
                            <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed">Sparar närvaro och {evaluations.length} bedömningar till spelarnas arkiv.</p>
                            <button disabled={isSaving} onClick={handleFinalizeSession} className="w-full py-5 rounded-[2rem] bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs flex items-center justify-center gap-3 shadow-xl shadow-emerald-900/20 active:scale-95 transition-all">
                                {isSaving ? <Loader2 className="animate-spin" /> : <Trophy size={18} />} 
                                Spara & Arkivera
                            </button>
                        </div>
                      </div>
                  </div>
              )}

              {/* MODAL: KOMPAKT SMART ASSESSMENT GRID */}
              {gradingPlayer && selectedExercise && (
                  <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md">
                      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/40 shrink-0">
                              <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-2xl bg-orange-600 flex items-center justify-center font-black text-xl text-white shadow-xl italic">#{gradingPlayer.number}</div>
                                  <div>
                                      <h4 className="text-xl font-black text-white uppercase italic leading-none">{gradingPlayer.name}</h4>
                                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">{selectedExercise.title}</p>
                                  </div>
                              </div>
                              <button onClick={() => setGradingPlayer(null)} className="p-2.5 bg-slate-800 rounded-full hover:bg-slate-700 text-slate-400 transition-colors"><X size={20}/></button>
                          </div>

                          <div className="p-6 md:p-8 space-y-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
                              <div className="grid grid-cols-1 gap-4">
                                  {activeCriteria.map((c, i) => (
                                      <div key={i} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 shadow-inner">
                                          <div className="flex justify-between items-center px-1">
                                              <div className="flex items-center gap-2">
                                                  <div className={`p-1.5 rounded-lg ${viewMode === 'basket' ? 'bg-orange-600/10 text-orange-500' : 'bg-blue-600/10 text-blue-500'}`}>
                                                      <c.icon size={14} />
                                                  </div>
                                                  <div>
                                                      <span className="text-[10px] font-black text-white uppercase tracking-wider">{c.label}</span>
                                                      <p className="text-[7px] font-bold text-slate-600 uppercase tracking-tighter leading-none">{c.desc}</p>
                                                  </div>
                                              </div>
                                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 ${currentScores[i] >= 4 ? 'text-emerald-500' : currentScores[i] <= 2 ? 'text-rose-500' : 'text-orange-500'}`}>NIVÅ {currentScores[i]}</span>
                                          </div>
                                          <div className="flex gap-1">
                                              {[1, 2, 3, 4, 5].map(v => (
                                                  <button 
                                                    key={v} 
                                                    onClick={() => { const next = [...currentScores]; next[i] = v; setCurrentScores(next); }} 
                                                    className={`flex-1 h-10 rounded-xl font-black text-xs transition-all border ${currentScores[i] === v ? (viewMode === 'basket' ? 'bg-orange-600 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)]' : 'bg-blue-600 border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.3)]') + ' text-white scale-[1.05] z-10' : 'bg-slate-900 border-slate-800 text-slate-600 hover:text-slate-400'}`}
                                                  >
                                                      {v}
                                                  </button>
                                              ))}
                                          </div>
                                      </div>
                                  ))}
                              </div>

                              <div className="space-y-2">
                                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-2 flex items-center gap-2"><MessageSquare size={12}/> Coach-notering</label>
                                  <textarea 
                                    value={currentNote} 
                                    onChange={e => setCurrentNote(e.target.value)} 
                                    placeholder="Extra pepp eller tips..." 
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-white outline-none focus:border-orange-500 h-24 resize-none transition-all shadow-inner" 
                                  />
                              </div>
                          </div>

                          <div className="p-6 md:p-8 bg-slate-950/60 border-t border-slate-800 shrink-0">
                              <button onClick={savePlayerEvaluation} className="w-full py-5 rounded-[2rem] bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs shadow-xl shadow-emerald-900/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                                  <Check size={20}/> Spara Bedömning
                              </button>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      )}
    </div>
  );
};
