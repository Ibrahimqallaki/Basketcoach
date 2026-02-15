
import React, { useState, useMemo, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { User, Plus, X, Trash2, Star, PenTool, Target, Check, Save, Loader2, Eye, BookPlus, BrainCircuit, Trophy, Dumbbell, ChevronRight, BookOpen, Search, Copy, Key, RefreshCcw, CloudCheck, CloudUpload } from 'lucide-react';
import { Player, Phase, MatchRecord, Exercise } from '../types';

interface RosterProps {
    onSimulatePlayerLogin?: (player: Player) => void;
}

export const SKILL_COLORS: Record<string, string> = {
    'Skytte': 'bg-rose-500', 'Dribbling': 'bg-amber-500', 'Passning': 'bg-blue-500',
    'Försvar': 'bg-emerald-500', 'Spelförståelse': 'bg-purple-500', 'Kondition': 'bg-cyan-500', 'Fysik': 'bg-indigo-500'
};

const RadarChart = ({ skills }: { skills: Record<string, number> }) => {
    const entries = Object.entries(skills);
    const radius = 70;
    const center = 100;
    const points = entries.map(([name, value], i) => {
        const angle = (Math.PI * 2 * i) / entries.length - Math.PI / 2;
        const r = (value / 10) * radius;
        return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
    });
    const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
    return (
        <div className="relative w-full aspect-square max-w-[240px] mx-auto animate-in zoom-in duration-700">
            <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
                {[0.4, 0.7, 1.0].map((s, i) => <circle key={i} cx={center} cy={center} r={radius * s} fill="none" stroke="white" strokeWidth="0.5" strokeOpacity="0.05" />)}
                <path d={path} fill="rgba(249, 115, 22, 0.15)" stroke="#f97316" strokeWidth="2.5" className="drop-shadow-[0_0_10px_rgba(249,115,22,0.4)]" />
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
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [newHomework, setNewHomework] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [codeSyncStatus, setCodeSyncStatus] = useState<'idle' | 'saving' | 'synced' | 'error'>('idle');

  const [formData, setFormData] = useState({ name: '', number: '', position: 'Point Guard (1)', age: '13', notes: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const [p, ph, m] = await Promise.all([dataService.getPlayers(), dataService.getUnifiedPhases(), dataService.getMatches()]);
      setPlayers(p);
      setPhases(ph);
      setMatches(m);
      if (p.length > 0 && !selectedPlayerId) setSelectedPlayerId(p[0].id);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const player = useMemo(() => players.find(p => p.id === selectedPlayerId), [players, selectedPlayerId]);
  const currentSkills = useMemo(() => player?.skillAssessment || { 'Skytte': 5, 'Dribbling': 5, 'Passning': 5, 'Försvar': 5, 'Spelförståelse': 5, 'Kondition': 5, 'Fysik': 5 }, [player]);
  
  const allExercises = useMemo(() => phases.flatMap(p => p.exercises.map(ex => ({ ...ex, phaseTitle: p.title }))), [phases]);
  const assignedExercises = useMemo(() => {
    if (!player?.individualPlan) return [];
    return player.individualPlan.map(id => allExercises.find(ex => ex.id === id)).filter((ex): ex is (Exercise & { phaseTitle: string }) => !!ex);
  }, [player, allExercises]);

  const handleUpdateAssessment = async (skill: string, val: number) => {
    if (!selectedPlayerId) return;
    const updated = await dataService.updatePlayer(selectedPlayerId, { skillAssessment: { ...currentSkills, [skill]: val } });
    setPlayers(updated);
  };

  const handleToggleExercise = async (exerciseId: string) => {
    if (!player) return;
    const currentPlan = player.individualPlan || [];
    const newPlan = currentPlan.includes(exerciseId)
        ? currentPlan.filter(id => id !== exerciseId)
        : [...currentPlan, exerciseId];
    
    const updated = await dataService.updatePlayer(player.id, { individualPlan: newPlan });
    setPlayers(updated);
  };

  const handleCopyCode = () => {
    if (player?.accessCode) {
        navigator.clipboard.writeText(player.accessCode);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleGenerateNewCode = async () => {
    if (!player) return;
    setIsGeneratingCode(true);
    setCodeSyncStatus('saving');
    try {
        const newCode = dataService.generateSecureCode(player.number);
        // Vänta explicit på att databasen bekräftar skrivningen
        const updated = await dataService.updatePlayer(player.id, { accessCode: newCode });
        setPlayers(updated);
        setCodeSyncStatus('synced');
        setTimeout(() => setCodeSyncStatus('idle'), 3000);
    } catch (err) {
        console.error("Code gen error", err);
        setCodeSyncStatus('error');
    } finally {
        setIsGeneratingCode(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        number: parseInt(formData.number) || 0,
        position: formData.position,
        age: parseInt(formData.age) || 13,
        notes: formData.notes,
        accessCode: player?.accessCode || dataService.generateSecureCode(formData.number)
      };
      if (modalState.mode === 'add') await dataService.addPlayer(payload);
      else if (modalState.player) await dataService.updatePlayer(modalState.player.id, payload);
      await loadData();
      setModalState({ show: false, mode: 'add' });
    } finally { setSubmitting(false); }
  };

  const handleDeletePlayer = async (id: string) => {
      if (!confirm("Är du säker på att du vill ta bort spelaren? All historik försvinner.")) return;
      const updated = await dataService.deletePlayer(id);
      setPlayers(updated);
      if (updated.length > 0) setSelectedPlayerId(updated[0].id);
      else setSelectedPlayerId(null);
  };

  if (loading && players.length === 0) return <div className="h-full w-full flex items-center justify-center"><Loader2 className="animate-spin text-orange-500" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xl md:text-3xl font-black italic uppercase tracking-tighter text-white">Laget</h3>
        <button onClick={() => { 
            setFormData({ name: '', number: '', position: 'Point Guard (1)', age: '13', notes: '' }); 
            setModalState({ show: true, mode: 'add' }); 
        }} className="px-6 py-3 bg-orange-600 rounded-xl text-[10px] font-black uppercase text-white shadow-lg flex items-center gap-2 hover:bg-orange-500 transition-all">
            <Plus size={16} /> Lägg till Spelare
        </button>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className={`lg:col-span-3 space-y-2 ${mobileDetailOpen ? 'hidden lg:block' : 'block'}`}>
          {players.map(p => (
            <div key={p.id} onClick={() => { setSelectedPlayerId(p.id); setMobileDetailOpen(true); }} className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${selectedPlayerId === p.id ? 'bg-orange-600/10 border-orange-500 shadow-md' : 'bg-slate-900 border-slate-800'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${selectedPlayerId === p.id ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-500'}`}>#{p.number}</div>
                <div className="font-bold text-slate-200 text-xs truncate max-w-[120px]">{p.name}</div>
              </div>
              <ChevronRight size={14} className={selectedPlayerId === p.id ? 'text-orange-500' : 'text-slate-800'} />
            </div>
          ))}
        </div>

        <div className={`lg:col-span-9 ${mobileDetailOpen ? 'block' : 'hidden lg:block'}`}>
          {player ? (
            <div className="space-y-6 animate-in slide-in-from-bottom">
              <button onClick={() => setMobileDetailOpen(false)} className="lg:hidden flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase mb-4"><X size={14}/> Tillbaka</button>
              
              {/* Header Card */}
              <div className="p-6 md:p-8 rounded-[2rem] bg-slate-900 border border-slate-800 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6">
                   <div className="flex items-center gap-6">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-3xl font-black text-orange-500 shadow-inner">{player.number}</div>
                      <div>
                        <h2 className="text-2xl md:text-3xl font-black text-white italic uppercase tracking-tighter">{player.name}</h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">{player.position} • {player.age} år</p>
                      </div>
                   </div>
                   <div className="flex gap-2 w-full md:w-auto">
                      {player.accessCode && onSimulatePlayerLogin && <button onClick={() => onSimulatePlayerLogin(player)} className="flex-1 md:flex-none p-3 bg-blue-600/10 text-blue-400 border border-blue-500/20 rounded-xl hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center" title="Visa som spelare"><Eye size={18}/></button>}
                      <button onClick={() => { setFormData({ name: player.name, number: player.number.toString(), position: player.position || 'Point Guard (1)', age: (player.age || 13).toString(), notes: player.notes || '' }); setModalState({ show: true, mode: 'edit', player }); }} className="flex-[2] md:flex-none px-6 py-2 rounded-xl bg-slate-800 text-slate-400 text-[9px] font-black uppercase flex items-center justify-center gap-2 hover:text-white transition-all shadow-lg"><PenTool size={14}/> Redigera</button>
                      <button onClick={() => handleDeletePlayer(player.id)} className="p-3 bg-rose-600/10 text-rose-500 border border-rose-500/20 rounded-xl hover:bg-rose-600 hover:text-white transition-all"><Trash2 size={18}/></button>
                   </div>
              </div>

              {/* INLOGGNINGSKOD - MED SYNK-STATUS */}
              <div className="p-6 md:p-8 rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-blue-900/10 border border-blue-500/20 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <Key size={24} />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inloggningskod för Spelarportal</h4>
                    <div className="flex items-center gap-3">
                        <div className="text-xl font-mono font-black text-white tracking-widest uppercase mt-1">{player.accessCode || 'Ej skapad'}</div>
                        {player.accessCode && (
                            <button 
                                onClick={handleGenerateNewCode}
                                disabled={isGeneratingCode}
                                className="p-1 text-slate-600 hover:text-blue-400 transition-colors"
                                title="Återställ/Byt kod"
                            >
                                <RefreshCcw size={14} className={isGeneratingCode ? 'animate-spin' : ''} />
                            </button>
                        )}
                    </div>
                    {/* STATUS INDIKATOR */}
                    <div className="mt-2 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 h-4">
                        {codeSyncStatus === 'saving' && <><Loader2 size={10} className="animate-spin text-blue-400"/> <span className="text-blue-400">Sparar i databas...</span></>}
                        {codeSyncStatus === 'synced' && <><CloudCheck size={12} className="text-emerald-500"/> <span className="text-emerald-500">Synkad till molnet</span></>}
                        {codeSyncStatus === 'error' && <span className="text-rose-500">Kunde inte spara. Kontrollera nätverk.</span>}
                        {codeSyncStatus === 'idle' && player.accessCode && <span className="text-slate-600">Aktiv</span>}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 w-full md:w-auto relative z-10">
                    {!player.accessCode ? (
                        <button 
                            onClick={handleGenerateNewCode}
                            disabled={isGeneratingCode}
                            className="flex-1 md:flex-none px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg"
                        >
                            {isGeneratingCode ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                            Generera Kod
                        </button>
                    ) : (
                        <button 
                            onClick={handleCopyCode}
                            className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 ${copySuccess ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'}`}
                        >
                            {copySuccess ? <Check size={14} /> : <Copy size={14} />}
                            {copySuccess ? 'Kopierad!' : 'Kopiera Kod'}
                        </button>
                    )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Hemläxor */}
                <div className="p-6 md:p-8 rounded-[2rem] bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
                   <h3 className="text-[9px] font-black text-slate-500 uppercase flex items-center gap-2 tracking-widest"><Dumbbell size={14} className="text-blue-400" /> Aktiva Uppdrag</h3>
                   <div className="flex gap-2">
                       <input type="text" value={newHomework} onChange={(e) => setNewHomework(e.target.value)} placeholder="Skriv ett nytt uppdrag..." className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-blue-500" />
                       <button onClick={async () => { if(!newHomework.trim()) return; await dataService.addHomework(player.id, newHomework); setNewHomework(""); loadData(); }} className="px-6 py-3 bg-blue-600 rounded-xl text-white font-black text-[10px] uppercase shadow-lg shadow-blue-900/20">Lägg till</button>
                   </div>
                   <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                       {(player.homework || []).map(hw => (
                           <div key={hw.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-4 group">
                               <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${hw.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-800'}`}>{hw.completed && <Check size={12} className="text-white" />}</div>
                               <div className={`text-xs font-bold flex-1 ${hw.completed ? 'text-slate-600 line-through' : 'text-slate-200'}`}>{hw.title}</div>
                           </div>
                       ))}
                       {(player.homework || []).length === 0 && <p className="text-[10px] text-slate-600 font-bold uppercase text-center py-4">Inga uppdrag än</p>}
                   </div>
                </div>

                {/* INDIVIDUELL PLAN */}
                <div className="p-6 md:p-8 rounded-[2rem] bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
                    <div className="flex justify-between items-center">
                        <h3 className="text-[9px] font-black text-slate-500 uppercase flex items-center gap-2 tracking-widest"><Target size={14} className="text-purple-400" /> Individuell Utvecklingsplan</h3>
                        <button onClick={() => setShowExercisePicker(true)} className="p-2 bg-purple-600/10 text-purple-400 rounded-lg hover:bg-purple-600 hover:text-white transition-all"><BookPlus size={16}/></button>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                        {assignedExercises.map(ex => (
                            <div key={ex.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between group">
                                <div className="min-w-0">
                                    <div className="text-[8px] font-black text-purple-400 uppercase tracking-widest truncate">{ex.phaseTitle}</div>
                                    <div className="text-xs font-bold text-white truncate">{ex.title}</div>
                                </div>
                                <button onClick={() => handleToggleExercise(ex.id)} className="p-2 text-slate-700 hover:text-rose-500"><X size={14}/></button>
                            </div>
                        ))}
                        {assignedExercises.length === 0 && (
                            <div className="text-center py-8 space-y-3">
                                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-600"><BookOpen size={18}/></div>
                                <p className="text-[10px] text-slate-600 font-bold uppercase">Inga övningar tilldelade</p>
                            </div>
                        )}
                    </div>
                </div>
              </div>

              {/* Utveckling Chart */}
              <div className="p-8 rounded-[2rem] bg-slate-900 border border-slate-800 space-y-8 relative overflow-hidden shadow-2xl">
                  <h3 className="text-[9px] font-black text-slate-500 uppercase flex items-center gap-2 tracking-widest"><Star size={14} className="text-yellow-500" /> Färdighetsbedömning</h3>
                  <div className="grid md:grid-cols-2 gap-12 items-center">
                      <div className="space-y-6">
                          {Object.entries(currentSkills).map(([skill, val]) => (
                              <div key={skill} className="space-y-2 group">
                                  <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 group-hover:text-slate-200 transition-colors">
                                      <span>{skill}</span>
                                      <span className="text-white">{val}/10</span>
                                  </div>
                                  <div className="relative pt-1">
                                      <input 
                                          type="range" 
                                          min="1" 
                                          max="10" 
                                          value={val} 
                                          onChange={(e) => handleUpdateAssessment(skill, parseInt(e.target.value))} 
                                          className="w-full h-1.5 bg-slate-950 rounded-full appearance-none accent-orange-600 cursor-pointer shadow-inner" 
                                      />
                                  </div>
                              </div>
                          ))}
                      </div>
                      <div className="bg-slate-950 rounded-[3rem] p-10 flex flex-col items-center shadow-inner border border-slate-800">
                          <RadarChart skills={currentSkills} />
                          <div className="mt-6 text-center">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Utvecklingsgraf</p>
                          </div>
                      </div>
                  </div>
              </div>
            </div>
          ) : (
            <div className="h-64 border-2 border-dashed border-slate-800 rounded-[2rem] flex flex-col items-center justify-center text-slate-700 space-y-4">
                <User size={48} className="opacity-10" />
                <p className="text-[10px] font-black uppercase tracking-widest">Välj en spelare för att se detaljer</p>
            </div>
          )}
        </div>
      </div>

      {/* EXERCISE PICKER MODAL */}
      {showExercisePicker && (
          <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
              <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95">
                  <div className="p-8 border-b border-slate-800 flex justify-between items-center shrink-0">
                      <div>
                          <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Välj övningar</h3>
                          <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Tilldela till {player?.name}</p>
                      </div>
                      <button onClick={() => setShowExercisePicker(false)} className="p-2 bg-slate-800 rounded-full text-slate-500 hover:text-white"><X size={20}/></button>
                  </div>
                  
                  <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center gap-4 px-8">
                      <Search size={18} className="text-slate-600" />
                      <input 
                        type="text" 
                        placeholder="Sök övning eller kategori..." 
                        value={exerciseSearch}
                        onChange={(e) => setExerciseSearch(e.target.value)}
                        className="bg-transparent border-none outline-none text-sm text-white w-full py-2"
                      />
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar space-y-8">
                      {phases.map(ph => {
                          const filtered = ph.exercises.filter(ex => 
                            ex.title.toLowerCase().includes(exerciseSearch.toLowerCase()) || 
                            ex.category.toLowerCase().includes(exerciseSearch.toLowerCase())
                          );
                          if (filtered.length === 0) return null;
                          return (
                              <div key={ph.id} className="space-y-3">
                                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-l-2 border-orange-500 pl-3">{ph.title}</h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {filtered.map(ex => {
                                          const isActive = player?.individualPlan?.includes(ex.id);
                                          return (
                                              <button 
                                                key={ex.id} 
                                                onClick={() => handleToggleExercise(ex.id)}
                                                className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${isActive ? 'bg-purple-600/10 border-purple-500' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                                              >
                                                  <div className="min-w-0">
                                                      <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{ex.category}</div>
                                                      <div className={`text-xs font-bold truncate ${isActive ? 'text-purple-400' : 'text-white'}`}>{ex.title}</div>
                                                  </div>
                                                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isActive ? 'bg-purple-500 border-purple-500' : 'border-slate-800'}`}>
                                                      {isActive && <Check size={12} className="text-white" />}
                                                  </div>
                                              </button>
                                          );
                                      })}
                                  </div>
                              </div>
                          );
                      })}
                  </div>

                  <div className="p-8 bg-slate-950/50 border-t border-slate-800 shrink-0">
                      <button onClick={() => setShowExercisePicker(false)} className="w-full py-4 rounded-xl bg-slate-800 text-white font-black uppercase text-[10px] tracking-widest shadow-xl">Färdig</button>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL FÖR SPELARE INFO */}
      {modalState.show && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
            <div className="flex justify-between items-center p-8 border-b border-slate-800 bg-slate-900 shrink-0">
              <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                {modalState.mode === 'add' ? 'Ny Spelare' : 'Redigera Spelare'}
              </h3>
              <button onClick={() => setModalState({ show: false, mode: 'add' })} className="p-2 bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="p-8 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Namn</label>
                <input 
                  required 
                  placeholder="t.ex. Aldrin" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:border-orange-500 outline-none shadow-inner" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Nummer</label>
                  <input 
                    required 
                    type="number" 
                    placeholder="10" 
                    value={formData.number} 
                    onChange={e => setFormData({...formData, number: e.target.value})} 
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:border-orange-500 outline-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Ålder</label>
                  <input 
                    type="number" 
                    placeholder="13" 
                    value={formData.age} 
                    onChange={e => setFormData({...formData, age: e.target.value})} 
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:border-orange-500 outline-none" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Position</label>
                <select 
                  value={formData.position} 
                  onChange={e => setFormData({...formData, position: e.target.value})} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:border-orange-500 outline-none appearance-none"
                >
                    <option>Point Guard (1)</option>
                    <option>Shooting Guard (2)</option>
                    <option>Small Forward (3)</option>
                    <option>Power Forward (4)</option>
                    <option>Center (5)</option>
                </select>
              </div>

              <div className="pt-4">
                <button 
                  disabled={submitting} 
                  type="submit" 
                  className="w-full py-5 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-orange-900/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                  <span>{modalState.mode === 'add' ? 'Skapa Spelare' : 'Spara Ändringar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
