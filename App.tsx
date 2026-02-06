import React, { useState, useEffect, useRef } from 'react';
import { FileUpload } from './components/FileUpload';
import { AnalysisResult } from './components/AnalysisResult';
import { TrackLibrary } from './components/TrackLibrary';
import { Recommendations } from './components/Recommendations';
import { analyzeAudioFile } from './services/geminiService';
import { AudioAnalysis, AnalysisState, LibraryTrack } from './types';
import { parseCamelot, getSuggestions } from './utils/djLogic';

interface ExtendedState extends AnalysisState {
  loadingMessage?: string;
}

const LogoIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="22" className="fill-zinc-900 stroke-zinc-700" strokeWidth="2"/>
    <circle cx="24" cy="24" r="8" className="fill-zinc-800" />
    <circle cx="24" cy="24" r="2" className="fill-zinc-950" />
    <path d="M24 6C33.9411 6 42 14.0589 42 24" className="stroke-zinc-800" strokeWidth="1" strokeLinecap="round"/>
    <path d="M24 12C30.6274 12 36 17.3726 36 24" className="stroke-zinc-800" strokeWidth="1" strokeLinecap="round"/>
    <path d="M10 24L14 24L16 16L20 32L24 10L28 38L32 20L34 24L38 24" className="stroke-dj-accent" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M38 38L44 44" className="stroke-zinc-500" strokeWidth="4" strokeLinecap="round"/>
  </svg>
);

