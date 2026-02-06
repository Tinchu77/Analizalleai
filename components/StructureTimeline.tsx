import React from 'react';
import { StructuralPoint } from '../types';

interface StructureTimelineProps {
  points: StructuralPoint[];
  totalDuration: string;
}

const toSeconds = (timeStr: string): number => {
  if (!timeStr) return 0;
  const [min, sec] = timeStr.split(':').map(Number);
  return (min * 60) + sec;
};

const formatTime = (seconds: number): string => {
  const isNegative = seconds < 0;
  const absSeconds = Math.abs(seconds);
  const m = Math.floor(absSeconds / 60);
  const s = Math.floor(absSeconds % 60);
  return `${isNegative ? '-' : ''}${m}:${s.toString().padStart(2, '0')}`;
};

const getDisplayLabel = (description: string): string => {
  const d = description.toUpperCase();
  if (d.includes('ESTRIBILLO') || d.includes('EST.')) return 'EST.';
  if (d.includes('ESTROFA') || d.includes('VOCAL')) return 'VOCAL';
  if (d.includes('PUENTE') || d.includes('BRIDGE')) return 'PUENTE';
  if (d.includes('INTRO')) return 'INTRO';
  if (d.includes('OUTRO')) return 'OUTRO';
  if (d.includes('DROP')) return 'DROP';
  return d.substring(0, 8);
};

const getSectionColor = (type: string, energy: string) => {
  const t = type.toUpperCase();
  if (t.includes('DROP')) return 'bg-red-600 text-white';
  if (t.includes('EST.')) return 'bg-dj-accent text-black'; 
  if (t.includes('PUENTE')) return 'bg-zinc-700 text-white border-x border-zinc-600'; 
  if (t.includes('VOCAL')) return 'bg-zinc-800 text-zinc-300'; 
  if (t.includes('INTRO') || t.includes('OUTRO')) return 'bg-zinc-900 text-zinc-500'; 
  return 'bg-zinc-800 text-white';
};

export const StructureTimeline: React.FC<StructureTimelineProps> = ({ points, totalDuration }) => {
  const totalSeconds = toSeconds(totalDuration) || 180;

  const segments = points.map((point, index) => {
    const start = toSeconds(point.timestamp);
    const nextPoint = points[index + 1];
    const end = nextPoint ? toSeconds(nextPoint.timestamp) : totalSeconds;
    const duration = end - start;
    const widthPercent = (duration / totalSeconds) * 100;
    
    return {
      ...point,
      start,
      end,
      widthPercent: Math.max(widthPercent, 1) 
    };
  });

  return (
    <div className="w-full mt-2 mb-10 select-none">
      <div className="flex justify-between items-end mb-4 px-1">
         <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 bg-dj-accent rounded-full animate-pulse"></span>
            Estructura y Tiempos
         </h3>
         <div className="flex gap-4">
           <div className="text-[10px] font-mono text-zinc-500">ARRIBA: REGRESIVO</div>
           <div className="text-[10px] font-mono text-zinc-500">ABAJO: ELAPSADO</div>
         </div>
      </div>
      
      <div className="relative w-full h-44 bg-zinc-950 rounded-lg overflow-hidden flex shadow-2xl ring-1 ring-zinc-800/50">
        {segments.map((seg, idx) => {
          const colorClass = getSectionColor(seg.description, seg.energy);
          const displayLabel = getDisplayLabel(seg.description);
          
          return (
            <div 
              key={idx}
              style={{ width: `${seg.widthPercent}%` }}
              className={`
                relative h-full group flex flex-col justify-between items-center py-3
                border-r border-black/40 hover:brightness-110 transition-all duration-300
                ${colorClass}
              `}
            >
              {/* TOP: TIEMPO REGRESIVO (-) */}
              <div className="z-20">
                 <span className="text-[10px] font-mono font-bold bg-black/40 px-1.5 py-0.5 rounded text-white/90 backdrop-blur-sm">
                   {formatTime(seg.start - totalSeconds)}
                 </span>
              </div>

              {/* LABEL VERTICAL (CENTRO) */}
              <div className="z-10 flex items-center justify-center pointer-events-none">
                 <span className="block text-sm md:text-xl font-black uppercase tracking-tighter transform [writing-mode:vertical-rl] rotate-180 opacity-80 group-hover:opacity-100 transition-opacity">
                   {displayLabel}
                 </span>
              </div>

              {/* BOTTOM: TIEMPO NORMAL */}
              <div className="z-20">
                 <span className="text-[10px] font-mono font-bold bg-black/40 px-1.5 py-0.5 rounded text-white/90 backdrop-blur-sm">
                    {formatTime(seg.start)}
                 </span>
              </div>
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors pointer-events-none"></div>
            </div>
          );
        })}
      </div>
    </div>
  );
};