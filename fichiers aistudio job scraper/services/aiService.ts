import { JobOffer, JobCategory } from '../types';
import * as geminiService from './geminiService';
import * as ollamaService from './ollamaService'; 

export type AIProvider = 'gemini' | 'ollama';

export const scoreAndCategorizeJob = async (
  job: JobOffer,
  criteria: string,
  provider: AIProvider = 'gemini',
  backendUrl: string = "https://patman4524-aijobscraper.hf.space",
  signal?: AbortSignal
): Promise<any> => {
  if (provider === 'ollama') {
    return await ollamaService.scoreAndCategorizeJob(job, criteria, backendUrl, signal);
  }
  // Pour le scoring Gemini, on pourrait créer une route dédiée, 
  // mais pour l'instant on se concentre sur l'import CV
  return { score: 0, category: JobCategory.REVIEW, reasoning: "Utilisez Groq pour le scoring." };
};

export const extractCriteriaFromCV = async (
  base64Data: string,
  mimeType: string,
  provider: AIProvider = 'gemini',
  backendUrl: string = "https://patman4524-aijobscraper.hf.space",
  signal?: AbortSignal
): Promise<string> => {
  // On appelle la fonction de geminiService qui envoie au backend Python
  return await geminiService.extractCriteriaFromCV(base64Data, mimeType, signal);
};
