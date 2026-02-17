
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Trash2, Eraser, Pencil, Maximize2, Minimize2, Check, User } from 'lucide-react';

interface TacticalWhiteboardProps {
  onSave?: (dataUrl: string) => void;
  id: string;
}

const COLORS = [
    { name: 'White', value: '#ffffff' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Emerald', value: '#10b981' },
    { name: 'Rose', value: '#f43f5e' },
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Purple', value: '#a855f7' }
];

export const TacticalWhiteboard: React.FC<TacticalWhiteboardProps> = ({ onSave, id }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ffffff');
  const [mode, setMode] = useState<'pencil' | 'eraser' | 'player'>('pencil');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState(1);

  const updateCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    if (tempCtx && canvas.width > 0) {
        tempCtx.drawImage(canvas, 0, 0);
    }

    canvas.width = rect.width;
    canvas.height = rect.height;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.imageSmoothingEnabled = true;
      if (tempCanvas.width > 0) {
        ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, canvas.width, canvas.height);
      }
      ctx.strokeStyle = mode === 'eraser' ? '#000000' : color;
      ctx.lineWidth = mode === 'eraser' ? (isFullscreen ? 40 : 20) : (isFullscreen ? 6 : 4);
    }
  }, [color, mode, isFullscreen]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => window.requestAnimationFrame(updateCanvasSize));
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
      if (!document.fullscreenElement) await containerRef.current.requestFullscreen();
      else await document.exitFullscreen();
    } catch (err) { console.error(err); }
  };

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const drawPlayer = (ctx: CanvasRenderingContext2D, x: number, y: number, num: number) => {
    const size = isFullscreen ? 26 : 20;
    // Circle Shadow
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fill();

    // Main Circle
    ctx.beginPath();
    ctx.arc(x, y, size - 2, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Number
    ctx.fillStyle = (color === '#ffffff' || color === '#f59e0b' || color === '#f97316') ? '#000000' : '#ffffff';
    ctx.font = `bold ${isFullscreen ? '18px' : '14px'} Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(num.toString(), x, y);
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (e.cancelable) e.preventDefault();
    const { x, y } = getPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    if (mode === 'player') {
        drawPlayer(ctx, x, y, selectedNumber);
        return;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || mode === 'player') return;
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

  const stopDrawing = () => setIsDrawing(false);

  const clearCanvas = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx && canvasRef.current) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  return (
    <div 
      ref={containerRef} 
      className={`flex flex-col bg-slate-950 select-none overflow-hidden ${isFullscreen ? 'fixed inset-0 z-[9999]' : 'h-full w-full'}`}
      style={{ touchAction: 'none' }}
    >
      {/* Toolbar with increased padding */}
      <div className={`flex flex-col md:flex-row items-center justify-between p-4 bg-slate-900 border-b border-slate-800 gap-4 shrink-0`}>
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          {/* Main Tools Grouped */}
          <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shrink-0 shadow-inner">
            <button 
              onClick={() => setMode('pencil')}
              className={`p-3 rounded-xl transition-all ${mode === 'pencil' ? 'bg-white text-black shadow-lg scale-105' : 'text-slate-500 hover:text-slate-300'}`}
              title="Penna"
            >
              <Pencil size={isFullscreen ? 24 : 18} />
            </button>
            <button 
              onClick={() => setMode('player')}
              className={`p-3 rounded-xl transition-all ${mode === 'player' ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'text-slate-500 hover:text-slate-300'}`}
              title="Placera Spelare"
            >
              <User size={isFullscreen ? 24 : 18} />
            </button>
            <button 
              onClick={() => setMode('eraser')}
              className={`p-3 rounded-xl transition-all ${mode === 'eraser' ? 'bg-slate-700 text-white shadow-inner scale-105' : 'text-slate-500 hover:text-slate-300'}`}
              title="Sudda"
            >
              <Eraser size={isFullscreen ? 24 : 18} />
            </button>
          </div>

          {/* Number Picker for Player Mode - More spacing */}
          {mode === 'player' && (
              <div className="flex bg-indigo-950/30 p-1.5 rounded-2xl border border-indigo-500/20 gap-1.5 animate-in slide-in-from-left duration-200">
                  {[1, 2, 3, 4, 5].map(n => (
                      <button 
                        key={n} 
                        onClick={() => setSelectedNumber(n)}
                        className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${selectedNumber === n ? 'bg-indigo-600 text-white shadow-lg scale-110' : 'text-indigo-400 hover:bg-indigo-500/10'}`}
                      >
                        {n}
                      </button>
                  ))}
              </div>
          )}

          {/* Color Palette - Completely clean now */}
          <div className="flex flex-wrap gap-2.5 px-2">
            {COLORS.map(c => (
                <button 
                    key={c.name}
                    onClick={() => { setColor(c.value); if(mode === 'eraser') setMode('pencil'); }}
                    className={`w-9 h-9 rounded-full border-2 transition-all hover:scale-110 active:scale-90 ${color === c.value && mode !== 'eraser' ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.4)]' : 'border-white/10 opacity-60'}`}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-end border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-4">
          <button 
            onClick={clearCanvas}
            className="p-3 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
            title="Rensa allt"
          >
            <Trash2 size={22} />
          </button>

          {onSave && (
              <button 
                onClick={() => onSave(canvasRef.current!.toDataURL())}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95"
              >
                <Check size={20} />
                <span className="hidden sm:inline">Spara</span>
              </button>
          )}

          <button 
            onClick={toggleFullscreen}
            className="p-3 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition-all shadow-lg"
            title={isFullscreen ? "Stäng helskärm" : "Helskärm"}
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
        </div>
      </div>

      {/* Drawing Area */}
      <div className="flex-1 relative cursor-crosshair bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.12] flex items-center justify-center p-6">
          <div className="w-full h-full border-2 border-white relative max-w-[850px] aspect-[1/1.4]">
             <div className="absolute inset-1.5 border border-white/30"></div>
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
    </div>
  );
};
