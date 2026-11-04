import { CAT, WT, TRIMM, RUSTP, INTP, RUSTN } from './data';
import { Car, CarCatalogEntry, ConnectionPerk, Listing, Region } from './types';
import { calculateCarTuningValueBonus } from './tuning';

export const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

let _activeCurrencySymbol = '$';
let _activeCurrencyMultiplier = 1.0;

export function setActiveCurrency(symbol: string, multiplier: number = 1.0) {
  _activeCurrencySymbol = symbol || '$';
  _activeCurrencyMultiplier = multiplier || 1.0;
}

export function getActiveCurrencySymbol(): string {
  return _activeCurrencySymbol;
}

export function getActiveCurrencyMultiplier(): number {
  return _activeCurrencyMultiplier;
}

export const fmt = (n: number, symbol?: string) => {
  const sym = symbol !== undefined ? symbol : _activeCurrencySymbol;
  return (n < 0 ? '−' : '') + sym + Math.abs(Math.round(n)).toLocaleString();
};

export function kmF(km: number, e: CarCatalogEntry) {
  const d = (km - e.kmT) / 1000;
  let f = 1 - d * 0.0028 * (1.35 - e.rel);
  [100, 200, 300].forEach((t) => {
    if (km > t * 1000 && e.kmT <= t * 1000) {
      f -= 0.03 + (1 - e.rel) * 0.1 + (e.rel < 0.45 ? 0.06 : 0);
    }
  });
  return clamp(f, 0.35, 1.35);
}

export function scrapV(c: Car, perks: ConnectionPerk[] = []) {
  const e = CAT[c.cid];
  let baseScrap = 250 + (WT[e.cls] || 1400) * 0.22;
  const scrapBonus = perks.find((p) => p.title.includes('Scrap Bonus'));
  if (scrapBonus) baseScrap += scrapBonus.value;
  return Math.round(baseScrap);
}

export const TITLEM: Record<string, number> = {
  clean: 1,
  vga: 0.62,
  rebuilt: 0.62,
  irreparable: 0.35,
};

export function worth(c: Car, mode: 'true' | 'seen' | 'known', perks: ConnectionPerk[] = []): number {
  const e = CAT[c.cid];
  const K = c.know;
  const tru = mode === 'true';
  const kn = mode === 'known';

  const km = tru || (kn && K.odo) ? c.km : c.shown;
  let v = e.base * TRIMM[c.trim] * kmF(km, e);
  let p = 1;

  c.issues.forEach((i) => {
    if (i.fixed) return;
    const vis = i.det.walk >= 0.5 || i.det.drive >= 0.5;
    if (tru || (!kn && vis) || (kn && (K.issues[i.id] || vis))) {
      p *= 1 - i.pen;
    }
  });

  const rv = tru ? c.rust : kn && K.rust != null ? K.rust : c.rust >= 2 ? c.rust - 1 : c.rust;
  if (rv >= 4) return Math.max(scrapV(c, perks), Math.round(e.base * 0.1));

  p *= 1 - RUSTP[rv];
  const dn = tru || (kn && K.dents != null) ? c.dents : Math.round(c.dents * 0.7);
  p *= 1 - Math.min(0.08, 0.03 * dn);

  if (c.repaint && (tru || (kn && K.accident))) p *= c.gaps ? 0.88 : 0.92;
  p *= 1 - INTP[c.interior];
  if (c.water && (tru || (kn && K.water))) p *= 0.85;
  if (c.tread < 25) p *= 0.97;
  
  // Shady beater modification penalty ONLY applies if the car lacks authentic Dyno tuning
  const hasDynoTune = Boolean(c.tuning?.parts && c.tuning.parts.length > 0);
  if (c.modded && !hasDynoTune) p *= 0.93;
  if (c.recall && (tru || (kn && K.hist))) p *= 0.95;

  const tt = tru ? c.title : kn && K.hist ? K.hist.title : c.adTitle;
  p *= TITLEM[tt] || 1;

  if (c.use !== 'personal' && (tru || (kn && K.hist))) p *= 0.93;
  if (c.detail) p *= 1.03;

  // Add aftermarket Dyno performance tuning value retention
  const { addedWorth: tuningAddedWorth } = calculateCarTuningValueBonus(c, e);

  v = v * p + Math.min(3, c.receipts) * 250 + tuningAddedWorth;
  if (!c.regd && c.reg !== 'valid') v -= 200;

  return Math.max(scrapV(c, perks), Math.round(v / 10) * 10);
}

