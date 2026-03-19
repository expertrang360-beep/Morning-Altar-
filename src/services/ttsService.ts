import { GoogleGenAI, Modality } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY || '';

/**
 * Adds a WAV header to raw PCM data.
 * Gemini TTS returns raw 16-bit PCM at 24kHz.
 */
function addWavHeader(pcmData: Uint8Array, sampleRate: number): Uint8Array {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  // RIFF chunk descriptor
  // "RIFF"
  view.setUint32(0, 0x52494646, false);
  // ChunkSize (36 + data size)
  view.setUint32(4, 36 + pcmData.length, true);
  // "WAVE"
  view.setUint32(8, 0x57415645, false);

  // fmt sub-chunk
  // "fmt "
  view.setUint32(12, 0x666d7420, false);
  // Subchunk1Size (16 for PCM)
  view.setUint32(16, 16, true);
  // AudioFormat (1 for PCM)
  view.setUint16(20, 1, true);
  // NumChannels (1 for Mono)
  view.setUint16(22, 1, true);
  // SampleRate
  view.setUint32(24, sampleRate, true);
  // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
  view.setUint32(28, sampleRate * 2, true);
  // BlockAlign (NumChannels * BitsPerSample/8)
  view.setUint16(32, 2, true);
  // BitsPerSample (16)
  view.setUint16(34, 16, true);

  // data sub-chunk
  // "data"
  view.setUint32(36, 0x64617461, false);
  // Subchunk2Size
  view.setUint32(40, pcmData.length, true);

  const wav = new Uint8Array(header.byteLength + pcmData.length);
  wav.set(new Uint8Array(header), 0);
  wav.set(pcmData, header.byteLength);

  return wav;
}

export async function generateSpeech(text: string): Promise<string | null> {
  if (!API_KEY) {
    console.error("GEMINI_API_KEY is not set");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      // Convert base64 to Uint8Array
      const binaryString = atob(base64Audio);
      const pcmData = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        pcmData[i] = binaryString.charCodeAt(i);
      }

      // Add WAV header (Gemini TTS uses 24kHz)
      const wavData = addWavHeader(pcmData, 24000);
      
      // Create a Blob and return its URL
      const blob = new Blob([wavData], { type: 'audio/wav' });
      return URL.createObjectURL(blob);
    }
    return null;
  } catch (error) {
    console.error("Error generating speech:", error);
    return null;
  }
}
