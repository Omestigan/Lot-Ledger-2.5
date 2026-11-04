import { Car, CarCatalogEntry } from './types';
import { CAT } from './data';

export interface PerformancePartsCategory {
  id: string;
  name: string;
  icon: string;
  parts: TuningPart[];
}

export interface TuningPart {
  id: string;
  name: string;
  brand: string;
  category: 'engine' | 'forced_induction' | 'exhaust' | 'suspension' | 'brakes' | 'tires' | 'aero' | 'weight' | 'ecu';
  cost: number;
  stage: 1 | 2 | 3;
  hpBonus: number;
  torqueBonus: number; // Nm
  weightDeltaKg: number;
  handlingBonus: number;
  reliabilityDelta: number; // negative reduces reliability, positive improves
  fuelEconomyDelta: number; // percentage change in fuel consumption (+5 = uses 5% more fuel)
  desc: string;
  compatibleWith?: (car: Car, entry: CarCatalogEntry) => boolean;
}

export const TUNING_PARTS_CATALOG: TuningPart[] = [
  // --- ECU & Tuning Software ---
  {
    id: 'ecu_stage1',
    name: 'Stage 1 ECU Flash Tune',
    brand: 'Cobb Tuning',
    category: 'ecu',
    cost: 550,
    stage: 1,
    hpBonus: 28,
    torqueBonus: 40,
    weightDeltaKg: 0,
    handlingBonus: 0,
    reliabilityDelta: -2,
    fuelEconomyDelta: 4,
    desc: 'Remaps ignition timing and fuel delivery curves for immediate responsive power without hardware mods.',
  },
  {
    id: 'ecu_stage2',
    name: 'Stage 2 Custom Dyno Calibration & Pops Tune',
    brand: 'Hondata / APR',
    category: 'ecu',
    cost: 1200,
    stage: 2,
    hpBonus: 60,
    torqueBonus: 75,
    weightDeltaKg: 0,
    handlingBonus: 0,
    reliabilityDelta: -6,
    fuelEconomyDelta: 10,
    desc: 'Aggressive fuel maps, raised rev limiter, and boost mapping tuned on a rolling dyno.',
  },
  {
    id: 'ecu_standalone',
    name: 'MoTeC M150 Standalone Race ECU',
    brand: 'MoTeC',
    category: 'ecu',
    cost: 3800,
    stage: 3,
    hpBonus: 110,
    torqueBonus: 130,
    weightDeltaKg: -2,
    handlingBonus: 3,
    reliabilityDelta: -4,
    fuelEconomyDelta: 16,
    desc: 'Motorsport-spec ECU featuring launch control, anti-lag, full telematics, and sequential gear control.',
  },

  // --- Forced Induction ---
  {
    id: 'fi_cold_air_intake',
    name: 'Carbon High-Flow Cold Air Intake',
    brand: 'AEM Induction',
    category: 'forced_induction',
    cost: 420,
    stage: 1,
    hpBonus: 14,
    torqueBonus: 18,
    weightDeltaKg: -3,
    handlingBonus: 0,
    reliabilityDelta: 1,
    fuelEconomyDelta: 1,
    desc: 'Shielded carbon-fiber box pulling cooler ambient air with deep induction growl.',
  },
  {
    id: 'fi_bolt_on_turbo',
    name: 'Garrett GT2860R Ball-Bearing Turbocharger Kit',
    brand: 'Garrett Motion',
    category: 'forced_induction',
    cost: 2950,
    stage: 2,
    hpBonus: 115,
    torqueBonus: 145,
    weightDeltaKg: 12,
    handlingBonus: -1,
    reliabilityDelta: -8,
    fuelEconomyDelta: 14,
    desc: 'Ceramic dual ball-bearing turbo kit with front-mount bar-and-plate intercooler and blow-off valve.',
  },
  {
    id: 'fi_twin_turbo_supercharger',
    name: 'BorgWarner EFR Twin-Scroll / Whipple Twin-Screw Blower',
    brand: 'BorgWarner / Whipple',
    category: 'forced_induction',
    cost: 6500,
    stage: 3,
    hpBonus: 220,
    torqueBonus: 260,
    weightDeltaKg: 18,
    handlingBonus: -2,
    reliabilityDelta: -14,
    fuelEconomyDelta: 25,
    desc: 'Massive boost forced induction system for insane straight-line drag acceleration.',
  },

  // --- Exhaust Systems ---
  {
    id: 'ex_catback_stainless',
    name: 'Stainless Steel Cat-Back Exhaust System',
    brand: 'Invidia / Borla',
    category: 'exhaust',
    cost: 850,
    stage: 1,
    hpBonus: 16,
    torqueBonus: 22,
    weightDeltaKg: -9,
    handlingBonus: 1,
    reliabilityDelta: 0,
    fuelEconomyDelta: 2,
    desc: '3-inch mandrel-bent polished piping with resonated tips and throatier acoustic tone.',
  },
  {
    id: 'ex_titanium_headers',
    name: 'Titanium Race Headers & High-Flow Downpipe',
    brand: 'Akrapovič',
    category: 'exhaust',
    cost: 2700,
    stage: 2,
    hpBonus: 38,
    torqueBonus: 48,
    weightDeltaKg: -16,
    handlingBonus: 2,
    reliabilityDelta: -2,
    fuelEconomyDelta: 5,
    desc: 'Aerospace-grade ultra-lightweight titanium full system with straight-through decat flow.',
  },

  // --- Suspension & Stance ---
  {
    id: 'susp_sport_springs',
    name: 'Progressive Lowering Sport Springs (30mm drop)',
    brand: 'Eibach Pro-Kit',
    category: 'suspension',
    cost: 380,
    stage: 1,
    hpBonus: 0,
    torqueBonus: 0,
    weightDeltaKg: 0,
    handlingBonus: 12,
    reliabilityDelta: 0,
    fuelEconomyDelta: -1,
    desc: 'Lowers centre of gravity, reduces body roll into tight apexes, and closes fender wheel gaps.',
  },
  {
    id: 'susp_coilovers_2way',
    name: 'KW V3 2-Way Adjustable Threaded Coilovers',
    brand: 'KW Suspensions',
    category: 'suspension',
    cost: 2250,
    stage: 2,
    hpBonus: 0,
    torqueBonus: 0,
    weightDeltaKg: -6,
    handlingBonus: 25,
    reliabilityDelta: 2,
    fuelEconomyDelta: -1,
    desc: 'Independent bump and rebound damping controls for surgical track grip and stance adjustments.',
  },

  // --- Brakes & Stopping Power ---
  {
    id: 'brk_ceramic_pads',
    name: 'Slotted Rotors & Carbon-Ceramic Compound Brake Pads',
    brand: 'StopTech',
    category: 'brakes',
    cost: 620,
    stage: 1,
    hpBonus: 0,
    torqueBonus: 0,
    weightDeltaKg: -4,
    handlingBonus: 8,
    reliabilityDelta: 4,
    fuelEconomyDelta: 0,
    desc: 'Resists brake fade under repeated hard stops, reduces unsprung weight and pedal sponginess.',
  },
  {
    id: 'brk_big_brake_kit',
    name: 'Brembo GT 6-Piston Monobloc Big Brake Kit (380mm)',
    brand: 'Brembo Racing',
    category: 'brakes',
    cost: 3400,
    stage: 3,
    hpBonus: 0,
    torqueBonus: 0,
    weightDeltaKg: -8,
    handlingBonus: 18,
    reliabilityDelta: 6,
    fuelEconomyDelta: 0,
    desc: 'Forged aluminum calipers and floating two-piece ventilated discs engineered for 200+ km/h anchors.',
  },

  // --- Tires & Wheels ---
  {
    id: 'tire_ultra_summer',
    name: 'Michelin Pilot Sport 4S Ultra-High Performance Tires',
    brand: 'Michelin',
    category: 'tires',
    cost: 980,
    stage: 1,
    hpBonus: 0,
    torqueBonus: 0,
    weightDeltaKg: -4,
    handlingBonus: 20,
    reliabilityDelta: 2,
    fuelEconomyDelta: 0,
    desc: 'Benchmark street performance rubber offering supreme lateral G-force and traction off the line.',
  },
  {
    id: 'tire_competition_slicks',
    name: 'Toyo Proxes R888R Semi-Slick DOT Drag Radials',
    brand: 'Toyo Tires',
    category: 'tires',
    cost: 1650,
    stage: 2,
    hpBonus: 0,
    torqueBonus: 0,
    weightDeltaKg: -6,
    handlingBonus: 32,
    reliabilityDelta: -5,
    fuelEconomyDelta: 3,
    desc: 'Sticky R-compound rubber engineered for sub-2.0s 60-foot launches and maximum drag strip hook.',
  },

  // --- Weight Reduction ---
  {
    id: 'wt_carbon_hood',
    name: 'Dry Carbon Fiber Vented Hood & Trunk Lid',
    brand: 'Seibon Carbon',
    category: 'weight',
    cost: 1450,
    stage: 1,
    hpBonus: 0,
    torqueBonus: 0,
    weightDeltaKg: -28,
    handlingBonus: 8,
    reliabilityDelta: 0,
    fuelEconomyDelta: -2,
    desc: 'Autoclave-cured dry carbon exterior panels that extract heat and slash frontal weight.',
  },
  {
    id: 'wt_interior_strip',
    name: 'ClubSport Interior Strip & Carbon Bucket Seats',
    brand: 'Recaro Podium',
    category: 'weight',
    cost: 3100,
    stage: 2,
    hpBonus: 0,
    torqueBonus: 0,
    weightDeltaKg: -85,
    handlingBonus: 16,
    reliabilityDelta: 0,
    fuelEconomyDelta: -5,
    desc: 'Removes heavy sound deadening, rear bench, and replaces stock seats with FIA carbon buckets.',
  },

  // --- Aerodynamics ---
  {
    id: 'aero_swan_wing',
    name: 'Carbon Swan-Neck High Downforce Rear Wing & Front Splitter',
    brand: 'Voltex Racing',
    category: 'aero',
    cost: 1950,
    stage: 2,
    hpBonus: 0,
    torqueBonus: 0,
    weightDeltaKg: 4,
    handlingBonus: 22,
    reliabilityDelta: 0,
    fuelEconomyDelta: 3,
    desc: 'Generates 180kg of functional aerodynamic downforce at 160 km/h for relentless high-speed stability.',
  },
];

