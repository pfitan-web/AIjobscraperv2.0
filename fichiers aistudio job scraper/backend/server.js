
const express = require('express');
const cors = require('cors');
const { performPuppeteerScraping, scrapeUniversalUrl, stopScraping } = require('./scraper');

const app = express();
const PORT = process.env.PORT || 3001;

// Configuration CORS Optimisée pour le local et Ngrok
const corsOptions = {
    origin: true, // Autorise toutes les origines (pratique pour le dev local/vercel)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type', 'Authorization', 'ngrok-skip-browser-warning',
        'X-Requested-With', 'Accept', 'Origin', 'Cache-Control', 'Pragma', 'Expires'
    ],
    credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '50mb' }));

// Middleware de log léger
app.use((req, res, next) => {
  if (req.url !== '/') { // On ne log pas le healthcheck incessant
      console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  }
  next();
});

// Augmentation du timeout à 5 minutes pour le scraping intensif
app.use((req, res, next) => {
    res.setTimeout(300000, () => {
        console.log('⚠️ Request has timed out.');
        res.status(408).send('Request has timed out');
    });
    next();
});

// Route de santé (utilisée par le frontend pour tester la connexion)
app.get('/', (req, res) => {
    res.json({ 
        success: true,
        status: 'ok', 
        message: 'AI Job Scraper Backend is running! 🚀',
        version: '2.1.0'
    });
});

app.post('/api/puppeteer-scrape', async (req, res) => {
  const startTime = Date.now();
  try {
    console.log('[API] 🟢 Démarrage du scraping...');
    
    // Extraction de TOUS les paramètres envoyés par le frontend
    const { 
        source, keywords, location, maxPages, radius, 
        contractType, remote, minSalary, maxSalary,
        sector, jobFunction, publishedDate, salaryType 
    } = req.body;

    const jobs = await performPuppeteerScraping(
        source, keywords, location, maxPages, 
        radius, contractType, remote, minSalary, maxSalary,
        sector, jobFunction, 
        publishedDate, salaryType
    );
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[API] 🏁 Scraping terminé en ${duration}s. ${jobs.length} offres trouvées.`);
    res.json({ success: true, jobs, count: jobs.length });
  } catch (error) {
    console.error('[API] 🔴 Erreur scraping:', error.message);
    // Si c'est une erreur due à l'arrêt manuel, on renvoie quand même un succès partiel ou vide
    res.status(500).json({ success: false, error: error.message, stack: error.stack });
  }
});

app.post('/api/stop-scraping', async (req, res) => {
    try {
        console.log('[API] 🛑 Demande d\'arrêt du scraping...');
        const stopped = await stopScraping();
        res.json({ success: true, message: stopped ? "Navigateur fermé avec succès." : "Aucun processus actif trouvé." });
    } catch (error) {
        console.error('[API] Erreur stop:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/universal-scrape', async (req, res) => {
    try {
        const { url } = req.body;
        console.log('[API] 🌍 Universal scrape pour:', url);
        if (!url) throw new Error("URL manquante");

        const result = await scrapeUniversalUrl(url);
        res.json(result);
    } catch (error) {
        console.error('[API] 🔴 Erreur universal-scrape:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Placeholder pour l'analyse CV locale (Ollama)
app.post('/api/analyze-cv', (req, res) => {
    const { cvText } = req.body;
    res.json({ criteria: "Mode 'Gemini Cloud' actif. L'analyse locale Ollama n'est pas activée sur ce serveur." });
});

// Placeholder pour le scoring local (Ollama)
app.post('/api/score-job', (req, res) => {
    res.json({ 
        fallback: true,
        score: 50, 
        category: 'À Étudier', 
        reasoning: "Le backend local Ollama n'est pas connecté. Veuillez utiliser Gemini dans les paramètres du frontend.",
        keyHighlights: ["Backend OK", "Scraping OK", "IA Cloud requise"]
    });
});

app.listen(PORT, () => console.log(`\n🚀 Backend prêt sur http://localhost:${PORT}\n`));
