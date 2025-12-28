import { JobCategory } from '../types';

export const extractCriteriaFromCV = async (
  base64Data: string, 
  mimeType: string,
  signal?: AbortSignal
): Promise<string> => {
  // Récupération automatique de l'URL configurée dans les paramètres
  const settings = JSON.parse(localStorage.getItem('job-scraper-settings') || '{}');
  const backendUrl = settings.backendUrl?.replace(/\/$/, "") || "https://patman4524-aijobscraper.hf.space";

  try {
    // 1. Conversion du Base64 en Blob pour l'envoi de fichier
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const fileBlob = new Blob([byteArray], { type: mimeType });

    // 2. Préparation du FormData pour Python (FastAPI)
    const formData = new FormData();
    formData.append('file', fileBlob, 'cv_upload.pdf');

    const response = await fetch(`${backendUrl}/api/analyze-cv`, {
      method: 'POST',
      body: formData,
      signal
    });

    if (!response.ok) {
      throw new Error(`Le backend a répondu avec une erreur ${response.status}`);
    }

    const data = await response.json();
    if (data.status === "success") {
      return data.analysis;
    } else {
      throw new Error(data.message || "Erreur lors de l'analyse du CV");
    }

  } catch (error: any) {
    if (error.name === 'AbortError') throw error;
    console.error("Erreur GeminiService (Backend):", error);
    throw error;
  }
};

// Garder la structure pour le scoring (optionnel si vous utilisez Groq)
export const scoreAndCategorizeJob = async (job: any, criteria: string, signal?: AbortSignal) => {
    // Cette partie peut rester vide ou appeler une route de scoring Gemini sur votre backend
    return { score: 0, category: JobCategory.REVIEW, reasoning: "Utilisez Groq pour le scoring." };
};
