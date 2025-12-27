
export enum JobCategory {
  NEW = 'Nouvelles Offres',
  MATCH = 'Correspond',
  REVIEW = 'À Étudier',
  APPLIED = 'Déjà Postulé',
  REJECTED = 'Refusé',
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
  keyHighlights?: string[];
  // Nouveaux champs visuels
  logoUrl?: string;
  isEasyApply?: boolean;
}

export type AIProvider = 'gemini' | 'ollama';

export interface CvFile {
  name: string;
  type: string;
  data: string; // Base64 complet (data:application/pdf;base64,...)
  extractedCriteria: string; // Texte extrait par l'IA
}

export interface Settings {
  sources: string[];
  allCustomUrls: string[];
  schedule: 'daily' | 'weekly' | 'manual';
  criteria: string; // Résumé textuel des critères
  cvFile?: CvFile; // Le fichier CV stocké
  chromeProfilePath?: string;
  
  // AI Configuration
  aiProvider: AIProvider;
  backendUrl: string;

  // Critères de filtrage par défaut (synchronisés avec le formulaire)
  jobKeywords?: string;
  jobTitleFilter?: string;
  locationFilter?: string;
  locationRadius?: '5km' | '10km' | '20km' | '50km' | '100km' | 'any';
  contractTypeFilter?: 'CDI' | 'CDD' | 'Alternance' | 'Stage' | 'Freelance' | 'any';
  minSalary?: number;
  maxSalary?: number;
  remotePreference?: 'full' | 'hybrid' | 'on-site' | 'any';
  professionalDomain?: string;
}

// Configuration complète du Scraper (utilisée dans App.tsx)
export interface PuppeteerScraperConfig {
  source: 'indeed' | 'hellowork' | 'jobijoba' | 'googlejobs' | 'francetravail' | 'linkedin' | 'full' | string; // string pour URLs perso
  keywords: string;
  location: string;
  maxPages: number;
  radius: number | 'any'; 
  contractType: string;
  remote: string;
  minSalary: string;
  maxSalary: string; 
  sector: string;
  jobFunction: string;
  // Nouveaux filtres
  publishedDate: 'any' | '24h' | '3d' | '7d' | '14d' | '30d';
  salaryType: 'any' | 'brut_year' | 'brut_month' | 'net_year' | 'net_month'; 
}

export type ScrapingCriteria = Pick<Settings, 
  'jobKeywords' | 'jobTitleFilter' | 'locationFilter' | 'locationRadius' | 
  'contractTypeFilter' | 'minSalary' | 'maxSalary' | 'remotePreference' | 
  'professionalDomain'
>;
