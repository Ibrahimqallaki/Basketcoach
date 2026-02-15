
import React, { useState, useEffect } from 'react';
// @ts-ignore
import { signOut } from 'firebase/auth';
// @ts-ignore
import type { User } from 'firebase/auth';
import { 
  CloudLightning, 
  CloudOff, 
  LogOut, 
  Download, 
  Database,
  Users,
  Loader2,
  Upload,
  UserPlus,
  Mail,
  X,
  Link as LinkIcon,
  Check,
  ShieldCheck,
  Settings,
  ShieldAlert,
  Crown,
  Copy,
  FileCode,
  Search,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { auth } from '../services/firebase';

interface AccountProps {
  user: User | null;
}

export const Account: React.FC<AccountProps> = ({ user }) => {
  const [localStats, setLocalStats] = useState({ players: 0, sessions: 0 });
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [copyStatus, setCopyStatus] = useState(false);
  const [rulesCopied, setRulesCopied] = useState(false);
  
  // Test code state
  const [testCode, setTestCode] = useState("");
  const [testResult, setTestResult] = useState<{status: 'success' | 'error' | 'idle', message: string}>({ status: 'idle', message: '' });
  const [isTesting, setIsTesting] = useState(false);

  const isGuest = !user || user.uid === 'guest';
  const isSuperAdmin = dataService.isSuperAdmin();

  const dbRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // 1. Inställningar (Whitelist)
    match /app_settings/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // 2. Spelardata (Tillåt sökning på kod för inloggning)
    match /{path=**}/players/{playerId} {
      allow read: if true; // Krävs för att hitta spelaren med kod
    }

    // 3. Användardata (Privat mapp för coachen)
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && (request.auth.uid == userId || request.auth.uid.startsWith('player_'));
    }
  }
}`;

  useEffect(() => {
    setLocalStats(dataService.getLocalDataStats());
    if (isSuperAdmin && !isGuest) {
        dataService.getWhitelistedEmails().then(setWhitelist);
    }
  }, [isSuperAdmin, isGuest]);

  const handleLogout = async () => {
    await signOut(auth);
    window.location.reload();
  };

  const handleAddToWhitelist = async () => {
      const email = newEmail.toLowerCase().trim();
      if (!email || !email.includes('@')) return;
      if (whitelist.includes(email)) return;
      setIsSaving(true);
      try {
          const updated = [...whitelist, email];
          await dataService.updateWhitelist(updated);
          setWhitelist(updated);
          setNewEmail("");
      } finally { setIsSaving(false); }
  };

  const handleRemoveFromWhitelist = async (email: string) => {
      setIsSaving(true);
      try {
          const updated = whitelist.filter(e => e !== email);
          await dataService.updateWhitelist(updated);
          setWhitelist(updated);
      } finally { setIsSaving(false); }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopyStatus(true);
    setTimeout(() => setCopyStatus(false), 2000);
  };

  const copyRules = () => {
    navigator.clipboard.writeText(dbRules);
    setRulesCopied(true);
    setTimeout(() => setRulesCopied(false), 2000);
  };

  const handleTestCode = async () => {
      if(!testCode.trim()) return;
      setIsTesting(true);
      setTestResult({ status: 'idle', message: '' });
      try {
          const player = await dataService.loginPlayer(testCode);
          if (player) {
              setTestResult({ status: 'success', message: `Hittade: ${player.name} (#${player.number})` });
          } else {
              setTestResult({ status: 'error', message: 'Ingen spelare hittades med denna kod.' });
          }
      } catch (err: any) {
          let msg = "Ett fel uppstod.";
          if (err.message === 'ACCESS_DENIED') msg = "Behörighetsfel (Regler saknas).";
          if (err.message === 'MISSING_INDEX') msg = "Databasindex saknas.";
          setTestResult({ status: 'error', message: msg });
      } finally {
          setIsTesting(false);
      }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-24 px-2">
      {/* Profil Header */}
      <div className="p-8 rounded-[2.5rem] bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/5 rounded-full blur-[80px] -mr-32 -mt-32"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-20 h-20 rounded-3xl bg-slate-800 border-2 border-orange-500/30 overflow-hidden flex items-center justify-center shadow-2xl shrink-0">
            {user?.photoURL ? <img src={user.photoURL} alt="P" className="w-full h-full object-cover" /> : <Users size={32} className="text-slate-600" />}
          </div>
          <div className="text-center md:text-left space-y-2 flex-1">
            <div className="flex items-center justify-center md:justify-start gap-2">
                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">
                {user?.displayName || 'Coach'}
                </h2>
                {isSuperAdmin && <Crown size={24} className="text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />}
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
               <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isGuest ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                 {isGuest ? <CloudOff size={12} /> : <CloudLightning size={12} />}
                 {isGuest ? 'Gästläge' : 'Molnsync Aktiv'}
               </span>
               <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
                 {isSuperAdmin ? 'Plattformsägare' : 'Certifierad Coach'}
               </span>
            </div>
          </div>
          <button onClick={handleLogout} className="px-6 py-3 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-500 transition-all text-[10px] font-black uppercase flex items-center gap-2">
            <LogOut size={16} /> Logga ut
          </button>
        </div>
      </div>

      {/* Lagstatistik - Alltid synlig */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 rounded-[2rem] bg-slate-900 border border-slate-800 flex flex-col gap-1 shadow-lg">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ditt Lag</span>
              <div className="text-3xl font-black text-white italic">{localStats.players} <span className="text-xs text-slate-600 not-italic uppercase ml-1">Spelare</span></div>
          </div>
          <div className="p-6 rounded-[2rem] bg-slate-900 border border-slate-800 flex flex-col gap-1 shadow-lg">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Träningar</span>
              <div className="text-3xl font-black text-white italic">{localStats.sessions} <span className="text-xs text-slate-600 not-italic uppercase ml-1">Pass</span></div>
          </div>
          <div className="p-6 rounded-[2rem] bg-slate-900 border border-slate-800 flex flex-col gap-1 shadow-lg">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Silo-status</span>
              <div className="text-xl font-black text-emerald-500 uppercase italic">Privat Lagmoln</div>
          </div>
      </div>

      {/* Systemdiagnostik - Alltid synlig för inloggade coacher */}
      {!isGuest && (
          <div className="p-8 rounded-[2.5rem] bg-slate-900 border border-slate-800 shadow-xl space-y-6">
              <div className="flex items-center gap-3">
                  <Search size={18} className="text-blue-400" />
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">Systemdiagnostik</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  Använd detta verktyg för att verifiera att en spelarkod finns i databasen och kan hittas. Detta simulerar en spelarinloggning.
              </p>
              <div className="flex gap-3">
                  <input 
                      type="text" 
                      placeholder="Ange kod (t.ex. P-10-XY3Z)"
                      value={testCode}
                      onChange={(e) => setTestCode(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-blue-500 uppercase tracking-widest font-mono"
                  />
                  <button 
                      onClick={handleTestCode}
                      disabled={isTesting || !testCode}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest transition-all disabled:opacity-50"
                  >
                      {isTesting ? <Loader2 size={14} className="animate-spin" /> : 'Kontrollera'}
                  </button>
              </div>
              {testResult.status !== 'idle' && (
                  <div className={`p-4 rounded-xl border flex items-center gap-3 ${testResult.status === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                      {testResult.status === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                      <span className="text-xs font-bold">{testResult.message}</span>
                  </div>
              )}
          </div>
      )}

      {/* ADMIN-VERKTYG: ENDAST FÖR IBRAHIM */}
      {isSuperAdmin && !isGuest ? (
          <div className="space-y-6 animate-in slide-in-from-bottom duration-700">
            <div className="flex items-center gap-2 px-2">
               <Settings size={18} className="text-blue-500" />
               <h3 className="text-xs font-black text-white uppercase tracking-widest">Systemkontroll (Systemägare)</h3>
            </div>

            {/* Inbjudningspanel */}
            <div className="p-8 rounded-[2.5rem] bg-slate-900 border border-blue-500/30 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><ShieldCheck size={120} /></div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                  <div>
                      <h4 className="text-lg font-black text-white italic uppercase tracking-tighter flex items-center gap-2">
                          <UserPlus size={20} className="text-blue-500" /> Bjud in Coacher
                      </h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Ge kollegor tillgång till att bygga egna lag</p>
                  </div>
                  <button onClick={copyInviteLink} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all shadow-lg ${copyStatus ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 border border-slate-700'}`}>
                      {copyStatus ? <Check size={14} /> : <LinkIcon size={14} />}
                      {copyStatus ? 'Länk kopierad' : 'Kopiera App-länk'}
                  </button>
                </div>
                
                <div className="space-y-6 relative z-10">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input 
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="Ange coachens Gmail..."
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-sm text-white outline-none focus:border-blue-500 shadow-inner"
                        />
                        <button 
                          onClick={handleAddToWhitelist}
                          disabled={isSaving || !newEmail.includes('@')}
                          className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest disabled:opacity-50 shadow-xl"
                        >
                          {isSaving ? <Loader2 size={18} className="animate-spin" /> : 'Aktivera'}
                        </button>
                    </div>

                    <div className="grid gap-3">
                        {whitelist.map(email => (
                            <div key={email} className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-slate-800 hover:border-slate-700 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-inner"><Mail size={16} /></div>
                                    <span className="text-xs font-bold text-slate-300">{email}</span>
                                </div>
                                <button onClick={() => handleRemoveFromWhitelist(email)} className="p-3 text-slate-700 hover:text-rose-500 transition-colors"><X size={20} /></button>
                            </div>
                        ))}
                        {whitelist.length === 0 && (
                            <div className="text-center p-4 text-[10px] text-slate-600 font-bold uppercase">Inga coacher inbjudna än.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Databasregler */}
            <div className="p-8 rounded-[2.5rem] bg-slate-900 border border-emerald-500/20 shadow-2xl relative overflow-hidden">
                <div className="flex items-center gap-3 text-emerald-400 mb-4">
                    <FileCode size={24} />
                    <h3 className="text-xl font-black italic uppercase tracking-tighter">Databas-regler (Krävs för inbjudningar)</h3>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
                    <ShieldAlert size={20} className="text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-slate-300 text-xs font-bold leading-relaxed">
                        VIKTIGT: För att spelare ska kunna logga in från olika enheter måste du kopiera koden nedan och ersätta reglerna i Firebase Console.
                    </p>
                </div>
                <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 relative group">
                    <pre className="text-[10px] text-emerald-500/80 font-mono leading-tight overflow-x-auto whitespace-pre-wrap">
                        {dbRules}
                    </pre>
                    <button 
                        onClick={copyRules}
                        className="absolute top-4 right-4 p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all flex items-center gap-2"
                    >
                        {rulesCopied ? <span className="text-[10px] font-bold text-emerald-500">Kopierad!</span> : null}
                        {rulesCopied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                </div>
            </div>
            
            {/* Global Backup */}
            <div className="p-8 rounded-[2.5rem] bg-slate-900 border border-slate-800 shadow-xl space-y-6">
              <h3 className="text-xs font-black text-white italic uppercase tracking-widest flex items-center gap-2">
                  <Database size={18} className="text-orange-500" /> Systembackup
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                  <button onClick={() => dataService.exportTeamData()} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 transition-all flex items-center gap-4 shadow-inner">
                      <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl"><Download size={20} /></div>
                      <div className="text-left">
                        <div className="text-[10px] font-black text-white uppercase">Exportera Mitt Lag</div>
                      </div>
                  </button>
                  <label className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 transition-all flex items-center gap-4 cursor-pointer shadow-inner">
                      <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl"><Upload size={20} /></div>
                      <div className="text-left">
                        <div className="text-[10px] font-black text-white uppercase">Importera Backup</div>
                      </div>
                      <input type="file" className="hidden" accept=".json" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                              const reader = new FileReader();
                              reader.onload = (re) => { if (re.target?.result) dataService.importTeamData(re.target.result as string); };
                              reader.readAsText(file);
                          }
                      }} />
                  </label>
              </div>
            </div>
          </div>
      ) : (
          /* COACH VIEW - SIMPLIFIED */
          <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
             <div className="p-8 rounded-[2.5rem] bg-blue-500/5 border border-blue-500/20 shadow-xl flex items-start gap-6">
                <div className="w-16 h-16 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-400 shrink-0">
                    <ShieldAlert size={32} />
                </div>
                <div className="space-y-2">
                    <h4 className="text-lg font-black text-white italic uppercase tracking-tighter leading-none">Coach Silo Aktiv</h4>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                        Du är inloggad på din personliga coach-yta. All data du skapar (spelare, träningar, analyser) är helt privat och lagras i ditt eget lag-moln kopplat till ditt ID. Endast du har åtkomst till denna information.
                    </p>
                </div>
             </div>

             <div className="p-8 rounded-[2.5rem] bg-slate-900 border border-slate-800 shadow-xl space-y-6">
                <h3 className="text-xs font-black text-white italic uppercase tracking-widest flex items-center gap-2">
                    <Database size={18} className="text-orange-500" /> Hantera Lagdata
                </h3>
                <div className="grid grid-cols-1 gap-3">
                    <button onClick={() => dataService.exportTeamData()} className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 transition-all flex items-center gap-4">
                        <Download size={16} className="text-blue-500" />
                        <span className="text-[10px] font-black text-white uppercase">Spara lokal backup av mitt lag</span>
                    </button>
                </div>
             </div>
          </div>
      )}

      {/* Footer Branding */}
      <div className="text-center pt-8 opacity-20">
          <p className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-500">Basketcoach Pro • Ibrahim Qallaki Edition</p>
      </div>
    </div>
  );
};
