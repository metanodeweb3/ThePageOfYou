import React, { useState, useEffect, useRef } from 'react';
import { Download, RefreshCw, Play, Pause, Sparkles, Sliders, Image as ImageIcon, Layers, Palette } from 'lucide-react';
import { soundFX } from '../utils/audio';

interface PaletteOption {
  id: string;
  name: string;
  bg: string;
  colors: string[];
}

const PALETTES: PaletteOption[] = [
  { id: 'neon', name: 'Cyber Neon', bg: '#0b0f19', colors: ['#ff007f', '#00f0ff', '#7000ff', '#ffe600', '#00ff66'] },
  { id: 'pastel', name: 'Pastel Dream', bg: '#181528', colors: ['#ffb7b2', '#ffdac1', '#e2f0cb', '#b5ead7', '#c7ceea'] },
  { id: 'retro', name: '80s Synthwave', bg: '#1a0022', colors: ['#ff2a85', '#ff7300', '#facc15', '#00e5ff', '#9d4edd'] },
  { id: 'sunset', name: 'Cosmic Sunset', bg: '#0f0c1b', colors: ['#f72585', '#7209b7', '#3a0ca3', '#4361ee', '#4cc9f0'] },
  { id: 'acid', name: 'Acid Pop', bg: '#05190e', colors: ['#39ff14', '#ccff00', '#ff0055', '#00ffff', '#ff9900'] },
];

const PATTERNS = [
  { id: 'spirograph', name: 'Quantum Spirograph' },
  { id: 'glitch', name: 'Cyber Matrix Waves' },
  { id: 'lissajous', name: 'Harmonograph Loops' },
  { id: 'particles', name: 'Starlight Warp Drive' },
  { id: 'pixels', name: 'Retro Pixel Grid' },
];

