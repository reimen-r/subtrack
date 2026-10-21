import { SubscriptionCategory } from '../types';

interface CategoryRule {
  category: SubscriptionCategory;
  keywords: string[];
}

/**
 * Keyword database ordered with specific priority.
 * Multi-word phrases take precedence over broad generic terms.
 */
const CATEGORY_RULES: CategoryRule[] = [
  // 1. Cloud & Storage
  {
    category: 'Cloud',
    keywords: [
      'icloud',
      'google drive',
      'onedrive',
      'dropbox',
      'pcloud',
      'box.com',
      'backblaze',
      'wasabi',
      'mega.nz',
      'mega cloud',
      'aws',
      'amazon s3',
      'amazon web services',
      'azure',
      'google cloud',
      'gcp',
      'digitalocean',
      'linode',
      'vultr',
      'cloudflare',
      'hetzner',
      'ovh',
      'supabase',
      'firebase',
      'railway',
      'render.com',
      'fly.io',
      'vercel',
      'hostinger',
      'siteground',
      'namecheap',
      'godaddy',
      'cloud storage',
      'almacenamiento',
      'cloud backup',
      'backup cloud',
      'nube',
      'cloud',
      'hosting',
      'vps',
      'server',
    ],
  },

  // 2. Music & Audio (checked before general Entertainment for Apple Music, YouTube Music, etc.)
  {
    category: 'Music & Audio',
    keywords: [
      'spotify',
      'apple music',
      'youtube music',
      'amazon music',
      'tidal',
      'deezer',
      'soundcloud',
      'audible',
      'shazam',
      'pandora',
      'qobuz',
      'bandcamp',
      'tunein',
      'audiobook',
      'audiolibro',
      'podcast',
      'musica',
      'music',
      'audio',
      'radio',
    ],
  },

  // 3. Entertainment & Video Streaming
  {
    category: 'Entertainment',
    keywords: [
      'netflix',
      'disney+',
      'disney plus',
      'disney',
      'hbo max',
      'max.com',
      'hbo',
      'prime video',
      'amazon prime',
      'hulu',
      'paramount+',
      'paramount plus',
      'paramount',
      'peacock',
      'crunchyroll',
      'youtube premium',
      'youtube tv',
      'apple tv',
      'apple tv+',
      'mubi',
      'plex pass',
      'plex',
      'twitch',
      'dazn',
      'espn+',
      'espn',
      'star+',
      'star plus',
      'rakuten tv',
      'viki',
      'streaming',
      'stream',
      'cinema',
      'cine',
      'pelicula',
      'peliculas',
      'movies',
      'movie',
      'series',
      'anime',
      'tv',
    ],
  },

  // 4. Productivity
  {
    category: 'Productivity',
    keywords: [
      'notion',
      'trello',
      'asana',
      'jira',
      'clickup',
      'slack',
      'zoom',
      'microsoft teams',
      'teams',
      'todoist',
      'linear.app',
      'linear',
      'obsidian',
      'evernote',
      'monday.com',
      'monday',
      'loom',
      'coda.io',
      'coda',
      'basecamp',
      'airtable',
      'craft docs',
      'craft.do',
      'roam research',
      'things 3',
      'omnifocus',
      'ticktick',
      'fantastical',
      'microsoft 365',
      'office 365',
      'google workspace',
      'gsuite',
      'calendly',
      'miro',
      'lucidchart',
      'whimsical',
      'productivity',
      'productividad',
      'workspace',
      'office',
    ],
  },

  // 5. Software & Development & AI
  {
    category: 'Software',
    keywords: [
      'chatgpt',
      'openai',
      'claude',
      'anthropic',
      'github copilot',
      'github',
      'gitlab',
      'bitbucket',
      'adobe creative cloud',
      'adobe',
      'photoshop',
      'illustrator',
      'premiere pro',
      'after effects',
      'figma',
      'canva pro',
      'canva',
      'jetbrains',
      'cursor.sh',
      'cursor ide',
      'replit',
      'midjourney',
      'docker',
      'postman',
      'sentry',
      'datadog',
      'webflow',
      'framer',
      'sketch',
      'intellij',
      'pycharm',
      'webstorm',
      'sublime text',
      'grammarly',
      'deepl pro',
      'deepl',
      'software',
      'developer',
      'saas',
      'code',
      'api',
      'ia',
      'ai',
    ],
  },

  // 6. Gaming
  {
    category: 'Gaming',
    keywords: [
      'playstation plus',
      'playstation',
      'ps plus',
      'psn',
      'xbox game pass',
      'game pass',
      'xbox live',
      'xbox',
      'nintendo switch online',
      'nintendo',
      'steam',
      'epic games',
      'ubisoft+',
      'ubisoft',
      'ea play',
      'geforce now',
      'roblox premium',
      'roblox',
      'discord nitro',
      'nitro',
      'blizzard',
      'battlenet',
      'videogame',
      'videojuegos',
      'juegos',
      'gaming',
      'game',
      'arcade',
    ],
  },

  // 7. Health & Gym
  {
    category: 'Health & Gym',
    keywords: [
      'gym',
      'gimnasio',
      'strava',
      'fitbit',
      'whoop',
      'myfitnesspal',
      'peloton',
      'headspace',
      'calm app',
      'calm',
      'apple fitness+',
      'apple fitness',
      'fitness',
      'crossfit',
      'smart fit',
      'yoga',
      'workout',
      'entrenamiento',
      'salud',
      'health',
      'meditation',
      'meditacion',
      'sleep cycle',
      'macrofactor',
      'noom',
    ],
  },

  // 8. Finance & Investment
  {
    category: 'Finance',
    keywords: [
      'tradingview',
      'revolut',
      'bloomberg',
      'seeking alpha',
      'coinbase',
      'binance',
      'crypto',
      'robinhood',
      'etoro',
      'ynab',
      'you need a budget',
      'monarch money',
      'fintonic',
      'quickbooks',
      'xero',
      'sage',
      'patreon',
      'substack',
      'bank',
      'banco',
      'fintech',
      'finance',
      'finanzas',
      'inversion',
      'investing',
      'money',
    ],
  },

  // 9. Education
  {
    category: 'Education',
    keywords: [
      'duolingo',
      'coursera',
      'udemy',
      'edx',
      'skillshare',
      'masterclass',
      'platzi',
      'codecademy',
      'datacamp',
      'babbel',
      'busuu',
      'lingoda',
      'chegg',
      'brilliant.org',
      'brilliant',
      'quizlet',
      'aprender',
      'curso',
      'clases',
      'school',
      'universidad',
      'education',
      'educacion',
      'learn',
    ],
  },

  // 10. Utilities & Security & Connectivity
  {
    category: 'Utilities',
    keywords: [
      'nordvpn',
      'expressvpn',
      'surfshark',
      'protonvpn',
      'proton mail',
      'proton',
      'vpn',
      '1password',
      'bitwarden',
      'lastpass',
      'dashlane',
      'cleanmymac',
      'antivirus',
      'kaspersky',
      'mcafee',
      'bitdefender',
      'malwarebytes',
      'internet',
      'fibra',
      'fiber',
      'telefonia',
      'vodafone',
      'movistar',
      'orange',
      'at&t',
      'verizon',
      't-mobile',
      'electricidad',
      'gas',
      'luz',
      'agua',
      'utility',
    ],
  },
];

