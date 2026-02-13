import React from 'react';
import { Key, ShieldCheck, ExternalLink, X } from 'lucide-react';

interface KeySelectionOverlayProps {
  onKeySelected: () => void;
}

export const KeySelectionOverlay: React.FC<KeySelectionOverlayProps> = ({ onKeySelected }) => {
  const handleOpenKeyDialog = async () => {
    try {
      if (window.aistudio?.openSelectKey) {
        await window.aistudio.openSelectKey();
        onKeySelected();
      }
    } catch (err) {
      console.error("Failed to open key dialog", err);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-8 relative">
        <button 
          onClick={onKeySelected}
          className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/40">
            <Key className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">API-nyckel</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            För att använda de mest avancerade AI-modellerna (Veo 3.1 & Gemini 3 Pro) i studion behöver du välja en API-nyckel.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleOpenKeyDialog}
            className="w-full flex items-center justify-center space-x-2 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg shadow-blue-900/20 uppercase text-xs tracking-widest"
          >
            <ShieldCheck size={18} />
            <span>Välj API-nyckel</span>
          </button>
          
          <button
            onClick={onKeySelected}
            className="w-full py-3 text-slate-500 hover:text-slate-300 text-[10px] font-black uppercase tracking-widest transition-colors"
          >
            Hoppa över (Begränsad AI)
          </button>
        </div>

        <div className="flex justify-center">
            <a
                href="https://ai.google.dev/gemini-api/docs/billing"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] text-slate-600 hover:text-blue-400 transition-colors uppercase font-bold tracking-widest"
            >
                <span>Läs om debitering</span>
                <ExternalLink size={10} />
            </a>
        </div>
      </div>
    </div>
  );
};