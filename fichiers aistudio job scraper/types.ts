export enum JobCategory {
  NEW = 'Nouvelles Offres',
  MATCH = 'Correspond',
  REVIEW = 'À Étudier',
  APPLIED = 'Déjà Postulé',
  REJECTED = 'Refusé',
}

export interface CvFile {
  name: string;
  type: string;
  data: string; // Base64
  extractedCriteria: string; // Analyse texte
}

export interface Settings {
  sources: string[];
  allCustomUrls: string[];
  criteria: string;
  cvFile?: CvFile;
  aiProvider: 'gemini' | 'groq';
  aiModel: string;
  backendUrl: string;
  // Optionnels selon tes besoins scraper
  chromeProfilePath?: string;
  jobKeywords?: string;
}

export interface JobOffer {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
  source: string;
  score?: number;
  reasoning?: string;
  category: JobCategory;
  contractType?: string;
  salaryRange?: string;
}
