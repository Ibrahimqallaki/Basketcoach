
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
  Book,
  Upload,
  UserPlus,
  Mail,
  X,
  Link as LinkIcon,
  Check,
  ShieldCheck,
  Layout,
  ChevronRight,
  TrendingUp,
  BrainCircuit
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
  
  const isGuest = !user || user.uid === 'guest';
  const isSuperAdmin = dataService.isSuperAdmin();

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

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-24 px-2">
      {/* Profile Header */}
      <div className="p-8 rounded-[2.5rem] bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/5 rounded-full blur-[80px] -mr-32 -mt-32"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-20 h-20 rounded-3xl bg-slate-800 border-2 border-orange-500/30 overflow-hidden flex items-center justify-center shadow-2xl shrink-0">
            {user?.photoURL ? <img src={user.photoURL} alt="P" className="w-full h-full object-cover" /> : <Users size={32} className="text-slate-600" />}
          </div>
          <div className="text-center md:text-left space-y-2 flex-1">
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">
              {user?.displayName || 'Coach (Gäst)'}
            </h2>
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

      {/* DASHBOARD STATUS (FOR ALL COACHES) */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-6 rounded-[2rem] bg-slate-900 border border-slate-800 flex flex-col gap-1">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ditt Lag</span>
              <div className="text-3xl font-black text-white italic">{localStats.players} <span className="text-xs text-slate-600 not-italic">Spelare</span></div>
          </div>
          <div className="p-6 rounded-[2rem] bg-slate-900 border border-slate-800 flex flex-col gap-1">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Träningar</span>
              <div className="text-3xl font-black text-white italic">{localStats.sessions} <span className="text-xs text-slate-600 not-italic">Pass</span></div>
          </div>
          <div className="hidden md:flex p-6 rounded-[2rem] bg-slate-900 border border-slate-800 flex-col gap-1">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">App Version</span>
              <div className="text-3xl font-black text-white italic">5.5 <span className="text-xs text-slate-600 not-italic">STABLE</span></div>
          </div>
      </div>

      {/* WHITELIST MANAGEMENT (ONLY SUPER ADMIN) */}
      {isSuperAdmin && !isGuest && (
          <div className="p-8 rounded-[2.5rem] bg-slate-900 border border-blue-500/20 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><ShieldCheck size={120} /></div>
              <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-xs font-black text-white italic uppercase tracking-widest flex items-center gap-2">
                        <UserPlus size={18} className="text-blue-500" /> Administrera Coacher
                    </h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Bjud in kollegor till plattformen</p>
                </div>
                <button onClick={copyInviteLink} className={`flex items-center gap-2 px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${copyStatus ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    {copyStatus ? <Check size={12} /> : <LinkIcon size={12} />}
                    {copyStatus ? 'Länk kopierad' : 'Kopiera App-länk'}
                </button>
              </div>
              
              <div className="space-y-6 relative z-10">
                  <div className="flex gap-2">
                      <input 
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="Ange coachens Gmail..."
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-xs text-white outline-none focus:border-blue-500"
                      />
                      <button 
                        onClick={handleAddToWhitelist}
                        disabled={isSaving || !newEmail.includes('@')}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest disabled:opacity-50"
                      >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Bjud in'}
                      </button>
                  </div>

                  <div className="grid gap-2">
                      {whitelist.map(email => (
                          <div key={email} className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800 hover:border-slate-700 transition-colors">
                              <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500"><Mail size={14} /></div>
                                  <span className="text-xs font-bold text-slate-300">{email}</span>
                              </div>
                              <button onClick={() => handleRemoveFromWhitelist(email)} className="p-2 text-slate-600 hover:text-rose-500 transition-colors"><X size={16} /></button>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* FOOTER ACTIONS */}
      <div className="p-8 rounded-[2.5rem] bg-slate-900 border border-slate-800 shadow-xl space-y-6">
         <h3 className="text-xs font-black text-white italic uppercase tracking-widest flex items-center gap-2">
            <Database size={18} className="text-orange-500" /> Datahantering
         </h3>
         <div className="grid md:grid-cols-2 gap-4">
             <button onClick={() => dataService.exportTeamData()} className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 transition-all flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><Download size={16} /></div>
                <div className="text-[10px] font-black text-white uppercase">Exportera Mitt Lag</div>
             </button>
             <label className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 transition-all flex items-center gap-3 cursor-pointer">
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
