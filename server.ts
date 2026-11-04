import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Shared Google GenAI client for server-side AI Advisor
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

app.use(express.json({ limit: '10mb' }));

// Persistent JSON storage directory for player accounts, saves, and network market
const DATA_DIR = path.join(__dirname, '.data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SAVES_FILE = path.join(DATA_DIR, 'saves.json');
const B2B_MARKET_FILE = path.join(DATA_DIR, 'b2b_market.json');
const CONNECTIONS_FILE = path.join(DATA_DIR, 'player_connections.json');

function loadJson<T>(file: string, fallback: T): T {
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf-8'));
    }
  } catch (e) {
    console.error(`Error reading ${file}:`, e);
  }
  return fallback;
}

function saveJson(file: string, data: any) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error(`Error writing ${file}:`, e);
  }
}

// Initial seed players if none exist
interface StoredUser {
  id: string;
  username: string;
  dealershipName: string;
  region: string;
  rep: number;
  netWorth: number;
  joinedAt: number;
  lastActive: number;
}

const initialSeedUsers: StoredUser[] = [
  {
    id: 'user_marc_estrie',
    username: 'Marc-André (Estrie Motors)',
    dealershipName: 'Garage Lapointe & Estrie',
    region: 'qc',
    rep: 88,
    netWorth: 42000,
    joinedAt: Date.now() - 86400000 * 14,
    lastActive: Date.now(),
  },
  {
    id: 'user_elena_gta',
    username: 'Elena Vance (GTA Wholesale)',
    dealershipName: 'Metro Toronto Auto Exchange',
    region: 'on',
    rep: 94,
    netWorth: 115000,
    joinedAt: Date.now() - 86400000 * 25,
    lastActive: Date.now(),
  },
  {
    id: 'user_calgary_trucks',
    username: 'Brett Walker (Calgary 4x4)',
    dealershipName: 'Bow Valley Truck Traders',
    region: 'ab',
    rep: 82,
    netWorth: 68000,
    joinedAt: Date.now() - 86400000 * 8,
    lastActive: Date.now(),
  },
];

let users = loadJson<StoredUser[]>(USERS_FILE, initialSeedUsers);
if (!fs.existsSync(USERS_FILE)) saveJson(USERS_FILE, users);

let saves = loadJson<Record<string, Record<string, { meta: any; state: any }>>>(SAVES_FILE, {});
let b2bMarket = loadJson<any[]>(B2B_MARKET_FILE, []);
let playerLinks = loadJson<{ from: string; to: string; status: string; timestamp: number }[]>(CONNECTIONS_FILE, [
  { from: 'user_default', to: 'user_marc_estrie', status: 'accepted', timestamp: Date.now() - 86400000 * 2 },
]);

// --- API ENDPOINTS ---

// Auth: Register or Get Current Player
app.post('/api/auth/register', (req, res) => {
  const { username, dealershipName, region } = req.body;
  if (!username) return res.status(400).json({ error: 'Username required' });

  const existing = users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
  if (existing) {
    existing.lastActive = Date.now();
    saveJson(USERS_FILE, users);
    return res.json({ user: existing, message: 'Welcome back!' });
  }

  const newUser: StoredUser = {
    id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    username: username.trim(),
    dealershipName: dealershipName?.trim() || `${username.trim()}'s Auto Lot`,
    region: region || 'qc',
    rep: 50,
    netWorth: 2000,
    joinedAt: Date.now(),
    lastActive: Date.now(),
  };

  users.push(newUser);
  saveJson(USERS_FILE, users);
  res.json({ user: newUser, message: 'Account registered successfully!' });
});

app.get('/api/auth/players', (req, res) => {
  res.json({ players: users });
});

// Saves: Cloud/Server Save & Load
app.post('/api/saves/:userId/:slot', (req, res) => {
  const { userId, slot } = req.params;
  const { meta, state } = req.body;
  if (!saves[userId]) saves[userId] = {};
  saves[userId][slot] = { meta, state };
  saveJson(SAVES_FILE, saves);

  // Update user's live net worth and rep in player registry
  const user = users.find((u) => u.id === userId);
  if (user && meta) {
    user.netWorth = meta.netWorth || user.netWorth;
    user.lastActive = Date.now();
    saveJson(USERS_FILE, users);
  }

  res.json({ success: true, message: `Saved to Slot ${slot}` });
});

app.get('/api/saves/:userId', (req, res) => {
  const { userId } = req.params;
  const userSaves = saves[userId] || {};
  const slotsSummary: Record<string, any> = {};
  Object.keys(userSaves).forEach((slot) => {
    slotsSummary[slot] = userSaves[slot].meta;
  });
  res.json({ slots: slotsSummary });
});

app.get('/api/saves/:userId/:slot', (req, res) => {
  const { userId, slot } = req.params;
  const saved = saves[userId]?.[slot];
  if (!saved) return res.status(404).json({ error: 'Save slot not found' });
  res.json(saved);
});

// Player-to-Player B2B Wholesale Market
app.get('/api/network/b2b-market', (req, res) => {
  res.json({ listings: b2bMarket });
});

