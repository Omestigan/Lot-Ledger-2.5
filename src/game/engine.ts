import {
  CAT, DEALERS, ISSUES, KNOWN_WEAKPOINTS, NAMES, REGIONS, STOCKS, WT,
  clamp, getOrRegisterCatalogEntry,
} from './data';
import {
  Car, CarCatalogEntry, ConnectionGraph, GameMode, Issue, Listing, PlayerCharacter, Region,
  RegionId,
} from './types';
import { generateProceduralConnections, getActivePerks, unlockContact } from './connections';
import { blockers, estimate, fmt, mkt, quoteListing, scrapV, worth, setActiveCurrency } from './valuation';
import { sound } from './audio';
import { WorldLocation, PRESET_WORLD_CITIES } from './locations';
import { RivalDealership, INITIAL_RIVAL_DEALERSHIPS, tickRivalDealerships } from './rivals';
import { STARTING_ROLES } from './roles';

export interface GameState {
  v: number;
  seed: number;
  uid: number;
  lid: number;
  iid: number;
  day: number;
  cash: number;
  debt: number;
  credit: number;
  rep: number;
  mode: GameMode;
  region: RegionId;
  customLocation?: WorldLocation;
  rivals: RivalDealership[];
  skills: Record<string, number>;
  ins: boolean;
  insBilled?: number;
  tools: { obd: boolean; comp: boolean };
  slots: number;
  lic: boolean;
  partners: { mech: boolean; det: boolean; flip: boolean };
  visits: number;
  hrs: number;
  favours: number;
  gas: number;
  player: PlayerCharacter;
  connections: ConnectionGraph;
  listings: Listing[];
  cars: Car[];
  offers: any[];
  claims: any[];
  sales: number[];
  log: { d: number; m: string; $: number }[];
  stats: { flips: number; profit: number; best: number };
  over: 'won' | 'timeout' | 'bankrupt' | null;
  peak: number;
  // Staff
  staff: any[];
  pool: any[];
  auto: boolean;
  // Investments
  mk: Record<string, number[]>;
  hold: Record<string, { u: number; cost: number }>;
  pitches: any[];
  stakes: any[];
  // Legal
  suits: any[];
  // Imports / Exports
  imports: Listing[];
  transit: any[];
  // Dealership Empire & Clash of Clans Map System
  empire?: import('./empire').DealershipEmpireState;
  // Racing Stats & Track Elo
  racingStats?: {
    wins: number;
    losses: number;
    winStreak: number;
    pinkSlipsWon: number;
    pinkSlipsLost: number;
    totalEarnings: number;
    eloRating: number;
  };
}



export const LV = [0, 5, 14, 28, 48, 75, 110, 155, 210, 280];
export const lv = (skills: Record<string, number>, k: string) =>
  LV.filter((t) => (skills[k] || 0) >= t).length;

