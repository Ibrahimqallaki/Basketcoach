
import { GoogleGenAI, Type, Modality } from "@google/genai";

export const parseProfixioData = async (rawText: string): Promise<any> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Extrahera matchdata från följande råtext från en Profixio-matchsida. 
      Jag vill ha ett JSON-objekt med: 
      - opponent (sträng)
      - score (nummer, hemmalagets total)
      - opponentScore (nummer, bortalagets total)
      - date (YYYY-MM-DD)
      - events (array med {time, description, type: 'score'|'foul'|'timeout'|'period', team: 'us'|'them'})
      - summary (en kort coach-summering baserat på statistiken)

      Text: ${rawText}`,
      config: {
        responseMimeType: "application/json",
        systemInstruction: "Du är en data-extraherare för basketmatcher. Om du inte hittar specifika fält, gissa kvalificerat eller lämna tomma. 'Us' är alltid det lag coachen representerar (ofta det lokala laget i listan).",
      },
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Profixio parse error:", error);
    throw error;
  }
};

export const generateAppConcept = async (prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Design a detailed app concept based on: ${prompt}`,
      config: {
        systemInstruction: "You are a senior product architect. Provide the response as a structured Markdown breakdown including Name, Purpose, Key Features, and Tech Stack.",
        temperature: 0.7,
      },
    });
    return response.text || "Failed to generate concept.";
  } catch (error: any) {
    console.error("Concept generation error:", error);
    const errStr = JSON.stringify(error);
    const isRateLimit = error.status === 429 || error.message?.includes("429") || error.message?.includes("RESOURCE_EXHAUSTED") || errStr.includes("429") || errStr.includes("RESOURCE_EXHAUSTED");
    
    if (isRateLimit) {
      throw new Error("QUOTA_EXHAUSTED");
    }
    throw error;
  }
};

export const generateImage = async (prompt: string): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (error: any) {
    console.error("Image generation error:", error);
    const errStr = JSON.stringify(error);
    const isRateLimit = error.status === 429 || 
                       error.message?.includes("429") || 
                       error.message?.includes("RESOURCE_EXHAUSTED") || 
                       errStr.includes("429") || 
                       errStr.includes("RESOURCE_EXHAUSTED");
                       
    if (isRateLimit) {
      const quotaError = new Error("Rate limit hit. Please wait a minute.");
      (quotaError as any).status = 429;
      throw quotaError;
    }
    throw error;
  }
  return null;
};

export const generateVideo = async (prompt: string, progressCallback: (msg: string) => void): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    progressCallback("Initiating video generation...");
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 8000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
      progressCallback(`Rendering...`);
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (downloadLink) {
      const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      if (videoResponse.status === 429) throw new Error("QUOTA_EXHAUSTED");
      const blob = await videoResponse.blob();
      return URL.createObjectURL(blob);
    }
  } catch (error: any) {
    console.error("Video generation error:", error);
    if (error.message?.includes("QUOTA") || error.status === 429) {
      const quotaError = new Error("Quota reached.");
      (quotaError as any).status = 429;
      throw quotaError;
    }
    throw error;
  }
  return null;
};

export const analyzeGameFrame = async (base64Images: string | string[], userInstruction?: string, playerFocus?: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const images = Array.isArray(base64Images) ? base64Images : [base64Images];
    const isSequence = images.length > 1;
    const isFullVideo = images.length > 10; // Assuming storyboard has 10+ images

    let prompt = "";

    if (isFullVideo) {
      prompt = `Here are ${images.length} frames extracted evenly from a basketball video (spanning the whole duration). 
      Provide a SUMMARY analysis of the game flow, energy levels, and tactical patterns observed across these frames. 
      Identify recurring issues or strengths.`;
    } else if (isSequence) {
      prompt = "Analyze this sequence of 5 basketball frames (spanning approx 2 seconds). Look at the movement and development of the play.";
    } else {
      prompt = "Analyze this specific basketball frame.";
    }
    
    prompt += " Identify spacing issues, defensive stance quality, or scoring opportunities.";
    
    if (playerFocus) {
      prompt += ` Focus specifically on player number ${playerFocus}. Track their movement and consistency.`;
    }
    
    if (userInstruction) {
      prompt += ` The coach is specifically asking: "${userInstruction}".`;
    }

    prompt += " Be concise and speak like a professional coach. Focus on actionable advice.";

    // Construct parts array
    const parts: any[] = images.map(img => {
       const cleanBase64 = img.split(',')[1] || img;
       return {
         inlineData: {
           mimeType: 'image/png',
           data: cleanBase64
         }
       };
    });

    // Add text prompt at the end
    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: {
        parts: parts
      }
    });

    return response.text || "Ingen analys kunde genereras.";
  } catch (error) {
    console.error("Frame analysis error:", error);
    return "Ett fel uppstod vid AI-analysen. Kontrollera din API-nyckel.";
  }
};

export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