// Helper to compute realistic, physics-grounded performance metrics for any car
export function calculateCarPerformanceMetrics(car: Car, catalogEntry?: CarCatalogEntry) {
  const e = catalogEntry || CAT[car.cid];
  const tuning = car.tuning || {};
  const installedPartIds = tuning.parts || [];

  // Look up installed parts
  const installedParts = TUNING_PARTS_CATALOG.filter((p) => installedPartIds.includes(p.id));

  // Base horsepower estimation derived from engine string, catalog base price & classification
  let baseHp = 130;
  if (e.eng && e.eng.length > 0) {
    const engStr = car.eng || e.eng[0];
    if (engStr.includes('V8') || engStr.includes('4.7L') || engStr.includes('5.0L')) baseHp = 360;
    else if (engStr.includes('3.5L') || engStr.includes('3.0L') || engStr.includes('V6')) baseHp = 270;
    else if (engStr.includes('2.5L') || engStr.includes('2.4L') || engStr.includes('Turbo')) baseHp = 205;
    else if (engStr.includes('2.0L')) baseHp = 160;
    else if (engStr.includes('1.8L') || engStr.includes('1.6L')) baseHp = 135;
    else if (engStr.includes('1.5L') || engStr.includes('Hybrid')) baseHp = 110;
  }
  if (e.cls === 'sport') baseHp = Math.max(baseHp, 260);
  if (e.cls === 'lux') baseHp = Math.max(baseHp, 280);

  // Apply custom HP & Torque bonuses from installed parts
  const partsHpBonus = installedParts.reduce((sum, p) => sum + p.hpBonus, 0);
  const partsTorqueBonus = installedParts.reduce((sum, p) => sum + p.torqueBonus, 0);
  const partsWeightDelta = installedParts.reduce((sum, p) => sum + p.weightDeltaKg, 0);
  const partsHandlingBonus = installedParts.reduce((sum, p) => sum + p.handlingBonus, 0);
  const partsRelDelta = installedParts.reduce((sum, p) => sum + p.reliabilityDelta, 0);
  const partsFuelDelta = installedParts.reduce((sum, p) => sum + p.fuelEconomyDelta, 0);

  // Manual tuning boost slider (e.g., wastegate PSI adjustments)
  const boostPsi = tuning.boostPsi || 0;
  const boostHp = Math.round(boostPsi * 8.5);

  const totalHp = Math.max(70, Math.round(baseHp + partsHpBonus + boostHp));
  const baseTorque = Math.round(baseHp * 1.25);
  const totalTorque = Math.max(90, Math.round(baseTorque + partsTorqueBonus + boostPsi * 11));

  // Base weight by class (kg)
  const baseWeightMap: Record<string, number> = {
    compact: 1150,
    hatch: 1180,
    sedan: 1420,
    sport: 1350,
    conv: 1320,
    lux: 1720,
    suv: 1880,
    van: 1950,
    truck: 2150,
  };
  const baseWeight = baseWeightMap[e.cls] || 1400;
  const totalWeightKg = Math.max(750, Math.round(baseWeight + partsWeightDelta));

  // 0-100 km/h (0-60 mph) calculation: derived from Power-to-Weight ratio & Drivetrain traction
  // Lower is faster
  const powerToWeightRatio = (totalHp / totalWeightKg) * 1000; // HP per Metric Tonne
  const driveTractionFactor = e.drv === 'AWD' || e.drv === '4WD' ? 0.82 : e.drv === 'RWD' ? 0.90 : 1.0;
  
  // Tire grip multiplier
  const hasSemiSlicks = installedPartIds.includes('tire_competition_slicks');
  const hasSportTires = installedPartIds.includes('tire_ultra_summer');
  const tireTraction = hasSemiSlicks ? 0.85 : hasSportTires ? 0.92 : 1.0;

  // Base 0-60 seconds
  let zeroToSixtySec = (680 / powerToWeightRatio) * driveTractionFactor * tireTraction;
  zeroToSixtySec = Math.max(2.1, Math.min(14.5, +zeroToSixtySec.toFixed(2)));

  // Quarter Mile Time (approximate relation to 0-60 and power-to-weight)
  let quarterMileSec = zeroToSixtySec * 1.85 + 2.8;
  quarterMileSec = Math.max(9.2, Math.min(19.8, +quarterMileSec.toFixed(2)));

  // Top Speed (km/h & mph) based on HP and Aerodynamics
  // Aerodynamic drag increases with square of speed
  const gearBiasFactor = tuning.gearRatioBias === 'short' ? 0.92 : tuning.gearRatioBias === 'tall' ? 1.06 : 1.0;
  let topSpeedKmh = Math.round(Math.pow(totalHp, 0.44) * 35.5 * gearBiasFactor);
  topSpeedKmh = Math.max(140, Math.min(380, topSpeedKmh));
  const topSpeedMph = Math.round(topSpeedKmh * 0.621371);

  // Fuel Consumption (L/100km & MPG)
  let baseFuelL100 = (baseHp * 0.038) + (totalWeightKg * 0.0022);
  baseFuelL100 *= (1 + partsFuelDelta / 100);
  baseFuelL100 = Math.max(4.5, Math.min(26.0, +baseFuelL100.toFixed(1)));
  const fuelMpg = Math.round(235.215 / baseFuelL100);

  // Handling score (0-100)
  let handlingScore = 50 + (e.cls === 'sport' ? 20 : e.cls === 'truck' ? -15 : 0) + partsHandlingBonus;
  if (tuning.suspensionStiffness) handlingScore += (tuning.suspensionStiffness - 5) * 1.5;
  handlingScore = Math.max(15, Math.min(99, Math.round(handlingScore)));

  // Reliability score (0-100)
  // Higher stage tunes decrease reliability slightly
  let reliabilityScore = Math.round(e.rel * 100) + partsRelDelta - Math.round(boostPsi * 2.5);
  // Mechanical defects on the car degrade reliability
  const unfixedIssuesCount = car.issues.filter((i) => !i.fixed).length;
  reliabilityScore -= unfixedIssuesCount * 8;
  reliabilityScore = Math.max(10, Math.min(98, reliabilityScore));

  return {
    hp: totalHp,
    torque: totalTorque,
    weightKg: totalWeightKg,
    topSpeedKmh,
    topSpeedMph,
    zeroToSixtySec,
    quarterMileSec,
    fuelL100km: baseFuelL100,
    fuelMpg,
    handlingScore,
    reliabilityScore,
  };
}

