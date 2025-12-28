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
  // Par défaut on peut utiliser le backend aussi pour le scoring Gemini si implémenté
  return await geminiService.scoreAndCategorizeJob(job, criteria, signal);
};

export const extractCriteriaFromCV = async (
  base64Data: string,
  mimeType: string,
  provider: AIProvider = 'gemini',
  backendUrl: string = "https://patman4524-aijobscraper.hf.space",
  signal?: AbortSignal
): Promise<string> => {
  // On utilise TOUJOURS le service gemini qui est maintenant branché sur le backend Python
  return await geminiService.extractCriteriaFromCV(base64Data, mimeType, signal);
};
