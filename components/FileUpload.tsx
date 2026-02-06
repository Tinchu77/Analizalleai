import React, { useRef, useState } from 'react';

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  isLoading: boolean;
  loadingMessage?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isLoading, loadingMessage }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndUpload(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndUpload(e.target.files);
    }
  };

  const validateAndUpload = (fileList: FileList) => {
    const files: File[] = [];
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/flac', 'audio/x-flac', 'audio/mp3'];
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const isAudio = validTypes.includes(file.type) || /\.(mp3|wav|flac)$/i.test(file.name);
      if (isAudio) {
        files.push(file);
      }
    }

    if (files.length > 0) {
      onFileSelect(files);
    } else {
      alert("Por favor sube archivos de audio válidos (.mp3, .wav, .flac)");
    }
  };

  return (
    <div 
      className={`relative border-2 border-dashed rounded-none p-12 text-center transition-all duration-300 cursor-pointer group select-none
        ${isDragging 
          ? 'border-dj-accent bg-zinc-900 scale-[1.02]' 
          : 'border-zinc-700 hover:border-dj-accent hover:bg-zinc-900'
        }
        ${isLoading ? 'opacity-80 pointer-events-none border-dj-accent' : ''}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !isLoading && fileInputRef.current?.click()}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileInput} 
        className="hidden" 
        accept=".mp3,.wav,.flac,audio/*"
        multiple // Enable multiple files
      />
      
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className={`transition-transform duration-300 ${isDragging ? 'scale-110' : ''}`}>
           {isLoading ? (
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dj-accent"></div>
           ) : (
             <svg className="w-12 h-12 text-zinc-500 group-hover:text-dj-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
           )}
        </div>
        <div>
          <h3 className="text-xl font-bold text-white uppercase tracking-tight">
            {isLoading ? "ANALIZANDO LOTE..." : "ARRASTRA TUS AUDIOS"}
          </h3>
          <p className="text-zinc-500 text-sm mt-2 font-mono">
            {isLoading ? loadingMessage : "Soporta MP3, WAV, FLAC (Lotes permitidos)"}
          </p>
        </div>
        {!isLoading && (
          <button className="px-8 py-3 bg-zinc-800 text-white text-xs font-bold uppercase tracking-widest hover:bg-dj-accent hover:text-black transition-colors">
            Seleccionar Archivos
          </button>
        )}
      </div>

      {isLoading && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
           <div className="h-full bg-dj-accent animate-progress"></div>
        </div>
      )}
    </div>
  );
};