// Preset Race Tracks for live multiplayer racing
export interface RaceTrack {
  id: string;
  name: string;
  location: string;
  lengthKm: number;
  type: 'drag_strip' | 'circuit' | 'touge_mountain' | 'highway_sprint';
  surface: 'asphalt' | 'track_prepped';
  difficulty: 'Beginner' | 'Intermediate' | 'Pro' | 'Expert';
  description: string;
  favorsClass: 'horsepower' | 'handling' | 'acceleration' | 'balanced';
}

export const RACE_TRACKS: RaceTrack[] = [
  {
    id: 'track_drag_strip',
    name: 'Silverstone 1/4 Mile Drag Strip',
    location: 'Northamptonshire, UK',
    lengthKm: 0.402, // 1/4 mile
    type: 'drag_strip',
    surface: 'track_prepped',
    difficulty: 'Intermediate',
    description: 'VHT glue-prepped drag strip with optical Christmas tree timing. Raw 0-60 launch and top-end horsepower reign supreme.',
    favorsClass: 'acceleration',
  },
  {
    id: 'track_nurburg_ring',
    name: 'Nordschleife Apex Sprint',
    location: 'Nürburg, Germany',
    lengthKm: 4.8,
    type: 'circuit',
    surface: 'asphalt',
    difficulty: 'Expert',
    description: 'High-speed elevation changes, treacherous off-camber hairpins, and carousel turns that test handling and braking.',
    favorsClass: 'handling',
  },
  {
    id: 'track_shuto_expressway',
    name: 'Tokyo Shuto Expressway C1 Loop',
    location: 'Tokyo, Japan',
    lengthKm: 6.2,
    type: 'highway_sprint',
    surface: 'asphalt',
    difficulty: 'Pro',
    description: 'Midnight high-speed arterial highway sprint weaving between toll gates and neon tunnel straights.',
    favorsClass: 'horsepower',
  },
  {
    id: 'track_monaco_street',
    name: 'Monte Carlo Grand Boulevard',
    location: 'Monaco',
    lengthKm: 3.3,
    type: 'circuit',
    surface: 'asphalt',
    difficulty: 'Expert',
    description: 'Tight barrier-lined streets where downforce, nimble weight transfer, and instant corner exits make the winner.',
    favorsClass: 'balanced',
  },
];
