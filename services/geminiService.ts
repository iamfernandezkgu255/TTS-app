
import { GoogleGenAI } from "@google/genai";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
  try {
    const audioPart = {
      inlineData: {
        mimeType: mimeType,
        data: base64Audio,
      },
    };
    const textPart = {
      text: "Transcribe the following English audio file accurately. Provide only the text from the audio."
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [audioPart, textPart] },
    });
    
    return response.text;
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw new Error("Failed to transcribe audio. Please check the console for details.");
  }
};

export const translateText = async (englishText: string): Promise<string> => {
  try {
    const prompt = `Translate the following English text to French. Only provide the French translation, without any additional commentary, explanations, or quotation marks.\n\n---\n\nEnglish: "${englishText}"\n\nFrench:`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Error translating text:", error);
    throw new Error("Failed to translate text. Please check the console for details.");
  }
};
