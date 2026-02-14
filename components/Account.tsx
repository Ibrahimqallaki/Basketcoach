
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
  Terminal
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { auth, isFirebaseConfigured, getEnvVar } from '../services/firebase';

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

  // Generate HTML Blob for robust download
  const downloadManual = () => {
      const htmlContent = `<!DOCTYPE html>
<html lang="sv">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manual | Basketcoach Pro</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800;900&display=swap" rel="stylesheet">
    <style>body { font-family: 'Inter', sans-serif; background-color: #020617; color: #f8fafc; } .step-number { text-shadow: 0 0 20px rgba(249, 115, 22, 0.5); }</style>
</head>
<body class="antialiased selection:bg-orange-500/30 pb-20">
    <header class="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div class="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
            <div><h1 class="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-white">Basketcoach <span class="text-orange-500">Pro</span></h1><p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Officiell Användarmanual 25/26</p></div>
            <div class="hidden md:block text-right"><div class="text-xs font-bold text-emerald-500 uppercase tracking-widest">Online Manual</div><div class="text-[10px] text-slate-500">Version 5.0</div></div>
        </div>
    </header>
    <div class="max-w-4xl mx-auto px-6 py-12 text-center space-y-6">
        <h2 class="text-4xl md:text-6xl font-black text-white leading-tight">Coach, välkommen till <br/> <span class="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Framtiden.</span></h2>
        <p class="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">Denna guide tar dig igenom hela arbetsflödet i Basketcoach Pro. Från att lägga till din första spelare till att använda AI och Gamification.</p>
        <div class="flex justify-center gap-4 pt-4"><a href="#step-1" class="px-8 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-orange-900/20">Starta Guiden</a></div>
    </div>
    <main class="max-w-4xl mx-auto px-6 space-y-24">
        
        <!-- STEP 1 -->
        <section id="step-1" class="relative pl-8 md:pl-0"><div class="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-500 to-slate-800 md:hidden"></div><div class="grid md:grid-cols-12 gap-8 items-start"><div class="md:col-span-4"><div class="text-8xl font-black text-slate-800/50 absolute -mt-10 -ml-4 z-0 step-number">01</div><div class="relative z-10"><h3 class="text-2xl font-black text-white italic uppercase mb-2">Bygg Laget</h3><div class="text-xs font-bold text-orange-500 uppercase tracking-widest mb-4">Vyn: "Laget"</div><p class="text-sm text-slate-400 leading-relaxed">Grunden i appen. Registrera spelare för att spåra närvaro och utveckling.</p></div></div><div class="md:col-span-8 bg-slate-900/50 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6"><ul class="space-y-4"><li class="flex gap-4"><div class="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-white shrink-0">1</div><div><h4 class="text-sm font-bold text-white">Lägg till Spelare</h4><p class="text-xs text-slate-400 mt-1">Klicka på <span class="text-orange-400 font-bold">+ LÄGG TILL</span>. Fyll i namn, nummer och position.</p></div></li><li class="flex gap-4"><div class="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-white shrink-0">2</div><div><h4 class="text-sm font-bold text-white">Bedömning (0-10)</h4><p class="text-xs text-slate-400 mt-1">Skatta spelarens nivå (Skott, Fysik, IQ). Detta visualiseras i en radargraf.</p></div></li><li class="flex gap-4"><div class="w-8 h-8 rounded-lg bg-blue-900/30 text-blue-400 flex items-center justify-center font-bold shrink-0">3</div><div><h4 class="text-sm font-bold text-blue-400">Skapa Inloggning</h4><p class="text-xs text-slate-400 mt-1">Klicka på <span class="font-mono bg-slate-950 px-1 py-0.5 rounded text-white">Skapa inloggning</span> för att generera en unik kod till spelaren.</p></div></li></ul></div></div></section>
        
        <!-- STEP 2 -->
        <section id="step-2" class="relative pl-8 md:pl-0"><div class="absolute left-0 top-0 bottom-0 w-1 bg-slate-800 md:hidden"></div><div class="grid md:grid-cols-12 gap-8 items-start"><div class="md:col-span-4"><div class="text-8xl font-black text-slate-800/50 absolute -mt-10 -ml-4 z-0 step-number">02</div><div class="relative z-10"><h3 class="text-2xl font-black text-white italic uppercase mb-2">Planering</h3><div class="text-xs font-bold text-blue-500 uppercase tracking-widest mb-4">Vyn: "Plan"</div><p class="text-sm text-slate-400 leading-relaxed">SBBF-inspirerad 8-fasers utvecklingsplan.</p></div></div><div class="md:col-span-8 bg-slate-900/50 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6"><ul class="space-y-4"><li class="flex gap-4"><div class="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-white shrink-0">1</div><div><h4 class="text-sm font-bold text-white">Basket vs Fys</h4><p class="text-xs text-slate-400 mt-1">Växla mellan teknikövningar och ren fysträning via knapparna i toppen.</p></div></li><li class="flex gap-4"><div class="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-white shrink-0">2</div><div><h4 class="text-sm font-bold text-white">Video & Taktik</h4><p class="text-xs text-slate-400 mt-1">Varje övning har video, pedagogik och en taktiktavla du kan rita på.</p></div></li></ul></div></div></section>
        
        <!-- STEP 3 -->
        <section id="step-3" class="relative pl-8 md:pl-0"><div class="absolute left-0 top-0 bottom-0 w-1 bg-slate-800 md:hidden"></div><div class="grid md:grid-cols-12 gap-8 items-start"><div class="md:col-span-4"><div class="text-8xl font-black text-slate-800/50 absolute -mt-10 -ml-4 z-0 step-number">03</div><div class="relative z-10"><h3 class="text-2xl font-black text-white italic uppercase mb-2">Träning (Live)</h3><div class="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-4">Vyn: "Träna"</div><p class="text-sm text-slate-400 leading-relaxed">Ditt digitala clipboard i hallen.</p></div></div><div class="md:col-span-8 bg-slate-900/50 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6"><ol class="list-decimal list-inside space-y-3 text-sm text-slate-300"><li><strong>Välj Fokus:</strong> Välj Fas och specifik Övning.</li><li><strong>Närvaro:</strong> Checka in spelare.</li><li><strong>Live-läge:</strong> Starta timern. Klicka på en spelare för att ge snabb feedback (1-5) enligt övningens kriterier.</li><li><strong>Spara:</strong> Synka till molnet för att uppdatera statistiken.</li></ol></div></div></section>
        
        <!-- STEP 4 -->
        <section id="step-4" class="relative pl-8 md:pl-0"><div class="absolute left-0 top-0 bottom-0 w-1 bg-slate-800 md:hidden"></div><div class="grid md:grid-cols-12 gap-8 items-start"><div class="md:col-span-4"><div class="text-8xl font-black text-slate-800/50 absolute -mt-10 -ml-4 z-0 step-number">04</div><div class="relative z-10"><h3 class="text-2xl font-black text-white italic uppercase mb-2">Matchanalys</h3><div class="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-4">Vyn: "Match"</div><p class="text-sm text-slate-400 leading-relaxed">Utvärdera prestation, inte bara resultat.</p></div></div><div class="md:col-span-8 bg-slate-900/50 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6"><ul class="space-y-4"><li class="flex gap-4"><div class="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center font-bold text-white shrink-0"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg></div><div><h4 class="text-sm font-bold text-white">Skottkarta (Shot Chart)</h4><p class="text-xs text-slate-400 mt-1">Klicka var på banan skotten togs. Välj mellan <span class="text-emerald-500">MÅL</span> och <span class="text-rose-500">MISS</span>.</p></div></li><li class="flex gap-4"><div class="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-white shrink-0">2</div><div><h4 class="text-sm font-bold text-white">Taktikgalleri</h4><p class="text-xs text-slate-400 mt-1">Rita och spara flera taktiska drag från matchen för framtida analys.</p></div></li><li class="flex gap-4"><div class="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-white shrink-0">3</div><div><h4 class="text-sm font-bold text-white">SISU Feedback</h4><p class="text-xs text-slate-400 mt-1">Individuell bedömning av Ansträngning, Laganda och Lärande.</p></div></li></ul></div></div></section>

        <!-- STEP 5 -->
        <section id="step-5" class="relative pl-8 md:pl-0"><div class="absolute left-0 top-0 bottom-0 w-1 bg-slate-800 md:hidden"></div><div class="grid md:grid-cols-12 gap-8 items-start"><div class="md:col-span-4"><div class="text-8xl font-black text-slate-800/50 absolute -mt-10 -ml-4 z-0 step-number">05</div><div class="relative z-10"><h3 class="text-2xl font-black text-white italic uppercase mb-2">AI-Sviten</h3><div class="text-xs font-bold text-purple-500 uppercase tracking-widest mb-4">Vyn: "Video", "AI Coach" & "Verktyg"</div><p class="text-sm text-slate-400 leading-relaxed">Framtidens coachinghjälpmedel.</p></div></div><div class="md:col-span-8 bg-slate-900/50 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6"><div class="grid grid-cols-1 sm:grid-cols-2 gap-4"><div class="p-4 bg-slate-950 rounded-2xl border border-slate-800"><h4 class="text-xs font-black text-white uppercase mb-1">AI Coach</h4><p class="text-[10px] text-slate-400">Chatta med en expert. Fråga om övningar eller psykologi.</p></div><div class="p-4 bg-slate-950 rounded-2xl border border-slate-800"><h4 class="text-xs font-black text-white uppercase mb-1">Videoanalys</h4><p class="text-[10px] text-slate-400">AI analyserar bilder/sekvenser och ger tips på spacing och stance.</p></div><div class="p-4 bg-slate-950 rounded-2xl border border-slate-800"><h4 class="text-xs font-black text-white uppercase mb-1">Visual Studio</h4><p class="text-[10px] text-slate-400">Generera inspirationsbilder eller videoklipp (Veo) med text.</p></div><div class="p-4 bg-slate-950 rounded-2xl border border-slate-800"><h4 class="text-xs font-black text-white uppercase mb-1">Voice Lab</h4><p class="text-[10px] text-slate-400">Prata med AI i realtid för snabb coaching-sparring.</p></div></div></div></div></section>

        <!-- STEP 6 -->
        <section id="step-6" class="relative pl-8 md:pl-0"><div class="absolute left-0 top-0 bottom-0 w-1 bg-slate-800 md:hidden"></div><div class="grid md:grid-cols-12 gap-8 items-start"><div class="md:col-span-4"><div class="text-8xl font-black text-slate-800/50 absolute -mt-10 -ml-4 z-0 step-number">06</div><div class="relative z-10"><h3 class="text-2xl font-black text-white italic uppercase mb-2">Spelarportalen</h3><div class="text-xs font-bold text-orange-500 uppercase tracking-widest mb-4">Vyn: "Spelarinloggning"</div><p class="text-sm text-slate-400 leading-relaxed">Gamification som engagerar.</p></div></div><div class="md:col-span-8 bg-slate-900/50 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6"><ul class="space-y-4"><li class="flex gap-4"><div class="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-500 flex items-center justify-center font-bold shrink-0">XP</div><div><h4 class="text-sm font-bold text-white">Gamification</h4><p class="text-xs text-slate-400 mt-1">Spelare tjänar XP genom närvaro och hemläxor. De levlar upp och låser upp troféer (t.ex. "Sniper").</p></div></li><li class="flex gap-4"><div class="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-white shrink-0"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></div><div><h4 class="text-sm font-bold text-white">Hemläxor</h4><p class="text-xs text-slate-400 mt-1">Coachen tilldelar uppdrag (t.ex. "50 straffkast"). Spelaren markerar som klar i sin portal.</p></div></li></ul></div></div></section>

        <!-- STEP 7 -->
        <section id="step-7" class="relative pl-8 md:pl-0"><div class="absolute left-0 top-0 bottom-0 w-1 bg-slate-800 md:hidden"></div><div class="grid md:grid-cols-12 gap-8 items-start"><div class="md:col-span-4"><div class="text-8xl font-black text-slate-800/50 absolute -mt-10 -ml-4 z-0 step-number">07</div><div class="relative z-10"><h3 class="text-2xl font-black text-white italic uppercase mb-2">Verktygslådan</h3><div class="text-xs font-bold text-amber-500 uppercase tracking-widest mb-4">Vyn: "Verktyg"</div><p class="text-sm text-slate-400 leading-relaxed">Praktiska hjälpmedel för matchdagen.</p></div></div><div class="md:col-span-8 bg-slate-900/50 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6"><div class="flex flex-col gap-4"><div class="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800"><div class="w-8 h-8 bg-emerald-600 rounded flex items-center justify-center text-white font-bold">1</div><span class="text-sm font-bold text-white">Scoreboard - Håll koll på poäng och fouls.</span></div><div class="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800"><div class="w-8 h-8 bg-amber-600 rounded flex items-center justify-center text-white font-bold">2</div><span class="text-sm font-bold text-white">Tidtagare - Enkel matchklocka.</span></div><div class="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800"><div class="w-8 h-8 bg-rose-600 rounded flex items-center justify-center text-white font-bold">3</div><span class="text-sm font-bold text-white">Foul Tracker - Individuell foul-räkning per spelare.</span></div></div></div></div></section>

    </main>
    <footer class="max-w-4xl mx-auto px-6 py-12 text-center border-t border-slate-800 mt-24"><p class="text-xs font-bold text-slate-600 uppercase tracking-widest">Basketcoach Pro • Byggd för Coacher, av Coacher.</p><p class="text-[10px] text-slate-700 mt-2">© 2025 Alla rättigheter förbehållna.</p></footer>
</body>
</html>`;
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Basketcoach_Pro_Manual.html';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
  };

  const handleCopyContext = async () => {
    const snapshot = await dataService.getAppContextSnapshot();
    navigator.clipboard.writeText(JSON.stringify(snapshot, null, 2));
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const hasLocalData = localStats.players > 0 || localStats.sessions > 0 || localStats.matches > 0;

  const envCheck = [
    { label: 'API Key', status: !!getEnvVar('VITE_FIREBASE_API_KEY') && (getEnvVar('VITE_FIREBASE_API_KEY') || '').length > 10 },
    { label: 'Project ID', status: !!getEnvVar('VITE_FIREBASE_PROJECT_ID') },
    { label: 'Auth Domain', status: !!getEnvVar('VITE_FIREBASE_AUTH_DOMAIN') },
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

      {/* MANUAL & RESOURCES SECTION */}
      <div className="p-8 rounded-[2.5rem] bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
         <h3 className="text-xs font-black text-white italic uppercase tracking-widest flex items-center gap-2 mb-6">
            <Book size={18} className="text-orange-500" /> Manual & Data
         </h3>
         
         <div className="grid md:grid-cols-2 gap-4">
             {/* Manual Download */}
             <button 
                onClick={downloadManual}
                className="col-span-1 md:col-span-2 p-6 rounded-2xl bg-gradient-to-r from-orange-600/10 to-orange-600/5 border border-orange-500/20 hover:border-orange-500/50 transition-all flex items-center gap-4 group"
             >
                <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-900/40 group-hover:scale-110 transition-transform">
                    <Book size={24} />
                </div>
                <div className="text-left flex-1">
                    <h4 className="text-sm font-black text-white uppercase italic tracking-tighter">Ladda ner Manual (HTML)</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Officiell guide för Säsong 25/26. Spara ner och läs offline.</p>
                </div>
                <Download size={20} className="text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
             </button>

             {/* Export Data */}
             <button onClick={handleBackup} className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 transition-all flex items-center gap-3 group text-left">
                <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><Download size={16} /></div>
                <div>
                    <div className="text-[10px] font-black text-white uppercase">Exportera Data</div>
                    <div className="text-[9px] text-slate-500">Spara backup</div>
                </div>
             </button>

             {/* Import Data */}
             <label className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 transition-all flex items-center gap-3 cursor-pointer group text-left">
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg"><Upload size={16} /></div>
                <div>
                    <div className="text-[10px] font-black text-white uppercase">Importera Data</div>
                    <div className="text-[9px] text-slate-500">Återställ backup</div>
                </div>
                <input type="file" className="hidden" accept=".json" onChange={handleImport} />
             </label>
         </div>
      </div>

      {/* URL Persistence Warning */}
      {isPreviewUrl && isGuest && (
        <div className="p-6 rounded-[2rem] bg-rose-500/10 border border-rose-500/20 space-y-3">
           <div className="flex items-center gap-2 text-rose-500">
              <ShieldAlert size={20} />
              <h4 className="text-xs font-black uppercase italic">Viktigt: Du använder en tillfällig URL!</h4>
           </div>
           <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
             Vercel skapar en ny adress för varje deploy. Webbläsaren ser dessa som olika sajter. 
             <strong> Lokal data sparad på denna adress kommer inte synas på din huvudadress.</strong>
           </p>
           <div className="flex items-center gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800">
              <Globe size={14} className="text-slate-500" />
              <span className="text-[9px] font-mono text-slate-400 truncate">{currentHostname}</span>
           </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
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

             <button 
                onClick={runDiagnostics}
                disabled={diagStatus === 'testing' || !isFirebaseConfigured}
                className={`w-full py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isFirebaseConfigured ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
              >
                {diagStatus === 'testing' ? 'Testar...' : 'Testa Moln-anslutning'}
              </button>

              {diagMessage && (
                <div className={`p-4 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${diagStatus === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                  {diagStatus === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                  {diagMessage}
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
