import React, { useEffect, useRef, useState } from 'react';
import { calculatePPGValue } from '../services/simulationEngine';
import { Play, Pause, RotateCcw, Activity } from 'lucide-react';

interface PPGWaveformOscilloscopeProps {
  heartRate?: number;
  signalQuality?: number;
  height?: number;
  className?: string;
}

export const PPGWaveformOscilloscope: React.FC<PPGWaveformOscilloscopeProps> = ({
  heartRate = 72,
  signalQuality = 0.95,
  height = 180,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const animFrameRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);
  const bufferRef = useRef<number[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const bufferSize = width;
    if (bufferRef.current.length === 0) {
      bufferRef.current = new Array(bufferSize).fill(0.2);
    }

    let lastTime = performance.now();

    const render = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      if (!isPaused) {
        // Calculate phase advancement based on Heart Rate
        // e.g. 72 bpm = 1.2 beats/sec -> frequency = 1.2 Hz
        const freq = heartRate / 60.0;
        phaseRef.current = (phaseRef.current + delta * freq) % 1.0;

        // Noise amplitude inversely proportional to signal quality
        const noiseLevel = Math.max(0.02, (1.0 - signalQuality) * 0.45);
        const ppgVal = calculatePPGValue(phaseRef.current, noiseLevel);

        // Push into buffer
        bufferRef.current.push(ppgVal);
        if (bufferRef.current.length > bufferSize) {
          bufferRef.current.shift();
        }
      }

      // Draw oscilloscope screen
      ctx.fillStyle = '#090d16'; // Deep oscilloscope black
      ctx.fillRect(0, 0, width, height);

      // Grid background (medical monitor green/cyan grid)
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.12)';
      const gridSize = 20;
      ctx.beginPath();
      for (let x = 0; x < width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Horizontal central baseline
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.25)';
      ctx.beginPath();
      ctx.moveTo(0, height * 0.7);
      ctx.lineTo(width, height * 0.7);
      ctx.stroke();

      // Render PPG curve
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#22c55e'; // Medical vital green
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 6;
      ctx.beginPath();

      const buffer = bufferRef.current;
      for (let i = 0; i < buffer.length; i++) {
        const x = i;
        // Invert Y: 1.0 is top (scaled to 80% height), 0.0 is baseline
        const amp = buffer[i];
        const y = height * 0.85 - amp * (height * 0.65);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0; // Reset shadow

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [heartRate, signalQuality, isPaused, height]);

  return (
    <div className={`relative bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl ${className}`}>
      {/* Top Banner */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800 text-xs font-mono">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="font-semibold text-slate-200">OPTICAL PPG WAVEFORM MONITOR</span>
          <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800 text-[10px] font-bold">
            SYNTHETIC SIGNAL
          </span>
        </div>
        <div className="flex items-center gap-3 text-slate-400">
          <span>Pulse: <strong className="text-emerald-400">{Math.round(heartRate)} bpm</strong></span>
          <span>Quality: <strong className={signalQuality >= 0.7 ? 'text-teal-400' : 'text-amber-400'}>{Math.round(signalQuality * 100)}%</strong></span>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-1 hover:text-white rounded bg-slate-800 hover:bg-slate-700 transition"
            title={isPaused ? "Resume Waveform" : "Pause Waveform"}
          >
            {isPaused ? <Play className="w-3 h-3 text-emerald-400" /> : <Pause className="w-3 h-3 text-amber-400" />}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="w-full flex justify-center bg-black">
        <canvas
          ref={canvasRef}
          width={640}
          height={height}
          className="w-full h-auto block"
        />
      </div>

      {/* Bottom Telemetry Simulation Guardrail */}
      <div className="px-4 py-1.5 bg-slate-950 border-t border-slate-900 text-[10px] font-mono text-slate-400 flex items-center justify-between">
        <span>Waveform Simulation: Synthesized morphology with systolic peak & dicrotic notch</span>
        <span className="text-teal-400/90 font-medium">ILLUSTRATIVE PHYSIOLOGICAL SYNTHESIS</span>
      </div>
    </div>
  );
};
