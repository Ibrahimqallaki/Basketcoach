
import React from 'react';
import { View } from '../types';
import { 
  LayoutDashboard, 
  Users, 
  CalendarDays, 
  ClipboardCheck,
  Trophy,
  MonitorPlay,
  Bot,
  Wrench
} from 'lucide-react';
// Fix: Added @ts-ignore to bypass environment-specific resolution issues with Firebase exports
// @ts-ignore
import type { User } from 'firebase/auth';

interface SidebarProps {
  activeView: View;
  onNavigate: (view: View) => void;
  user: User | null;
  onLock?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, onNavigate, user }) => {
  
  const menuItems = [
    { id: View.DASHBOARD, label: 'Hem', icon: LayoutDashboard },
    { id: View.ROSTER, label: 'Laget', icon: Users },
    { id: View.PLAN, label: 'Plan', icon: CalendarDays },
    { id: View.TRAINING, label: 'Träna', icon: ClipboardCheck },
    { id: View.MATCH_EVAL, label: 'Match', icon: Trophy },
    { id: View.VIDEO_ANALYSIS, label: 'Video', icon: MonitorPlay },
    { id: View.AI_COACH, label: 'AI Assistent', icon: Bot, isNew: true },
    { id: View.TOOLS, label: 'Verktyg', icon: Wrench },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 p-4 flex-col h-full shrink-0">
        <div className="flex-1 rounded-[2rem] bg-slate-900/80 backdrop-blur-xl border border-white/5 flex flex-col overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="p-8 pb-4">
             <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center shadow-lg shadow-orange-900/50">
                   <Trophy size={16} className="text-white" />
                </div>
                <span className="text-lg font-black italic uppercase text-white tracking-tighter">Coach Pro</span>
             </div>
             <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-11">Säsong 25/26</div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar py-4">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group relative ${
                  activeView === item.id
                    ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg shadow-orange-900/20 translate-x-1'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${activeView === item.id ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                <span className="font-bold text-xs uppercase tracking-wide">{item.label}</span>
                {activeView === item.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white"></div>}
                
                {/* Desktop New Indicator */}
                {/* @ts-ignore */}
                {item.isNew && (
                  <span className="absolute right-2 top-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Mobile Bottom Navigation - Fixed layout, no scrolling */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-slate-900/95 backdrop-blur-xl border border-white/10 h-16 rounded-2xl flex items-center z-50 shadow-2xl px-1 overflow-hidden">
        <div className="flex items-center justify-between w-full h-full px-2">
          {menuItems.slice(0, 5).map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center gap-1 transition-all relative w-12 h-12 rounded-xl ${
                activeView === item.id ? 'text-orange-500 bg-white/5' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <item.icon className="w-5 h-5" strokeWidth={activeView === item.id ? 2.5 : 2} />
              <span className="text-[8px] font-bold uppercase tracking-tight scale-75">{item.label}</span>
            </button>
          ))}
          {/* Mobile More Button for Extra Items */}
           <button
              onClick={() => onNavigate(View.TOOLS)}
              className={`flex flex-col items-center justify-center gap-1 transition-all relative w-12 h-12 rounded-xl ${
                activeView === View.TOOLS || activeView === View.AI_COACH ? 'text-orange-500 bg-white/5' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Wrench className="w-5 h-5" strokeWidth={activeView === View.TOOLS ? 2.5 : 2} />
              <span className="text-[8px] font-bold uppercase tracking-tight scale-75">Mer</span>
            </button>
        </div>
      </nav>
    </>
  );
};
