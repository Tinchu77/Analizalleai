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
  const m = Math.floor(Math.abs(seconds) / 60);
  const s = Math.floor(Math.abs(seconds) % 60);
  return `${seconds < 0 ? '-' : ''}${m}:${s.toString().padStart(2, '0')}`;
};

const getDisplayLabel = (description: string): string => {
  const d = description.toUpperCase();
  if (d.includes('ESTRIBILLO') || d.includes('EST.')) return 'EST.';
  if (d.includes('ESTROFA') || d.includes('VOCAL')) return 'VOCAL';
  if (d.includes('PUENTE') || d.includes('BRIDGE')) return 'PUENTE';
  if (d.includes('DROP')) return 'DROP';
  if (d.includes('INTRO')) return 'INTRO';
  if (d.includes('OUTRO')) return 'OUTRO';
  return d.substring(0, 8);
};

const getSectionColor = (type: string, energy: string) => {
  const t = type.toUpperCase();
  if (t.includes('DROP')) return 'bg-red-600 text-white';
  if (t.includes('EST.')) return 'bg-dj-accent text-black'; 
  if (t.includes('PUENTE')) return 'bg-orange-500 text-white'; 
  if (t.includes('VOCAL')) return 'bg-zinc-700 text-zinc-300'; 
  if (t.includes('INTRO') || t.includes('OUTRO')) return 'bg-zinc-800 text-zinc-500'; 
  return 'bg-zinc-700 text-white';
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
    <div className="w-full mt-4 mb-8 select-none">
      <div className="flex justify-between items-end mb-3 px-1">
         <h3 className="text-sm font-bold text-dj-secondary uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 bg-dj-accent rounded-full"></span>
            Estructura de la Pista
         </h3>
         <span className="text-sm font-mono text-zinc-400 font-bold bg-zinc-900 border border-zinc-800 px-3 py-1 rounded">
            DURACIÓN: {totalDuration}
         </span>
      </div>
      
      <div className="relative w-full h-40 bg-zinc-950 rounded-xl overflow-hidden flex shadow-2xl ring-1 ring-zinc-800">
        {segments.map((seg, idx) => {
          const colorClass = getSectionColor(seg.description, seg.energy);
          const displayLabel = getDisplayLabel(seg.description);
          
          return (
            <div 
              key={idx}
              style={{ width: `${seg.widthPercent}%` }}
              className={`
                relative h-full group flex flex-col justify-center items-center
                border-r border-black/30 hover:brightness-110 transition-all duration-200
                ${colorClass}
              `}
            >
              {/* TOP: TIEMPO REGRESIVO */}
              <div className="absolute top-2 left-0 w-full text-center z-20">
                 <span className="text-[10px] font-mono font-bold bg-black/30 px-1 py-0.5 rounded text-white/80">
                   {formatTime(seg.start - totalSeconds)}
                 </span>
              </div>

              {/* LABEL VERTICAL */}
              <div className="z-10 w-full h-full flex items-center justify-center overflow-hidden py-4">
                 <span className="block text-xs md:text-lg font-black uppercase tracking-tighter transform [writing-mode:vertical-rl] rotate-180 whitespace-nowrap opacity-90">
                   {displayLabel}
                 </span>
              </div>

              {/* BOTTOM: TIEMPO NORMAL */}
              <div className="absolute bottom-2 left-0 w-full text-center z-20">
                 <span className="text-[10px] font-mono font-bold bg-black/30 px-1 py-0.5 rounded text-white/80">
                    {formatTime(seg.start)}
                 </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};