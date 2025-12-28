import { JobOffer, JobCategory } from '../types';
import * as geminiService from './geminiService';
import * as ollamaService from './ollamaService'; 

// On garde 'ollama' comme identifiant interne pour ne pas casser le sélecteur, 
// mais dans l'interface, ce sera "Groq / Llama 3.3"
export type AIProvider = 'gemini' | 'ollama';

interface GeminiResponse {
  score: number;
  category: JobCategory;
  reasoning: string;
  contractType?: string;
  salaryRange?: string;
  keyHighlights?: string[];
}

export const scoreAndCategorizeJob = async (
  job: JobOffer,
  criteria: string,
  provider: AIProvider = 'gemini',
  backendUrl: string = "https://patman4524-aijobscraper.hf.space", // URL par défaut forcée
  signal?: AbortSignal
): Promise<GeminiResponse> => {
  
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  try {
    if (provider === 'ollama') {
      // C'est ici que ça se passe : 'ollama' déclenche maintenant Groq via le backend
      console.log(`⚡ Appel à Groq (Llama 3.3 70B) pour : ${job.title}`);
      return await ollamaService.scoreAndCategorizeJob(job, criteria, backendUrl, signal);
    } else {
      console.log(`✨ Appel à Gemini Flash pour : ${job.title}`);
      return await geminiService.scoreAndCategorizeJob(job, criteria, signal);
    }
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error;
    console.error(`❌ Erreur IA (${provider}):`, error);
    throw error;
  }
};

export const extractCriteriaFromCV = async (
  base64Data: string,
  mimeType: string,
  provider: AIProvider = 'gemini',
  backendUrl: string = "https://patman4524-aijobscraper.hf.space",
  signal?: AbortSignal
): Promise<string> => {
  
  // 1. Conversion du Base64 en fichier réel (Blob) pour Python
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const fileBlob = new Blob([byteArray], { type: mimeType });

  // 2. Utilisation de FormData (indispensable pour Python @app.post("/api/analyze-cv"))
  const formData = new FormData();
  formData.append('file', fileBlob, 'cv_upload.pdf');

  const response = await fetch(`${backendUrl}/api/analyze-cv`, {
    method: 'POST',
    body: formData, // On envoie le FormData directement
    signal
  });

  const data = await response.json();
  if (data.status === "success") return data.analysis;
  throw new Error(data.message || "Erreur analyse");
};
