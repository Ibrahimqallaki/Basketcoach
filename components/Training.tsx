
import React, { useState, useMemo, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { SKILL_COLORS } from './Roster';
import { 
  Play, Pause, RotateCcw, X, ChevronRight, Save, Check, Trophy, Loader2, MessageSquare, Dumbbell, Layout, ChevronLeft, UserCheck, Activity, BrainCircuit
} from 'lucide-react';
import { Exercise, Player, Evaluation, Phase, TrainingSession } from '../types';

type TrainingStep = 'selection' | 'checkin' | 'live';
const DRAFT_KEY = 'basket_coach_training_draft_v2';

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
      
      // Default närvaro till alla närvarande för snabbhet
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

  const handleStartGradingPlayer = (p: Player) => {
    if(!selectedExercise) return;
    setGradingPlayer(p);
    const existing = evaluations.find(e => e.playerId === p.id);
    const targetLength = selectedExercise.criteria.length;
    if (existing) {
      setCurrentScores([...existing.scores]);
      setCurrentNote(existing.note || "");
    } else {
      setCurrentScores(new Array(targetLength).fill(3));
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
                {allSessions.map(s => (
                  <div key={s.id} onClick={() => setSelectedSession(s)} className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${selectedSession?.id === s.id ? 'bg-orange-600/10 border-orange-500' : 'bg-slate-900 border-slate-800 hover:border-slate-600'}`}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-950 flex items-center justify-center font-black text-xs text-white border border-slate-800">{s.date.split('-')[2]}</div>
                        <div className="text-xs font-black text-slate-300 uppercase tracking-tighter">Fas {s.phaseId} Pass</div>
                    </div>
                    <ChevronRight size={14} className="text-slate-700" />
                  </div>
                ))}
              </div>
              {selectedSession && (
                  <div className="lg:col-span-8 p-6 md:p-10 rounded-[2.5rem] bg-slate-900 border border-slate-800 shadow-2xl space-y-8 animate-in slide-in-from-right relative overflow-hidden">
                      <button onClick={() => setSelectedSession(null)} className="lg:hidden absolute top-6 right-6 text-slate-500"><X size={20}/></button>
                      <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3"><Activity className="text-orange-500" /> {selectedSession.date}</h3>
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
                                      <div className="flex items-center gap-4">
                                          <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg ${a.status === 'närvarande' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>{a.status}</span>
                                          {ev && (
                                              <div className="flex gap-1">
                                                  {ev.scores.map((s, i) => (
                                                      <div key={i} className="w-4 h-1 rounded-full bg-slate-800 overflow-hidden"><div className="h-full bg-orange-500" style={{ width: `${(s/5)*100}%` }}></div></div>
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
              {/* STEG 1: ÖVNINGSVAL */}
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

              {/* STEG 2: NÄRVARO-CHECK */}
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

              {/* STEG 3: LIVE ANALYS */}
              {step === 'live' && selectedExercise && (
                  <div className="space-y-4">
                      <div className="p-8 rounded-[3rem] bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
                          <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                              <div className="text-center md:text-left">
                                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-center md:justify-start gap-2 mb-2">
                                      <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`}></div>
                                      {isPaused ? 'Pausad' : 'Träning Pågår'}
                                  </div>
                                  <h3 className="text-3xl md:text-4xl font-black text-white italic uppercase tracking-tighter">{selectedExercise.title}</h3>
                                  <div className="flex gap-3 mt-4 justify-center md:justify-start">
                                      {selectedExercise.criteria.map((c, i) => <span key={i} className="px-2 py-1 rounded bg-slate-950 text-slate-500 border border-slate-800 text-[8px] font-black uppercase tracking-widest">{c}</span>)}
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
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-2"><UserCheck size={14} /> Bedömning per spelare</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {players.filter(p => attendance[p.id] === 'närvarande' || attendance[p.id] === 'delvis').map(p => {
                                    const isGraded = evaluations.some(e => e.playerId === p.id);
                                    return (
                                        <button key={p.id} onClick={() => handleStartGradingPlayer(p)} className={`p-5 rounded-[1.5rem] border flex items-center justify-between transition-all group ${isGraded ? 'border-emerald-500/50 bg-emerald-500/5' : 'bg-slate-950 border-slate-800 hover:border-orange-500/50'}`}>
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${isGraded ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-500'}`}>#{p.number}</div>
                                                <div className="text-left">
                                                    <div className={`text-xs font-black uppercase ${isGraded ? 'text-emerald-400' : 'text-white'}`}>{p.name}</div>
                                                    <div className="text-[8px] text-slate-600 font-bold uppercase">{isGraded ? 'Bedömd' : 'Ej bedömd än'}</div>
                                                </div>
                                            </div>
                                            {isGraded ? <Check size={18} className="text-emerald-500 animate-in zoom-in" /> : <ChevronRight size={18} className="text-slate-800 group-hover:text-white" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="md:col-span-4 p-8 rounded-[3rem] bg-slate-900 border border-slate-800 shadow-2xl space-y-6 text-center">
                            <div className="w-16 h-16 bg-emerald-600/10 rounded-2xl flex items-center justify-center mx-auto text-emerald-500"><Save size={32}/></div>
                            <h4 className="text-xl font-black text-white italic uppercase leading-none">Avsluta Träning</h4>
                            <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed">När du sparar passet loggas all närvaro och bedömningar permanent.</p>
                            <button disabled={isSaving} onClick={handleFinalizeSession} className="w-full py-5 rounded-[2rem] bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs flex items-center justify-center gap-3 shadow-xl shadow-emerald-900/20 active:scale-95 transition-all">
                                {isSaving ? <Loader2 className="animate-spin" /> : <Trophy size={18} />} 
                                Spara & Avsluta
                            </button>
                        </div>
                      </div>
                  </div>
              )}

              {/* MODAL: INDIVIDUELL BETYGSSÄTTNING */}
              {gradingPlayer && selectedExercise && (
                  <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
                      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
                          <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                              <div>
                                  <div className="text-[8px] font-black text-orange-500 uppercase tracking-widest mb-1">Bedömer just nu</div>
                                  <h4 className="text-2xl font-black text-white uppercase italic leading-none">#{gradingPlayer.number} {gradingPlayer.name}</h4>
                                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter mt-1 block">{selectedExercise.title}</span>
                              </div>
                              <button onClick={() => setGradingPlayer(null)} className="p-3 rounded-full hover:bg-slate-800 text-slate-500"><X size={24}/></button>
                          </div>
                          <div className="p-8 space-y-10 overflow-y-auto max-h-[60vh] custom-scrollbar">
                              {selectedExercise.criteria.map((c, i) => (
                                  <div key={i} className="space-y-5">
                                      <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                          <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div> {c}</span>
                                          <span className="text-white bg-slate-800 px-2 py-0.5 rounded">Nivå {currentScores[i]}</span>
                                      </div>
                                      <div className="flex gap-2">
                                          {[1, 2, 3, 4, 5].map(v => (
                                              <button key={v} onClick={() => { const next = [...currentScores]; next[i] = v; setCurrentScores(next); }} className={`flex-1 h-12 rounded-xl font-black text-sm transition-all border ${currentScores[i] === v ? 'bg-orange-600 border-orange-400 text-white shadow-[0_0_15px_rgba(249,115,22,0.3)] scale-105' : 'bg-slate-950 border-slate-800 text-slate-600 hover:text-slate-400'}`}>{v}</button>
                                          ))}
                                      </div>
                                  </div>
                              ))}
                              <div className="space-y-2">
                                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Coach-notering</label>
                                  <textarea value={currentNote} onChange={e => setCurrentNote(e.target.value)} placeholder="Skriv något uppmuntrande eller vad spelaren kan förbättra..." className="w-full bg-slate-950 border border-slate-800 rounded-[1.5rem] p-4 text-xs text-white outline-none focus:border-orange-500 h-32 resize-none transition-all" />
                              </div>
                          </div>
                          <div className="p-8 bg-slate-950/50 border-t border-slate-800">
                              <button onClick={savePlayerEvaluation} className="w-full py-5 rounded-[2rem] bg-orange-600 text-white font-black uppercase text-xs shadow-xl shadow-orange-900/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                                  <Check size={20}/> Spara Spelare
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