function createPRNG(seed: number) {
  let s = (seed + 0x6d2b79f5) | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function mkIssue(t: any, iidRef: { current: number }): Issue {
  iidRef.current++;
  const rng = Math.random();
  const parts = Math.round(t.lo + rng * (t.hi - t.lo));
  return {
    id: `${t.k}_${iidRef.current}`,
    k: t.k,
    label: t.label,
    sys: t.sys,
    sev: t.sev,
    lo: t.lo,
    hi: t.hi,
    parts,
    hrs: t.hrs,
    pen: Math.min(0.6, t.pen * (0.85 + Math.random() * 0.3)),
    det: t.det,
    block: t.block,
    fixed: false,
  };
}

export function genCar(
  e: CarCatalogEntry,
  type: string,
  src: string,
  city: any,
  uidRef: { current: number },
  iidRef: { current: number },
  reg: Region
): Car {
  const age = 2026 - e.year;
  const rel = e.rel;
  const colors: [string, string][] = [
    ['Silver', '#a9b2b8'], ['Black', '#252b30'], ['White', '#e8ebec'], ['Grey', '#6c767d'],
    ['Blue', '#2f5d9a'], ['Red', '#a8322d'], ['Green', '#3d6b52'], ['Gold', '#b59a5a'], ['Burgundy', '#6b2a35']
  ];
  const col = colors[Math.floor(Math.random() * colors.length)];
  const use = (e.cls === 'sedan' || e.cls === 'suv' || e.cls === 'van')
    ? (Math.random() < 0.8 ? 'personal' : ['fleet', 'rental', 'taxi'][Math.floor(Math.random() * 3)])
    : 'personal';

  const um = { personal: 1, fleet: 1.25, taxi: 1.7, rental: 1.15 }[use] || 1;
  const km = Math.round(clamp(e.kmT * (0.72 + Math.random() * 0.56) * um, 15000, 520000) / 100) * 100;

  let q = 0.58 + (rel - 0.5) * 0.45 + (Math.random() * 0.52 - 0.28) - Math.min(0.14, age * 0.005) - (use === 'personal' ? 0 : 0.08);
  q += ({ dealer: 0.1, flipper: 0.04, scammer: -0.04, tow: -0.28, auction: -0.05 }[type] || 0);
  q = clamp(q, 0.06, 0.96);

  let tr = 'Automatic';
  if (e.tr === 'm') tr = 'Manual';
  else if (e.tr === 'am') tr = (e.cls === 'sport' || e.cls === 'conv') ? 'Manual' : (Math.random() < 0.72 ? 'Automatic' : 'Manual');
  else if (e.tr === 'c') tr = 'CVT';
  else tr = (e.year >= 2008 && Math.random() < 0.78) ? 'CVT' : 'Manual';

  const man = tr === 'Manual';
  const issues: Issue[] = [];
  const used: Record<string, boolean> = {};
  const n = Math.max(0, Math.round((1 - q) * 5.4 + (Math.random() * 1.5 - 0.4)));
  const pool = ISSUES.filter((i) => !(i.man && !man) && !(i.auto && man));

  for (let k = 0; k < n; k++) {
    const avail = pool.filter((x) => !used[x.k]);
    if (!avail.length) break;
    const selected = avail[Math.floor(Math.random() * avail.length)];
    used[selected.k] = true;
    issues.push(mkIssue(selected, iidRef));
  }

  const kn = KNOWN_WEAKPOINTS[e.kn];
  if (kn) {
    let ok = true;
    const p = kn[8] * Math.min(1.3, km / e.kmT);
    if (e.kn === 'cvt') ok = tr === 'CVT';
    if (e.kn === 'dct') ok = tr === 'DCT';
    if (e.kn === 'hg') ok = e.year <= 2011;
    if (e.kn === 'n20') ok = e.year >= 2012;
    if (e.kn === 'theta') ok = e.year >= 2011 && e.year <= 2014;
    if (ok && Math.random() < p) {
      issues.push(mkIssue({
        k: e.kn,
        label: kn[0],
        sys: kn[1],
        sev: kn[2],
        lo: kn[3],
        hi: kn[4],
        hrs: kn[5],
        pen: kn[6],
        det: { walk: kn[7][0], drive: kn[7][1], obd: kn[7][2], ppi: kn[7][3] },
        block: false
      }, iidRef));
    }
  }

  let rv = e.rust * reg.rust * (age / 18) * (0.3 + Math.random() * 1.2) * 0.65 + (e.kn === 'frame' ? 0.15 : 0);
  let rust = rv < 0.1 ? 0 : rv < 0.24 ? 1 : rv < 0.45 ? 2 : rv < 0.7 ? 3 : 4;
  if (type === 'dealer' && rust >= 3) rust = 2;

  const rep = Math.random() < (0.08 + (1 - q) * 0.2);
  let title: 'clean' | 'vga' | 'rebuilt' | 'irreparable' = 'clean';
  if (Math.random() < (0.18 + ((type === 'auction' || type === 'tow') ? 0.28 : 0)) && type !== 'dealer') {
    title = ['vga', 'rebuilt', 'rebuilt', 'vga', 'irreparable'][Math.floor(Math.random() * 5)] as any;
  }
  const masks = (type === 'flipper' || type === 'scammer') && title !== 'clean' && Math.random() < 0.75;
  let carReg: any = city.on ? 'oop' : (type === 'auction' || type === 'tow') ? 'cancelled' : type === 'dealer' ? 'valid' : Math.random() < 0.72 ? 'valid' : 'expired';

  const rolled = Math.random() < ({ scammer: 0.35, flipper: 0.12, optimistic: 0.04, honest: 0.01, uninformed: 0.01 }[type] || 0);

  uidRef.current++;
  const c: Car = {
    uid: uidRef.current,
    cid: e.id,
    trim: Math.floor(Math.random() * 4),
    color: col,
    vin: `2T1${Math.random().toString(36).slice(2, 8).toUpperCase()}${Math.floor(100000 + Math.random() * 900000)}X`,
    owners: Math.floor(1 + Math.random() * Math.min(5, Math.ceil(age / 4))),
    use,
    km,
    shown: rolled ? Math.round(km * (0.5 + Math.random() * 0.25) / 100) * 100 : km,
    rolled,
    tr,
    eng: e.eng[(e.year + e.make.length) % e.eng.length],
    q,
    issues: type === 'dealer' ? issues.filter((x) => !x.block && (x.sev < 3 || Math.random() < 0.4)) : issues,
    rust,
    dents: Math.floor(Math.random() * Math.round((1 - q) * 4.5 + 1)),
    repaint: rep,
    gaps: rep && Math.random() < 0.4,
    interior: clamp(Math.round((1 - q) * 3.2 + (Math.random() * 1.1 - 0.5)), 0, 3),
    water: Math.random() < (0.03 + (1 - q) * 0.06),
    tread: Math.floor(8 + Math.random() * 88),
    winter: Math.random() < 0.35,
    modded: Math.random() < (e.cls === 'sport' ? 0.25 : 0.07),
    title,
    adTitle: masks ? 'clean' : title,
    reg: carReg,
    lien: (type === 'dealer' || Math.random() > 0.06) ? 0 : Math.floor(600 + Math.random() * 2000),
    lienPaid: false,
    cloned: type === 'scammer' && Math.random() < 0.4,
    recall: (e.kn === 'takata' || e.kn === 'ign') && Math.random() < 0.5 && (e.year <= 2012 || e.kn === 'ign'),
    receipts: Math.random() < (type === 'honest' ? 0.3 : 0.1) ? Math.floor(1 + Math.random() * 2) : 0,
    masked: type === 'flipper',
    detail: false,
    regd: false,
    latent: [],
    job: null,
    sale: null,
    idle: 0,
    basis: 0,
    partGrade: 'new',
    know: {
      issues: {},
      rust: null,
      dents: null,
      interior: null,
      tires: null,
      accident: false,
      water: false,
      odo: false,
      odoSus: false,
      hist: null,
      ppi: false,
      said: [],
      mech: null,
      full: false,
    },
  };

  c.issues.forEach((i) => {
    i.sk = type === 'uninformed' ? Math.random() < 0.08 : type === 'honest' ? Math.random() < 0.45 : type === 'optimistic' ? Math.random() < 0.55 : type === 'flipper';
  });

  return c;
}

export function adText(l: Listing, location?: WorldLocation): string {
  const c = l.car;
  const t = l.seller.type;
  const sk = c.issues.filter((i) => i.sk && !i.fixed).map((i) => i.label.toLowerCase().replace(/ \(.*\)/, ''));
  const locCity = location?.city || l.city.n;
  const insName = location?.inspectionName || 'Safety Inspection';

  if (l.src === 'auction') return `Regional Auction Lot (${locCity}): sold as-is, sight unseen. 10% buyer premium. Title and ${insName} unverified.`;
  if (l.src === 'tow') return `Impound yard stock in ${locCity}, no keys. Sold as-is for parts or repair. Cash only, towing required.`;
  
  if (t === 'honest') {
    const openers = [`Selling my ${locCity} daily commuter.`, 'Well kept, highway driven.', 'Second family vehicle, no longer needed.'];
    return `${openers[Math.floor(Math.random() * openers.length)]}${sk.length ? ` Known issues: ${sk.slice(0, 2).join(', ')}.` : ` Passed recent ${insName}.`} ${location?.rustRisk && location.rustRisk < 0.5 ? '100% rust-free frame.' : c.winter ? 'Winter tire package included.' : 'All-season tires fitted.'}`;
  }
  if (t === 'optimistic') {
    return `Runs great in ${locCity}! Needs minor TLC only. Excellent chassis for the year. Price firm-ish. ${insName} ready.`;
  }
  if (t === 'uninformed') {
    return `Inherited in ${locCity}, barely driven lately. I don’t know much about cars. Selling as-is.`;
  }
  if (t === 'flipper') {
    return `Freshly prepped in ${locCity}! All fluids done, clean title. Passed ${insName}. Must see! Serious buyers only.`;
  }
  if (t === 'scammer') {
    return `Must sell today in ${locCity}, relocating overseas. Unbeatable price for quick sale. Wire deposit to hold.`;
  }
  return `Certified inventory in ${locCity}. Sold with ${insName} certificate. Trade-ins and dealer financing welcome.`;
}

export function priceListing(
  l: Listing,
  region: Region,
  perks = getActivePerks({ contacts: {}, links: [], rootId: '' }),
  location?: WorldLocation
) {
  const c = l.car;
  const t = l.seller.type;
  const mult = location?.currencyMultiplier || 1.0;
  const vt = worth(c, 'true', perks) * mkt(c, region) * mult;
  const vs = worth(c, 'seen', perks) * mkt(c, region) * mult;
  let ask = vt;
  let res = vt * 0.9;

  if (l.src === 'auction') {
    res = vt * (0.62 + Math.random() * 0.33);
    ask = res * (0.55 + Math.random() * 0.2);
  } else if (l.src === 'tow') {
    ask = Math.max(Math.round(scrapV(c, perks) * mult) + 60, vs * (0.3 + Math.random() * 0.2));
    res = ask * 0.9;
  } else {
    const multipliers: Record<string, [number, number, number]> = {
      honest: [0.64, 0.86, 0.9],
      optimistic: [0.8, 1.05, 0.85],
      uninformed: [0.52, 0.78, 0.92],
      flipper: [0.9, 1.06, 0.93],
      scammer: [0.4, 0.58, 1],
      dealer: [1.1, 1.3, 0.95],
    };
    const m = multipliers[t] || [0.8, 1.0, 0.9];
    const base = t === 'honest' || t === 'uninformed' || t === 'dealer' ? vt : vs;
    ask = base * (m[0] + Math.random() * (m[1] - m[0])) * (l.city.adj || 1);
    res = ask * m[2] * (0.97 + Math.random() * 0.06);
    if (l.lead) {
      ask *= 0.88;
      res *= 0.88;
    }
  }

  l.ask = Math.max(Math.round(scrapV(c, perks) * mult), Math.round(ask / 25) * 25);
  l.reserve = Math.max(Math.round(scrapV(c, perks) * mult), Math.round(res / 10) * 10);
  l.ask = Math.max(l.ask, l.reserve);
}

export function genListing(
  state: GameState,
  opts: { cheap?: boolean; lead?: boolean } = {}
): Listing {
  const region = REGIONS[state.region] || REGIONS.qc;
  const loc = state.customLocation;
  const r = Math.random();
  const src = (opts.cheap || opts.lead) ? 'classified' : r < 0.68 ? 'classified' : r < 0.8 ? 'dealer' : r < 0.9 ? 'auction' : 'tow';

  // Regional vehicle preference weighting
  let candidatePool = CAT;
  if (loc && loc.preferredClasses && loc.preferredClasses.length > 0 && Math.random() < 0.72) {
    const preferred = CAT.filter((entry) => loc.preferredClasses.includes(entry.cls));
    if (preferred.length > 0) candidatePool = preferred;
  }

  let best = candidatePool[0];
  let bw = -1;
  for (let i = 0; i < 5; i++) {
    const e = candidatePool[Math.floor(Math.random() * candidatePool.length)];
    const w = Math.random() / (1 + e.base / ((src === 'dealer' ? 7000 : 3800) * (opts.cheap ? 0.5 : 1)));
    if (w > bw) {
      bw = w;
      best = e;
    }
  }

  const types = [
    { k: 'honest', w: 40 }, { k: 'optimistic', w: 26 }, { k: 'uninformed', w: 12 },
    { k: 'flipper', w: 14 }, { k: 'scammer', w: 8 }
  ];
  let type = src === 'dealer' ? 'dealer' : src === 'auction' ? 'auction' : src === 'tow' ? 'tow' : types[Math.floor(Math.random() * types.length)].k as any;
  if (opts.lead) type = 'honest';

  // Regional City District Matching
  let cityObj = region.cities[Math.floor(Math.random() * region.cities.length)];
  if (loc) {
    const districts = [
      `${loc.city} Metro Central`,
      `${loc.city} Financial District`,
      `${loc.city} Suburbs`,
      `${loc.city} Port & Cargo Corridor`,
      `${loc.city} Airport Belt`,
    ];
    const dName = districts[Math.floor(Math.random() * districts.length)];
    cityObj = {
      n: dName,
      v: 1 + Math.floor(Math.random() * 2),
      tow: 80 + Math.floor(Math.random() * 60),
      adj: 0.95 + Math.random() * 0.15,
      w: 30,
      on: 1,
    };
  }

  const c = genCar(best, type, src, cityObj, { current: state.uid }, { current: state.iid }, region);

  // Calibrate rust and wear to player's global location
  if (loc) {
    c.rust = Math.min(5, Math.max(0, Math.round(c.rust * loc.rustRisk)));
    if (loc.climate === 'desert_arid' && Math.random() < 0.35) {
      c.repaint = true; // Clearcoat sun baking in Sonoran/Arabian desert climates
    }
  }

  state.uid = Math.max(state.uid, c.uid);

  // Localized Seller Name Generators
  let sellerName = NAMES[Math.floor(Math.random() * NAMES.length)];
  let dealerName = DEALERS[Math.floor(Math.random() * DEALERS.length)];

  if (loc) {
    const cCode = loc.countryCode;
    if (cCode === 'JP') {
      const jpPrivate = ['Kenji Sato', 'Hiroshi Tanaka', 'Daisuke Ito', 'Takashi Takahashi', 'Yuki Kobayashi', 'Shinji Watanabe'];
      const jpDealer = ['Shinjuku Auto Exchange', 'Tokai Wholesale Motors', 'Kanto JCI Trade Depot', 'Nippon Auto Direct'];
      sellerName = jpPrivate[Math.floor(Math.random() * jpPrivate.length)];
      dealerName = jpDealer[Math.floor(Math.random() * jpDealer.length)];
    } else if (cCode === 'DE' || cCode === 'FR' || cCode === 'GB' || loc.continent === 'Europe') {
      const euPrivate = ['Oliver Smith', 'Hans Richter', 'Claire Dubois', 'Mateo Rossi', 'Klaus Weber', 'Svetlana Kowalski'];
      const euDealer = [`${loc.city} Auto Haus`, `${loc.city} Continental Prestige`, 'Bavarian Wholesale Exchange', 'EuroTrade Direct'];
      sellerName = euPrivate[Math.floor(Math.random() * euPrivate.length)];
      dealerName = euDealer[Math.floor(Math.random() * euDealer.length)];
    } else if (cCode === 'AE' || cCode === 'SA' || loc.continent === 'Middle East') {
      const mePrivate = ['Tariq Al-Mansoor', 'Rashid Hassan', 'Zayd Farooq', 'Faisal Al-Otaibi', 'Karim El-Sayed'];
      const meDealer = [`${loc.city} Desert Motors`, 'Arabian Gulf Auto Exchange', 'Emirates Wholesale Trade', 'Apex Desert Fleet'];
      sellerName = mePrivate[Math.floor(Math.random() * mePrivate.length)];
      dealerName = meDealer[Math.floor(Math.random() * meDealer.length)];
    } else if (cCode === 'US' || cCode === 'CA') {
      const naPrivate = ['Brett Walker', 'Caleb Johnson', 'Elena Vance', 'Marc-André Lapointe', 'Samantha Drake', 'Dave Miller'];
      const naDealer = [`${loc.city} Metro Exchange`, `${loc.city} Auto Lot`, 'Tri-City Fleet Wholesale', 'Apex Precision Motors'];
      sellerName = naPrivate[Math.floor(Math.random() * naPrivate.length)];
      dealerName = naDealer[Math.floor(Math.random() * naDealer.length)];
    }
  }

  state.lid++;
  const l: Listing = {
    id: state.lid,
    car: c,
    src,
    city: cityObj,
    lead: opts.lead,
    seller: {
      type,
      name: src === 'dealer' ? dealerName : sellerName,
      claims: type === 'flipper' || type === 'scammer' ? 'private' : src === 'dealer' ? 'dealer' : 'private',
    },
    posted: state.day,
    expires: state.day + (src === 'dealer' ? 25 : src === 'auction' ? 3 : src === 'tow' ? 12 : 9),
    tow: cityObj.tow + Math.floor(Math.random() * 30),
    met: -1,
    asked: {},
    mood: 0,
    rounds: 0,
    deal: 0,
    reserve: 0,
    ask: 0,
    text: '',
    done: {},
  };

  priceListing(l, region, getActivePerks(state.connections), loc);
  l.text = adText(l, loc);
  return l;
}

export async function fetchAiRegionalListings(
  location: WorldLocation,
  state: GameState,
  count = 8
): Promise<Listing[]> {
  try {
    const res = await fetch('/api/ai/generate-listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location,
        count,
        day: state.day,
      }),
    });
    const data = await res.json();
    if (res.ok && Array.isArray(data.listings) && data.listings.length > 0) {
      return data.listings.map((raw: any) => {
        state.lid++;
        state.uid++;

        const entry = getOrRegisterCatalogEntry({
          make: raw.make,
          model: raw.model,
          year: raw.year || 2012,
          cls: raw.cls || 'compact',
          drv: raw.drv || 'FWD',
          tr: raw.tr || 'Automatic',
          eng: raw.eng || '2.0L I4',
          base: raw.price || 4500,
        });

        const issues: Issue[] = (raw.issues || []).map((iss: any, idx: number) => {
          state.iid++;
          return {
            id: `ai_iss_${state.iid}_${idx}`,
            k: 'ai',
            label: iss.label || 'Mechanical Wear',
            sys: iss.sys || 'eng',
            sev: iss.sev || 2,
            lo: Math.round((iss.parts || 120) * 0.8),
            hi: Math.round((iss.parts || 120) * 1.3),
            parts: iss.parts || 120,
            hrs: iss.hrs || 2,
            pen: 0.15,
            det: { walk: 0.5, drive: 0.7, obd: 0.8, ppi: 0.95 },
            block: false,
            fixed: false,
          };
        });

        const colors: [string, string][] = [
          ['Silver', '#a9b2b8'], ['Black', '#252b30'], ['White', '#e8ebec'], ['Grey', '#6c767d'],
          ['Blue', '#2f5d9a'], ['Red', '#a8322d'], ['Green', '#3d6b52'], ['Gold', '#b59a5a'], ['Burgundy', '#6b2a35']
        ];
        const col = colors[Math.floor(Math.random() * colors.length)];

        const car: Car = {
          uid: state.uid,
          cid: entry.id,
          trim: Math.floor(Math.random() * 4),
          color: col,
          vin: `2T1${Math.random().toString(36).slice(2, 8).toUpperCase()}${Math.floor(100000 + Math.random() * 900000)}X`,
          owners: Math.floor(1 + Math.random() * 3),
          use: 'personal',
          km: raw.km || 135000,
          shown: raw.km || 135000,
          rolled: false,
          tr: raw.tr || 'Automatic',
          eng: raw.eng || '2.0L I4',
          q: 0.7,
          issues,
          rust: raw.rust ?? Math.min(4, Math.round(location.rustRisk * 1.5)),
          dents: raw.dents ?? 1,
          repaint: raw.repaint ?? (location.climate === 'desert_arid' && Math.random() < 0.4),
          gaps: false,
          interior: location.climate === 'desert_arid' ? 2 : 1,
          water: location.climate === 'tropical_humid' && Math.random() < 0.25,
          tread: Math.floor(25 + Math.random() * 65),
          winter: location.climate === 'arctic' || location.climate === 'temperate_salt',
          modded: false,
          title: raw.title || 'clean',
          adTitle: raw.title || 'clean',
          reg: 'valid',
          lien: 0,
          lienPaid: false,
          cloned: false,
          recall: false,
          receipts: Math.random() < 0.3 ? 2 : 0,
          masked: false,
          detail: false,
          regd: false,
          latent: [],
          job: null,
          sale: null,
          idle: 0,
          basis: 0,
          partGrade: 'new',
          know: {
            issues: {},
            rust: null,
            dents: null,
            interior: null,
            tires: null,
            accident: false,
            water: false,
            odo: false,
            odoSus: false,
            hist: null,
            ppi: false,
            said: [],
            mech: null,
            full: false,
          },
        };

        const cityObj = {
          n: raw.district || `${location.city} Central District`,
          v: 1 + Math.floor(Math.random() * 2),
          tow: Math.round(80 * (location.currencyMultiplier || 1)),
          adj: 1.0,
          w: 30,
          on: 1,
        };

        const price = Math.round((raw.price || entry.base) / 25) * 25;

        const listing: Listing = {
          id: state.lid,
          car,
          src: raw.src || 'classified',
          city: cityObj,
          seller: {
            type: raw.sellerType || 'honest',
            name: raw.sellerName || `${location.city} Private Owner`,
            claims: 'private',
          },
          posted: state.day,
          expires: state.day + 14,
          tow: cityObj.tow,
          met: -1,
          asked: {},
          mood: 0,
          rounds: 0,
          deal: 0,
          reserve: Math.round(price * 0.9),
          ask: price,
          text: raw.text || `Offering this well maintained ${entry.name} in ${location.city}. Clean title, passed ${location.inspectionName}.`,
          done: {},
        };

        return listing;
      });
    }
  } catch (e) {
    console.warn('Failed to fetch AI regional listings:', e);
  }
  return [];
}

