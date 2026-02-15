
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Trash2, Eraser, Pencil, Maximize2, Minimize2, Check, X } from 'lucide-react';

interface TacticalWhiteboardProps {
  onSave?: (dataUrl: string) => void;
  onClose?: () => void;
  id: string;
}

export const TacticalWhiteboard: React.FC<TacticalWhiteboardProps> = ({ onSave, onClose, id }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ffffff');
  const [mode, setMode] = useState<'pencil' | 'eraser'>('pencil');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Funktion för att spara och återställa canvas-innehåll vid storleksändring
  const updateCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    
    if (rect.width === 0 || rect.height === 0) return;

    // Spara nuvarande innehåll temporärt
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    if (tempCtx && canvas.width > 0) {
        tempCtx.drawImage(canvas, 0, 0);
    }

    // Uppdatera canvas interna storlek till behållarens faktiska storlek
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.imageSmoothingEnabled = true;
      
      // Rita tillbaka det sparade innehållet
      if (tempCanvas.width > 0) {
        ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, canvas.width, canvas.height);
      }
      
      // Återställ penselinställningar
      ctx.strokeStyle = mode === 'eraser' ? '#000000' : color;
      ctx.lineWidth = mode === 'eraser' ? (isFullscreen ? 40 : 20) : (isFullscreen ? 6 : 4);
    }
  }, [color, mode, isFullscreen]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
        window.requestAnimationFrame(updateCanvasSize);
    });

    observer.observe(container);

    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      setTimeout(updateCanvasSize, 100);
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    setTimeout(updateCanvasSize, 100);

    return () => {
      observer.disconnect();
      document.removeEventListener('fullscreenchange', handleFsChange);
    };
  }, [updateCanvasSize]);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  };

  // FÖRBÄTTRAD KOORDINATBERÄKNING (KALIBRERING)
  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    
    // Hämta råa klient-koordinater
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    // Beräkna skalningsfaktor mellan CSS-pixlar och interna canvas-pixlar
    // Detta fixar offset-felet om canvasen är skalad via CSS
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (e.cancelable) e.preventDefault();
    const { x, y } = getPos(e);
    
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      setIsDrawing(true);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    if (e.cancelable) e.preventDefault();

    const { x, y } = getPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.lineWidth = mode === 'eraser' ? (isFullscreen ? 40 : 20) : (isFullscreen ? 6 : 4);
      ctx.globalCompositeOperation = mode === 'eraser' ? 'destination-out' : 'source-over';
      ctx.strokeStyle = color;
      
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleManualSave = () => {
    if (canvasRef.current && onSave) {
      onSave(canvasRef.current.toDataURL());
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  return (
    <div 
      ref={containerRef} 
      className={`flex flex-col bg-slate-950 select-none overflow-hidden ${isFullscreen ? 'fixed inset-0 z-[9999]' : 'h-full w-full'}`}
      style={{ touchAction: 'none' }}
    >
      {/* Toolbar */}
      <div className={`flex items-center justify-between p-2 bg-slate-900 border-b border-slate-800 gap-2 shrink-0 ${isFullscreen ? 'p-4' : ''}`}>
        <div className="flex-1 flex items-center gap-2 overflow-x-auto hide-scrollbar pr-4">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
            <button 
              onClick={() => { setMode('pencil'); setColor('#ffffff'); }}
              className={`p-2 rounded-lg transition-all ${mode === 'pencil' && color === '#ffffff' ? 'bg-white text-black shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Pencil size={isFullscreen ? 24 : 18} />
            </button>
            <button 
              onClick={() => { setMode('pencil'); setColor('#f97316'); }}
              className={`w-10 h-10 flex items-center justify-center transition-all ${color === '#f97316' && mode === 'pencil' ? 'scale-110' : 'opacity-40 hover:opacity-70'}`}
            >
              <div className={`rounded-full bg-orange-500 border-2 border-white/20 shadow-lg ${isFullscreen ? 'w-8 h-8' : 'w-6 h-6'}`} />
            </button>
            <button 
              onClick={() => { setMode('pencil'); setColor('#3b82f6'); }}
              className={`w-10 h-10 flex items-center justify-center transition-all ${color === '#3b82f6' && mode === 'pencil' ? 'scale-110' : 'opacity-40 hover:opacity-70'}`}
            >
              <div className={`rounded-full bg-blue-500 border-2 border-white/20 shadow-lg ${isFullscreen ? 'w-8 h-8' : 'w-6 h-6'}`} />
            </button>
          </div>

          <div className="w-px h-8 bg-slate-800 mx-1 shrink-0" />

          <button 
            onClick={() => setMode('eraser')}
            className={`p-2 rounded-lg transition-all shrink-0 ${mode === 'eraser' ? 'bg-slate-700 text-white shadow-inner' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Eraser size={isFullscreen ? 24 : 18} />
          </button>

           <button 
            onClick={clearCanvas}
            className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all shrink-0"
          >
            <Trash2 size={isFullscreen ? 24 : 18} />
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0 pl-2 border-l border-slate-800">
          {onSave && (
              <button 
                onClick={handleManualSave}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg font-black uppercase text-[10px] tracking-widest transition-all active:scale-95"
              >
                <Check size={16} />
                <span className={isFullscreen ? "inline" : "hidden sm:inline"}>Spara</span>
              </button>
          )}

          <button 
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition-all shadow-lg"
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>

          {onClose && (
            <button 
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:bg-rose-600 hover:text-white transition-all"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Drawing Area */}
      <div className="flex-1 relative cursor-crosshair bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-25 flex items-center justify-center p-4">
          <div className="w-full h-full border-2 border-white relative max-w-[800px] aspect-[1/1.4]">
             <div className="absolute inset-1 border border-white/30"></div>
             <div className="absolute bottom-0 left-0 w-full h-px bg-white/80"></div>
             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 aspect-square border-2 border-white rounded-full translate-y-1/2"></div>
             <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[95%] aspect-square border-2 border-white rounded-full"></div>
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[35%] h-[30%] border-2 border-t-0 border-white bg-white/5"></div>
             <div className="absolute top-[22%] left-1/2 -translate-x-1/2 w-[35%] aspect-square border-2 border-white rounded-full"></div>
             <div className="absolute top-[6%] left-1/2 -translate-x-1/2 w-[22%] h-0.5 bg-white"></div>
          </div>
        </div>

        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="absolute inset-0 z-20 w-full h-full block touch-none"
        />
      </div>
      
      {isFullscreen && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-1 rounded-full text-[10px] text-white/50 pointer-events-none">
              Helskärmsläge
          </div>
      )}
    </div>
  );
};