export function mkt(c: Car, region: Region, gas = 0, currentMonth = 10): number {
  const e = CAT[c.cid];
  let f = region.bias[e.cls] || 1;
  const m = currentMonth;

  if (e.cls === 'conv' || e.cls === 'sport') {
    f *= m >= 3 && m <= 6 ? 1.12 : m >= 11 || m <= 1 ? 0.88 : 1;
  }
  if (e.drv === 'AWD' || e.drv === '4WD' || e.cls === 'truck') {
    f *= m >= 9 && m <= 11 ? 1.08 : m >= 4 && m <= 8 ? 0.95 : 1;
  }
  if (e.drv === 'RWD' && (m === 12 || m <= 3)) {
    f *= 0.9;
  }
  if (e.base < 5000 && m >= 2 && m <= 4) {
    f *= 1.08;
  }
  if (gas > 0) {
    f *= e.cls === 'truck' || e.cls === 'suv' || e.cls === 'van' ? 0.9 : e.cls === 'compact' || e.cls === 'hatch' ? 1.05 : 1;
  }
  return f;
}

export function noise(c: Car): number {
  return (((c.uid * 9301 + 49297) % 233280) / 233280) * 2 - 1;
}

export function estimate(
  c: Car,
  region: Region,
  lvAppr: number,
  perks: ConnectionPerk[] = [],
  currentMonth = 10,
  gas = 0
): [number, number] {
  const n = clamp(0.2 - 0.018 * lvAppr, 0.04, 0.2);
  const mid = worth(c, 'known', perks) * mkt(c, region, gas, currentMonth) * (c.know.full ? 1 : 0.94) * (1 + noise(c) * n * 0.5);
  return [Math.round((mid * (1 - n)) / 10) * 10, Math.round((mid * (1 + n)) / 10) * 10];
}

export function blockers(c: Car): string[] {
  const b = c.issues.filter((i) => !i.fixed && i.block).map((i) => i.label);
  if (c.rust >= 3) b.push(RUSTN[c.rust]);
  return b;
}

export function quoteListing(
  l: Listing,
  region: Region,
  isInsured: boolean,
  monthlyInsCost: number,
  perks: ConnectionPerk[] = []
) {
  const c = l.car;
  const price = l.deal || l.ask;
  const d = l.src === 'dealer';
  const au = l.src === 'auction' || l.src === 'tow';

  // Perks effect on auction fee
  const noAuctFee = perks.some((p) => p.type === 'auction_no_fee');
  const fee = l.src === 'auction' ? (noAuctFee ? 0 : price * 0.1) : 0;

  const gst = d ? price * region.dealer : 0;
  const qst = d ? 0 : (price + fee) * region.priv;

  // Expedited paperwork perk
  const paperPerk = perks.find((p) => p.title.includes('Safety Certification'));
  const inspDiscount = paperPerk ? paperPerk.value : 0;

  const reg = region.regFee + (c.reg === 'oop' ? 120 : 0) + (c.reg === 'riv' ? 160 : 0);
  const baseInsp = !d && (c.reg !== 'valid' || c.title !== 'clean') ? 150 : 0;
  const insp = Math.round(baseInsp * (1 - inspDiscount));
  const insC = isInsured ? 0 : monthlyInsCost;

  const base = price + fee + gst;
  const regC = qst + reg + insp;

  // Tow capping perk
  let tow = l.tow;
  const towCapPerk = perks.find((p) => p.type === 'tow_cap' && p.value <= 100);
  if (towCapPerk) tow = Math.min(tow, towCapPerk.value);
  const multiHaulPerk = perks.find((p) => p.title.includes('Multi-Car Hauler Rate'));
  if (multiHaulPerk) tow = Math.round(tow * (1 - multiHaulPerk.value));

  const bl = blockers(c);
  const why = au
    ? 'Auction and tow-lot cars have no plates, so they must be towed.'
    : c.title === 'irreparable'
    ? 'Irreparable title: it cannot be registered.'
    : !d && bl.length
    ? `Would fail the safety inspection (${bl[0].toLowerCase()}).`
    : '';

  return {
    price,
    fee,
    gst,
    qst,
    reg,
    insp,
    insC,
    base,
    regC,
    tow,
    why,
    drive: base + regC + insC,
    towT: base + tow,
  };
}
