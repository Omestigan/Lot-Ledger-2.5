import { CarCatalogEntry, Issue, Region } from './types';

export const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

export const RAW_CATALOG = `Toyota|Corolla|2003|2009|2005|3500|compact|FWD|am|95|50|-|1.8L I4;1.6L I4
Toyota|Camry|2005|2011|2010|4600|sedan|FWD|a|93|45|-|2.4L I4;3.5L V6
Toyota|Yaris|2007|2013|2009|3300|compact|FWD|am|90|45|-|1.5L I4
Toyota|RAV4|2006|2012|2010|6800|suv|AWD|a|88|50|-|2.5L I4;3.5L V6
Toyota|Tacoma|2005|2011|2008|9500|truck|4WD|am|90|85|frame|2.7L I4;4.0L V6
Toyota|Sienna|2004|2010|2008|4500|van|FWD|a|85|55|-|3.5L V6
Toyota|Highlander|2005|2011|2008|6800|suv|AWD|a|88|50|-|2.7L I4;3.5L V6
Toyota|4Runner|2003|2010|2007|9000|suv|4WD|a|90|80|-|4.0L V6;4.7L V8
Toyota|Prius|2004|2011|2009|5600|hatch|FWD|c|85|45|hybrid|1.5L Hybrid
Pontiac|Vibe|2003|2008|2006|2850|hatch|FWD|am|90|55|-|1.8L I4
Honda|Civic|2003|2010|2007|3900|compact|FWD|am|93|50|takata|1.8L I4;1.7L I4
Honda|Accord|2003|2010|2008|4300|sedan|FWD|am|90|50|takata|2.4L I4;3.0L V6
Honda|CR-V|2005|2012|2012|8000|suv|AWD|a|90|50|-|2.4L I4
Honda|Fit|2007|2013|2010|4800|hatch|FWD|am|90|45|-|1.5L I4
Honda|Odyssey|2005|2010|2008|4000|van|FWD|a|80|55|trans|3.5L V6
Honda|Pilot|2006|2012|2009|6000|suv|AWD|a|85|55|-|3.5L V6
Acura|TL|2004|2011|2008|5000|lux|FWD|am|85|50|-|3.2L V6;3.5L V6
Honda|S2000|2002|2009|2005|16500|conv|RWD|m|90|40|-|2.2L I4
Mazda|Mazda3|2004|2012|2010|4100|compact|FWD|am|85|85|-|2.0L I4;2.3L I4
Mazda|Mazda6|2003|2010|2008|3400|sedan|FWD|am|80|80|-|2.3L I4;3.0L V6
Mazda|MX-5 Miata|2002|2010|2006|7500|conv|RWD|m|90|60|-|1.8L I4;2.0L I4
Nissan|Sentra|2007|2012|2010|3300|compact|FWD|cm|60|50|cvt|2.0L I4
Nissan|Altima|2007|2012|2010|3900|sedan|FWD|c|60|50|cvt|2.5L I4
Nissan|Rogue|2008|2014|2012|6200|suv|AWD|c|60|50|cvt|2.5L I4
Nissan|Versa|2007|2013|2010|2600|compact|FWD|cm|60|55|cvt|1.8L I4
Nissan|350Z|2003|2009|2006|11000|sport|RWD|m|80|50|-|3.5L V6
Nissan|Frontier|2005|2012|2008|6500|truck|4WD|am|78|85|-|2.5L I4;4.0L V6
Hyundai|Elantra|2007|2015|2011|3500|compact|FWD|am|75|60|-|1.8L I4;2.0L I4
Hyundai|Sonata|2006|2014|2010|3800|sedan|FWD|a|70|55|theta|2.4L I4
Hyundai|Accent|2006|2013|2010|2800|compact|FWD|am|70|60|-|1.6L I4
Kia|Rio|2008|2014|2011|2800|compact|FWD|am|70|60|-|1.6L I4
Kia|Forte|2010|2016|2012|4400|compact|FWD|am|70|55|-|2.0L I4
Kia|Sorento|2007|2013|2011|5800|suv|AWD|a|70|55|-|2.4L I4;3.5L V6
Ford|Focus|2005|2014|2008|1850|compact|FWD|am|55|70|dct|2.0L I4
Ford|Fiesta|2011|2016|2013|4300|compact|FWD|am|55|60|dct|1.6L I4
Ford|Fusion|2006|2013|2010|3800|sedan|FWD|a|65|65|-|2.5L I4;3.0L V6
Ford|Escape|2005|2012|2009|3800|suv|AWD|a|65|70|-|2.5L I4;3.0L V6
Ford|F-150|2003|2011|2006|5000|truck|4WD|a|75|90|-|4.6L V8;5.4L V8
Ford|Ranger|2003|2010|2005|3800|truck|4WD|am|70|85|-|3.0L V6;4.0L V6
Ford|Mustang|2005|2012|2008|8500|sport|RWD|am|70|55|-|4.0L V6;4.6L V8
Ford|Explorer|2006|2012|2008|4200|suv|AWD|a|55|65|-|4.0L V6
Chevrolet|Cobalt|2005|2010|2008|1300|compact|FWD|am|55|70|ign|2.2L I4
Chevrolet|Malibu|2006|2012|2010|3000|sedan|FWD|a|60|65|-|2.4L I4;3.6L V6
Chevrolet|Equinox|2007|2013|2011|4800|suv|AWD|a|55|65|chain|2.4L I4;3.0L V6
Chevrolet|Silverado 1500|2003|2011|2007|6000|truck|4WD|a|70|90|-|4.8L V8;5.3L V8
Chevrolet|Impala|2006|2013|2009|3200|sedan|FWD|a|65|65|-|3.5L V6
Dodge|Caliber|2007|2012|2009|1350|compact|FWD|cm|40|75|cvt|2.0L I4
Dodge|Grand Caravan|2005|2012|2010|3000|van|FWD|a|50|70|-|3.3L V6;3.8L V6
Dodge|Charger|2006|2012|2010|6500|sedan|RWD|a|60|65|-|3.5L V6;5.7L V8
Jeep|Wrangler|2004|2011|2008|9500|suv|4WD|m|70|95|-|3.8L V6;4.0L I6
Jeep|Liberty|2005|2012|2008|3200|suv|4WD|a|50|85|-|3.7L V6
Ram|1500|2009|2015|2011|8500|truck|4WD|a|65|85|-|4.7L V8;5.7L V8
Subaru|Impreza|2004|2011|2008|3800|compact|AWD|am|70|65|hg|2.5L H4
Subaru|Forester|2004|2011|2009|4800|suv|AWD|am|70|65|hg|2.5L H4
Subaru|Outback|2005|2011|2010|5500|hatch|AWD|am|70|65|hg|2.5L H4
Volkswagen|Jetta|2005|2012|2009|3500|sedan|FWD|am|55|55|-|2.0L I4;2.5L I5
Volkswagen|Golf / GTI|2006|2013|2009|5200|hatch|FWD|am|55|50|-|2.0L I4;2.0L Turbo I4
BMW|328i|2006|2013|2007|3750|lux|RWD|am|40|60|n20|3.0L I6;2.0L Turbo I4
BMW|335i|2007|2013|2008|4800|lux|RWD|am|35|60|turbo|3.0L Twin-Turbo I6
BMW|X3|2006|2013|2008|5000|suv|AWD|a|40|60|-|3.0L I6
Audi|A4|2005|2012|2008|4000|lux|AWD|am|40|55|oilc|2.0L Turbo I4
Mercedes-Benz|C-Class|2005|2011|2008|4200|lux|RWD|a|45|55|-|2.5L V6;3.5L V6
Lexus|IS 250|2006|2011|2008|6500|lux|RWD|a|85|50|-|2.5L V6
Lexus|RX 350|2007|2012|2009|8500|suv|AWD|a|88|55|-|3.5L V6
Land Rover|LR3|2005|2009|2007|4800|suv|4WD|a|20|85|airsusp|4.4L V8
Fiat|500|2012|2016|2013|3800|hatch|FWD|am|35|50|-|1.4L I4
Mini|Cooper|2007|2013|2009|4200|hatch|FWD|am|45|55|chain|1.6L I4
Mitsubishi|Lancer|2008|2015|2011|4200|compact|FWD|cm|60|55|cvt|2.0L I4`;