app.post('/api/network/b2b-market/list', (req, res) => {
  const { sellerId, sellerName, car, askPrice, notes } = req.body;
  if (!car || !askPrice) return res.status(400).json({ error: 'Car and askPrice required' });

  const listing = {
    id: `b2b_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    sellerId,
    sellerName,
    car,
    askPrice: Math.round(+askPrice),
    notes: notes || 'Wholesale vehicle listed for player trading.',
    listedAt: Date.now(),
  };

  b2bMarket.unshift(listing);
  if (b2bMarket.length > 50) b2bMarket.pop();
  saveJson(B2B_MARKET_FILE, b2bMarket);
  res.json({ success: true, listing });
});

app.post('/api/network/b2b-market/buy', (req, res) => {
  const { listingId, buyerId } = req.body;
  const idx = b2bMarket.findIndex((l) => l.id === listingId);
  if (idx === -1) return res.status(404).json({ error: 'Listing no longer available' });

  const bought = b2bMarket.splice(idx, 1)[0];
  saveJson(B2B_MARKET_FILE, b2bMarket);
  res.json({ success: true, car: bought.car, price: bought.askPrice });
});

// Player Connections
app.get('/api/network/connections/:userId', (req, res) => {
  const { userId } = req.params;
  const myConnections = playerLinks.filter((l) => l.from === userId || l.to === userId);
  res.json({ connections: myConnections });
});

app.post('/api/network/connect', (req, res) => {
  const { fromUserId, toUserId } = req.body;
  if (!fromUserId || !toUserId) return res.status(400).json({ error: 'User IDs required' });

  const existing = playerLinks.find(
    (l) => (l.from === fromUserId && l.to === toUserId) || (l.from === toUserId && l.to === fromUserId)
  );

  if (existing) {
    existing.status = 'accepted';
  } else {
    playerLinks.push({
      from: fromUserId,
      to: toUserId,
      status: 'accepted',
      timestamp: Date.now(),
    });
  }

  saveJson(CONNECTIONS_FILE, playerLinks);
  res.json({ success: true, message: 'Connected with player!' });
});

// Intelligent fallback generator guaranteeing Dmitri ALWAYS responds
function generateDmitriFallbackAdvice(message: string, gameContext: any): string {
  const loc = gameContext?.location?.city || 'Montreal';
  const sym = gameContext?.location?.currencySymbol || '$';
  const cash = gameContext?.cash || 2000;
  const car = gameContext?.selectedListing;
  const msgLower = (message || '').toLowerCase();

  if (car) {
    const ask = car.ask || 2000;
    const estLo = car.appraisal?.[0] || ask * 0.9;
    const estHi = car.appraisal?.[1] || ask * 1.2;
    const mid = Math.round((estLo + estHi) / 2);
    const margin = mid - ask;
    const marginPct = Math.round((margin / Math.max(1, ask)) * 100);

    let goodness = 6.5;
    if (margin > 800) goodness += 1.8;
    else if (margin < 0) goodness -= 2.5;
    if (car.discoveredIssues?.length > 2) goodness -= 1.2;
    if (car.obdDone) goodness += 0.5;
    if (car.walkDone) goodness += 0.5;
    goodness = Math.max(1.5, Math.min(9.8, Math.round(goodness * 10) / 10));

    return `### Dmitri's Deal Analysis: ${car.year} ${car.make} ${car.model}
**Move Goodness Rating: ${goodness}/10** — ${goodness >= 7.5 ? 'Strong Opportunity' : goodness >= 5.5 ? 'Moderate Margin / Caution' : 'High Risk / Poor Margin'}

**Intelligence Breakdown:**
• **Asking Price:** ${sym}${ask.toLocaleString()} vs Appraised Range: ${sym}${estLo.toLocaleString()} – ${sym}${estHi.toLocaleString()} (Est. Midpoint: ${sym}${mid.toLocaleString()})
• **Projected Spread:** ${margin >= 0 ? '+' : ''}${sym}${margin.toLocaleString()} (${marginPct}%) before reconditioning and taxes.
• **Inspection Verification:** Walk-around: **${car.walkDone ? 'Completed' : 'Pending'}** | OBD-II Scan: **${car.obdDone ? 'Completed' : 'Not Run'}** | History: **${car.historyDone ? 'Checked' : 'Unverified'}**
• **Known Discovered Issues:** ${car.discoveredIssues?.length ? car.discoveredIssues.join(', ') : 'None documented yet (run diagnostics to confirm)'}.

**Dmitri's Strategic Recommendation:**
${goodness >= 7.0 
  ? `Offer ${sym}${Math.round(ask * 0.88 / 25) * 25} to create buffer for unexpected shop labor. Inspect the underbody for ${loc} rust before finalizing paperwork.` 
  : `The asking price leaves negligible reconditioning margin. Walk away or negotiate aggressively down to ${sym}${Math.round(estLo * 0.85 / 25) * 25}.`}`;
  }

  if (msgLower.includes('rust') || msgLower.includes('climate')) {
    return `### Dmitri's Regional Climate Brief: ${loc}
• **Climate Profile:** ${gameContext?.location?.climateLabel || 'Temperate/Salt Belt'} (Rust Risk: ${gameContext?.location?.rustRisk ?? 1.4}x).
• **Corrosion Exposure:** Local winter road treatments aggressively attack rocker panels, subframes, and brake lines.
• **Strategic Advice:**
1. Prioritize pre-purchase PPI and floor inspections on vehicles older than 8 years.
2. Market vehicles with rust-free underbodies at a 15–20% premium over local salt-damaged units.
3. Consider sourcing cleaner inventory from arid regions or negotiating steep discounts on rusted daily drivers to part out or flip quickly.`;
  }

  if (msgLower.includes('rival') || msgLower.includes('compet')) {
    return `### Dmitri's Market Competitor Dossier
• **AI Rivals Active in ${loc}:** Apex Precision, Crown Wholesale, Rustbelt Motors, and Continental Prestige.
• **Tactical Recommendations:**
1. **Apex & Crown** bid aggressively on fresh fleet and private listings—lock in deals within 24 hours of posting.
2. **Rustbelt Motors** undercuts on budget beaters; avoid competing on razor-thin margins and focus on certified clean-title daily commuters.
3. Leverage your player B2B network and connection perks to access wholesale discounts unavailable to traditional dealer lots.`;
  }

  return `### Dmitri's Dealership Executive Summary (Day ${gameContext?.day || 1})
• **Cash Reserves:** ${sym}${cash.toLocaleString()} | **Net Worth:** ${sym}${(gameContext?.netWorth || cash).toLocaleString()} | **Lot Stock:** ${gameContext?.ownedCarsCount || 0} unit(s).
• **Market Territory:** ${loc}, ${gameContext?.location?.country || 'Global'} (${gameContext?.location?.currency || 'CAD'}).

**Strategic Levers for Your Operation:**
1. **Capital Velocity:** Keep at least ${sym}800 in reserve for unexpected towing, parts, and municipal registration fees.
2. **Staff Leverage:** Hire a specialized **Scout** or **Closer** to expand deal flow and boost final retail margins.
3. **Connection Quests:** Complete bounties with unlocked network contacts to earn guaranteed cash rewards and unlock exclusive trade perks.`;
}

// Dmitri AI Advisor Endpoint (Guaranteed 100% response uptime)
// Helper to build formatted contents for Dmitri
function buildDmitriContents(message: string, history: any[], gameContext: any) {
  const loc = gameContext?.location?.city || 'Montreal';
  const sym = gameContext?.location?.currencySymbol || '$';

  const contextSummary = gameContext
    ? `
CURRENT BUSINESS STATE:
- Day: ${gameContext.day || 1}
- Location: ${loc}, ${gameContext.location?.country || 'Canada'} (Climate: ${gameContext.location?.climate || 'Temperate/Salt'}, Rust Risk Factor: ${gameContext.location?.rustRisk ?? 1.2}x, Currency: ${sym})
- Available Cash: ${sym}${gameContext.cash?.toLocaleString() || 0}
- Current Net Worth: ${sym}${gameContext.netWorth?.toLocaleString() || 0}
- Inventory Size: ${gameContext.ownedCarsCount || 0} car(s)
${
  gameContext.selectedListing
    ? `- Active Listing Under Consideration: ${gameContext.selectedListing.year} ${gameContext.selectedListing.make} ${gameContext.selectedListing.model}
  * Asking Price: ${sym}${gameContext.selectedListing.ask?.toLocaleString()}
  * Player Appraisal Range: ${sym}${gameContext.selectedListing.appraisal?.[0]?.toLocaleString()} - ${sym}${gameContext.selectedListing.appraisal?.[1]?.toLocaleString()}
  * Mileage: ${gameContext.selectedListing.mileage?.toLocaleString()} km
  * Known Discovered Issues: ${gameContext.selectedListing.discoveredIssues?.join(', ') || 'None discovered yet (uninspected)'}
  * Walk-around Completed: ${gameContext.selectedListing.walkDone ? 'Yes' : 'No'}
  * Test Drive Completed: ${gameContext.selectedListing.driveDone ? 'Yes' : 'No'}
  * OBD-II Scanned: ${gameContext.selectedListing.obdDone ? 'Yes' : 'No'}
  * History Checked: ${gameContext.selectedListing.historyDone ? 'Yes' : 'No'}
  * Seller Profile: ${gameContext.selectedListing.sellerType} (${gameContext.selectedListing.sellerName})`
    : ''
}
${gameContext.rivalsSummary ? `- Market Rivals Overview: ${gameContext.rivalsSummary}` : ''}
`
    : '';

  const formattedContents: any[] = [];
  if (contextSummary) {
    formattedContents.push({
      role: 'user',
      parts: [{ text: `[SYSTEM DOSSIER & CONTEXT]\n${contextSummary}\nPlease use this confirmed intelligence.` }],
    });
    formattedContents.push({
      role: 'model',
      parts: [
        {
          text: "Dossier received. I have reviewed your dealership metrics, current location dynamics, and market conditions. What strategic analysis or deal evaluation do you need?",
        },
      ],
    });
  }

  if (Array.isArray(history)) {
    history.slice(-8).forEach((item: any) => {
      formattedContents.push({
        role: item.role === 'user' ? 'user' : 'model',
        parts: [{ text: item.text }],
      });
    });
  }

  formattedContents.push({
    role: 'user',
    parts: [{ text: message }],
  });

  return formattedContents;
}

const DMITRI_SYSTEM_INSTRUCTION = `You are 'Dmitri', a veteran automotive dealership strategist, seasoned vehicle appraiser, and executive advisor in the tycoon game 'Lot & Ledger'.
The player operates a used-car dealership, negotiating purchases, reconditioning vehicles, competing against AI dealerships, and trading.

CRITICAL BEHAVIORAL DIRECTIVES:
1. Always introduce or sign off as Dmitri when appropriate. Provide concise, clear, and actionable strategic advice and situational summaries.
2. ANSWER ONLY BASED ON EXISTING, KNOWN INFORMATION provided in the game context.
3. ABSOLUTE Fog-of-War Rule: DO NOT reveal uninspected hidden vehicle defects, exact hidden auction reserve prices, or secret algorithms. If the player hasn't run an OBD-II scan, tell them to consider scanning for ECU codes, but NEVER reveal whether faults actually exist before they test it.
4. When evaluating any specific vehicle, trade, or deal, ALWAYS provide a prominent 'Move Goodness Rating' from 1.0 to 10.0 (e.g., 'Move Goodness: 7.8/10 — Favorable Margin, Moderate Recon Risk') along with 2-3 quick bullet points explaining upside and risk factors.
5. Take into account the local geography, weather/climate (e.g. rust belt vs desert), local currency, and rival dealer movements.
6. Keep formatting scannable and professional with bullet points, bold key figures, and concise paragraphs.`;

// Ultra-fast streaming advisor endpoint (SSE)
app.post('/api/ai/advisor/stream', async (req, res) => {
  const { message, history = [], gameContext } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  if (typeof (res as any).flushHeaders === 'function') {
    (res as any).flushHeaders();
  }

  const sendChunk = (text: string) => {
    res.write(`data: ${JSON.stringify({ text })}\n\n`);
  };

  const formattedContents = buildDmitriContents(message, history, gameContext);

  try {
    if (process.env.GEMINI_API_KEY) {
      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3.6-flash',
        contents: formattedContents,
        config: {
          systemInstruction: DMITRI_SYSTEM_INSTRUCTION,
        },
      });

      for await (const chunk of responseStream) {
        if (chunk.text) {
          sendChunk(chunk.text);
        }
      }
      res.write('data: [DONE]\n\n');
      return res.end();
    }
  } catch (error: any) {
    console.warn('Gemini Advisor stream fallback engaged:', error?.message || error);
  }

  // Fast simulated stream of structured fallback advice
  const fallbackText = generateDmitriFallbackAdvice(message, gameContext);
  const words = fallbackText.split(' ');
  for (let i = 0; i < words.length; i += 3) {
    const chunk = words.slice(i, i + 3).join(' ') + (i + 3 < words.length ? ' ' : '');
    sendChunk(chunk);
    await new Promise((resolve) => setTimeout(resolve, 18));
  }
  res.write('data: [DONE]\n\n');
  res.end();
});

// Standard Dmitri AI Advisor Endpoint with 3.5s timeout race for guaranteed fast response
app.post('/api/ai/advisor', async (req, res) => {
  const { message, history = [], gameContext } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  const formattedContents = buildDmitriContents(message, history, gameContext);

  try {
    if (process.env.GEMINI_API_KEY) {
      // 3.5s timeout race
      const apiPromise = ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: formattedContents,
        config: {
          systemInstruction: DMITRI_SYSTEM_INSTRUCTION,
        },
      });

      const timeoutPromise = new Promise<{ text: string }>((resolve) =>
        setTimeout(() => resolve({ text: generateDmitriFallbackAdvice(message, gameContext) }), 3500)
      );

      const response: any = await Promise.race([apiPromise, timeoutPromise]);

      if (response && response.text) {
        return res.json({ reply: response.text });
      }
    }

    const fallbackText = generateDmitriFallbackAdvice(message, gameContext);
    return res.json({ reply: fallbackText });
  } catch (error: any) {
    console.warn('Gemini Advisor fallback engaged:', error?.message || error);
    const fallbackText = generateDmitriFallbackAdvice(message, gameContext);
    return res.json({ reply: fallbackText });
  }
});


// Gemini-Generated Staff Candidates Endpoint
app.post('/api/ai/generate-staff', async (req, res) => {
  const { location, connections = [], count = 3 } = req.body;
  const locCity = location?.city || 'Montreal';
  const currencySymbol = location?.currencySymbol || '$';

  const staffRoles = [
    { role: 'scout', title: 'Deal Scout & Wholesaler', desc: 'Finds hidden off-market bargains and alerts on discounted auction lots' },
    { role: 'mechanic', title: 'Diagnostic Master Technician', desc: 'Slashes parts & labor costs by 35% and speeds shop turnaround' },
    { role: 'legal', title: 'Compliance & Legal Counsel', desc: 'Shields against buyer lawsuits, settles claims for pennies, and speeds registration' },
    { role: 'underground', title: 'Grey-Market VIN Specialist', desc: 'Decodes shady titles, clears liens, and sources rare overseas salvage' },
    { role: 'closer', title: 'Lead Sales Closer', desc: 'Negotiates ruthless retail buyer deals, boosting car sales price by +12% to +24%' },
    { role: 'executive', title: 'Operations Executive', desc: 'Expands dealership lot stalls, increases daily hours, and secures credit lines' },
  ];

  try {
    if (process.env.GEMINI_API_KEY) {
      const prompt = `Generate ${count} diverse and realistic automotive dealership staff candidates for a dealership in ${locCity}.
Connection network hints: ${connections.length ? connections.map((c: any) => `${c.name} (${c.title})`).join(', ') : 'Independent network'}.
Available roles: scout, mechanic, legal, underground, closer, executive.
Contracts: hourly, commission, or retainer.
Respond with ONLY a clean JSON array matching this structure:
[
  {
    "id": 1001,
    "name": "Full Name",
    "role": "scout | mechanic | legal | underground | closer | executive",
    "roleLabel": "Role Title",
    "contract": "hourly | commission | retainer",
    "wage": 650,
    "commissionRate": 0.08,
    "skill": 7.8,
    "experience": 6,
    "trait": "Short memorable personality quote or specialty",
    "perkDescription": "Specific in-game mechanical bonus",
    "referredBy": "Connection name or 'Independent Application'"
  }
]`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
        },
      });

      if (response && response.text) {
        const parsed = JSON.parse(response.text.trim());
        if (Array.isArray(parsed) && parsed.length > 0) {
          return res.json({ candidates: parsed });
        }
      }
    }
  } catch (err) {
    console.warn('Gemini Staff Generation fallback engaged:', err);
  }

  // Guaranteed procedural candidate generation fallback
  const fallbackNames = [
    'Victor Krumm', 'Dmitri Belov', 'Elena Rossi', 'Kenji Sato', 'Samantha Drake',
    'Jean-Luc Mercier', 'Chloe Beaulieu', 'Tariq Al-Mansoor', 'Rocco Vane', 'Maya Lin'
  ];
  const traits = [
    'Can smell a blown head gasket through a closed hood.',
    'Closed 140 cars last year with zero buyer returns.',
    'Former provincial registry auditor. Knows every paperwork loophole.',
    'Has contacts in every shipping port from Montreal to Yokohama.',
    'Scouts classifieds at 4 AM to snipe unlisted estate sales.',
    'Runs tight books and negotiates prime bank lending rates.'
  ];

  const candidates = Array.from({ length: count }).map((_, i) => {
    const roleObj = staffRoles[(i + Math.floor(Math.random() * staffRoles.length)) % staffRoles.length];
    const name = fallbackNames[(i * 3 + Math.floor(Math.random() * fallbackNames.length)) % fallbackNames.length];
    const contractTypes = ['hourly', 'commission', 'retainer'];
    const contract = contractTypes[i % contractTypes.length];
    const skill = Math.round((5.0 + Math.random() * 4.5) * 10) / 10;
    const exp = Math.floor(2 + Math.random() * 12);
    const wage = Math.round((450 + skill * 90) / 25) * 25;
    const ref = connections.length > 0 && Math.random() < 0.6
      ? connections[Math.floor(Math.random() * connections.length)].name
      : 'Classified Job Board';

    return {
      id: Date.now() + i * 17,
      name,
      role: roleObj.role,
      roleLabel: roleObj.title,
      contract,
      wage: contract === 'commission' ? 250 : wage,
      commissionRate: contract === 'commission' ? 0.08 + Math.round(skill * 0.015 * 100) / 100 : 0,
      skill,
      experience: exp,
      trait: traits[(i * 2 + Math.floor(Math.random() * traits.length)) % traits.length],
      perkDescription: roleObj.desc,
      referredBy: ref,
    };
  });

  return res.json({ candidates });
});

// In-memory City Intelligence Cache for sub-10ms response times
const cityLookupCache = new Map<string, any>();

// Seed cache with top global hubs with verified GPS coordinates and Google Maps URLs
const PRESEEDED_CITIES: Record<string, any> = {
  reykjavik: {
    city: 'Reykjavík',
    country: 'Iceland',
    continent: 'Europe',
    countryCode: 'IS',
    flag: '🇮🇸',
    lat: 64.1466,
    lng: -21.9426,
    currency: 'ISK',
    currencySymbol: 'kr',
    currencyMultiplier: 105,
    taxRate: 0.24,
    taxName: 'VSK (VAT)',
    climate: 'arctic',
    climateLabel: 'Sub-Arctic Maritime & Volcanic Dust',
    rustRisk: 1.85,
    sunDamageRisk: 0.15,
    preferredClasses: ['suv', 'truck', 'hatch'],
    inspectionName: 'Bifreiðaskoðun Frumherji',
    baseRegCost: 140,
    inspectionCost: 95,
    description: 'Volcanic coastal winds, studded winter tires, and geothermal sulfur accelerate underbody oxidation. Heavy 4x4 SUV and lifted diesel demand.',
    experienceHighlight: 'Exceptional demand for clean Toyota Land Cruisers, Hilux 35-inch modifications, and winter-ready all-wheel drives.',
  },
  nairobi: {
    city: 'Nairobi',
    country: 'Kenya',
    continent: 'Africa',
    countryCode: 'KE',
    flag: '🇰🇪',
    lat: -1.2921,
    lng: 36.8219,
    currency: 'KES',
    currencySymbol: 'KSh',
    currencyMultiplier: 95,
    taxRate: 0.16,
    taxName: 'VAT',
    climate: 'tropical_humid',
    climateLabel: 'Subtropical Highland / Rough Corridors',
    rustRisk: 0.45,
    sunDamageRisk: 1.35,
    preferredClasses: ['suv', 'van', 'compact'],
    inspectionName: 'NTSA Motor Vehicle Inspection',
    baseRegCost: 85,
    inspectionCost: 60,
    description: 'High-clearance terrain and corrugated roads challenge suspension bushings and ball joints, while rust is minimal away from the coast.',
    experienceHighlight: 'Massive appetite for imported Japanese right-hand-drive wagons (Toyota Probox, Fielder, Prado) and commercial matatu vans.',
  },
  munich: {
    city: 'Munich',
    country: 'Germany',
    continent: 'Europe',
    countryCode: 'DE',
    flag: '🇩🇪',
    lat: 48.1351,
    lng: 11.582,
    currency: 'EUR',
    currencySymbol: '€',
    currencyMultiplier: 0.88,
    taxRate: 0.19,
    taxName: 'MwSt (VAT)',
    climate: 'temperate_salt',
    climateLabel: 'Alpine Continental & Salt Brine',
    rustRisk: 1.6,
    sunDamageRisk: 0.4,
    preferredClasses: ['sedan', 'lux', 'hatch'],
    inspectionName: 'TÜV Süd Hauptuntersuchung',
    baseRegCost: 120,
    inspectionCost: 110,
    description: 'Bavarian winter brine causes aggressive underside pitting, while strict TÜV inspections demand flawless emissions and brake pads.',
    experienceHighlight: 'Unrivaled market for German precision engineering: BMW M-Sport touring wagons, Audi Quattros, and meticulously serviced diesels.',
  },
  dubai: {
    city: 'Dubai',
    country: 'United Arab Emirates',
    continent: 'Middle East',
    countryCode: 'AE',
    flag: '🇦🇪',
    lat: 25.2048,
    lng: 55.2708,
    currency: 'AED',
    currencySymbol: 'د.إ',
    currencyMultiplier: 2.7,
    taxRate: 0.05,
    taxName: 'VAT',
    climate: 'desert_arid',
    climateLabel: 'Hyper-Arid Desert & High UV',
    rustRisk: 0.15,
    sunDamageRisk: 1.95,
    preferredClasses: ['lux', 'suv', 'sport'],
    inspectionName: 'RTA Tasjeel Vehicle Testing',
    baseRegCost: 150,
    inspectionCost: 75,
    description: 'Zero road salt means zero rust, but 50°C summer asphalt severely degrades clearcoats, leather upholstery, and air conditioning seals.',
    experienceHighlight: 'World hub for flagship supercars, GCC-spec Nissan Patrol V8s, Toyota Land Cruisers, and luxury performance imports.',
  },
  cairo: {
    city: 'Cairo',
    country: 'Egypt',
    continent: 'Africa',
    countryCode: 'EG',
    flag: '🇪🇬',
    lat: 30.0444,
    lng: 31.2357,
    currency: 'EGP',
    currencySymbol: 'E£',
    currencyMultiplier: 35,
    taxRate: 0.14,
    taxName: 'VAT',
    climate: 'desert_arid',
    climateLabel: 'Warm Desert & Sand Particulates',
    rustRisk: 0.3,
    sunDamageRisk: 1.7,
    preferredClasses: ['sedan', 'compact', 'suv'],
    inspectionName: 'Traffic Police Technical Inspection',
    baseRegCost: 90,
    inspectionCost: 50,
    description: 'High city heat, airborne dust, and traffic congestion strain cooling radiators, alternator belts, and air filter systems.',
    experienceHighlight: 'Tremendous resilience in used Hyundai, Fiat, and Toyota sedans with durable mechanical components and high resale liquidity.',
  },
  auckland: {
    city: 'Auckland',
    country: 'New Zealand',
    continent: 'Oceania',
    countryCode: 'NZ',
    flag: '🇳🇿',
    lat: -36.8485,
    lng: 174.7633,
    currency: 'NZD',
    currencySymbol: 'NZ$',
    currencyMultiplier: 1.22,
    taxRate: 0.15,
    taxName: 'GST',
    climate: 'mediterranean',
    climateLabel: 'Subtropical Oceanic Maritime',
    rustRisk: 1.15,
    sunDamageRisk: 0.9,
    preferredClasses: ['hatch', 'suv', 'truck'],
    inspectionName: 'NZTA Warrant of Fitness (WoF)',
    baseRegCost: 95,
    inspectionCost: 65,
    description: 'Coastal sea mist promotes moderate surface oxidation, while high UV indexes gradually oxidize roof and bonnet clear coats.',
    experienceHighlight: 'Booming trade in JDM imports, Toyota Aqua hybrids, Subaru Outbacks, and Ford Ranger turbo-diesel utes.',
  },
  tokyo: {
    city: 'Tokyo',
    country: 'Japan',
    continent: 'Asia',
    countryCode: 'JP',
    flag: '🇯🇵',
    lat: 35.6762,
    lng: 139.6503,
    currency: 'JPY',
    currencySymbol: '¥',
    currencyMultiplier: 110,
    taxRate: 0.10,
    taxName: 'Shouhizei (Consumption Tax)',
    climate: 'temperate_mild',
    climateLabel: 'Temperate Maritime',
    rustRisk: 0.6,
    sunDamageRisk: 0.8,
    preferredClasses: ['compact', 'van', 'sport'],
    inspectionName: 'Shaken (Automobile Inspection)',
    baseRegCost: 200,
    inspectionCost: 150,
    description: 'Meticulously paved roads and strict Shaken standards yield low-mileage immaculate chassis with virtually zero rust.',
    experienceHighlight: 'Massive domestic turnover of Kei cars, Toyota Alphards, Prius hybrids, and coveted collector sports cars (GT-R, Civic Type R).',
  },
};

// Populate pre-seeded entries
Object.entries(PRESEEDED_CITIES).forEach(([key, val]) => {
  const sanitizedId = 'loc_' + key;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${val.city}, ${val.country}`)}`;
  cityLookupCache.set(key, {
    ...val,
    id: sanitizedId,
    mapsUrl,
    mapsSource: 'maps.google.com',
    mapsCoordinates: `${val.lat.toFixed(4)}°, ${val.lng.toFixed(4)}°`,
    responseTimeMs: 8,
  });
});

// --- Wikipedia Ground Truth City Retrieval Helper (Fast < 200ms) ---
interface WikipediaCityData {
  title: string;
  description: string;
  extract: string;
  lat: number | null;
  lng: number | null;
  wikiUrl: string;
  thumbnailUrl?: string;
}

async function fetchWikipediaCityData(query: string): Promise<WikipediaCityData | null> {
  const headers = { 'User-Agent': 'LotAndLedger/2.0 (automotive-tycoon; contact: admin@lotledger.com)' };
  try {
    let res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`, { headers });
    let data: any = res.ok ? await res.json() : null;

    if (!data || data.type === 'disambiguation' || res.status === 404 || (!data.coordinates && !data.description?.toLowerCase().includes('city') && !data.description?.toLowerCase().includes('capital') && !data.description?.toLowerCase().includes('municipality'))) {
      const searchRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query + ' city')}&utf8=&format=json&origin=*`, { headers });
      if (searchRes.ok) {
        const searchJson = await searchRes.json();
        const topHit = searchJson.query?.search?.[0]?.title;
        if (topHit) {
          const detailRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topHit)}`, { headers });
          if (detailRes.ok) {
            data = await detailRes.json();
          }
        }
      }
    }

    if (!data) return null;

    return {
      title: data.title || query,
      description: data.description || '',
      extract: data.extract || '',
      lat: data.coordinates?.lat ?? null,
      lng: data.coordinates?.lon ?? null,
      wikiUrl: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(data.title || query)}`,
      thumbnailUrl: data.thumbnail?.source || undefined,
    };
  } catch (e) {
    console.warn('Wikipedia query error:', e);
    return null;
  }
}

// Known country-level automotive regulatory mappings for reliable zero-hallucination fallback
const COUNTRY_AUTO_REGULATIONS: Record<string, {
  country: string;
  countryCode: string;
  continent: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  currencyMultiplier: number;
  taxRate: number;
  taxName: string;
  climate: 'arctic' | 'temperate_salt' | 'temperate_mild' | 'desert_arid' | 'tropical_humid' | 'mediterranean';
  climateLabel: string;
  rustRisk: number;
  sunDamageRisk: number;
  inspectionName: string;
}> = {
  japan: {
    country: 'Japan', countryCode: 'JP', continent: 'Asia', flag: '🇯🇵',
    currency: 'JPY', currencySymbol: '¥', currencyMultiplier: 110, taxRate: 0.10, taxName: 'Shouhizei',
    climate: 'temperate_mild', climateLabel: 'Maritime Island Temperate', rustRisk: 0.65, sunDamageRisk: 0.75,
    inspectionName: 'MLIT Shaken (Automobile Inspection)',
  },
  norway: {
    country: 'Norway', countryCode: 'NO', continent: 'Europe', flag: '🇳🇴',
    currency: 'NOK', currencySymbol: 'kr', currencyMultiplier: 8.2, taxRate: 0.25, taxName: 'MVA (VAT)',
    climate: 'arctic', climateLabel: 'Sub-Arctic Maritime & Fjord Salt Brine', rustRisk: 1.95, sunDamageRisk: 0.2,
    inspectionName: 'Statens vegvesen (EU-kontroll / Periodisk Kjøretøykontroll)',
  },
  iceland: {
    country: 'Iceland', countryCode: 'IS', continent: 'Europe', flag: '🇮🇸',
    currency: 'ISK', currencySymbol: 'kr', currencyMultiplier: 105, taxRate: 0.24, taxName: 'VSK (VAT)',
    climate: 'arctic', climateLabel: 'Sub-Arctic Volcanic Maritime', rustRisk: 1.85, sunDamageRisk: 0.15,
    inspectionName: 'Bifreiðaskoðun Frumherji',
  },
  germany: {
    country: 'Germany', countryCode: 'DE', continent: 'Europe', flag: '🇩🇪',
    currency: 'EUR', currencySymbol: '€', currencyMultiplier: 0.88, taxRate: 0.19, taxName: 'MwSt (VAT)',
    climate: 'temperate_salt', climateLabel: 'Continental Salt Belt', rustRisk: 1.6, sunDamageRisk: 0.45,
    inspectionName: 'TÜV Süd / DEKRA Hauptuntersuchung',
  },
  france: {
    country: 'France', countryCode: 'FR', continent: 'Europe', flag: '🇫🇷',
    currency: 'EUR', currencySymbol: '€', currencyMultiplier: 0.88, taxRate: 0.20, taxName: 'TVA',
    climate: 'temperate_mild', climateLabel: 'Oceanic & Mediterranean Transition', rustRisk: 0.95, sunDamageRisk: 0.8,
    inspectionName: 'Contrôle Technique Automobile (UTAC OTC)',
  },
  unitedkingdom: {
    country: 'United Kingdom', countryCode: 'GB', continent: 'Europe', flag: '🇬🇧',
    currency: 'GBP', currencySymbol: '£', currencyMultiplier: 0.74, taxRate: 0.20, taxName: 'VAT',
    climate: 'temperate_salt', climateLabel: 'Maritime Damp & Winter Road Salt', rustRisk: 1.7, sunDamageRisk: 0.35,
    inspectionName: 'DVSA MOT Inspection Certificate',
  },
  chile: {
    country: 'Chile', countryCode: 'CL', continent: 'South America', flag: '🇨🇱',
    currency: 'CLP', currencySymbol: '$', currencyMultiplier: 720, taxRate: 0.19, taxName: 'IVA',
    climate: 'mediterranean', climateLabel: 'Mediterranean Andes Valley', rustRisk: 0.35, sunDamageRisk: 1.4,
    inspectionName: 'Plantas de Revisión Técnica (PRT / MTT)',
  },
  australia: {
    country: 'Australia', countryCode: 'AU', continent: 'Oceania', flag: '🇦🇺',
    currency: 'AUD', currencySymbol: 'A$', currencyMultiplier: 1.15, taxRate: 0.10, taxName: 'GST',
    climate: 'mediterranean', climateLabel: 'Coastal High UV & Arid Outback', rustRisk: 0.5, sunDamageRisk: 1.85,
    inspectionName: 'Roadworthy Certificate (RWC) / Pink Slip',
  },
  canada: {
    country: 'Canada', countryCode: 'CA', continent: 'North America', flag: '🇨🇦',
    currency: 'CAD', currencySymbol: '$', currencyMultiplier: 1.0, taxRate: 0.13, taxName: 'HST / GST',
    climate: 'temperate_salt', climateLabel: 'Extreme Winter Salt Belt', rustRisk: 1.9, sunDamageRisk: 0.3,
    inspectionName: 'Provincial Safety Standards Certificate (SAAQ / ServiceON)',
  },
  unitedstates: {
    country: 'United States', countryCode: 'US', continent: 'North America', flag: '🇺🇸',
    currency: 'USD', currencySymbol: '$', currencyMultiplier: 1.0, taxRate: 0.075, taxName: 'State Sales Tax',
    climate: 'temperate_mild', climateLabel: 'Interstate Corridors & Variable Climate', rustRisk: 1.1, sunDamageRisk: 1.1,
    inspectionName: 'Department of Motor Vehicles (DMV) / State Smog Check',
  },
  unitedarabemirates: {
    country: 'United Arab Emirates', countryCode: 'AE', continent: 'Middle East', flag: '🇦🇪',
    currency: 'AED', currencySymbol: 'د.إ', currencyMultiplier: 2.7, taxRate: 0.05, taxName: 'VAT',
    climate: 'desert_arid', climateLabel: 'Hyper-Arid Desert & Extreme Sun UV', rustRisk: 0.15, sunDamageRisk: 1.95,
    inspectionName: 'RTA Tasjeel Vehicle Testing',
  },
  kenya: {
    country: 'Kenya', countryCode: 'KE', continent: 'Africa', flag: '🇰🇪',
    currency: 'KES', currencySymbol: 'KSh', currencyMultiplier: 95, taxRate: 0.16, taxName: 'VAT',
    climate: 'tropical_humid', climateLabel: 'Equatorial Highland Rough Terrain', rustRisk: 0.45, sunDamageRisk: 1.35,
    inspectionName: 'NTSA Motor Vehicle Inspection',
  },
  egypt: {
    country: 'Egypt', countryCode: 'EG', continent: 'Africa', flag: '🇪🇬',
    currency: 'EGP', currencySymbol: 'E£', currencyMultiplier: 35, taxRate: 0.14, taxName: 'VAT',
    climate: 'desert_arid', climateLabel: 'Arid Sand & Thermal Stress', rustRisk: 0.3, sunDamageRisk: 1.7,
    inspectionName: 'Traffic Police Technical Inspection',
  },
  brazil: {
    country: 'Brazil', countryCode: 'BR', continent: 'South America', flag: '🇧🇷',
    currency: 'BRL', currencySymbol: 'R$', currencyMultiplier: 4.2, taxRate: 0.18, taxName: 'ICMS',
    climate: 'tropical_humid', climateLabel: 'Tropical Humid & Coastal Exposure', rustRisk: 0.85, sunDamageRisk: 1.6,
    inspectionName: 'DETRAN Inspeção Veicular',
  },
  italy: {
    country: 'Italy', countryCode: 'IT', continent: 'Europe', flag: '🇮🇹',
    currency: 'EUR', currencySymbol: '€', currencyMultiplier: 0.88, taxRate: 0.22, taxName: 'IVA',
    climate: 'mediterranean', climateLabel: 'Mediterranean Alpine & Coastal', rustRisk: 0.8, sunDamageRisk: 1.2,
    inspectionName: 'Motorizzazione Civile (Revisione Auto)',
  },
  colombia: {
    country: 'Colombia', countryCode: 'CO', continent: 'South America', flag: '🇨🇴',
    currency: 'COP', currencySymbol: '$', currencyMultiplier: 3100, taxRate: 0.19, taxName: 'IVA',
    climate: 'tropical_humid', climateLabel: 'Andean Mountain Elevation & Tropical Valley', rustRisk: 0.4, sunDamageRisk: 1.5,
    inspectionName: 'RUNT / CDA (Revisión Técnico-Mecánica)',
  },
  mexico: {
    country: 'Mexico', countryCode: 'MX', continent: 'North America', flag: '🇲🇽',
    currency: 'MXN', currencySymbol: '$', currencyMultiplier: 15.0, taxRate: 0.16, taxName: 'IVA',
    climate: 'desert_arid', climateLabel: 'Highland Plateau & Arid Desert', rustRisk: 0.35, sunDamageRisk: 1.8,
    inspectionName: 'SEDEMA Verificación Vehicular (Holograma)',
  },
  spain: {
    country: 'Spain', countryCode: 'ES', continent: 'Europe', flag: '🇪🇸',
    currency: 'EUR', currencySymbol: '€', currencyMultiplier: 0.88, taxRate: 0.21, taxName: 'IVA',
    climate: 'mediterranean', climateLabel: 'Iberian Mediterranean & High Summer Heat', rustRisk: 0.45, sunDamageRisk: 1.6,
    inspectionName: 'ITV (Inspección Técnica de Vehículos)',
  },
  argentina: {
    country: 'Argentina', countryCode: 'AR', continent: 'South America', flag: '🇦🇷',
    currency: 'ARS', currencySymbol: '$', currencyMultiplier: 850, taxRate: 0.21, taxName: 'IVA',
    climate: 'temperate_mild', climateLabel: 'Pampas Temperate & Coastal River Corridors', rustRisk: 0.7, sunDamageRisk: 1.3,
    inspectionName: 'VTV (Verificación Técnica Vehicular)',
  },
  southkorea: {
    country: 'South Korea', countryCode: 'KR', continent: 'Asia', flag: '🇰🇷',
    currency: 'KRW', currencySymbol: '₩', currencyMultiplier: 1350, taxRate: 0.10, taxName: 'VAT',
    climate: 'temperate_salt', climateLabel: 'Continental Peninsula & Winter Brine', rustRisk: 1.5, sunDamageRisk: 0.6,
    inspectionName: 'TS Korea Transportation Safety Authority (자동차 정기검사)',
  },
  korea: {
    country: 'South Korea', countryCode: 'KR', continent: 'Asia', flag: '🇰🇷',
    currency: 'KRW', currencySymbol: '₩', currencyMultiplier: 1350, taxRate: 0.10, taxName: 'VAT',
    climate: 'temperate_salt', climateLabel: 'Continental Peninsula & Winter Brine', rustRisk: 1.5, sunDamageRisk: 0.6,
    inspectionName: 'TS Korea Transportation Safety Authority (자동차 정기검사)',
  },
  sweden: {
    country: 'Sweden', countryCode: 'SE', continent: 'Europe', flag: '🇸🇪',
    currency: 'SEK', currencySymbol: 'kr', currencyMultiplier: 8.4, taxRate: 0.25, taxName: 'Moms (VAT)',
    climate: 'arctic', climateLabel: 'Nordic Boreal & Winter Calcium Brine', rustRisk: 1.9, sunDamageRisk: 0.25,
    inspectionName: 'Bilprovningen (Kontrollbesiktning)',
  },
  switzerland: {
    country: 'Switzerland', countryCode: 'CH', continent: 'Europe', flag: '🇨🇭',
    currency: 'CHF', currencySymbol: 'CHF', currencyMultiplier: 0.68, taxRate: 0.081, taxName: 'MWST',
    climate: 'temperate_salt', climateLabel: 'Alpine Snow Pass & Mountain Road Salt', rustRisk: 1.75, sunDamageRisk: 0.5,
    inspectionName: 'MFK (Motorfahrzeugkontrolle / Expertise)',
  },
  southafrica: {
    country: 'South Africa', countryCode: 'ZA', continent: 'Africa', flag: '🇿🇦',
    currency: 'ZAR', currencySymbol: 'R', currencyMultiplier: 13.5, taxRate: 0.15, taxName: 'VAT',
    climate: 'mediterranean', climateLabel: 'Subtropical High Veld & Coastal Mist', rustRisk: 0.6, sunDamageRisk: 1.7,
    inspectionName: 'DEKRA Roadworthy Certificate (CoR)',
  },
  netherlands: {
    country: 'Netherlands', countryCode: 'NL', continent: 'Europe', flag: '🇳🇱',
    currency: 'EUR', currencySymbol: '€', currencyMultiplier: 0.88, taxRate: 0.21, taxName: 'BTW',
    climate: 'temperate_salt', climateLabel: 'Maritime Lowlands & Damp Canal Air', rustRisk: 1.45, sunDamageRisk: 0.4,
    inspectionName: 'RDW Algemene Periodieke Keuring (APK)',
  },
  poland: {
    country: 'Poland', countryCode: 'PL', continent: 'Europe', flag: '🇵🇱',
    currency: 'PLN', currencySymbol: 'zł', currencyMultiplier: 3.1, taxRate: 0.23, taxName: 'VAT',
    climate: 'temperate_salt', climateLabel: 'Central European Winter Road Salt Belt', rustRisk: 1.7, sunDamageRisk: 0.4,
    inspectionName: 'Badanie Techniczne Pojazdu (Stacja Kontroli Pojazdów)',
  },
  turkey: {
    country: 'Turkey', countryCode: 'TR', continent: 'Europe', flag: '🇹🇷',
    currency: 'TRY', currencySymbol: '₺', currencyMultiplier: 25.0, taxRate: 0.20, taxName: 'KDV',
    climate: 'mediterranean', climateLabel: 'Anatolian Continental & Coastal Transition', rustRisk: 0.75, sunDamageRisk: 1.5,
    inspectionName: 'TÜVTÜRK Araç Muayene İstasyonu',
  },
  saudiarabia: {
    country: 'Saudi Arabia', countryCode: 'SA', continent: 'Middle East', flag: '🇸🇦',
    currency: 'SAR', currencySymbol: '﷼', currencyMultiplier: 2.8, taxRate: 0.15, taxName: 'VAT',
    climate: 'desert_arid', climateLabel: 'Hyper-Arid Sand Desert & Extreme Heat', rustRisk: 0.1, sunDamageRisk: 2.0,
    inspectionName: 'MVPI (Periodic Vehicle Inspection - الفحص الفني الدوري)',
  },
  newzealand: {
    country: 'New Zealand', countryCode: 'NZ', continent: 'Oceania', flag: '🇳🇿',
    currency: 'NZD', currencySymbol: 'NZ$', currencyMultiplier: 1.22, taxRate: 0.15, taxName: 'GST',
    climate: 'mediterranean', climateLabel: 'Oceanic Island Maritime', rustRisk: 1.15, sunDamageRisk: 0.9,
    inspectionName: 'NZTA Warrant of Fitness (WoF)',
  },
  singapore: {
    country: 'Singapore', countryCode: 'SG', continent: 'Asia', flag: '🇸🇬',
    currency: 'SGD', currencySymbol: 'S$', currencyMultiplier: 1.0, taxRate: 0.09, taxName: 'GST',
    climate: 'tropical_humid', climateLabel: 'Equatorial High Humidity & Tropical Rains', rustRisk: 0.7, sunDamageRisk: 1.6,
    inspectionName: 'LTA Periodic Vehicle Inspection (VICOM / STA)',
  },
};

// --- AI City Discovery Endpoint (Wikipedia.com + maps.google.com + Gemini 3.6 Flash) ---
app.post('/api/ai/lookup-city', async (req, res) => {
  const startTime = Date.now();
  const { cityName, countryName } = req.body;
  if (!cityName || typeof cityName !== 'string' || !cityName.trim()) {
    return res.status(400).json({ error: 'City name is required' });
  }

  const cleanCity = cityName.trim();
  const cleanCountry = countryName && typeof countryName === 'string' ? countryName.trim() : '';
  const query = cleanCountry ? `${cleanCity}, ${cleanCountry}` : cleanCity;
  const normKey = query.toLowerCase().replace(/[^a-z0-9]/g, '');

  // 1. Instant Cache Hit (< 10ms response)
  if (cityLookupCache.has(normKey)) {
    const cached = cityLookupCache.get(normKey);
    const elapsed = Date.now() - startTime;
    return res.json({
      location: {
        ...cached,
        responseTimeMs: elapsed,
      },
      cached: true,
    });
  }

  const sanitizedId = 'loc_' + query.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 24) + '_' + Math.floor(Math.random() * 1000);

  // Helper to format consistent city payload with Google Maps and Wikipedia source links
  const finalizeCityPayload = (cityData: any, wikiData?: WikipediaCityData | null) => {
    if (!cityData.currencyMultiplier) {
      const cur = cityData.currency?.toUpperCase() || 'USD';
      cityData.currencyMultiplier =
        cur === 'JPY' ? 110 :
        cur === 'KRW' ? 1350 :
        cur === 'EUR' ? 0.88 :
        cur === 'GBP' ? 0.74 :
        cur === 'AED' ? 2.7 :
        cur === 'AUD' ? 1.15 :
        cur === 'NZD' ? 1.22 :
        cur === 'BRL' ? 4.2 :
        cur === 'CAD' ? 1.0 :
        cur === 'CHF' ? 0.68 :
        cur === 'MXN' ? 15.0 :
        cur === 'ISK' ? 105 :
        cur === 'KES' ? 95 :
        cur === 'NOK' ? 8.2 :
        cur === 'CLP' ? 720 : 1.0;
    }
    const lat = Number(cityData.lat ?? wikiData?.lat) || 45.0;
    const lng = Number(cityData.lng ?? wikiData?.lng) || 0.0;
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${cityData.city}, ${cityData.country}`)}`;
    const wikipediaUrl = wikiData?.wikiUrl || `https://en.wikipedia.org/wiki/${encodeURIComponent(cityData.city)}`;
    const mapsCoordinates = `${lat >= 0 ? lat.toFixed(4) + '° N' : Math.abs(lat).toFixed(4) + '° S'}, ${lng >= 0 ? lng.toFixed(4) + '° E' : Math.abs(lng).toFixed(4) + '° W'}`;
    const elapsed = Date.now() - startTime;

    const completed = {
      ...cityData,
      id: cityData.id || sanitizedId,
      lat,
      lng,
      mapsUrl,
      wikipediaUrl,
      mapsSource: 'maps.google.com & wikipedia.org',
      mapsCoordinates,
      responseTimeMs: elapsed,
    };

    cityLookupCache.set(normKey, completed);
    return completed;
  };

  // 2. Fetch True Wikipedia Ground Truth (Coordinates, Extract, and Sovereignty)
  const wikiData = await fetchWikipediaCityData(query);

  // 3. Synthesize via Gemini 3.6 Flash Grounded by Wikipedia Ground Truth
  try {
    if (process.env.GEMINI_API_KEY) {
      const prompt = `You are a world-class automotive trade, geography, and regulatory intelligence system for 'Lot & Ledger'.
Use the following real-world verified data from Wikipedia.com and Google Maps for the city "${query}":

--- WIKIPEDIA GROUND TRUTH DOSSIER ---
City Title: "${wikiData?.title || query}"
Wikipedia Description: "${wikiData?.description || ''}"
Wikipedia Coordinates: ${wikiData?.lat !== null && wikiData?.lat !== undefined ? `${wikiData.lat}, ${wikiData.lng}` : 'Unspecified'}
Wikipedia Extract: "${wikiData?.extract?.slice(0, 900) || ''}"
Wikipedia Reference: "${wikiData?.wikiUrl || ''}"
--------------------------------------

Based on this ground truth from Wikipedia.com and real-world automotive regulations:
1. Determine the exact Sovereign Country, 2-letter ISO Country Code (e.g. JP, NO, DE, CL, IS, US, CA, EG, AE, BR, AU, etc.), Continent, and Flag Emoji.
2. Official national Currency code (e.g. JPY, NOK, EUR, CLP, ISK, USD, CAD, EGP, AED, BRL, AUD, etc.), Currency Symbol, and Exchange Multiplier relative to 1.0 CAD/USD.
3. Official Vehicle Roadworthiness Bureau / Motor Vehicle Agency (e.g., Japan: MLIT / Shaken; Norway: Statens vegvesen; Germany: TÜV Süd / DEKRA; Chile: Plantas de Revisión Técnica (PRT); UK: DVSA / MOT; Iceland: Bifreiðaskoðun Frumherji; California: BAR Smog Check; Quebec: SAAQ; etc.).
4. Climate classification (must be one of: 'arctic' | 'temperate_salt' | 'temperate_mild' | 'desert_arid' | 'tropical_humid' | 'mediterranean') and Climate Label.
5. Road salt rust risk factor (0.1 to 2.0x, high in salt belts/snow regions like Montreal/Oslo/Munich, low in desert/tropical like Dubai/Phoenix/Miami) and UV sun damage risk factor (0.1 to 2.0x).
6. Preferred vehicle classes array (from ['compact', 'sedan', 'suv', 'truck', 'van', 'sport', 'lux', 'hatch']).
7. Base registration fee and inspection cost in local currency units.
8. 2-sentence automotive context on terrain, road salt usage, altitude, and mechanical wear.
9. 2-sentence highlight of local market demand, popular models, and trade culture.

Return strictly a valid JSON object matching this structure:
{
  "city": "${wikiData?.title || query}",
  "country": "Official Country Name",
  "continent": "North America | South America | Europe | Asia | Africa | Middle East | Oceania",
  "countryCode": "2-letter ISO code",
  "flag": "Flag Emoji",
  "lat": ${wikiData?.lat ?? 45.0},
  "lng": ${wikiData?.lng ?? 0.0},
  "currency": "3-letter code",
  "currencySymbol": "symbol",
  "currencyMultiplier": 1.0,
  "taxRate": 0.15,
  "taxName": "Tax name",
  "climate": "arctic | temperate_salt | temperate_mild | desert_arid | tropical_humid | mediterranean",
  "climateLabel": "Descriptive label",
  "rustRisk": 1.2,
  "sunDamageRisk": 0.8,
  "preferredClasses": ["suv", "compact", "sedan"],
  "inspectionName": "Official Bureau Name",
  "baseRegCost": 110,
  "inspectionCost": 80,
  "description": "...",
  "experienceHighlight": "..."
}`;

      const geminiPromise = ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
        },
      });

      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 6500));
      const response: any = await Promise.race([geminiPromise, timeoutPromise]);

      if (response && response.text) {
        let cleanText = response.text.trim();
        cleanText = cleanText.replace(/```json|```/g, '').trim();
        const firstBrace = cleanText.indexOf('{');
        const lastBrace = cleanText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
          cleanText = cleanText.substring(firstBrace, lastBrace + 1);
          const parsed = JSON.parse(cleanText);
          if (parsed.city && parsed.country && parsed.country !== 'Global Region') {
            const finished = finalizeCityPayload(parsed, wikiData);
            return res.json({ location: finished });
          }
        }
      }
    }
  } catch (err) {
    console.warn('Gemini 3.6 Flash City Lookup fallback engaged:', err);
  }

  // 4. Robust Wikipedia Ground-Truth Fallback (Zero Hallucination)
  const fullText = ((wikiData?.description || '') + ' ' + (wikiData?.extract || '')).toLowerCase();
  let matchedReg = COUNTRY_AUTO_REGULATIONS.unitedstates;
  for (const [key, reg] of Object.entries(COUNTRY_AUTO_REGULATIONS)) {
    if (fullText.includes(key) || fullText.includes(reg.country.toLowerCase())) {
      matchedReg = reg;
      break;
    }
  }

  const resolvedCityName = wikiData?.title || (query.charAt(0).toUpperCase() + query.slice(1));
  const fallbackLocation = finalizeCityPayload({
    id: sanitizedId,
    city: resolvedCityName,
    country: matchedReg.country,
    continent: matchedReg.continent,
    countryCode: matchedReg.countryCode,
    flag: matchedReg.flag,
    lat: wikiData?.lat ?? (matchedReg.countryCode === 'JP' ? 35.0116 : matchedReg.countryCode === 'NO' ? 69.6492 : 45.0),
    lng: wikiData?.lng ?? (matchedReg.countryCode === 'JP' ? 135.7681 : matchedReg.countryCode === 'NO' ? 18.9553 : 0.0),
    currency: matchedReg.currency,
    currencySymbol: matchedReg.currencySymbol,
    currencyMultiplier: matchedReg.currencyMultiplier,
    taxRate: matchedReg.taxRate,
    taxName: matchedReg.taxName,
    climate: matchedReg.climate,
    climateLabel: matchedReg.climateLabel,
    rustRisk: matchedReg.rustRisk,
    sunDamageRisk: matchedReg.sunDamageRisk,
    preferredClasses: ['compact', 'sedan', 'suv'],
    inspectionName: matchedReg.inspectionName,
    baseRegCost: 110,
    inspectionCost: 85,
    description: wikiData?.extract
      ? wikiData.extract.slice(0, 180) + '...'
      : `Active automotive market in ${resolvedCityName}, ${matchedReg.country}. Subject to ${matchedReg.inspectionName} standards.`,
    experienceHighlight: `Sourced via Wikipedia.org and maps.google.com. Local vehicle registrations and commerce governed under ${matchedReg.country} law.`,
  }, wikiData);

  return res.json({ location: fallbackLocation });
});


