import React from 'react';
import { StructuralPoint } from '../types';

interface StructureTimelineProps {
  points: StructuralPoint[];
  totalDuration: string;
}

// Helper to convert mm:ss to seconds
const toSeconds = (timeStr: string): number => {
  if (!timeStr) return 0;
  const [min, sec] = timeStr.split(':').map(Number);
  return (min * 60) + sec;
};

// Helper to format seconds back to mm:ss
const formatTime = (seconds: number): string => {
  const m = Math.floor(Math.abs(seconds) / 60);
  const s = Math.floor(Math.abs(seconds) % 60);
  return `${seconds < 0 ? '-' : ''}${m}:${s.toString().padStart(2, '0')}`;
};

// Label mapping function
const getDisplayLabel = (description: string): string => {
  const d = description.toLowerCase();
  if (d.includes('drop')) return 'DROP';
  if (d.includes('break')) return 'BREAK';
  if (d.includes('estribillo')) return 'CHORUS'; // Changed to CHORUS for more DJ feel
  if (d.includes('estrofa')) return 'VERSE';
  if (d.includes('intro')) return 'INTRO';
  if (d.includes('outro')) return 'OUTRO';
  if (d.includes('puente')) return 'BUILD';
  return description.toUpperCase().substring(0, 8); // Fallback
};

const getSectionColor = (type: string, energy: string) => {
  const t = type.toLowerCase();
  
  // High energy - Drops get Red/Intense
  if (t.includes('drop')) return 'bg-red-600 text-white border-red-500';
  if (t.includes('estribillo') || energy === 'High') return 'bg-dj-accent text-black border-yellow-500'; 
  
  // Build-up / Transition
  if (t.includes('puente') || t.includes('build') || energy === 'Build-up') return 'bg-orange-500 text-white'; 
  
  // Medium
  if (t.includes('estrofa') || t.includes('verse')) return 'bg-zinc-700 text-zinc-300'; 
  
  // Low / Breakdown - Deep Blue or Dark
  if (t.includes('break') || t.includes('down')) return 'bg-blue-900/50 text-blue-200 border-blue-900';
  if (t.includes('intro') || t.includes('outro')) return 'bg-zinc-800 text-zinc-500'; 
  
  // Fallback
  return 'bg-zinc-700 text-white';
};

export const StructureTimeline: React.FC<StructureTimelineProps> = ({ points, totalDuration }) => {
  const totalSeconds = toSeconds(totalDuration) || 180;

  // Process segments
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
      widthPercent: Math.max(widthPercent, 0.5) 
    };
  });

  return (
    <div className="w-full mt-4 mb-8 select-none">
      <div className="flex justify-between items-end mb-3 px-1">
         <h3 className="text-sm font-bold text-dj-secondary uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 bg-dj-accent rounded-full"></span>
            Estructura Cronológica
         </h3>
         <span className="text-sm font-mono text-white font-bold bg-zinc-800 px-2 py-1 rounded">
            TOTAL: {totalDuration}
         </span>
      </div>
      
      {/* Container */}
      <div className="relative w-full h-48 bg-zinc-950 rounded-xl overflow-hidden flex shadow-2xl ring-1 ring-zinc-800">
        {segments.map((seg, idx) => {
          const colorClass = getSectionColor(seg.description, seg.energy);
          const displayLabel = getDisplayLabel(seg.description);
          
          return (
            <div 
              key={idx}
              style={{ width: `${seg.widthPercent}%` }}
              className={`
                relative h-full group flex flex-col justify-center items-center
                border-r border-black/20 hover:brightness-110 transition-all duration-200
                ${colorClass}
              `}
              title={`${seg.description} - ${seg.energy}`}
            >
              {/* Top Time (Normal) */}
              <div className="absolute top-2 left-0 w-full text-center opacity-70 group-hover:opacity-100 transition-opacity z-20">
                 <span className="text-[9px] font-mono font-bold bg-black/40 px-1 py-0.5 rounded text-white shadow-sm backdrop-blur-sm">
                   {formatTime(seg.start)}
                 </span>
              </div>

              {/* Main Label - VERTICAL ORIENTATION */}
              <div className="z-10 w-full h-full flex items-center justify-center overflow-hidden py-6 pointer-events-none">
                 <span className="block text-sm md:text-xl font-black uppercase tracking-widest drop-shadow-md transform [writing-mode:vertical-rl] rotate-180 whitespace-nowrap opacity-90">
                   {displayLabel}
                 </span>
              </div>

              {/* Bottom Time (Countdown) */}
              <div className="absolute bottom-2 left-0 w-full text-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                 <span className="text-[9px] font-mono font-bold bg-black/40 px-1 py-0.5 rounded text-white shadow-sm backdrop-blur-sm">
                    {formatTime(seg.start - totalSeconds)}
                 </span>
              </div>
              
              {/* Hover highlight overlay */}
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 pointer-events-none"></div>
            </div>
          );
        })}
      </div>
      
      {/* Simple Progress Bar Indicator below */}
      <div className="w-full h-1 bg-zinc-800 mt-1">
         <div className="w-full h-full bg-gradient-to-r from-zinc-800 via-dj-accent to-zinc-800 opacity-20"></div>
      </div>
    </div>
  );
};