export const CAT: CarCatalogEntry[] = [];
RAW_CATALOG.split('\n').forEach((s) => {
  const p = s.split('|');
  const from = +p[2];
  const to = +p[3];
  const anc = +p[4];
  const mid = +p[5];
  for (let y = from; y <= to; y++) {
    CAT.push({
      id: CAT.length,
      make: p[0],
      model: p[1],
      year: y,
      anc,
      mid,
      cls: p[6] as any,
      drv: p[7] as any,
      tr: p[8],
      rel: +p[9] / 100,
      rust: +p[10] / 100,
      kn: p[11],
      eng: p[12].split(';'),
      base: mid * Math.pow(1.085, y - anc),
      kmT: Math.max(40000, (2026 - y) * 12000),
      name: `${y} ${p[0]} ${p[1]}`,
    });
  }
});

export function getOrRegisterCatalogEntry(carData: {
  make: string;
  model: string;
  year: number;
  cls?: string;
  drv?: string;
  tr?: string;
  eng?: string;
  base?: number;
}): CarCatalogEntry {
  const cleanMake = carData.make.trim();
  const cleanModel = carData.model.trim();
  const existing = CAT.find(
    (c) =>
      c.make.toLowerCase() === cleanMake.toLowerCase() &&
      c.model.toLowerCase() === cleanModel.toLowerCase() &&
      c.year === carData.year
  );
  if (existing) return existing;

  const validClasses = ['compact', 'sedan', 'suv', 'truck', 'van', 'sport', 'lux', 'hatch', 'conv'] as const;
  const cls = (validClasses.includes(carData.cls as any) ? carData.cls : 'compact') as (typeof validClasses)[number];
  const drv = (['FWD', 'RWD', 'AWD', '4WD'].includes(carData.drv as any) ? carData.drv : 'FWD') as any;
  const basePrice = carData.base && carData.base > 100 ? carData.base : 4500;

  const newId = CAT.length;
  const entry: CarCatalogEntry = {
    id: newId,
    make: cleanMake,
    model: cleanModel,
    year: carData.year,
    anc: carData.year - 3,
    mid: basePrice,
    cls,
    drv,
    tr: carData.tr || 'am',
    rel: 0.85,
    rust: 0.5,
    kn: '-',
    eng: [carData.eng || '2.0L I4'],
    base: basePrice,
    kmT: Math.max(40000, (2026 - carData.year) * 12000),
    name: `${carData.year} ${cleanMake} ${cleanModel}`,
  };
  CAT.push(entry);
  return entry;
}