// --- Gemini-Generated Regional Vehicle Listings ---
app.post('/api/ai/generate-listings', async (req, res) => {
  const { location, count = 8, day = 1 } = req.body;
  const locCity = location?.city || 'Montreal';
  const locCountry = location?.country || 'Canada';
  const locContinent = location?.continent || 'North America';
  const currency = location?.currency || 'CAD';
  const currencySymbol = location?.currencySymbol || '$';
  const multiplier = location?.currencyMultiplier || 1.0;
  const rustRisk = location?.rustRisk ?? 1.0;
  const climateLabel = location?.climateLabel || 'Temperate';
  const inspectionName = location?.inspectionName || 'Safety Standards Certificate';

  try {
    if (process.env.GEMINI_API_KEY) {
      const prompt = `You are an expert regional automotive used-car inventory engine for the tycoon game 'Lot & Ledger'.
Generate ${count} ultra-realistic, region-specific used vehicle classified listings for a dealership in ${locCity}, ${locCountry} (${locContinent}).

CRITICAL REGIONAL REQUIREMENTS:
1. BRANDS & MODELS: Use makes and models truly popular in ${locCity}, ${locCountry}.
2. PRICING IN LOCAL CURRENCY:
   - Prices MUST be in ${currency} (${currencySymbol}) realistic for that country.
3. DAMAGE & RUST CALIBRATED TO CLIMATE (${climateLabel}, Rust Risk: ${rustRisk}x):
4. AUTHENTIC CLASSIFIED AD: Mention ${locCity} districts and official ${inspectionName}.

Return ONLY a valid JSON array string without markdown fences matching:
[
  {
    "make": "Toyota",
    "model": "Land Cruiser Prado",
    "year": 2012,
    "cls": "suv",
    "drv": "4WD",
    "eng": "4.0L V6",
    "tr": "Automatic",
    "km": 168000,
    "price": ${Math.round(8500 * multiplier)},
    "rust": ${rustRisk > 1.3 ? 3 : rustRisk < 0.5 ? 0 : 1},
    "dents": 1,
    "repaint": false,
    "title": "clean",
    "issues": [
      { "label": "${rustRisk < 0.6 ? 'A/C Evaporator Leak' : 'Rusted Brake Line Union'}", "sys": "${rustRisk < 0.6 ? 'elect' : 'brake'}", "sev": 2, "parts": ${Math.round(220 * multiplier)}, "hrs": 2.5 }
    ],
    "sellerName": "Local Seller Name",
    "sellerType": "honest",
    "district": "${locCity} Metro District",
    "text": "Classified description mentioning ${inspectionName} and ${locCity}.",
    "src": "classified"
  }
]`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
        },
      });

      if (response && response.text) {
        const parsed = JSON.parse(response.text.trim());
        if (Array.isArray(parsed) && parsed.length > 0) {
          return res.json({ listings: parsed });
        }
      }
    }
  } catch (err) {
    console.warn('Gemini Listings Generation fallback engaged:', err);
  }

  // Regional procedural fallback generator
  const regionalPresets: Record<string, { make: string; model: string; cls: string; eng: string; tr: string; drv: string; base: number }[]> = {
    Asia: [
      { make: 'Toyota', model: 'Prius Hybrid', cls: 'hatch', eng: '1.8L Hybrid', tr: 'CVT', drv: 'FWD', base: 5200 },
      { make: 'Daihatsu', model: 'Tanto Custom', cls: 'compact', eng: '660cc Turbo', tr: 'CVT', drv: 'FWD', base: 3600 },
      { make: 'Honda', model: 'Fit e:HEV', cls: 'compact', eng: '1.5L Hybrid', tr: 'CVT', drv: 'FWD', base: 4600 },
      { make: 'Toyota', model: 'Crown Royal', cls: 'sedan', eng: '2.5L V6', tr: 'Automatic', drv: 'RWD', base: 7800 },
    ],
    default: [
      { make: 'Toyota', model: 'Corolla CE', cls: 'compact', eng: '1.8L I4', tr: 'Automatic', drv: 'FWD', base: 4200 },
      { make: 'Honda', model: 'Civic LX', cls: 'compact', eng: '1.8L I4', tr: 'Automatic', drv: 'FWD', base: 4400 },
      { make: 'Ford', model: 'F-150 XLT SuperCab', cls: 'truck', eng: '5.0L V8', tr: 'Automatic', drv: '4WD', base: 8900 },
    ],
  };

  const pool = regionalPresets[locContinent] || regionalPresets.default;
  const fallbackListings = Array.from({ length: count }).map((_, i) => {
    const carTemplate = pool[i % pool.length];
    const year = 2008 + Math.floor(Math.random() * 11);
    const km = 75000 + Math.floor(Math.random() * 160000);
    const price = Math.round((carTemplate.base * multiplier * (0.85 + Math.random() * 0.35)) / 50) * 50;

    return {
      make: carTemplate.make,
      model: carTemplate.model,
      year,
      cls: carTemplate.cls,
      drv: carTemplate.drv,
      eng: carTemplate.eng,
      tr: carTemplate.tr,
      km,
      price,
      rust: rustRisk >= 1.5 ? 2 : 0,
      dents: 1,
      repaint: false,
      title: 'clean',
      issues: [
        {
          label: 'Front Lower Control Arm Bushings',
          sys: 'susp',
          sev: 2,
          parts: Math.round(140 * multiplier),
          hrs: 2,
        },
      ],
      sellerName: `${locCity} Seller #${i + 1}`,
      sellerType: 'honest',
      district: `${locCity} District ${i + 1}`,
      text: `Listing in ${locCity}. Well maintained. Valid ${inspectionName}.`,
      src: i === 0 ? 'dealer' : 'classified',
    };
  });

  return res.json({ listings: fallbackListings });
});

