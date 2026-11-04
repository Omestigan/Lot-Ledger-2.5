import React, { useState, useMemo } from 'react';
import {
  Search, Globe2, Compass, ShieldAlert, Sun, Snowflake,
  DollarSign, Wrench, CheckCircle2, ArrowRight, Filter, Sparkles, MapPin,
  RefreshCw, AlertCircle, ExternalLink, Zap, Navigation
} from 'lucide-react';
import {
  WorldLocation, PRESET_WORLD_CITIES, Continent,
  getCustomDiscoveredCities, saveCustomDiscoveredCity, getGoogleMapsUrl, getWikipediaUrl
} from '../game/locations';
import { sound } from '../game/audio';

interface CityDirectoryViewProps {
  currentLocation: WorldLocation;
  onSelectLocation: (loc: WorldLocation) => void;
  day: number;
}

const CONTINENTS: ('All' | Continent)[] = [
  'All',
  'North America',
  'Europe',
  'Asia',
  'Middle East',
  'Africa',
  'South America',
  'Oceania',
];

export const CityDirectoryView: React.FC<CityDirectoryViewProps> = ({
  currentLocation,
  onSelectLocation,
  day,
}) => {
  const [selectedLoc, setSelectedLoc] = useState<WorldLocation>(currentLocation);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContinent, setSelectedContinent] = useState<'All' | Continent>('All');
  const [sortBy, setSortBy] = useState<'name' | 'rust' | 'tax'>('name');
  const [justApplied, setJustApplied] = useState(false);

  // Gemini AI City Lookup State
  const [customCityInput, setCustomCityInput] = useState('');
  const [customCountryInput, setCustomCountryInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedCity, setAnalyzedCity] = useState<WorldLocation | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [customCities, setCustomCities] = useState<WorldLocation[]>(() => getCustomDiscoveredCities());

  const allAvailableCities = useMemo(() => {
    const map = new Map<string, WorldLocation>();
    // Custom cities first
    customCities.forEach((c) => map.set(c.id, c));
    // Preset cities
    PRESET_WORLD_CITIES.forEach((c) => {
      if (!map.has(c.id)) map.set(c.id, c);
    });
    return Array.from(map.values());
  }, [customCities]);

  const filteredCities = useMemo(() => {
    return allAvailableCities.filter((city) => {
      if (selectedContinent !== 'All' && city.continent !== selectedContinent) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          city.city.toLowerCase().includes(q) ||
          city.country.toLowerCase().includes(q) ||
          city.climateLabel.toLowerCase().includes(q) ||
          city.experienceHighlight.toLowerCase().includes(q)
        );
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'rust') return a.rustRisk - b.rustRisk;
      if (sortBy === 'tax') return a.taxRate - b.taxRate;
      return a.city.localeCompare(b.city);
    });
  }, [allAvailableCities, selectedContinent, searchQuery, sortBy]);

  const handleApply = (loc: WorldLocation) => {
    sound.playCash();
    setSelectedLoc(loc);
    onSelectLocation(loc);
    setJustApplied(true);
    setTimeout(() => setJustApplied(false), 2500);
  };

  const handleLookupCustomCity = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = customCityInput.trim();
    const c = customCountryInput.trim();
    if (!q || isAnalyzing) return;

    setIsAnalyzing(true);
    setAiError(null);
    sound.playClick();
    const startTime = Date.now();

    try {
      const res = await fetch('/api/ai/lookup-city', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cityName: q, countryName: c }),
      });
      const data = await res.json();
      if (res.ok && data.location) {
        const newLoc: WorldLocation = {
          ...data.location,
          responseTimeMs: data.location.responseTimeMs || (Date.now() - startTime),
        };
        saveCustomDiscoveredCity(newLoc);
        setCustomCities((prev) => [newLoc, ...prev.filter((c) => c.id !== newLoc.id)]);
        setAnalyzedCity(newLoc);
        setSelectedLoc(newLoc);
        sound.playCash();
      } else {
        throw new Error(data.error || 'Unable to analyze city');
      }
    } catch (err: any) {
      setAiError(err.message || 'Could not discover city telemetry.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner & Active HQ Status with iOS Liquid Glass */}
      <div className="liquid-glass rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-wrap items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-4">
            <span className="text-4xl p-2.5 rounded-2xl liquid-glass-pill shadow-inner">
              {currentLocation.flag}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-display font-black text-2xl sm:text-3xl text-zinc-900 dark:text-white tracking-tight">
                  {currentLocation.city}, {currentLocation.country}
                </h1>
                <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 shadow-xs">
                  [ ACTIVE HEADQUARTERS ]
                </span>
                <a
                  href={getGoogleMapsUrl(currentLocation)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-mono px-3 py-1 rounded-full liquid-glass-button flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-700"
                  title="View on Google Maps"
                >
                  <MapPin className="w-3 h-3 text-red-500" />
                  <span>maps.google.com</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                </a>
                <a
                  href={getWikipediaUrl(currentLocation)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-mono px-3 py-1 rounded-full liquid-glass-button flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white"
                  title="View on Wikipedia.org"
                >
                  <span className="font-serif font-black text-xs leading-none">W</span>
                  <span>wikipedia.org</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                </a>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1.5 max-w-2xl font-mono leading-relaxed">
                {currentLocation.experienceHighlight}
              </p>
            </div>
          </div>
        </div>

        {/* Live Metrics of Active Location */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="p-3.5 rounded-2xl liquid-glass-card text-center min-w-[110px]">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Currency</span>
            <span className="font-bold text-zinc-900 dark:text-white text-sm">
              {currentLocation.currency} ({currentLocation.currencySymbol})
            </span>
          </div>

          <div className="p-3.5 rounded-2xl liquid-glass-card text-center min-w-[110px]">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Rust Belt Risk</span>
            <span className={`font-bold text-sm ${currentLocation.rustRisk > 1.2 ? 'text-rose-500' : 'text-emerald-500'}`}>
              {currentLocation.rustRisk}x
            </span>
          </div>

          <div className="p-3.5 rounded-2xl liquid-glass-card text-center min-w-[110px]">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Sales Tax / VAT</span>
            <span className="font-bold text-zinc-900 dark:text-white text-sm">
              {(currentLocation.taxRate * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* GEMINI AI CITY DISCOVERY SECTION */}
      <div className="liquid-glass rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200/50 dark:border-white/5 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h2 className="font-display font-bold text-base tracking-tight text-zinc-900 dark:text-zinc-100">
                Discover Any City on Earth (Gemini 3.6 + Wikipedia.com + Google Maps)
              </h2>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
              Type any city across any continent. Grounded with live Wikipedia.com summaries, verified road inspection bureaus, official currencies, and Google Maps GPS coordinates via Gemini 3.6 Flash.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-zinc-700 dark:text-zinc-300 bg-zinc-200/60 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-semibold">
              <span className="font-serif font-black text-[11px]">W</span>
              <span>WIKIPEDIA.ORG</span>
            </span>
            <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-white/10 px-2.5 py-0.5 rounded-full">
              MAPS.GOOGLE.COM
            </span>
          </div>
        </div>

        <form onSubmit={handleLookupCustomCity} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          <div className="relative sm:col-span-6">
            <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="City Name (e.g. Springfield, Paris, Munich, Nairobi, Tokyo)..."
              value={customCityInput}
              onChange={(e) => setCustomCityInput(e.target.value)}
              disabled={isAnalyzing}
              className="w-full pl-10 pr-4 py-3 liquid-glass-input rounded-2xl text-xs font-mono placeholder-zinc-400 text-zinc-900 dark:text-white"
              required
            />
          </div>

          <div className="relative sm:col-span-4">
            <Globe2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Country / State (e.g. Oregon USA, France, Germany, Kenya, Japan)..."
              value={customCountryInput}
              onChange={(e) => setCustomCountryInput(e.target.value)}
              disabled={isAnalyzing}
              className="w-full pl-10 pr-4 py-3 liquid-glass-input rounded-2xl text-xs font-mono placeholder-zinc-400 text-zinc-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={!customCityInput.trim() || isAnalyzing}
            className="sm:col-span-2 px-4 py-3 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 font-mono text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md active:scale-95"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                <span>SEARCH...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>DISCOVER</span>
              </>
            )}
          </button>
        </form>

        {aiError && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-600 dark:text-rose-300 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{aiError}</span>
          </div>
        )}

        {/* Analyzed City Preview Banner */}
        {analyzedCity && (
          <div className="p-5 rounded-2xl liquid-glass-card space-y-4 animate-in fade-in zoom-in-95 border border-white/60 dark:border-white/10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <span className="text-4xl p-2 rounded-2xl liquid-glass-pill">{analyzedCity.flag}</span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display font-bold text-lg text-zinc-900 dark:text-zinc-100">
                      {analyzedCity.city}, {analyzedCity.country}
                    </h3>
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full liquid-glass-pill text-zinc-700 dark:text-zinc-300 font-semibold">
                      {analyzedCity.continent}
                    </span>
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30">
                      [ SOURCED IN {analyzedCity.responseTimeMs || 15}MS ]
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 font-mono mt-1">
                    {analyzedCity.description}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={getGoogleMapsUrl(analyzedCity)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 liquid-glass-button text-xs font-mono font-bold rounded-xl flex items-center gap-1.5 text-blue-600 dark:text-blue-400"
                  title="Verify on Google Maps"
                >
                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                  <span>maps.google.com</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <a
                  href={getWikipediaUrl(analyzedCity)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 liquid-glass-button text-xs font-mono font-bold rounded-xl flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white"
                  title="Verify on Wikipedia.org"
                >
                  <span className="font-serif font-black text-xs leading-none">W</span>
                  <span>wikipedia.org</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  onClick={() => handleApply(analyzedCity)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>ESTABLISH HEADQUARTERS</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono pt-3 border-t border-zinc-200/50 dark:border-white/5">
              <div className="p-3 rounded-xl liquid-glass-pill">
                <span className="text-[10px] text-zinc-400 block uppercase">Climate &amp; Rust Belt</span>
                <span className={`font-bold ${analyzedCity.rustRisk > 1.2 ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {analyzedCity.climateLabel} ({analyzedCity.rustRisk}x)
                </span>
              </div>
              <div className="p-3 rounded-xl liquid-glass-pill">
                <span className="text-[10px] text-zinc-400 block uppercase">Local Currency</span>
                <span className="font-bold text-zinc-900 dark:text-white">
                  {analyzedCity.currency} ({analyzedCity.currencySymbol})
                </span>
              </div>
              <div className="p-3 rounded-xl liquid-glass-pill">
                <span className="text-[10px] text-zinc-400 block uppercase">VAT / Sales Tax</span>
                <span className="font-bold text-zinc-900 dark:text-white">
                  {(analyzedCity.taxRate * 100).toFixed(1)}% {analyzedCity.taxName}
                </span>
              </div>
              <div className="p-3 rounded-xl liquid-glass-pill">
                <span className="text-[10px] text-zinc-400 block uppercase">Road Bureau / Agency</span>
                <span className="font-bold text-zinc-900 dark:text-white truncate block">
                  {analyzedCity.inspectionName}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Navigation className="w-3 h-3 text-blue-500" />
                <span>GPS Coordinates: {analyzedCity.lat.toFixed(4)}°, {analyzedCity.lng.toFixed(4)}°</span>
              </span>
              <span className="italic">
                Demand: {analyzedCity.experienceHighlight}
              </span>
            </div>
          </div>
        )}
      </div>


      {/* Search & Continent Filters */}
      <div className="liquid-glass rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Bar */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search global cities, countries, or climates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 liquid-glass-input rounded-2xl text-xs font-mono placeholder-zinc-400 text-zinc-900 dark:text-white"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 text-xs font-mono w-full md:w-auto justify-end">
            <span className="text-zinc-500 dark:text-zinc-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-3.5 py-2 liquid-glass-input rounded-xl text-xs cursor-pointer font-mono"
            >
              <option value="name">City Name (A–Z)</option>
              <option value="rust">Lowest Rust Corrosion</option>
              <option value="tax">Lowest Sales Tax</option>
            </select>
            <span className="text-zinc-500 dark:text-zinc-400 font-mono text-xs ml-2">
              [ <b>{filteredCities.length}</b> cities ]
            </span>
          </div>
        </div>

        {/* Continent Filter Chips */}
        <div className="flex flex-wrap gap-1.5">
          {CONTINENTS.map((cont) => {
            const active = selectedContinent === cont;
            return (
              <button
                key={cont}
                onClick={() => {
                  sound.playClick();
                  setSelectedContinent(cont);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer ${
                  active
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-bold shadow-md'
                    : 'liquid-glass-pill text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                [ {cont} ]
              </button>
            );
          })}
        </div>
      </div>

      {/* Global Cities Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCities.map((city) => {
          const isCurrent = city.id === currentLocation.id;
          const isSelected = city.id === selectedLoc.id;

          return (
            <div
              key={city.id}
              className={`liquid-glass-card rounded-3xl p-5 flex flex-col justify-between gap-4 transition-all hover:-translate-y-1 ${
                isCurrent
                  ? 'ring-2 ring-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/25 shadow-lg'
                  : isSelected
                  ? 'ring-2 ring-blue-500 bg-blue-50/20 dark:bg-blue-950/20 shadow-md'
                  : ''
              }`}
            >
              {/* Header */}
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-3xl p-1.5 rounded-xl liquid-glass-pill">{city.flag}</span>
                    <div>
                      <h3 className="font-display font-bold text-base text-zinc-900 dark:text-white leading-tight">
                        {city.city}
                      </h3>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                        {city.country} · <span>{city.continent}</span>
                      </span>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full liquid-glass-pill text-zinc-800 dark:text-zinc-200">
                    {city.currency} ({city.currencySymbol})
                  </span>
                </div>

                {/* Experience Highlight */}
                <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-3 leading-relaxed">
                  {city.experienceHighlight}
                </p>

                {/* Detailed Tags */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2.5 rounded-xl liquid-glass-pill">
                    <span className="text-zinc-400 block text-[9px] uppercase">Climate &amp; Rust</span>
                    <span className={`font-semibold ${city.rustRisk > 1.2 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {city.climateLabel} ({city.rustRisk}x)
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl liquid-glass-pill">
                    <span className="text-zinc-400 block text-[9px] uppercase">Tax / VAT</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {(city.taxRate * 100).toFixed(1)}% {city.taxName}
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                  <span className="truncate">Bureau: <b className="text-zinc-700 dark:text-zinc-300">{city.inspectionName}</b></span>
                  <a
                    href={getGoogleMapsUrl(city)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline shrink-0 ml-2"
                    title="View on Google Maps"
                  >
                    <MapPin className="w-3 h-3 text-red-500" />
                    <span>Maps</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                  </a>
                </div>
              </div>

              {/* Action */}
              <div className="pt-3 border-t border-zinc-200/50 dark:border-white/5 flex items-center justify-between">
                {isCurrent ? (
                  <span className="w-full py-2 px-3 rounded-2xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>[ ACTIVE HEADQUARTERS ]</span>
                  </span>
                ) : (
                  <button
                    onClick={() => handleApply(city)}
                    className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 font-mono text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95"
                  >
                    <span>ESTABLISH HQ ({city.currencySymbol})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

