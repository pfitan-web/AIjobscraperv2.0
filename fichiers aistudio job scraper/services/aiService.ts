// ═══════════════════════════════════════════════════════════════════════════
// AI SERVICE - ABSTRACTION POUR COMMUNICATION BACKEND PYTHON
// ═══════════════════════════════════════════════════════════════════════════
// VERSION: 2.0 - Hugging Face Backend
// ARCHITECTURE: Toutes les opérations IA passent par le backend Python
// Plus d'appel direct à Gemini côté frontend (sécurité API Key)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Extrait les critères depuis un CV uploadé par l'utilisateur
 * FLOW: Frontend (base64) → Backend Python → Gemini API → Retour texte structuré
 * 
 * @param base64Data - Données du fichier en base64 (sans préfixe data:...)
 * @param mimeType - Type MIME du fichier (application/pdf, image/jpeg, etc.)
 * @param provider - Provider IA (ignoré, backend utilise toujours Gemini pour CV)
 * @param backendUrl - URL du backend Hugging Face Space
 * @param signal - AbortSignal pour annulation
 * @returns Texte des critères extraits du CV
 */
export const extractCriteriaFromCV = async (
  base64Data: string,
  mimeType: string,
  provider: string = 'gemini',
  backendUrl: string = "https://patman4524-aijobscraper.hf.space",
  signal?: AbortSignal
): Promise<string> => {
  
  // ═══════════════════════════════════════════════════════════════════════
  // LOGS DEBUG - Permet de tracer l'origine des erreurs
  // ═══════════════════════════════════════════════════════════════════════
  console.log("[aiService] 🚀 Démarrage analyse CV:", {
    backendUrl,
    mimeType,
    dataLength: base64Data.length,
    provider
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CONVERSION BASE64 → BLOB
  // ═══════════════════════════════════════════════════════════════════════
  // RAISON: FormData nécessite un Blob/File pour multipart/form-data
  // Le backend Python (FastAPI) attend un UploadFile
  
  try {
    const byteCharacters = atob(base64Data); // Décode base64 en string binaire
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    const fileBlob = new Blob([byteArray], { type: mimeType });

    console.log("[aiService] ✅ Blob créé:", {
      size: fileBlob.size,
      type: fileBlob.type
    });

    // ═══════════════════════════════════════════════════════════════════════
    // CONSTRUCTION FORMDATA
    // ═══════════════════════════════════════════════════════════════════════
    const formData = new FormData();
    formData.append('file', fileBlob, 'cv_upload.pdf');

    // ═══════════════════════════════════════════════════════════════════════
    // APPEL BACKEND PYTHON (HUGGING FACE)
    // ═══════════════════════════════════════════════════════════════════════
    console.log("[aiService] 📡 Envoi requête vers:", `${backendUrl.replace(/\/$/, "")}/api/analyze-cv`);

    const response = await fetch(`${backendUrl.replace(/\/$/, "")}/api/analyze-cv`, {
      method: 'POST',
      body: formData,
      signal
    });

    console.log("[aiService] 📥 Réponse reçue:", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    // ═══════════════════════════════════════════════════════════════════════
    // GESTION ERREURS HTTP
    // ═══════════════════════════════════════════════════════════════════════
    if (!response.ok) {
      const errorText = await response.text();
      console.error("[aiService] ❌ Erreur backend:", {
        status: response.status,
        body: errorText
      });
      throw new Error(`Erreur Backend (${response.status}): ${errorText.substring(0, 200)}`);
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // PARSING RÉPONSE JSON
    // ═══════════════════════════════════════════════════════════════════════
    const data = await response.json();
    console.log("[aiService] ✅ Réponse backend parsée:", {
      status: data.status,
      hasAnalysis: !!data.analysis,
      analysisLength: data.analysis?.length || 0
    });
    
    // ═══════════════════════════════════════════════════════════════════════
    // VALIDATION STRUCTURE RÉPONSE
    // ═══════════════════════════════════════════════════════════════════════
    if (data.status === "success" && data.analysis) {
      console.log("[aiService] 🎉 Analyse CV réussie!");
      return data.analysis;
    }
    
    throw new Error(data.message || "Erreur analyse CV - Réponse invalide du backend");

  } catch (error: any) {
    // ═══════════════════════════════════════════════════════════════════════
    // GESTION ERREURS GLOBALES
    // ═══════════════════════════════════════════════════════════════════════
    console.error("[aiService] 💥 Erreur critique:", {
      name: error.name,
      message: error.message,
      stack: error.stack
    });

    // Gestion spécifique des erreurs d'annulation
    if (error.name === 'AbortError') {
      throw new Error("Analyse annulée par l'utilisateur");
    }

    // Erreurs réseau
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error(`Impossible de joindre le backend (${backendUrl}). Vérifiez que le Space Hugging Face est 'Running'.`);
    }

    // Propagation de l'erreur originale
    throw error;
  }
};

/**
 * Fonction placeholder pour scoreAndCategorizeJob
 * RAISON: Compatibilité avec les imports existants, mais non utilisée
 * Le scoring des jobs se fait via un autre endpoint (non géré par ce service)
 */
export const scoreAndCategorizeJob = async () => {
  console.warn("[aiService] ⚠️ scoreAndCategorizeJob appelé (placeholder uniquement)");
  return { score: 0 };
};
