
import React, { useState, useMemo, useEffect, useRef } from 'react';
/* Added Check to the lucide-react imports */
import { Swords, Star, Save, Plus, ChevronRight, X, Heart, Zap, Target, MessageCircle, Trophy, Hash, Loader2, Presentation, PenTool, Image as ImageIcon, Trash2, Link as LinkIcon, DownloadCloud, AlertCircle, Clock, Activity, Code, Server, Undo2, Crosshair, Camera, Sparkles, ClipboardPaste, Wand2, Check } from 'lucide-react';
import { dataService } from '../services/dataService';
import { parseMatchText } from '../services/gemini';
import { Player, MatchRecord, MatchFeedback, Shot } from '../types';

interface ImportedMatchEvent {
  time: string;
  type: 'score' | 'foul' | 'timeout' | 'period';
  description: string;
  team: 'us' | 'them';
}

export const MatchEvaluation: React.FC = () => {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MatchRecord | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [magicText, setMagicText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importedEvents, setImportedEvents] = useState<ImportedMatchEvent[]>([]);
  
  const [newMatch, setNewMatch] = useState<{
    opponent: string;
    date: string;
    score: string;
    opponentScore: string;
    teamSummary: string;
    tacticalPlays: string[];
    shots: Shot[];
    feedbacks: Record<string, MatchFeedback>;
  }>({
    opponent: '',
    date: new Date().toISOString().split('T')[0],
    score: '',
    opponentScore: '',
    teamSummary: '',
    tacticalPlays: [],
    shots: [],
    feedbacks: {}
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [p, m] = await Promise.all([
        dataService.getPlayers(),
        dataService.getMatches()
      ]);
      setPlayers(p);
      setMatches(m);
      
      const initialFeedbacks = p.reduce((acc, player) => ({
        ...acc,
        [player.id]: {
          playerId: player.id,
          effort: 3,
          teamwork: 3,
          learning: 3,
          strengths: '',
          improvements: ''
        }
      }), {});

      setNewMatch(prev => ({
        ...prev,
        feedbacks: initialFeedbacks
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMagicImport = async () => {
      if (!magicText.trim()) return;
      
      setImporting(true);
      try {
          const data = await parseMatchText(magicText);
          if (data) {
              setNewMatch(prev => ({
                  ...prev,
                  opponent: data.opponent || "",
                  score: data.score?.toString() || "",
                  opponentScore: data.opponentScore?.toString() || "",
                  date: data.date || prev.date,
                  teamSummary: `Smart Import: Orion HU14 vs ${data.opponent}. ${data.events?.length || 0} händelser analyserade.`
              }));
              setImportedEvents(data.events || []);
              setMagicText(""); // Rensa efter lyckad import
          }
      } catch (err) {
          alert("Kunde inte tolka texten. Försök kopiera mer av sidan.");
      } finally {
          setImporting(false);
      }
  };

  const saveMatch = async () => {
    if (!newMatch.opponent) return;
    setLoading(true);
    await dataService.saveMatch({
      date: newMatch.date,
      opponent: newMatch.opponent,
      score: parseInt(newMatch.score) || 0,
      opponentScore: parseInt(newMatch.opponentScore) || 0,
      teamSummary: newMatch.teamSummary,
      tacticalPlays: newMatch.tacticalPlays,
      shots: newMatch.shots,
      feedbacks: Object.values(newMatch.feedbacks)
    });
    
    await loadData();
    setIsAdding(false);
    setImportedEvents([]);
    
    setNewMatch({
      opponent: '',
      date: new Date().toISOString().split('T')[0],
      score: '',
      opponentScore: '',
      teamSummary: '',
      tacticalPlays: [],
      shots: [],
      feedbacks: players.reduce((acc, p) => ({
        ...acc,
        [p.id]: {
          playerId: p.id,
          effort: 3,
          teamwork: 3,
          learning: 3,
          strengths: '',
          improvements: ''
        }
      }), {})
    });
  };

  const updateFeedback = (playerId: string, field: keyof MatchFeedback, value: any) => {
    setNewMatch(prev => ({
      ...prev,
      feedbacks: {
        ...prev.feedbacks,
        [playerId]: { ...prev.feedbacks[playerId], [field]: value }
      }
    }));
  };

  if (loading && players.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Synkar matcher...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-24">
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-xl md:text-3xl font-black italic uppercase tracking-tighter">Matchanalys</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Orion HU14 Intelligence</p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)} 
            className="px-6 py-3 bg-orange-600 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-orange-900/20 text-white flex items-center gap-2 hover:bg-orange-500 transition-all"
          >
            <Plus size={16} /> Ny Match
          </button>
        )}
      </div>

      {isAdding ? (
        <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
          <div className="p-6 md:p-10 rounded-[2rem] bg-slate-900 border border-slate-800 space-y-8 shadow-2xl">
            
            {/* MAGIC PASTE SECTION */}
            <div className="p-6 rounded-[2rem] bg-gradient-to-br from-indigo-900/20 to-blue-900/10 border border-indigo-500/30 space-y-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Sparkles size={80} className="text-indigo-400" />
                </div>
                
                <div className="flex items-center gap-2 text-indigo-400 relative z-10">
                    <Wand2 size={20} className="animate-pulse" />
                    <h4 className="text-xs font-black uppercase tracking-[0.2em]">Magic Import (Don't Make Me Think)</h4>
                </div>
                
                <div className="space-y-4 relative z-10">
                    <p className="text-xs text-slate-300 font-medium leading-relaxed">
                        Gå till matchen på Profixio, <span className="text-indigo-400 font-bold">Markera allt & Kopiera</span>. 
                        Klistra sedan in röran här nere så fixar AI:n resultatet!
                    </p>
                    
                    <div className="relative">
                        <textarea 
                            value={magicText}
                            onChange={(e) => setMagicText(e.target.value)}
                            placeholder="Klistra in matchdata här..."
                            className="w-full h-32 bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 outline-none focus:border-indigo-500 transition-all custom-scrollbar resize-none"
                        />
                        {magicText && !importing && (
                            <button 
                                onClick={handleMagicImport}
                                className="absolute bottom-4 right-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl animate-in zoom-in"
                            >
                                Kör AI-Analys
                            </button>
                        )}
                        {importing && (
                             <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl animate-in fade-in">
                                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">AI:n läser röran...</span>
                             </div>
                        )}
                    </div>
                </div>

                {importedEvents.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-indigo-500/20 animate-in slide-in-from-top duration-500">
                        <div className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                             <Check size={12} /> Orion HU14 Data Extraherad!
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto custom-scrollbar pr-2">
                            {importedEvents.map((evt, i) => (
                                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-slate-950/50 border border-slate-800/50">
                                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${evt.team === 'us' ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-800 text-slate-400'}`}>{evt.time || "INFO"}</span>
                                    <span className="text-[10px] text-slate-400 truncate">{evt.description}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Motståndare</label>
                <input 
                  value={newMatch.opponent} 
                  onChange={e => setNewMatch({...newMatch, opponent: e.target.value})}
                  placeholder="t.ex. AIK Basket" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white font-bold focus:border-orange-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Datum</label>
                <input 
                  type="date"
                  value={newMatch.date} 
                  onChange={e => setNewMatch({...newMatch, date: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white font-bold focus:border-orange-500 outline-none"
                />
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4 shadow-inner">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block text-center mb-2">Matchresultat</label>
              <div className="flex items-center justify-center gap-8">
                <div className="text-center space-y-2">
                  <span className="text-[10px] font-black text-orange-500 uppercase">Orion</span>
                  <input 
                    type="number"
                    value={newMatch.score}
                    onChange={e => setNewMatch({...newMatch, score: e.target.value})}
                    placeholder="0"
                    className="w-24 h-24 bg-slate-900 border-2 border-slate-800 rounded-[2rem] text-4xl font-black text-white text-center focus:border-orange-500 outline-none shadow-xl"
                  />
                </div>
                <div className="text-4xl font-black text-slate-800 pt-6">-</div>
                <div className="text-center space-y-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase">Motståndare</span>
                  <input 
                    type="number"
                    value={newMatch.opponentScore}
                    onChange={e => setNewMatch({...newMatch, opponentScore: e.target.value})}
                    placeholder="0"
                    className="w-24 h-24 bg-slate-900 border-2 border-slate-800 rounded-[2rem] text-4xl font-black text-white text-center focus:border-orange-500 outline-none shadow-xl"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-sm font-black text-emerald-400 uppercase tracking-tighter italic flex items-center gap-2">
                <ClipboardPaste size={18} /> Individuell Bedömning (SISU)
              </h4>
              <div className="grid gap-4">
                {players.map(p => (
                  <div key={p.id} className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-6">
                    <div className="flex items-center gap-4 border-b border-slate-900 pb-4">
                      <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center font-black text-white italic">#{p.number}</div>
                      <h5 className="text-lg font-black uppercase text-white italic">{p.name}</h5>
                    </div>
                    {newMatch.feedbacks[p.id] && (
                      <div className="grid md:grid-cols-3 gap-6">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-[9px] font-black text-slate-500 uppercase">
                            <span className="flex items-center gap-1"><Zap size={12} className="text-yellow-500"/> Ansträngning</span>
                            <span className="text-white">{newMatch.feedbacks[p.id].effort}/5</span>
                          </div>
                          <input type="range" min="1" max="5" value={newMatch.feedbacks[p.id].effort} onChange={e => updateFeedback(p.id, 'effort', parseInt(e.target.value))} className="w-full h-1.5 bg-slate-900 rounded-full appearance-none accent-orange-600" />
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-[9px] font-black text-slate-500 uppercase">
                            <span className="flex items-center gap-1"><Heart size={12} className="text-rose-500"/> Laganda</span>
                            <span className="text-white">{newMatch.feedbacks[p.id].teamwork}/5</span>
                          </div>
                          <input type="range" min="1" max="5" value={newMatch.feedbacks[p.id].teamwork} onChange={e => updateFeedback(p.id, 'teamwork', parseInt(e.target.value))} className="w-full h-1.5 bg-slate-900 rounded-full appearance-none accent-rose-600" />
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-[9px] font-black text-slate-500 uppercase">
                            <span className="flex items-center gap-1"><Target size={12} className="text-emerald-500"/> Lärande</span>
                            <span className="text-white">{newMatch.feedbacks[p.id].learning}/5</span>
                          </div>
                          <input type="range" min="1" max="5" value={newMatch.feedbacks[p.id].learning} onChange={e => updateFeedback(p.id, 'learning', parseInt(e.target.value))} className="w-full h-1.5 bg-slate-900 rounded-full appearance-none accent-emerald-600" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setIsAdding(false)} className="flex-1 py-4 rounded-xl bg-slate-800 text-slate-400 font-black uppercase text-[10px]">Avbryt</button>
              <button onClick={saveMatch} className="flex-[2] py-4 rounded-xl bg-orange-600 text-white font-black uppercase text-[10px] shadow-xl shadow-orange-900/20">Spara Matchanalys</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {matches.map(m => {
            const isWin = m.score > m.opponentScore;
            return (
              <div key={m.id} onClick={() => setSelectedMatch(selectedMatch?.id === m.id ? null : m)} className="p-6 rounded-[2rem] bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl transition-colors ${isWin ? 'bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20' : 'bg-rose-500/10 text-rose-500 group-hover:bg-rose-500/20'}`}><Trophy size={20} /></div>
                    <div><h4 className="text-lg font-black text-white italic uppercase">{m.opponent}</h4><p className="text-[9px] text-slate-500 font-bold uppercase">{m.date}</p></div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="bg-slate-950 px-6 py-2 rounded-2xl border border-slate-800"><span className="text-2xl font-black text-white">{m.score}</span><span className="mx-2 text-slate-800">-</span><span className="text-2xl font-black text-slate-400">{m.opponentScore}</span></div>
                    <ChevronRight size={20} className={`text-slate-700 transition-transform ${selectedMatch?.id === m.id ? 'rotate-90' : ''}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
