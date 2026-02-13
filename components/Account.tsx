
import React, { useState, useEffect } from 'react';
// Fix: Added @ts-ignore to bypass environment-specific resolution issues with Firebase exports
// @ts-ignore
import { signOut } from 'firebase/auth';
// @ts-ignore
import type { User } from 'firebase/auth';
import { 
  CloudLightning, 
  CloudOff, 
  LogOut, 
  Download, 
  Trash2, 
  ShieldCheck, 
  Database,
  Users,
  Zap,
  Loader2,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Activity,
  Server,
  Lock,
  Info,
  ShieldAlert,
  HardDrive,
  Globe,
  ExternalLink,
  Book,
  Upload,
  Copy,
  Check,
  Terminal,
  Sparkles,
  Bot
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { auth, isFirebaseConfigured, getEnvVar } from '../services/firebase';
import { GoogleGenAI } from "@google/genai";

interface AccountProps {
  user: User | null;
}

export const Account: React.FC<AccountProps> = ({ user }) => {
  const [localStats, setLocalStats] = useState({ players: 0, sessions: 0, matches: 0 });
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrated, setMigrated] = useState(false);
  const [diagStatus, setDiagStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [diagMessage, setDiagMessage] = useState<string | null>(null);
  const [isStorageOk, setIsStorageOk] = useState<boolean | null>(null);
  
  // AI Test State
  const [aiTestStatus, setAiTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [aiTestMessage, setAiTestMessage] = useState<string | null>(null);
  
  // Data Management States
  const [copySuccess, setCopySuccess] = useState(false);
  
  const isGuest = !user || user.isAnonymous || user.uid === 'guest';
  const currentHostname = window.location.hostname;
  const isPreviewUrl = currentHostname.includes('-git-') || (currentHostname.split('.').length > 3);

  useEffect(() => {
    setLocalStats(dataService.getLocalDataStats());
    setIsStorageOk(dataService.checkLocalStorage());
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Force reload to clear state cleanly
      window.location.reload();
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const runDiagnostics = async () => {
    setDiagStatus('testing');
    setDiagMessage("Testar skrivning till Firestore...");
    const result = await dataService.testCloudConnection();
    if (result.success) {
      setDiagStatus('success');
      setDiagMessage(result.message);
    } else {
      setDiagStatus('error');
      setDiagMessage(result.message);
    }
  };

  const testGeminiAI = async () => {
    setAiTestStatus('testing');
    setAiTestMessage("Skickar ping till Gemini...");
    
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API_KEY saknas i konfigurationen.");
      
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Svara bara med ordet 'Ansluten'.",
      });

      if (response.text) {
        setAiTestStatus('success');
        setAiTestMessage("AI-anslutning lyckades! Svar: " + response.text);
      } else {
        throw new Error("Inget svar från AI.");
      }
    } catch (err: any) {
      console.error("AI Test failed:", err);
      setAiTestStatus('error');
      setAiTestMessage(err.message || "Kunde inte ansluta till Gemini.");
    }
  };

  const handleMigrate = async () => {
    setIsMigrating(true);
    try {
      await dataService.migrateLocalToCloud();
      setMigrated(true);
      setLocalStats({ players: 0, sessions: 0, matches: 0 });
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      console.error("Migration failed", err);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleBackup = () => dataService.exportTeamData();
  
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (re) => { 
        if (re.target?.result) {
          dataService.importTeamData(re.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleCopyContext = async () => {
    const snapshot = await dataService.getAppContextSnapshot();
    navigator.clipboard.writeText(JSON.stringify(snapshot, null, 2));
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const hasLocalData = localStats.players > 0 || localStats.sessions > 0 || localStats.matches > 0;

  const envCheck = [
    { label: 'Firebase Key', status: !!getEnvVar('VITE_FIREBASE_API_KEY') },
    { label: 'Gemini Key', status: !!process.env.API_KEY && process.env.API_KEY.length > 10 },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-24 px-2">
      {/* Profile Header */}
      <div className="p-8 rounded-[2.5rem] bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/5 rounded-full blur-[80px] -mr-32 -mt-32"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-20 h-20 rounded-3xl bg-slate-800 border-2 border-orange-500/30 overflow-hidden flex items-center justify-center shadow-2xl shrink-0">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <Users size={32} className="text-slate-600" />
            )}
          </div>
          <div className="text-center md:text-left space-y-2 flex-1 min-w-0">
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter truncate">
              {user?.displayName || 'Coach (Gäst)'}
            </h2>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
               <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isGuest ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                 {isGuest ? <CloudOff size={12} /> : <CloudLightning size={12} />}
                 {isGuest ? 'Gästläge (Lokal)' : 'Inloggad & Synkad'}
               </span>
               <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
                 {user?.email || `ID: ${user?.uid?.slice(0, 8)}...`}
               </span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="px-6 py-3 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
          >
            <LogOut size={16} /> Logga ut
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Systemstatus med AI-test */}
        <div className="p-8 rounded-[2.5rem] bg-slate-900 border border-slate-800 shadow-xl space-y-6">
          <h3 className="text-xs font-black text-white italic uppercase tracking-widest flex items-center gap-2">
            <Activity size={18} className="text-emerald-400" /> Systemstatus
          </h3>
          
          <div className="space-y-4">
             {envCheck.map((v, i) => (
               <div key={i} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-400">{v.label}</span>
                  <div className={`px-2 py-1 rounded text-[8px] font-black uppercase ${v.status ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>
                     {v.status ? "OK" : "MISSING"}
                  </div>
               </div>
             ))}

             <div className="grid grid-cols-1 gap-2 pt-2">
                <button 
                    onClick={runDiagnostics}
                    disabled={diagStatus === 'testing' || !isFirebaseConfigured}
                    className={`w-full py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isFirebaseConfigured ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
                >
                    <Server size={14} /> {diagStatus === 'testing' ? 'Testar Moln...' : 'Testa Moln-anslutning'}
                </button>

                <button 
                    onClick={testGeminiAI}
                    disabled={aiTestStatus === 'testing'}
                    className={`w-full py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${aiTestStatus === 'success' ? 'bg-emerald-600 text-white' : aiTestStatus === 'error' ? 'bg-rose-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20'}`}
                >
                    {aiTestStatus === 'testing' ? <Loader2 size={14} className="animate-spin" /> : <Bot size={14} />}
                    {aiTestStatus === 'testing' ? 'Testar AI...' : 'Testa AI-anslutning (Gemini)'}
                </button>
             </div>

              {(diagMessage || aiTestMessage) && (
                <div className="space-y-2">
                    {diagMessage && (
                        <div className={`p-4 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-3 animate-in fade-in ${diagStatus === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                        {diagStatus === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                        {diagMessage}
                        </div>
                    )}
                    {aiTestMessage && (
                        <div className={`p-4 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-3 animate-in fade-in ${aiTestStatus === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                        {aiTestStatus === 'success' ? <Sparkles size={16} className="text-emerald-400" /> : <ShieldAlert size={16} className="text-rose-400" />}
                        {aiTestMessage}
                        </div>
                    )}
                </div>
              )}
          </div>
        </div>

        <div className="p-8 rounded-[2.5rem] bg-slate-900 border border-slate-800 shadow-xl space-y-6 flex flex-col">
          <h3 className="text-xs font-black text-white italic uppercase tracking-widest flex items-center gap-2">
            <Database size={18} className="text-blue-400" /> Lokal Lagring
          </h3>
          <div className="space-y-4 flex-1">
             <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="grid grid-cols-3 gap-2">
                   {[{v: localStats.players, l: 'Spelare'}, {v: localStats.sessions, l: 'Pass'}, {v: localStats.matches, l: 'Matcher'}].map((s, i) => (
                     <div key={i} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                        <div className="text-lg font-black text-white">{s.v}</div>
                        <div className="text-[7px] text-slate-500 font-bold uppercase">{s.l}</div>
                     </div>
                   ))}
                </div>
             </div>

             {!isGuest && hasLocalData && (
                <div className="p-6 rounded-2xl bg-orange-600/5 border border-orange-500/20 space-y-4">
                   <div className="flex items-start gap-3 text-orange-400">
                      <Zap size={20} className="shrink-0 animate-bounce" />
                      <div className="space-y-1">
                         <p className="text-xs font-black italic uppercase leading-tight">Synka till molnet</p>
                         <p className="text-[10px] text-slate-400 font-medium italic">Flytta din lokala data till ditt konto.</p>
                      </div>
                   </div>
                   <button 
                    disabled={isMigrating || migrated || !isFirebaseConfigured}
                    onClick={handleMigrate}
                    className="w-full py-4 rounded-xl bg-orange-600 text-white font-black uppercase text-[10px] tracking-widest hover:bg-orange-500 transition-all flex items-center justify-center gap-2"
                   >
                     {isMigrating ? <Loader2 size={16} className="animate-spin" /> : <CloudLightning size={16} />}
                     {isMigrating ? 'SYNKAR...' : 'SYNKA ALL DATA'}
                   </button>
                </div>
             )}
             
             {/* Developer Tool */}
             <div className="pt-4 mt-auto">
                <button 
                    onClick={handleCopyContext}
                    className={`w-full py-3 rounded-xl border border-slate-800 text-slate-500 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 hover:text-white transition-all ${copySuccess ? 'text-emerald-500 border-emerald-500/30' : ''}`}
                >
                    {copySuccess ? <Check size={12} /> : <Terminal size={12} />}
                    {copySuccess ? 'Kopierat!' : 'Dev: Kopiera App Context'}
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
