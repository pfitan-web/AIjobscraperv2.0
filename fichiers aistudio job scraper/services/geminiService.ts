// Ce fichier est désactivé pour forcer le passage par le backend Python
export const extractCriteriaFromCV = async () => { 
    throw new Error("Action redirigée vers le backend."); 
};
export const scoreAndCategorizeJob = async () => {
    return { score: 0, category: "À Étudier", reasoning: "Analyse via backend" };
};