function App() {
  const [state, setState] = useState<ExtendedState>({
    isLoading: false,
    currentTrack: null,
    error: null,
    loadingMessage: ''
  });

  const [library, setLibrary] = useState<LibraryTrack[]>([]);
  const [suggestions, setSuggestions] = useState<LibraryTrack[]>([]);
  const importInputRef = useRef<HTMLInputElement>(null);

  // EFECTO 1: Cargar biblioteca y última pista vista desde LocalStorage
  useEffect(() => {
    const savedLibrary = localStorage.getItem('dj-library');
    const savedLastTrackId = localStorage.getItem('dj-last-track-id');
    
    if (savedLibrary) {
      try {
        const parsedLibrary = JSON.parse(savedLibrary);
        setLibrary(parsedLibrary);
        
        if (savedLastTrackId) {
          const lastTrack = parsedLibrary.find((t: LibraryTrack) => t.id === savedLastTrackId);
          if (lastTrack) {
            setState(prev => ({ ...prev, currentTrack: lastTrack }));
          }
        }
      } catch (e) {
        console.error("Error cargando biblioteca local", e);
      }
    }
  }, []);

  // EFECTO 2: Guardar biblioteca cada vez que cambie
  useEffect(() => {
    localStorage.setItem('dj-library', JSON.stringify(library));
  }, [library]);

  // EFECTO 3: Guardar ID de la pista actual para persistencia de sesión
  useEffect(() => {
    if (state.currentTrack) {
      localStorage.setItem('dj-last-track-id', state.currentTrack.id);
      const recs = getSuggestions(state.currentTrack, library);
      setSuggestions(recs.slice(0, 3));
    } else {
      localStorage.removeItem('dj-last-track-id');
      setSuggestions([]);
    }
  }, [state.currentTrack, library]);

  const handleFileSelect = async (files: File[]) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    const total = files.length;
    let successCount = 0;
    let lastProcessedTrack: LibraryTrack | null = null;

    for (let i = 0; i < total; i++) {
      const file = files[i];
      setState(prev => ({ ...prev, loadingMessage: `Analizando ${i + 1}/${total}: ${file.name}` }));

      try {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const base64Audio = await base64Promise;
        const base64Data = base64Audio.split(',')[1];
        const result: AudioAnalysis = await analyzeAudioFile(base64Data, file.type || 'audio/mp3');
        
        const camelotData = parseCamelot(result.key);

        const newTrack: LibraryTrack = {
          ...result,
          id: crypto.randomUUID(),
          fileName: file.name,
          dateAdded: Date.now(),
          camelotNumber: camelotData?.number,
          camelotLetter: camelotData?.letter
        };

        setLibrary(prev => [newTrack, ...prev]);
        lastProcessedTrack = newTrack;
        successCount++;
      } catch (err: any) {
        console.error(`Error en ${file.name}:`, err);
      }
    }

    setState(prev => ({ 
      ...prev, 
      isLoading: false,
      loadingMessage: '',
      currentTrack: lastProcessedTrack || prev.currentTrack, 
      error: successCount === 0 ? "No se pudo analizar el archivo. Verifica tu conexión o API Key." : null
    }));
  };

  const handleReset = () => {
    setState({ isLoading: false, currentTrack: null, error: null, loadingMessage: '' });
  };

  const handleDeleteTrack = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("¿Eliminar este análisis permanentemente?")) {
      setLibrary(prev => prev.filter(t => t.id !== id));
      if (state.currentTrack?.id === id) handleReset();
    }
  };

  const handleExportLibrary = () => {
    if (library.length === 0) return alert("Biblioteca vacía.");
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(library));
    const link = document.createElement('a');
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `dj_library_backup_${new Date().toISOString().slice(0,10)}.json`);
    link.click();
  };

  const handleImportLibraryFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        if (Array.isArray(importedData)) {
          setLibrary(prev => {
             const existingIds = new Set(prev.map(t => t.id));
             const newTracks = importedData.filter((t: any) => !existingIds.has(t.id));
             return [...newTracks, ...prev];
          });
          alert(`Importadas ${importedData.length} pistas.`);
        }
      } catch (err) { alert("Error al importar el archivo."); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-dj-dark text-zinc-200 selection:bg-dj-accent selection:text-black pb-20 font-sans">
      <div className="relative max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <header className="py-6 flex justify-between items-center border-b border-zinc-800 mb-8 bg-dj-dark/80 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-4 cursor-pointer group" onClick={handleReset}>
             <div className="transform group-hover:rotate-180 transition-transform duration-700">
                <LogoIcon />
             </div>
             <div className="flex flex-col">
               <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tighter uppercase leading-none">
                 Analizalle<span className="text-dj-accent">aí</span> DJ
               </h1>
               <span className="text-[10px] text-zinc-500 font-mono tracking-[0.4em] uppercase mt-1">Análisis Permanente</span>
             </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800">
                <div className={`w-2 h-2 rounded-full ${state.isLoading ? 'bg-dj-accent animate-ping' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'}`}></div>
                <span className="text-[10px] font-mono text-zinc-400 uppercase">
                  {state.isLoading ? 'Procesando' : 'Biblioteca Sincronizada'}
                </span>
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          <div className="xl:col-span-9 space-y-6">
            {state.error && (
              <div className="p-4 bg-red-900/20 border-l-4 border-red-500 text-red-200 animate-pulse">
                <span className="font-bold">ERROR:</span> {state.error}
              </div>
            )}

            {!state.currentTrack && !state.isLoading ? (
              <div className="bg-dj-panel border border-zinc-800 p-8 md:p-16 animate-fade-in-down rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-dj-accent/5 rounded-full blur-3xl pointer-events-none"></div>
                <div className="relative z-10 text-center mb-12">
                  <h2 className="text-4xl md:text-6xl font-black text-white mb-6 uppercase tracking-tighter">
                    Tu Archivo <span className="text-dj-accent">Musical</span>
                  </h2>
                  <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                    Los análisis se guardan automáticamente en tu biblioteca personal para que puedas consultarlos cuando quieras.
                  </p>
                </div>
                <div className="max-w-3xl mx-auto relative z-10">
                   <FileUpload onFileSelect={handleFileSelect} isLoading={state.isLoading} loadingMessage={state.loadingMessage} />
                </div>
              </div>
            ) : state.isLoading ? (
              <div className="bg-dj-panel border border-zinc-800 p-16 rounded-2xl flex flex-col items-center justify-center space-y-8 min-h-[400px]">
                 <div className="relative">
                    <div className="w-24 h-24 border-4 border-zinc-800 border-t-dj-accent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                       <LogoIcon />
                    </div>
                 </div>
                 <div className="text-center">
                   <h3 className="text-2xl font-black text-white uppercase tracking-widest">{state.loadingMessage || "Analizando..."}</h3>
                   <p className="text-zinc-500 font-mono mt-2">No cierres esta ventana mientras procesamos tu música.</p>
                 </div>
              </div>
            ) : (
              <AnalysisResult data={state.currentTrack} fileName={state.currentTrack.fileName} onReset={handleReset} />
            )}

             <div className="mt-8">
               <TrackLibrary 
                 tracks={library} 
                 currentTrackId={state.currentTrack?.id} 
                 onSelect={(track) => setState(prev => ({ ...prev, currentTrack: track }))}
                 onDelete={handleDeleteTrack}
               />
             </div>
          </div>

          <div className="xl:col-span-3 space-y-6 sticky top-24">
            {state.currentTrack && <Recommendations suggestions={suggestions} onSelect={(track) => setState(prev => ({ ...prev, currentTrack: track }))} />}
            
            <div className="bg-zinc-900 p-6 border border-zinc-800 rounded-xl">
               <div className="flex justify-between items-center border-b border-zinc-800 pb-2 mb-4">
                 <h4 className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Base de Datos Local</h4>
                 <div className="flex gap-2">
                    <button onClick={handleExportLibrary} className="text-[10px] text-dj-accent hover:text-white">EXPORTAR</button>
                    <span className="text-zinc-700">|</span>
                    <button onClick={() => importInputRef.current?.click()} className="text-[10px] text-zinc-400 hover:text-white">IMPORTAR</button>
                    <input type="file" ref={importInputRef} onChange={handleImportLibraryFile} className="hidden" accept=".json" />
                 </div>
               </div>
               <div className="flex justify-between items-center mb-2">
                  <span className="text-zinc-400 text-sm">Análisis guardados</span>
                  <span className="text-white font-mono text-xl">{library.length}</span>
               </div>
               <p className="text-[9px] text-zinc-500 uppercase leading-tight mt-4 italic">
                 Los datos están almacenados de forma segura en este navegador. Utiliza "Exportar" para crear copias de seguridad.
               </p>
             </div>

             {state.currentTrack && (
                <button 
                  onClick={handleReset}
                  className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold uppercase tracking-widest transition-all rounded-lg border border-zinc-700"
                >
                  Nuevo Análisis (+)
                </button>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;