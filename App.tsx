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

// Custom Corporate Icon: Vinyl + Graph + Magnifier concept
const LogoIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Vinyl Record Base */}
    <circle cx="24" cy="24" r="22" className="fill-zinc-900 stroke-zinc-700" strokeWidth="2"/>
    <circle cx="24" cy="24" r="8" className="fill-zinc-800" />
    <circle cx="24" cy="24" r="2" className="fill-zinc-950" />
    {/* Grooves */}
    <path d="M24 6C33.9411 6 42 14.0589 42 24" className="stroke-zinc-800" strokeWidth="1" strokeLinecap="round"/>
    <path d="M24 12C30.6274 12 36 17.3726 36 24" className="stroke-zinc-800" strokeWidth="1" strokeLinecap="round"/>
    <path d="M24 18C27.3137 18 30 20.6863 30 24" className="stroke-zinc-800" strokeWidth="1" strokeLinecap="round"/>
    
    {/* Graph / Frequency overlay in Corporate Accent */}
    <path d="M10 24L14 24L16 16L20 32L24 10L28 38L32 20L34 24L38 24" className="stroke-dj-accent" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    
    {/* Magnifying Glass Handle hint (Abstracted) */}
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

  useEffect(() => {
    const savedLibrary = localStorage.getItem('dj-library');
    if (savedLibrary) {
      try {
        setLibrary(JSON.parse(savedLibrary));
      } catch (e) {
        console.error("Failed to parse library", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('dj-library', JSON.stringify(library));
  }, [library]);

  useEffect(() => {
    if (state.currentTrack) {
      const recs = getSuggestions(state.currentTrack, library);
      setSuggestions(recs.slice(0, 3));
    } else {
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
      
      setState(prev => ({
        ...prev,
        loadingMessage: `Analizando ${i + 1} de ${total}: ${file.name}`
      }));

      try {
        if (i > 0) await new Promise(r => setTimeout(r, 1000));

        const base64Audio = await fileToBase64(file);
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
        console.error(`Error processing ${file.name}:`, err);
      }
    }

    setState(prev => ({ 
      ...prev, 
      isLoading: false,
      loadingMessage: '',
      currentTrack: lastProcessedTrack || prev.currentTrack, 
      error: successCount === 0 ? "Error: No se pudo analizar ningún archivo. Revisa tu API Key." : null
    }));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleReset = () => {
    setState({
      isLoading: false,
      currentTrack: null,
      error: null,
      loadingMessage: ''
    });
  };

  const handleDeleteTrack = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("¿Estás seguro de que quieres eliminar esta pista de la biblioteca?")) {
      setLibrary(prev => prev.filter(t => t.id !== id));
      if (state.currentTrack?.id === id) {
        handleReset();
      }
    }
  };

  // --- DATA PERSISTENCE FEATURES ---
  const handleExportLibrary = () => {
    if (library.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(library));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `analizalleai_backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportLibraryTrigger = () => {
    importInputRef.current?.click();
  };

  const handleImportLibraryFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        if (Array.isArray(importedData)) {
          // Merge logic: Add only tracks that don't exist by ID
          setLibrary(prev => {
             const existingIds = new Set(prev.map(t => t.id));
             const newTracks = importedData.filter((t: any) => !existingIds.has(t.id));
             return [...newTracks, ...prev];
          });
          alert(`Se han importado ${importedData.length} pistas correctamente.`);
        } else {
          alert("El archivo no tiene el formato correcto.");
        }
      } catch (err) {
        alert("Error al leer el archivo de base de datos.");
      }
    };
    reader.readAsText(file);
    // Reset value so same file can be selected again
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-dj-dark text-zinc-200 selection:bg-dj-accent selection:text-black pb-20 font-sans">
      
      <div className="relative max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 z-10">
        
        {/* Navbar */}
        <header className="py-6 flex justify-between items-center border-b border-zinc-800 mb-8 bg-dj-dark/80 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-4 cursor-pointer group" onClick={handleReset}>
             <div className="transform group-hover:rotate-180 transition-transform duration-700 ease-in-out">
                <LogoIcon />
             </div>
             <div className="flex flex-col">
               <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tighter uppercase leading-none">
                 Analizalle<span className="text-dj-accent">aí</span> DJ
               </h1>
               <span className="text-[10px] text-zinc-500 font-mono tracking-[0.4em] uppercase mt-1 hidden sm:block">
                 Inteligencia Musical
               </span>
             </div>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Simple Status Indicator */}
             <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800">
                <div className={`w-2 h-2 rounded-full ${state.isLoading ? 'bg-dj-accent animate-ping' : 'bg-green-500'}`}></div>
                <span className="text-[10px] font-mono text-zinc-400 uppercase">
                  {state.isLoading ? 'Procesando' : 'Sistema Listo'}
                </span>
             </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          {/* Left/Top Panel: Analysis or Upload */}
          <div className="xl:col-span-9 space-y-6">
            {state.error && (
              <div className="p-4 bg-red-900/20 border-l-4 border-red-500 text-red-200 flex items-center gap-3 animate-pulse">
                <span className="font-bold">ERROR:</span> {state.error}
              </div>
            )}

            {!state.currentTrack ? (
              <div className="bg-dj-panel border border-zinc-800 p-8 md:p-16 animate-fade-in-down rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-dj-accent/5 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="relative z-10 text-center mb-12">
                  <div className="inline-block mb-6 p-4 bg-zinc-900/50 rounded-full border border-zinc-800">
                    <LogoIcon />
                  </div>
                  <h2 className="text-4xl md:text-6xl font-black text-white mb-6 uppercase tracking-tighter">
                    Tu Asistente de <span className="text-dj-accent">Mezcla</span>
                  </h2>
                  <p className="text-zinc-400 text-lg max-w-2xl mx-auto leading-relaxed">
                    Sube tus archivos de audio para obtener un desglose estructural detallado, 
                    detección de energía por secciones y compatibilidad armónica instantánea.
                  </p>
                </div>

                <div className="max-w-3xl mx-auto relative z-10">
                   <FileUpload 
                      onFileSelect={handleFileSelect} 
                      isLoading={state.isLoading} 
                      loadingMessage={state.loadingMessage}
                   />
                </div>
              </div>
            ) : (
              <AnalysisResult 
                data={state.currentTrack} 
                fileName={state.currentTrack.fileName} 
                onReset={handleReset} 
              />
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

          {/* Right Panel: Side Tools */}
          <div className="xl:col-span-3 space-y-6 sticky top-24">
            
            {state.currentTrack && (
               <div className="animate-fade-in-up">
                 <Recommendations 
                   suggestions={suggestions} 
                   onSelect={(track) => setState(prev => ({ ...prev, currentTrack: track }))} 
                 />
               </div>
            )}

            {state.currentTrack && !state.isLoading && (
              <div className="bg-dj-panel border border-zinc-800 p-6 rounded-xl">
                 <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Análisis Rápido</h3>
                 <FileUpload 
                    onFileSelect={handleFileSelect} 
                    isLoading={state.isLoading} 
                    loadingMessage={state.loadingMessage}
                 />
              </div>
            )}
             
             <div className="bg-zinc-900 p-6 border border-zinc-800 rounded-xl">
               <div className="flex justify-between items-center border-b border-zinc-800 pb-2 mb-4">
                 <h4 className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Base de Datos</h4>
                 <div className="flex gap-2">
                    <button onClick={handleExportLibrary} className="text-[10px] text-dj-accent hover:text-white" title="Descargar copia de seguridad">
                       EXPORTAR
                    </button>
                    <span className="text-zinc-700">|</span>
                    <button onClick={handleImportLibraryTrigger} className="text-[10px] text-zinc-400 hover:text-white" title="Cargar copia de seguridad">
                       IMPORTAR
                    </button>
                    <input 
                      type="file" 
                      ref={importInputRef} 
                      onChange={handleImportLibraryFile} 
                      className="hidden" 
                      accept=".json"
                    />
                 </div>
               </div>
               
               <div className="flex justify-between items-center mb-2">
                  <span className="text-zinc-400 text-sm">Tracks</span>
                  <span className="text-white font-mono text-xl">{library.length}</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-zinc-400 text-sm">Media BPM</span>
                  <span className="text-dj-accent font-mono text-xl">
                    {library.length > 0 ? Math.round(library.reduce((acc, t) => acc + t.bpm, 0) / library.length) : 0}
                  </span>
               </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;