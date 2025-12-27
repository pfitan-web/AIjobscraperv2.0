
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');

// Activation du mode furtif
puppeteer.use(StealthPlugin());

let activeBrowser = null;

const SERPAPI_KEY = process.env.SERPAPI_KEY;
const FT_CLIENT_ID = process.env.FT_CLIENT_ID;
const FT_CLIENT_SECRET = process.env.FT_CLIENT_SECRET;

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
];

const getRandomUserAgent = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

const getChromePath = () => {
    if (process.env.CHROME_EXECUTABLE_PATH) return process.env.CHROME_EXECUTABLE_PATH;
    const paths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'
    ];
    for (const p of paths) { if (fs.existsSync(p)) return p; }
    return null; 
};
const CHROME_EXECUTABLE_PATH = getChromePath();

const randomDelay = (min, max) => new Promise(res => setTimeout(res, Math.floor(Math.random() * (max - min + 1)) + min));

const autoScroll = async (page) => {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 150;
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;
                if (totalHeight >= scrollHeight - window.innerHeight - 100) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
};

const buildQuery = (keywords, sector, jobFunction) => {
    return keywords ? keywords.trim() : `${sector || ''} ${jobFunction || ''}`.trim();
};

const safeScrape = async (sourceName, promise) => {
    try {
        console.log(`[${sourceName}] 🚀 Démarrage...`);
        const results = await promise;
        console.log(`[${sourceName}] ✅ Terminé : ${results.length} offres.`);
        return results;
    } catch (error) {
        console.error(`[${sourceName}] ⚠️ Erreur (Skipped):`, error.message);
        return [];
    }
};

const stopScraping = async () => {
    if (activeBrowser) {
        try { await activeBrowser.close(); } catch(e) {}
        activeBrowser = null;
        return true;
    }
    return false;
};

// --- LINKEDIN (API GUEST PUBLIC) ---
const scrapeLinkedIn = async (query, location, maxPages, dateFilter) => {
    let allJobs = [];
    const jobsPerPage = 25;
    
    // Mapping dateFilter pour LinkedIn f_TPR (Time Posted Range)
    // r86400 (24h), r259200 (3d), r604800 (7d), r2592000 (30d)
    let f_TPR = "";
    if (dateFilter === '24h') f_TPR = "r86400";
    else if (dateFilter === '3d') f_TPR = "r259200";
    else if (dateFilter === '7d') f_TPR = "r604800";
    else if (dateFilter === '30d') f_TPR = "r2592000";

    for (let i = 0; i < maxPages; i++) {
        const start = i * jobsPerPage;
        const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search/?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(location || 'France')}&start=${start}${f_TPR ? '&f_TPR=' + f_TPR : ''}&_l=fr_FR`;
        
        console.log(`[LinkedIn Guest] Fetching page ${i+1}: ${url}`);
        
        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': getRandomUserAgent(),
                    'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
                    'Referer': 'https://www.linkedin.com/jobs/search'
                },
                timeout: 15000
            });

            const $ = cheerio.load(response.data);
            const cards = $('li');
            
            if (cards.length === 0) break;

            cards.each((_, el) => {
                const titleEl = $(el).find('.base-search-card__title');
                const companyEl = $(el).find('.base-search-card__subtitle');
                const locEl = $(el).find('.job-search-card__location');
                const linkEl = $(el).find('a.base-card__full-link');
                const imgEl = $(el).find('img.artdeco-entity-lockup__image');
                const timeEl = $(el).find('time');

                if (titleEl.text() && linkEl.attr('href')) {
                    allJobs.push({
                        id: `lin-${Math.random().toString(36).substr(2, 9)}`,
                        title: titleEl.text().trim(),
                        company: companyEl.text().trim(),
                        location: locEl.text().trim(),
                        url: linkEl.attr('href').split('?')[0],
                        source: 'LinkedIn',
                        category: 'Nouvelles Offres',
                        logoUrl: imgEl.attr('data-delayed-url') || imgEl.attr('src'),
                        description: `Posté le : ${timeEl.text().trim() || 'Récemment'}`,
                        isEasyApply: false
                    });
                }
            });

            await randomDelay(1000, 2000); // Politesse
        } catch (e) {
            console.error(`[LinkedIn Guest] Erreur page ${i+1}:`, e.message);
            break; 
        }
    }
    return allJobs;
};

// --- HELLOWORK (OPTIMISÉ) ---
const scrapeHelloWork = async (browser, query, location, maxPages, dateFilter, radius) => {
    const page = await browser.newPage();
    await page.setUserAgent(getRandomUserAgent());

    let d = 'all';
    if (dateFilter === '24h') d = '24h';
    else if (dateFilter === '3d') d = '3j';
    else if (dateFilter === '7d') d = '7j';
    
    let searchUrl = `https://www.hellowork.com/fr-fr/emploi/recherche.html?k=${encodeURIComponent(query)}&l=${encodeURIComponent(location || 'France')}&d=${d}`;
    if (radius !== 'any' && radius !== undefined) searchUrl += `&r=${radius}`;

    try {
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        const btn = await page.$('#onetrust-accept-btn-handler');
        if (btn) await btn.click();
    } catch (e) {}

    let allJobs = [];
    for (let i = 0; i < maxPages; i++) {
        await autoScroll(page);
        const jobsOnPage = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('li[data-id]')).map(card => {
                const titleEl = card.querySelector('h3');
                const linkEl = card.querySelector('a');
                const companyEl = card.querySelector('[data-cy="companyName"]');
                const locEl = card.querySelector('[data-cy="localization"]');
                const tags = Array.from(card.querySelectorAll('.tag'));
                const imgEl = card.querySelector('img');
                
                return {
                    id: `hw-${card.getAttribute('data-id') || Math.random()}`,
                    title: titleEl?.innerText.trim(),
                    company: companyEl?.innerText.trim() || 'Confidentiel',
                    location: locEl?.innerText.trim(),
                    url: linkEl?.href,
                    source: 'Hellowork',
                    salary: tags.find(t => t.innerText.includes('€'))?.innerText || '',
                    contractType: tags.find(t => t.innerText.length < 15 && !t.innerText.includes('€'))?.innerText || '',
                    logoUrl: imgEl?.src,
                    isEasyApply: true
                };
            }).filter(j => j.title && j.url);
        });

        allJobs = [...allJobs, ...jobsOnPage];
        if (i < maxPages - 1) {
            const next = await page.$('nav[aria-label="Pagination"] a:last-child');
            if (!next) break;
            await next.click();
            await randomDelay(2000, 4000);
        }
    }
    await page.close();
    return allJobs;
};

