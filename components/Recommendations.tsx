import React from 'react';
import { LibraryTrack } from '../types';

interface RecommendationsProps {
  suggestions: LibraryTrack[];
  onSelect: (track: LibraryTrack) => void;
}

export const Recommendations: React.FC<RecommendationsProps> = ({ suggestions, onSelect }) => {
  if (suggestions.length === 0) return null;

  return (
    <div className="bg-dj-panel border border-zinc-800 p-6">
      <h3 className="text-sm font-bold text-dj-accent uppercase tracking-widest mb-4 flex items-center gap-2">
         Mix Compatible
      </h3>
      <div className="space-y-1">
        {suggestions.map((track) => (
          <div 
            key={track.id}
            onClick={() => onSelect(track)}
            className="flex items-center justify-between p-3 bg-zinc-900/50 hover:bg-zinc-800 border-l-2 border-transparent hover:border-dj-accent cursor-pointer transition-all group"
          >
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-zinc-300 group-hover:text-white truncate">{track.fileName}</span>
              <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono mt-1">
                <span className="text-dj-accent">{track.bpm} BPM</span>
                <span>|</span>
                <span>{track.key}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};