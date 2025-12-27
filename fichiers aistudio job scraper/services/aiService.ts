import { JobOffer, JobCategory } from '../types';
import * as geminiService from './geminiService';
import * as ollamaService from './ollamaService'; // Nouveau service pour les appels Ollama via le backend

export type AIProvider = 'gemini' | 'ollama';

interface GeminiResponse { // L'interface est définie localement, car les retours de Gemini et Ollama sont structurellement identiques.
  score: number;
  category: JobCategory;
  reasoning: string;
  contractType?: string;
  salaryRange?: string;
  keyHighlights?: string[];
}

/**
 * Score et catégorise une offre d'emploi avec le provider IA choisi
 */
export const scoreAndCategorizeJob = async (
  job: JobOffer,
  criteria: string,
  provider: AIProvider = 'gemini',
  backendUrl?: string, // Ajout de backendUrl
  signal?: AbortSignal // Ajout de signal
): Promise<GeminiResponse> => {
  
  // Check abort before starting
  if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
  }

  console.log(`🤖 Utilisation de ${provider.toUpperCase()} pour scorer: ${job.title}`);
  
  try {
    if (provider === 'ollama') {
      // Appelle Ollama VIA le backend (passe par Ngrok)
      if (!backendUrl) {
        throw new Error('URL du backend requise pour Ollama.');
      }
      return await ollamaService.scoreAndCategorizeJob(job, criteria, backendUrl, signal);
    } else {
      // Appelle Gemini directement
      return await geminiService.scoreAndCategorizeJob(job, criteria, signal);
    }
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error;

    console.error(`❌ Erreur avec ${provider}:`, error);
    
    // Si c'est une erreur de quota Gemini, suggérer Ollama
    if (error instanceof Error) {
      if (error.message.includes('QUOTA_EXCEEDED') || error.message.includes('429')) {
        throw new Error('QUOTA_EXCEEDED: Quota Gemini épuisé. Passez à Ollama (Via Backend) dans les paramètres pour un usage illimité.');
      }
      
      // Si Ollama (via backend) n'est pas joignable
      if (provider === 'ollama' && error.message.includes('Impossible de joindre le backend')) {
        throw new Error('Ollama non accessible via le backend. Vérifiez que le serveur Node.js, Ollama (ollama serve) et Ngrok sont bien lancés.');
      }
    }
    
    throw error;
  }
};

/**
 * Extrait les critères depuis un CV avec le provider IA choisi
 */
export const extractCriteriaFromCV = async (
  base64Data: string,
  mimeType: string,
  provider: AIProvider = 'gemini',
  backendUrl?: string, // Ajout de backendUrl
  signal?: AbortSignal // Ajout de signal
): Promise<string> => {
  
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  console.log(`📄 Utilisation de ${provider.toUpperCase()} pour analyser le CV`);
  
  try {
    if (provider === 'ollama') {
      // Ollama ne supporte que le texte via le backend
      if (mimeType.includes('image') || mimeType.includes('pdf')) {
        // Fallback to Gemini if Ollama is selected but content is not TXT
        console.warn('⚠️ Ollama ne supporte pas les PDF/images via le backend. Basculement vers Gemini...');
        return await geminiService.extractCriteriaFromCV(base64Data, mimeType, signal);
      }
      if (!backendUrl) {
        throw new Error('URL du backend requise pour Ollama.');
      }
      return await ollamaService.extractCriteriaFromCV(base64Data, mimeType, backendUrl, signal);
    } else {
      // Gemini supporte tout
      return await geminiService.extractCriteriaFromCV(base64Data, mimeType, signal);
    }
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error;

    console.error(`❌ Erreur extraction CV avec ${provider}:`, error);
    
    // Si c'est une erreur de quota Gemini
    if (error instanceof Error) {
      if (error.message.includes('QUOTA_EXCEEDED') || error.message.includes('429')) {
        throw new Error('QUOTA_EXCEEDED: Quota Gemini épuisé. Pour analyser un CV, utilisez un fichier .txt avec Ollama (Via Backend) ou attendez le renouvellement du quota Gemini.');
      }
      // Si Ollama (via backend) n'est pas joignable
      if (provider === 'ollama' && error.message.includes('Impossible de joindre le backend')) {
        throw new Error('Ollama non accessible via le backend. Vérifiez que le serveur Node.js, Ollama (ollama serve) et Ngrok sont bien lancés.');
      }
    }
    
    throw error;
  }
};