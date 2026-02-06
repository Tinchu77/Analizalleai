import React from 'react';
import { LibraryTrack } from '../types';

interface RecommendationsProps {
  suggestions: LibraryTrack[];
  onSelect: (track: LibraryTrack) => void;
}

export const Recommendations: React.FC<RecommendationsProps> = ({ suggestions, onSelect }) => {
  if (suggestions.length === 0) return (
    <div className="bg-dj-panel border border-zinc-800 p-6 rounded-xl">
       <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Sugerencia de Mezcla</h3>
       <p className="text-zinc-600 text-sm italic">Sube más canciones a tu biblioteca para ver recomendaciones armónicas.</p>
    </div>
  );

  const bestMatch = suggestions[0];

  return (
    <div className="space-y-4">
      <div className="bg-dj-panel border-2 border-dj-accent p-6 rounded-xl shadow-xl shadow-dj-accent/5">
        <h3 className="text-xs font-bold text-dj-accent uppercase tracking-widest mb-4 flex items-center gap-2">
           <span className="flex h-2 w-2 rounded-full bg-dj-accent animate-ping"></span>
           Mejor Mezcla (Top Match)
        </h3>
        
        <div 
          onClick={() => onSelect(bestMatch)}
          className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg hover:bg-zinc-800 cursor-pointer transition-all group"
        >
          <span className="text-sm font-black text-white group-hover:text-dj-accent transition-colors block mb-2 truncate">
            {bestMatch.fileName}
          </span>
          <div className="flex justify-between items-center text-[11px] font-mono">
             <div className="flex gap-3">
                <span className="text-dj-accent">{bestMatch.bpm} BPM</span>
                <span className="text-zinc-500 font-bold px-1.5 bg-zinc-800 rounded">{bestMatch.key}</span>
             </div>
             <span className="text-zinc-600 text-[9px] uppercase">Mix Compatible</span>
          </div>
        </div>
      </div>

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
                <div className="flex items-center gap-2 text-[10px] text-zinc-600 font-mono mt-1">
                  <span>{track.bpm} BPM</span>
                  <span>•</span>
                  <span>{track.key}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};