export const WT: Record<string, number> = {
  compact: 1250,
  hatch: 1250,
  sedan: 1450,
  suv: 1800,
  truck: 2100,
  van: 1950,
  sport: 1450,
  lux: 1650,
  conv: 1250,
};

export const TRIMN: Record<string, string[]> = {
  compact: ['Base', 'LE', 'Sport', 'EX'],
  sedan: ['SE', 'LX', 'EX-L', 'Limited'],
  suv: ['Base', 'LX', 'Sport', 'Limited'],
  truck: ['XL', 'XLT', 'SLT', 'Lariat'],
  sport: ['Base', 'GT', 'Sport', 'Premium'],
  lux: ['Base', 'Premium', 'Sport', 'Executive'],
  van: ['LE', 'EX', 'Sport', 'Limited'],
  hatch: ['Base', 'Sport', 'EX', 'Premium'],
  conv: ['Base', 'Touring', 'Sport', 'Premium'],
};

export const TRIMM = [0.93, 1, 1.05, 1.12];

export const COLORS: [string, string][] = [
  ['Silver', '#a9b2b8'],
  ['Black', '#252b30'],
  ['White', '#e8ebec'],
  ['Grey', '#6c767d'],
  ['Blue', '#2f5d9a'],
  ['Red', '#a8322d'],
  ['Green', '#3d6b52'],
  ['Gold', '#b59a5a'],
  ['Burgundy', '#6b2a35'],
];

