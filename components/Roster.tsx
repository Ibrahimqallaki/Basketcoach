
import React, { useState, useMemo, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { User, Plus, X, Trash2, Star, ClipboardList, PenTool, MessageSquare, PlusCircle, Target, Check, Save, Loader2, Key, Dumbbell, ExternalLink, RefreshCw, Eye } from 'lucide-react';
import { Player } from '../types';

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

export const Roster: React.FC<RosterProps> = ({ onSimulatePlayerLogin }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{ show: boolean, mode: 'add' | 'edit', player?: Player }>({ show: false, mode: 'add' });
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const isSuperAdmin = dataService.isSuperAdmin();
  const [newHomework, setNewHomework] = useState("");

  const [formData, setFormData] = useState({
    name: '',
    number: '',
    position: 'Point Guard (1)',
    level: 'Nybörjare',
    age: '13',
    notes: ''
  });

  const loadPlayers = async () => {
    setLoading(true);
    try {
      const p = await dataService.getPlayers();
      setPlayers(p);
      if (p.length > 0 && !selectedPlayerId) {
        setSelectedPlayerId(p[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlayers();
  }, []);

  const player = useMemo(() => players.find(p => p.id === selectedPlayerId), [players, selectedPlayerId]);

  const currentSkills = useMemo((): Record<string, number> => {
    const defaultSkills = {
      'Skytte': 5,
      'Dribbling': 5,
      'Passning': 5,
      'Försvar': 5,
      'Spelförståelse': 5,
      'Kondition': 5,
      'Fysik': 5
    };
    return player?.skillAssessment && Object.keys(player.skillAssessment).length > 0 
      ? (player.skillAssessment as Record<string, number>)
      : defaultSkills;
  }, [player]);

  const handleUpdateAssessment = async (category: string, value: number) => {
    if (!selectedPlayerId) return;
    const updatedAssessment = { ...currentSkills, [category]: value };
    const updated = await dataService.updatePlayer(selectedPlayerId, { skillAssessment: updatedAssessment });
    setPlayers(updated);
  };

  const handleGenerateCode = async () => {
    if (!player) return;
    const code = dataService.generatePlayerCode(player);
    const updated = await dataService.updatePlayer(player.id, { accessCode: code });
    setPlayers(updated);
  };

  const handleAddHomework = async () => {
    if (!player || !newHomework.trim()) return;
    await dataService.addHomework(player.id, newHomework);
    setNewHomework("");
    const updated = await dataService.getPlayers();
    setPlayers(updated);
  };

  const openAddModal = () => {
    setFormData({ name: '', number: '', position: 'Point Guard (1)', level: 'Nybörjare', age: '13', notes: '' });
    setModalState({ show: true, mode: 'add' });
  };

  const openEditModal = () => {
    if (!player) return;
    setFormData({
      name: player.name,
      number: player.number.toString(),
      position: player.position || 'Point Guard (1)',
      level: player.level || 'Nybörjare',
      age: player.age?.toString() || '13',
      notes: player.notes || ''
    });
    setModalState({ show: true, mode: 'edit', player });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        number: parseInt(formData.number) || 0,
        position: formData.position,
        level: formData.level,
        age: parseInt(formData.age) || 13,
        notes: formData.notes
      };
      if (modalState.mode === 'add') {
        await dataService.addPlayer(payload);
      } else if (modalState.mode === 'edit' && modalState.player) {
        await dataService.updatePlayer(modalState.player.id, payload);
      }
      await loadPlayers();
      setModalState({ show: false, mode: 'add' });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSubmitting(true);
    try {
      await dataService.deletePlayer(id);
      const updated = await dataService.getPlayers();
      setPlayers(updated);
      setDeleteConfirmId(null);
      if (selectedPlayerId === id) {
        setSelectedPlayerId(updated.length > 0 ? updated[0].id : null);
        setMobileDetailOpen(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && players.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Hämtar spelarlista...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4 md:space-y-8 animate-in slide-in-from-right duration-500 pb-24 md:pb-0">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter">Laget</h3>
        <button onClick={openAddModal} className="px-4 py-2 bg-orange-600 rounded-xl text-xs font-black shadow-lg shadow-orange-900/20 text-white flex items-center gap-2">
          <Plus size={16} /> Lägg till
        </button>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        <div className={`lg:col-span-3 space-y-2 ${mobileDetailOpen ? 'hidden lg:block' : 'block'}`}>
          {players.length > 0 ? players.map(p => (
            <div
              key={p.id}
              onClick={() => { setSelectedPlayerId(p.id); setMobileDetailOpen(true); }}
              className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${selectedPlayerId === p.id ? 'bg-orange-600/10 border-orange-500 shadow-lg' : 'bg-slate-900 border-slate-800'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${selectedPlayerId === p.id ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                  #{p.number}
                </div>
                <div className="font-bold text-slate-200 text-xs truncate">{p.name}</div>
              </div>
            </div>
          )) : (
             <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-center space-y-2">
                <p className="text-[10px] text-slate-500 font-bold uppercase">Inga spelare hittades</p>
             </div>
          )}
        </div>

        <div className={`lg:col-span-9 ${mobileDetailOpen ? 'block' : 'hidden lg:block'}`}>
          {player ? (
            <div className="space-y-6 animate-in slide-in-from-bottom duration-300">
              <button onClick={() => setMobileDetailOpen(false)} className="lg:hidden flex items-center gap-1 text-slate-500 text-[10px] font-black uppercase mb-2">
                <X size={14}/> Tillbaka till listan
              </button>

              <div className="p-5 md:p-8 rounded-[2rem] bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                   <div className="flex items-center gap-4 md:gap-6">
                      <div className="w-14 h-14 md:w-20 md:h-20 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-2xl md:text-3xl font-black text-orange-500 shadow-inner">
                        {player.number}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h2 className="text-2xl md:text-3xl font-black text-white italic uppercase leading-none">{player.name}</h2>
                          <span className="px-2 py-0.5 rounded bg-blue-600/20 text-blue-400 text-[7px] md:text-[8px] font-black uppercase">{player.position}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">{player.age || 13} år • Nivå {player.level}</p>
                      </div>
                   </div>
                   
                   <div className="w-full md:w-auto p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center gap-2">
                        {player.accessCode ? (
                            <>
                                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Spelarkod</div>
                                <div className="text-xl font-black text-white font-mono tracking-wider">{player.accessCode}</div>
                                {onSimulatePlayerLogin && (
                                    <button 
                                        onClick={() => onSimulatePlayerLogin(player)}
                                        className="text-[9px] font-black text-blue-500 uppercase flex items-center gap-1 hover:text-blue-400 mt-1"
                                    >
                                        <Eye size={12} /> Visa Portal
                                    </button>
                                )}
                            </>
                        ) : (
                            <button onClick={handleGenerateCode} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[9px] font-black uppercase flex items-center gap-2">
                                <Key size={12} /> Skapa inloggning
                            </button>
                        )}
                   </div>

                   <div className="flex gap-2 w-full md:w-auto">
                      <button onClick={openEditModal} className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-slate-800 text-slate-400 text-[9px] font-black uppercase flex items-center justify-center gap-2 hover:text-white transition-all"><PenTool size={14}/> Redigera</button>
                      {isSuperAdmin && (
                          <button onClick={() => setDeleteConfirmId(player.id)} className="p-2 w-10 h-10 rounded-xl bg-rose-600/10 text-rose-500 border border-rose-500/20 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all"><Trash2 size={16}/></button>
                      )}
                   </div>
                </div>
              </div>

              <div className="grid md:grid-cols-12 gap-6">
                <div className="md:col-span-12 p-6 md:p-8 rounded-[2rem] bg-slate-900 border border-slate-800 space-y-6">
                    <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Star size={14} className="text-yellow-500" /> Synkroniserad Bedömning</h3>
                    <div className="grid md:grid-cols-2 gap-12">
                        <div className="space-y-6">
                            {Object.entries(currentSkills).map(([skill, val]) => (
                                <div key={skill} className="space-y-2 group">
                                    <div className="flex justify-between text-[9px] font-black uppercase text-slate-400 group-hover:text-slate-200 transition-colors">
                                        <span>{skill}</span>
                                        <span className="font-mono text-white">{val}/10</span>
                                    </div>
                                    <div className="relative h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                        <div 
                                            className={`absolute top-0 left-0 h-full transition-all duration-700 ease-out rounded-full ${SKILL_COLORS[skill] || 'bg-orange-500'} shadow-[0_0_15px_rgba(255,255,255,0.1)]`} 
                                            style={{ width: `${(val as number) * 10}%` }}
                                        />
                                    </div>
                                    <input 
                                        type="range" 
                                        min="1" 
                                        max="10" 
                                        value={val} 
                                        onChange={(e) => handleUpdateAssessment(skill, parseInt(e.target.value))}
                                        className="w-full h-1.5 bg-transparent appearance-none cursor-pointer accent-white relative z-10 -mt-4 opacity-0 hover:opacity-100 transition-opacity"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col items-center justify-center bg-slate-950 rounded-[3rem] border border-slate-800 p-10 relative overflow-hidden">
                             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-500/5 via-transparent to-transparent"></div>
                             <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center mb-6 border border-slate-800 shadow-2xl group relative z-10">
                                <Target size={40} className="text-orange-500 group-hover:scale-110 transition-transform" />
                             </div>
                             <div className="text-center space-y-2 relative z-10">
                                <h4 className="text-sm font-black text-white uppercase italic tracking-widest">Realtidssynk</h4>
                                <p className="text-slate-500 italic text-[10px] max-w-[180px] leading-relaxed">Dina ändringar syns direkt i spelarens mobilapp.</p>
                             </div>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-12 p-6 md:p-8 rounded-[2rem] bg-slate-900 border border-slate-800 space-y-6">
                   <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Dumbbell size={14} className="text-blue-400" /> Coachuppdrag</h3>
                   <div className="flex gap-2">
                       <input type="text" value={newHomework} onChange={(e) => setNewHomework(e.target.value)} placeholder="T.ex. Skjut 50 straffkast..." className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-blue-500" onKeyDown={(e) => e.key === 'Enter' && handleAddHomework()} />
                       <button onClick={handleAddHomework} disabled={!newHomework.trim()} className="px-4 py-3 bg-blue-600 rounded-xl text-white font-black uppercase text-[10px] hover:bg-blue-500 disabled:opacity-50">Lägg till</button>
                   </div>
                   <div className="space-y-2">
                       {(player.homework || []).map(hw => (
                           <div key={hw.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-4">
                               <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${hw.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-700'}`}>{hw.completed && <Check size={12} className="text-white" />}</div>
                               <div className="flex-1"><div className={`text-xs font-bold ${hw.completed ? 'text-slate-500 line-through' : 'text-white'}`}>{hw.title}</div></div>
                               <button onClick={() => {
                                   const newHw = (player.homework || []).filter(h => h.id !== hw.id);
                                   dataService.updatePlayer(player.id, { homework: newHw });
                                   setPlayers(prev => prev.map(p => p.id === player.id ? {...p, homework: newHw} : p));
                               }} className="text-slate-600 hover:text-rose-500 transition-colors"><X size={14}/></button>
                           </div>
                       ))}
                   </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 border-2 border-dashed border-slate-800 rounded-[2rem] flex flex-col items-center justify-center text-slate-700 text-center">
              <User size={32} className="opacity-10 mb-2" />
              <p className="text-[10px] font-bold uppercase tracking-widest">Välj spelare i listan</p>
            </div>
          )}
        </div>
      </div>

      {modalState.show && (
        <div className="fixed inset-0 z-[600] flex items-start md:items-center justify-center p-4 pt-12 md:p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 max-h-[85vh]">
            <div className="flex justify-between items-center p-6 pb-4 border-b border-slate-800 bg-slate-900 shrink-0">
              <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">{modalState.mode === 'add' ? 'Ny Spelare' : 'Redigera Spelare'}</h3>
              <button onClick={() => setModalState({ show: false, mode: 'add' })} className="p-2 rounded-full hover:bg-slate-800 text-slate-500 hover:text-white transition-colors"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 pt-4 custom-scrollbar space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Namn</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:border-orange-500 outline-none transition-all" placeholder="Förnamn Efternamn" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Nummer</label>
                    <input required type="number" value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:border-orange-500 outline-none" />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Ålder</label>
                    <input type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:border-orange-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Position</label>
                    <select value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:border-orange-500 outline-none">
                        <option>Point Guard (1)</option>
                        <option>Shooting Guard (2)</option>
                        <option>Small Forward (3)</option>
                        <option>Power Forward (4)</option>
                        <option>Center (5)</option>
                        <option>Guard</option>
                        <option>Forward</option>
                    </select>
                </div>
              </div>
              <div className="pt-6">
                 <button disabled={submitting} type="submit" className="w-full py-4 bg-orange-600 text-white rounded-xl font-black uppercase text-xs flex items-center justify-center gap-2 hover:bg-orange-500 transition-all shadow-lg">
                    {submitting ? <Loader2 className="animate-spin" /> : <Save size={16} />}
                    <span>Spara Spelare</span>
                  </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-[600] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="max-sm w-full p-8 rounded-[2rem] bg-slate-900 border border-slate-800 shadow-2xl text-center space-y-6 animate-in zoom-in duration-200">
            <Trash2 size={48} className="text-rose-500 mx-auto" />
            <h4 className="text-xl font-black text-white italic uppercase">Ta bort spelare?</h4>
            <div className="flex gap-4">
              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-400 font-black uppercase text-[10px]">Avbryt</button>
              <button disabled={submitting} onClick={(e) => confirmDelete(deleteConfirmId, e)} className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-black uppercase text-[10px] flex items-center justify-center gap-2">
                {submitting && <Loader2 className="w-3 h-3 animate-spin" />} Ta bort
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
