import { GoogleGenAI, Type } from "@google/genai";
import { AudioAnalysis } from "../types";

export const analyzeAudioFile = async (base64Audio: string, mimeType: string): Promise<AudioAnalysis> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key no encontrada. Asegúrate de que process.env.API_KEY está configurada.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  // Using the native audio model for better music understanding
  const modelId = "gemini-2.5-flash-native-audio-preview-12-2025"; 

  const prompt = `
    Actúa como un experto productor musical y DJ profesional. Analiza el archivo de audio con precisión técnica.
    
    IDIOMA DE RESPUESTA: ESPAÑOL (Castellano). Todo el texto descriptivo debe estar en español.

    1.  **BPM**: Calcula el tempo exacto (e.g. 128, 126.5).
    2.  **Tonalidad**: Detecta la nota y escala, y provéela en notación Camelot (e.g. 8A, 12B).
    3.  **Estructura**: Divide la canción cronológicamente. Usa ESTAS ETIQUETAS para la descripción:
        *   "Intro" (Inicio instrumental)
        *   "Estrofa" (Versos, vocal suave)
        *   "Puente" (Build-up, pre-coro, transición)
        *   "Estribillo" (Coro principal, Hook)
        *   "Drop" (Máxima energía instrumental, típico en EDM/House)
        *   "Breakdown" (Bajada drástica de energía, pausa)
        *   "Outro" (Final)
    
    Proporciona los datos en JSON estricto:
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            bpm: { type: Type.NUMBER, description: "Beats per minute (precise)" },
            key: { type: Type.STRING, description: "Musical Key (Camelot notation, e.g. 8A)" },
            genre: { type: Type.STRING, description: "Genre of the track (in Spanish)" },
            duration: { type: Type.STRING, description: "Total duration in mm:ss" },
            vocalStart: { type: Type.STRING, description: "Timestamp (mm:ss) of first vocal. Use 00:00 if instrumental." },
            chorusStart: { type: Type.STRING, description: "Timestamp (mm:ss) of first chorus or drop" },
            mood: { type: Type.STRING, description: "The mood or vibe (Spanish)" },
            structuralPoints: {
              type: Type.ARRAY,
              description: "Chronological list of sections covering the WHOLE track",
              items: {
                type: Type.OBJECT,
                properties: {
                  timestamp: { type: Type.STRING, description: "Start time in mm:ss" },
                  description: { type: Type.STRING, description: "Use: Intro, Estrofa, Puente, Estribillo, Drop, Breakdown, Outro" },
                  energy: { 
                    type: Type.STRING, 
                    description: "Energy level",
                    enum: ["Low", "Medium", "High", "Build-up", "Drop"]
                  }
                },
                required: ["timestamp", "description", "energy"]
              }
            },
            djTips: { type: Type.STRING, description: "Technical mixing advice (in Spanish)" }
          },
          required: ["bpm", "key", "genre", "duration", "structuralPoints", "djTips"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("La IA no devolvió texto.");
    
    return JSON.parse(text) as AudioAnalysis;

  } catch (error: any) {
    console.error("Error analyzing audio:", error);
    throw new Error(error.message || "Error desconocido al contactar con Gemini AI.");
  }
};