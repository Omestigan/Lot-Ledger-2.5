import React, { useState, useMemo } from 'react';
import {
  Sparkles, Check, ArrowRight, ArrowLeft, ShieldAlert,
  DollarSign, Wrench, Briefcase, FileText, Users, Globe2,
  Compass, MapPin, Search, Star, Award, TrendingUp, CheckCircle2,
  RefreshCw, AlertCircle, ExternalLink, Zap
} from 'lucide-react';
import { GameMode, PlayerCharacter, RegionId } from '../game/types';
import {
  WorldLocation, PRESET_WORLD_CITIES, Continent,
  getCustomDiscoveredCities, saveCustomDiscoveredCity, getGoogleMapsUrl
} from '../game/locations';
import { STARTING_ROLES, StartingRole, StartingRoleId } from '../game/roles';
import { sound } from '../game/audio';


interface MandatoryGameStartModalProps {
  isOpen: boolean;
  onConfirmStart: (region: RegionId, mode: GameMode, player: PlayerCharacter, location: WorldLocation) => void;
}

const SKIN_TONES = ['#f1d3b8', '#e0b48f', '#bf8d63', '#8c5a3a', '#5e3a24'];
const HAIR_COLORS = ['#16120e', '#4a2e1b', '#8a5a2b', '#c9a15a', '#b8b8b8', '#a03a24'];
const SHIRT_COLORS = ['#1d5fa6', '#b4561c', '#1f7a4d', '#6b2a35', '#3a4750', '#b59a5a'];

