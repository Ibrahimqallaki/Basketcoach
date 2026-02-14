
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Swords, Star, Save, Plus, ChevronRight, X, Heart, Zap, Target, MessageCircle, Trophy, Hash, Loader2, Presentation, PenTool, Image as ImageIcon, Trash2, Link as LinkIcon, DownloadCloud, AlertCircle, Clock, Activity, Code, Server, Undo2, Crosshair } from 'lucide-react';
import { dataService } from '../services/dataService';
import { Player, MatchRecord, MatchFeedback, Shot } from '../types';
import { TacticalWhiteboard } from './TacticalWhiteboard';

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
  
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [shotMode, setShotMode] = useState<'make' | 'miss'>('make');
  
  const [profixioUrl, setProfixioUrl] = useState("");
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

  const handleProfixioImport = async () => {
    if (!profixioUrl) return;
    setImporting(true);
    setImportedEvents([]);

    // SIMULERING AV SCRAPER - Optimerad för Orion HU14
    setTimeout(() => {
        // Här simulerar vi vad en riktig scraper skulle hitta på Profixio-sidan
        const mockOpponent = "AIK Basket Svart (HU14)";
        const mockScore = "62";
        const mockOpponentScore = "48";
        
        const mockEvents: ImportedMatchEvent[] = [
            { time: "Q1", type: "period", description: "Period 1: Orion leder 18-12", team: 'us' },
            { time: "15:20", type: "foul", description: "Lagfoul AIK", team: 'them' },
            { time: "Q2", type: "period", description: "Halvtid: 32-28", team: 'us' },
            { time: "28:10", type: "score", description: "Orion Run: 10-0 i tredje", team: 'us' },
            { time: "Q3", type: "period", description: "Period 3 slut: 50-36", team: 'us' },
            { time: "38:00", type: "timeout", description: "Timeout Orion vid 58-46", team: 'us' }
        ];

        setNewMatch(prev => ({
            ...prev,
            opponent: mockOpponent,
            score: mockScore,
            opponentScore: mockOpponentScore,
            date: new Date().toISOString().split('T')[0],
            teamSummary: "Data importerad för Orion HU14. Stark tredje period avgjorde matchen. Bra försvarsintensitet i helplan."
        }));
        
        setImportedEvents(mockEvents);
        setImportedEvents(mockEvents);
        setImporting(false);
        setProfixioUrl("");
    }, 2000);
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

  const CourtVisual = ({ shots, onClick, readOnly = false }: { shots: Shot[], onClick?: (e: React.MouseEvent<HTMLDivElement>) => void, readOnly?: boolean }) => (
      <div 
        onClick={onClick}
        className={`relative w-full aspect-[1.8/1] bg-slate-800 rounded-lg overflow-hidden border-2 border-slate-700 ${!readOnly ? 'cursor-crosshair active:scale-[0.99] transition-transform' : ''}`}
      >
          <div className="absolute inset-0 opacity-30 pointer-events-none">
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white transform -translate-x-1/2"></div>
              <div className="absolute left-1/2 top-1/2 w-[15%] aspect-square border border-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute left-0 top-[35%] bottom-[35%] w-[15%] border-r border-y border-white"></div>
              <div className="absolute left-0 top-[10%] bottom-[10%] w-[30%] border-r border-y border-white rounded-r-[50%]"></div>
              <div className="absolute right-0 top-[35%] bottom-[35%] w-[15%] border-l border-y border-white"></div>
              <div className="absolute right-0 top-[10%] bottom-[10%] w-[30%] border-l border-y border-white rounded-l-[50%]"></div>
          </div>
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
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Laget: Orion HU14</p>
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
            
            <div className={`p-5 rounded-2xl border transition-all ${importedEvents.length > 0 ? 'bg-emerald-900/10 border-emerald-500/30' : 'bg-blue-600/10 border-blue-500/20'} space-y-3`}>
                <div className="flex items-center gap-2 text-blue-400">
                    <DownloadCloud size={16} className={importedEvents.length > 0 ? "text-emerald-500" : "text-blue-400"} />
                    <h4 className={`text-[10px] font-black uppercase tracking-widest ${importedEvents.length > 0 ? "text-emerald-500" : "text-blue-400"}`}>
                        {importedEvents.length > 0 ? "Matchdata för Orion HU14 klar" : "Hämta från Profixio (Orion HU14)"}
                    </h4>
                </div>
                
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input 
                            value={profixioUrl}
                            onChange={(e) => setProfixioUrl(e.target.value)}
                            placeholder="Klistra in Profixio-länk..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-9 pr-3 text-xs text-white outline-none focus:border-blue-500"
                            disabled={importedEvents.length > 0}
                        />
                    </div>
                    <button 
                        onClick={handleProfixioImport}
                        disabled={!profixioUrl || importing || importedEvents.length > 0}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 text-white ${importedEvents.length > 0 ? 'bg-emerald-600' : 'bg-blue-600 hover:bg-blue-500'}`}
                    >
                        {importing ? <Loader2 size={14} className="animate-spin" /> : importedEvents.length > 0 ? <Clock size={14} /> : "Hämta"}
                    </button>
                </div>

                {importedEvents.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-800/50 animate-in slide-in-from-top duration-500">
                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                             <Activity size={12} /> Orion HU14 Game Log
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {importedEvents.map((evt, i) => (
                                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-slate-950/50 border border-slate-800/50">
                                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${evt.team === 'us' ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-800 text-slate-400'}`}>{evt.time}</span>
                                    <span className="text-[10px] text-slate-300 truncate">{evt.description}</span>
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

            <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block text-center mb-2">Matchresultat</label>
              <div className="flex items-center justify-center gap-8">
                <div className="text-center space-y-2">
                  <span className="text-[10px] font-black text-orange-500 uppercase">Hemma</span>
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
                  <span className="text-[10px] font-black text-slate-500 uppercase">Borta</span>
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
              <div key={m.id} onClick={() => setSelectedMatch(selectedMatch?.id === m.id ? null : m)} className="p-6 rounded-[2rem] bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${isWin ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}><Trophy size={20} /></div>
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
