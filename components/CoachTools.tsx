
import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Plus, Minus, Wrench, Clock, Hash, Timer, MonitorPlay, Bot, ArrowRight, User, AlertTriangle, ShieldAlert } from 'lucide-react';
import { View, Player } from '../types';
import { dataService } from '../services/dataService';

interface CoachToolsProps {
  onNavigate?: (view: View) => void;
}

export const CoachTools: React.FC<CoachToolsProps> = ({ onNavigate }) => {
  const [activeTool, setActiveTool] = useState<'scoreboard' | 'timer' | null>(null);

  // Scoreboard State
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [period, setPeriod] = useState(1);
  const [homeFouls, setHomeFouls] = useState(0);
  const [awayFouls, setAwayFouls] = useState(0);

  // Player Foul Tracking
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerFouls, setPlayerFouls] = useState<Record<string, number>>({});
  const [showFoulPanel, setShowFoulPanel] = useState(false);

  // Stopwatch State
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    // Load players for foul tracking
    const loadPlayers = async () => {
      const p = await dataService.getPlayers();
      setPlayers(p);
      // Initialize fouls
      const initialFouls: Record<string, number> = {};
      p.forEach(player => initialFouls[player.id] = 0);
      setPlayerFouls(initialFouls);
    };
    loadPlayers();
  }, []);

  useEffect(() => {
    let interval: number;
    if (isRunning) {
      interval = window.setInterval(() => {
        setTime(prev => prev + 10); // 10ms increments
      }, 10);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const updatePlayerFoul = (playerId: string, delta: number) => {
    setPlayerFouls(prev => {
      const newVal = Math.max(0, Math.min(5, (prev[playerId] || 0) + delta));
      
      // Auto-increment team fouls if adding a player foul
      if (delta > 0 && newVal > (prev[playerId] || 0)) {
         setHomeFouls(h => h + 1);
      }
      
      return { ...prev, [playerId]: newVal };
    });
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-24">
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-xl md:text-3xl font-black italic uppercase tracking-tighter flex items-center gap-2">
            <Wrench className="text-slate-400" /> Verktygslåda
          </h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Praktiska hjälpmedel för träning & match</p>
        </div>
      </div>

      {/* QUICK ACCESS GRID (Mainly for Mobile "More" Menu) */}
      <div className="grid grid-cols-2 gap-3 mb-6">
         <button 
            onClick={() => onNavigate?.(View.VIDEO_ANALYSIS)}
            className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 hover:border-orange-500/50 flex flex-col gap-2 items-start transition-all group shadow-lg"
         >
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
               <MonitorPlay size={20} />
            </div>
            <div className="text-left">
               <div className="text-xs font-black text-white uppercase tracking-tight">Videoanalys</div>
               <div className="text-[9px] text-slate-500 font-bold">Filmrummet</div>
            </div>
            <ArrowRight size={14} className="absolute top-4 right-4 text-slate-700 group-hover:text-white group-hover:translate-x-1 transition-all" />
         </button>

         <button 
            onClick={() => onNavigate?.(View.AI_COACH)}
            className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 hover:border-blue-500/50 flex flex-col gap-2 items-start transition-all group shadow-lg"
         >
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
               <Bot size={20} />
            </div>
            <div className="text-left">
               <div className="text-xs font-black text-white uppercase tracking-tight">AI Assistent</div>
               <div className="text-[9px] text-slate-500 font-bold">Din mentor</div>
            </div>
            <ArrowRight size={14} className="absolute top-4 right-4 text-slate-700 group-hover:text-white group-hover:translate-x-1 transition-all" />
         </button>
      </div>

      {/* INLINE TOOLS SELECTION */}
      <div className="space-y-4">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Snabba Verktyg</label>
        <div className="flex p-1 bg-slate-900 rounded-xl border border-slate-800 w-full md:w-fit shadow-inner">
            <button 
                onClick={() => setActiveTool('scoreboard')} 
                className={`flex-1 md:flex-none px-6 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTool === 'scoreboard' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <Hash size={14} /> Scoreboard
            </button>
            <button 
                onClick={() => setActiveTool('timer')} 
                className={`flex-1 md:flex-none px-6 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTool === 'timer' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <Timer size={14} /> Tidtagare
            </button>
        </div>
      </div>

      {activeTool === 'scoreboard' && (
          <div className="space-y-6 animate-in slide-in-from-bottom duration-300">
              {/* Scoreboard Display */}
              <div className="p-4 md:p-8 rounded-[2rem] md:rounded-[3rem] bg-slate-950 border-4 border-slate-800 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-10 md:h-12 bg-slate-900 rounded-b-2xl border-x border-b border-slate-800 flex items-center justify-center z-10">
                      <div className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest">PERIOD <span className="text-white text-base md:text-lg ml-2">{period}</span></div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 md:gap-8 mt-8 md:mt-8">
                      {/* HOME */}
                      <div className="flex flex-col items-center gap-2 md:gap-4">
                          <span className="text-2xl md:text-5xl font-black text-white italic uppercase tracking-tighter">HEMMA</span>
                          <div className="text-7xl md:text-[12rem] font-black text-orange-500 leading-none tabular-nums tracking-tighter drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]">
                              {homeScore}
                          </div>
                          <div className="flex flex-wrap justify-center gap-2 w-full">
                              <button onClick={() => setHomeScore(Math.max(0, homeScore - 1))} className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-transform active:scale-95"><Minus size={14} className="md:w-5 md:h-5"/></button>
                              <button onClick={() => setHomeScore(homeScore + 1)} className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-slate-800 text-white hover:bg-slate-700 flex items-center justify-center transition-transform active:scale-95"><Plus size={14} className="md:w-5 md:h-5"/></button>
                              <button onClick={() => setHomeScore(homeScore + 2)} className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-orange-600 text-white hover:bg-orange-500 flex items-center justify-center font-black text-[10px] md:text-base transition-transform active:scale-95">+2</button>
                              <button onClick={() => setHomeScore(homeScore + 3)} className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-orange-600 text-white hover:bg-orange-500 flex items-center justify-center font-black text-[10px] md:text-base transition-transform active:scale-95">+3</button>
                          </div>
                          <div className="mt-2 md:mt-4 flex flex-col items-center gap-1">
                              <span className="text-[8px] md:text-[10px] font-bold text-slate-600 uppercase">LAGFOULS</span>
                              <div className="flex items-center gap-2 md:gap-3">
                                  <button onClick={() => setHomeFouls(Math.max(0, homeFouls - 1))} className="p-1 text-slate-500 hover:text-white"><Minus size={12} className="md:w-4 md:h-4"/></button>
                                  <span className={`text-xl md:text-2xl font-black ${homeFouls >= 5 ? 'text-rose-500 animate-pulse' : 'text-slate-300'}`}>{homeFouls}</span>
                                  <button onClick={() => setHomeFouls(homeFouls + 1)} className="p-1 text-slate-500 hover:text-white"><Plus size={12} className="md:w-4 md:h-4"/></button>
                              </div>
                          </div>
                      </div>

                      {/* AWAY */}
                      <div className="flex flex-col items-center gap-2 md:gap-4 border-l border-slate-800/50 pl-2 md:pl-0">
                          <span className="text-2xl md:text-5xl font-black text-slate-400 italic uppercase tracking-tighter">BORTA</span>
                          <div className="text-7xl md:text-[12rem] font-black text-slate-200 leading-none tabular-nums tracking-tighter">
                              {awayScore}
                          </div>
                           <div className="flex flex-wrap justify-center gap-2 w-full">
                              <button onClick={() => setAwayScore(Math.max(0, awayScore - 1))} className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-transform active:scale-95"><Minus size={14} className="md:w-5 md:h-5"/></button>
                              <button onClick={() => setAwayScore(awayScore + 1)} className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-slate-800 text-white hover:bg-slate-700 flex items-center justify-center transition-transform active:scale-95"><Plus size={14} className="md:w-5 md:h-5"/></button>
                              <button onClick={() => setAwayScore(awayScore + 2)} className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-slate-600 text-white hover:bg-slate-500 flex items-center justify-center font-black text-[10px] md:text-base transition-transform active:scale-95">+2</button>
                              <button onClick={() => setAwayScore(awayScore + 3)} className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-slate-600 text-white hover:bg-slate-500 flex items-center justify-center font-black text-[10px] md:text-base transition-transform active:scale-95">+3</button>
                          </div>
                           <div className="mt-2 md:mt-4 flex flex-col items-center gap-1">
                              <span className="text-[8px] md:text-[10px] font-bold text-slate-600 uppercase">LAGFOULS</span>
                              <div className="flex items-center gap-2 md:gap-3">
                                  <button onClick={() => setAwayFouls(Math.max(0, awayFouls - 1))} className="p-1 text-slate-500 hover:text-white"><Minus size={12} className="md:w-4 md:h-4"/></button>
                                  <span className={`text-xl md:text-2xl font-black ${awayFouls >= 5 ? 'text-rose-500 animate-pulse' : 'text-slate-300'}`}>{awayFouls}</span>
                                  <button onClick={() => setAwayFouls(awayFouls + 1)} className="p-1 text-slate-500 hover:text-white"><Plus size={12} className="md:w-4 md:h-4"/></button>
                              </div>
                          </div>
                      </div>
                  </div>
                  
                   <div className="mt-6 md:mt-8 pt-6 border-t border-slate-800 flex justify-center gap-2 md:gap-4">
                        <button onClick={() => setPeriod(Math.max(1, period - 1))} className="px-3 py-2 md:px-4 bg-slate-900 rounded-lg text-slate-400 text-[10px] md:text-xs font-bold uppercase hover:text-white">Föregående Period</button>
                        <button 
                            onClick={() => { 
                                setHomeScore(0); setAwayScore(0); setPeriod(1); setHomeFouls(0); setAwayFouls(0);
                                setPlayerFouls(prev => {
                                    const reset = { ...prev };
                                    Object.keys(reset).forEach(k => reset[k] = 0);
                                    return reset;
                                });
                            }} 
                            className="px-3 py-2 md:px-4 bg-slate-900 rounded-lg text-rose-500 text-[10px] md:text-xs font-bold uppercase hover:bg-rose-500/10"
                        >
                            Nollställ
                        </button>
                        <button onClick={() => setPeriod(period + 1)} className="px-3 py-2 md:px-4 bg-slate-900 rounded-lg text-slate-400 text-[10px] md:text-xs font-bold uppercase hover:text-white">Nästa Period</button>
                   </div>
              </div>

              {/* INDIVIDUAL PLAYER FOUL TRACKER */}
              <div className="bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden shadow-xl">
                  <button 
                    onClick={() => setShowFoulPanel(!showFoulPanel)}
                    className="w-full p-4 flex justify-between items-center bg-slate-800/50 hover:bg-slate-800 transition-colors"
                  >
                      <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                          <User size={16} className="text-orange-500" /> Individuella Fouls (Hemmalag)
                      </h4>
                      <div className={`p-1 rounded-full border ${showFoulPanel ? 'bg-orange-500 text-white border-orange-400 rotate-180' : 'bg-slate-900 text-slate-500 border-slate-700'} transition-all`}>
                          <ArrowRight size={14} className="rotate-90" />
                      </div>
                  </button>
                  
                  {showFoulPanel && (
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                          {players.length === 0 ? (
                              <div className="col-span-2 text-center py-4 text-slate-500 text-xs">Inga spelare hittades. Lägg till i truppen först.</div>
                          ) : (
                              players.map(p => {
                                  const fouls = playerFouls[p.id] || 0;
                                  return (
                                      <div key={p.id} className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                                          <div className="flex items-center gap-3">
                                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${fouls >= 5 ? 'bg-rose-600 text-white' : 'bg-slate-900 border border-slate-700 text-slate-400'}`}>
                                                  #{p.number}
                                              </div>
                                              <span className={`text-xs font-bold uppercase truncate max-w-[100px] ${fouls >= 5 ? 'text-rose-500 line-through' : 'text-white'}`}>
                                                  {p.name}
                                              </span>
                                          </div>
                                          
                                          <div className="flex items-center gap-3">
                                               {/* Visual "Traffic Light" Dots */}
                                               <div className="flex gap-1">
                                                   {[1, 2, 3, 4, 5].map(i => (
                                                       <div 
                                                            key={i} 
                                                            className={`w-2 h-2 rounded-full transition-all ${i <= fouls ? (fouls >= 5 ? 'bg-rose-600' : fouls === 4 ? 'bg-orange-500' : fouls === 3 ? 'bg-yellow-500' : 'bg-emerald-500') : 'bg-slate-800'}`}
                                                       />
                                                   ))}
                                               </div>

                                               <div className="flex items-center border border-slate-800 rounded-lg overflow-hidden">
                                                   <button 
                                                        onClick={() => updatePlayerFoul(p.id, -1)}
                                                        className="p-2 hover:bg-slate-800 text-slate-500 transition-colors"
                                                   >
                                                       <Minus size={12} />
                                                   </button>
                                                   <div className={`w-8 text-center text-sm font-black ${fouls === 4 ? 'text-orange-500' : fouls >= 5 ? 'text-rose-500' : 'text-white'}`}>
                                                       {fouls}
                                                   </div>
                                                   <button 
                                                        onClick={() => updatePlayerFoul(p.id, 1)}
                                                        className="p-2 hover:bg-slate-800 text-white bg-slate-800/50 transition-colors"
                                                   >
                                                       <Plus size={12} />
                                                   </button>
                                               </div>
                                          </div>
                                      </div>
                                  );
                              })
                          )}
                          <div className="col-span-1 md:col-span-2 mt-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-2">
                              <ShieldAlert size={16} className="text-blue-400 shrink-0 mt-0.5" />
                              <p className="text-[10px] text-blue-200 leading-tight">
                                  <strong>Tips:</strong> När du plussar en spelares foul, läggs det automatiskt till på Lagfouls också. Enkelt!
                              </p>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      )}

      {activeTool === 'timer' && (
          <div className="flex flex-col items-center justify-center py-12 animate-in slide-in-from-bottom duration-300">
             <div className="w-80 h-80 rounded-full border-8 border-slate-800 bg-slate-900 flex items-center justify-center shadow-2xl relative mb-12">
                 <div className={`absolute inset-0 rounded-full border-8 border-amber-500 opacity-20 ${isRunning ? 'animate-pulse' : ''}`}></div>
                 <div className="text-6xl font-black text-white font-mono tracking-wider tabular-nums">
                     {formatTime(time).split('.')[0]}<span className="text-3xl text-slate-500">.{formatTime(time).split('.')[1]}</span>
                 </div>
             </div>
             
             <div className="flex items-center gap-6">
                 <button 
                    onClick={() => setIsRunning(!isRunning)}
                    className={`w-24 h-24 rounded-3xl flex flex-col items-center justify-center gap-2 transition-all shadow-xl ${isRunning ? 'bg-amber-500 text-white hover:bg-amber-400' : 'bg-emerald-600 text-white hover:bg-emerald-500'}`}
                 >
                     {isRunning ? <Pause size={32} fill="currentColor"/> : <Play size={32} fill="currentColor" ml-1 />}
                     <span className="text-[10px] font-black uppercase tracking-widest">{isRunning ? 'Pausa' : 'Starta'}</span>
                 </button>

                 <button 
                    onClick={() => { setIsRunning(false); setTime(0); }}
                    className="w-20 h-20 rounded-3xl bg-slate-800 text-slate-400 border border-slate-700 flex flex-col items-center justify-center gap-2 hover:bg-slate-700 hover:text-white transition-all"
                 >
                     <RotateCcw size={24} />
                     <span className="text-[10px] font-black uppercase tracking-widest">Nollställ</span>
                 </button>
             </div>
          </div>
      )}
    </div>
  );
};
