import { GoogleGenAI, Type } from "@google/genai";
import { AudioAnalysis } from "../types";

export const analyzeAudioFile = async (base64Audio: string, mimeType: string): Promise<AudioAnalysis> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key no encontrada. Asegúrate de que process.env.API_KEY está configurada.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelId = "gemini-3-flash-preview"; 

  const prompt = `
    Actúa como un experto productor musical y DJ profesional. Analiza el archivo de audio con precisión técnica.
    
    IDIOMA DE RESPUESTA: ESPAÑOL (Castellano). Todo el texto descriptivo debe estar en español.

    1.  **BPM**: Calcula el tempo exacto.
    2.  **Tonalidad**: Detecta la nota y escala, y provéela en notación Camelot (e.g. 8A, 12B).
    3.  **Estructura**: Divide la canción cronológicamente usando ESTAS ETIQUETAS EXACTAS:
        *   "INTRO": Inicio de la pista.
        *   "VOCAL": Partes con voz (estrofas).
        *   "EST.": Estribillos o estribillos principales.
        *   "PUENTE": Transiciones instrumentales, build-ups o breaks.
        *   "DROP": Momentos de máxima energía (si aplica).
        *   "OUTRO": Final de la pista.
    
    Proporciona los datos en JSON estricto siguiendo el esquema solicitado.
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
            bpm: { type: Type.NUMBER },
            key: { type: Type.STRING },
            genre: { type: Type.STRING },
            duration: { type: Type.STRING },
            vocalStart: { type: Type.STRING },
            chorusStart: { type: Type.STRING },
            mood: { type: Type.STRING },
            structuralPoints: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  timestamp: { type: Type.STRING },
                  description: { type: Type.STRING },
                  energy: { 
                    type: Type.STRING, 
                    enum: ["Low", "Medium", "High", "Build-up", "Drop"]
                  }
                },
                required: ["timestamp", "description", "energy"]
              }
            },
            djTips: { type: Type.STRING }
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