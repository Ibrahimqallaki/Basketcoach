
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Roster } from './components/Roster';
import { Plan } from './components/Plan';
import { Training } from './components/Training';
import { MatchEvaluation } from './components/MatchEvaluation';
import { Account } from './components/Account';
import { VideoAnalysis } from './components/VideoAnalysis';
import { PlayerPortal } from './components/PlayerPortal';
import { KeySelectionOverlay } from './components/KeySelectionOverlay';
import { AICoach } from './components/AICoach';
import { CoachTools } from './components/CoachTools';
import { auth, isFirebaseConfigured, googleProvider } from './services/firebase';
import { dataService } from './services/dataService';
// Fix: Added @ts-ignore to bypass environment-specific resolution issues with Firebase exports
// @ts-ignore
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
// @ts-ignore
import type { User } from 'firebase/auth';
import { Trophy, AlertCircle, UserCheck, Smartphone, Check, ArrowRight, Gamepad2, Loader2, Globe, Copy, ShieldAlert, LogIn, Info, AlertTriangle, CloudLightning, HardDrive } from 'lucide-react';
import { View, Player } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Login Error State
  const [loginError, setLoginError] = useState<{ message: string, domain?: string } | null>(null);
  
  // Player Login State
  const [showPlayerLogin, setShowPlayerLogin] = useState(false);
  const [playerCode, setPlayerCode] = useState("");
  const [loggedInPlayer, setLoggedInPlayer] = useState<Player | null>(null);
  const [verifyingCode, setVerifyingCode] = useState(false);

  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, (currentUser: any) => {
        setUser(currentUser);
        setAuthLoading(false);
      });
      return () => unsubscribe();
    } else {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio?.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      } else {
        setHasApiKey(true);
      }
    };
    checkApiKey();
  }, []);

  const handleKeySelected = () => {
    setHasApiKey(true);
  };

  const createDemoUser = (name: string, id: string) => {
     return {
      uid: id,
      displayName: name,
      email: `${id}@basketcoach.pro`,
      photoURL: null,
      emailVerified: true,
      isAnonymous: true,
      metadata: {},
      providerData: [],
      refreshToken: '',
      tenantId: null,
      delete: async () => {},
      getIdToken: async () => '',
      getIdTokenResult: async () => ({} as any),
      reload: async () => {},
      toJSON: () => ({}),
      phoneNumber: null,
      providerId: 'demo'
    } as any;
  }

  const handleGuestLogin = () => {
    setUser(createDemoUser('Gäst Coach', 'guest'));
    setLoginError(null);
  };

  const handlePlayerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyingCode(true);
    setLoginError(null);
    try {
        const player = await dataService.loginPlayer(playerCode.toUpperCase());
        if (player) {
            setLoggedInPlayer(player);
            // We create a dummy user session for the player to reuse app structure
            setUser(createDemoUser(player.name, `player_${player.id}`));
            setCurrentView(View.PLAYER_PORTAL);
        } else {
            setLoginError({ message: "Ogiltig kod eller spelare hittades inte lokalt." });
        }
    } catch (err) {
        setLoginError({ message: "Ett fel uppstod vid inloggning." });
    } finally {
        setVerifyingCode(false);
    }
  };

  // Allow coach to preview player portal without logging out
  const handleSimulatePlayerLogin = (player: Player) => {
      setLoggedInPlayer(player);
      setCurrentView(View.PLAYER_PORTAL);
  };

  const handleGoogleLogin = async () => {
    if (!isFirebaseConfigured) {
      console.warn("Firebase ej konfigurerat. Aktiverar Demo-läge.");
      setUser(createDemoUser('Demo Coach', 'demo_user'));
      return;
    }

    setLoginError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Login failed", error);
      
      if (error.code === 'auth/api-key-not-valid' || error.code === 'auth/internal-error' || !isFirebaseConfigured) {
         setUser(createDemoUser('Demo Coach', 'demo_user'));
         return;
      }

      let msg = "Inloggningen misslyckades.";
      const currentDomain = window.location.hostname;

      if (error.code === 'auth/operation-not-allowed') {
        msg = "Google Login är inte aktiverat i Firebase Console.";
      } else if (error.code === 'auth/popup-closed-by-user') {
        msg = "Inloggningsfönstret stängdes.";
      } else if (error.code === 'auth/unauthorized-domain') {
        msg = `Säkerhetsspärr: Okänd domän.`;
      } else {
        msg = error.message || "Ett okänt fel uppstod.";
      }

      setLoginError({ message: msg, domain: currentDomain });
    }
  };

  const copyDomain = () => {
    if (loginError?.domain) {
      navigator.clipboard.writeText(loginError.domain);
      alert(`Domän kopierad: ${loginError.domain}`);
    }
  };

  const getUserInitial = () => {
    if (user?.displayName) return user.displayName.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'C';
  };

  const handleLogout = async () => {
      if (loggedInPlayer) {
          setLoggedInPlayer(null);
          // Only reset user if it was a player session
          if (user?.uid.startsWith('player_')) {
             setUser(null);
             setShowPlayerLogin(false);
          }
          // If coach was simulating, just return to dashboard
          if (user && !user.uid.startsWith('player_')) {
             setCurrentView(View.ROSTER);
             return;
          }
          setPlayerCode("");
          setCurrentView(View.DASHBOARD);
      } else {
          await signOut(auth);
          setUser(null);
      }
  };

  const renderView = () => {
    if (currentView === View.PLAYER_PORTAL && loggedInPlayer) {
        return <PlayerPortal player={loggedInPlayer} onLogout={handleLogout} isPreview={user ? !user.uid.startsWith('player_') : true} />;
    }

    switch (currentView) {
      case View.DASHBOARD: return <Dashboard onNavigateToHistory={() => setCurrentView(View.TRAINING)} />;
      case View.ROSTER: return <Roster onSimulatePlayerLogin={handleSimulatePlayerLogin} />;
      case View.PLAN: return <Plan />;
      case View.TRAINING: return <Training />;
      case View.MATCH_EVAL: return <MatchEvaluation />;
      case View.VIDEO_ANALYSIS: return <VideoAnalysis />;
      case View.AI_COACH: return <AICoach />;
      case View.TOOLS: return <CoachTools onNavigate={setCurrentView} />;
      case View.ACCOUNT: return <Account user={user} />;
      default: return <Dashboard onNavigateToHistory={() => setCurrentView(View.TRAINING)} />;
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen w-full bg-[#020617] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center">
             <Trophy className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen w-full bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Abstract Background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#020617] to-[#020617] z-0"></div>
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none z-0">
           <div className="absolute top-10 left-10 w-96 h-96 bg-orange-600 rounded-full blur-[150px]"></div>
           <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-600 rounded-full blur-[150px]"></div>
        </div>

        <div className="max-w-5xl w-full grid lg:grid-cols-2 gap-12 relative z-10 items-center">
           {/* Left Column: Hero Text */}
           <div className="space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700 text-[10px] font-black uppercase tracking-widest text-orange-500">
                 <Check size={12} /> Säsong 25/26 Redo
              </div>
              <div className="space-y-4">
                <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-white leading-[0.9]">
                  Coach <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Pro Tool</span>
                </h1>
                <p className="text-slate-400 text-lg md:text-xl font-medium max-w-md mx-auto lg:mx-0 leading-relaxed">
                  Nästa generations verktyg för basketcoacher. Planera träningar, utvärdera matcher och utveckla spelare med AI-stöd.
                </p>
              </div>
              
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                 <span className="flex items-center gap-1"><Smartphone size={14} /> Mobilvänlig</span>
                 <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                 <span>AI-driven</span>
                 <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                 <span>Offline-stöd</span>
              </div>
           </div>

           {/* Right Column: Login Card */}
           <div className="w-full max-w-md mx-auto">
              <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative group">
                 <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-blue-500 rounded-[2.5rem] opacity-20 blur group-hover:opacity-40 transition duration-1000"></div>
                 <div className="relative space-y-6">
                    <div className="text-center space-y-2 mb-8">
                       <h2 className="text-2xl font-bold text-white">Välkommen</h2>
                       <p className="text-slate-400 text-sm">Logga in eller kör lokalt</p>
                    </div>

                    {!showPlayerLogin ? (
                        <div className="space-y-3">
                            {/* Primary Button: GUEST MODE */}
                            <button 
                            onClick={handleGuestLogin}
                            className="w-full flex items-center justify-between px-6 py-4 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg shadow-orange-900/30 hover:scale-[1.02] transition-all font-bold group/btn"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-1 bg-white/20 rounded-lg"><HardDrive size={18} className="text-white"/></div>
                                    <div className="text-left">
                                        <div className="text-xs font-black uppercase tracking-wide">Starta Coach-läge</div>
                                        <div className="text-[9px] opacity-80 font-medium">Spara data lokalt</div>
                                    </div>
                                </div>
                                <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                            </button>

                            {/* Secondary Button: CLOUD LOGIN */}
                            <button 
                            onClick={handleGoogleLogin}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-all text-xs font-bold"
                            >
                                <CloudLightning size={14} />
                                <span>Logga in med Google (Moln)</span>
                            </button>

                            <div className="relative flex py-2 items-center">
                                <div className="flex-grow border-t border-slate-700"></div>
                                <span className="flex-shrink-0 mx-4 text-[9px] font-black text-slate-600 uppercase tracking-widest">ELLER</span>
                                <div className="flex-grow border-t border-slate-700"></div>
                            </div>

                            <button 
                            onClick={() => setShowPlayerLogin(true)}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/20 transition-all text-xs font-bold"
                            >
                                <Gamepad2 size={16} />
                                <span>Spelarinloggning</span>
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handlePlayerLogin} className="space-y-4 animate-in slide-in-from-right duration-300">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ange din kod</label>
                                <input 
                                    autoFocus
                                    type="text" 
                                    placeholder="T.ex. P-10-XY3Z"
                                    value={playerCode}
                                    onChange={(e) => setPlayerCode(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-center text-xl font-mono text-white tracking-widest uppercase focus:border-blue-500 outline-none"
                                />
                             </div>
                             <button 
                                type="submit"
                                disabled={!playerCode || verifyingCode}
                                className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-900/20 flex items-center justify-center gap-2"
                             >
                                {verifyingCode ? <Loader2 className="animate-spin" size={16} /> : <ArrowRight size={16} />}
                                Logga in
                             </button>
                             <button 
                                type="button"
                                onClick={() => setShowPlayerLogin(false)}
                                className="w-full py-2 text-[10px] font-bold text-slate-500 uppercase hover:text-white"
                             >
                                Avbryt
                             </button>
                        </form>
                    )}

                    {loginError && (
                      <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-3 animate-in slide-in-from-top-2 text-left">
                        <div className="flex items-start gap-3 text-rose-500 text-[11px] font-medium">
                            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                            <div>
                                <span className="block font-bold">{loginError.message}</span>
                                {loginError.domain && <span className="text-[10px] opacity-80 block mt-1">Domän: {loginError.domain}</span>}
                            </div>
                        </div>
                        <div className="text-[10px] text-slate-400 leading-tight">
                            Google Login kräver domän-godkännande. 
                            <strong> Använd "Starta Coach-läge" ovan för att komma igång direkt.</strong>
                        </div>
                      </div>
                    )}

                    <div className="text-center pt-2">
                       <p className="text-[9px] text-slate-600 font-medium">
                         Lokal data sparas i din webbläsare.
                       </p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    );
  }

  // If Player Portal is active, render full screen portal without standard layout
  if (currentView === View.PLAYER_PORTAL && loggedInPlayer) {
      return (
        <div className="min-h-screen bg-[#020617]">
             <PlayerPortal player={loggedInPlayer} onLogout={handleLogout} isPreview={user ? !user.uid.startsWith('player_') : true} />
        </div>
      );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#020617] overflow-hidden text-slate-200 font-sans selection:bg-orange-500/30">
      {!hasApiKey && <KeySelectionOverlay onKeySelected={handleKeySelected} />}
      <Sidebar activeView={currentView} onNavigate={setCurrentView} user={user} />
      {/* Added max-w-[100vw] and overflow-x-hidden to prevent horizontal scrolling */}
      <main className="flex-1 flex flex-col overflow-x-hidden relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#020617] to-[#020617] w-full max-w-[100vw]">
        <header className="h-20 flex items-center justify-between px-4 md:px-10 shrink-0 z-40">
          <div className="flex items-center gap-4">
            <h2 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500">
              {currentView === View.DASHBOARD && 'Dashboard'}
              {currentView === View.ROSTER && 'Laguppställning'}
              {currentView === View.PLAN && 'Säsongsplanering'}
              {currentView === View.TRAINING && 'Träningsläge'}
              {currentView === View.MATCH_EVAL && 'Matchanalys'}
              {currentView === View.VIDEO_ANALYSIS && 'Videoanalys'}
              {currentView === View.AI_COACH && 'AI Assistent'}
              {currentView === View.TOOLS && 'Verktygslåda'}
              {currentView === View.ACCOUNT && 'Mitt Konto'}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-xs font-bold text-white">{user.displayName || 'Coach'}</span>
              <span className="text-[9px] text-emerald-500 font-black uppercase tracking-widest">{isFirebaseConfigured ? 'Online' : 'Offline Mode'}</span>
            </div>
            
            <button 
              onClick={() => setCurrentView(View.ACCOUNT)}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden hover:border-orange-500 transition-all shadow-lg group"
            >
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-black text-slate-400 group-hover:text-white transition-colors">{getUserInitial()}</span>
              )}
            </button>
          </div>
        </header>
        
        {/* Adjusted padding for mobile to prevent overflow content hitting edges hard */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar w-full">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;
