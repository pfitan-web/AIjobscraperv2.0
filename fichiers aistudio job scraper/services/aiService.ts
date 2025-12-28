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
  // Pour les CVs, on force toujours l'utilisation du Backend (Gemini via Python) 
  // car c'est le seul qui gère bien les PDF de manière sécurisée sans clé API locale.
  return await geminiService.extractCriteriaFromCV(base64Data, mimeType, signal);
};