export const MandatoryGameStartModal: React.FC<MandatoryGameStartModalProps> = ({
  isOpen,
  onConfirmStart,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedRole, setSelectedRole] = useState<StartingRole>(STARTING_ROLES[0]);
  const [selectedLocation, setSelectedLocation] = useState<WorldLocation>(PRESET_WORLD_CITIES[0]);
  const [mode, setMode] = useState<GameMode>('free');

  // Character inputs
  const [name, setName] = useState('Alex Vance');
  const [dealershipName, setDealershipName] = useState('Vance & Sons Auto Exchange');
  const [skin, setSkin] = useState(1);
  const [hair, setHair] = useState(1);
  const [style, setStyle] = useState(0);
  const [shirt, setShirt] = useState(0);

  // City Search
  const [citySearch, setCitySearch] = useState('');
  const [continentFilter, setContinentFilter] = useState<'All' | Continent>('All');
  const [customCities, setCustomCities] = useState<WorldLocation[]>(() => getCustomDiscoveredCities());
  const [isAiAnalyzingCity, setIsAiAnalyzingCity] = useState(false);
  const [aiCityError, setAiCityError] = useState<string | null>(null);

  if (!isOpen) return null;

  const allCities = useMemo(() => {
    const map = new Map<string, WorldLocation>();
    customCities.forEach((c) => map.set(c.id, c));
    PRESET_WORLD_CITIES.forEach((c) => {
      if (!map.has(c.id)) map.set(c.id, c);
    });
    return Array.from(map.values());
  }, [customCities]);

  const filteredCities = allCities.filter((c) => {
    if (continentFilter !== 'All' && c.continent !== continentFilter) return false;
    if (citySearch.trim()) {
      const q = citySearch.toLowerCase();
      return (
        c.city.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        c.climateLabel.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleLookupCityWithAi = async () => {
    const q = citySearch.trim();
    if (!q || isAiAnalyzingCity) return;
    setIsAiAnalyzingCity(true);
    setAiCityError(null);
    sound.playClick();
    const startTime = Date.now();
    try {
      const res = await fetch('/api/ai/lookup-city', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cityName: q }),
      });
      const data = await res.json();
      if (res.ok && data.location) {
        const newLoc = {
          ...data.location,
          responseTimeMs: data.location.responseTimeMs || (Date.now() - startTime),
        };
        saveCustomDiscoveredCity(newLoc);
        setCustomCities((prev) => [newLoc, ...prev.filter((c) => c.id !== newLoc.id)]);
        setSelectedLocation(newLoc);
        sound.playCash();
      } else {
        throw new Error(data.error || 'Failed to analyze city');
      }
    } catch (err: any) {
      setAiCityError(err?.message || 'Could not discover city telemetry.');
    } finally {
      setIsAiAnalyzingCity(false);
    }
  };


  const handleFinish = () => {
    sound.playCash();
    const playerChar: PlayerCharacter = {
      name: name.trim() || 'Alex',
      skin,
      hair,
      style,
      shirt,
      bg: 'none',
      role: selectedRole.id,
    };

    onConfirmStart('qc', mode, playerChar, selectedLocation);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xl animate-fade-in">
      <div className="liquid-glass border border-slate-200/80 dark:border-slate-700/70 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl flex flex-col gap-6 max-h-[92vh] overflow-y-auto">
        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-4">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-blue-600 dark:text-blue-400 font-bold">
              Step {step} of 3: {step === 1 ? 'Choose Starting Role' : step === 2 ? 'Select Global Headquarters' : 'Character & Empire Rules'}
            </span>
            <h2 className="font-display font-black text-2xl text-slate-900 dark:text-white mt-0.5">
              Launch Your Automotive Dealership
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === s
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                    : step > s
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
            ))}
          </div>
        </div>

        {/* STEP 1: SELECT ROLE */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select your career archetype. Each role gives distinct starting capital, diagnostic tooling, statutory perks, and connection affinities.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {STARTING_ROLES.map((role) => {
                const isSelected = selectedRole.id === role.id;
                return (
                  <div
                    key={role.id}
                    onClick={() => {
                      sound.playClick();
                      setSelectedRole(role);
                    }}
                    className={`liquid-glass-card rounded-2xl p-4.5 cursor-pointer transition-all border ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/30 shadow-md ring-2 ring-blue-500/30'
                        : 'border-slate-200/60 dark:border-slate-700/60 hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                          {role.avatarIcon}
                        </span>
                        <div>
                          <h4 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                            {role.name}
                          </h4>
                          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300">
                            {role.badge}
                          </span>
                        </div>
                      </div>

                      <div className="text-right font-mono text-xs">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold block">
                          ${role.startingCash.toLocaleString()}
                        </span>
                        {role.startingDebt > 0 && (
                          <span className="text-rose-500 text-[10px]">
                            -${role.startingDebt.toLocaleString()} debt
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 leading-relaxed">
                      {role.tagline}
                    </p>

                    <div className="mt-3 pt-2.5 border-t border-slate-200/50 dark:border-slate-700/50 space-y-1">
                      {role.perks.map((p, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span>{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-3">
              <button
                onClick={() => {
                  sound.playClick();
                  setStep(2);
                }}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-blue-500/25"
              >
                <span>Continue to Location</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: SELECT STARTING GLOBAL CITY */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Choose your starting headquarters among 70+ global cities or type <b>any city on Earth</b>. Gemini AI determines local climate, road salt, VAT, currency, and market demand.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search list or type any city on Earth (e.g. Reykjavik, Nairobi, Dubai, Munich)..."
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 liquid-glass-input rounded-2xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="button"
                onClick={handleLookupCityWithAi}
                disabled={!citySearch.trim() || isAiAnalyzingCity}
                className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 font-mono text-[11px] font-bold rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 shrink-0 shadow-md active:scale-95"
                title="Discover any city on Earth with Gemini AI & maps.google.com"
              >
                {isAiAnalyzingCity ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    <span>SOURCING...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>AI DISCOVER</span>
                  </>
                )}
              </button>

              <div className="flex flex-wrap gap-1 w-full sm:w-auto">
                {['All', 'North America', 'Europe', 'Asia', 'Middle East', 'South America', 'Oceania'].map((c: any) => (
                  <button
                    key={c}
                    onClick={() => setContinentFilter(c)}
                    className={`px-3 py-1 text-[11px] font-mono rounded-full transition-all cursor-pointer ${
                      continentFilter === c
                        ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20'
                        : 'liquid-glass-pill text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Sourced via maps.google.com banner */}
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 px-1">
              <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                <MapPin className="w-3.5 h-3.5 text-red-500" />
                <span>Geographic &amp; climatic intelligence sourced via <b>maps.google.com</b></span>
              </span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <Zap className="w-3 h-3" />
                <span>Fast Cache Active</span>
              </span>
            </div>

            {aiCityError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-600 dark:text-rose-300 text-xs font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{aiCityError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[360px] overflow-y-auto pr-1">
              {filteredCities.map((city) => {
                const isSelected = selectedLocation.id === city.id;
                return (
                  <div
                    key={city.id}
                    onClick={() => {
                      sound.playClick();
                      setSelectedLocation(city);
                    }}
                    className={`p-4 rounded-3xl liquid-glass-card cursor-pointer border transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-950/40 ring-2 ring-blue-500/40 shadow-lg'
                        : 'border-slate-200/60 dark:border-white/10 hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl p-1 rounded-xl liquid-glass-pill">{city.flag}</span>
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                            {city.city}
                          </h4>
                          <span className="text-[10px] text-slate-500">{city.country}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full liquid-glass-pill text-blue-600 dark:text-blue-400">
                        {city.currency} ({city.currencySymbol})
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-2.5 line-clamp-2 leading-relaxed">
                      {city.experienceHighlight}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-slate-200/50 dark:border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span>Rust: <b className={city.rustRisk > 1.2 ? 'text-rose-500' : 'text-emerald-500'}>{city.rustRisk}x</b></span>
                      <span>Tax: <b>{(city.taxRate * 100).toFixed(1)}%</b></span>
                      <a
                        href={getGoogleMapsUrl(city)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                        title="View on maps.google.com"
                      >
                        <MapPin className="w-2.5 h-2.5 text-red-500" />
                        <span>Maps</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>


            <div className="flex items-center justify-between pt-3">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  setStep(3);
                }}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-blue-500/25"
              >
                <span>Continue to Persona</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: CHARACTER & STORY RULES */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Persona Customizer */}
              <div className="liquid-glass-card rounded-2xl p-4.5 space-y-3.5">
                <h4 className="font-display font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Persona &amp; Identity</span>
                </h4>

                <div>
                  <label className="text-xs text-slate-500 block mb-1">Your Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 liquid-glass-input rounded-xl text-xs text-slate-900 dark:text-white font-medium"
                    placeholder="e.g. Alex Vance"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500 block mb-1">Dealership Name</label>
                  <input
                    type="text"
                    value={dealershipName}
                    onChange={(e) => setDealershipName(e.target.value)}
                    className="w-full p-2.5 liquid-glass-input rounded-xl text-xs text-slate-900 dark:text-white font-medium"
                    placeholder="e.g. Apex Auto Exchange"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500 block mb-1.5">Avatar Skin Tone</label>
                  <div className="flex gap-2">
                    {SKIN_TONES.map((color, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSkin(i)}
                        className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${skin === i ? 'ring-2 ring-blue-500 scale-110' : 'opacity-80'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-500 block mb-1.5">Hair Color</label>
                  <div className="flex gap-2">
                    {HAIR_COLORS.map((color, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setHair(i)}
                        className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${hair === i ? 'ring-2 ring-blue-500 scale-110' : 'opacity-80'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Game Mode / Difficulty */}
              <div className="liquid-glass-card rounded-2xl p-4.5 space-y-3.5">
                <h4 className="font-display font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Game Mode &amp; Rules</span>
                </h4>

                {[
                  {
                    id: 'free' as GameMode,
                    title: 'Free Enterprise (Casual)',
                    desc: 'Endless sandbox. No arbitrary time limits. Learn market reconditioning, negotiate, and expand at your own pace.',
                  },
                  {
                    id: 'twelve' as GameMode,
                    title: '12-Month Flip Limit (Standard)',
                    desc: 'Provincial curbstoning limit applies: you can sell a maximum of 4 vehicles before mandatory dealer certification.',
                  },
                  {
                    id: 'iron' as GameMode,
                    title: 'Iron Flipper (Permadeath)',
                    desc: 'Bankruptcy immediately ends your enterprise. Zero manual saving or undoing mistakes.',
                  },
                ].map((m) => {
                  const isSel = mode === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => {
                        sound.playClick();
                        setMode(m.id);
                      }}
                      className={`p-3 rounded-xl cursor-pointer border transition-all text-xs ${
                        isSel
                          ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/30'
                          : 'border-slate-200/50 dark:border-slate-700/50 hover:border-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white">{m.title}</span>
                        {isSel && <Check className="w-4 h-4 text-blue-600" />}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{m.desc}</p>
                    </div>
                  );
                })}

                {/* Final Confirmation Dossier */}
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-300 space-y-1">
                  <div>Starting As: <b className="text-slate-900 dark:text-white">{selectedRole.name}</b></div>
                  <div>Headquarters: <b className="text-slate-900 dark:text-white">{selectedLocation.city}, {selectedLocation.country}</b></div>
                  <div>Starting Capital: <b className="text-emerald-600">${selectedRole.startingCash.toLocaleString()}</b></div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                onClick={handleFinish}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-sm flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/30"
              >
                <Sparkles className="w-4 h-4" />
                <span>Launch Dealership Empire</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