export const NAMES = [
  'Marc-André', 'Julie', 'Kevin', 'Sophie', 'Luc', 'Amélie', 'Dave', 'Nadia',
  'Steve', 'Mélanie', 'Patrick', 'Chantal', 'Yan', 'Karine', 'Hugo', 'Éric'
];

export const DEALERS = [
  'Auto Estrie', 'Sherbrooke Auto Plus', 'Garage Lapointe', 'Bolduc Motors', 'Ste-Cécile Autos'
];

export const RUSTN = ['None', 'Surface rust', 'Bubbling paint', 'Perforation', 'Structural rust'];
export const RUSTP = [0, 0.02, 0.09, 0.28, 1];
export const INTP = [0, 0.02, 0.05, 0.09];
export const INTN = ['Clean', 'Light wear', 'Worn, stained', 'Trashed'];

export const SKN: Record<string, string> = {
  neg: 'Negotiation',
  mech: 'Mechanical',
  body: 'Bodywork',
  appr: 'Appraisal',
  paper: 'Paperwork',
  mkt: 'Marketing',
  net: 'Networking',
};

export const LV = [0, 5, 14, 28, 48, 75, 110, 155, 210, 280];

const mkCity = (n: string, v: number, tow: number, adj: number, w: number, on = 0) => ({
  n, v, tow, adj, w, on,
});