// --- JOBIJOBA (OPTIMISÉ) ---
const scrapeJobijoba = async (browser, query, location, maxPages) => {
    const page = await browser.newPage();
    await page.setUserAgent(getRandomUserAgent());
    const searchUrl = `https://www.jobijoba.com/fr/emploi?what=${encodeURIComponent(query)}&where=${encodeURIComponent(location || 'France')}`;
    
    try { await page.goto(searchUrl, { waitUntil: 'domcontentloaded' }); } catch(e) {}

    let allJobs = [];
    for (let i = 0; i < maxPages; i++) {
        await autoScroll(page);
        const jobsOnPage = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('article.offer')).map(el => {
                const titleEl = el.querySelector('h3 a');
                const companyEl = el.querySelector('.compagny');
                const locEl = el.querySelector('.place');
                const imgEl = el.querySelector('img.logo');
                return {
                    id: `jj-${Math.random().toString(36).substr(2, 9)}`,
                    title: titleEl?.innerText.trim(),
                    company: companyEl?.innerText.trim() || 'Inconnu',
                    location: locEl?.innerText.trim() || 'France',
                    url: titleEl?.href,
                    source: 'Jobijoba',
                    logoUrl: imgEl?.src,
                    isEasyApply: false
                };
            }).filter(j => j.title && j.url);
        });
        allJobs = [...allJobs, ...jobsOnPage];
        if (i < maxPages - 1) {
            const next = await page.$('.pagination .next a');
            if(!next) break;
            await next.click();
            await randomDelay(2000, 3000);
        }
    }
    await page.close();
    return allJobs;
};

const scrapeGoogleJobs = async (query, location) => {
    if (!SERPAPI_KEY) return [];
    try {
        const response = await axios.get('https://serpapi.com/search.json', {
            params: { engine: 'google_jobs', q: query, location: location || 'France', api_key: SERPAPI_KEY, hl: 'fr', gl: 'fr', num: 20 }
        });
        return (response.data.jobs_results || []).map(j => ({
            id: `goo-${j.job_id}`, title: j.title, company: j.company_name, location: j.location,
            url: j.related_links?.[0]?.link || j.share_link, description: j.description,
            source: 'Google Jobs', salary: j.detected_extensions?.salary || '', logoUrl: j.thumbnail, isEasyApply: false
        }));
    } catch (e) { return []; }
};

