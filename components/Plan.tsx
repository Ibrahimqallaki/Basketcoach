
import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { Phase, Exercise, SkillCategory } from '../types';
import { 
  ChevronRight, 
  Zap, 
  Layout, 
  ChevronLeft, 
  PencilRuler,
  BookOpen,
  Info,
  CheckCircle2,
  Lightbulb,
  Youtube,
  Search,
  ExternalLink,
  Dumbbell,
  Plus,
  Save,
  Loader2,
  X,
  Trash2,
  Play,
  Video
} from 'lucide-react';
import { TacticalWhiteboard } from './TacticalWhiteboard';

const PHASE_STORAGE_KEY = 'basket_coach_plan_phase_v1';

// Robust helper to get YouTube ID from any valid URL
const getVideoId = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// Check if the URL is a YouTube Shorts URL
const isShortsVideo = (url: string) => {
    if (!url) return false;
    return url.includes('shorts/');
};

export const Plan: React.FC = () => {
  const [selectedPhase, setSelectedPhase] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem(PHASE_STORAGE_KEY);
      return saved ? parseInt(saved, 10) : 1;
    } catch (e) {
      return 1;
    }
  });

  const [phases, setPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [activeVisual, setActiveVisual] = useState<Record<string, 'video' | 'whiteboard' | 'pedagogy'>>({});
  const [playingVideos, setPlayingVideos] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<'basket' | 'fys'>('basket');
  
  // Custom Drill Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [customDrill, setCustomDrill] = useState<Partial<Exercise>>({
      title: '',
      category: 'Skott',
      videoUrl: '',
      overview: { setup: '', action: '', coachingPoint: '' },
      pedagogy: { what: '', how: '', why: '' },
      criteria: ['Teknik', 'Fart', 'Fokus']
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
      const loadPhases = async () => {
          setLoading(true);
          const unified = await dataService.getUnifiedPhases();
          setPhases(unified);
          setLoading(false);
      };
      loadPhases();
  }, [showAddModal]); 

  useEffect(() => {
    if (selectedPhase !== null) {
      localStorage.setItem(PHASE_STORAGE_KEY, selectedPhase.toString());
    }
  }, [selectedPhase]);

  const activePhase = phases.find(p => p.id === selectedPhase);

  const toggleVisual = (exId: string, type: 'video' | 'whiteboard' | 'pedagogy') => {
    setActiveVisual(prev => ({ ...prev, [exId]: type }));
    setPlayingVideos(prev => ({ ...prev, [exId]: false }));
  };

  const handlePlayVideo = (exId: string) => {
    setPlayingVideos(prev => ({ ...prev, [exId]: true }));
  };

  const handleSearchYoutube = (title: string) => {
    window.open(`https://www.youtube.com/results?search_query=basketball+drill+${encodeURIComponent(title)}`, '_blank');
  };

  const handleDeleteCustomDrill = async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if(confirm("Vill du ta bort denna övning permanent?")) {
          await dataService.deleteCustomExercise(id);
          const unified = await dataService.getUnifiedPhases();
          setPhases(unified);
      }
  };

  const handleSaveCustomDrill = async () => {
      if(!customDrill.title) return;
      setSubmitting(true);
      try {
          const newDrill: Exercise = {
              id: `custom_${Date.now()}`,
              title: customDrill.title || "Namnlös övning",
              category: customDrill.category as SkillCategory || "Basket-IQ",
              overview: {
                  setup: customDrill.overview?.setup || "Enligt instruktion",
                  action: customDrill.overview?.action || "Utför momentet",
                  coachingPoint: customDrill.overview?.coachingPoint || "Fokusera på tekniken"
              },
              pedagogy: {
                  what: customDrill.pedagogy?.what || "Egen övning",
                  how: customDrill.pedagogy?.how || "Se video eller ritning",
                  why: customDrill.pedagogy?.why || "Förbättra laget"
              },
              criteria: customDrill.criteria || ['Teknik', 'Ansträngning'],
              instructions: { warmup: '', main: '', conclusion: '' },
              diagramPrompt: 'Basketball tactical board',
              videoUrl: customDrill.videoUrl
          };
          
          await dataService.saveCustomExercise(newDrill);
          setShowAddModal(false);
          setCustomDrill({
            title: '',
            category: 'Skott',
            videoUrl: '',
            overview: { setup: '', action: '', coachingPoint: '' },
            pedagogy: { what: '', how: '', why: '' },
            criteria: ['Teknik', 'Fart', 'Fokus']
          });
      } finally {
          setSubmitting(false);
      }
  };

  const filteredExercises = activePhase?.exercises.filter(ex => {
    const isFys = ex.category === 'Fysik' || ex.category === 'Kondition';
    return viewMode === 'fys' ? isFys : !isFys;
  }) || [];

  const phaseTheme = viewMode === 'fys' 
    ? { gradient: 'from-blue-600 to-cyan-500', text: 'text-cyan-400', bg: 'bg-blue-600', border: 'border-blue-500' }
    : { gradient: activePhase?.color || 'from-orange-600 to-orange-500', text: 'text-orange-500', bg: 'bg-orange-600', border: 'border-orange-500' };

  if (loading && phases.length === 0) {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Laddar planering...</p>
        </div>
      );
  }

  const drillVideoId = customDrill.videoUrl ? getVideoId(customDrill.videoUrl) : null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 md:space-y-12 animate-in fade-in duration-700 pb-24">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter italic uppercase leading-none">Utvecklingsplan</h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[8px] md:text-xs flex items-center justify-center sm:justify-start gap-2 mt-2">
            <CheckCircle2 size={14} className="text-emerald-500" /> SBBF Ramverk & Basketens ABC
          </p>
        </div>
        <button 
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-900/20 flex items-center gap-2 transition-all"
        >
            <Plus size={16} /> Skapa Övning
        </button>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 md:gap-8">
        <div className={`lg:col-span-4 space-y-3 ${mobileDetailOpen ? 'hidden lg:block' : 'block'}`}>
          <div className="flex flex-col gap-2 md:gap-3">
            {phases.map((phase) => (
              <button
                key={phase.id}
                onClick={() => { setSelectedPhase(phase.id); setMobileDetailOpen(true); }}
                className={`group w-full flex items-center gap-4 p-4 md:p-5 rounded-2xl transition-all border ${
                  selectedPhase === phase.id
                    ? `bg-gradient-to-r ${phase.color} border-white/20 shadow-xl scale-[1.02]`
                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                }`}
              >
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center font-black text-md md:text-xl shrink-0 ${selectedPhase === phase.id ? 'bg-white/20 text-white' : 'bg-slate-950 text-slate-600'}`}>
                  {phase.id}
                </div>
                <div className="text-left flex-1 min-w-0">
                  <div className={`font-black uppercase tracking-tight text-xs md:text-sm truncate ${selectedPhase === phase.id ? 'text-white' : 'text-slate-300'}`}>
                    {phase.title}
                  </div>
                  <div className={`text-[8px] md:text-[10px] font-bold ${selectedPhase === phase.id ? 'text-white/60' : 'text-slate-600'}`}>
                    {phase.duration}
                  </div>
                </div>
                {selectedPhase === phase.id && <ChevronRight className="text-white" size={16} />}
              </button>
            ))}
          </div>
        </div>

        <div className={`lg:col-span-8 ${mobileDetailOpen ? 'block' : 'hidden lg:block'}`}>
          {activePhase ? (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
              <button onClick={() => setMobileDetailOpen(false)} className="lg:hidden flex items-center gap-2 text-slate-500 hover:text-white font-bold text-[10px] uppercase tracking-widest mb-4"><ChevronLeft size={16} /> Tillbaka till faser</button>
              
              <div className="p-6 md:p-10 rounded-[1.5rem] md:rounded-[2.5rem] bg-slate-900 border border-slate-800 shadow-2xl space-y-6 relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${phaseTheme.gradient} transition-all duration-500`}></div>
                
                <div className="flex flex-col-reverse md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-2 w-full md:w-auto">
                        <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-xl md:text-3xl font-black text-white italic uppercase tracking-tighter leading-none break-words">{activePhase.title}</h3>
                            {viewMode === 'fys' && (
                                <span className="px-2 py-1 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 text-[9px] font-black uppercase tracking-widest animate-in fade-in whitespace-nowrap">
                                    Fys-läge
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-400 font-medium">{activePhase.description}</p>
                    </div>

                    <div className="flex p-1.5 bg-slate-950 rounded-xl border border-slate-800 w-full md:w-auto shadow-inner shrink-0">
                        <button 
                            onClick={() => setViewMode('basket')} 
                            className={`flex-1 md:flex-none px-4 md:px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${viewMode === 'basket' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <Layout size={14} /> Basket
                        </button>
                        <button 
                            onClick={() => setViewMode('fys')} 
                            className={`flex-1 md:flex-none px-4 md:px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${viewMode === 'fys' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <Dumbbell size={14} /> Fys & Atletism
                        </button>
                    </div>
                </div>
                
                <div className="grid gap-8 mt-6">
                  {filteredExercises.length > 0 ? filteredExercises.map(ex => {
                    const currentMode = activeVisual[ex.id] || 'video';
                    const isCustom = ex.id.startsWith('custom_');
                    const videoId = ex.videoUrl ? getVideoId(ex.videoUrl) : null;
                    const isPlaying = playingVideos[ex.id] || false;
                    const isShort = isShortsVideo(ex.videoUrl || '');
                    
                    return (
                      <div key={ex.id} className={`p-4 md:p-8 rounded-2xl md:rounded-[2rem] bg-slate-950 border space-y-6 animate-in slide-in-from-bottom duration-300 transition-colors w-full overflow-hidden relative ${viewMode === 'fys' ? 'border-blue-500/20' : 'border-slate-800'}`}>
                        {isCustom && (
                            <button 
                                onClick={(e) => handleDeleteCustomDrill(ex.id, e)}
                                className="absolute top-4 right-4 p-2 text-slate-700 hover:text-rose-500 z-10"
                                title="Ta bort övning"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-4">
                          <div className="min-w-0 flex-1">
                             <div className="flex items-center gap-2">
                               <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest whitespace-nowrap ${viewMode === 'fys' ? 'bg-blue-600/20 text-blue-400' : 'bg-orange-600/20 text-orange-500'}`}>
                                  {viewMode === 'fys' ? 'Fysisk Utveckling' : 'Basketens ABC'}
                                </span>
                               <span className="text-slate-600 font-black text-[8px] uppercase">{ex.category}</span>
                               {isCustom && <span className="bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded text-[8px] font-black uppercase">Egen Övning</span>}
                             </div>
                             <h4 className="text-lg md:text-2xl font-black text-white italic uppercase tracking-tighter mt-1 line-clamp-2 md:truncate break-words">{ex.title}</h4>
                          </div>
                          <div className="flex flex-wrap gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0">
                            <button 
                              onClick={() => toggleVisual(ex.id, 'video')} 
                              className={`flex-1 sm:flex-none p-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2 text-[9px] font-black uppercase ${currentMode === 'video' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                              <Youtube size={14} /> <span>Video</span>
                            </button>
                            <button 
                              onClick={() => toggleVisual(ex.id, 'pedagogy')} 
                              className={`flex-1 sm:flex-none p-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2 text-[9px] font-black uppercase ${currentMode === 'pedagogy' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                              <BookOpen size={14} /> <span>Pedagogik</span>
                            </button>
                            <button 
                              onClick={() => toggleVisual(ex.id, 'whiteboard')} 
                              className={`flex-1 sm:flex-none p-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2 text-[9px] font-black uppercase ${currentMode === 'whiteboard' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                              <PencilRuler size={14} /> <span>Taktik</span>
                            </button>
                          </div>
                        </div>

                        <div className="space-y-4">
                            {/* SMART VIDEO CONTAINER */}
                            <div className={`relative rounded-2xl md:rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl w-full transition-all duration-500 ${isShort && currentMode === 'video' ? 'aspect-[9/16] max-w-[280px] mx-auto' : 'aspect-video'}`}>
                            {currentMode === 'pedagogy' ? (
                                <div className="w-full h-full p-6 md:p-10 bg-slate-900/95 backdrop-blur-sm overflow-y-auto custom-scrollbar flex flex-col space-y-6 absolute inset-0">
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0 mt-1">
                                        <Info size={18} />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-emerald-500 text-[9px] font-black uppercase tracking-[0.2em]">Vad (Tekniken)</div>
                                        <p className="text-xs md:text-sm text-slate-200 leading-relaxed font-medium italic">"{ex.pedagogy?.what}"</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0 mt-1">
                                        <Lightbulb size={18} />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-blue-400 text-[9px] font-black uppercase tracking-[0.2em]">Hur (Pedagogiken)</div>
                                        <p className="text-xs md:text-sm text-slate-200 leading-relaxed font-medium italic">"{ex.pedagogy?.how}"</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0 mt-1">
                                        <Zap size={18} />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-orange-500 text-[9px] font-black uppercase tracking-[0.2em]">Varför (Förståelsen)</div>
                                        <p className="text-xs md:text-sm text-slate-200 leading-relaxed font-medium italic">"{ex.pedagogy?.why}"</p>
                                    </div>
                                </div>
                                </div>
                            ) : currentMode === 'whiteboard' ? (
                                <div className="absolute inset-0">
                                    <TacticalWhiteboard id={ex.id} />
                                </div>
                            ) : (
                                <div className="w-full h-full relative group/diag flex items-center justify-center bg-slate-900 absolute inset-0">
                                {videoId ? (
                                    <div className="relative w-full h-full">
                                        {!isPlaying ? (
                                            <div 
                                                className="absolute inset-0 z-10 flex items-center justify-center bg-black cursor-pointer group/play" 
                                                onClick={() => handlePlayVideo(ex.id)}
                                            >
                                                <img 
                                                    src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`} 
                                                    onError={(e) => { e.currentTarget.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` }}
                                                    alt="Thumbnail" 
                                                    className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover/play:opacity-60 transition-opacity"
                                                />
                                                <div className="relative z-20 w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-2xl group-hover/play:scale-110 transition-transform">
                                                    <Play size={28} fill="white" className="text-white ml-1" />
                                                </div>
                                                <div className="absolute bottom-4 left-4 z-20 bg-black/60 px-3 py-1 rounded-lg text-white text-[10px] font-bold">
                                                    Klicka för att spela {isShort && '(Shorts)'}
                                                </div>
                                            </div>
                                        ) : (
                                            <iframe 
                                                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                                                title={ex.title}
                                                className="w-full h-full absolute inset-0 z-10" 
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                referrerPolicy="strict-origin-when-cross-origin"
                                                allowFullScreen
                                            />
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center space-y-4 p-8">
                                        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto">
                                        <Youtube size={32} className="text-slate-600" />
                                        </div>
                                        <div className="space-y-2">
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Ingen video länkad än.</p>
                                        <button 
                                            onClick={() => handleSearchYoutube(ex.title)}
                                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black uppercase text-[10px] tracking-widest transition-all shadow-lg"
                                        >
                                            <Search size={14} /> Sök på YouTube <ExternalLink size={12}/>
                                        </button>
                                        </div>
                                    </div>
                                )}
                                </div>
                            )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-900">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Genomförande</label>
                            <p className="text-xs text-slate-400 leading-relaxed break-words">{ex.overview.action}</p>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Organisation</label>
                            <p className="text-xs text-slate-400 leading-relaxed break-words">{ex.overview.setup}</p>
                          </div>
                          <div className={`p-4 rounded-2xl border ${viewMode === 'fys' ? 'bg-blue-600/5 border-blue-500/10' : 'bg-orange-600/5 border-orange-500/10'}`}>
                            <label className={`text-[9px] font-black uppercase tracking-widest ${viewMode === 'fys' ? 'text-blue-500/70' : 'text-orange-500/70'}`}>Coaching Tips</label>
                            <p className={`text-xs font-bold italic mt-2 leading-relaxed break-words ${viewMode === 'fys' ? 'text-blue-200/80' : 'text-orange-200/80'}`}>"{ex.overview.coachingPoint}"</p>
                          </div>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-[2rem] space-y-4">
                        <Dumbbell size={48} className={`mx-auto ${viewMode === 'fys' ? 'text-blue-500/50' : 'text-slate-800'}`} />
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Inga övningar i denna kategori för {activePhase.title}.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] border-2 border-dashed border-slate-800 rounded-[2rem] flex flex-col items-center justify-center text-slate-700 p-12 text-center">
              <Layout className="w-12 h-12 opacity-10 mb-4" />
              <p className="text-[10px] font-bold uppercase tracking-widest">Välj en nivå i spelarutvecklingsplanen</p>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
          <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                      <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Skapa Ny Övning</h3>
                      <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-500 hover:text-white"><X size={20} /></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                      {/* Video Preview In Modal */}
                      {drillVideoId && (
                        <div className="relative group rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video mb-4 animate-in fade-in">
                            <img 
                                src={`https://img.youtube.com/vi/${drillVideoId}/hqdefault.jpg`} 
                                className="w-full h-full object-cover opacity-60" 
                                alt="Video preview" 
                            />
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                                <div className="p-3 bg-red-600 rounded-full text-white shadow-xl"><Youtube size={24} /></div>
                                <span className="text-[10px] font-black text-white uppercase tracking-widest bg-black/60 px-2 py-1 rounded">Video hittad!</span>
                            </div>
                        </div>
                      )}

                      <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Titel</label>
                              <input 
                                  value={customDrill.title}
                                  onChange={e => setCustomDrill({...customDrill, title: e.target.value})}
                                  placeholder="t.ex. 3-mans snabbuppspel"
                                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500 text-sm"
                              />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Kategori</label>
                              <select 
                                  value={customDrill.category}
                                  onChange={e => setCustomDrill({...customDrill, category: e.target.value as SkillCategory})}
                                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500 text-sm"
                              >
                                  <option>Skott</option>
                                  <option>Dribbling</option>
                                  <option>Passningar</option>
                                  <option>Försvar</option>
                                  <option>Basket-IQ</option>
                                  <option>Transition</option>
                                  <option>Kondition</option>
                                  <option>Fysik</option>
                              </select>
                          </div>
                      </div>

                      <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Video URL (YouTube)</label>
                          <input 
                              value={customDrill.videoUrl}
                              onChange={e => setCustomDrill({...customDrill, videoUrl: e.target.value})}
                              placeholder="t.ex. https://www.youtube.com/watch?v=..."
                              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500 text-sm font-mono"
                          />
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Vad (Teknik)</label>
                              <textarea 
                                  value={customDrill.pedagogy?.what}
                                  onChange={e => setCustomDrill({...customDrill, pedagogy: {...customDrill.pedagogy!, what: e.target.value}})}
                                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500 text-sm h-24 resize-none"
                              />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Hur (Utförande)</label>
                              <textarea 
                                  value={customDrill.pedagogy?.how}
                                  onChange={e => setCustomDrill({...customDrill, pedagogy: {...customDrill.pedagogy!, how: e.target.value}})}
                                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500 text-sm h-24 resize-none"
                              />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Varför (Syfte)</label>
                              <textarea 
                                  value={customDrill.pedagogy?.why}
                                  onChange={e => setCustomDrill({...customDrill, pedagogy: {...customDrill.pedagogy!, why: e.target.value}})}
                                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500 text-sm h-24 resize-none"
                              />
                          </div>
                      </div>

                      <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                          <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Översikt</h4>
                          <div className="space-y-2">
                              <input 
                                  placeholder="Organisation (t.ex. 3 led, 2 bollar)"
                                  value={customDrill.overview?.setup}
                                  onChange={e => setCustomDrill({...customDrill, overview: {...customDrill.overview!, setup: e.target.value}})}
                                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                              />
                              <input 
                                  placeholder="Action (t.ex. Spring runt konen, passa bollen)"
                                  value={customDrill.overview?.action}
                                  onChange={e => setCustomDrill({...customDrill, overview: {...customDrill.overview!, action: e.target.value}})}
                                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                              />
                              <input 
                                  placeholder="Coaching Tip (t.ex. Håll blicken högt)"
                                  value={customDrill.overview?.coachingPoint}
                                  onChange={e => setCustomDrill({...customDrill, overview: {...customDrill.overview!, coachingPoint: e.target.value}})}
                                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs italic"
                              />
                          </div>
                      </div>
                  </div>

                  <div className="p-6 border-t border-slate-800 bg-slate-900">
                      <button 
                          onClick={handleSaveCustomDrill}
                          disabled={submitting || !customDrill.title}
                          className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase text-xs tracking-widest shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                          {submitting ? <Loader2 className="animate-spin" /> : <Save size={16} />}
                          Spara till Övningsbank
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
