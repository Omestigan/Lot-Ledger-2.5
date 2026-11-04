export type BuildingTypeId =
  | 'showroom'
  | 'workshop'
  | 'dyno_lab'
  | 'detailing_bay'
  | 'parts_warehouse'
  | 'security_tower'
  | 'helipad'
  | 'customer_lounge';

export interface DealershipBuilding {
  id: string;
  typeId: BuildingTypeId;
  name: string;
  level: number;
  maxLevel: number;
  gridX: number; // 0 to 7
  gridY: number; // 0 to 5
  slotCapacityBonus: number;
  repBonus: number;
  revenuePerDay: number;
  tuningDiscountPct: number;
  unlockCost: number;
  upgradeCost: number;
  description: string;
  icon: string;
}

export interface DealershipEmpireState {
  level: number;
  reputationXp: number;
  gridWidth: number; // 8
  gridHeight: number; // 6
  buildings: DealershipBuilding[];
  displayCars: { carUid: number; gridX: number; gridY: number }[];
  totalVisitorsToday: number;
  passiveDailyRevenue: number;
}

export const INITIAL_EMPIRE_BUILDINGS: DealershipBuilding[] = [
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
];

export const AVAILABLE_BUILDING_CATALOG: Omit<DealershipBuilding, 'id' | 'gridX' | 'gridY'>[] = [
  {
    typeId: 'parts_warehouse',
    name: 'Performance Parts Logistics Hub',
    level: 1,
    maxLevel: 5,
    slotCapacityBonus: 2,
    repBonus: 7,
    revenuePerDay: 500,
    tuningDiscountPct: 15,
    unlockCost: 5500,
    upgradeCost: 6000,
    description: 'Direct manufacturer supply line slashing parts acquisition costs and boosting trade throughput.',
    icon: '📦',
  },
  {
    typeId: 'customer_lounge',
    name: 'VIP Espresso & Cigar Lounge',
    level: 1,
    maxLevel: 4,
    slotCapacityBonus: 0,
    repBonus: 15,
    revenuePerDay: 800,
    tuningDiscountPct: 0,
    unlockCost: 7500,
    upgradeCost: 9000,
    description: 'Luxury lounge where high-net-worth clients negotiate private deals and luxury vehicle consignments.',
    icon: '☕',
  },
  {
    typeId: 'security_tower',
    name: 'High-Tech Security & Telematics Post',
    level: 1,
    maxLevel: 3,
    slotCapacityBonus: 1,
    repBonus: 5,
    revenuePerDay: 200,
    tuningDiscountPct: 0,
    unlockCost: 3500,
    upgradeCost: 4000,
    description: '24/7 infrared surveillance that prevents vehicle theft, protects inventory, and reduces lot insurance premiums.',
    icon: '🛡️',
  },
  {
    typeId: 'helipad',
    name: 'Rooftop Private VIP Helipad',
    level: 1,
    maxLevel: 3,
    slotCapacityBonus: 0,
    repBonus: 25,
    revenuePerDay: 2000,
    tuningDiscountPct: 0,
    unlockCost: 25000,
    upgradeCost: 20000,
    description: 'Prestige rooftop helipad welcoming billionaire collectors, international racing drivers, and VIP clients.',
    icon: '🚁',
  },
];

export function getEmpireTotalBonuses(empire: DealershipEmpireState) {
  let extraSlots = 0;
  let totalRep = 0;
  let dailyRevenue = 0;
  let tuningDiscount = 0;

  empire.buildings.forEach((b) => {
    extraSlots += b.slotCapacityBonus * b.level;
    totalRep += b.repBonus * b.level;
    dailyRevenue += b.revenuePerDay * b.level;
    tuningDiscount = Math.min(40, tuningDiscount + b.tuningDiscountPct * (b.level * 0.5));
  });

  return {
    extraSlots,
    totalRep,
    dailyRevenue,
    tuningDiscountPct: Math.round(tuningDiscount),
  };
}
