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
import { Trophy, Check, ArrowRight, Gamepad2, Loader2, HardDrive, CloudLightning, ShieldAlert, X, Info } from 'lucide-react';
import { View, Player } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [loginError, setLoginError] = useState<{ message: string, code?: string, domain?: string } | null>(null);
  const [showPlayerLogin, setShowPlayerLogin] = useState(false);
  const [playerCode, setPlayerCode] = useState("");
  const [loggedInPlayer, setLoggedInPlayer] = useState<Player | null>(null);
  const [verifyingCode, setVerifyingCode] = useState(false);

  useEffect(() => {
    if (isFirebaseConfigured && auth && typeof auth.onAuthStateChanged === 'function') {
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

  const handleKeySelected = () => setHasApiKey(true);

  const createDemoUser = (name: string, id: string) => ({
      uid: id,
      displayName: name,
      email: `${id}@basketcoach.pro`,
      isAnonymous: true,
      photoURL: null
  } as any);

  const handleGuestLogin = () => {
    setUser(createDemoUser('Gäst Coach', 'guest'));
    setLoginError(null);
  };

  const handleGoogleLogin = async () => {
    if (!isFirebaseConfigured) {
      setLoginError({ message: "Firebase API-nycklar saknas i .env eller Vercel Settings." });
      return;
    }

    setLoginError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Login failed", error);
      
      let msg = "Inloggningen misslyckades.";
      const currentDomain = window.location.hostname;

      if (error.code === 'auth/operation-not-allowed') {
        msg = "Google-inloggning är inte aktiverat i din Firebase Console (Authentication > Sign-in method).";
      } else if (error.code === 'auth/unauthorized-domain') {
        msg = "Denna domän är inte godkänd i Firebase. Lägg till '" + currentDomain + "' i Authorized Domains.";
      } else if (error.code === 'auth/popup-closed-by-user') {
        msg = "Inloggningsfönstret stängdes innan inloggningen var klar.";
      } else {
        msg = error.message || "Ett okänt fel uppstod vid kontakt med Google.";
      }

      setLoginError({ message: msg, code: error.code, domain: currentDomain });
    }
  };

  const handleLogout = async () => {
    if (loggedInPlayer) {
      setLoggedInPlayer(null);
      if (user?.uid.startsWith('player_')) setUser(null);
    } else {
      await signOut(auth);
      setUser(null);
    }
    window.location.reload(); // Säkerställer ren omstart
  };

  const renderView = () => {
    if (currentView === View.PLAYER_PORTAL && loggedInPlayer) {
        return <PlayerPortal player={loggedInPlayer} onLogout={handleLogout} isPreview={user ? !user.uid.startsWith('player_') : true} />;
    }
    switch (currentView) {
      case View.DASHBOARD: return <Dashboard onNavigateToHistory={() => setCurrentView(View.TRAINING)} />;
      case View.ROSTER: return <Roster onSimulatePlayerLogin={(p) => { setLoggedInPlayer(p); setCurrentView(View.PLAYER_PORTAL); }} />;
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
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
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
                 <Check size={12} /> Säsong 25/26
              </div>
              <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-white leading-[0.9]">
                Coach <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Pro Tool</span>
              </h1>
              <p className="text-slate-400 text-lg md:text-xl font-medium max-w-md mx-auto lg:mx-0">
                Det kompletta verktyget för basketutveckling.
              </p>
           </div>

           <div className="w-full max-w-md mx-auto">
              <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative">
                 <div className="space-y-6">
                    <div className="text-center mb-8">
                       <h2 className="text-2xl font-bold text-white uppercase italic">Välkommen</h2>
                       <p className="text-slate-500 text-xs uppercase font-bold tracking-widest mt-1">Välj metod för inloggning</p>
                    </div>

                    {!showPlayerLogin ? (
                        <div className="space-y-3">
                            <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-white text-slate-950 hover:bg-slate-200 transition-all font-black uppercase text-xs shadow-xl">
                                <CloudLightning size={18} /> Logga in med Google
                            </button>
                            <button onClick={handleGuestLogin} className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-slate-800 text-white hover:bg-slate-700 transition-all font-black uppercase text-xs border border-slate-700">
                                <HardDrive size={18} /> Kör lokalt (Gäst)
                            </button>
                            <div className="relative flex py-4 items-center">
                                <div className="flex-grow border-t border-slate-800"></div>
                                <span className="flex-shrink-0 mx-4 text-[9px] font-black text-slate-700 uppercase tracking-widest">Eller</span>
                                <div className="flex-grow border-t border-slate-800"></div>
                            </div>
                            <button onClick={() => setShowPlayerLogin(true)} className="w-full py-4 rounded-2xl bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/20 transition-all text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2">
                                <Gamepad2 size={18} /> Spelarinloggning
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            setVerifyingCode(true);
                            const p = await dataService.loginPlayer(playerCode.toUpperCase());
                            if (p) {
                                setLoggedInPlayer(p);
                                setUser(createDemoUser(p.name, `player_${p.id}`));
                                setCurrentView(View.PLAYER_PORTAL);
                            } else {
                                setLoginError({ message: "Ogiltig spelarkod." });
                            }
                            setVerifyingCode(false);
                        }} className="space-y-4">
                             <input autoFocus type="text" placeholder="DIN KOD" value={playerCode} onChange={(e) => setPlayerCode(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-center text-xl font-mono text-white tracking-widest uppercase outline-none focus:border-blue-500" />
                             <button type="submit" disabled={!playerCode || verifyingCode} className="w-full py-4 rounded-2xl bg-blue-600 text-white font-black uppercase text-xs flex items-center justify-center gap-2">
                                {verifyingCode ? <Loader2 className="animate-spin" size={16} /> : <ArrowRight size={16} />} Logga in
                             </button>
                             <button type="button" onClick={() => setShowPlayerLogin(false)} className="w-full py-2 text-[10px] font-bold text-slate-600 uppercase hover:text-white">Avbryt</button>
                        </form>
                    )}

                    {loginError && (
                      <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 animate-in slide-in-from-top-2">
                        <div className="flex items-start gap-3">
                            <ShieldAlert size={18} className="text-rose-500 shrink-0" />
                            <div className="space-y-1">
                                <p className="text-[11px] font-bold text-rose-500 leading-tight">{loginError.message}</p>
                                {loginError.code === 'auth/unauthorized-domain' && (
                                    <div className="mt-2 p-2 bg-slate-950 rounded-lg text-[9px] text-slate-400 font-mono break-all border border-slate-800">
                                        Felsökning: Din aktuella domän är <strong>{loginError.domain}</strong>. Kontrollera Firebase Console.
                                    </div>
                                )}
                            </div>
                        </div>
                      </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#020617] overflow-hidden text-slate-200">
      {!hasApiKey && <KeySelectionOverlay onKeySelected={handleKeySelected} />}
      <Sidebar activeView={currentView} onNavigate={setCurrentView} user={user} />
      <main className="flex-1 flex flex-col overflow-x-hidden relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#020617] to-[#020617]">
        <header className="h-20 flex items-center justify-between px-6 md:px-10 shrink-0 z-40">
          <h2 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter text-white">
            {currentView}
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-white">{user.displayName || 'Coach'}</div>
              <div className="text-[9px] text-emerald-500 font-black uppercase tracking-widest">{isFirebaseConfigured ? 'Sync On' : 'Offline Mode'}</div>
            </div>
            <button onClick={() => setCurrentView(View.ACCOUNT)} className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden hover:border-orange-500 transition-all">
              {user?.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : <div className="text-xs font-black uppercase">{(user.displayName || 'C')[0]}</div>}
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;