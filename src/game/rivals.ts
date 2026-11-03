import { Car, Listing } from './types';
import { CAT } from './data';
import { worth, fmt } from './valuation';

export interface RivalDealership {
  id: string;
  name: string;
  ownerName: string;
  personality: 'aggressive_flipper' | 'luxury_importer' | 'salvage_rebuilder' | 'fleet_commercial' | 'tuner_specialist';
  personalityLabel: string;
  strategyDescription: string;
  cash: number;
  reputation: number; // 0 - 100
  lotCapacity: number;
  inventory: Car[];
  pricingMarkup: number; // e.g. 1.15
  color: string;
  recentSales: { carName: string; price: number; profit: number; day: number }[];
  marketShare: number; // percentage
  status: 'active' | 'rival' | 'partner' | 'acquired';
}

export const INITIAL_RIVAL_DEALERSHIPS: RivalDealership[] = [
  {
    id: 'rival_apex',
    name: 'Apex Prime Auto Group',
    ownerName: 'Marcus Vance',
    personality: 'aggressive_flipper',
    personalityLabel: 'Aggressive Volume Flipper',
    strategyDescription: 'Swiftly snatches underpriced classifieds and auction listings, turns them over with minimal reconditioning, and runs aggressive advertising.',
    cash: 45000,
    reputation: 84,
    lotCapacity: 12,
    inventory: [],
    pricingMarkup: 1.18,
    color: '#3b82f6',
    recentSales: [
      { carName: '2014 Honda Civic LX', price: 6800, profit: 1200, day: 1 },
      { carName: '2016 Toyota Corolla LE', price: 8200, profit: 1450, day: 1 },
    ],
    marketShare: 32,
    status: 'rival',
  },
  {
    id: 'rival_crown',
    name: 'Crown & Heritage Motorcars',
    ownerName: 'Eleanor Sterling',
    personality: 'luxury_importer',
    personalityLabel: 'Boutique Luxury Specialist',
    strategyDescription: 'Focuses exclusively on European luxury, sports coupés, and pristine executive saloons. Charges steep retail premiums for immaculate detailing.',
    cash: 92000,
    reputation: 94,
    lotCapacity: 8,
    inventory: [],
    pricingMarkup: 1.35,
    color: '#8b5cf6',
    recentSales: [
      { carName: '2012 BMW 328i xDrive', price: 11500, profit: 2800, day: 1 },
    ],
    marketShare: 24,
    status: 'rival',
  },
  {
    id: 'rival_rustbelt',
    name: 'Rustbelt Salvage & Rebuild',
    ownerName: 'Gus "Torch" Kowalski',
    personality: 'salvage_rebuilder',
    personalityLabel: 'Budget & Rebuild Yard',
    strategyDescription: 'Hunts for flood, accident, and rust-bucket bargain listings. Straightens frames, patches rocker panels, and flips budget beaters to first-time buyers.',
    cash: 22000,
    reputation: 68,
    lotCapacity: 16,
    inventory: [],
    pricingMarkup: 1.12,
    color: '#f59e0b',
    recentSales: [
      { carName: '2005 Pontiac Vibe', price: 2900, profit: 950, day: 1 },
      { carName: '2008 Ford Focus SE', price: 3400, profit: 800, day: 1 },
    ],
    marketShare: 18,
    status: 'rival',
  },
  {
    id: 'rival_prairie',
    name: 'Continental Fleet & 4x4',
    ownerName: 'Derrick Holme',
    personality: 'fleet_commercial',
    personalityLabel: 'Commercial Truck & Van Outfitter',
    strategyDescription: 'Monopolizes pickup trucks, cargo vans, and workhorses. Strong B2B contracts with local contractors and tradesmen.',
    cash: 58000,
    reputation: 80,
    lotCapacity: 10,
    inventory: [],
    pricingMarkup: 1.22,
    color: '#10b981',
    recentSales: [
      { carName: '2011 Ford F-150 SuperCab', price: 9800, profit: 2100, day: 1 },
    ],
    marketShare: 20,
    status: 'rival',
  },
];

export interface RivalTickResult {
  rivals: RivalDealership[];
  boughtListings: { rivalName: string; listing: Listing; reason: string }[];
  rivalSales: { rivalName: string; carName: string; price: number; profit: number }[];
  marketNews: string[];
}

