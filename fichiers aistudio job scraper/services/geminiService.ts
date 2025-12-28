// ═══════════════════════════════════════════════════════════════════════════
// GEMINI SERVICE - DÉSACTIVÉ POUR ARCHITECTURE BACKEND
// ═══════════════════════════════════════════════════════════════════════════
// VERSION: 2.0 (Backend Python sur Hugging Face)
// 
// RAISON ARCHITECTURALE:
// Ce fichier était utilisé dans la version 1.0 pour appeler Gemini directement
// depuis le frontend. Cela exposait la clé API Gemini côté client (FAILLE SÉCURITÉ).
//
// Dans la version 2.0, TOUTES les opérations IA passent par le backend Python:
// - Frontend → Backend Python → Gemini API
// - La clé API est sécurisée dans les secrets Hugging Face Space
//
// Ce fichier est conservé uniquement pour éviter les erreurs d'import dans
// d'autres parties du code qui n'ont pas encore été refactorisées.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fonction stub pour extractCriteriaFromCV
 * Ne doit JAMAIS être appelée dans la version 2.0
 * Si appelée, lance une erreur explicite
 */
export const extractCriteriaFromCV = async () => { 
    throw new Error(
        "❌ extractCriteriaFromCV appelé depuis geminiService.ts (désactivé). " +
        "Utilisez services/aiService.ts qui redirige vers le backend Python."
    ); 
};

/**
 * Fonction stub pour scoreAndCategorizeJob
 * Ne doit JAMAIS être appelée dans la version 2.0
 */
export const scoreAndCategorizeJob = async () => {
    console.warn("⚠️ scoreAndCategorizeJob appelé depuis geminiService.ts (désactivé)");
    return { 
        score: 0, 
        category: "À Étudier", 
        reasoning: "Service désactivé - Utiliser backend Python" 
    };
};

// ═══════════════════════════════════════════════════════════════════════════
// NOTE POUR LES DÉVELOPPEURS:
// Si vous voyez cette erreur dans la console, cela signifie qu'un composant
// tente encore d'importer depuis geminiService.ts au lieu de aiService.ts
// 
// MIGRATION:
// Ancien: import { extractCriteriaFromCV } from './services/geminiService'
// Nouveau: import { extractCriteriaFromCV } from './services/aiService'
// ═══════════════════════════════════════════════════════════════════════════
