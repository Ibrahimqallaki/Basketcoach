
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
// @ts-ignore
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
// @ts-ignore
import type { User } from 'firebase/auth';
import { Trophy, AlertCircle, UserCheck, Smartphone, Check, ArrowRight, Gamepad2, Loader2, Globe, Copy, ShieldAlert, LogIn, Info, AlertTriangle, CloudLightning, HardDrive, ShieldCheck } from 'lucide-react';
import { View, Player } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isStaffAccess, setIsStaffAccess] = useState(false);
  
  const [loginError, setLoginError] = useState<{ message: string, domain?: string } | null>(null);
  const [showPlayerLogin, setShowPlayerLogin] = useState(false);
  const [playerCode, setPlayerCode] = useState("");
  const [loggedInPlayer, setLoggedInPlayer] = useState<Player | null>(null);
  const [verifyingCode, setVerifyingCode] = useState(false);

  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (currentUser: any) => {
        if (currentUser && !currentUser.uid.startsWith('player_')) {
            // Kolla om denna person är en inbjuden medcoach
            const ownerUid = await dataService.checkAccessMapping(currentUser.email);
            if (ownerUid && ownerUid !== currentUser.uid) {
                console.log("Inloggad som medcoach för:", ownerUid);
                dataService.setActiveOwner(ownerUid);
                setIsStaffAccess(true);
            } else {
                dataService.setActiveOwner(null);
                setIsStaffAccess(false);
            }
        }
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

  const handleKeySelected = () => setHasApiKey(true);

  const createDemoUser = (name: string, id: string) => ({
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
  } as any);

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
            setUser(createDemoUser(player.name, `player_${player.id}`));
            setCurrentView(View.PLAYER_PORTAL);
        } else {
            setLoginError({ message: "Ogiltig kod. Kontrollera med din coach." });
        }
    } catch (err) {
        setLoginError({ message: "Ett fel uppstod vid inloggning." });
    } finally {
        setVerifyingCode(false);
    }
  };

  const handleSimulatePlayerLogin = (player: Player) => {
      setLoggedInPlayer(player);
      setCurrentView(View.PLAYER_PORTAL);
  };

  const handleGoogleLogin = async () => {
    if (!isFirebaseConfigured) {
      setUser(createDemoUser('Demo Coach', 'demo_user'));
      return;
    }
    setLoginError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Login failed", error);
      if (error.code === 'auth/api-key-not-valid' || !isFirebaseConfigured) {
         setUser(createDemoUser('Demo Coach', 'demo_user'));
         return;
      }
      setLoginError({ message: error.message || "Ett okänt fel uppstod.", domain: window.location.hostname });
    }
  };

  const handleLogout = async () => {
      if (loggedInPlayer) {
          setLoggedInPlayer(null);
          if (user?.uid.startsWith('player_')) {
             setUser(null);
             setShowPlayerLogin(false);
          }
          if (user && !user.uid.startsWith('player_')) {
             setCurrentView(View.ROSTER);
             return;
          }
          setPlayerCode("");
          setCurrentView(View.DASHBOARD);
      } else {
          await signOut(auth);
          dataService.setActiveOwner(null);
          setIsStaffAccess(false);
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
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen w-full bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#020617] to-[#020617] z-0"></div>
        <div className="max-w-5xl w-full grid lg:grid-cols-2 gap-12 relative z-10 items-center">
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
                  Digitalt stöd för basketcoacher. Samarbeta med din tränarstab i realtid.
                </p>
              </div>
           </div>

           <div className="w-full max-w-md mx-auto">
              <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative group">
                 <div className="relative space-y-6">
                    <div className="text-center space-y-2 mb-8">
                       <h2 className="text-2xl font-bold text-white">Logga in</h2>
                       <p className="text-slate-400 text-sm">Gå med i ditt lag</p>
                    </div>

                    {!showPlayerLogin ? (
                        <div className="space-y-3">
                            <button onClick={handleGoogleLogin} className="w-full flex items-center justify-between px-6 py-4 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg font-bold group/btn">
                                <div className="flex items-center gap-3">
                                    <div className="p-1 bg-white/20 rounded-lg"><CloudLightning size={18} /></div>
                                    <div className="text-left">
                                        <div className="text-xs font-black uppercase tracking-wide">Coach-inloggning</div>
                                        <div className="text-[9px] opacity-80 font-medium">Logga in med Google</div>
                                    </div>
                                </div>
                                <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                            </button>

                            <button onClick={handleGuestLogin} className="w-full py-3 rounded-2xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest transition-all">Starta utan konto (Lokal)</button>

                            <div className="relative flex py-2 items-center">
                                <div className="flex-grow border-t border-slate-700"></div>
                                <span className="flex-shrink-0 mx-4 text-[9px] font-black text-slate-600 uppercase">ELLER</span>
                                <div className="flex-grow border-t border-slate-700"></div>
                            </div>

                            <button onClick={() => setShowPlayerLogin(true)} className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/20 transition-all text-xs font-bold">
                                <Gamepad2 size={16} /> <span>Spelarinloggning</span>
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handlePlayerLogin} className="space-y-4 animate-in slide-in-from-right duration-300">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ange din kod</label>
                                <input autoFocus type="text" placeholder="T.ex. P-10-XY3Z" value={playerCode} onChange={(e) => setPlayerCode(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-center text-xl font-mono text-white tracking-widest uppercase focus:border-blue-500 outline-none" />
                             </div>
                             <button type="submit" disabled={!playerCode || verifyingCode} className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2">
                                {verifyingCode ? <Loader2 className="animate-spin" size={16} /> : <ArrowRight size={16} />} Logga in
                             </button>
                             <button type="button" onClick={() => setShowPlayerLogin(false)} className="w-full py-2 text-[10px] font-bold text-slate-500 uppercase hover:text-white">Avbryt</button>
                        </form>
                    )}
                 </div>
              </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#020617] overflow-hidden text-slate-200 font-sans selection:bg-orange-500/30">
      {!hasApiKey && <KeySelectionOverlay onKeySelected={handleKeySelected} />}
      <Sidebar activeView={currentView} onNavigate={setCurrentView} user={user} />
      <main className="flex-1 flex flex-col overflow-x-hidden relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#020617] to-[#020617] w-full max-w-[100vw]">
        <header className="h-20 flex items-center justify-between px-4 md:px-10 shrink-0 z-40">
          <div className="flex items-center gap-4">
            <h2 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter text-white">
              {currentView === View.ACCOUNT ? 'Inställningar' : currentView.replace('_', ' ')}
            </h2>
            {isStaffAccess && (
                <div className="px-3 py-1 rounded-lg bg-blue-600/10 border border-blue-500/30 flex items-center gap-2">
                    <ShieldCheck size={14} className="text-blue-500" />
                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Delad åtkomst</span>
                </div>
            )}
          </div>
          <button onClick={() => setCurrentView(View.ACCOUNT)} className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden hover:border-orange-500 transition-all">
              {user?.photoURL ? <img src={user.photoURL} alt="P" className="w-full h-full object-cover" /> : <span className="text-sm font-black text-slate-400">{user.displayName?.charAt(0) || 'C'}</span>}
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar w-full">{renderView()}</div>
      </main>
    </div>
  );
};

export default App;