export const GraphicsStudio: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedPalette, setSelectedPalette] = useState<string>('neon');
  const [selectedPattern, setSelectedPattern] = useState<string>('spirograph');
  const [symmetry, setSymmetry] = useState<number>(6);
  const [density, setDensity] = useState<number>(50);
  const [speed, setSpeed] = useState<number>(3);
  const [isAnimating, setIsAnimating] = useState<boolean>(true);
  const [textOverlay, setTextOverlay] = useState<string>('QUIRKY ARCADE');
  const [seed, setSeed] = useState<number>(12345);
  const animationFrameRef = useRef<number | null>(null);

  const currentPalette = PALETTES.find(p => p.id === selectedPalette) || PALETTES[0];

  const handleRandomize = () => {
    soundFX.playWobble();
    setSeed(Math.floor(Math.random() * 999999));
    setSymmetry(Math.floor(Math.random() * 8) + 3);
    setDensity(Math.floor(Math.random() * 60) + 20);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const render = () => {
      ctx.fillStyle = currentPalette.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      ctx.save();
      ctx.translate(cx, cy);

      const colors = currentPalette.colors;

      if (selectedPattern === 'spirograph') {
        const step = (Math.PI * 2) / symmetry;
        for (let i = 0; i < symmetry; i++) {
          ctx.rotate(step);
          ctx.beginPath();
          for (let t = 0; t < Math.PI * 4; t += 0.05) {
            const R = 120 + Math.sin(time * 0.02 + seed) * 40;
            const r = 40 + Math.cos(time * 0.03 + i) * 20;
            const p = density;
            const x = (R - r) * Math.cos(t) + p * Math.cos(((R - r) * t) / r + time * 0.01 * speed);
            const y = (R - r) * Math.sin(t) - p * Math.sin(((R - r) * t) / r + time * 0.01 * speed);

            if (t === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.strokeStyle = colors[i % colors.length];
          ctx.lineWidth = 2;
          ctx.shadowColor = colors[(i + 1) % colors.length];
          ctx.shadowBlur = 10;
          ctx.stroke();
        }
      } else if (selectedPattern === 'glitch') {
        for (let i = 0; i < density; i++) {
          const angle = (i / density) * Math.PI * 2 + time * 0.01 * speed;
          const radius = (i * 3 + Math.sin(time * 0.05 + i * 0.2) * 30) % (canvas.width / 2);
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          const size = Math.abs(Math.sin(time * 0.03 + i)) * 18 + 4;

          ctx.fillStyle = colors[i % colors.length];
          ctx.shadowColor = ctx.fillStyle;
          ctx.shadowBlur = 8;
          ctx.fillRect(x - size / 2, y - size / 2, size, size);
        }
      } else if (selectedPattern === 'lissajous') {
        const a = 3 + (seed % 5);
        const b = 2 + (seed % 4);
        const delta = time * 0.02 * speed;

        for (let s = 0; s < symmetry; s++) {
          ctx.rotate((Math.PI * 2) / symmetry);
          ctx.beginPath();
          for (let t = 0; t < Math.PI * 2; t += 0.02) {
            const scale = (canvas.width / 3.2) * (density / 50);
            const x = Math.sin(a * t + delta) * scale;
            const y = Math.sin(b * t) * scale;

            if (t === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.strokeStyle = colors[s % colors.length];
          ctx.lineWidth = 3;
          ctx.shadowColor = colors[s % colors.length];
          ctx.shadowBlur = 15;
          ctx.stroke();
        }
      } else if (selectedPattern === 'particles') {
        for (let i = 0; i < density * 3; i++) {
          const angle = ((i * 137.5) % 360) * (Math.PI / 180);
          const dist = ((i * 7 + time * speed * 2) % (canvas.width / 2));
          const x = Math.cos(angle) * dist;
          const y = Math.sin(angle) * dist;
          const rad = (dist / (canvas.width / 2)) * 6 + 1;

          ctx.beginPath();
          ctx.arc(x, y, rad, 0, Math.PI * 2);
          ctx.fillStyle = colors[i % colors.length];
          ctx.shadowColor = colors[i % colors.length];
          ctx.shadowBlur = 10;
          ctx.fill();
        }
      } else if (selectedPattern === 'pixels') {
        const cols = 16;
        const cellSize = (canvas.width * 0.8) / cols;
        ctx.translate(-canvas.width * 0.4, -canvas.height * 0.4);

        for (let r = 0; r < cols; r++) {
          for (let c = 0; c < cols; c++) {
            const val = Math.sin(r * 0.5 + time * 0.03 * speed) + Math.cos(c * 0.5 + seed);
            if (val > 0) {
              const colorIdx = Math.abs(Math.floor(val * 10)) % colors.length;
              ctx.fillStyle = colors[colorIdx];
              ctx.shadowColor = colors[colorIdx];
              ctx.shadowBlur = 4;
              ctx.fillRect(c * cellSize + 2, r * cellSize + 2, cellSize - 4, cellSize - 4);
            }
          }
        }
      }

      ctx.restore();

      // Text Overlay
      if (textOverlay.trim()) {
        ctx.save();
        ctx.font = '900 28px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = colors[0];
        ctx.shadowBlur = 12;
        ctx.fillText(textOverlay.toUpperCase(), canvas.width / 2, canvas.height - 35);
        ctx.restore();
      }

      if (isAnimating) {
        time += 1;
        animationFrameRef.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [selectedPalette, selectedPattern, symmetry, density, speed, isAnimating, textOverlay, seed, currentPalette]);

  const handleDownload = () => {
    soundFX.playFanfare();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `quirky-graphic-${selectedPattern}-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div id="graphics-studio-container" className="w-full max-w-6xl mx-auto p-4 md:p-6 bg-slate-900/90 rounded-2xl border border-pink-500/30 backdrop-blur-md text-white shadow-2xl">
      <div id="graphics-header" className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-pink-400 font-semibold text-sm tracking-widest uppercase">
            <Sparkles className="w-4 h-4 animate-spin text-cyan-400" />
            Procedural Graphic Studio
          </div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-300 to-cyan-400">
            Quirky Graphic Generator
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-randomize-graphics"
            onClick={handleRandomize}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600/80 hover:bg-purple-500 text-white font-bold text-sm transition-all shadow-lg hover:shadow-purple-500/25 active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            Randomize
          </button>
          <button
            id="btn-download-graphics"
            onClick={handleDownload}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-cyan-500 hover:from-pink-400 hover:to-cyan-400 text-white font-extrabold text-sm transition-all shadow-lg hover:shadow-cyan-500/25 active:scale-95"
          >
            <Download className="w-4 h-4" />
            Export PNG
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Canvas Display */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center bg-slate-950 p-4 rounded-xl border border-slate-800 relative group">
          <canvas
            id="graphics-studio-canvas"
            ref={canvasRef}
            width={600}
            height={600}
            className="w-full max-w-[500px] aspect-square rounded-lg shadow-2xl border border-slate-800 bg-slate-950 object-contain"
          />

          <div className="absolute bottom-6 right-6 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700">
            <button
              id="btn-toggle-animation"
              onClick={() => {
                soundFX.playPop();
                setIsAnimating(!isAnimating);
              }}
              className="p-1.5 text-slate-300 hover:text-white transition-colors"
              title={isAnimating ? 'Pause' : 'Play'}
            >
              {isAnimating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <span className="text-xs text-slate-400 font-mono">
              {isAnimating ? 'ANIMATING' : 'PAUSED'}
            </span>
          </div>
        </div>

        {/* Controls Sidebar */}
        <div className="lg:col-span-5 flex flex-col gap-5 bg-slate-950/60 p-5 rounded-xl border border-slate-800/80">
          {/* Pattern Style */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" /> Pattern Style
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PATTERNS.map(p => (
                <button
                  key={p.id}
                  id={`pattern-btn-${p.id}`}
                  onClick={() => {
                    soundFX.playPop();
                    setSelectedPattern(p.id);
                  }}
                  className={`px-3 py-2 rounded-lg text-xs font-bold text-left transition-all ${
                    selectedPattern === p.id
                      ? 'bg-gradient-to-r from-pink-500/30 to-purple-500/30 border border-pink-500 text-white shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Color Palette */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-pink-400" /> Color Theme
            </label>
            <div className="flex flex-col gap-2">
              {PALETTES.map(p => (
                <button
                  key={p.id}
                  id={`palette-btn-${p.id}`}
                  onClick={() => {
                    soundFX.playPop();
                    setSelectedPalette(p.id);
                  }}
                  className={`flex items-center justify-between p-2 rounded-lg text-xs font-semibold transition-all ${
                    selectedPalette === p.id
                      ? 'bg-slate-800 border border-cyan-400/80 text-white shadow-md'
                      : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>{p.name}</span>
                  <div className="flex gap-1">
                    {p.colors.map((c, i) => (
                      <span key={i} className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-400">Symmetry ({symmetry}x)</span>
              <input
                id="slider-symmetry"
                type="range"
                min={2}
                max={12}
                value={symmetry}
                onChange={e => setSymmetry(Number(e.target.value))}
                className="w-32 accent-pink-500"
              />
            </div>

            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-400">Density ({density})</span>
              <input
                id="slider-density"
                type="range"
                min={10}
                max={100}
                value={density}
                onChange={e => setDensity(Number(e.target.value))}
                className="w-32 accent-cyan-400"
              />
            </div>

            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-400">Animation Speed</span>
              <input
                id="slider-speed"
                type="range"
                min={1}
                max={10}
                value={speed}
                onChange={e => setSpeed(Number(e.target.value))}
                className="w-32 accent-purple-500"
              />
            </div>
          </div>

          {/* Text Overlay */}
          <div className="pt-2 border-t border-slate-800">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
              Watermark / Banner Text
            </label>
            <input
              id="input-text-overlay"
              type="text"
              value={textOverlay}
              onChange={e => setTextOverlay(e.target.value)}
              placeholder="Enter custom text..."
              maxLength={24}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500 transition-colors"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
