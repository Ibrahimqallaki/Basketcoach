
import React, { useState, useEffect, useMemo } from 'react';
import { Target, Users, Activity, Star, Zap, ChevronRight, Calendar, Lightbulb, Trophy, Loader2, Dumbbell, TrendingUp, Timer, Heart, BrainCircuit } from 'lucide-react';
import { dataService } from '../services/dataService';
import { mockPhases } from '../services/mockData';
import { Player, TrainingSession, MatchRecord } from '../types';
import { auth } from '../services/firebase';

export const Dashboard: React.FC<{ onNavigateToHistory?: () => void }> = ({ onNavigateToHistory }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartTimeRange, setChartTimeRange] = useState<'Vecka' | 'Månad' | 'Säsong'>('Säsong');
  const storageMode = dataService.getStorageMode();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [p, s, m] = await Promise.all([
          dataService.getPlayers(),
          dataService.getSessions(),
          dataService.getMatches()
        ]);
        setPlayers(p);
        setSessions(s);
        setMatches(m);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // --- STATISTIK BERÄKNINGAR ---

  const attendanceRate = useMemo(() => dataService.calculateAttendanceRate(sessions), [sessions]);

  const matchStats = useMemo(() => {
    const total = matches.length;
    if (total === 0) return { winRate: 0, wins: 0, losses: 0, draws: 0, streak: '-' };
    
    const wins = matches.filter(m => m.score > m.opponentScore).length;
    const losses = matches.filter(m => m.score < m.opponentScore).length;
    const draws = total - wins - losses;
    const winRate = Math.round((wins / total) * 100);
    const recent = [...matches].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
    
    return { winRate, wins, losses, draws, recent };
  }, [matches]);

  const fysStats = useMemo(() => {
    const fysExerciseIds = new Set(
        mockPhases.flatMap(p => p.exercises)
        .filter(e => e.category === 'Fysik' || e.category === 'Kondition')
        .map(e => e.id)
    );

    let totalEvaluations = 0;
    let fysEvaluations = 0;

    sessions.forEach(s => {
        s.evaluations.forEach(e => {
            totalEvaluations++;
            if (fysExerciseIds.has(e.exerciseId)) {
                fysEvaluations++;
            }
        });
    });

    const ratio = totalEvaluations > 0 ? Math.round((fysEvaluations / totalEvaluations) * 100) : 0;
    return { count: fysEvaluations, ratio };
  }, [sessions]);

  const teamTimeline = useMemo(() => dataService.getTeamProgressTimeline(sessions), [sessions]);
  
  const filteredTimeline = useMemo(() => {
    if (chartTimeRange === 'Säsong') return teamTimeline;

    const now = new Date();
    now.setHours(23, 59, 59, 999);
    
    const cutoffDate = new Date();
    cutoffDate.setHours(0, 0, 0, 0);

    if (chartTimeRange === 'Vecka') {
        cutoffDate.setDate(now.getDate() - 7);
    } else if (chartTimeRange === 'Månad') {
        cutoffDate.setDate(now.getDate() - 30);
    }

    return teamTimeline.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= cutoffDate;
    });
  }, [teamTimeline, chartTimeRange]);

  const currentPhaseId = useMemo(() => sessions.length > 0 ? sessions[0].phaseId : 1, [sessions]);

  const totalEvaluations = useMemo(() => 
    sessions.reduce((acc, s) => acc + s.evaluations.length, 0), 
  [sessions]);

  const sisuStats = useMemo(() => {
    if (matches.length === 0) return null;
    const recentMatches = [...matches].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
    let totalEffort = 0, totalTeamwork = 0, totalLearning = 0, count = 0;
    
    recentMatches.forEach(m => {
        m.feedbacks.forEach(f => {
            totalEffort += f.effort;
            totalTeamwork += f.teamwork;
            totalLearning += f.learning;
            count++;
        });
    });

    if (count === 0) return null;

    return {
        effort: (totalEffort / count).toFixed(1),
        teamwork: (totalTeamwork / count).toFixed(1),
        learning: (totalLearning / count).toFixed(1),
        latestSummary: matches[0].teamSummary
    };
  }, [matches]);

  const stats = [
    { 
      label: 'Närvaro', 
      value: `${attendanceRate}%`, 
      subtext: 'Snitt över säsongen',
      icon: Activity, 
      gradient: 'from-emerald-600 to-emerald-400', 
      border: 'border-emerald-500/20', 
      bg: 'bg-emerald-500/10' 
    },
    { 
      label: 'Matchform', 
      value: matches.length > 0 ? `${matchStats.winRate}%` : '-', 
      subtext: matches.length > 0 ? `${matchStats.wins}V - ${matchStats.losses}F - ${matchStats.draws}O` : 'Inga matcher',
      icon: Trophy, 
      gradient: 'from-yellow-500 to-orange-500', 
      border: 'border-yellow-500/20', 
      bg: 'bg-yellow-500/10' 
    },
    { 
      label: 'Fys-volym', 
      value: `${fysStats.count} st`, 
      subtext: `${fysStats.ratio}% av total träning`,
      icon: Dumbbell, 
      gradient: 'from-blue-600 to-cyan-400', 
      border: 'border-blue-500/20', 
      bg: 'bg-blue-500/10' 
    },
    { 
      label: 'Utveckling', 
      value: totalEvaluations, 
      subtext: 'Antal datapunkter',
      icon: TrendingUp, 
      gradient: 'from-purple-600 to-purple-400', 
      border: 'border-purple-500/20', 
      bg: 'bg-purple-500/10' 
    },
  ];

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Laddar statistik...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in pb-24">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-slate-900 border border-slate-800">
            <div className={`w-2 h-2 rounded-full ${storageMode === 'CLOUD' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-amber-500'}`}></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
               {storageMode === 'CLOUD' ? 'Moln-läge aktivt' : 'Lokalt läge'}
            </span>
         </div>
         <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            Säsongens Överblick
         </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        {stats.map((s, i) => (
          <div key={i} className={`p-4 md:p-6 rounded-3xl border ${s.border} ${s.bg} backdrop-blur-sm relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300`}>
            <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-300 opacity-80 truncate">{s.label}</span>
                <s.icon className="w-4 h-4 md:w-5 md:h-5 text-white opacity-60 shrink-0" />
              </div>
              <div>
                <div className="text-2xl md:text-5xl font-black text-white tracking-tighter truncate">{s.value}</div>
                <div className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-wide truncate">{s.subtext}</div>
              </div>
            </div>
            <div className={`absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-br ${s.gradient} rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity`}></div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-6 md:gap-8">
        <div className="lg:col-span-8 space-y-6 min-w-0">
          <div className="p-6 md:p-8 rounded-[2.5rem] bg-slate-900/50 border border-slate-800 backdrop-blur-md relative overflow-hidden">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4 relative z-10">
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-white italic uppercase tracking-tighter">Utvecklingskurva</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">Snittbetyg på träning över tid</p>
                </div>
                <div className="flex gap-2">
                   {(['Vecka', 'Månad', 'Säsong'] as const).map(t => (
                      <button 
                        key={t} 
                        onClick={() => setChartTimeRange(t)}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${chartTimeRange === t ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20' : 'bg-slate-950 text-slate-500 hover:text-slate-300 border border-slate-800'}`}
                      >
                        {t}
                      </button>
                   ))}
                </div>
             </div>

             <div className="relative h-64 flex items-end justify-between gap-1.5 md:gap-4 px-2">
               {filteredTimeline.length > 0 ? filteredTimeline.map((item, i) => {
                 const height = (item.avg / 5) * 100;
                 return (
                   <div key={i} className="relative flex-1 group flex flex-col items-center gap-2 h-full justify-end animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${i * 50}ms` }}>
                     <div className="w-full bg-slate-800/50 rounded-t-lg h-full absolute bottom-0 z-0"></div>
                     <div 
                        className="w-full max-w-[50px] bg-gradient-to-t from-orange-600 to-orange-400 rounded-t-lg transition-all duration-1000 shadow-[0_0_20px_rgba(249,115,22,0.3)] relative z-10 group-hover:bg-orange-300" 
                        style={{ height: `${height}%` }}
                     >
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] font-bold px-2 py-1 rounded transition-opacity whitespace-nowrap z-50 pointer-events-none border border-slate-700">
                           {item.avg} / 5
                        </div>
                     </div>
                     <div className="text-[8px] md:text-[9px] font-bold text-slate-500 uppercase h-4 truncate w-full text-center">
                       {item.date.split('-')[2]}/{item.date.split('-')[1]}
                     </div>
                   </div>
                 );
               }) : (
                 <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 space-y-2">
                    <TrendingUp className="opacity-20" size={32} />
                    <span className="text-xs font-bold uppercase tracking-widest">Ingen data för {chartTimeRange.toLowerCase()}</span>
                 </div>
               )}
             </div>
          </div>

          <div className="p-6 md:p-8 rounded-[2.5rem] bg-slate-900/50 border border-slate-800 backdrop-blur-md">
             <div className="flex justify-between items-center mb-6">
                <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <Trophy size={16} className="text-orange-500" /> Season Roadmap
                </h4>
                <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-950 px-3 py-1 rounded-full border border-slate-800">Fas {currentPhaseId} av 8</span>
             </div>
             <div className="relative">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-800 -translate-y-1/2 rounded-full"></div>
                <div className="flex justify-between relative z-10 overflow-x-auto pb-4 hide-scrollbar">
                   {mockPhases.map((phase) => (
                      <div key={phase.id} className="flex flex-col items-center gap-3 min-w-[40px]">
                         <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-black text-xs transition-all border-4 ${phase.id === currentPhaseId ? 'bg-orange-500 border-slate-900 text-white scale-125 shadow-lg' : phase.id < currentPhaseId ? 'bg-emerald-500 border-slate-900 text-slate-900' : 'bg-slate-800 border-slate-900 text-slate-600'}`}>
                            {phase.id}
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6 min-w-0">
          <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
             
             <h3 className="text-sm font-black italic uppercase tracking-tighter flex items-center gap-2 text-white mb-6 relative z-10">
               <BrainCircuit className="text-indigo-400" size={18} /> Match Intelligence
             </h3>

             {sisuStats ? (
                <div className="space-y-6 relative z-10">
                   <div className="space-y-4">
                      <div className="space-y-1">
                         <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <span className="flex items-center gap-1"><Zap size={10} className="text-yellow-500" /> Ansträngning</span>
                            <span className="text-white">{sisuStats.effort}/5</span>
                         </div>
                         <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${(parseFloat(sisuStats.effort)/5)*100}%` }}></div>
                         </div>
                      </div>

                      <div className="space-y-1">
                         <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <span className="flex items-center gap-1"><Heart size={10} className="text-rose-500" /> Laganda</span>
                            <span className="text-white">{sisuStats.teamwork}/5</span>
                         </div>
                         <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-rose-500 rounded-full" style={{ width: `${(parseFloat(sisuStats.teamwork)/5)*100}%` }}></div>
                         </div>
                      </div>

                      <div className="space-y-1">
                         <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <span className="flex items-center gap-1"><Target size={10} className="text-emerald-500" /> Lärande</span>
                            <span className="text-white">{sisuStats.learning}/5</span>
                         </div>
                         <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(parseFloat(sisuStats.learning)/5)*100}%` }}></div>
                         </div>
                      </div>
                   </div>

                   {sisuStats.latestSummary && (
                      <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
                         <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                            <Lightbulb size={10} /> Senaste Lärdom
                         </div>
                         <p className="text-xs text-slate-300 leading-relaxed italic">"{sisuStats.latestSummary}"</p>
                      </div>
                   )}
                </div>
             ) : (
                <div className="py-8 text-center space-y-2">
                   <Trophy className="mx-auto text-slate-800" size={32} />
                   <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Ingen matchdata än.</p>
                </div>
             )}
          </div>

          <div className="p-6 md:p-8 rounded-[2.5rem] bg-slate-900/50 border border-slate-800 backdrop-blur-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black italic uppercase tracking-tighter flex items-center gap-2 text-white">
                <Calendar className="text-slate-400" size={18} /> Senaste Aktivitet
              </h3>
            </div>
            <div className="space-y-3">
              {[
                ...sessions.map(s => ({ type: 'session', date: s.date, data: s })),
                ...matches.map(m => ({ type: 'match', date: m.date, data: m }))
              ]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 5)
              .map((item, i) => {
                 if (item.type === 'session') {
                    const s = item.data as TrainingSession;
                    return (
                        <div key={`s-${s.id}`} onClick={() => onNavigateToHistory?.()} className="p-3 md:p-4 rounded-2xl bg-slate-950/50 border border-slate-800/50 flex justify-between items-center group cursor-pointer hover:border-slate-600 hover:bg-slate-800 transition-all">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:border-orange-500 transition-colors shrink-0">
                              <span className="text-xs font-black text-white">{s.date.split('-')[2]}</span>
                            </div>
                            <div className="min-w-0">
                              <div className="text-[10px] font-black text-slate-300 uppercase group-hover:text-white truncate">Fas {s.phaseId} Träning</div>
                              <div className="text-[9px] text-slate-600 font-bold uppercase truncate">{s.evaluations.length} bedömningar</div>
                            </div>
                          </div>
                          <ChevronRight size={14} className="text-slate-700 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
                        </div>
                    );
                 } else {
                    const m = item.data as MatchRecord;
                    const isWin = m.score > m.opponentScore;
                    return (
                        <div key={`m-${m.id}`} className="p-3 md:p-4 rounded-2xl bg-slate-950/50 border border-slate-800/50 flex justify-between items-center group hover:border-slate-600 hover:bg-slate-800 transition-all">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${isWin ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
                              <Trophy size={14} />
                            </div>
                            <div className="min-w-0">
                              <div className="text-[10px] font-black text-slate-300 uppercase group-hover:text-white truncate">Match vs {m.opponent}</div>
                              <div className="text-[9px] text-slate-600 font-bold uppercase truncate">{m.score} - {m.opponentScore}</div>
                            </div>
                          </div>
                        </div>
                    );
                 }
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
