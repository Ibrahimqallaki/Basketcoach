
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
  UserPlus,
  Mail,
  X,
  Link as LinkIcon
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
  
  // Whitelist States
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [copyStatus, setCopyStatus] = useState(false);
  
  const isGuest = !user || user.isAnonymous || user.uid === 'guest';
  const isSuperAdmin = dataService.isSuperAdmin();

  useEffect(() => {
    setLocalStats(dataService.getLocalDataStats());
    if (isSuperAdmin && !isGuest) {
        dataService.getWhitelistedEmails().then(setWhitelist);
    }
  }, [isSuperAdmin, isGuest]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.reload();
    } catch (error) {
      console.error("Logout failed", error);
    }
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
      } finally {
          setIsSaving(false);
      }
  };

  const handleRemoveFromWhitelist = async (email: string) => {
      setIsSaving(true);
      try {
          const updated = whitelist.filter(e => e !== email);
          await dataService.updateWhitelist(updated);
          setWhitelist(updated);
      } finally {
          setIsSaving(false);
      }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText("https://basketcoach.vercel.app");
    setCopyStatus(true);
    setTimeout(() => setCopyStatus(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-24 px-2">
      {/* Profile Header */}
      <div className="p-8 rounded-[2.5rem] bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/5 rounded-full blur-[80px] -mr-32 -mt-32"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-20 h-20 rounded-3xl bg-slate-800 border-2 border-orange-500/30 overflow-hidden flex items-center justify-center shadow-2xl shrink-0">
            {user?.photoURL ? <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" /> : <Users size={32} className="text-slate-600" />}
          </div>
          <div className="text-center md:text-left space-y-2 flex-1 min-w-0">
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter truncate">
              {user?.displayName || 'Coach (Gäst)'}
            </h2>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
               <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isGuest ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                 {isGuest ? <CloudOff size={12} /> : <CloudLightning size={12} />}
                 {isGuest ? 'Gästläge' : 'Inloggad'}
               </span>
               <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest bg-slate-950 px-3 py-1 rounded-full border border-slate-800 truncate max-w-[200px]">
                 {user?.email || `ID: ${user?.uid?.slice(0, 8)}...`}
               </span>
            </div>
          </div>
          <button onClick={handleLogout} className="px-6 py-3 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-500 transition-all text-[10px] font-black uppercase flex items-center gap-2">
            <LogOut size={16} /> Logga ut
          </button>
        </div>
      </div>

      {/* WHITELIST MANAGEMENT (SUPER ADMIN ONLY) */}
      {isSuperAdmin && !isGuest && (
          <div className="p-8 rounded-[2.5rem] bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xs font-black text-white italic uppercase tracking-widest flex items-center gap-2">
                    <UserPlus size={18} className="text-blue-500" /> App-åtkomst & Inbjudningar
                </h3>
                <button onClick={copyInviteLink} className={`flex items-center gap-2 px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${copyStatus ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    {copyStatus ? <Check size={12} /> : <LinkIcon size={12} />}
                    {copyStatus ? 'Länk kopierad' : 'Kopiera App-länk'}
                </button>
              </div>
              
              <div className="space-y-6">
                  <p className="text-[11px] text-slate-400 leading-relaxed max-w-lg">
                    Här bestämmer du vilka Gmail-adresser som har tillåtelse att logga in i appen. Inbjudna coacher får sitt eget konto och ser inte din data.
                  </p>

                  <div className="flex gap-2">
                      <div className="relative flex-1">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                          <input 
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            placeholder="Ange Gmail för inbjudan..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-xs text-white outline-none focus:border-blue-500 transition-colors"
                          />
                      </div>
                      <button 
                        onClick={handleAddToWhitelist}
                        disabled={isSaving || !newEmail.includes('@')}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-900/20 disabled:opacity-50"
                      >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Bjud in'}
                      </button>
                  </div>

                  <div className="grid gap-2">
                      {whitelist.map(email => (
                          <div key={email} className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
                              <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                      <Mail size={14} />
                                  </div>
                                  <span className="text-xs font-bold text-slate-300">{email}</span>
                              </div>
                              <button onClick={() => handleRemoveFromWhitelist(email)} className="p-2 text-slate-600 hover:text-rose-500 transition-colors" title="Ta bort åtkomst"><X size={16} /></button>
                          </div>
                      ))}
                      {whitelist.length === 0 && (
                          <div className="text-center py-6 border-2 border-dashed border-slate-800 rounded-2xl text-slate-600 text-[10px] font-black uppercase tracking-widest">Ingen whitelist aktiverad (Alla får logga in)</div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* Manual & Data Resources */}
      <div className="p-8 rounded-[2.5rem] bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
         <h3 className="text-xs font-black text-white italic uppercase tracking-widest flex items-center gap-2 mb-6">
            <Book size={18} className="text-orange-500" /> Manual & Backup
         </h3>
         <div className="grid md:grid-cols-2 gap-4">
             <button onClick={() => window.open('/manual.html', '_blank')} className="col-span-1 md:col-span-2 p-6 rounded-2xl bg-gradient-to-r from-orange-600/10 to-orange-600/5 border border-orange-500/20 hover:border-orange-500/50 transition-all flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-lg"><Book size={24} /></div>
                <div className="text-left flex-1">
                    <h4 className="text-sm font-black text-white uppercase italic">Öppna Manualen</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Lär dig allt om plattformen.</p>
                </div>
                <ExternalLink size={16} className="text-slate-500" />
             </button>
             <button onClick={() => dataService.exportTeamData()} className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 transition-all flex items-center gap-3 text-left">
                <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><Download size={16} /></div>
                <div className="text-[10px] font-black text-white uppercase">Exportera Backup</div>
             </button>
             <label className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 transition-all flex items-center gap-3 cursor-pointer text-left">
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg"><Upload size={16} /></div>
                <div className="text-[10px] font-black text-white uppercase">Importera Backup</div>
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
  );
};
