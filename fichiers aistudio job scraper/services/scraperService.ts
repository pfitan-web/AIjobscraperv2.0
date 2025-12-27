import { JobOffer, Settings, ScrapingCriteria } from '../types';

/**
 * Appelle le service backend pour lancer le scraping des offres d'emploi.
 * @param sources - Un tableau d'URLs ou de noms de sites à scraper.
 * @param chromeProfilePath - Le chemin d'accès au profil du navigateur pour le scraping authentifié.
 * @param criteria - Les critères de filtrage pour le scraping.
 * @param backendBaseUrl - L'URL de base du serveur backend.
 * @param signal - Signal d'annulation optionnel.
 * @returns Une promesse qui se résout avec un tableau d'offres d'emploi.
 */
export const scrapeJobs = async (
  sources: string[], 
  chromeProfilePath?: string, 
  criteria?: ScrapingCriteria, 
  backendBaseUrl: string = 'http://localhost:3001',
  signal?: AbortSignal
): Promise<JobOffer[]> => {
  const scrapeEndpoint = `${backendBaseUrl}/api/scrape`;
  console.log(`Sending scraping request to backend: ${scrapeEndpoint}`);
  
  try {
    const response = await fetch(scrapeEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Ce header est crucial pour éviter la page d'interstice de ngrok sur les comptes gratuits
        'ngrok-skip-browser-warning': 'true', 
      },
      body: JSON.stringify({
        sources,
        chromeProfilePath,
        criteria,
      }),
      signal, // Pass abort signal
    });

    if (!response.ok) {
      // Tente de lire le message d'erreur du backend s'il y en a un
      const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred on the server.' }));
      throw new Error(`Erreur du backend: ${response.status} ${response.statusText} - ${errorData.message}`);
    }

    const scrapedJobs: JobOffer[] = await response.json();
    console.log(`Received ${scrapedJobs.length} jobs from backend.`);
    return scrapedJobs;

  } catch (error) {
    if ((error as Error).name === 'AbortError') {
        console.log("Scraping fetch aborted.");
        throw error; // Re-throw to be caught in App.tsx
    }
    console.error('Failed to fetch from backend:', error);
    throw error;
  }
};