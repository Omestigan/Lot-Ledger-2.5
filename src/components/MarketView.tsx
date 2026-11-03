import React, { useState } from 'react';
import {
  Search, Filter, DollarSign, Clock, ShieldCheck, AlertTriangle,
  Wrench, Eye, MapPin, CheckCircle2, ChevronRight, Car as CarIcon,
  HelpCircle, ArrowRight, Sparkles, RefreshCw
} from 'lucide-react';
import { Listing, Car, ConnectionPerk, Region } from '../game/types';
import { CAT, RUSTN } from '../game/data';
import { estimate, fmt, quoteListing } from '../game/valuation';
import { SvgCarSilhouette } from './SvgCarSilhouette';
import { sound } from '../game/audio';
import { WorldLocation } from '../game/locations';

interface MarketViewProps {
  listings: Listing[];
  selectedListing: Listing | null;
  onSelectListing: (listing: Listing) => void;
  onMeetSeller: (listing: Listing) => void;
  onInspect: (listing: Listing, tool: string) => void;
  onContact: (listing: Listing, kind: string) => void;
  onDeposit: (listing: Listing) => void;
  onNegotiate: (listing: Listing, offerAmt: number) => void;
  onBidAuction: (listing: Listing, maxBid: number) => void;
  onBuy: (listing: Listing, mode: 'drive' | 'tow') => void;
  onOpenInspector: (car: Car) => void;
  region: Region;
  isInsured: boolean;
  monthlyInsuranceCost: number;
  playerVisits: number;
  favours: number;
  tools: { obd: boolean; comp: boolean };
  activePerks: ConnectionPerk[];
  apprLevel: number;
  location?: WorldLocation;
  onRegenerateMarket?: () => void;
}

