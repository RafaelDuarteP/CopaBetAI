import { GoogleGenAI } from "@google/genai";

// Initialize Gemini Client
// In a real production app, ensure this key is not exposed to the client if not intended.
// For this demo, we assume process.env.API_KEY is available.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateMatchDescription = async (homeTeam: string, awayTeam: string, group: string): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `Escreva uma breve e empolgante descrição de duas frases para uma partida de futebol da Copa do Mundo entre ${homeTeam} e ${awayTeam} no ${group}. Não inclua o placar. Concentre-se na rivalidade ou na importância da partida.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text || "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return `Confronto entre ${homeTeam} e ${awayTeam} pelo ${group}.`;
  }
};

export const getMatchPrediction = async (homeTeam: string, awayTeam: string): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `Analise a partida de futebol entre ${homeTeam} e ${awayTeam}.
                    Forneça uma dica de aposta ou previsão concisa em no máximo 3 frases.
                    Considere o desempenho histórico, mas mantenha a análise genérica o suficiente para uma demonstração.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text || "Previsão não disponível";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Analise por IA indisponível";
  }
};
