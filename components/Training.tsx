
import React, { useState, useMemo, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { 
  Play, Pause, RotateCcw, X, ChevronRight, Save, Check, Trophy, Loader2, 
  Dumbbell, Layout, ChevronLeft, UserCheck, Activity, BrainCircuit, 
  Target, Zap, MessageSquare, Mic, Eye, Shield, Flame, Timer, Star, 
  ArrowUpCircle, Scaling, Trash2, Info, CheckCircle2
} from 'lucide-react';
import { Exercise, Player, Evaluation, Phase, TrainingSession, WarmupExercise } from '../types';
import { mockWarmupExercises } from '../services/mockData';
import { WarmupLibrary } from './WarmupLibrary';

type TrainingStep = 'selection' | 'planning' | 'checkin' | 'live';

interface PlaylistItem {
  id: string;
  title: string;
  duration: number; // seconds
  type: 'warmup' | 'main';
  exercise: Exercise | WarmupExercise;
}

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
  const [activeTab, setActiveTab] = useState<'sessions' | 'active'>('active');
  const [step, setStep] = useState<TrainingStep>('selection');
  const [phases, setPhases] = useState<Phase[]>([]);
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState<number>(0);
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
  const [selectedWarmupIds, setSelectedWarmupIds] = useState<string[]>([]);
  const [showWarmupLibrary, setShowWarmupLibrary] = useState(false);
  const [timerMode, setTimerMode] = useState<'stopwatch' | 'countdown'>('stopwatch');
  const [countdownTime, setCountdownTime] = useState(600);
  const [showCheatSheet, setShowCheatSheet] = useState(false);

  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [newExerciseTime, setNewExerciseTime] = useState(10);
  const [newExerciseSelection, setNewExerciseSelection] = useState<Exercise | null>(null);

  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [activePlaylistItemIndex, setActivePlaylistItemIndex] = useState(0);

  const [currentScores, setCurrentScores] = useState<number[]>([]);
  const [currentNote, setCurrentNote] = useState<string>("");

  const handleStartPlanning = () => {
    const newPlaylist: PlaylistItem[] = [];
    
    // Add warmups
    selectedWarmupIds.forEach(id => {
        const warmup = mockWarmupExercises.find(w => w.id === id);
        if (warmup) {
            newPlaylist.push({
                id: warmup.id,
                title: warmup.title,
                duration: parseInt(warmup.duration) * 60 || 300,
                type: 'warmup',
                exercise: warmup
            });
        }
    });
    
    // Add main exercises
    selectedExercises.forEach(ex => {
        newPlaylist.push({
            id: ex.id,
            title: ex.title,
            duration: parseInt(ex.duration || '10') * 60 || 600,
            type: 'main',
            exercise: ex
        });
    });
    
    setPlaylist(newPlaylist);
    setStep('planning');
  };

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
      interval = window.setInterval(() => {
        if (timerMode === 'stopwatch') {
          setTimer(t => t + 1);
        } else {
          setCountdownTime(t => {
            if (t <= 1) {
              setIsPaused(true);
              return 0;
            }
            return t - 1;
          });
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, isPaused, timerMode]);

  const activeCriteria = viewMode === 'basket' ? BASKET_CRITERIA : FYS_CRITERIA;

  const handleStartGradingPlayer = (p: Player) => {
    if(playlist.length === 0) return;
    const currentItem = playlist[activePlaylistItemIndex];
    if (currentItem.type !== 'main') return;
    setGradingPlayer(p);
    const existing = evaluations.find(e => e.playerId === p.id && e.exerciseId === currentItem.id);
    if (existing) {
      setCurrentScores([...existing.scores]);
      setCurrentNote(existing.note || "");
    } else {
      setCurrentScores(new Array(5).fill(3));
      setCurrentNote("");
    }
  };

  const savePlayerEvaluation = () => {
    if (!gradingPlayer || playlist.length === 0) return;
    const currentItem = playlist[activePlaylistItemIndex];
    if (currentItem.type !== 'main') return;
    const newEval: Evaluation = { 
        playerId: gradingPlayer.id, 
        exerciseId: currentItem.id, 
        scores: currentScores, 
        note: currentNote, 
        timestamp: new Date().toISOString() 
    };
    setEvaluations(prev => [...prev.filter(e => !(e.playerId === gradingPlayer.id && e.exerciseId === currentItem.id)), newEval]);
    setGradingPlayer(null);
  };

  const handleFinalizeSession = async () => {
    if(!selectedPhase || playlist.length === 0) return;
    setIsSaving(true);
    try {
      await dataService.saveSession({
        date: new Date().toISOString().split('T')[0],
        phaseId: selectedPhase.id,
        warmupExerciseIds: playlist.filter(i => i.type === 'warmup').map(i => i.id),
        exerciseIds: playlist.filter(i => i.type === 'main').map(i => i.id),
        attendance: players.map(p => ({ playerId: p.id, status: attendance[p.id] || 'frånvarande' })),
        evaluations: evaluations
      });
      setShowSaveSuccess(true);
      setTimeout(() => {
        setShowSaveSuccess(false);
        setStep('selection');
        setEvaluations([]);
        setSelectedWarmupIds([]);
        setSelectedExercises([]);
        setPlaylist([]);
        setActivePlaylistItemIndex(0);
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
                  <div key={s.id} className="relative group">
                    <div 
                      onClick={() => setSelectedSession(s)} 
                      className={`p-4 pr-16 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${selectedSession?.id === s.id ? 'bg-orange-600/10 border-orange-500' : 'bg-slate-900 border-slate-800 hover:border-slate-600'}`}
                    >
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-950 flex items-center justify-center font-black text-xs text-white border border-slate-800">{s.date.split('-')[2]}</div>
                          <div className="text-xs font-black text-slate-300 uppercase tracking-tighter">Fas {s.phaseId} Pass</div>
                      </div>
                      <ChevronRight size={14} className="text-slate-700" />
                    </div>
                    {/* Radera-knapp: Placerad säkert i mitten/höger för att undvika felklick */}
                    <button 
                      onClick={(e) => handleDeleteSession(s.id, e)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100 z-10"
                      title="Ta bort pass"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )) : <p className="text-slate-600 p-8 text-center text-xs font-bold uppercase tracking-widest border-2 border-dashed border-slate-900 rounded-3xl">Inga sparade pass än.</p>}
              </div>
              {selectedSession && (
                  <div className="lg:col-span-8 p-4 sm:p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] bg-slate-900 border border-slate-800 shadow-2xl space-y-6 sm:space-y-8 animate-in slide-in-from-right relative overflow-hidden">
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
                  <div className="p-4 sm:p-8 md:p-12 rounded-3xl md:rounded-[3rem] bg-slate-900 border border-slate-800 space-y-6 sm:space-y-10 shadow-2xl animate-in slide-in-from-bottom relative overflow-hidden">
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
                          <div className="md:col-span-4 space-y-6">
                              <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Välj Fas</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {phases.map(p => (
                                        <button key={p.id} onClick={() => setSelectedPhase(p)} className={`py-4 rounded-xl font-black text-sm border transition-all ${selectedPhase?.id === p.id ? (viewMode === 'fys' ? 'bg-blue-600 border-blue-400' : 'bg-orange-600 border-orange-400') + ' text-white shadow-lg scale-105' : 'bg-slate-950 border-slate-800 text-slate-600 hover:border-slate-600'}`}>{p.id}</button>
                                    ))}
                                </div>
                              </div>

                              <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
                                <div className="flex justify-between items-center">
                                  <h4 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2"><Flame size={14} className="text-orange-500" /> Uppvärmning</h4>
                                  <span className="text-[10px] font-black text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-lg">{selectedWarmupIds.length} valda</span>
                                </div>
                                <button 
                                  onClick={() => setShowWarmupLibrary(true)}
                                  className="w-full py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-[10px] font-black uppercase hover:border-orange-500/50 transition-all flex items-center justify-center gap-2"
                                >
                                  {selectedWarmupIds.length > 0 ? 'Ändra Uppvärmning' : 'Välj från SBBF-arkiv'}
                                  <ChevronRight size={14} />
                                </button>
                                {selectedWarmupIds.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {selectedWarmupIds.map(id => (
                                      <div key={id} className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[8px] font-black text-slate-500 uppercase">
                                        {id.startsWith('w') ? 'SBBF Övning' : 'Övning'}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                          </div>
                          <div className="md:col-span-8 space-y-2">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Välj Huvudövning(ar)</label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
                                  {selectedPhase?.exercises.filter(ex => {
                                      const isFys = ex.category === 'Fysik' || ex.category === 'Kondition';
                                      return viewMode === 'fys' ? isFys : !isFys;
                                  }).map(ex => {
                                      const isSelected = selectedExercises.some(e => e.id === ex.id);
                                      return (
                                          <button 
                                              key={ex.id} 
                                              onClick={() => {
                                                  if (isSelected) setSelectedExercises(prev => prev.filter(e => e.id !== ex.id));
                                                  else setSelectedExercises(prev => [...prev, ex]);
                                              }} 
                                              className={`p-4 rounded-xl text-left border text-[10px] font-black uppercase transition-all ${isSelected ? 'border-orange-500 bg-orange-500/10 text-orange-400 shadow-inner' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                                          >
                                              {ex.title}
                                          </button>
                                      );
                                  })}
                              </div>
                          </div>
                      </div>
                      <button disabled={selectedExercises.length === 0} onClick={handleStartPlanning} className="w-full py-6 rounded-[2rem] bg-slate-800 hover:bg-slate-700 text-white font-black uppercase text-xs shadow-xl active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3">Planera passet <ChevronRight size={18}/></button>
                  </div>
              )}

              {step === 'planning' && (
                  <div className="p-4 sm:p-8 md:p-12 rounded-3xl md:rounded-[3rem] bg-slate-900 border border-slate-800 space-y-6 sm:space-y-8 shadow-2xl animate-in slide-in-from-right">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-4 sm:pb-6">
                        <div>
                            <button onClick={() => setStep('selection')} className="text-slate-500 hover:text-white flex items-center gap-1 text-[9px] font-black uppercase mb-2"><ChevronLeft size={14}/> Tillbaka till val</button>
                            <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">Planera Tidslinje</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">Sätt tider för varje moment</p>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Tid</div>
                            <div className="text-2xl font-black text-orange-500 italic uppercase">{Math.round(playlist.reduce((acc, curr) => acc + curr.duration, 0) / 60)} min</div>
                        </div>
                      </div>

                      <div className="space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
                          {playlist.map((item, idx) => (
                              <div key={`${item.id}-${idx}`} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-slate-600 transition-all">
                                  <div className="flex items-center gap-4">
                                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${item.type === 'warmup' ? 'bg-orange-500/10 text-orange-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                          {idx + 1}
                                      </div>
                                      <div>
                                          <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{item.type === 'warmup' ? 'Uppvärmning' : 'Huvudövning'}</div>
                                          <div className="text-sm font-black text-white uppercase">{item.title}</div>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-3 bg-slate-900 p-2 rounded-xl border border-slate-800">
                                      <button 
                                          onClick={() => {
                                              const newPlaylist = [...playlist];
                                              newPlaylist[idx].duration = Math.max(60, newPlaylist[idx].duration - 60);
                                              setPlaylist(newPlaylist);
                                          }}
                                          className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-black"
                                      >-</button>
                                      <div className="flex items-center gap-2 px-2">
                                          <input 
                                              type="number" 
                                              value={Math.round(item.duration / 60)}
                                              onChange={(e) => {
                                                  const newPlaylist = [...playlist];
                                                  newPlaylist[idx].duration = Math.max(1, parseInt(e.target.value) || 0) * 60;
                                                  setPlaylist(newPlaylist);
                                              }}
                                              className="w-12 bg-transparent text-white font-black text-center outline-none"
                                          />
                                          <span className="text-[10px] font-black text-slate-500 uppercase">min</span>
                                      </div>
                                      <button 
                                          onClick={() => {
                                              const newPlaylist = [...playlist];
                                              newPlaylist[idx].duration += 60;
                                              setPlaylist(newPlaylist);
                                          }}
                                          className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-black"
                                      >+</button>
                                  </div>
                              </div>
                          ))}
                      </div>

                      <button onClick={() => setStep('checkin')} className="w-full py-6 rounded-[2rem] bg-orange-600 hover:bg-orange-500 text-white font-black uppercase text-xs shadow-xl shadow-orange-900/20 active:scale-95 transition-all flex items-center justify-center gap-3">Fortsätt till närvaro <ChevronRight size={18}/></button>
                  </div>
              )}

              {step === 'checkin' && playlist.length > 0 && (
                  <div className="p-4 sm:p-8 md:p-12 rounded-3xl md:rounded-[3rem] bg-slate-900 border border-slate-800 space-y-6 sm:space-y-8 shadow-2xl animate-in slide-in-from-right">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-4 sm:pb-6">
                        <div>
                            <button onClick={() => setStep('planning')} className="text-slate-500 hover:text-white flex items-center gap-1 text-[9px] font-black uppercase mb-2"><ChevronLeft size={14}/> Ändra planering</button>
                            <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">Närvarokontroll</h3>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                            <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Planerade Moment</div>
                            <div className="text-xs font-black text-orange-500 uppercase">{playlist.length} st</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
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

              {step === 'live' && playlist.length > 0 && (
                  <div className="space-y-6">
                      {/* STICKY HEADER */}
                      <div className="sticky top-0 z-40 -mx-4 px-4 sm:-mx-8 sm:px-8 pt-4 pb-4 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800 shadow-2xl rounded-b-3xl transition-all">
                          <div className="flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
                              <div className="flex-1 min-w-0 w-full text-center md:text-left">
                                  <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                          <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-500' : (timerMode === 'countdown' && countdownTime === 0 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]')}`}></div>
                                          {isPaused ? 'Pausad' : (timerMode === 'countdown' && countdownTime === 0 ? 'Tiden är slut!' : 'Träning Pågår')}
                                      </div>
                                      <div className="px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-[9px] font-black text-slate-400 uppercase">
                                          {playlist[activePlaylistItemIndex]?.type === 'main' ? (
                                              `${evaluations.filter(e => e.exerciseId === playlist[activePlaylistItemIndex].id).length} / ${players.filter(p => attendance[p.id] === 'närvarande' || attendance[p.id] === 'delvis').length} Bedömda`
                                          ) : (
                                              'Uppvärmning'
                                          )}
                                      </div>
                                  </div>
                                  
                                  <div className="flex items-center justify-center md:justify-start gap-3">
                                      <h3 className="text-2xl md:text-3xl font-black text-white italic uppercase tracking-tighter leading-none truncate">{playlist[activePlaylistItemIndex]?.title}</h3>
                                      {playlist[activePlaylistItemIndex]?.type === 'main' && (
                                          <button onClick={() => setShowCheatSheet(!showCheatSheet)} className={`p-1.5 rounded-lg transition-colors shrink-0 ${showCheatSheet ? 'bg-orange-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-400'}`} title="Visa övningsdetaljer">
                                              <Info size={16} />
                                          </button>
                                      )}
                                  </div>

                                  {/* PLAYLIST TABS - Improved for mobile */}
                                  <div className="w-full mt-3">
                                      <div className="flex items-center justify-between mb-1 px-1">
                                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Moment {activePlaylistItemIndex + 1} av {playlist.length}</span>
                                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest sm:hidden">Svep för fler →</span>
                                      </div>
                                      <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scroll-smooth custom-scrollbar-horizontal">
                                          {playlist.map((item, idx) => (
                                              <button 
                                                  key={`${item.id}-${idx}`}
                                                  onClick={() => {
                                                      setActivePlaylistItemIndex(idx);
                                                      setTimer(0);
                                                      setCountdownTime(item.duration);
                                                      setTimerMode('countdown');
                                                      setIsPaused(true);
                                                  }}
                                                  className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase transition-all shrink-0 snap-start border ${idx === activePlaylistItemIndex 
                                                      ? (item.type === 'warmup' ? 'bg-orange-600 border-orange-400 text-white shadow-lg shadow-orange-900/20' : 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-900/20') 
                                                      : 'bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}
                                              >
                                                  <span className="opacity-50 mr-1">{idx + 1}.</span> {item.title}
                                              </button>
                                          ))}
                                          <button 
                                              onClick={() => {
                                                  setNewExerciseSelection(null);
                                                  setNewExerciseTime(10);
                                                  setShowAddExerciseModal(true);
                                              }}
                                              className="px-3 py-2 rounded-xl text-[9px] font-black uppercase transition-all shrink-0 bg-slate-950 text-slate-500 hover:bg-slate-900 hover:text-white flex items-center gap-1 border border-dashed border-slate-700 snap-start"
                                          >
                                              + Lägg till
                                          </button>
                                      </div>
                                  </div>
                              </div>

                              <div className="flex flex-col items-center gap-2">
                                  <div className="flex items-center gap-4">
                                      {timerMode === 'countdown' && (
                                          <button onClick={() => setCountdownTime(Math.max(0, countdownTime - 60))} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all font-black text-xs">-1m</button>
                                      )}
                                      
                                      <div className={`text-5xl md:text-6xl font-black font-mono tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] cursor-pointer transition-colors ${timerMode === 'countdown' && countdownTime === 0 ? 'text-rose-500 animate-pulse' : 'text-white'}`} onClick={() => setTimerMode(m => m === 'stopwatch' ? 'countdown' : 'stopwatch')} title="Klicka för att byta mellan tidtagarur och nedräkning">
                                          {timerMode === 'stopwatch' 
                                              ? `${Math.floor(timer/60)}:${String(timer%60).padStart(2, '0')}`
                                              : `${Math.floor(countdownTime/60)}:${String(countdownTime%60).padStart(2, '0')}`
                                          }
                                      </div>

                                      {timerMode === 'countdown' && (
                                          <button onClick={() => setCountdownTime(countdownTime + 60)} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all font-black text-xs">+1m</button>
                                      )}
                                  </div>
                                  
                                  <div className="flex gap-2">
                                      <button onClick={() => setIsPaused(!isPaused)} className={`w-12 h-10 rounded-xl flex items-center justify-center ${isPaused ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20' : 'bg-amber-500 hover:bg-amber-400 shadow-amber-900/20'} text-white shadow-xl transition-all`}>{isPaused ? <Play size={18} fill="currentColor" /> : <Pause size={18} fill="currentColor" />}</button>
                                      <button onClick={() => { setTimer(0); setCountdownTime(600); setIsPaused(true); }} className="w-12 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 flex items-center justify-center transition-all"><RotateCcw size={16} /></button>
                                  </div>
                              </div>
                          </div>

                          {showCheatSheet && playlist[activePlaylistItemIndex]?.type === 'main' && (
                              <div className="mt-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl text-left animate-in slide-in-from-top-2 duration-200">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                          <h5 className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">Översikt</h5>
                                          <ul className="text-xs text-slate-300 space-y-1">
                                              <li><span className="font-bold text-slate-500">Setup:</span> {(playlist[activePlaylistItemIndex].exercise as Exercise).overview.setup}</li>
                                              <li><span className="font-bold text-slate-500">Action:</span> {(playlist[activePlaylistItemIndex].exercise as Exercise).overview.action}</li>
                                              <li><span className="font-bold text-emerald-500">Fokus:</span> {(playlist[activePlaylistItemIndex].exercise as Exercise).overview.coachingPoint}</li>
                                          </ul>
                                      </div>
                                      <div>
                                          <h5 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Pedagogik</h5>
                                          <ul className="text-xs text-slate-300 space-y-1">
                                              <li><span className="font-bold text-slate-500">Vad:</span> {(playlist[activePlaylistItemIndex].exercise as Exercise).pedagogy?.what || 'Ej angivet'}</li>
                                              <li><span className="font-bold text-slate-500">Hur:</span> {(playlist[activePlaylistItemIndex].exercise as Exercise).pedagogy?.how || 'Ej angivet'}</li>
                                              <li><span className="font-bold text-slate-500">Varför:</span> {(playlist[activePlaylistItemIndex].exercise as Exercise).pedagogy?.why || 'Ej angivet'}</li>
                                          </ul>
                                      </div>
                                  </div>
                              </div>
                          )}
                      </div>

                      <div className="px-4 sm:px-0 space-y-4">
                          {playlist[activePlaylistItemIndex]?.type === 'warmup' && (
                              <div className="p-6 rounded-[2.5rem] bg-orange-600/10 border border-orange-500/20 space-y-4 animate-in zoom-in-95">
                                  <div className="flex items-center gap-3">
                                      <div className="p-3 bg-orange-600 rounded-2xl text-white shadow-lg shadow-orange-900/20">
                                          <Flame size={24} />
                                      </div>
                                      <div>
                                          <div className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Aktiv Uppvärmning</div>
                                          <h4 className="text-xl font-black text-white uppercase italic">{(playlist[activePlaylistItemIndex].exercise as WarmupExercise).phase}</h4>
                                      </div>
                                  </div>
                                  <p className="text-sm text-slate-300 leading-relaxed font-medium">{(playlist[activePlaylistItemIndex].exercise as WarmupExercise).description}</p>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="space-y-4">
                                          {(playlist[activePlaylistItemIndex].exercise as WarmupExercise).setup && (
                                              <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800">
                                                  <div className="text-[8px] font-black text-blue-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                      <Target size={12} /> Organisation
                                                  </div>
                                                  <p className="text-[10px] font-bold text-slate-300 uppercase">{(playlist[activePlaylistItemIndex].exercise as WarmupExercise).setup}</p>
                                              </div>
                                          )}

                                          <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800">
                                              <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                  <CheckCircle2 size={12} className="text-emerald-500" /> Coaching Points
                                              </div>
                                              <ul className="space-y-1">
                                                  {(playlist[activePlaylistItemIndex].exercise as WarmupExercise).coachingPoints.map((cp, i) => (
                                                      <li key={i} className="text-[10px] text-slate-300 flex items-start gap-2">
                                                          <span className="text-orange-500 mt-1">•</span> {cp}
                                                      </li>
                                                  ))}
                                              </ul>
                                          </div>
                                      </div>

                                      <div className="space-y-4">
                                          {(playlist[activePlaylistItemIndex].exercise as WarmupExercise).visualSteps && (playlist[activePlaylistItemIndex].exercise as WarmupExercise).visualSteps!.length > 0 && (
                                              <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800">
                                                  <div className="text-[8px] font-black text-purple-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                      <Activity size={12} /> Steg-för-steg
                                                  </div>
                                                  <div className="space-y-2">
                                                      {(playlist[activePlaylistItemIndex].exercise as WarmupExercise).visualSteps!.map((step, i) => (
                                                          <div key={i} className="flex items-center gap-2">
                                                              <div className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[8px] font-black text-purple-500 shrink-0 border border-purple-500/20">{i + 1}</div>
                                                              <span className="text-[10px] font-bold text-slate-300 uppercase">{step}</span>
                                                          </div>
                                                      ))}
                                                  </div>
                                              </div>
                                          )}

                                          <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800">
                                              <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                  <Flame size={12} className="text-orange-500" /> SBBF Fokus
                                              </div>
                                              <div className="text-[10px] font-black text-white uppercase italic">{(playlist[activePlaylistItemIndex].exercise as WarmupExercise).sbbfFocus}</div>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          )}

                          {playlist[activePlaylistItemIndex]?.type === 'main' && (
                              <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                                  {activeCriteria.map((c, i) => (
                                      <div key={i} className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2 shrink-0">
                                          <c.icon size={12} className={viewMode === 'basket' ? 'text-orange-500' : 'text-blue-500'} />
                                          <span className="text-[10px] font-black text-white uppercase">{c.label}</span>
                                      </div>
                                  ))}
                              </div>
                          )}
                      </div>

                      <div className="grid md:grid-cols-12 gap-4 sm:gap-6 items-start px-4 sm:px-0">
                        <div className="md:col-span-8 p-4 sm:p-8 rounded-3xl md:rounded-[3rem] bg-slate-900 border border-slate-800 space-y-4 sm:space-y-6 shadow-2xl relative overflow-hidden">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-2"><UserCheck size={14} /> Spelarbedömning</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
                                {players.filter(p => attendance[p.id] === 'närvarande' || attendance[p.id] === 'delvis').map(p => {
                                    const isGraded = evaluations.some(e => e.playerId === p.id && e.exerciseId === playlist[activePlaylistItemIndex].id);
                                    const playerEvals = evaluations.filter(e => e.playerId === p.id && e.exerciseId === playlist[activePlaylistItemIndex].id);
                                    const scoreAvg = isGraded ? (playerEvals[0].scores.reduce((a,b)=>a+b,0)! / 5).toFixed(1) : null;
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
                        <div className="md:col-span-4 p-5 sm:p-8 rounded-3xl md:rounded-[3rem] bg-slate-900 border border-slate-800 shadow-2xl space-y-4 sm:space-y-6 text-center">
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

              {gradingPlayer && playlist.length > 0 && (
                  <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md">
                      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/40 shrink-0">
                              <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-2xl bg-orange-600 flex items-center justify-center font-black text-xl text-white shadow-xl italic">#{gradingPlayer.number}</div>
                                  <div>
                                      <h4 className="text-xl font-black text-white uppercase italic leading-none">{gradingPlayer.name}</h4>
                                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">{playlist[activePlaylistItemIndex].title}</p>
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
                                                    className={`flex-1 h-10 rounded-xl font-black text-xs transition-all border ${currentScores[i] === v ? (viewMode === 'basket' ? 'bg-orange-600 border-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.3)]' : 'bg-blue-600 border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.3)]') + ' text-white scale-[1.05] z-10' : 'bg-slate-900 border-slate-800 text-slate-600 hover:text-slate-400'}`}
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

      {showAddExerciseModal && (
          <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md">
              <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/40 shrink-0">
                      <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Välj Nästa Övning</h3>
                      <button onClick={() => setShowAddExerciseModal(false)} className="p-2.5 bg-slate-800 rounded-full hover:bg-slate-700 text-slate-400 transition-colors"><X size={20}/></button>
                  </div>
                  <div className="p-6 md:p-8 space-y-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
                      {/* Exercise Selection */}
                      <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">1. Välj Övning</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {selectedPhase?.exercises.filter(ex => {
                                  const isFys = ex.category === 'Fysik' || ex.category === 'Kondition';
                                  return viewMode === 'fys' ? isFys : !isFys;
                              }).map(ex => (
                                  <button 
                                      key={ex.id} 
                                      onClick={() => setNewExerciseSelection(ex)} 
                                      className={`p-4 rounded-xl text-left border text-[10px] font-black uppercase transition-all ${newExerciseSelection?.id === ex.id ? 'border-orange-500 bg-orange-500/10 text-orange-400 shadow-inner' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                                  >
                                      {ex.title}
                                  </button>
                              ))}
                          </div>
                      </div>

                      {/* Time Selection */}
                      <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">2. Sätt Tid (Minuter)</label>
                          <div className="flex gap-2">
                              {[5, 10, 15, 20].map(t => (
                                  <button 
                                      key={t}
                                      onClick={() => setNewExerciseTime(t)}
                                      className={`flex-1 py-4 rounded-xl font-black text-sm border transition-all ${newExerciseTime === t ? 'bg-orange-600 border-orange-400 text-white shadow-lg scale-105' : 'bg-slate-950 border-slate-800 text-slate-600 hover:border-slate-600'}`}
                                  >
                                      {t} min
                                  </button>
                              ))}
                          </div>
                          <div className="flex items-center gap-4 mt-4 p-4 bg-slate-950 rounded-xl border border-slate-800">
                              <span className="text-xs font-black text-slate-500 uppercase">Annan tid:</span>
                              <input 
                                  type="number" 
                                  value={newExerciseTime} 
                                  onChange={(e) => setNewExerciseTime(Number(e.target.value))}
                                  className="w-20 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-black text-center outline-none focus:border-orange-500"
                                  min="1"
                              />
                              <span className="text-xs font-black text-slate-500 uppercase">minuter</span>
                          </div>
                      </div>
                  </div>
                  <div className="p-6 md:p-8 bg-slate-950/60 border-t border-slate-800 shrink-0">
                      <button 
                          disabled={!newExerciseSelection}
                          onClick={() => {
                              if (newExerciseSelection) {
                                  const newItem: PlaylistItem = {
                                      id: newExerciseSelection.id,
                                      title: newExerciseSelection.title,
                                      duration: newExerciseTime * 60,
                                      type: 'main',
                                      exercise: newExerciseSelection
                                  };
                                  setPlaylist(prev => [...prev, newItem]);
                                  setActivePlaylistItemIndex(playlist.length);
                                  setCountdownTime(newExerciseTime * 60);
                                  setTimerMode('countdown');
                                  setTimer(0);
                                  setIsPaused(true);
                                  setShowAddExerciseModal(false);
                              }
                          }} 
                          className="w-full py-5 rounded-[2rem] bg-orange-600 hover:bg-orange-500 text-white font-black uppercase text-xs shadow-xl shadow-orange-900/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                          Lägg till & Starta Nästa <Play size={16} fill="currentColor" />
                      </button>
                  </div>
              </div>
          </div>
      )}

      {showWarmupLibrary && (
        <div className="fixed inset-0 z-[700] bg-slate-950/95 backdrop-blur-xl p-4 md:p-10 overflow-y-auto custom-scrollbar">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
              <button 
                onClick={() => setShowWarmupLibrary(false)}
                className="px-6 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-white text-xs font-black uppercase flex items-center gap-2 hover:bg-slate-800 transition-all"
              >
                <ChevronLeft size={16} /> Tillbaka till setup
              </button>
              <div className="text-right">
                <div className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Valda övningar</div>
                <div className="text-2xl font-black text-white italic uppercase">{selectedWarmupIds.length} st</div>
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-[3rem] p-8 md:p-12">
              <WarmupLibrary 
                isSelectionMode={true}
                selectedIds={selectedWarmupIds}
                onSelect={(ex) => {
                  setSelectedWarmupIds(prev => 
                    prev.includes(ex.id) ? prev.filter(id => id !== ex.id) : [...prev, ex.id]
                  );
                }}
              />
            </div>

            <button 
              onClick={() => setShowWarmupLibrary(false)}
              className="w-full py-6 rounded-[2rem] bg-orange-600 text-white font-black uppercase text-sm shadow-2xl shadow-orange-900/40 flex items-center justify-center gap-3 active:scale-95 transition-all"
            >
              Bekräfta Uppvärmningsplan <Check size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