export const REGIONS: Record<string, Region> = {
  qc: {
    id: 'qc',
    name: 'Sherbrooke, Quebec',
    lon: -71.9,
    lat: 45.4,
    lx: 3,
    ly: -2.2,
    auth: 'SAAQ',
    taxN: 'QST',
    priv: 0.09975,
    dealer: 0.14975,
    regFee: 95,
    rust: 1,
    ins: 1,
    win: 'law',
    bias: {},
    blurb: 'Salted roads, strict inspections, QST at registration. The home market.',
    cities: [
      mkCity('Sherbrooke', 1, 100, 1, 40),
      mkCity('Magog', 1, 110, 0.98, 12),
      mkCity('Drummondville', 1, 130, 1, 10),
      mkCity('Montréal', 2, 170, 1.04, 14),
      mkCity('Québec', 2, 190, 1.02, 8),
      mkCity('Ottawa (ON)', 2, 200, 0.92, 8, 1),
      mkCity('Gatineau', 2, 200, 0.97, 8),
    ],
  },
  on: {
    id: 'on',
    name: 'Toronto, Ontario',
    lon: -79.4,
    lat: 43.7,
    lx: -3,
    ly: -2.2,
    auth: 'ServiceOntario',
    taxN: 'HST',
    priv: 0.13,
    dealer: 0.13,
    regFee: 120,
    rust: 0.9,
    ins: 1.7,
    win: 'soft',
    bias: { sedan: 1.03 },
    blurb: 'Big market, HST on private sales, a Safety Standards Certificate to register. Insurance runs high.',
    cities: [
      mkCity('Toronto', 1, 100, 1.03, 40),
      mkCity('Mississauga', 1, 110, 1.03, 15),
      mkCity('Hamilton', 1, 120, 1, 12),
      mkCity('London', 2, 190, 0.97, 8),
      mkCity('Ottawa', 2, 210, 1, 8),
      mkCity('Montréal (QC)', 2, 230, 1.02, 6, 1),
    ],
  },
  mi: {
    id: 'mi',
    name: 'Detroit, Michigan',
    lon: -83,
    lat: 42.3,
    lx: -3.5,
    ly: 3.6,
    auth: 'Secretary of State',
    taxN: 'use tax',
    priv: 0.06,
    dealer: 0.06,
    regFee: 100,
    rust: 0.95,
    ins: 1.5,
    win: 'none',
    bias: { truck: 0.93, suv: 0.95, lux: 0.95 },
    blurb: 'Cheap trucks and muscle, 6% use tax, no winter tire law. Closest source of US cars.',
    cities: [
      mkCity('Detroit', 1, 100, 0.97, 40),
      mkCity('Dearborn', 1, 100, 0.97, 14),
      mkCity('Ann Arbor', 1, 115, 1, 12),
      mkCity('Lansing', 2, 170, 0.95, 10),
      mkCity('Windsor (ON)', 2, 150, 1, 8, 1),
    ],
  },
  ns: {
    id: 'ns',
    name: 'Halifax, Nova Scotia',
    lon: -63.6,
    lat: 44.6,
    lx: 3,
    ly: 3,
    auth: 'Service Nova Scotia',
    taxN: 'HST',
    priv: 0.15,
    dealer: 0.15,
    regFee: 100,
    rust: 1.15,
    ins: 1.1,
    win: 'soft',
    bias: { suv: 1.05 },
    blurb: 'Salt and sea air eat cars. 15% HST. Smaller market, fewer flippers.',
    cities: [
      mkCity('Halifax', 1, 100, 0.95, 40),
      mkCity('Dartmouth', 1, 100, 0.95, 15),
      mkCity('Truro', 2, 150, 0.92, 10),
      mkCity('Sydney', 2, 250, 0.9, 6),
      mkCity('Moncton (NB)', 2, 260, 0.95, 6, 1),
    ],
  },
  ab: {
    id: 'ab',
    name: 'Calgary, Alberta',
    lon: -114.1,
    lat: 51,
    lx: 2.5,
    ly: -2.4,
    auth: 'Alberta Registries',
    taxN: 'GST',
    priv: 0,
    dealer: 0.05,
    regFee: 90,
    rust: 0.5,
    ins: 1.5,
    win: 'none',
    bias: { truck: 1.12, suv: 1.06, compact: 0.97 },
    blurb: 'No provincial sales tax and little rust. Trucks hold their value.',
    cities: [
      mkCity('Calgary', 1, 100, 1, 40),
      mkCity('Airdrie', 1, 110, 1, 10),
      mkCity('Red Deer', 2, 160, 0.97, 12),
      mkCity('Edmonton', 2, 200, 0.99, 14),
      mkCity('Lethbridge', 2, 210, 0.95, 6),
      mkCity('Kelowna (BC)', 2, 260, 1.02, 5, 1),
    ],
  },
  bc: {
    id: 'bc',
    name: 'Vancouver, British Columbia',
    lon: -123.1,
    lat: 49.3,
    lx: -3.5,
    ly: -2.2,
    auth: 'ICBC',
    taxN: 'PST',
    priv: 0.12,
    dealer: 0.12,
    regFee: 140,
    rust: 0.3,
    ins: 1.6,
    win: 'law',
    bias: { compact: 1.06, hatch: 1.06, truck: 0.95, sport: 1.04 },
    blurb: 'Almost no rust, 12% tax, mandatory winter tires on mountain highways Oct 1 to Mar 31.',
    cities: [
      mkCity('Vancouver', 1, 100, 1.06, 40),
      mkCity('Surrey', 1, 110, 1.04, 16),
      mkCity('Victoria', 2, 230, 1.05, 8),
      mkCity('Kelowna', 2, 250, 1.0, 8),
      mkCity('Seattle (US)', 2, 160, 0.98, 5, 1),
    ],
  },
};