const scrapeFranceTravail = async (query, location, minSalary) => {
    if (!FT_CLIENT_ID || !FT_CLIENT_SECRET) return [];
    try {
        const authRes = await axios.post('https://entreprise.pole-emploi.fr/connexion/oauth2/access_token?realm=/partenaire', 
            new URLSearchParams({ grant_type: 'client_credentials', client_id: FT_CLIENT_ID, client_secret: FT_CLIENT_SECRET, scope: 'api_offresdemploiv2 o2dsoffre' }), 
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        const token = authRes.data.access_token;
        const params = { motsCles: query, range: '0-99' };
        if (minSalary) params.salaireMin = minSalary;
        const searchRes = await axios.get('https://api.pole-emploi.io/partenaire/offresdemploi/v2/offres/search', {
            headers: { 'Authorization': `Bearer ${token}` }, params
        });
        return (searchRes.data.resultats || []).map(j => ({
            id: `ft-${j.id}`, title: j.intitule, company: j.entreprise?.nom || 'Confidentiel',
            location: j.lieuTravail?.libelle, url: j.origineOffre?.urlOrigine || '#',
            description: j.description, source: 'France Travail', salary: j.salaire?.libelle || '',
            contractType: j.typeContratLibelle, logoUrl: j.entreprise?.logo || null, isEasyApply: true
        }));
    } catch (e) { return []; }
};

// --- ORCHESTRATEUR ---
const performPuppeteerScraping = async (
    source, keywords, location, maxPages, radius, 
    contractType, remote, minSalary, maxSalary,
    sector, jobFunction, publishedDate, salaryType
) => {
    const query = buildQuery(keywords || 'Emploi', sector, jobFunction);
    let results = [];
    let browser = null;
    const needsBrowser = ['indeed', 'full', 'hellowork', 'jobijoba'].includes(source);

    try {
        if (needsBrowser) {
             const launchOptions = {
                headless: "new",
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized']
            };
            if (CHROME_EXECUTABLE_PATH) launchOptions.executablePath = CHROME_EXECUTABLE_PATH;
            browser = await puppeteer.launch(launchOptions);
            activeBrowser = browser;
        }

        if (source === 'linkedin') {
            results = await safeScrape('LinkedIn Guest', scrapeLinkedIn(query, location, maxPages, publishedDate));
        } else if (source === 'indeed') {
            const { scrapeIndeed } = require('./scrapers/indeed'); // Supposant separation si besoin ou interne
            results = await scrapeIndeed(browser, query, location, maxPages, publishedDate, radius);
        } else if (source === 'hellowork') {
            results = await scrapeHelloWork(browser, query, location, maxPages, publishedDate, radius);
        } else if (source === 'jobijoba') {
            results = await scrapeJobijoba(browser, query, location, maxPages);
        } else if (source === 'googlejobs') {
            results = await safeScrape('GoogleJobs', scrapeGoogleJobs(query, location));
        } else if (source === 'francetravail') {
            results = await safeScrape('FranceTravail', scrapeFranceTravail(query, location, minSalary));
        } else if (source === 'full') {
            const apiResults = await Promise.all([
                safeScrape('FranceTravail', scrapeFranceTravail(query, location, minSalary)),
                safeScrape('GoogleJobs', scrapeGoogleJobs(query, location)),
                safeScrape('LinkedIn', scrapeLinkedIn(query, location, 1, publishedDate))
            ]);
            const hwResults = await safeScrape('Hellowork', scrapeHelloWork(browser, query, location, 1, publishedDate, radius));
            const jjResults = await safeScrape('Jobijoba', scrapeJobijoba(browser, query, location, 1));
            results = [...apiResults.flat(), ...hwResults, ...jjResults];
        }

    } catch (error) {
        console.error("Scraping Error:", error);
        throw error;
    } finally {
        if (browser && activeBrowser === browser) {
            await browser.close();
            activeBrowser = null;
        }
    }
    return results;
};

const scrapeUniversalUrl = async (url) => {
    let browser;
    try {
        browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        const title = await page.title();
        const content = await page.evaluate(() => document.body.innerText.substring(0, 15000));
        return { title, content };
    } finally { if (browser) await browser.close(); }
};

module.exports = { performPuppeteerScraping, scrapeUniversalUrl, stopScraping };
