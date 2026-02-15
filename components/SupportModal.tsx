
import React, { useState } from 'react';
import { X, Send, Bug, Lightbulb, MessageSquare, Loader2, CheckCircle2 } from 'lucide-react';
import { dataService } from '../services/dataService';
import { auth } from '../services/firebase';
import { TicketType } from '../types';

interface SupportModalProps {
  onClose: () => void;
  userRole: 'coach' | 'player';
}

export const SupportModal: React.FC<SupportModalProps> = ({ onClose, userRole }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<TicketType>('feedback');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setSubmitting(true);
    try {
      const user = auth.currentUser;
      await dataService.createTicket({
        userId: user?.uid || 'guest',
        userEmail: user?.email || 'guest@basketcoach.pro',
        userName: user?.displayName || (userRole === 'coach' ? 'Gästcoach' : 'Spelare'),
        role: userRole,
        title,
        description,
        type,
        priority: type === 'bug' ? 'high' : 'medium'
      });
      setDone(true);
      setTimeout(onClose, 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 size={40} className="animate-in zoom-in" />
          </div>
          <h2 className="text-2xl font-black text-white uppercase italic">Tack för din feedback!</h2>
          <p className="text-slate-400 text-sm">Vi läser allt och återkommer om det behövs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
           <div>
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Support & Förslag</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Hjälp oss göra appen bättre</p>
           </div>
           <button onClick={onClose} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"><X size={20}/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
           <div className="grid grid-cols-3 gap-2">
              <button type="button" onClick={() => setType('feedback')} className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${type === 'feedback' ? 'bg-blue-600/10 border-blue-500 text-blue-400 shadow-inner' : 'bg-slate-950 border-slate-800 text-slate-600'}`}>
                <MessageSquare size={20} />
                <span className="text-[9px] font-black uppercase">Feedback</span>
              </button>
              <button type="button" onClick={() => setType('feature')} className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${type === 'feature' ? 'bg-amber-600/10 border-amber-500 text-amber-400 shadow-inner' : 'bg-slate-950 border-slate-800 text-slate-600'}`}>
                <Lightbulb size={20} />
                <span className="text-[9px] font-black uppercase">Förslag</span>
              </button>
              <button type="button" onClick={() => setType('bug')} className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${type === 'bug' ? 'bg-rose-600/10 border-rose-500 text-rose-400 shadow-inner' : 'bg-slate-950 border-slate-800 text-slate-600'}`}>
                <Bug size={20} />
                <span className="text-[9px] font-black uppercase">Bugg</span>
              </button>
           </div>

           <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Vad gäller det?</label>
              <input 
                required 
                placeholder="Kort rubrik..." 
                value={title} 
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:border-blue-500 outline-none shadow-inner"
              />
           </div>

           <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Beskrivning</label>
              <textarea 
                required 
                placeholder="Berätta mer..." 
                value={description} 
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:border-blue-500 outline-none shadow-inner h-32 resize-none"
              />
           </div>

           <button 
            disabled={submitting || !title.trim() || !description.trim()}
            type="submit" 
            className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
           >
              {submitting ? <Loader2 className="animate-spin" size={18}/> : <Send size={18} />}
              Skicka Ticket
           </button>
        </form>
      </div>
    </div>
  );
};