// --- Gemini-Generated Regional Investment Pitches & Local Equities ---
app.post('/api/ai/generate-pitches', async (req, res) => {
  const { location } = req.body;
  const locCity = location?.city || 'Montreal';
  const locCountry = location?.country || 'Canada';
  const currencySymbol = location?.currencySymbol || '$';
  const multiplier = location?.currencyMultiplier || 1.0;

  try {
    if (process.env.GEMINI_API_KEY) {
      const prompt = `You are an investment venture analyst for 'Lot & Ledger'.
Generate 3 angel startup pitches and 4 local stock market equities for a business operating in ${locCity}, ${locCountry} (${location?.currency || 'CAD'}).

Respond with ONLY a clean JSON object with this exact structure:
{
  "pitches": [
    {
      "id": 101,
      "name": "Regional Startup Name in ${locCity}",
      "sec": "EV Mobility | Logistics | Auction Tech | Fleet Battery",
      "pitch": "Catchy 1-sentence venture pitch tailored to ${locCity}.",
      "ask": ${Math.round(4000 * multiplier)},
      "eq": 15,
      "rev": ${Math.round(850 * multiplier)},
      "claimed": ${Math.round(1200 * multiplier)},
      "dd": false,
      "flags": ["High customer acquisition cost"]
    }
  ],
  "stocks": [
    {
      "s": "TICKER",
      "n": "Official Regional Company Name",
      "k": "Automotive | Energy | Transit | Industrial",
      "p0": ${Math.round(45 * multiplier)},
      "d": 0.001,
      "v": 0.025
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
        },
      });

      if (response && response.text) {
        const parsed = JSON.parse(response.text.trim());
        if (parsed.pitches && parsed.stocks) {
          return res.json(parsed);
        }
      }
    }
  } catch (err) {
    console.warn('Gemini Pitches Generation fallback engaged:', err);
  }

  // Fallback regional investment pitches
  const fallbackPitches = [
    {
      id: 201,
      name: `${locCity} EV Fleet Diagnostic Hub`,
      sec: 'EV Mobility',
      pitch: `Rapid high-voltage battery health scanner for commercial fleets in ${locCity}.`,
      ask: Math.round(5000 * multiplier),
      eq: 15,
      rev: Math.round(900 * multiplier),
      claimed: Math.round(1400 * multiplier),
      dd: false,
      flags: ['High equipment lease overhead'],
    },
    {
      id: 202,
      name: `${locCity} Express Freight & Towing`,
      sec: 'Logistics',
      pitch: `On-demand flatbed car transport network servicing ${locCity} metro corridors.`,
      ask: Math.round(3500 * multiplier),
      eq: 12,
      rev: Math.round(750 * multiplier),
      claimed: Math.round(1100 * multiplier),
      dd: false,
      flags: ['Seasonal fuel price volatility'],
    },
  ];

  const fallbackStocks = [
    { s: `${locCity.slice(0, 3).toUpperCase()}-AUTO`, n: `${locCity} Motors Group`, k: 'Automotive', p0: Math.round(42 * multiplier), d: 0.001, v: 0.02 },
    { s: `${locCity.slice(0, 3).toUpperCase()}-LOG`, n: `${locCity} Express Transit`, k: 'Logistics', p0: Math.round(28 * multiplier), d: 0.0012, v: 0.018 },
  ];

  return res.json({ pitches: fallbackPitches, stocks: fallbackStocks });
});




// Vite Middleware for Dev / Static Files for Prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Lot & Ledger server listening on http://localhost:${PORT}`);
  });
}

startServer();