export const RAW_ISSUES = [
  ['oil', 'Oil seep at valve cover / pan gasket', 'Engine', 1, 40, 120, 2.5, 0.03, 0.8, 0.1, 0, 0.9, 10],
  ['brk', 'Worn pads and rotors', 'Brakes', 1, 120, 280, 2, 0.06, 0.3, 0.8, 0, 0.95, 10],
  ['brl', 'Corroded brake lines', 'Brakes', 3, 300, 650, 4, 0.1, 0.25, 0.2, 0, 0.9, 3, 1],
  ['str', 'Worn struts and bushings', 'Suspension', 1, 300, 750, 4, 0.05, 0.2, 0.8, 0, 0.9, 9],
  ['bj', 'Bad ball joints / control arm', 'Suspension', 2, 260, 520, 3, 0.05, 0.15, 0.6, 0, 0.95, 5, 1],
  ['cv', 'Clicking CV axle', 'Suspension', 1, 180, 380, 3, 0.05, 0.1, 0.9, 0, 0.9, 6],
  ['whb', 'Wheel bearing hum', 'Suspension', 1, 150, 320, 2, 0.05, 0.05, 0.85, 0, 0.9, 6],
  ['exh', 'Exhaust leak / rotted muffler', 'Exhaust', 1, 150, 420, 2, 0.05, 0.6, 0.7, 0, 0.9, 7],
  ['cat', 'Clogged catalytic converter (P0420)', 'Exhaust', 2, 500, 1300, 2.5, 0.06, 0.05, 0.3, 0.95, 0.9, 4],
  ['alt', 'Failing alternator', 'Electrical', 2, 250, 480, 2, 0.08, 0.1, 0.7, 0.3, 0.9, 5],
  ['stt', 'Weak starter', 'Electrical', 2, 130, 320, 2, 0.07, 0.1, 0.6, 0, 0.8, 5],
  ['acc', 'AC compressor dead', 'AC', 1, 450, 950, 4, 0.06, 0.9, 0.5, 0, 0.85, 6],
  ['htc', 'Leaking heater core', 'Heat', 2, 380, 820, 7, 0.05, 0.35, 0.4, 0, 0.9, 3],
  ['o2', 'Faulty O2 sensor (check-engine light)', 'Engine', 1, 60, 200, 1, 0.1, 0.2, 0.2, 0.95, 0.9, 9],
  ['mis', 'Misfire, worn coils and plugs', 'Engine', 1, 80, 320, 1.5, 0.12, 0.1, 0.7, 0.95, 0.9, 8],
  ['tb', 'Timing belt overdue', 'Engine', 2, 350, 750, 6, 0.05, 0.05, 0.05, 0, 0.7, 5],
  ['cl', 'Worn clutch', 'Transmission', 2, 500, 950, 7, 0.06, 0.05, 0.9, 0, 0.9, 4, 0, 1, 0],
  ['trn', 'Slipping transmission', 'Transmission', 3, 1800, 3300, 11, 0.4, 0.1, 0.9, 0.2, 0.9, 2, 0, 0, 1],
  ['cool', 'Coolant leak / failing water pump', 'Engine', 2, 260, 560, 3, 0.05, 0.4, 0.4, 0.1, 0.95, 5],
  ['psl', 'Power-steering leak', 'Suspension', 1, 120, 380, 2.5, 0.04, 0.5, 0.4, 0, 0.9, 5],
  ['rod', 'Rodent-chewed wiring', 'Electrical', 2, 200, 700, 5, 0.05, 0.3, 0.3, 0.4, 0.8, 3],
  ['hg', 'Blown head gasket', 'Engine', 3, 1400, 2300, 14, 0.5, 0.5, 0.6, 0.5, 0.95, 1],
];

export const ISSUES = RAW_ISSUES.map((a: any) => ({
  k: a[0],
  label: a[1],
  sys: a[2],
  sev: a[3],
  lo: a[4],
  hi: a[5],
  hrs: a[6],
  pen: a[7],
  det: { walk: a[8], drive: a[9], obd: a[10], ppi: a[11] },
  w: a[12],
  block: !!a[13],
  man: !!a[14],
  auto: !!a[15],
}));

