
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Trash2, Eraser, Pencil, Maximize2, Minimize2, Check, User } from 'lucide-react';

interface TacticalWhiteboardProps {
  onSave?: (dataUrl: string) => void;
  id: string;
}

const COLORS = [
    { name: 'Vit', value: '#ffffff' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Blå', value: '#3b82f6' },
    { name: 'Grön', value: '#10b981' },
    { name: 'Rosa', value: '#f43f5e' },
    { name: 'Gul', value: '#eab308' },
    { name: 'Lila', value: '#a855f7' },
    { name: 'Cyan', value: '#06b6d4' }
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
      ctx.lineWidth = mode === 'eraser' ? (isFullscreen ? 50 : 25) : (isFullscreen ? 6 : 4);
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
    const size = isFullscreen ? 28 : 22;
    ctx.beginPath();
    ctx.arc(x, y, size + 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = (color === '#ffffff' || color === '#eab308') ? '#000000' : '#ffffff';
    ctx.font = `black ${isFullscreen ? '20px' : '15px'} Inter, sans-serif`;
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
      ctx.lineWidth = mode === 'eraser' ? (isFullscreen ? 50 : 25) : (isFullscreen ? 6 : 4);
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
      {/* Ultra Slim Toolbar - NO "X" - Single Row */}
      <div className="flex items-center justify-between p-2 md:p-3 bg-slate-900 border-b border-slate-800 gap-2 shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Main Drawing Tools */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
            <button onClick={() => setMode('pencil')} className={`p-2 rounded-lg transition-all ${mode === 'pencil' ? 'bg-white text-black shadow-lg' : 'text-slate-500 hover:text-slate-300'}`} title="Penna">
              <Pencil size={isFullscreen ? 22 : 18} />
            </button>
            <button onClick={() => setMode('player')} className={`p-2 rounded-lg transition-all ${mode === 'player' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`} title="Spelare">
              <User size={isFullscreen ? 22 : 18} />
            </button>
            <button onClick={() => setMode('eraser')} className={`p-2 rounded-lg transition-all ${mode === 'eraser' ? 'bg-slate-700 text-white shadow-inner' : 'text-slate-500 hover:text-slate-300'}`} title="Sudd">
              <Eraser size={isFullscreen ? 22 : 18} />
            </button>
          </div>

          {/* Player Number Selector - Compact */}
          {mode === 'player' && (
              <div className="hidden sm:flex bg-indigo-950/30 p-1 rounded-xl border border-indigo-500/20 gap-1 animate-in slide-in-from-left duration-200">
                  {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} onClick={() => setSelectedNumber(n)} className={`w-8 h-8 rounded-lg font-black text-[10px] transition-all ${selectedNumber === n ? 'bg-indigo-600 text-white shadow-lg' : 'text-indigo-400 hover:bg-indigo-500/10'}`}>
                        {n}
                      </button>
                  ))}
              </div>
          )}

          {/* Color Palette - 8 colors, single row */}
          <div className="flex items-center gap-1.5 px-2 overflow-x-auto hide-scrollbar">
            {COLORS.map(c => (
                <button 
                    key={c.name}
                    onClick={() => { setColor(c.value); if(mode === 'eraser') setMode('pencil'); }}
                    className={`w-7 h-7 md:w-8 md:h-8 rounded-full border-2 shrink-0 transition-all ${color === c.value && mode !== 'eraser' ? 'border-white scale-110 shadow-lg' : 'border-white/10 opacity-60'}`}
                    style={{ backgroundColor: c.value }}
                />
            ))}
          </div>
        </div>

        {/* Global Actions - Lifted up to same row */}
        <div className="flex items-center gap-2 shrink-0 border-l border-slate-800 pl-2">
          <button onClick={clearCanvas} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all" title="Rensa">
            <Trash2 size={20} />
          </button>

          {onSave && (
              <button onClick={() => onSave(canvasRef.current!.toDataURL())} className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-lg transition-all active:scale-95">
                <Check size={20} />
              </button>
          )}

          <button onClick={toggleFullscreen} className="p-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-all">
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
        </div>
      </div>

      {/* Drawing Area - Max Size */}
      <div className="flex-1 relative cursor-crosshair bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.12] flex items-center justify-center p-4">
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
