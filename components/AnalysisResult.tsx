import React from 'react';
import { AudioAnalysis, StructuralPoint } from '../types';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from 'recharts';
import { StructureTimeline } from './StructureTimeline';

interface AnalysisResultProps {
  data: AudioAnalysis;
  fileName: string;
  onReset: () => void;
}

// Transform structural points into data suitable for a simple chart
const generateChartData = (points: StructuralPoint[]) => {
  const energyMap: Record<string, number> = {
    'Low': 20,
    'Medium': 50,
    'High': 85,
    'Build-up': 65,
    'Drop': 100
  };

  return points.map(p => ({
    time: p.timestamp,
    energyValue: energyMap[p.energy] || 40,
    event: p.description,
    energyLabel: p.energy
  }));
};

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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 border border-dj-accent p-3 rounded shadow-xl">
        <p className="text-zinc-400 text-xs font-mono mb-1">{label}</p>
        <p className="text-white font-bold text-lg uppercase">{payload[0].payload.event}</p>
        <p className="text-dj-accent text-sm font-bold">Energía: {payload[0].payload.energyLabel}</p>
      </div>
    );
  }
  return null;
};

export const AnalysisResult: React.FC<AnalysisResultProps> = ({ data, fileName, onReset }) => {
  const chartData = generateChartData(data.structuralPoints);
  const totalDurationSecs = toSeconds(data.duration);

  // Helper for top axis countdown ticks
  const formatCountdownTick = (timeStr: string) => {
    const currentSecs = toSeconds(timeStr);
    const remaining = currentSecs - totalDurationSecs;
    return formatTime(remaining);
  };

  return (
    <div className="w-full space-y-8 animate-fade-in-up">
      
      {/* Header with Title and Reset */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-zinc-800 pb-6">
        <div className="overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
             <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
             <h2 className="text-xs text-zinc-400 font-mono uppercase tracking-widest">Análisis Completado</h2>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white mt-1 truncate max-w-4xl font-sans tracking-tight leading-none" title={fileName}>
            {fileName}
          </h1>
          <div className="flex items-center gap-3 mt-4">
             <span className="px-3 py-1 bg-zinc-800 text-xs text-zinc-300 uppercase tracking-wider font-bold border border-zinc-700 rounded-sm">{data.genre}</span>
             <span className="px-3 py-1 bg-zinc-800 text-xs text-zinc-300 uppercase tracking-wider font-bold border border-zinc-700 rounded-sm">{data.mood}</span>
          </div>
        </div>
        <button 
          onClick={onReset}
          className="px-8 py-3 text-xs font-bold uppercase tracking-widest text-black bg-dj-accent hover:bg-white transition-colors rounded-sm shadow-lg shadow-dj-accent/20"
        >
          Analizar Otro
        </button>
      </div>

      {/* SECTION 1: FULL WIDTH STRUCTURE TIMELINE */}
      <section>
        <StructureTimeline points={data.structuralPoints} totalDuration={data.duration || "3:00"} />
      </section>

      {/* SECTION 2: KEY STATS GRID */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* BPM Card */}
        <div className="bg-zinc-900/50 p-6 border-l-2 border-zinc-700 hover:border-dj-accent transition-colors group">
          <span className="text-zinc-500 text-xs font-mono uppercase tracking-widest mb-2 block">BPM</span>
          <span className="text-5xl font-black text-white font-mono tracking-tighter group-hover:text-dj-accent transition-colors">{data.bpm}</span>
        </div>

        {/* Key Card */}
        <div className="bg-zinc-900/50 p-6 border-l-2 border-zinc-700 hover:border-dj-accent transition-colors group">
          <span className="text-zinc-500 text-xs font-mono uppercase tracking-widest mb-2 block">KEY</span>
          <span className="text-4xl font-black text-white font-mono tracking-tighter group-hover:text-dj-accent transition-colors">{data.key}</span>
        </div>

        {/* Vocal Start */}
        <div className="bg-zinc-900/50 p-6 border-l-2 border-zinc-700">
          <span className="text-zinc-500 text-xs font-mono uppercase tracking-widest mb-1 block">Voz (In)</span>
          <span className="text-3xl font-bold text-zinc-300">{data.vocalStart}</span>
        </div>

        {/* Chorus Start */}
        <div className="bg-zinc-900/50 p-6 border-l-2 border-zinc-700">
          <span className="text-zinc-500 text-xs font-mono uppercase tracking-widest mb-1 block">Estribillo</span>
          <span className="text-3xl font-bold text-zinc-300">{data.chorusStart || "N/A"}</span>
        </div>
      </section>

      {/* SECTION 3: FULL WIDTH ENERGY CURVE */}
      <section className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
           <h3 className="text-lg font-bold text-white uppercase tracking-tight flex items-center gap-2">
              <svg className="w-5 h-5 text-dj-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              Dinámica de Energía
           </h3>
           <span className="text-xs text-zinc-500 uppercase tracking-wider">Pasa el ratón para ver detalles</span>
        </div>
        
        <div className="h-64 md:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                
                {/* Bottom XAxis - Normal Time */}
                <XAxis 
                  dataKey="time" 
                  stroke="#52525b" 
                  fontSize={12} 
                  tickMargin={15} 
                  axisLine={false}
                  tickLine={false}
                />
                
                {/* Top XAxis - Countdown Time */}
                <XAxis 
                  orientation="top"
                  xAxisId="top"
                  dataKey="time" 
                  stroke="#f59e0b"
                  opacity={0.7}
                  fontSize={12} 
                  tickMargin={10} 
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatCountdownTick}
                />

                <YAxis hide domain={[0, 110]} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#f59e0b', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area 
                  type="monotone" 
                  dataKey="energyValue" 
                  stroke="#f59e0b" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorEnergy)" 
                  activeDot={{ r: 8, fill: '#fff', stroke: '#f59e0b', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
        </div>
      </section>

      {/* SECTION 4: DJ TIPS & ASSISTANT (Full Width) */}
      <section className="bg-gradient-to-r from-zinc-900 to-zinc-950 border-t-4 border-dj-accent p-8 rounded-b-xl shadow-2xl">
          <div className="flex flex-col md:flex-row gap-8 items-start">
             <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-dj-accent text-black flex items-center justify-center rounded-full font-bold text-2xl">
                   AI
                </div>
             </div>
             <div className="flex-grow">
               <h3 className="text-sm font-bold text-dj-accent uppercase tracking-widest mb-3">
                 Consejo de Mezcla
               </h3>
               <p className="text-zinc-200 leading-relaxed text-xl md:text-2xl font-light">
                 "{data.djTips}"
               </p>
             </div>
          </div>
      </section>
    </div>
  );
};