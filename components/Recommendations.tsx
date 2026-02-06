import React from 'react';
import { LibraryTrack } from '../types';

interface RecommendationsProps {
  suggestions: LibraryTrack[];
  onSelect: (track: LibraryTrack) => void;
}

export const Recommendations: React.FC<RecommendationsProps> = ({ suggestions, onSelect }) => {
  if (suggestions.length === 0) return (
    <div className="bg-dj-panel border border-zinc-800 p-6 rounded-xl">
       <h3 className="text-xs font-bold text-zinc-600 uppercase tracking-widest mb-3">Sugerencia de Mezcla</h3>
       <p className="text-zinc-500 text-sm italic leading-tight">No hay pistas compatibles en la biblioteca. Sube más canciones para ver sugerencias armónicas.</p>
    </div>
  );

  const bestMatch = suggestions[0];

  return (
    <div className="space-y-4">
      {/* SECCIÓN DESTACADA: MEJOR MEZCLA */}
      <div className="bg-gradient-to-br from-dj-panel to-zinc-900 border-2 border-dj-accent p-6 rounded-xl shadow-2xl shadow-dj-accent/10 relative overflow-hidden group">
        <div className="absolute -top-12 -right-12 w-24 h-24 bg-dj-accent/10 rounded-full blur-2xl group-hover:bg-dj-accent/20 transition-all"></div>
        
        <h3 className="text-[10px] font-black text-dj-accent uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
           <span className="relative flex h-2 w-2">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-dj-accent opacity-75"></span>
             <span className="relative inline-flex rounded-full h-2 w-2 bg-dj-accent"></span>
           </span>
           Mejor Mezcla Detectada
        </h3>
        
        <div 
          onClick={() => onSelect(bestMatch)}
          className="cursor-pointer"
        >
          <div className="text-lg font-bold text-white group-hover:text-dj-accent transition-colors leading-tight mb-3 line-clamp-2">
            {bestMatch.fileName}
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-4">
             <div className="bg-zinc-950 p-2 rounded border border-zinc-800 flex flex-col items-center">
                <span className="text-[9px] text-zinc-500 uppercase font-bold">BPM</span>
                <span className="text-sm font-mono text-white">{bestMatch.bpm}</span>
             </div>
             <div className="bg-zinc-950 p-2 rounded border border-zinc-800 flex flex-col items-center">
                <span className="text-[9px] text-zinc-500 uppercase font-bold">KEY</span>
                <span className="text-sm font-mono text-dj-accent font-bold">{bestMatch.key}</span>
             </div>
          </div>
          
          <button className="w-full mt-4 py-2 bg-dj-accent/10 border border-dj-accent/20 text-dj-accent text-[10px] font-bold uppercase tracking-widest hover:bg-dj-accent hover:text-black transition-all rounded">
            Cargar en Análisis
          </button>
        </div>
      </div>

      {/* OTRAS OPCIONES */}
      {suggestions.length > 1 && (
        <div className="bg-dj-panel border border-zinc-800 p-6 rounded-xl">
          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Otras alternativas</h3>
          <div className="space-y-2">
            {suggestions.slice(1, 4).map((track) => (
              <div 
                key={track.id}
                onClick={() => onSelect(track)}
                className="flex flex-col p-3 bg-zinc-900/30 hover:bg-zinc-900 border border-transparent hover:border-zinc-700 cursor-pointer transition-all group rounded"
              >
                <span className="text-xs font-bold text-zinc-400 group-hover:text-white truncate">{track.fileName}</span>
                <div className="flex items-center gap-3 text-[10px] font-mono mt-1">
                  <span className="text-zinc-500">{track.bpm} BPM</span>
                  <span className="text-dj-accent/70">{track.key}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};