export interface StructuralPoint {
  timestamp: string;
  description: string;
  energy: 'Low' | 'Medium' | 'High' | 'Build-up' | 'Drop';
}

export interface AudioAnalysis {
  bpm: number;
  key: string;
  genre: string;
  duration: string; // "mm:ss" Total estimated duration
  vocalStart: string;
  chorusStart: string;
  mood: string;
  structuralPoints: StructuralPoint[];
  djTips: string;
}

export interface LibraryTrack extends AudioAnalysis {
  id: string;
  fileName: string;
  dateAdded: number; // Timestamp
  camelotNumber?: number; // Parsed for sorting
  camelotLetter?: string; // Parsed for sorting
}

export interface AnalysisState {
  isLoading: boolean;
  currentTrack: LibraryTrack | null;
  error: string | null;
}