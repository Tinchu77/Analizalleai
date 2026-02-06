import React, { useState } from 'react';
import { LibraryTrack } from '../types';

interface TrackLibraryProps {
  tracks: LibraryTrack[];
  currentTrackId?: string;
  onSelect: (track: LibraryTrack) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

type SortField = 'dateAdded' | 'bpm' | 'key' | 'fileName';

export const TrackLibrary: React.FC<TrackLibraryProps> = ({ tracks, currentTrackId, onSelect, onDelete }) => {
  const [sortField, setSortField] = useState<SortField>('dateAdded');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedTracks = [...tracks].sort((a, b) => {
    let valA: any = a[fieldToProp(sortField)];
    let valB: any = b[fieldToProp(sortField)];

    if (sortField === 'key') {
      valA = a.camelotNumber || 0;
      valB = b.camelotNumber || 0;
      if (valA === valB) {
        valA = a.camelotLetter || '';
        valB = b.camelotLetter || '';
      }
    }

    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  function fieldToProp(field: SortField): keyof LibraryTrack {
    return field;
  }

  const SortIcon = ({ active, direction }: { active: boolean, direction: 'asc' | 'desc' }) => {
    if (!active) return <span className="opacity-0 group-hover:opacity-30 ml-1">⇅</span>;
    return <span className="text-dj-accent ml-1">{direction === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="w-full bg-dj-panel border border-zinc-800 flex flex-col h-[500px]">
      <div className="p-4 border-b border-zinc-800 bg-dj-surface flex justify-between items-center sticky top-0 z-10">
        <h3 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
          Biblioteca Local ({tracks.length})
        </h3>
      </div>

      <div className="overflow-auto flex-1 bg-dj-dark">
        <table className="w-full text-left text-sm text-zinc-400">
          <thead className="text-xs uppercase bg-dj-panel text-zinc-500 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 font-medium cursor-pointer hover:text-white group" onClick={() => handleSort('fileName')}>
                Título <SortIcon active={sortField === 'fileName'} direction={sortDirection} />
              </th>
              <th className="px-6 py-3 font-medium cursor-pointer hover:text-white group w-24" onClick={() => handleSort('bpm')}>
                BPM <SortIcon active={sortField === 'bpm'} direction={sortDirection} />
              </th>
              <th className="px-6 py-3 font-medium cursor-pointer hover:text-white group w-24" onClick={() => handleSort('key')}>
                Key <SortIcon active={sortField === 'key'} direction={sortDirection} />
              </th>
              <th className="px-6 py-3 font-medium w-32 hidden md:table-cell">Género</th>
              <th className="px-6 py-3 font-medium text-right w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {sortedTracks.length === 0 ? (
               <tr>
                 <td colSpan={5} className="px-6 py-12 text-center text-zinc-600 italic">
                   No hay canciones. Arrastra un archivo para comenzar.
                 </td>
               </tr>
            ) : (
              sortedTracks.map((track) => {
                const isCurrent = track.id === currentTrackId;
                return (
                  <tr 
                    key={track.id} 
                    onClick={() => onSelect(track)}
                    className={`
                      group transition-colors cursor-pointer
                      ${isCurrent ? 'bg-dj-accent/10 border-l-2 border-dj-accent' : 'hover:bg-zinc-800 border-l-2 border-transparent'}
                    `}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 flex items-center justify-center text-xs font-bold transition-colors ${isCurrent ? 'text-dj-accent' : 'text-zinc-600 group-hover:text-white'}`}>
                          {isCurrent ? '▶' : '♫'}
                        </div>
                        <div className={`font-medium truncate max-w-[200px] md:max-w-xs ${isCurrent ? 'text-white' : 'text-zinc-300 group-hover:text-white'}`}>
                          {track.fileName}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-zinc-300">{Math.round(track.bpm)}</td>
                    <td className="px-6 py-4">
                       <span className={`px-2 py-1 text-xs font-bold border ${isCurrent ? 'border-dj-accent text-dj-accent' : 'border-zinc-700 text-zinc-400'}`}>
                         {track.key}
                       </span>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell truncate max-w-[150px]">{track.genre}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={(e) => onDelete(track.id, e)}
                        className="text-zinc-600 hover:text-red-500 p-2 rounded hover:bg-zinc-900 transition-colors opacity-0 group-hover:opacity-100"
                        title="Eliminar"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};