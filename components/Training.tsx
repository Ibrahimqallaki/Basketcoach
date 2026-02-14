
import React, { useState, useMemo, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { SKILL_COLORS } from './Roster';
import { 
  Play, Pause, RotateCcw, X, ChevronRight, Save, Check, Trophy, Loader2, MessageSquare, Dumbbell, Layout, ChevronLeft
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
  const [currentScores, setCurrentScores] = useState<number[]>([]);
  const [currentNote, setCurrentNote] = useState<string>("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState<Record<string, 'närvarande' | 'delvis' | 'frånvarande'>>({});
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [allSessions, setAllSessions] = useState<TrainingSession[]>([]);

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
      if (!selectedPhase && ph.length > 0) setSelectedPhase(ph[0]);
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
      const scores = [...existing.scores];
      while (scores.length < targetLength) scores.push(3);
      setCurrentScores(scores.slice(0, targetLength));
      setCurrentNote(existing.note || "");
    } else {
      setCurrentScores(new Array(targetLength).fill(3));
      setCurrentNote("");
    }
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
      localStorage.removeItem(DRAFT_KEY);
      setShowSaveSuccess(true);
      setTimeout(() => {
        setShowSaveSuccess(false);
        setStep('selection');
        setEvaluations([]);
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
        <div className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center animate-in zoom-in duration-300">
          <div className="text-center space-y-4">
            <Trophy size={48} className="text-orange-500 mx-auto" />
            <h2 className="text-3xl font-black italic uppercase text-white">Passet Sparat!</h2>
          </div>
        </div>
      )}

      <div className="flex gap-1 p-1 bg-slate-900 rounded-2xl w-full sm:w-fit border border-slate-800 shadow-xl">
          <button onClick={() => setActiveTab('sessions')} className={`flex-1 sm:px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'sessions' ? 'bg-orange-600 text-white' : 'text-slate-500'}`}>Historik</button>
          <button onClick={() => setActiveTab('active')} className={`flex-1 sm:px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'active' ? 'bg-orange-600 text-white' : 'text-slate-500'}`}>Ny Träning</button>
      </div>

      {activeTab === 'sessions' ? (
          <div className="grid lg:grid-cols-12 gap-6">
              <div className={`${selectedSession ? 'hidden lg:block' : ''} lg:col-span-4 space-y-2`}>
                {allSessions.map(s => (
                  <div key={s.id} onClick={() => setSelectedSession(s)} className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${selectedSession?.id === s.id ? 'bg-orange-600/10 border-orange-500' : 'bg-slate-900 border-slate-800'}`}>
                    <span className="font-black text-white">{s.date.split('-')[2]}/{s.date.split('-')[1]}</span>
                    <ChevronRight size={14} className="text-slate-700" />
                  </div>
                ))}
              </div>
              {selectedSession && (
                  <div className="lg:col-span-8 p-6 md:p-10 rounded-[2rem] bg-slate-900 border border-slate-800 shadow-2xl space-y-8 animate-in slide-in-from-right">
                      <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">{selectedSession.date}</h3>
                      <div className="space-y-4">
                          {selectedSession.attendance.map(a => {
                              const p = players.find(player => player.id === a.playerId);
                              const ev = selectedSession.evaluations.find(e => e.playerId === a.playerId);
                              return (
                                  <div key={a.playerId} className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                                      <div className="flex justify-between mb-2">
                                          <span className="text-xs font-black text-white uppercase">#{p?.number} {p?.name}</span>
                                          <span className={`text-[8px] font-black uppercase ${a.status === 'närvarande' ? 'text-emerald-500' : 'text-rose-500'}`}>{a.status}</span>
                                      </div>
                                      {ev && (
                                          <div className="grid grid-cols-5 gap-1.5">
                                              {ev.scores.map((s, i) => (
                                                  <div key={i} className="h-1 rounded-full bg-slate-800 overflow-hidden">
                                                      <div className="h-full bg-orange-500" style={{ width: `${(s/5)*100}%` }}></div>
                                                  </div>
                                              ))}
                                          </div>
                                      )}
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
                  <div className="p-10 rounded-[3rem] bg-slate-900 border border-slate-800 space-y-8 shadow-2xl animate-in slide-in-from-bottom">
                      <div className="flex justify-between items-center">
                          <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Planering</h3>
                          <div className="flex p-1.5 bg-slate-950 rounded-xl border border-slate-800">
                              <button onClick={() => setViewMode('basket')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase ${viewMode === 'basket' ? 'bg-orange-600 text-white' : 'text-slate-500'}`}>Basket</button>
                              <button onClick={() => setViewMode('fys')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase ${viewMode === 'fys' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>Fys</button>
                          </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-8">
                          <div className="grid grid-cols-4 gap-2">
                              {phases.map(p => (
                                  <button key={p.id} onClick={() => setSelectedPhase(p)} className={`py-4 rounded-xl font-black text-sm border ${selectedPhase?.id === p.id ? 'bg-orange-600 text-white' : 'bg-slate-950 border-slate-800 text-slate-600'}`}>{p.id}</button>
                              ))}
                          </div>
                          <div className="space-y-2">
                              {selectedPhase?.exercises.filter(ex => {
                                  const isFys = ex.category === 'Fysik' || ex.category === 'Kondition';
                                  return viewMode === 'fys' ? isFys : !isFys;
                              }).map(ex => (
                                  <button key={ex.id} onClick={() => setSelectedExercise(ex)} className={`w-full p-4 rounded-xl text-left border text-[10px] font-black uppercase ${selectedExercise?.id === ex.id ? 'border-orange-500 bg-orange-500/10 text-orange-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>{ex.title}</button>
                              ))}
                          </div>
                      </div>
                      <button disabled={!selectedExercise} onClick={() => setStep('checkin')} className="w-full py-5 rounded-2xl bg-orange-600 text-white font-black uppercase text-xs shadow-xl active:scale-95 disabled:opacity-50">Gå vidare</button>
                  </div>
              )}

              {step === 'live' && selectedExercise && (
                  <div className="space-y-4">
                      <div className="p-8 rounded-[3rem] bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
                          <div className="flex justify-between items-center relative z-10">
                              <div>
                                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                      <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`}></div>
                                      {isPaused ? 'Pausad' : 'Live Träning'}
                                  </div>
                                  <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">{selectedExercise.title}</h3>
                              </div>
                              <div className="flex items-center gap-4 bg-slate-950 p-2 rounded-2xl border border-slate-800">
                                  <button onClick={() => setIsPaused(!isPaused)} className={`w-12 h-12 rounded-xl flex items-center justify-center ${isPaused ? 'bg-emerald-600' : 'bg-amber-500'} text-white shadow-lg`}>{isPaused ? <Play size={20} fill="currentColor" /> : <Pause size={20} fill="currentColor" />}</button>
                                  <span className="text-4xl font-black text-white font-mono px-4">{Math.floor(timer/60)}:{String(timer%60).padStart(2, '0')}</span>
                              </div>
                          </div>
                      </div>

                      <div className="p-8 rounded-[3rem] bg-slate-900 border border-slate-800 space-y-6">
                          <div className="grid gap-2">
                              {players.map(p => (
                                  <button key={p.id} onClick={() => handleStartGradingPlayer(p)} className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${evaluations.some(e => e.playerId === p.id) ? 'border-emerald-500 bg-emerald-500/10' : 'bg-slate-950 border-slate-800'}`}>
                                      <span className="text-xs font-black uppercase text-white">#{p.number} {p.name}</span>
                                      {evaluations.some(e => e.playerId === p.id) ? <Check size={16} className="text-emerald-500" /> : <ChevronRight size={16} className="text-slate-700" />}
                                  </button>
                              ))}
                          </div>
                          <button disabled={isSaving} onClick={handleFinalizeSession} className="w-full py-5 rounded-2xl bg-emerald-600 text-white font-black uppercase text-xs flex items-center justify-center gap-2">{isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />} Spara Passet</button>
                      </div>
                  </div>
              )}

              {gradingPlayer && selectedExercise && (
                  <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
                      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in">
                          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                              <div><h4 className="text-xl font-black text-white uppercase italic">#{gradingPlayer.number} {gradingPlayer.name}</h4><span className="text-[10px] font-black text-slate-500 uppercase">{selectedExercise.title}</span></div>
                              <button onClick={() => setGradingPlayer(null)} className="p-2 text-slate-500"><X size={20}/></button>
                          </div>
                          <div className="p-8 space-y-8 overflow-y-auto">
                              {selectedExercise.criteria.map((c, i) => (
                                  <div key={i} className="space-y-4">
                                      <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                          <span>{c}</span>
                                          <span className="text-white">Nivå {currentScores[i]}</span>
                                      </div>
                                      <div className="flex gap-1.5">
                                          {[1, 2, 3, 4, 5].map(v => (
                                              <button key={v} onClick={() => { const next = [...currentScores]; next[i] = v; setCurrentScores(next); }} className={`flex-1 h-10 rounded-xl font-black text-[10px] transition-all border ${currentScores[i] === v ? 'bg-orange-600 border-orange-400 text-white shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-600'}`}>{v}</button>
                                          ))}
                                      </div>
                                  </div>
                              ))}
                              <textarea value={currentNote} onChange={e => setCurrentNote(e.target.value)} placeholder="Coach kommentar..." className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-white outline-none focus:border-orange-500 h-24 resize-none" />
                          </div>
                          <div className="p-6 pt-2 bg-slate-900">
                              <button onClick={() => {
                                  const newEval: Evaluation = { playerId: gradingPlayer.id, exerciseId: selectedExercise.id, scores: currentScores, note: currentNote, timestamp: new Date().toISOString() };
                                  setEvaluations(prev => [...prev.filter(e => e.playerId !== gradingPlayer.id), newEval]);
                                  setGradingPlayer(null);
                              }} className="w-full py-4 rounded-xl bg-orange-600 text-white font-black uppercase text-xs shadow-xl active:scale-95 transition-all">Spara Spelare</button>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      )}
    </div>
  );
};