export const MarketView: React.FC<MarketViewProps> = ({
  listings,
  selectedListing,
  onSelectListing,
  onMeetSeller,
  onInspect,
  onContact,
  onDeposit,
  onNegotiate,
  onBidAuction,
  onBuy,
  onOpenInspector,
  region,
  isInsured,
  monthlyInsuranceCost,
  playerVisits,
  favours,
  tools,
  activePerks,
  apprLevel,
  location,
  onRegenerateMarket,
}) => {
  const [srcFilter, setSrcFilter] = useState<string>('all');
  const [sortOption, setSortOption] = useState<'new' | 'lo' | 'hi'>('new');
  const [maxPrice, setMaxPrice] = useState<number>(0);
  const [offerInput, setOfferInput] = useState<string>('');
  const [bidInput, setBidInput] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const locCity = location?.city || region.name;
  const locCountry = location?.country || 'Canada';
  const currencySymbol = location?.currencySymbol || '$';
  const currencyMultiplier = location?.currencyMultiplier || 1.0;

  const filteredListings = listings
    .filter((l) => {
      if (srcFilter !== 'all' && l.src !== srcFilter) return false;
      if (maxPrice > 0 && l.ask > maxPrice) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortOption === 'lo') return (a.deal || a.ask) - (b.deal || b.ask);
      if (sortOption === 'hi') return (b.deal || b.ask) - (a.deal || a.ask);
      return b.posted - a.posted || a.ask - b.ask;
    });

  // Select first listing by default if none selected
  React.useEffect(() => {
    if (!selectedListing && filteredListings.length > 0) {
      onSelectListing(filteredListings[0]);
    }
  }, [filteredListings, selectedListing, onSelectListing]);

  const quote = selectedListing
    ? quoteListing(selectedListing, region, isInsured, monthlyInsuranceCost, activePerks)
    : null;

  const [estLo, estHi] = selectedListing
    ? estimate(selectedListing.car, region, apprLevel, activePerks)
    : [0, 0];

  const handleAiRefresh = async () => {
    if (!onRegenerateMarket || isAiLoading) return;
    setIsAiLoading(true);
    sound.playClick();
    try {
      await onRegenerateMarket();
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
      {/* Listings List (Left 6-7 cols) */}
      <div className="lg:col-span-7 flex flex-col gap-3">
        {/* Regional Intelligence & AI Generation Header */}
        <div className="unseen-panel p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{location?.flag || '📍'}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
                  {locCity}, {locCountry}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold border border-zinc-200 dark:border-zinc-700">
                  {location?.currency || 'CAD'} ({currencySymbol})
                </span>
              </div>
              <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 mt-0.5">
                {location?.climateLabel || 'Temperate'} · {location?.rustRisk ?? 1.0}x Rust · {location?.inspectionName || 'Safety Inspection'}
              </p>
            </div>
          </div>

          {onRegenerateMarket && (
            <button
              onClick={handleAiRefresh}
              disabled={isAiLoading}
              className="px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
              title="Generate new used car listings calibrated to this location using Gemini AI"
            >
              {isAiLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span>GEMINI SOURCING...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>REGENERATE (GEMINI AI)</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Filter bar */}
        <div className="liquid-glass border border-slate-200/80 dark:border-slate-700/50 rounded-2xl p-3.5 shadow-sm flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            {['all', 'classified', 'dealer', 'auction', 'tow'].map((src) => (
              <button
                key={src}
                onClick={() => setSrcFilter(src)}
                className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-all cursor-pointer ${
                  srcFilter === src
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold shadow-xs scale-102'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/60'
                }`}
              >
                {src === 'classified' ? 'Private' : src === 'tow' ? 'Tow Lot' : src}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              className="px-2.5 py-1.5 liquid-glass-input rounded-lg text-slate-700 dark:text-slate-300 font-medium cursor-pointer text-xs"
            >
              <option value="new">Newest</option>
              <option value="lo">Price: Low to High</option>
              <option value="hi">Price: High to Low</option>
            </select>

            <select
              value={maxPrice}
              onChange={(e) => setMaxPrice(+e.target.value)}
              className="px-2.5 py-1.5 liquid-glass-input rounded-lg text-slate-700 dark:text-slate-300 font-medium cursor-pointer text-xs"
            >
              <option value="0">Any Price</option>
              <option value="2000">Up to $2,000</option>
              <option value="3500">Up to $3,500</option>
              <option value="5000">Up to $5,000</option>
              <option value="8000">Up to $8,000</option>
            </select>
          </div>
        </div>

        {/* Listings Cards Grid */}
        <div className="flex flex-col gap-2.5">
          {filteredListings.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 liquid-glass border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl">
              No vehicles match these filters. Advance a day or check the Connections tab to unlock off-market leads!
            </div>
          ) : (
            filteredListings.map((listing) => {
              const car = listing.car;
              const cat = CAT[car.cid];
              const isSelected = selectedListing?.id === listing.id;

              return (
                <div
                  key={listing.id}
                  onClick={() => {
                    sound.playClick();
                    onSelectListing(listing);
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-zinc-900 bg-zinc-100/90 dark:border-zinc-100 dark:bg-zinc-800/80 shadow-xs ring-1 ring-zinc-900/10 dark:ring-white/10'
                      : 'liquid-glass-card border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-400 dark:hover:border-zinc-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Minimal Monochrome Blueprint Thumbnail */}
                    <div className="w-24 h-16 shrink-0 bg-zinc-900/90 rounded-lg p-1 border border-zinc-800/80">
                      <SvgCarSilhouette
                        cls={cat.cls}
                        color={car.color?.[1] || '#38bdf8'}
                        className="w-full h-full"
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-sm text-slate-900 dark:text-white">
                          {cat.year} {cat.make} {cat.model}
                        </span>
                        {listing.lead && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
                            Network Lead
                          </span>
                        )}
                        {listing.deal > 0 && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 font-semibold border border-zinc-300 dark:border-zinc-700">
                            Agreed Deal
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-1.5">
                        <span>{car.shown.toLocaleString()} km</span>
                        <span>·</span>
                        <span>{car.eng}</span>
                        <span>·</span>
                        <span>{car.tr}</span>
                        <span>·</span>
                        <span>{listing.city.n}</span>
                      </div>

                      <div className="flex items-center gap-1.5 mt-1 text-[11px] font-mono text-slate-400">
                        <span className="capitalize">{listing.src}</span>
                        <span>·</span>
                        <span>{listing.seller.name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right sm:shrink-0">
                    <span className="font-display font-bold text-base text-slate-900 dark:text-white tabular-nums block">
                      {fmt(listing.deal || listing.ask)}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {listing.src === 'auction' ? 'Opening Bid' : 'Asking Price'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Selected Listing Dossier (Right 5 cols) */}
      <div className="lg:col-span-5 liquid-glass border border-slate-200/80 dark:border-slate-700/50 rounded-2xl p-5 shadow-md sticky top-28 space-y-4">
        {selectedListing ? (
          <>
            {/* Minimal Monochrome Blueprint Vehicle Spec */}
            <div className="relative group rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800/80 p-3 bg-zinc-950 dark:bg-[#060608] shadow-inner">
              <SvgCarSilhouette
                cls={CAT[selectedListing.car.cid].cls}
                color={selectedListing.car.color?.[1] || '#38bdf8'}
                className="w-full h-36"
                showBlueprintGrid={true}
              />
              <div className="absolute top-2.5 left-3 flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-200 border border-zinc-700">
                  VIN: {selectedListing.car.vin.slice(0, 8)}•••
                </span>
                <span className="font-mono text-[10px] text-zinc-300 bg-zinc-900/90 px-2 py-0.5 rounded-md border border-zinc-800">
                  {selectedListing.car.color?.[0] || 'Factory'}
                </span>
              </div>
              <div className="absolute bottom-2.5 right-3">
                <button
                  onClick={() => onOpenInspector(selectedListing.car)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 shadow-sm flex items-center gap-1.5 transition-all cursor-pointer font-mono"
                >
                  <Wrench className="w-3.5 h-3.5 text-zinc-400" />
                  [ SPECS ]
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                  {CAT[selectedListing.car.cid].year} {CAT[selectedListing.car.cid].make} {CAT[selectedListing.car.cid].model}
                </h3>
                <span className="text-sm font-display font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {fmt(selectedListing.deal || selectedListing.ask)}
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {selectedListing.seller.name} ({selectedListing.seller.type}) · {selectedListing.city.n}
              </div>
            </div>

            {/* Ad text quote */}
            <div className="p-3.5 liquid-glass-card border border-slate-200/60 dark:border-slate-700/40 rounded-xl text-xs italic text-slate-700 dark:text-slate-300">
              "{selectedListing.text}"
            </div>

            {/* Appraisal estimate */}
            <div className="p-3.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl text-xs flex justify-between items-center font-mono">
              <span className="text-zinc-700 dark:text-zinc-300 font-medium">Your Appraisal:</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100">
                {fmt(estLo)} – {fmt(estHi)}
              </span>
            </div>

            {/* Contact Actions */}
            {selectedListing.src !== 'auction' && (
              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                  Contact &amp; Seller Meeting
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => {
                      sound.playClick();
                      onContact(selectedListing, 'prob');
                    }}
                    disabled={!!selectedListing.asked.prob}
                    className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 text-left transition-colors cursor-pointer"
                  >
                    Ask Problems
                  </button>
                  <button
                    onClick={() => {
                      sound.playClick();
                      onContact(selectedListing, 'why');
                    }}
                    disabled={!!selectedListing.asked.why}
                    className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 text-left transition-colors cursor-pointer"
                  >
                    Why Selling?
                  </button>
                </div>

                <div className="mt-2">
                  <button
                    onClick={() => {
                      sound.playClick();
                      onMeetSeller(selectedListing);
                    }}
                    disabled={selectedListing.met === 1}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer ${
                      selectedListing.met === 1
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900'
                    }`}
                  >
                    {selectedListing.met === 1
                      ? 'Meeting Seller Today'
                      : `Meet in ${selectedListing.city.n} (${selectedListing.city.v} visit)`}
                  </button>
                </div>
              </div>
            )}

            {/* Inspections */}
            {selectedListing.src !== 'auction' && (
              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                  Inspect Vehicle
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => {
                      sound.playClick();
                      onInspect(selectedListing, 'walk');
                    }}
                    disabled={selectedListing.met !== 1}
                    className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 text-left transition-colors cursor-pointer"
                  >
                    Walk-around (Free)
                  </button>
                  <button
                    onClick={() => {
                      sound.playClick();
                      onInspect(selectedListing, 'drive');
                    }}
                    disabled={selectedListing.met !== 1 || !isInsured}
                    className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 text-left transition-colors cursor-pointer"
                  >
                    Test Drive
                  </button>
                  <button
                    onClick={() => {
                      sound.playClick();
                      onInspect(selectedListing, 'obd');
                    }}
                    disabled={selectedListing.met !== 1 || !tools.obd}
                    className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 text-left transition-colors cursor-pointer"
                  >
                    OBD-II Scan {tools.obd ? '' : '(No tool)'}
                  </button>
                  <button
                    onClick={() => {
                      sound.playClick();
                      onInspect(selectedListing, 'hist');
                    }}
                    className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                  >
                    Vehicle History (~$35)
                  </button>
                </div>
              </div>
            )}

            {/* Negotiation & Purchase Section */}
            {selectedListing.src === 'auction' ? (
              <div className="p-4 liquid-glass-card rounded-xl border border-slate-200/70 dark:border-slate-700/50 space-y-3">
                <span className="font-bold text-xs text-slate-900 dark:text-white block">
                  Auction Blind Bid
                </span>
                <p className="text-[11px] text-slate-500">
                  Sold as-is, sight unseen. The highest proxy bid wins.
                </p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Max Bid ($)"
                    value={bidInput}
                    onChange={(e) => setBidInput(e.target.value)}
                    className="text-xs px-3 py-1.5 liquid-glass-input rounded-lg flex-1 text-slate-900 dark:text-white font-mono"
                  />
                  <button
                    onClick={() => {
                      sound.playCash();
                      onBidAuction(selectedListing, +bidInput);
                    }}
                    className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors"
                  >
                    Place Bid
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 liquid-glass-card rounded-xl border border-slate-200/70 dark:border-slate-700/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">
                    Negotiate Offer
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    Round {selectedListing.rounds}/4
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Your Offer ($)"
                    value={offerInput}
                    onChange={(e) => setOfferInput(e.target.value)}
                    className="text-xs px-3 py-1.5 liquid-glass-input rounded-lg flex-1 text-slate-900 dark:text-white font-mono"
                  />
                  <button
                    onClick={() => {
                      sound.playDeal();
                      onNegotiate(selectedListing, +offerInput);
                    }}
                    className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors"
                  >
                    Make Offer
                  </button>
                </div>

                {/* Purchase Cost Breakdown */}
                {quote && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs space-y-1.5 font-mono">
                    <div className="flex justify-between text-slate-500">
                      <span>Vehicle Price:</span>
                      <span>{fmt(quote.price)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Sales Tax ({region.taxN}):</span>
                      <span>{fmt(quote.qst)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Plates &amp; Inspection:</span>
                      <span>{fmt(quote.reg + quote.insp)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700">
                      <span>Drive Home Total:</span>
                      <span>{fmt(quote.drive)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Tow Home (Taxes Later):</span>
                      <span>{fmt(quote.towT)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button
                        onClick={() => {
                          sound.playCash();
                          onBuy(selectedListing, 'drive');
                        }}
                        disabled={selectedListing.met !== 1 || !!quote.why}
                        className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-center disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        Buy &amp; Drive
                      </button>
                      <button
                        onClick={() => {
                          sound.playCash();
                          onBuy(selectedListing, 'tow');
                        }}
                        disabled={selectedListing.met !== 1}
                        className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg text-center disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        Buy &amp; Tow
                      </button>
                    </div>
                    {quote.why && (
                      <p className="text-[11px] text-rose-500 font-sans mt-1">{quote.why}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="py-16 text-center text-xs text-slate-400">
            Select a vehicle listing from the left to inspect mechanical health, negotiate price, or buy.
          </div>
        )}
      </div>
    </div>
  );
};
