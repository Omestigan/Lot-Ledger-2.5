export type RegionId = 'qc' | 'on' | 'mi' | 'ns' | 'ab' | 'bc';

export type GameMode = 'free' | 'twelve' | 'iron';

export interface CarCatalogEntry {
  id: number;
  make: string;
  model: string;
  year: number;
  anc: number;
  mid: number;
  cls: 'compact' | 'sedan' | 'suv' | 'truck' | 'van' | 'sport' | 'lux' | 'hatch' | 'conv';
  drv: 'FWD' | 'RWD' | 'AWD' | '4WD';
  tr: string;
  rel: number;
  rust: number;
  kn: string;
  eng: string[];
  base: number;
  kmT: number;
  name: string;
}

export interface Issue {
  id: string;
  k: string;
  label: string;
  sys: string;
  sev: number;
  lo: number;
  hi: number;
  parts: number;
  hrs: number;
  pen: number;
  det: { walk: number; drive: number; obd: number; ppi: number };
  block: boolean;
  fixed: boolean;
  sk?: boolean;
}

export interface Car {
  uid: number;
  cid: number;
  trim: number;
  color: [string, string];
  vin: string;
  owners: number;
  use: string;
  km: number;
  shown: number;
  rolled: boolean;
  tr: string;
  eng: string;
  q: number;
  issues: Issue[];
  rust: number;
  dents: number;
  repaint: boolean;
  gaps: boolean;
  interior: number;
  water: boolean;
  tread: number;
  winter: boolean;
  modded: boolean;
  title: 'clean' | 'vga' | 'rebuilt' | 'irreparable';
  adTitle: string;
  reg: 'valid' | 'expired' | 'cancelled' | 'oop' | 'riv';
  lien: number;
  lienPaid: boolean;
  lienFlag?: boolean;
  cloned: boolean;
  recall: boolean;
  receipts: number;
  masked: boolean;
  detail: boolean;
  regd: boolean;
  dealerOK?: boolean;
  latent: { label: string; cost: number; due: number }[];
  job: { done: number; kind: string; desc: string; fix?: string[]; sev?: number; fn?: string } | null;
  sale: { ask: number; disc: boolean; ad: number; listed: number } | null;
  idle: number;
  basis: number;
  bought?: number;
  partGrade: 'new' | 'after' | 'used';
  origin?: { type: string; src: string; name: string };
  know: {
    issues: Record<string, string>;
    rust: number | null;
    dents: number | null;
    interior: number | null;
    tires: { tread: number; winter: boolean } | null;
    accident: boolean;
    water: boolean;
    odo: boolean;
    odoSus: boolean;
    hist: any;
    ppi: boolean;
    said: string[];
    mech: string | null;
    full: boolean;
  };
  // Custom Parts & Tuning Specs
  tuning?: {
    stage?: number;
    parts?: string[]; // part IDs
    hpBonus?: number;
    torqueBonus?: number;
    weightReductionKg?: number;
    customWrap?: { name: string; hex: string };
    camber?: number;
    boostPsi?: number;
    gearRatioBias?: 'short' | 'balanced' | 'tall';
    suspensionStiffness?: number;
    aeroWing?: boolean;
    exhaustNote?: 'quiet' | 'sport' | 'straightpipe';
    totalInvested?: number;
  };
  perfMetrics?: {
    hp: number;
    torque: number;
    weightKg: number;
    topSpeedKmh: number;
    topSpeedMph: number;
    zeroToSixtySec: number;
    quarterMileSec: number;
    fuelL100km: number;
    fuelMpg: number;
    handlingScore: number;
    reliabilityScore: number;
  };
}



export interface Listing {
  id: number;
  car: Car;
  src: 'classified' | 'dealer' | 'auction' | 'tow' | 'import';
  imp?: 'us' | 'jp' | 'de';
  city: { n: string; v: number; tow: number; adj: number; on?: number };
  lead?: boolean;
  seller: {
    type: 'honest' | 'optimistic' | 'uninformed' | 'flipper' | 'scammer' | 'dealer';
    name: string;
    claims: string;
  };
  posted: number;
  expires: number;
  tow: number;
  met: number;
  asked: Record<string, number>;
  mood: number;
  rounds: number;
  deal: number;
  reserve: number;
  ask: number;
  text: string;
  done: Record<string, number>;
  motivated?: boolean;
}

export interface Region {
  id: RegionId;
  name: string;
  lon: number;
  lat: number;
  lx: number;
  ly: number;
  auth: string;
  taxN: string;
  priv: number;
  dealer: number;
  regFee: number;
  rust: number;
  ins: number;
  win: 'law' | 'soft' | 'none';
  bias: Record<string, number>;
  blurb: string;
  cities: { n: string; v: number; tow: number; adj: number; w: number; on: number }[];
}

export type ContactCategory =
  | 'mechanic'
  | 'wholesaler'
  | 'auction'
  | 'insider'
  | 'collector'
  | 'underground'
  | 'logistics';

export type ContactTier = 'rookie' | 'established' | 'elite' | 'shadow';

export interface ConnectionPerk {
  id: string;
  title: string;
  description: string;
  type:
    | 'discount_parts'
    | 'discount_shop'
    | 'free_ppi'
    | 'free_history'
    | 'free_obd'
    | 'auction_no_fee'
    | 'tow_cap'
    | 'import_speed'
    | 'exclusive_leads'
    | 'high_roller_bonus'
    | 'easy_paperwork';
  value: number;
}

export interface ConnectionQuest {
  id: string;
  title: string;
  description: string;
  targetType: 'bring_car' | 'lend_money' | 'inspect_deal' | 'introduce';
  criteria?: {
    cls?: string;
    drv?: string;
    maxKm?: number;
    minYear?: number;
    cleanTitleOnly?: boolean;
    amount?: number;
  };
  rewardTrust: number;
  rewardCash: number;
  rewardUnlockId?: string;
  completed: boolean;
}

export interface Contact {
  id: string;
  name: string;
  title: string;
  organization: string;
  category: ContactCategory;
  tier: ContactTier;
  quality: number; // 1-5 stars
  avatar: string;
  location: string;
  bio: string;
  status: 'active' | 'revealed' | 'rumored';
  trust: number; // 0 to 100
  introReq: {
    type: 'free' | 'cash' | 'favor' | 'rep' | 'quest';
    cost?: number;
    minRep?: number;
    introducedById?: string;
    description: string;
  };
  perks: ConnectionPerk[];
  activeDeals?: {
    type: 'special_car' | 'parts_batch' | 'wholesale_buy' | 'tip';
    title: string;
    details: string;
    price?: number;
    listingId?: number;
  }[];
  quests: ConnectionQuest[];
  unlockedDay?: number;
  discoveredDay?: number;
}

export interface ConnectionLink {
  source: string;
  target: string;
  reason: string;
  strength: number; // 1 to 3
}

export interface ConnectionGraph {
  contacts: Record<string, Contact>;
  links: ConnectionLink[];
  rootId: string;
}

import { StartingRoleId } from './roles';

export interface PlayerCharacter {
  name: string;
  skin: number;
  hair: number;
  style: number;
  shirt: number;
  bg: 'none' | 'wrench' | 'sales' | 'clerk' | 'social' | 'auction';
  role?: StartingRoleId;
}

export interface UserAccount {
  id: string;
  username: string;
  createdAt: number;
  activeSlot: number;
}

export interface SaveMetadata {
  slot: number;
  username: string;
  day: number;
  dateStr: string;
  cash: number;
  netWorth: number;
  carsCount: number;
  connectionsCount: number;
  region: string;
  mode: GameMode;
  savedAt: number;
}
