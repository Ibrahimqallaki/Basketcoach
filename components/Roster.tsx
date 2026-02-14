
import React, { useState, useMemo, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { User, Plus, X, Trash2, Star, PenTool, Target, Check, Save, Loader2, Eye, BookPlus, BrainCircuit, Trophy, Dumbbell } from 'lucide-react';
import { Player, Phase, MatchRecord } from '../types';

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
  const [newHomework, setNewHomework] = useState("");

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

  const handleUpdateAssessment = async (skill: string, val: number) => {
    if (!selectedPlayerId) return;
    const updated = await dataService.updatePlayer(selectedPlayerId, { skillAssessment: { ...currentSkills, [skill]: val } });
    setPlayers(updated);
  };

  const handleToggleExercise = async (exId: string) => {
    if (!player) return;
    const plan = player.individualPlan || [];
    const newPlan = plan.includes(exId) ? plan.filter(id => id !== exId) : [...plan, exId];
    setPlayers(await dataService.updatePlayer(player.id, { individualPlan: newPlan }));
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
        accessCode: player?.accessCode || `P-${formData.number}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
      };
      if (modalState.mode === 'add') await dataService.addPlayer(payload);
      else if (modalState.player) await dataService.updatePlayer(modalState.player.id, payload);
      await loadData();
      setModalState({ show: false, mode: 'add' });
    } finally { setSubmitting(false); }
  };

  if (loading && players.length === 0) return <div className="h-full w-full flex items-center justify-center"><Loader2 className="animate-spin text-orange-500" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xl md:text-3xl font-black italic uppercase tracking-tighter text-white">Laget</h3>
        <button onClick={() => { setFormData({ name: '', number: '', position: 'Point Guard (1)', age: '13', notes: '' }); setModalState({ show: true, mode: 'add' }); }} className="px-6 py-3 bg-orange-600 rounded-xl text-[10px] font-black uppercase text-white shadow-lg flex items-center gap-2 hover:bg-orange-500 transition-all"><Plus size={16} /> Lägg till Spelare</button>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className={`lg:col-span-3 space-y-2 ${mobileDetailOpen ? 'hidden lg:block' : 'block'}`}>
          {players.map(p => (
            <div key={p.id} onClick={() => { setSelectedPlayerId(p.id); setMobileDetailOpen(true); }} className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${selectedPlayerId === p.id ? 'bg-orange-600/10 border-orange-500' : 'bg-slate-900 border-slate-800'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${selectedPlayerId === p.id ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-500'}`}>#{p.number}</div>
                <div className="font-bold text-slate-200 text-xs truncate">{p.name}</div>
              </div>
            </div>
          ))}
        </div>

        <div className={`lg:col-span-9 ${mobileDetailOpen ? 'block' : 'hidden lg:block'}`}>
          {player ? (
            <div className="space-y-6 animate-in slide-in-from-bottom">
              <button onClick={() => setMobileDetailOpen(false)} className="lg:hidden flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase mb-4"><X size={14}/> Tillbaka</button>
              <div className="p-6 md:p-8 rounded-[2rem] bg-slate-900 border border-slate-800 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6">
                   <div className="flex items-center gap-6">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-3xl font-black text-orange-500">{player.number}</div>
                      <div>
                        <h2 className="text-2xl md:text-3xl font-black text-white italic uppercase tracking-tighter">{player.name}</h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">{player.position} • {player.age} år</p>
                      </div>
                   </div>
                   <div className="flex gap-2">
                      {player.accessCode && onSimulatePlayerLogin && <button onClick={() => onSimulatePlayerLogin(player)} className="p-3 bg-blue-600/10 text-blue-400 border border-blue-500/20 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Eye size={18}/></button>}
                      <button onClick={() => { setFormData({ name: player.name, number: player.number.toString(), position: player.position || 'Point Guard (1)', age: (player.age || 13).toString(), notes: player.notes || '' }); setModalState({ show: true, mode: 'edit', player }); }} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 text-[9px] font-black uppercase flex items-center gap-2 hover:text-white transition-all"><PenTool size={14}/> Redigera</button>
                   </div>
              </div>

              {/* Assignments */}
              <div className="p-6 md:p-8 rounded-[2rem] bg-slate-900 border border-slate-800 space-y-6">
                 <h3 className="text-[9px] font-black text-slate-500 uppercase flex items-center gap-2"><Dumbbell size={14} className="text-blue-400" /> Hemläxor</h3>
                 <div className="flex gap-2">
                     <input type="text" value={newHomework} onChange={(e) => setNewHomework(e.target.value)} placeholder="Ny läxa..." className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white" />
                     <button onClick={async () => { if(!newHomework.trim()) return; await dataService.addHomework(player.id, newHomework); setNewHomework(""); loadData(); }} className="px-4 py-3 bg-blue-600 rounded-xl text-white font-black text-[10px]">Lägg till</button>
                 </div>
                 <div className="space-y-2">
                     {(player.homework || []).map(hw => (
                         <div key={hw.id} className="p-3 rounded-xl bg-slate-950 flex items-center gap-4">
                             <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${hw.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-700'}`}>{hw.completed && <Check size={12} className="text-white" />}</div>
                             <div className="text-xs font-bold text-white">{hw.title}</div>
                         </div>
                     ))}
                 </div>
              </div>

              {/* Assessment Circle */}
              <div className="p-8 rounded-[2rem] bg-slate-900 border border-slate-800 space-y-8 relative overflow-hidden">
                  <h3 className="text-[9px] font-black text-slate-500 uppercase flex items-center gap-2"><Star size={14} className="text-yellow-500" /> Utveckling</h3>
                  <div className="grid md:grid-cols-2 gap-12 items-center">
                      <div className="space-y-5">
                          {Object.entries(currentSkills).map(([skill, val]) => (
                              <div key={skill} className="space-y-2 group">
                                  <div className="flex justify-between text-[9px] font-black uppercase text-slate-400"><span>{skill}</span><span className="text-white">{val}/10</span></div>
                                  <input type="range" min="1" max="10" value={val} onChange={(e) => handleUpdateAssessment(skill, parseInt(e.target.value))} className="w-full h-1.5 bg-slate-950 rounded-full appearance-none accent-orange-600" />
                              </div>
                          ))}
                      </div>
                      <div className="bg-slate-950 rounded-[3rem] p-8 flex flex-col items-center">
                          <RadarChart skills={currentSkills} />
                      </div>
                  </div>
              </div>
            </div>
          ) : <div className="h-64 border-2 border-dashed border-slate-800 rounded-[2rem] flex items-center justify-center text-slate-700 uppercase font-black text-[10px]">Välj spelare</div>}
        </div>
      </div>

      {/* PLAYER MODAL */}
      {modalState.show && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2rem] shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center p-6 border-b border-slate-800">
              <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">{modalState.mode === 'add' ? 'Ny Spelare' : 'Redigera Spelare'}</h3>
              <button onClick={() => setModalState({ show: false, mode: 'add' })}><X size={20} className="text-slate-500" /></button>
            </div>
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <input required placeholder="Namn" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:border-orange-500 outline-none" />
              <div className="grid grid-cols-2 gap-4">
                <input required type="number" placeholder="Nummer" value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white" />
                <input type="number" placeholder="Ålder" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white" />
              </div>
              <button disabled={submitting} type="submit" className="w-full py-4 bg-orange-600 text-white rounded-xl font-black uppercase text-xs shadow-lg hover:bg-orange-500 transition-all">
                {submitting ? <Loader2 className="animate-spin" /> : 'Spara Spelare'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
