import { JobCategory } from '../types';

export const extractCriteriaFromCV = async (
  base64Data: string, 
  mimeType: string,
  signal?: AbortSignal
): Promise<string> => {
  // On récupère l'URL du backend depuis le stockage local
  const settings = JSON.parse(localStorage.getItem('job-scraper-settings') || '{}');
  const backendUrl = settings.backendUrl?.replace(/\/$/, "") || "https://patman4524-aijobscraper.hf.space";

  try {
    // 1. Conversion du Base64 en Blob (Fichier réel)
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const fileBlob = new Blob([byteArray], { type: mimeType });

    // 2. Préparation de l'envoi vers Python
    const formData = new FormData();
    formData.append('file', fileBlob, 'cv_upload.pdf');

    const response = await fetch(`${backendUrl}/api/analyze-cv`, {
      method: 'POST',
      body: formData,
      signal
    });

    if (!response.ok) throw new Error(`Erreur serveur: ${response.status}`);

    const data = await response.json();
    if (data.status === "success") return data.analysis;
    throw new Error(data.message || "Erreur lors de l'analyse");

  } catch (error: any) {
    if (error.name === 'AbortError') throw error;
    console.error("Erreur GeminiService:", error);
    throw error;
  }
};

// Fonction vide pour éviter les erreurs d'importation ailleurs
export const scoreAndCategorizeJob = async () => {
    return { score: 0, category: JobCategory.REVIEW, reasoning: "Indisponible" };
};