export const KNOWN_WEAKPOINTS: Record<string, any> = {
  cvt: ['CVT judder and slipping', 'Transmission', 3, 2200, 3400, 9, 0.35, [0.05, 0.9, 0.3, 0.9], 0.45],
  dct: ['DCT shudder, clutch pack worn', 'Transmission', 3, 1400, 2400, 8, 0.3, [0.05, 0.9, 0.2, 0.9], 0.5],
  hg: ['Head gasket weeping coolant', 'Engine', 3, 1500, 2400, 14, 0.5, [0.4, 0.5, 0.4, 0.95], 0.25],
  chain: ['Timing chain stretch (rattle on cold start)', 'Engine', 3, 1100, 2000, 12, 0.3, [0.05, 0.5, 0.6, 0.9], 0.3],
  n20: ['N20 timing chain guide failure', 'Engine', 3, 1800, 2900, 12, 0.38, [0.05, 0.5, 0.6, 0.9], 0.4],
  turbo: ['Turbo / high-pressure fuel pump failure', 'Engine', 3, 1800, 3600, 10, 0.35, [0.05, 0.6, 0.6, 0.9], 0.35],
  oilc: ['Burns oil, worn rings', 'Engine', 2, 900, 1700, 10, 0.2, [0.2, 0.3, 0.1, 0.9], 0.4],
  airsusp: ['Air suspension collapsed', 'Suspension', 2, 900, 1900, 6, 0.2, [0.6, 0.6, 0.2, 0.9], 0.6],
  hybrid: ['Hybrid battery degraded', 'Electrical', 3, 1500, 2500, 5, 0.22, [0.05, 0.4, 0.7, 0.9], 0.3],
  theta: ['Engine bearing failure (known on this engine)', 'Engine', 3, 2500, 4300, 16, 0.5, [0.1, 0.6, 0.4, 0.9], 0.3],
  trans: ['Transmission shudders on 2-3 shift', 'Transmission', 3, 1800, 2900, 10, 0.35, [0.05, 0.8, 0.2, 0.9], 0.3],
};

export const STOCKS = [
  { s: 'MIX', n: 'Maple Index ETF', k: 'etf', p0: 24.5, d: 0.0003, v: 0.008, y: 0.018 },
  { s: 'GLB', n: 'Global Equity ETF', k: 'etf', p0: 41, d: 0.00032, v: 0.009, y: 0.015 },
  { s: 'BND', n: 'Canadian Bond ETF', k: 'etf', p0: 18, d: 0.00012, v: 0.0025, y: 0.032 },
  { s: 'DIV', n: 'Dividend Growth ETF', k: 'etf', p0: 32, d: 0.00028, v: 0.007, y: 0.035 },
  { s: 'LRL', n: 'Laurentian Rail', k: 'stock', p0: 62, d: 0.0003, v: 0.016, y: 0.01 },
  { s: 'EST', n: 'Estrie Lumber', k: 'stock', p0: 14.2, d: 0.0002, v: 0.022, y: 0 },
  { s: 'NCL', n: 'Nordic Cell Tech', k: 'stock', p0: 88, d: 0.0004, v: 0.028, y: 0 },
  { s: 'AUT', n: 'Autoflip Marketplace', k: 'stock', p0: 27, d: 0.0003, v: 0.02, y: 0 },
];

export const BACKGROUNDS: Record<string, { n: string; d: string; sk: Record<string, number>; cash: number; tools?: any; rep?: number; favours?: number }> = {
  none: {
    n: 'Clean slate',
    d: 'No head start, no baggage. Balanced skills and $2,000 capital.',
    sk: { neg: 5, mech: 5, body: 5, appr: 5, paper: 5, mkt: 5, net: 5 },
    cash: 2000,
  },
  wrench: {
    n: 'Garage kid',
    d: 'Grew up in your uncle’s shop. Starts with high mechanical skill and your own OBD-II scanner.',
    sk: { mech: 14, body: 5 },
    cash: 1850,
    tools: { obd: true },
  },
  sales: {
    n: 'Ex-dealership salesperson',
    d: 'Great negotiator and good at ads. Dealers know you: starts with high negotiation and marketing.',
    sk: { neg: 14, mkt: 5 },
    cash: 2000,
    rep: 40,
  },
  clerk: {
    n: 'Paralegal',
    d: 'Paperwork and legal filings come easy, with a head for appraisal. Free legal filings.',
    sk: { paper: 14, appr: 5 },
    cash: 2000,
  },
  social: {
    n: 'Well connected',
    d: 'Strong network and 3 favors banked with friends across town. Starts with rich connections.',
    sk: { net: 14 },
    cash: 2000,
    favours: 3,
  },
  auction: {
    n: 'Auction regular',
    d: 'Years of watching wholesale blocks. Sharp appraisal and knowledge of auction secrets.',
    sk: { appr: 14, mkt: 5 },
    cash: 1900,
  },
};
