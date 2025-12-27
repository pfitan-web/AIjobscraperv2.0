import { JobOffer, JobCategory } from '../types';

interface OllamaResponse { // Renommé de GeminiResponse pour être plus générique
  score: number;
  category: JobCategory;
  reasoning: string;
  contractType?: string;
  salaryRange?: string;
  keyHighlights?: string[];
}

/**
 * Score une offre d'emploi via le backend (qui appelle Ollama)
 */
export const scoreAndCategorizeJob = async (
  job: JobOffer,
  criteria: string,
  backendUrl: string = 'http://localhost:3001',
  signal?: AbortSignal
): Promise<OllamaResponse> => {
  
  const endpoint = `${backendUrl}/api/score-job`;
  console.log(`Scoring job via backend: ${endpoint}`);
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job, criteria }),
      signal // Pass signal
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Backend error: ${response.status}`);
    }

    const result = await response.json();
    
    // Si le backend a retourné un fallback
    if (result.fallback) {
      console.warn('Ollama fallback activé');
    }

    return {
      score: result.score || 0,
      category: result.category || JobCategory.REVIEW,
      reasoning: result.reasoning || "Analyse non disponible",
      contractType: result.contractType,
      salaryRange: result.salaryRange,
      keyHighlights: result.keyHighlights || []
    };

  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error;
    
    console.error('Erreur scoring via backend:', error);
    
    // Fallback local basique
    let errorMessage = `Impossible de scorer l'offre. Erreur: ${error instanceof Error ? error.message : 'Inconnue'}.`;
    if (error instanceof Error && (error.message.includes('Failed to fetch') || error.message.includes('Network request failed'))) {
      errorMessage = `Impossible de joindre le backend à l'URL configurée (${backendUrl}). Vérifiez que le serveur Node.js, Ollama (\`ollama serve\`) et votre tunnel Ngrok (si utilisé) sont bien lancés.`;
    }

    return {
      score: 50,
      category: JobCategory.REVIEW,
      reasoning: errorMessage,
      keyHighlights: []
    };
  }
};

/**
 * Analyse un CV via le backend (qui appelle Ollama)
 */
export const extractCriteriaFromCV = async (
  base64Data: string,
  mimeType: string,
  backendUrl: string = 'http://localhost:3001',
  signal?: AbortSignal
): Promise<string> => {
  
  const endpoint = `${backendUrl}/api/analyze-cv`;
  console.log('Analyzing CV via backend');
  
  try {
    // Pour l'instant, on supporte uniquement le texte
    if (mimeType.includes('image') || mimeType.includes('pdf')) {
      throw new Error("Ollama ne supporte que les fichiers .txt pour l'instant via le backend. Utilisez Gemini pour les PDF/images.");
    }

    // Décoder le base64
    const cvText = atob(base64Data);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cvText }),
      signal // Pass signal
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Backend error: ${response.status}`);
    }

    const result = await response.json();
    return result.criteria || "Impossible d'extraire les critères du CV.";

  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error;

    console.error('Erreur analyse CV via backend:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('Network request failed')) {
        throw new Error(`Impossible de joindre le backend à l'URL configurée (${backendUrl}). Vérifiez que le serveur Node.js et votre tunnel Ngrok (si utilisé) sont lancés.`);
      }
      throw error;
    }
    
    throw new Error("Erreur technique lors de l'analyse du CV.");
  }
};