export async function fetchAiRegionalStaff(location: WorldLocation, connections: any[] = [], count = 4): Promise<any[]> {
  try {
    const res = await fetch('/api/ai/generate-staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location, connections, count }),
    });
    const data = await res.json();
    if (res.ok && Array.isArray(data.candidates)) {
      return data.candidates;
    }
  } catch (e) {
    console.warn('Failed to fetch AI regional staff:', e);
  }
  return [];
}

export async function fetchAiRegionalPitches(location: WorldLocation): Promise<{ pitches: any[]; stocks: any[] } | null> {
  try {
    const res = await fetch('/api/ai/generate-pitches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location }),
    });
    const data = await res.json();
    if (res.ok && data.pitches && data.stocks) {
      return data;
    }
  } catch (e) {
    console.warn('Failed to fetch AI regional pitches:', e);
  }
  return null;
}


export function seedMarket(state: GameState) {
  while (state.listings.length < 16) {
    state.listings.push(genListing(state));
  }
  let tries = 0;
  while (state.listings.filter((l) => l.ask <= 1700 && l.src === 'classified').length < 4 && tries++ < 40) {
    state.listings.push(genListing(state, { cheap: true }));
  }
}

export function createNewGame(regionId: RegionId = 'qc', mode: GameMode = 'free', player?: PlayerCharacter, location?: WorldLocation): GameState {
  const seed = (Math.random() * 2147483647) | 0;
  const pChar: PlayerCharacter = player || {
    name: 'Alex',
    skin: 1,
    hair: 1,
    style: 0,
    shirt: 0,
    bg: 'none',
  };

  const activeLoc = location || PRESET_WORLD_CITIES[0];
  const mult = activeLoc.currencyMultiplier || 1.0;
  setActiveCurrency(activeLoc.currencySymbol, mult);

  // Build connections graph
  const connections = generateProceduralConnections(seed, pChar.bg);

  // Look up selected role
  const matchedRole = STARTING_ROLES.find((r) => r.id === pChar.role) || STARTING_ROLES[0];
  const initialCash = Math.round(matchedRole.startingCash * mult);
  const initialDebt = Math.round(matchedRole.startingDebt * mult);
  const initialRep = matchedRole.initialRep;
  const initialFavours = matchedRole.initialFavours;
  const initialTools = { ...matchedRole.startingTools };
  const initialSkills = { ...matchedRole.skills };
  const hasLic = matchedRole.hasCommercialLicense;

  const state: GameState = {
    v: 2,
    seed,
    uid: 1,
    lid: 1,
    iid: 0,
    day: 1,
    cash: initialCash,
    debt: initialDebt,
    credit: 600,
    rep: initialRep,
    mode,
    region: regionId,
    customLocation: activeLoc,
    rivals: JSON.parse(JSON.stringify(INITIAL_RIVAL_DEALERSHIPS)),
    skills: initialSkills,
    ins: false,
    tools: initialTools,
    slots: hasLic ? 2 : 1,
    lic: hasLic,
    partners: { mech: false, det: false, flip: false },
    visits: 3,
    hrs: 6,
    favours: initialFavours,
    gas: 0,
    player: pChar,
    connections,
    listings: [],
    cars: [],
    offers: [],
    claims: [],
    sales: [],
    log: [{ d: 1, m: `Established dealership headquarters in ${activeLoc.city}, ${activeLoc.country} as ${matchedRole.name} with ${activeLoc.currencySymbol}${initialCash.toLocaleString()}.`, $: initialCash }],
    stats: { flips: 0, profit: 0, best: 0 },
    over: null,
    peak: initialCash,
    staff: [],
    pool: [],
    auto: true,
    mk: {},
    hold: {},
    pitches: [],
    stakes: [],
    suits: [],
    imports: [],
    transit: [],
    empire: {
      level: 1,
      reputationXp: 120,
      gridWidth: 8,
      gridHeight: 6,
      buildings: [
        {
          id: 'bld_showroom',
          typeId: 'showroom',
          name: 'Executive Glass Showroom',
          level: 1,
          maxLevel: 5,
          gridX: 2,
          gridY: 1,
          slotCapacityBonus: 2,
          repBonus: 10,
          revenuePerDay: 450,
          tuningDiscountPct: 0,
          unlockCost: 0,
          upgradeCost: 5000,
          description: 'Polished marble floor showroom with spotlight turntables. Increases lot slot capacity and customer walk-ins.',
          icon: '🏛️',
        },
        {
          id: 'bld_workshop',
          typeId: 'workshop',
          name: 'Master Mechanical Service Bay',
          level: 1,
          maxLevel: 5,
          gridX: 5,
          gridY: 1,
          slotCapacityBonus: 1,
          repBonus: 5,
          revenuePerDay: 250,
          tuningDiscountPct: 5,
          unlockCost: 2000,
          upgradeCost: 4000,
          description: 'Equipped with hydraulic 2-post lifts, snap-on diagnostic rollaway toolboxes, and engine hoists.',
          icon: '🔧',
        },
        {
          id: 'bld_dyno_lab',
          typeId: 'dyno_lab',
          name: 'All-Wheel Dyno Tuning Cell',
          level: 1,
          maxLevel: 5,
          gridX: 5,
          gridY: 3,
          slotCapacityBonus: 0,
          repBonus: 8,
          revenuePerDay: 600,
          tuningDiscountPct: 10,
          unlockCost: 4500,
          upgradeCost: 6500,
          description: 'In-ground high-speed AWD roller dynamometer with wideband exhaust sniffer and high-velocity cooling fans.',
          icon: '🏎️',
        },
        {
          id: 'bld_detailing_bay',
          typeId: 'detailing_bay',
          name: 'Ceramic Coating & Paint Booth',
          level: 1,
          maxLevel: 4,
          gridX: 1,
          gridY: 3,
          slotCapacityBonus: 1,
          repBonus: 6,
          revenuePerDay: 350,
          tuningDiscountPct: 0,
          unlockCost: 3000,
          upgradeCost: 4500,
          description: 'Downdraft baking spray booth and dual-action rotary polishers for mirror finishes and ceramic wraps.',
          icon: '✨',
        },
      ],
      displayCars: [],
      totalVisitorsToday: 24,
      passiveDailyRevenue: 1650,
    },
    racingStats: {
      wins: 0,
      losses: 0,
      winStreak: 0,
      pinkSlipsWon: 0,
      pinkSlipsLost: 0,
      totalEarnings: 0,
      eloRating: 1200,
    },
  };


  // Seed stocks market history
  STOCKS.forEach((t) => {
    let p = t.p0;
    const h = [];
    for (let i = 0; i < 40; i++) {
      p *= 1 + t.d + t.v * (Math.random() * 2 - 1);
      h.push(+p.toFixed(2));
    }
    state.mk[t.s] = h;
  });

  seedMarket(state);
  return state;
}

export function calculateNetWorth(state: GameState): number {
  const region = REGIONS[state.region] || REGIONS.qc;
  const perks = getActivePerks(state.connections);
  const carsValue = state.cars.reduce((sum, c) => {
    const val = worth(c, 'true', perks) * mkt(c, region, state.gas) * 0.92;
    return sum + (c.lienFlag && !c.lienPaid ? val - c.lien : val);
  }, 0);

  let portfolioVal = 0;
  Object.keys(state.hold).forEach((k) => {
    const h = state.hold[k];
    const prices = state.mk[k];
    const currentPrice = prices ? prices[prices.length - 1] : 0;
    portfolioVal += h.u * currentPrice;
  });

  return Math.round(state.cash - state.debt + carsValue + portfolioVal);
}
