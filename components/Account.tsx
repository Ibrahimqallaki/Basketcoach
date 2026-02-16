
import React, { useState, useEffect, useMemo } from 'react';
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
  AlertTriangle,
  LayoutGrid,
  ClipboardList,
  Bug,
  Lightbulb,
  MessageSquare,
  Clock,
  Trash2,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Eye,
  Info,
  Shield,
  Zap
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { auth } from '../services/firebase';
import { AppTicket, TicketStatus } from '../types';

interface AccountProps {
  user: User | null;
}

const TicketCard: React.FC<{ 
  ticket: AppTicket; 
  onUpdateStatus: (id: string, status: TicketStatus) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}> = ({ 
  ticket, 
  onUpdateStatus, 
  onDelete 
}) => (
    <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 group relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-1 h-full ${ticket.type === 'bug' ? 'bg-rose-500' : ticket.type === 'feature' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
        <div className="flex justify-between items-start pl-2">
            <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${ticket.type === 'bug' ? 'bg-rose-500/10 text-rose-500' : ticket.type === 'feature' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-500'}`}>
                        {ticket.type}
                    </span>
                    <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest truncate">{ticket.userName}</span>
                </div>
                <h5 className="text-sm font-black text-white uppercase truncate">{ticket.title}</h5>
            </div>
            <button onClick={() => onDelete(ticket.id)} className="p-2 text-slate-700 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14}/></button>
        </div>
        <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic pl-2">"{ticket.description}"</p>
        
        <div className="flex gap-1 pl-2">
            {(['backlog', 'todo', 'in_progress', 'done'] as TicketStatus[]).map(s => (
                <button 
                  key={s} 
                  onClick={() => onUpdateStatus(ticket.id, s)}
                  className={`flex-1 py-1.5 rounded-lg text-[7px] font-black uppercase transition-all ${ticket.status === s ? 'bg-white text-black' : 'bg-slate-900 text-slate-600 hover:text-slate-400'}`}
                >
                    {s.replace('_', ' ')}
                </button>
            ))}
        </div>
    </div>
);

export const Account: React.FC<AccountProps> = ({ user }) => {
  const [localStats, setLocalStats] = useState({ players: 0, sessions: 0 });
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [tickets, setTickets] = useState<AppTicket[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [copyStatus, setCopyStatus] = useState(false);
  const [rulesCopied, setRulesCopied] = useState(false);
  
  // Debug & Test state
  const [testCode, setTestCode] = useState("");
  const [testResult, setTestResult] = useState<{status: 'success' | 'error' | 'idle', message: string}>({ status: 'idle', message: '' });
  const [isTesting, setIsTesting] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  const isGuest = !user || user.uid === 'guest';
  
  // Mycket robust check för Ibrahim
  const isSuperAdmin = useMemo(() => {
    return dataService.isSuperAdmin(user);
  }, [user]);

  const dbRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // 1. Inställningar (Whitelist)
    match /app_settings/{document=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.email.lower() == "ibrahim.qallaki@gmail.com";
    }

    // 2. Tickets (Feedback Loop)
    match /app_tickets/{ticketId} {
      allow create: if request.auth != null; 
      allow read: if request.auth != null && (resource.data.userId == request.auth.uid || request.auth.token.email.lower() == "ibrahim.qallaki@gmail.com");
      allow update, delete: if request.auth != null && request.auth.token.email.lower() == "ibrahim.qallaki@gmail.com";
    }

    // 3. Spelardata
    match /{path=**}/players/{playerId} {
      allow read: if true; 
    }

    // 4. Användardata
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && (request.auth.uid == userId || request.auth.token.email.lower() == "ibrahim.qallaki@gmail.com");
    }
  }
}`;

  const loadAdminData = async () => {
      if (user && !isGuest) {
          setLoadingTickets(true);
          try {
            // Vi hämtar all data och låter dataService sköta filtreringen baserat på SuperAdmin-status
            const [w, t] = await Promise.all([
                dataService.getWhitelistedEmails(),
                dataService.getTickets(user)
            ]);
            setWhitelist(w);
            setTickets(t);
          } catch (err) {
            console.error("Admin fetch failed:", err);
          } finally {
            setLoadingTickets(false);
          }
      }
  };

  useEffect(() => {
    setLocalStats(dataService.getLocalDataStats());
    loadAdminData();
  }, [user, isGuest]);

  const handleLogout = async () => {
    await signOut(auth);
    window.location.reload();
  };

  const handleUpdateTicket = async (id: string, status: TicketStatus) => {
      await dataService.updateTicketStatus(id, status);
      setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  };

  const handleDeleteTicket = async (id: string) => {
      if (!confirm("Radera ticket?")) return;
      await dataService.deleteTicket(id);
      setTickets(prev => prev.filter(t => t.id !== id));
  };

  const handleAddToWhitelist = async () => {
      const email = newEmail.toLowerCase().trim();
      if (!email || !email.includes('@')) return;
      if (whitelist.map(e => e.toLowerCase().trim()).includes(email)) return;
      
      setIsSaving(true);
      try {
          const updated = [...whitelist, email];
          await dataService.updateWhitelist(updated);
          setWhitelist(updated);
          setNewEmail("");
      } finally { setIsSaving(false); }
  };

  const handleRemoveFromWhitelist = async (email: string) => {
      if (!confirm(`Ta bort ${email} från tillåtna coacher?`)) return;
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
          const result = await dataService.loginPlayer(testCode);
          if (result) {
              setTestResult({ status: 'success', message: `Hittade: ${result.player.name} (#${result.player.number})` });
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
               <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${isSuperAdmin ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.2)]' : 'bg-slate-950 text-slate-500 border-slate-800'}`}>
                 {isSuperAdmin ? 'Systemägare' : 'Certifierad Coach'}
               </span>
            </div>
          </div>
          <button onClick={handleLogout} className="px-6 py-3 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-500 transition-all text-[10px] font-black uppercase flex items-center gap-2">
            <LogOut size={16} /> Logga ut
          </button>
        </div>
      </div>

      {/* KANBAN BOARD (Säkrad för Ibrahim) */}
      {(isSuperAdmin || showDebug) && !isGuest && (
          <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <LayoutGrid size={20} className="text-indigo-400" />
                    <h3 className="text-xs font-black text-white uppercase tracking-widest">Feedback Kanban</h3>
                    {loadingTickets && <Loader2 size={14} className="animate-spin text-slate-600" />}
                </div>
                <div className="flex items-center gap-4">
                    <button 
                      onClick={loadAdminData}
                      disabled={loadingTickets}
                      className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-500 hover:text-white transition-all flex items-center gap-2 text-[8px] font-black uppercase"
                    >
                      <RefreshCw size={12} className={loadingTickets ? 'animate-spin' : ''} /> Uppdatera
                    </button>
                    <div className="hidden sm:flex gap-4">
                        <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div><span className="text-[8px] font-bold text-slate-500 uppercase">Bugg</span></div>
                        <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div><span className="text-[8px] font-bold text-slate-500 uppercase">Förslag</span></div>
                        <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div><span className="text-[8px] font-bold text-slate-500 uppercase">Allmänt</span></div>
                    </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                  {[
                      { id: 'backlog', label: 'Backlog', color: 'text-slate-500' },
                      { id: 'todo', label: 'Att Göra', color: 'text-blue-400' },
                      { id: 'in_progress', label: 'Pågår', color: 'text-amber-400' },
                      { id: 'done', label: 'Färdigt', color: 'text-emerald-400' }
                  ].map(column => (
                      <div key={column.id} className="space-y-3">
                          <div className="flex items-center justify-between px-2 mb-2">
                              <span className={`text-[10px] font-black uppercase tracking-widest ${column.color}`}>{column.label}</span>
                              <span className="text-[10px] font-black text-slate-800">{tickets.filter(t => t.status === column.id).length}</span>
                          </div>
                          <div className="space-y-3 min-h-[100px]">
                              {tickets.filter(t => t.status === column.id).map(ticket => (
                                  <TicketCard 
                                    key={ticket.id} 
                                    ticket={ticket} 
                                    onUpdateStatus={handleUpdateTicket}
                                    onDelete={handleDeleteTicket}
                                  />
                              ))}
                              {tickets.filter(t => t.status === column.id).length === 0 && (
                                  <div className="p-8 border-2 border-dashed border-slate-900 rounded-2xl flex flex-col items-center justify-center opacity-20">
                                      <ClipboardList size={20} className="text-slate-600" />
                                  </div>
                              )}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* Lagstatistik */}
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

      {/* SYSTEMÄGARE PANEL (Hårdkodad synlighet för Ibrahim) */}
      {(isSuperAdmin || (user?.email?.toLowerCase().includes("ibrahim.qallaki"))) && !isGuest && (
          <div className="space-y-6 animate-in slide-in-from-bottom duration-700">
            <div className="flex items-center gap-2 px-2">
               <Settings size={18} className="text-blue-500" />
               <h3 className="text-xs font-black text-white uppercase tracking-widest">Systemägare Panel</h3>
            </div>

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

            {/* Databasregler Panel */}
            <div className="p-8 rounded-[2.5rem] bg-slate-900 border border-emerald-500/20 shadow-2xl relative overflow-hidden">
                <div className="flex items-center gap-3 text-emerald-400 mb-4">
                    <FileCode size={24} />
                    <h3 className="text-xl font-black italic uppercase tracking-tighter">Databas-regler (v5.8.1)</h3>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
                    <ShieldAlert size={20} className="text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-slate-300 text-xs font-bold leading-relaxed">
                        Kopiera koden nedan och ersätt reglerna i Firebase Console. Detta inkluderar nu regler för Ticket-systemet och rätt ägar-behörighet.
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
          </div>
      )}

      {/* Systemdiagnostik */}
      {!isGuest && (
          <div className="p-8 rounded-[2.5rem] bg-slate-900 border border-slate-800 shadow-xl space-y-6">
              <div className="flex items-center gap-3">
                  <Search size={18} className="text-blue-400" />
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">Spelarkods-testare</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  Använd detta för att kontrollera om en spelares kod fungerar i databasen.
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

      {/* Global Backup & Backup Control */}
      {!isGuest && (
          <div className="p-8 rounded-[2.5rem] bg-slate-900 border border-slate-800 shadow-xl space-y-6">
              <h3 className="text-xs font-black text-white italic uppercase tracking-widest flex items-center gap-2">
                  <Database size={18} className="text-orange-500" /> Lagdata & Backup
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                  <button onClick={() => dataService.exportTeamData()} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 transition-all flex items-center gap-4 shadow-inner">
                      <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl"><Download size={20} /></div>
                      <div className="text-left">
                        <div className="text-[10px] font-black text-white uppercase">Exportera Backup</div>
                        <div className="text-[8px] text-slate-500 font-bold uppercase mt-1">Spara JSON-fil lokalt</div>
                      </div>
                  </button>
                  <label className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 transition-all flex items-center gap-4 cursor-pointer shadow-inner">
                      <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl"><Upload size={20} /></div>
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
      )}

      {/* ADMIN DEBUG SECTION */}
      <div className="mt-12 p-6 rounded-2xl bg-slate-950 border border-slate-800">
          <button 
            onClick={() => setShowDebug(!showDebug)}
            className="flex items-center gap-2 text-[8px] font-black text-slate-600 uppercase tracking-widest hover:text-slate-400"
          >
            <Info size={10} /> {showDebug ? 'Dölj' : 'Visa'} Admin Diagnostik
          </button>
          
          {showDebug && (
            <div className="mt-4 grid grid-cols-2 gap-4 animate-in fade-in duration-300">
                <div className="space-y-2">
                    <span className="text-[8px] font-black text-slate-500 uppercase">Inloggad Email</span>
                    <div className="p-3 bg-slate-900 rounded-lg text-[10px] font-mono text-blue-400 truncate">{user?.email || "Saknas"}</div>
                </div>
                <div className="space-y-2">
                    <span className="text-[8px] font-black text-slate-500 uppercase">SuperAdmin Status</span>
                    <div className={`p-3 rounded-lg text-[10px] font-black ${isSuperAdmin ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        {isSuperAdmin ? "AKTIV" : "NEKAD"}
                    </div>
                </div>
                <div className="col-span-2 p-4 bg-blue-600/10 border border-blue-500/20 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-blue-400">
                        <Zap size={14} />
                        <span className="text-[10px] font-black uppercase">Instruktion till Ibrahim</span>
                    </div>
                    <p className="text-[10px] text-slate-300 leading-relaxed font-medium">
                        Om du ser <span className="text-emerald-500 font-black">AKTIV</span> men Kanban-tavlan fortfarande är tom: Se till att du faktiskt har skapat några "Tickets" (via Support-knappen i verktygslådan). Om du har gjort det och den är tom, kontrollera att du har kopierat in de nya reglerna till Firebase Console.
                    </p>
                </div>
            </div>
          )}
      </div>

      <div className="text-center pt-8 opacity-20">
          <p className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-500">Basketcoach Pro • Ibrahim Qallaki Edition</p>
      </div>
    </div>
  );
};
