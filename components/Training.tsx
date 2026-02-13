
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { dataService } from '../services/dataService';
import { 
  Play, 
  Pause,
  RotateCcw,
  Square,
  X, 
  History, 
  Zap, 
  Calendar, 
  Users, 
  Star, 
  ChevronLeft,
  ChevronRight,
  Clock, 
  Info, 
  BookOpen, 
  Lightbulb, 
  Save,
  Check,
  Trophy,
  Target,
  Loader2,
  AlertCircle,
  MessageSquare,
  Dumbbell,
  Layout,
  RefreshCw
} from 'lucide-react';
import { Exercise, Player, Evaluation, Attendance, Phase, TrainingSession } from '../types';

type TrainingStep = 'selection' | 'checkin' | 'live';
const DRAFT_KEY = 'basket_coach_training_draft_v2';

export const Training: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sessions' | 'active'>('sessions');
  const [step, setStep] = useState<TrainingStep>('selection');
  
  // Data State
  const [phases, setPhases] = useState<Phase[]>([]);
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  
  const [gradingPlayer, setGradingPlayer] = useState<Player | null>(null);
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const [viewMode, setViewMode] = useState<'basket' | 'fys'>('basket');
  
  // Timer state
  const [timer, setTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(true); // Default to paused

  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [currentScores, setCurrentScores] = useState<number[]>([]);
  const [currentNote, setCurrentNote] = useState<string>("");
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [attendance, setAttendance] = useState<Record<string, 'närvarande' | 'delvis' | 'frånvarande'>>({});
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [allSessions, setAllSessions] = useState<TrainingSession[]>([]);

  // Ladda initial data
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
      
      // Default to first phase if none selected yet
      if (!selectedPhase && ph.length > 0) {
          setSelectedPhase(ph[0]);
      }
      
      // Kolla om det finns ett påbörjat utkast (Draft)
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft && step === 'selection') {
        const parsed = JSON.parse(draft);
        const isToday = new Date(parsed.timestamp).toDateString() === new Date().toDateString();
        if (isToday) {
          setAttendance(parsed.attendance);
          setEvaluations(parsed.evaluations);
          setStep(parsed.step);
          setTimer(parsed.timer || 0);
          setIsPaused(parsed.isPaused ?? true);
          
          const phase = ph.find(phase => phase.id === parsed.phaseId);
          if (phase) {
            setSelectedPhase(phase);
            const ex = phase.exercises.find(e => e.id === parsed.exerciseId);
            if (ex) {
                setSelectedExercise(ex);
                // Set correct view mode based on loaded exercise
                const isFys = ex.category === 'Fysik' || ex.category === 'Kondition';
                setViewMode(isFys ? 'fys' : 'basket');
            }
          }
        }
      } else if (Object.keys(attendance).length === 0) {
        const initialAttendance = p.reduce((acc, player) => ({
          ...acc,
          [player.id]: 'närvarande'
        }), {});
        setAttendance(initialAttendance);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    loadData(); 
  }, [activeTab]);

  // Auto-save Draft
  useEffect(() => {
    if (step !== 'selection' && selectedPhase && selectedExercise) {
      const draftData = {
        timestamp: new Date().toISOString(),
        step,
        phaseId: selectedPhase.id,
        exerciseId: selectedExercise.id,
        attendance,
        evaluations,
        timer,
        isPaused
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
    }
  }, [step, attendance, evaluations, timer, isPaused, selectedPhase, selectedExercise]);

  // Timer logic
  useEffect(() => {
    let interval: number | undefined;
    if (step === 'live' && !isPaused) {
      interval = window.setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    }
    return () => {
      if (interval !== undefined) clearInterval(interval);
    };
  }, [step, isPaused]);

  const togglePause = () => setIsPaused(prev => !prev);
  
  const resetTimer = () => {
    setIsPaused(true);
    setTimer(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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

  const handleUpdateScore = (index: number, value: number) => {
    setCurrentScores(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const saveEvaluationForPlayer = () => {
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
      
      localStorage.removeItem(DRAFT_KEY);
      setShowSaveSuccess(true);
      
      setTimeout(() => {
        setShowSaveSuccess(false);
        setStep('selection');
        setEvaluations([]);
        setAttendance({});
        setTimer(0);
        setIsPaused(true);
        setActiveTab('sessions');
      }, 1500);
    } catch (err) {
      alert("Kunde inte spara till molnet. Kontrollera din anslutning. Datan finns kvar lokalt.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredExercises = selectedPhase?.exercises.filter(ex => {
    const isFys = ex.category === 'Fysik' || ex.category === 'Kondition';
    return viewMode === 'fys' ? isFys : !isFys;
  }) || [];

  if (loading && players.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Synkar träning...</p>
      </div>
    );
  }

  // Handle empty player list (Error state or Empty Roster)
  if (!loading && players.length === 0 && activeTab === 'active') {
      return (
          <div className="max-w-6xl mx-auto p-8 text-center space-y-4 animate-in fade-in">
              <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto border border-slate-800">
                  <Users size={32} className="text-slate-500" />
              </div>
              <div>
                  <h3 className="text-xl font-black text-white uppercase italic">Inga spelare hittades</h3>
                  <p className="text-sm text-slate-400">Kunde inte hämta laglistan. Kontrollera nätverket eller lägg till spelare.</p>
              </div>
              <button 
                  onClick={loadData} 
                  className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 mx-auto"
              >
                  <RefreshCw size={14} /> Försök igen
              </button>
          </div>
      );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4 md:space-y-6 animate-in fade-in duration-500 pb-24 relative">
      {showSaveSuccess && (
        <div className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center animate-in zoom-in duration-300">
          <div className="text-center space-y-4">
            <Trophy size={48} className="text-orange-500 mx-auto" />
            <h2 className="text-3xl font-black italic uppercase text-white">Passet Sparat!</h2>
            <p className="text-emerald-500 font-bold uppercase text-[10px] tracking-widest">Synkat med molnet</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between px-1">
        <div className="flex gap-1 p-1 bg-slate-900 rounded-2xl w-full sm:w-fit border border-slate-800 shadow-xl">
          <button onClick={() => { setActiveTab('sessions'); setSelectedSession(null); }} className={`flex-1 sm:px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'sessions' ? 'bg-orange-600 text-white' : 'text-slate-500'}`}>Historik</button>
          <button onClick={() => setActiveTab('active')} className={`flex-1 sm:px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'active' ? 'bg-orange-600 text-white' : 'text-slate-500'}`}>Ny Träning</button>
        </div>
      </div>

      {activeTab === 'sessions' ? (
        <div className="grid lg:grid-cols-12 gap-6">
          <div className={`${selectedSession ? 'hidden lg:block' : ''} lg:col-span-4 space-y-2`}>
            {allSessions.map(s => (
              <div key={s.id} onClick={() => setSelectedSession(s)} className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${selectedSession?.id === s.id ? 'bg-orange-600/10 border-orange-500' : 'bg-slate-900 border-slate-800'}`}>
                <div className="flex items-center gap-4">
                  <div className="text-center min-w-[40px]"><span className="text-lg font-black text-white">{s.date.split('-')[2]}</span></div>
                  <div><h4 className="font-bold text-xs text-slate-100 uppercase">Fas {s.phaseId}</h4></div>
                </div>
                <ChevronRight size={14} className="text-slate-700" />
              </div>
            ))}
          </div>

          {selectedSession && (
            <div className="lg:col-span-8 animate-in slide-in-from-right duration-300">
              <div className="p-6 md:p-10 rounded-[2.5rem] bg-slate-900 border border-slate-800 space-y-8 shadow-2xl">
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                  <button onClick={() => setSelectedSession(null)} className="lg:hidden flex items-center gap-1 text-slate-500 text-[9px] font-black uppercase"><ChevronLeft size={14}/> Tillbaka</button>
                  <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">{selectedSession.date}</h3>
                  <div className="text-[10px] font-black text-orange-500 uppercase">Fas {selectedSession.phaseId}</div>
                </div>
                
                <div className="grid gap-4">
                  <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Närvaro & Bedömningar</h4>
                  {selectedSession.attendance.map(a => {
                    const player = players.find(p => p.id === a.playerId);
                    const evalForPlayer = selectedSession.evaluations.find(e => e.playerId === a.playerId);
                    
                    return (
                      <div key={a.playerId} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] font-black text-orange-500">#{player?.number}</div>
                              <span className="text-xs font-black text-white uppercase">{player?.name}</span>
                           </div>
                           <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${a.status === 'närvarande' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                              {a.status}
                           </div>
                        </div>
                        
                        {evalForPlayer && (
                          <div className="space-y-2">
                             <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                               {evalForPlayer.scores.map((score, idx) => (
                                 <div key={idx} className="bg-slate-900 p-2 rounded-xl text-center border border-slate-800/50">
                                   <div className="text-[6px] text-slate-600 font-black uppercase mb-1 truncate">Pkt {idx+1}</div>
                                   <div className="text-xs font-black text-orange-500">{score === 0 ? '-' : score}</div>
                                 </div>
                               ))}
                             </div>
                             {evalForPlayer.note && (
                               <div className="p-2 rounded-xl bg-slate-900/50 border border-slate-800 text-[10px] text-slate-400 italic">
                                 {evalForPlayer.note}
                               </div>
                             )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {step === 'selection' && (
            <div className={`p-6 md:p-10 rounded-[2rem] bg-slate-900 border border-slate-800 space-y-8 shadow-2xl animate-in slide-in-from-bottom duration-500 relative overflow-hidden`}>
              {/* Dynamic Header Line */}
              <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${viewMode === 'fys' ? 'from-blue-600 to-cyan-500' : 'from-orange-600 to-orange-500'} transition-all duration-500`}></div>

              <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h3 className="text-xl md:text-3xl font-black text-white italic uppercase tracking-tighter">1. Planering</h3>
                    {localStorage.getItem(DRAFT_KEY) && (
                        <span className="mt-2 inline-block px-3 py-1 bg-slate-800 border border-slate-700 text-slate-400 text-[8px] font-black uppercase rounded-lg animate-pulse">Draft Laddad</span>
                    )}
                </div>

                {/* CATEGORY TOGGLE - Styled consistently */}
                <div className="flex p-1.5 bg-slate-950 rounded-xl border border-slate-800 w-full sm:w-fit shadow-inner">
                  <button 
                    onClick={() => setViewMode('basket')} 
                    className={`flex-1 sm:px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${viewMode === 'basket' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <Layout size={14} /> <span>Basket</span>
                  </button>
                  <button 
                    onClick={() => setViewMode('fys')} 
                    className={`flex-1 sm:px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${viewMode === 'fys' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <Dumbbell size={14} /> <span>Fys</span>
                  </button>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Välj Utvecklingsfas</label>
                   <div className="grid grid-cols-4 gap-2">
                    {phases.map(p => (
                      <button key={p.id} onClick={() => { setSelectedPhase(p); setSelectedExercise(null); }} className={`py-4 rounded-xl font-black text-xs border transition-all ${selectedPhase?.id === p.id ? (viewMode === 'fys' ? 'bg-blue-600 text-white border-blue-400 shadow-lg' : 'bg-orange-600 text-white border-orange-400 shadow-lg') : 'bg-slate-950 border-slate-800 text-slate-600'}`}>{p.id}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Välj Övning ({viewMode === 'basket' ? 'Basket' : 'Fys & Atletism'})</label>
                  <div className="space-y-2">
                    {filteredExercises.length > 0 ? filteredExercises.map(ex => (
                      <button key={ex.id} onClick={() => setSelectedExercise(ex)} className={`w-full p-4 rounded-xl text-left border text-[10px] font-black uppercase transition-all flex items-center justify-between ${selectedExercise?.id === ex.id ? (viewMode === 'fys' ? 'bg-blue-600/10 border-blue-500 text-blue-400' : 'bg-orange-600/10 border-orange-500 text-orange-400') : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}`}>
                        <span>{ex.title}</span>
                        <span className={`text-[8px] font-bold px-2 py-0.5 rounded ${viewMode === 'fys' ? 'bg-blue-900/30 text-blue-500' : 'bg-slate-900 text-slate-600'}`}>{ex.category}</span>
                      </button>
                    )) : (
                      <div className="p-8 border-2 border-dashed border-slate-800 rounded-2xl text-center text-slate-600">
                        <Dumbbell className="mx-auto mb-2 opacity-20" />
                        <span className="text-[9px] font-black uppercase">Inga övningar i denna kategori för Fas {selectedPhase?.id}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <button disabled={!selectedPhase || !selectedExercise} onClick={() => setStep('checkin')} className={`w-full py-5 rounded-2xl text-white font-black uppercase text-xs shadow-xl active:scale-95 transition-all ${!selectedPhase || !selectedExercise ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : (viewMode === 'fys' ? 'bg-blue-600 shadow-blue-900/20' : 'bg-orange-600 shadow-orange-900/20')}`}>Nästa: Incheckning</button>
            </div>
          )}

          {step === 'checkin' && (
            <div className="p-6 md:p-10 rounded-[2rem] bg-slate-900 border border-slate-800 space-y-6 shadow-2xl animate-in slide-in-from-bottom duration-500">
              <div className="flex items-center gap-4">
                <button onClick={() => setStep('selection')} className="p-2 bg-slate-950 rounded-xl border border-slate-800 text-slate-500"><ChevronLeft size={20}/></button>
                <h3 className="text-xl md:text-2xl font-black text-white italic uppercase tracking-tighter">2. Incheckning</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {players.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center font-black text-[10px] text-orange-500">#{p.number}</div>
                       <span className="font-bold text-xs text-slate-200">{p.name}</span>
                    </div>
                    <button 
                      onClick={() => setAttendance(prev => ({ ...prev, [p.id]: prev[p.id] === 'närvarande' ? 'frånvarande' : 'närvarande' }))} 
                      className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${attendance[p.id] === 'närvarande' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-rose-600/10 text-rose-500 border border-rose-500/20'}`}
                    >
                      {attendance[p.id] === 'närvarande' ? 'Närvarande' : 'Borta'}
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={() => setStep('live')} className="w-full py-5 rounded-2xl bg-emerald-600 text-white font-black uppercase text-xs shadow-xl shadow-emerald-900/20 active:scale-95 transition-all">Starta Passet</button>
            </div>
          )}

          {step === 'live' && selectedExercise && (
            <div className="grid lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-12 space-y-4">
                
                {/* TIMER ROW */}
                <div className="p-6 rounded-[2rem] bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
                    {!isPaused && (
                        <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -mr-16 -mt-16 animate-pulse ${viewMode === 'fys' ? 'bg-blue-600/5' : 'bg-orange-600/5'}`}></div>
                    )}

                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-30">
                        <div className="text-center md:text-left space-y-1">
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-center md:justify-start gap-2">
                                <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`}></div>
                                {isPaused ? 'Pausad' : 'Live Träning'}
                            </div>
                            <h3 className="text-xl md:text-3xl font-black text-white italic uppercase tracking-tighter leading-none">{selectedExercise.title}</h3>
                        </div>

                        <div className="flex items-center gap-4 bg-slate-950/80 p-2 rounded-2xl border border-slate-800 backdrop-blur-md shadow-2xl z-40">
                             {/* PLAY/PAUSE Button moved here as Primary Action */}
                             <button 
                                onClick={togglePause}
                                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-lg ml-2 ${isPaused ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-amber-500 text-white hover:bg-amber-400'}`}
                                title={isPaused ? "Starta" : "Pausa"}
                            >
                                {isPaused ? <Play size={20} fill="currentColor" /> : <Pause size={20} fill="currentColor" />}
                            </button>

                             <div className="px-6 py-2 border-x border-slate-800/50">
                                <span className={`text-4xl md:text-5xl font-black tracking-tighter font-mono ${isPaused ? 'text-slate-500' : 'text-white'}`}>
                                    {formatTime(timer)}
                                </span>
                             </div>
                             
                             <div className="flex items-center gap-2 pr-2">
                                <button 
                                    onClick={resetTimer}
                                    className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 border border-slate-700 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-all active:scale-95"
                                    title="Nollställ tid"
                                >
                                    <RotateCcw size={16} />
                                </button>
                             </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-[2rem] bg-slate-900 border border-slate-800 space-y-6 shadow-2xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Utvärdering</span>
                    <span className="text-[10px] font-black text-slate-600 uppercase">Klicka på spelare</span>
                  </div>
                  
                  <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
                    {players.filter(p => attendance[p.id] === 'närvarande').map(p => (
                      <button 
                        key={p.id} 
                        onClick={() => handleStartGradingPlayer(p)} 
                        className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all ${evaluations.some(e => e.playerId === p.id) ? 'border-emerald-500 bg-emerald-600/5' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                      >
                        <div className="flex items-center gap-3">
                           <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] ${evaluations.some(e => e.playerId === p.id) ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-500'}`}>#{p.number}</div>
                           <span className="font-bold text-xs">{p.name}</span>
                        </div>
                        {evaluations.some(e => e.playerId === p.id) ? <Check size={16} className="text-emerald-500" /> : <ChevronRight size={16} className="text-slate-700"/>}
                      </button>
                    ))}
                  </div>
                  <button disabled={isSaving} onClick={handleFinalizeSession} className="w-full py-5 rounded-2xl bg-emerald-600 text-white font-black uppercase text-xs shadow-xl shadow-emerald-900/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    {isSaving ? "Sparar..." : "Slutför & Spara"}
                  </button>
                </div>
              </div>

              {/* GRADING MODAL OVERLAY */}
              {gradingPlayer && selectedExercise && (
                <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                   {/* Standardized Modal Container */}
                   <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 max-h-[85vh]">
                      
                      {/* Sticky Header */}
                      <div className="flex justify-between items-center p-6 pb-4 border-b border-slate-800 bg-slate-900 shrink-0">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-lg font-black text-white italic">#{gradingPlayer.number}</div>
                             <div>
                                <h4 className="font-black text-xl uppercase italic text-white leading-none">{gradingPlayer.name}</h4>
                                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{selectedExercise.title}</span>
                             </div>
                          </div>
                          <button onClick={() => setGradingPlayer(null)} className="p-2 rounded-full hover:bg-slate-800 text-slate-500 hover:text-white transition-colors"><X size={20}/></button>
                      </div>

                      {/* Scrollable Body */}
                      <div className="flex-1 overflow-y-auto p-6 pt-4 custom-scrollbar">
                         <div className="grid gap-6">
                            {selectedExercise.criteria.map((c, i) => (
                              <div key={i} className="space-y-3">
                                <div className="flex justify-between items-center px-1">
                                   <label className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{c}</label>
                                   <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${currentScores[i] >= 4 ? 'text-emerald-500 bg-emerald-500/10' : currentScores[i] <= 2 && currentScores[i] > 0 ? 'text-rose-500 bg-rose-500/10' : currentScores[i] === 0 ? 'text-slate-500 bg-slate-800' : 'text-orange-500 bg-orange-500/10'}`}>
                                     {currentScores[i] === 0 ? 'Ej bedömd' : `Nivå ${currentScores[i]}`}
                                   </span>
                                </div>
                                <div className="flex justify-between gap-1.5">
                                  <button 
                                      onClick={() => handleUpdateScore(i, 0)} 
                                      className={`w-10 h-8 rounded-lg font-black text-[10px] border transition-all ${currentScores[i] === 0 ? 'bg-slate-700 text-white border-slate-500 shadow-xl' : 'bg-slate-950 border-slate-800 text-slate-600 hover:border-slate-700'}`}
                                      title="Ej bedömd"
                                  >
                                      -
                                  </button>
                                  {[1, 2, 3, 4, 5].map(v => (
                                    <button 
                                      key={v} 
                                      onClick={() => handleUpdateScore(i, v)} 
                                      className={`flex-1 h-8 rounded-lg font-black text-[10px] border transition-all ${currentScores[i] === v ? 'bg-orange-600 text-white border-orange-400 shadow-xl scale-105 z-10' : 'bg-slate-950 border-slate-800 text-slate-600 hover:border-slate-700'}`}
                                    >
                                      {v}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}

                            <div className="space-y-3 pt-2 border-t border-slate-800">
                                <label className="text-[10px] text-slate-400 uppercase font-black tracking-widest flex items-center gap-2">
                                  <MessageSquare size={12} /> Kommentar (Valfritt)
                                </label>
                                <textarea 
                                  value={currentNote}
                                  onChange={(e) => setCurrentNote(e.target.value)}
                                  placeholder="Skriv en kort notering..."
                                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-orange-500 h-20 resize-none transition-colors"
                                />
                            </div>
                         </div>
                      </div>

                      {/* Sticky Footer */}
                      <div className="p-6 pt-2 shrink-0 bg-slate-900">
                        <button onClick={saveEvaluationForPlayer} className="w-full py-4 rounded-xl bg-orange-600 text-white font-black uppercase text-xs shadow-xl shadow-orange-900/40 active:scale-95 transition-all">Spara Bedömning</button>
                      </div>
                   </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
