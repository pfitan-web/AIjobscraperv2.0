// services/geminiService.ts
export const extractCriteriaFromCV = async (base64Data: string, mimeType: string): Promise<string> => {
    throw new Error("Utilisez le backend Python via aiService");
};

export const scoreAndCategorizeJob = async (job: any, criteria: string): Promise<any> => {
    return { score: 0, category: "À Étudier", reasoning: "Analyse via backend requise" };
};
