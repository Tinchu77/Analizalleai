import { GoogleGenAI, Type } from "@google/genai";
import { AudioAnalysis } from "../types";

export const analyzeAudioFile = async (base64Audio: string, mimeType: string): Promise<AudioAnalysis> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key no encontrada. Asegúrate de que process.env.API_KEY está configurada.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  // Usamos gemini-3-flash-preview para máxima compatibilidad y potencia de análisis multimodal
  const modelId = "gemini-3-flash-preview"; 

  const prompt = `
    Actúa como un experto productor musical y DJ profesional. Analiza el archivo de audio con precisión técnica.
    
    IDIOMA DE RESPUESTA: ESPAÑOL (Castellano). Todo el texto descriptivo debe estar en español.

    1.  **BPM**: Calcula el tempo exacto (e.g. 128, 126.5).
    2.  **Tonalidad**: Detecta la nota y escala, y provéela en notación Camelot (e.g. 8A, 12B).
    3.  **Estructura**: Divide la canción cronológicamente. Usa ESTAS ETIQUETAS EXACTAS:
        *   "INTRO": Inicio de la pista.
        *   "VOCAL": Partes con estrofas o versos cantados.
        *   "EST.": Estribillo o coro principal (Chorus).
        *   "PUENTE": Partes instrumentales de transición, breaks o build-ups.
        *   "OUTRO": Final de la pista.
    
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
            bpm: { type: Type.NUMBER, description: "Beats per minute" },
            key: { type: Type.STRING, description: "Musical Key (Camelot notation, e.g. 8A)" },
            genre: { type: Type.STRING, description: "Genre (Spanish)" },
            duration: { type: Type.STRING, description: "Total duration mm:ss" },
            vocalStart: { type: Type.STRING, description: "Timestamp of first vocal" },
            chorusStart: { type: Type.STRING, description: "Timestamp of first 'EST.'" },
            mood: { type: Type.STRING, description: "Mood (Spanish)" },
            structuralPoints: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  timestamp: { type: Type.STRING },
                  description: { type: Type.STRING, description: "INTRO, VOCAL, EST., PUENTE, OUTRO" },
                  energy: { 
                    type: Type.STRING, 
                    enum: ["Low", "Medium", "High", "Build-up", "Drop"]
                  }
                },
                required: ["timestamp", "description", "energy"]
              }
            },
            djTips: { type: Type.STRING, description: "Mixing advice (Spanish)" }
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
    // Extraemos el mensaje de error para ayudar al usuario a diagnosticar si es la API Key
    const msg = error.message || "Error desconocido";
    throw new Error(`Error en el análisis: ${msg}`);
  }
};