/**
 * Normalizes string: removes diacritics/accents, trims and lowercases.
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export interface DetectionResult {
  category: SubscriptionCategory;
  matchedKeyword: string;
}

/**
 * Automatically detects the subscription category using simple keyword matching
 * against the provided name and optional domain.
 */
export function detectCategoryFromText(name: string, domain?: string): DetectionResult | null {
  const cleanName = normalizeText(name || '');
  const cleanDomain = normalizeText(domain || '');

  if (!cleanName && !cleanDomain) return null;

  const combinedSearchTarget = `${cleanName} ${cleanDomain}`.trim();

  // 1. Exact or phrase matching
  for (const rule of CATEGORY_RULES) {
    for (const keyword of rule.keywords) {
      const cleanKeyword = normalizeText(keyword);
      if (!cleanKeyword) continue;

      // Word boundary or substring matching
      // If the keyword has 3 or fewer characters (like 'tv', 'ia', 'ai', 'vps'), enforce boundary check
      if (cleanKeyword.length <= 3) {
        const regex = new RegExp(`(^|\\b|\\s|[-_.])${cleanKeyword}(\\b|\\s|[-_.]|$)`, 'i');
        if (regex.test(combinedSearchTarget)) {
          return { category: rule.category, matchedKeyword: keyword };
        }
      } else {
        if (combinedSearchTarget.includes(cleanKeyword)) {
          return { category: rule.category, matchedKeyword: keyword };
        }
      }
    }
  }

  return null;
}
