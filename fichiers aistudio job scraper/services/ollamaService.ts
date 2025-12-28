import { JobOffer, JobCategory } from '../types';

// On garde le nom "OllamaResponse" pour ne pas casser les types ailleurs, 
// mais c'est bien la réponse de Groq/Llama 3.3
interface OllamaResponse { 
  score: number;
  category: JobCategory;
  reasoning: string;
  contractType?: string;
  salaryRange?: string;
  keyHighlights?: string[];
}

/**
 * Ce service appelle maintenant Llama 3.3 70B via votre backend Hugging Face (Groq)
 */
export const scoreAndCategorizeJob = async (
  job: JobOffer,
  criteria: string,
  backendUrl: string = 'https://patman4524-aijobscraper.hf.space', // Votre URL par défaut
  signal?: AbortSignal
): Promise<OllamaResponse> => {
  
  // On appelle la nouvelle route Groq que nous avons créée dans app.py
  const endpoint = `${backendUrl}/api/score-job`;
  console.log(`🚀 Scoring via Groq (Llama 3.3): ${endpoint}`);
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job, criteria }),
      signal
    });

    if (!response.ok) {
      throw new Error(`Erreur Backend Groq: ${response.status}`);
    }

    const result = await response.json();
    
    // Le backend Python renvoie maintenant le JSON propre formaté par Groq
    return {
      score: result.score || 0,
      category: result.category || JobCategory.REVIEW,
      reasoning: result.reasoning || "Analyse non disponible",
      contractType: result.contractType,
      salaryRange: result.salaryRange,
      keyHighlights: [] // Groq peut ne pas renvoyer ça par défaut si non demandé spécifiquement
    };

  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error;
    console.error('Erreur scoring Groq:', error);
    
    return {
      score: 0,
      category: JobCategory.REVIEW,
      reasoning: "Erreur lors de l'appel à Groq/Llama 3.3 via le backend.",
      keyHighlights: []
    };
  }
};

/**
 * Analyse un CV via Groq (non utilisé pour le moment car on préfère Gemini pour les PDF, 
 * mais prêt si vous envoyez du texte pur)
 */
export const extractCriteriaFromCV = async (
  base64Data: string,
  mimeType: string,
  backendUrl: string = 'https://patman4524-aijobscraper.hf.space',
  signal?: AbortSignal
): Promise<string> => {
  // Pour le CV, on reste sur Gemini via analyze-cv car Groq ne lit pas les PDF nativement
  // Cette fonction est gardée pour la compatibilité du code
  console.warn("L'analyse CV via Groq n'est pas optimale pour les PDF. Utilisez Gemini.");
  return "Veuillez utiliser Gemini pour l'analyse de CV (PDF).";
};
