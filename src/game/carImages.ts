// Real photographs generated for authentic vehicle class matching
import heroDealership from '../assets/images/lot_dealership_hero_1793325465223.jpg';
import compactSedanPhoto from '../assets/images/car_compact_sedan_1793325464973.jpg';
import truckPhoto from '../assets/images/car_truck_outdoor_1793325466617.jpg';
import sportsCoupePhoto from '../assets/images/car_sports_coupe_1793325465202.jpg';
import suvPhoto from '../assets/images/car_suv_modern_1793328849067.jpg';
import hatchbackPhoto from '../assets/images/car_hatchback_urban_1793328850491.jpg';
import luxurySedanPhoto from '../assets/images/car_luxury_sedan_1793328849058.jpg';
import minivanPhoto from '../assets/images/car_minivan_family_1793328850343.jpg';

export const ASSET_PHOTOS = {
  hero: heroDealership,
  compactSedan: compactSedanPhoto,
  truck: truckPhoto,
  sportsCoupe: sportsCoupePhoto,
  suv: suvPhoto,
  hatchback: hatchbackPhoto,
  luxurySedan: luxurySedanPhoto,
  minivan: minivanPhoto,
};

// Maps make, model, and body class to the exact matching high-resolution photo
export function getCarPhoto(make: string, model: string, cls: string): string {
  const m = model.toLowerCase();
  const c = cls.toLowerCase();
  const mk = make.toLowerCase();

  // Trucks
  if (c === 'truck' || m.includes('f-150') || m.includes('tacoma') || m.includes('silverado') || m.includes('ranger') || m.includes('ram') || m.includes('frontier')) {
    return truckPhoto;
  }

  // Sports & Convertibles
  if (c === 'sport' || c === 'conv' || m.includes('mustang') || m.includes('350z') || m.includes('s2000') || m.includes('miata') || m.includes('charger') || m.includes('gti')) {
    return sportsCoupePhoto;
  }

  // Luxury Sedans
  if (c === 'lux' || mk === 'bmw' || mk === 'mercedes-benz' || mk === 'audi' || mk === 'lexus' || mk === 'acura' || m.includes('328i') || m.includes('335i') || m.includes('c-class') || m.includes('is 250')) {
    return luxurySedanPhoto;
  }

  // SUVs & Crossovers
  if (c === 'suv' || m.includes('rav4') || m.includes('cr-v') || m.includes('forester') || m.includes('escape') || m.includes('equinox') || m.includes('highlander') || m.includes('4runner') || m.includes('rogue') || m.includes('explorer') || m.includes('wrangler') || m.includes('pilot') || m.includes('sorento') || m.includes('x3') || m.includes('rx 350') || m.includes('lr3')) {
    return suvPhoto;
  }

  // Minivans / Vans
  if (c === 'van' || m.includes('sienna') || m.includes('odyssey') || m.includes('caravan')) {
    return minivanPhoto;
  }

  // Hatchbacks
  if (c === 'hatch' || m.includes('fit') || m.includes('yaris') || m.includes('vibe') || m.includes('golf') || m.includes('500') || m.includes('cooper') || m.includes('outback')) {
    return hatchbackPhoto;
  }

  // Sedans & Compacts (Corolla, Civic, Camry, Accord, Elantra, Sonata, etc.)
  return compactSedanPhoto;
}
