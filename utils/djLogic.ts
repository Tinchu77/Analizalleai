import { LibraryTrack } from "../types";

// Parse Camelot keys like "8A", "12B", "4A/4B"
export const parseCamelot = (keyStr: string): { number: number, letter: string } | null => {
  const match = keyStr.match(/(\d+)([ABab])/);
  if (match) {
    return { number: parseInt(match[1]), letter: match[2].toUpperCase() };
  }
  return null;
};

// Check if two tracks are harmonically compatible
export const isHarmonicMatch = (track1: LibraryTrack, track2: LibraryTrack): boolean => {
  if (!track1.camelotNumber || !track1.camelotLetter || !track2.camelotNumber || !track2.camelotLetter) {
    // If we couldn't parse the key, fallback to strict string equality or loose matching
    return track1.key === track2.key; 
  }

  const num1 = track1.camelotNumber;
  const num2 = track2.camelotNumber;
  const let1 = track1.camelotLetter;
  const let2 = track2.camelotLetter;

  // Rule 1: Same Key
  if (num1 === num2 && let1 === let2) return true;

  // Rule 2: Relative Major/Minor (Same number, different letter) e.g. 8A <-> 8B
  if (num1 === num2 && let1 !== let2) return true;

  // Rule 3: +/- 1 Number (Same letter) e.g. 8A <-> 7A or 8A <-> 9A
  // Handle the clock wrap-around (12 goes to 1, 1 goes to 12)
  const diff = Math.abs(num1 - num2);
  const isAdjacent = (diff === 1) || (diff === 11); // 11 handles 12 vs 1
  
  if (isAdjacent && let1 === let2) return true;

  return false;
};

// Get suggestions from library based on current track
export const getSuggestions = (currentTrack: LibraryTrack, library: LibraryTrack[]): LibraryTrack[] => {
  return library.filter(track => {
    if (track.id === currentTrack.id) return false;

    // BPM Check (within +/- 10% or compatible double/half time)
    const bpmRatio = track.bpm / currentTrack.bpm;
    const isBpmCompatible = (bpmRatio >= 0.9 && bpmRatio <= 1.1) || 
                            (bpmRatio >= 1.9 && bpmRatio <= 2.1) || // Double time
                            (bpmRatio >= 0.45 && bpmRatio <= 0.55); // Half time

    // Key Check
    const isKeyCompatible = isHarmonicMatch(currentTrack, track);

    return isBpmCompatible && isKeyCompatible;
  });
};
