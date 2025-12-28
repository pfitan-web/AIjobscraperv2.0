// services/aiService.ts
export const extractCriteriaFromCV = async (
  base64Data: string,
  mimeType: string,
  provider: string = 'gemini',
  backendUrl: string = "https://patman4524-aijobscraper.hf.space",
  signal?: AbortSignal
): Promise<string> => {
  
  // Conversion en Blob pour l'envoi multipart
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const fileBlob = new Blob([byteArray], { type: mimeType });

  const formData = new FormData();
  formData.append('file', fileBlob, 'cv_upload.pdf');

  const response = await fetch(`${backendUrl.replace(/\/$/, "")}/api/analyze-cv`, {
    method: 'POST',
    body: formData,
    signal
  });

  if (!response.ok) throw new Error(`Erreur Backend (${response.status})`);
  
  const data = await response.json();
  if (data.status === "success") return data.analysis;
  throw new Error(data.message || "Erreur analyse");
};

// Ajoutez cette fonction vide pour ne pas casser les imports ailleurs
export const scoreAndCategorizeJob = async () => ({ score: 0 });
