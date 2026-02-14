
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
  BrainCircuit,
  Settings,
  ShieldAlert
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
      {/* Profil Header */}
      <div className="p-8 rounded-[2.5rem] bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/5 rounded-full blur-[80px] -mr-32 -mt-32"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-20 h-20 rounded-3xl bg-slate-800 border-2 border-orange-500/30 overflow-hidden flex items-center justify-center shadow-2xl shrink-0">
            {user?.photoURL ? <img src={user.photoURL} alt="P" className="w-full h-full object-cover" /> : <Users size={32} className="text-slate-600" />}
          </div>
          <div className="text-center md:text-left space-y-2 flex-1">
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">
              {user?.displayName || 'Coach'}
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

      {/* Lagstatistik - Visas för alla */}
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
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Systemstatus</span>
              <div className="text-xl font-black text-emerald-500 uppercase italic">Online</div>
          </div>
      </div>

      {/* ADMIN-VERKTYG: BJUD IN COACHER (Endast SuperAdmin) */}
      {isSuperAdmin && !isGuest && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 px-2">
               <Settings size={18} className="text-blue-500" />
               <h3 className="text-xs font-black text-white uppercase tracking-widest">Systemkontroll (Admin)</h3>
            </div>

            <div className="p-8 rounded-[2.5rem] bg-slate-900 border border-blue-500/30 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><ShieldCheck size={120} /></div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                  <div>
                      <h4 className="text-lg font-black text-white italic uppercase tracking-tighter flex items-center gap-2">
                          <UserPlus size={20} className="text-blue-500" /> Administrera Coacher
                      </h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Bjud in kollegor för att låta dem bygga sina egna lag</p>
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
                          placeholder="Ange coachens e-post (Gmail)..."
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-sm text-white outline-none focus:border-blue-500 shadow-inner"
                        />
                        <button 
                          onClick={handleAddToWhitelist}
                          disabled={isSaving || !newEmail.includes('@')}
                          className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest disabled:opacity-50 shadow-xl shadow-blue-900/20 active:scale-95 transition-all"
                        >
                          {isSaving ? <Loader2 size={18} className="animate-spin" /> : 'Bjud in'}
                        </button>
                    </div>

                    <div className="grid gap-3">
                        {whitelist.map(email => (
                            <div key={email} className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-slate-800 hover:border-slate-700 transition-colors group/item">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-inner"><Mail size={16} /></div>
                                    <span className="text-xs font-bold text-slate-300">{email}</span>
                                </div>
                                <button onClick={() => handleRemoveFromWhitelist(email)} className="p-3 text-slate-700 hover:text-rose-500 transition-colors"><X size={20} /></button>
                            </div>
                        ))}
                        {whitelist.length === 0 && (
                            <div className="text-center py-8 border-2 border-dashed border-slate-800 rounded-3xl">
                                <p className="text-[10px] font-black text-slate-600 uppercase">Inga inbjudna coacher än</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Global Backup - Endast Admin */}
            <div className="p-8 rounded-[2.5rem] bg-slate-900 border border-slate-800 shadow-xl space-y-6">
              <h3 className="text-xs font-black text-white italic uppercase tracking-widest flex items-center gap-2">
                  <Database size={18} className="text-orange-500" /> Systembackup & Export
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                  <button onClick={() => dataService.exportTeamData()} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 transition-all flex items-center gap-4 shadow-inner group">
                      <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl group-hover:scale-110 transition-transform"><Download size={20} /></div>
                      <div className="text-left">
                        <div className="text-[10px] font-black text-white uppercase">Exportera Systemdata</div>
                        <div className="text-[8px] text-slate-500 font-bold uppercase mt-1">Spara till lokal fil</div>
                      </div>
                  </button>
                  <label className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 transition-all flex items-center gap-4 cursor-pointer shadow-inner group">
                      <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl group-hover:scale-110 transition-transform"><Upload size={20} /></div>
                      <div className="text-left">
                        <div className="text-[10px] font-black text-white uppercase">Importera Backup</div>
                        <div className="text-[8px] text-slate-500 font-bold uppercase mt-1">Återställ från fil</div>
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
      )}

      {/* Info för coacher om de inte ser admin-vyn */}
      {!isSuperAdmin && !isGuest && (
        <div className="p-6 rounded-3xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-4">
           <ShieldAlert size={20} className="text-blue-500 shrink-0 mt-1" />
           <div className="space-y-1">
              <h4 className="text-xs font-black text-white uppercase">Silo-läge Aktivt</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                Du är inloggad som certifierad coach. All data du skapar (spelare, träningar, analyser) är helt privat och lagras i ditt eget lag-moln. Endast du har åtkomst till din data.
              </p>
           </div>
        </div>
      )}

      {/* Footer Branding */}
      <div className="text-center pt-8 opacity-20">
          <p className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-500">Basketcoach Pro • Secured by Firebase</p>
      </div>
    </div>
  );
};