// Simulates rival actions when advancing a day
export function tickRivalDealerships(
  currentRivals: RivalDealership[],
  marketListings: Listing[],
  currentDay: number
): RivalTickResult {
  const rivals: RivalDealership[] = JSON.parse(JSON.stringify(currentRivals));
  const boughtListings: { rivalName: string; listing: Listing; reason: string }[] = [];
  const rivalSales: { rivalName: string; carName: string; price: number; profit: number }[] = [];
  const marketNews: string[] = [];

  rivals.forEach((rival) => {
    if (rival.status === 'acquired') return;

    // 1. Check if rival buys an undervalued car from the market
    if (rival.inventory.length < rival.lotCapacity && rival.cash > 3000) {
      // Find a listing that matches rival taste and has good margin
      const candidates = marketListings.filter((l) => {
        if (boughtListings.some((b) => b.listing.id === l.id)) return false;
        const estValue = worth(l.car, 'known', []);
        const margin = estValue - l.ask;

        if (rival.personality === 'aggressive_flipper') {
          return margin > 800 && l.ask <= rival.cash * 0.4;
        }
        if (rival.personality === 'luxury_importer') {
          const cls = CAT[l.car.cid].cls;
          return (cls === 'lux' || cls === 'sport') && l.ask <= rival.cash * 0.6;
        }
        if (rival.personality === 'salvage_rebuilder') {
          return l.ask <= 3500 && (l.car.rust >= 3 || l.car.issues.length >= 2);
        }
        if (rival.personality === 'fleet_commercial') {
          const cls = CAT[l.car.cid].cls;
          return (cls === 'truck' || cls === 'van') && l.ask <= rival.cash * 0.5;
        }
        return margin > 500 && l.ask <= rival.cash * 0.3;
      });

      if (candidates.length > 0 && Math.random() < 0.35) {
        const picked = candidates[Math.floor(Math.random() * candidates.length)];
        rival.cash -= picked.ask;
        const carCopy = { ...picked.car, basis: picked.ask };
        rival.inventory.push(carCopy);
        boughtListings.push({
          rivalName: rival.name,
          listing: picked,
          reason: `${rival.name} snapped up the ${CAT[picked.car.cid].name} for ${fmt(picked.ask)}!`,
        });
      }
    }

    // 2. Rival sells a car to retail customers
    if (rival.inventory.length > 0 && Math.random() < 0.45) {
      const soldIdx = Math.floor(Math.random() * rival.inventory.length);
      const soldCar = rival.inventory.splice(soldIdx, 1)[0];
      const estWorth = worth(soldCar, 'known', []);
      const salePrice = Math.round((estWorth * rival.pricingMarkup) / 50) * 50;
      const profit = salePrice - soldCar.basis;

      rival.cash += salePrice;
      const catName = CAT[soldCar.cid]?.name || 'Vehicle';
      rival.recentSales.unshift({
        carName: catName,
        price: salePrice,
        profit,
        day: currentDay,
      });
      if (rival.recentSales.length > 8) rival.recentSales.pop();

      rivalSales.push({
        rivalName: rival.name,
        carName: catName,
        price: salePrice,
        profit,
      });

      // Fluctuate reputation slightly based on successful sales
      rival.reputation = Math.min(99, Math.max(50, rival.reputation + (profit > 1500 ? 1 : 0)));
    }

    // 3. Keep minimum starter inventory if lot is empty
    if (rival.inventory.length === 0 && Math.random() < 0.6) {
      const seedCid = Math.floor(Math.random() * 8) + 1;
      const seedCar: Car = {
        uid: Date.now() + Math.floor(Math.random() * 100000),
        cid: seedCid,
        trim: 1,
        color: ['Metallic Silver', '#94a3b8'],
        vin: `RIV${rival.id.slice(0, 3).toUpperCase()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        owners: 2,
        use: 'personal',
        km: 142000,
        shown: 142000,
        rolled: false,
        tr: 'Auto',
        eng: '2.0L I4',
        q: 72,
        issues: [],
        rust: 1,
        dents: 1,
        repaint: false,
        gaps: false,
        interior: 1,
        water: false,
        tread: 65,
        winter: false,
        modded: false,
        title: 'clean',
        adTitle: `${CAT[seedCid].name} - Inspected Lot Stock`,
        reg: 'valid',
        lien: 0,
        lienPaid: true,
        cloned: false,
        recall: false,
        receipts: 3,
        masked: false,
        detail: true,
        regd: true,
        latent: [],
        job: null,
        sale: null,
        idle: 0,
        basis: 4200,
        partGrade: 'new',
        know: {
          issues: {},
          rust: 1,
          dents: 1,
          interior: 1,
          tires: { tread: 65, winter: false },
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
      rival.inventory.push(seedCar);
    }
  });

  // Rebalance market share percentages
  const totalNet = rivals.reduce((sum, r) => sum + r.cash + r.inventory.length * 5000, 0);
  rivals.forEach((r) => {
    r.marketShare = Math.max(6, Math.round(((r.cash + r.inventory.length * 5000) / totalNet) * 100));
  });

  if (boughtListings.length > 0) {
    marketNews.push(
      `${boughtListings[0].rivalName} bought a listing from the open market (${boughtListings[0].reason}).`
    );
  }

  return {
    rivals,
    boughtListings,
    rivalSales,
    marketNews,
  };
}
