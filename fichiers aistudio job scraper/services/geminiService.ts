import { GoogleGenAI, Type } from "@google/genai";
import { JobOffer, JobCategory } from '../types';

if (!process.env.API_KEY) {
  // This is a placeholder check. In a real environment, the key is expected to be set.
  console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    score: {
      type: Type.INTEGER,
      description: "Un score de 0 à 100 indiquant la pertinence de l'offre par rapport aux critères. 100 est une correspondance parfaite.",
    },
    category: {
      type: Type.STRING,
      enum: Object.values(JobCategory),
      description: `La meilleure catégorie pour cette offre. Utiliser '${JobCategory.MATCH}' si le score est > 80. Utiliser '${JobCategory.REVIEW}' si le score est entre 60 et 80. Utiliser '${JobCategory.REJECTED}' si le score est < 60.`
    },
    reasoning: {
      type: Type.STRING,
      description: "Une brève explication (1-2 phrases) de la raison du score et de la catégorisation, en soulignant les points clés correspondants ou manquants.",
    },
    contractType: { 
      type: Type.STRING,
      description: "Le type de contrat (ex: CDI, CDD, Alternance, Stage) extrait de la description de l'offre. Laisser vide si non trouvé.",
      nullable: true,
    },
    salaryRange: { 
      type: Type.STRING,
      description: "La fourchette salariale (ex: 35k-45k€, Selon expérience) extraite de la description de l'offre. Laisser vide si non trouvé.",
      nullable: true,
    },
    keyHighlights: { 
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
      description: "Une liste de 3 à 5 points clés concis et pertinents de l'offre d'emploi qui correspondent aux critères de l'utilisateur ou sont importants pour le poste.",
      nullable: true,
    },
  },
  required: ['score', 'category', 'reasoning'],
};

interface GeminiResponse {
  score: number;
  category: JobCategory;
  reasoning: string;
  contractType?: string;
  salaryRange?: string;
  keyHighlights?: string[];
}

export const scoreAndCategorizeJob = async (
    job: JobOffer, 
    criteria: string,
    signal?: AbortSignal
): Promise<GeminiResponse> => {
  
  if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
  }

  const prompt = `
    Based on the following user criteria, analyze the job offer and provide a structured JSON response.
    Specifically, extract the contract type, salary range, a list of key highlights, and then score and categorize the job.

    USER CRITERIA:
    ---
    ${criteria}
    ---

    JOB OFFER:
    ---
    Title: ${job.title}
    Company: ${job.company}
    Location: ${job.location}
    Description:
    ${job.description}
    ---

    Instructions:
    1. **score**: Assign a score from 0 to 100 indicating the job's relevance to the user's criteria.
    2. **category**: Categorize based on the score: 'Correspond' (>80), 'À Étudier' (60-80), 'Refusé' (<60).
    3. **reasoning**: Provide a 1-2 sentence explanation for the score and category, highlighting alignment or discrepancies with user criteria.
    4. **contractType**: Extract the contract type (e.g., CDI, CDD, Alternance, Stage) from the job description. If not explicitly mentioned, leave empty.
    5. **salaryRange**: Extract the salary range (e.g., "35k-45k€", "Selon expérience", "Competitive") from the job description. If not explicitly mentioned or clearly inferable, leave empty.
    6. **keyHighlights**: Identify 3 to 5 concise and pertinent points from the job description that either directly match the user's criteria or represent crucial aspects of the role. Present these as a list of short strings. If less than 3 relevant points are found, provide fewer.
  `;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: responseSchema,
            temperature: 0.5, 
        },
    });
    
    if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
    }

    let jsonText = response.text.trim();
    // Gemini sometimes wraps JSON in markdown blocks. Remove them.
    if (jsonText.startsWith("```json") && jsonText.endsWith("```")) {
        jsonText = jsonText.substring(7, jsonText.length - 3).trim();
    }
    const parsedResponse: GeminiResponse = JSON.parse(jsonText);
    
    // Validate category based on score rules
    if (parsedResponse.score > 80 && parsedResponse.category !== JobCategory.MATCH) {
        parsedResponse.category = JobCategory.MATCH;
    } else if (parsedResponse.score >= 60 && parsedResponse.score <= 80 && parsedResponse.category !== JobCategory.REVIEW) {
        parsedResponse.category = JobCategory.REVIEW;
    } else if (parsedResponse.score < 60 && parsedResponse.category !== JobCategory.REJECTED) {
        parsedResponse.category = JobCategory.REJECTED;
    }

    return parsedResponse;
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error;
    
    console.error("Error calling Gemini API:", error);
    // Fallback in case of AI error, return basic categorization with error message
    return {
      score: 0,
      category: JobCategory.REVIEW, // Fallback to REVIEW as a safer default category for review
      reasoning: "L'analyse IA a échoué. " + (error instanceof Error ? error.message : String(error)),
      contractType: undefined,
      salaryRange: undefined,
      keyHighlights: [],
    };
  }
};

/**
 * Extracts a professional profile and job search criteria from a CV file (PDF or Image).
 */
export const extractCriteriaFromCV = async (
    base64Data: string, 
    mimeType: string,
    signal?: AbortSignal
): Promise<string> => {
    
    if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const prompt = `
        Tu es un expert en recrutement. Analyse ce CV (Resume) et extrais-en un profil détaillé pour une recherche d'emploi.
        Rédige un paragraphe à la première personne ("Je suis un...") en Français.
        
        Inclus :
        1. Le titre actuel ou visé.
        2. Le nombre d'années d'expérience et le niveau de séniorité.
        3. Les compétences techniques (Hard Skills) principales.
        4. Les préférences implicites (secteur, type de missions).
        5. Ce qu'il faut éviter (technologies obsolètes mentionnées mais anciennes, etc.).
        
        Le but est d'utiliser ce texte comme "Critères de recherche" pour une IA qui va scorer des offres d'emploi.
        Sois précis, concis et direct.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { data: base64Data, mimeType } },
                    { text: prompt }
                ]
            },
        });
        
        if (signal?.aborted) {
            throw new DOMException('Aborted', 'AbortError');
        }

        return response.text || "Impossible d'extraire le contenu du CV.";
    } catch (error: any) {
        if (error.name === 'AbortError') throw error;

        console.error("Error extracting criteria from CV:", error);
        // Detection robuste de l'erreur 429 (Quota exceeded) dans la structure d'erreur JSON ou Message
        const errorString = JSON.stringify(error);
        if (
            error.status === 429 || 
            error.code === 429 || 
            (error.message && (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED'))) ||
            (errorString && errorString.includes('RESOURCE_EXHAUSTED'))
        ) {
             throw new Error("QUOTA_EXCEEDED");
        }
        throw new Error("Erreur technique lors de l'analyse du CV.");
    }
};