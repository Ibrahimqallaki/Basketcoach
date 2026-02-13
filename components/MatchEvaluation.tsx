
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Swords, Star, Save, Plus, ChevronRight, X, Heart, Zap, Target, MessageCircle, Trophy, Hash, Loader2, Presentation, PenTool, Image as ImageIcon, Trash2, Link as LinkIcon, DownloadCloud, AlertCircle, Clock, Activity, Code, Server, Undo2, Crosshair, ClipboardPaste, Sparkles } from 'lucide-react';
import { dataService } from '../services/dataService';
import { parseProfixioData } from '../services/gemini';
import { Player, MatchRecord, MatchFeedback, Shot } from '../types';
import { TacticalWhiteboard } from './TacticalWhiteboard';

// Interface for the rich data we eventually want to fetch from the cloud
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
  
  // Whiteboard State
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  
  // Shot Chart State
  const [shotMode, setShotMode] = useState<'make' | 'miss'>('make');
  
  // Profixio Smart Import State
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importedEvents, setImportedEvents] = useState<ImportedMatchEvent[]>([]);
  const [showImportArea, setShowImportArea] = useState(false);
  
  // Local state for new match
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

  const handleSmartImport = async () => {
    if (!importText.trim()) return;
    setImporting(true);
    try {
        const data = await parseProfixioData(importText);
        
        setNewMatch(prev => ({
            ...prev,
            opponent: data.opponent || prev.opponent,
            score: data.score?.toString() || prev.score,
            opponentScore: data.opponentScore?.toString() || prev.opponentScore,
            date: data.date || prev.date,
            teamSummary: data.summary || prev.teamSummary
        }));
        
        if (data.events) {
            setImportedEvents(data.events);
        }
        setShowImportArea(false);
        setImportText("");
    } catch (err) {
        alert("Kunde inte tolka texten. Försök kopiera mer av innehållet på sidan.");
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
    setShowWhiteboard(false);
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

  const handleWhiteboardSave = (dataUrl: string) => {
    setNewMatch(prev => ({ 
        ...prev, 
        tacticalPlays: [...prev.tacticalPlays, dataUrl] 
    }));
    setShowWhiteboard(false);
  };

  const removeTacticalPlay = (index: number) => {
      setNewMatch(prev => ({
          ...prev,
          tacticalPlays: prev.tacticalPlays.filter((_, i) => i !== index)
      }));
  };

  // Shot Chart Logic
  const handleCourtClick = (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      const newShot: Shot = {
          id: Date.now().toString(),
          x,
          y,
          result: shotMode
      };
      
      setNewMatch(prev => ({
          ...prev,
          shots: [...prev.shots, newShot]
      }));
  };

  const undoLastShot = () => {
      setNewMatch(prev => ({
          ...prev,
          shots: prev.shots.slice(0, -1)
      }));
  };

  const shotStats = useMemo(() => {
      const total = newMatch.shots.length;
      if (total === 0) return { makes: 0, percentage: 0 };
      const makes = newMatch.shots.filter(s => s.result === 'make').length;
      return { makes, percentage: Math.round((makes / total) * 100) };
  }, [newMatch.shots]);

  // Reusable Court Component
  const CourtVisual = ({ shots, onClick, readOnly = false }: { shots: Shot[], onClick?: (e: React.MouseEvent<HTMLDivElement>) => void, readOnly?: boolean }) => (
      <div 
        onClick={onClick}
        className={`relative w-full aspect-[1.8/1] bg-slate-800 rounded-lg overflow-hidden border-2 border-slate-700 ${!readOnly ? 'cursor-crosshair active:scale-[0.99] transition-transform' : ''}`}
      >
          {/* Court Markings (Simplified Full Court) */}
          <div className="absolute inset-0 opacity-30 pointer-events-none">
              {/* Center Line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white transform -translate-x-1/2"></div>
              {/* Center Circle */}
              <div className="absolute left-1/2 top-1/2 w-[15%] aspect-square border border-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
              
              {/* Left Key Area */}
              <div className="absolute left-0 top-[35%] bottom-[35%] w-[15%] border-r border-y border-white"></div>
              <div className="absolute left-0 top-[42%] bottom-[42%] w-[15%] bg-white/10"></div>
              {/* Left 3pt Line */}
              <div className="absolute left-0 top-[10%] bottom-[10%] w-[30%] border-r border-y border-white rounded-r-[50%]"></div>

              {/* Right Key Area */}
              <div className="absolute right-0 top-[35%] bottom-[35%] w-[15%] border-l border-y border-white"></div>
              <div className="absolute right-0 top-[42%] bottom-[42%] w-[15%] bg-white/10"></div>
              {/* Right 3pt Line */}
              <div className="absolute right-0 top-[10%] bottom-[10%] w-[30%] border-l border-y border-white rounded-l-[50%]"></div>
          </div>

          {/* Shots */}
          {shots.map((shot, i) => (
              <div 
                  key={i}
                  className={`absolute w-3 h-3 md:w-4 md:h-4 rounded-full -ml-1.5 -mt-1.5 md:-ml-2 md:-mt-2 shadow-sm border border-black/20 ${shot.result === 'make' ? 'bg-emerald-500' : 'bg-rose-500'}`}
                  style={{ left: `${shot.x}%`, top: `${shot.y}%` }}
              >
                  {shot.result === 'miss' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-2 h-0.5 bg-white/80 rotate-45 absolute"></div>
                          <div className="w-2 h-0.5 bg-white/80 -rotate-45 absolute"></div>
                      </div>
                  )}
              </div>
          ))}
      </div>
  );

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
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Fokus: Utveckling & Resultat</p>
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
            
            {/* Profixio Smart AI Import Section */}
            <div className={`p-5 rounded-2xl border transition-all ${importedEvents.length > 0 ? 'bg-emerald-900/10 border-emerald-500/30' : 'bg-blue-600/10 border-blue-500/20'} space-y-4`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-400">
                        <Sparkles size={16} className={importedEvents.length > 0 ? "text-emerald-500" : "text-blue-400"} />
                        <h4 className={`text-[10px] font-black uppercase tracking-widest ${importedEvents.length > 0 ? "text-emerald-500" : "text-blue-400"}`}>
                            {importedEvents.length > 0 ? "Matchdata Importerad via AI" : "Smart AI-import (Profixio)"}
                        </h4>
                    </div>
                    {!importedEvents.length && (
                        <button 
                            onClick={() => setShowImportArea(!showImportArea)}
                            className="text-[9px] font-black text-blue-400 uppercase underline"
                        >
                            {showImportArea ? "Dölj" : "Visa instruktioner"}
                        </button>
                    )}
                </div>

                {showImportArea && (
                    <div className="space-y-3 animate-in slide-in-from-top-2">
                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[10px] text-slate-400 leading-relaxed">
                            <p className="font-bold text-white mb-1">Gör så här:</p>
                            1. Öppna matchen på Profixio.<br/>
                            2. Markera och kopiera ALL text på sidan (Ctrl+A, Ctrl+C).<br/>
                            3. Klistra in texten nedan och klicka på "Analysera".
                        </div>
                        <textarea 
                            value={importText}
                            onChange={(e) => setImportText(e.target.value)}
                            placeholder="Klistra in råtexten här..."
                            className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl p-3 text-[10px] text-slate-300 font-mono outline-none focus:border-blue-500 resize-none"
                        />
                        <button 
                            onClick={handleSmartImport}
                            disabled={!importText.trim() || importing}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all"
                        >
                            {importing ? <Loader2 size={14} className="animate-spin" /> : <ClipboardPaste size={14} />}
                            {importing ? "AI bearbetar data..." : "Analysera och fyll i formulär"}
                        </button>
                    </div>
                )}
                
                {importedEvents.length > 0 && (
                    <div className="mt-2 pt-4 border-t border-slate-800/50 animate-in slide-in-from-top duration-500">
                        <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                             <Activity size={12} /> Identifierade händelser ({importedEvents.length} st)
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {importedEvents.slice(0, 6).map((evt, i) => (
                                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-slate-950/50 border border-slate-800/50">
                                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${evt.team === 'us' ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-800 text-slate-400'}`}>{evt.time}</span>
                                    <span className="text-[10px] text-slate-300 truncate">{evt.description}</span>
                                </div>
                            ))}
                            {importedEvents.length > 6 && <div className="text-[9px] text-slate-600 p-2 italic">+ {importedEvents.length - 6} fler händelser sparade.</div>}
                        </div>
                    </div>
                )}
            </div>

            {/* Match Header Info */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Motståndare</label>
                <input 
                  value={newMatch.opponent} 
                  onChange={e => setNewMatch({...newMatch, opponent: e.target.value})}
                  placeholder="t.ex. KFUM Blackeberg" 
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

            {/* SHOT CHART SECTION */}
            <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                       <Crosshair size={14} className="text-orange-500" /> Skottkarta (Shot Chart)
                    </h4>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-white">FG: {shotStats.percentage}% ({shotStats.makes}/{newMatch.shots.length})</span>
                    </div>
                </div>

                <div className="grid md:grid-cols-12 gap-6">
                    <div className="md:col-span-9">
                        <CourtVisual shots={newMatch.shots} onClick={handleCourtClick} />
                    </div>
                    <div className="md:col-span-3 flex flex-col gap-3 justify-center">
                        <button 
                            onClick={() => setShotMode('make')}
                            className={`p-4 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 transition-all ${shotMode === 'make' ? 'bg-emerald-600 text-white shadow-lg scale-105' : 'bg-slate-900 border border-slate-800 text-slate-500'}`}
                        >
                            <div className="w-3 h-3 rounded-full bg-emerald-500"></div> Mål
                        </button>
                        <button 
                            onClick={() => setShotMode('miss')}
                            className={`p-4 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 transition-all ${shotMode === 'miss' ? 'bg-rose-600 text-white shadow-lg scale-105' : 'bg-slate-900 border border-slate-800 text-slate-500'}`}
                        >
                            <div className="w-3 h-3 rounded-full bg-rose-500"></div> Miss
                        </button>
                        <div className="h-px bg-slate-800 my-2"></div>
                        <button 
                            onClick={undoLastShot}
                            disabled={newMatch.shots.length === 0}
                            className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 font-bold text-[10px] uppercase hover:bg-slate-800 hover:text-white flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Undo2 size={14} /> Ångra
                        </button>
                    </div>
                </div>
                <p className="text-[9px] text-slate-500 text-center italic">Klicka på planen för att registrera skott.</p>
            </div>

            {/* STRATEGY / WHITEBOARD SECTION */}
            <div className="space-y-4">
               <div className="flex justify-between items-center">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                       <Presentation size={14} className="text-blue-500" /> Spelplan & Taktik (Rita flera)
                   </label>
               </div>

               {showWhiteboard ? (
                   <div className="rounded-2xl border border-slate-700 overflow-hidden shadow-2xl h-[500px] animate-in zoom-in-95 duration-200">
                       <TacticalWhiteboard 
                           id="new-match-board" 
                           onSave={handleWhiteboardSave} 
                           onClose={() => setShowWhiteboard(false)}
                       />
                   </div>
               ) : (
                   <div className="flex flex-col space-y-4">
                       {/* Gallery of saved plays */}
                       {newMatch.tacticalPlays.length > 0 && (
                           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                               {newMatch.tacticalPlays.map((img, index) => (
                                   <div key={index} className="relative group rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video">
                                       <img src={img} alt={`Strategy ${index + 1}`} className="w-full h-full object-contain" />
                                       <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                           <button 
                                                onClick={() => removeTacticalPlay(index)} 
                                                className="p-2 bg-rose-600 text-white rounded-lg font-bold text-xs uppercase hover:bg-rose-500"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                       </div>
                                       <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 rounded text-[9px] font-bold text-white">
                                           #{index + 1}
                                       </div>
                                   </div>
                               ))}
                           </div>
                       )}

                       {/* Add New Button */}
                       <div className="flex justify-start">
                           <button 
                               onClick={() => setShowWhiteboard(true)}
                               className="h-24 w-full md:w-64 rounded-2xl border-2 border-dashed border-slate-800 flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-white hover:border-blue-500 hover:bg-blue-500/5 transition-all group"
                           >
                               <div className="p-2 rounded-full bg-slate-900 group-hover:bg-blue-600/20 group-hover:text-blue-500 transition-colors">
                                   <Plus size={20} />
                               </div>
                               <span className="text-[10px] font-black uppercase tracking-widest">
                                   {newMatch.tacticalPlays.length > 0 ? "Lägg till nästa drag" : "Rita första draget"}
                               </span>
                           </button>
                       </div>
                   </div>
               )}
            </div>

            {/* Score Entry Section */}
            <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block text-center mb-2">Matchresultat</label>
              <div className="flex items-center justify-center gap-8">
                <div className="text-center space-y-2">
                  <span className="text-[10px] font-black text-orange-500 uppercase">U13 Elite</span>
                  <input 
                    type="number"
                    value={newMatch.score}
                    onChange={e => setNewMatch({...newMatch, score: e.target.value})}
                    placeholder="0"
                    className="w-24 h-24 bg-slate-900 border-2 border-slate-800 rounded-[2rem] text-4xl font-black text-white text-center focus:border-orange-500 outline-none shadow-inner"
                  />
                </div>
                <div className="text-4xl font-black text-slate-800 pt-6">-</div>
                <div className="text-center space-y-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase">Gäster</span>
                  <input 
                    type="number"
                    value={newMatch.opponentScore}
                    onChange={e => setNewMatch({...newMatch, opponentScore: e.target.value})}
                    placeholder="0"
                    className="w-24 h-24 bg-slate-900 border-2 border-slate-800 rounded-[2rem] text-4xl font-black text-white text-center focus:border-orange-500 outline-none shadow-inner"
                  />
                </div>
              </div>
            </div>

            {/* Individual SISU Assessment */}
            <div className="space-y-6">
              <h4 className="text-sm font-black text-emerald-400 uppercase tracking-tighter italic">Individuell Bedömning (SISU)</h4>
              <div className="grid gap-6">
                {players.map(p => (
                  <div key={p.id} className="p-6 md:p-8 rounded-3xl bg-slate-950 border border-slate-800 space-y-6">
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
                          <input 
                            type="range" min="1" max="5" 
                            value={newMatch.feedbacks[p.id].effort}
                            onChange={e => updateFeedback(p.id, 'effort', parseInt(e.target.value))}
                            className="w-full h-1.5 bg-slate-900 rounded-full appearance-none accent-orange-600"
                          />
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-[9px] font-black text-slate-500 uppercase">
                            <span className="flex items-center gap-1"><Heart size={12} className="text-rose-500"/> Kamratskap</span>
                            <span className="text-white">{newMatch.feedbacks[p.id].teamwork}/5</span>
                          </div>
                          <input 
                            type="range" min="1" max="5" 
                            value={newMatch.feedbacks[p.id].teamwork}
                            onChange={e => updateFeedback(p.id, 'teamwork', parseInt(e.target.value))}
                            className="w-full h-1.5 bg-slate-900 rounded-full appearance-none accent-rose-600"
                          />
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-[9px] font-black text-slate-500 uppercase">
                            <span className="flex items-center gap-1"><Target size={12} className="text-emerald-500"/> Lärande</span>
                            <span className="text-white">{newMatch.feedbacks[p.id].learning}/5</span>
                          </div>
                          <input 
                            type="range" min="1" max="5" 
                            value={newMatch.feedbacks[p.id].learning}
                            onChange={e => updateFeedback(p.id, 'learning', parseInt(e.target.value))}
                            className="w-full h-1.5 bg-slate-900 rounded-full appearance-none accent-emerald-600"
                          />
                        </div>
                      </div>
                    )}

                    {newMatch.feedbacks[p.id] && (
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Det här gjorde du bra</label>
                          <textarea 
                            placeholder="t.ex. Bra fokus i returtagningen..."
                            value={newMatch.feedbacks[p.id].strengths}
                            onChange={e => updateFeedback(p.id, 'strengths', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-500 h-20 resize-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[8px] font-black text-orange-500 uppercase tracking-widest">Nästa steg för dig</label>
                          <textarea 
                            placeholder="t.ex. Våga titta upp mer i dribblingen..."
                            value={newMatch.feedbacks[p.id].improvements}
                            onChange={e => updateFeedback(p.id, 'improvements', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-orange-500 h-20 resize-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Lagets sammanfattning (Lärdomar)</label>
              <textarea 
                value={newMatch.teamSummary}
                onChange={e => setNewMatch({...newMatch, teamSummary: e.target.value})}
                placeholder="Vad tar vi med oss som lag till nästa träning?" 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-white focus:border-orange-500 outline-none h-32 resize-none"
              />
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setIsAdding(false)} 
                className="flex-1 py-4 rounded-xl bg-slate-800 text-slate-400 font-black uppercase text-[10px] tracking-widest"
              >
                Avbryt
              </button>
              <button 
                onClick={saveMatch}
                className="flex-[2] py-4 rounded-xl bg-orange-600 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-orange-900/20"
              >
                Spara Matchanalys
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {matches.map(m => {
            const isWin = m.score > m.opponentScore;
            const isLoss = m.score < m.opponentScore;
            
            // Combine legacy single strategy image with new array
            const displayStrategies = [...(m.tacticalPlays || []), ...(m.strategyImage ? [m.strategyImage] : [])];
            
            // Calculate shot stats for read-only view
            const totalShots = m.shots?.length || 0;
            const madeShots = m.shots?.filter(s => s.result === 'make').length || 0;
            const shotPercentage = totalShots > 0 ? Math.round((madeShots / totalShots) * 100) : 0;

            return (
              <div 
                key={m.id} 
                onClick={() => setSelectedMatch(selectedMatch?.id === m.id ? null : m)}
                className="p-6 rounded-[2rem] bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group relative overflow-hidden"
              >
                {/* Win/Loss side indicator */}
                <div className={`absolute left-0 top-0 bottom-0 w-2 ${isWin ? 'bg-emerald-500' : isLoss ? 'bg-rose-500' : 'bg-slate-700'}`}></div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-6">
                    <div className={`p-3 rounded-2xl border ${isWin ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : isLoss ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-slate-950 border-slate-800 text-slate-500'} group-hover:scale-110 transition-transform`}>
                      <Trophy size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-black text-white italic uppercase">{m.opponent}</h4>
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${isWin ? 'bg-emerald-600/20 text-emerald-400' : isLoss ? 'bg-rose-600/20 text-rose-400' : 'bg-slate-800 text-slate-400'}`}>
                          {isWin ? 'Vinst' : isLoss ? 'Förlust' : 'Oavgjort'}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{m.date}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 self-end md:self-auto">
                    <div className="bg-slate-950 px-6 py-2 rounded-2xl border border-slate-800 shadow-inner flex items-center gap-3">
                      <span className={`text-2xl font-black ${isWin ? 'text-emerald-500' : isLoss ? 'text-rose-500' : 'text-white'}`}>{m.score}</span>
                      <span className="text-slate-800 text-xs font-black">:</span>
                      <span className="text-2xl font-black text-slate-400">{m.opponentScore}</span>
                    </div>
                    <ChevronRight size={20} className={`text-slate-700 transition-transform ${selectedMatch?.id === m.id ? 'rotate-90' : ''}`} />
                  </div>
                </div>

                {selectedMatch?.id === m.id && (
                  <div className="mt-8 space-y-8 animate-in slide-in-from-top duration-300 border-t border-slate-800 pt-8">
                    
                    {/* Saved Shot Chart */}
                    {m.shots && m.shots.length > 0 && (
                        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                            <h5 className="text-[10px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-2">
                                <Crosshair size={14} /> Skottkarta (FG: {shotPercentage}%)
                            </h5>
                            <div className="max-w-lg mx-auto">
                                <CourtVisual shots={m.shots} readOnly />
                            </div>
                        </div>
                    )}

                    {/* Saved Strategy View - Gallery */}
                    {displayStrategies.length > 0 && (
                        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                           <h5 className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                              <Presentation size={14} /> Sparad Taktik ({displayStrategies.length})
                           </h5>
                           
                           {/* Horizontal Scroll for multiple images */}
                           <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar snap-x">
                                {displayStrategies.map((img, idx) => (
                                    <div key={idx} className="shrink-0 w-64 md:w-96 rounded-xl overflow-hidden border border-slate-900 snap-center bg-slate-900">
                                        <img src={img} alt={`Strategy ${idx+1}`} className="w-full object-contain" />
                                        <div className="bg-slate-900/50 p-1 text-center">
                                            <span className="text-[9px] font-black text-slate-500 uppercase">Drag #{idx + 1}</span>
                                        </div>
                                    </div>
                                ))}
                           </div>
                        </div>
                    )}

                    <div className="grid md:grid-cols-3 gap-4">
                      {m.feedbacks.map(f => {
                        const p = players.find(player => player.id === f.playerId);
                        return (
                          <div key={f.playerId} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                               <div className="w-6 h-6 rounded-lg bg-orange-600/20 text-orange-500 flex items-center justify-center text-[10px] font-black italic">#{p?.number}</div>
                               <span className="text-[11px] font-black uppercase text-white">{p?.name}</span>
                            </div>
                            <div className="flex gap-2">
                               <div className="flex-1 text-center p-2 rounded-lg bg-slate-900 border border-slate-800">
                                  <div className="text-[7px] text-slate-500 font-bold uppercase mb-1">Effekt</div>
                                  <div className="text-xs font-black text-orange-500">{f.effort}/5</div>
                               </div>
                               <div className="flex-1 text-center p-2 rounded-lg bg-slate-900 border border-slate-800">
                                  <div className="text-[7px] text-slate-500 font-bold uppercase mb-1">Laganda</div>
                                  <div className="text-xs font-black text-rose-500">{f.teamwork}/5</div>
                               </div>
                               <div className="flex-1 text-center p-2 rounded-lg bg-slate-900 border border-slate-800">
                                  <div className="text-[7px] text-slate-500 font-bold uppercase mb-1">Lärande</div>
                                  <div className="text-xs font-black text-emerald-500">{f.learning}/5</div>
                               </div>
                            </div>
                            <div className="space-y-3">
                               <div>
                                 <div className="text-[8px] font-black text-emerald-500 uppercase mb-1 tracking-widest">Styrkor</div>
                                 <p className="text-[10px] text-slate-300 italic leading-relaxed">{f.strengths || "Ingen specifik feedback."}</p>
                               </div>
                               <div>
                                 <div className="text-[8px] font-black text-orange-500 uppercase mb-1 tracking-widest">Utveckling</div>
                                 <p className="text-[10px] text-slate-300 italic leading-relaxed">{f.improvements || "Ingen specifik feedback."}</p>
                               </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 space-y-2">
                      <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                         <MessageCircle size={14} /> Lagets slutsatser
                      </h5>
                      <p className="text-xs text-slate-300 italic leading-relaxed">{m.teamSummary}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {matches.length === 0 && (
            <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-[2rem] space-y-4">
              <Swords size={48} className="mx-auto text-slate-800" />
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Inga matcher registrerade än.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
