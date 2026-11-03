import React, { useState } from 'react';
import {
  Store, Users, DollarSign, TrendingUp, ShieldCheck, AlertTriangle,
  Car as CarIcon, ArrowRight, Sparkles, Building2, Eye, Handshake,
  CheckCircle2, ChevronRight, Award
} from 'lucide-react';
import { RivalDealership } from '../game/rivals';
import { Car } from '../game/types';
import { CAT } from '../game/data';
import { fmt, worth } from '../game/valuation';
import { sound } from '../game/audio';
import { SvgCarSilhouette } from './SvgCarSilhouette';

interface RivalDealershipsViewProps {
  rivals: RivalDealership[];
  playerCars: Car[];
  playerCash: number;
  playerRep: number;
  onBuyCarFromRival: (rival: RivalDealership, car: Car, price: number) => void;
  onSellCarToRival: (rival: RivalDealership, car: Car, price: number) => void;
  currencySymbol?: string;
}

export const RivalDealershipsView: React.FC<RivalDealershipsViewProps> = ({
  rivals,
  playerCars,
  playerCash,
  playerRep,
  onBuyCarFromRival,
  onSellCarToRival,
  currencySymbol = '$',
}) => {
  const [selectedRivalId, setSelectedRivalId] = useState<string>(rivals[0]?.id || '');
  const [sellModalOpen, setSellModalOpen] = useState<boolean>(false);
  const [selectedSellCar, setSelectedSellCar] = useState<Car | null>(null);

  const activeRival = rivals.find((r) => r.id === selectedRivalId) || rivals[0];

  return (
    <div className="space-y-4">
      {/* Upper Status Banner */}
      <div className="liquid-glass border border-slate-200/80 dark:border-slate-700/60 rounded-3xl p-5 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold">
              <Store className="w-4 h-4" />
            </div>
            <h2 className="font-display font-extrabold text-xl text-slate-900 dark:text-white">
              Competing AI Dealerships &amp; Market Intelligence
            </h2>
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30">
              {rivals.length} Active Rival Franchises
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Rival AI dealerships compete daily for classifieds and auction listings, manage their own lot inventory, and sell to retail buyers. Visit their lots to purchase wholesale trade-ins or offload your excess stock!
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-xs font-mono">
            <span className="text-slate-400 block">Your Market Rep</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">{playerRep}/100</span>
          </div>
          <div className="h-8 w-px bg-slate-300 dark:bg-slate-700" />
          <div className="text-right text-xs font-mono">
            <span className="text-slate-400 block">Your Capital</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
              {currencySymbol}{playerCash.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Rivals Grid Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {rivals.map((rival) => {
          const isSelected = rival.id === activeRival?.id;
          return (
            <div
              key={rival.id}
              onClick={() => {
                sound.playClick();
                setSelectedRivalId(rival.id);
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'border-purple-500/80 bg-purple-500/15 dark:bg-purple-600/20 shadow-md ring-1 ring-purple-500/40'
                  : 'liquid-glass-card border-slate-200/60 dark:border-slate-700/40 hover:border-purple-400/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: rival.color }}
                  />
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                    {rival.marketShare}% Market Share
                  </span>
                </div>

                <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                  {rival.name}
                </h3>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  GM: {rival.ownerName}
                </span>

                <div className="mt-2 text-xs font-mono text-purple-600 dark:text-purple-400 font-semibold">
                  {rival.personalityLabel}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500">
                  Lot: <b className="text-slate-800 dark:text-slate-200">{rival.inventory.length}</b>/{rival.lotCapacity}
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {currencySymbol}{rival.cash.toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Rival Detailed View & Wholesale Showroom */}
      {activeRival && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Rival Dossier & Profile (4 cols) */}
          <div className="lg:col-span-4 liquid-glass border border-slate-200/80 dark:border-slate-700/60 rounded-3xl p-5 shadow-md space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-purple-600 dark:text-purple-400 font-bold">
                  Franchise Dossier
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">
                  Rep: {activeRival.reputation}%
                </span>
              </div>
              <h3 className="font-display font-extrabold text-lg text-slate-900 dark:text-white mt-0.5">
                {activeRival.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Operated by {activeRival.ownerName}
              </p>
            </div>

            <div className="p-3.5 liquid-glass-card rounded-2xl text-xs text-slate-600 dark:text-slate-300 leading-relaxed border border-slate-200/50 dark:border-slate-700/50">
              "{activeRival.strategyDescription}"
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-500">
                <span>Lot Pricing Strategy:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  +{Math.round((activeRival.pricingMarkup - 1) * 100)}% Retail Markup
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Cash Reserve:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {currencySymbol}{activeRival.cash.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Lot Stock Capacity:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {activeRival.inventory.length} / {activeRival.lotCapacity} vehicles
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-2">
              <button
                onClick={() => {
                  sound.playClick();
                  setSellModalOpen(true);
                }}
                disabled={playerCars.length === 0}
                className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Sell Car to {activeRival.name} Wholesale</span>
              </button>
            </div>

            {/* Recent Sales Ticker */}
            <div>
              <h4 className="text-[11px] font-mono uppercase font-bold text-slate-400 mb-2">
                Recent Rival Sales Record
              </h4>
              <div className="space-y-1.5">
                {activeRival.recentSales.length === 0 ? (
                  <div className="text-xs text-slate-400 italic">No retail transactions recorded yet.</div>
                ) : (
                  activeRival.recentSales.map((sale, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-xs flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          {sale.carName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">Day {sale.day}</span>
                      </div>
                      <div className="text-right font-mono">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {currencySymbol}{sale.price.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          +{currencySymbol}{sale.profit.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Rival Lot Inventory (8 cols) */}
          <div className="lg:col-span-8 liquid-glass border border-slate-200/80 dark:border-slate-700/60 rounded-3xl p-5 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-extrabold text-base text-slate-900 dark:text-white">
                  {activeRival.name} — Current Lot Inventory
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Inspect and purchase wholesale stock directly from this rival dealer.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
                {activeRival.inventory.length} In Stock
              </span>
            </div>

            {activeRival.inventory.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400 liquid-glass border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl space-y-2">
                <Store className="w-8 h-8 mx-auto text-slate-500 opacity-60" />
                <p>This rival currently has no vehicles parked on their lot.</p>
                <p className="text-[11px] text-slate-500">
                  Advance the day to allow them to bid at auctions and purchase classified leads!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeRival.inventory.map((car) => {
                  const cat = CAT[car.cid];
                  const estWorth = worth(car, 'known', []);
                  const askingPrice = Math.round((estWorth * activeRival.pricingMarkup) / 50) * 50;

                  return (
                    <div
                      key={car.uid}
                      className="liquid-glass-card border border-slate-200/70 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm space-y-3"
                    >
                      {/* Vehicle Silhouette Blueprint */}
                      <SvgCarSilhouette
                        cls={cat.cls}
                        color={car.color?.[1] || '#a855f7'}
                        className="w-full h-24"
                        showBlueprintGrid={true}
                      />

                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                            {cat.year} {cat.make} {cat.model}
                          </h4>
                          <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                            {currencySymbol}{askingPrice.toLocaleString()}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap gap-2 font-mono">
                          <span>{car.km.toLocaleString()} km</span>
                          <span>·</span>
                          <span>Title: {car.title.toUpperCase()}</span>
                          <span>·</span>
                          <span>{car.eng}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                        <span className="text-[11px] font-mono text-slate-400">
                          Est. Resale: {currencySymbol}{Math.round(estWorth * 1.1).toLocaleString()}
                        </span>
                        <button
                          onClick={() => {
                            sound.playCash();
                            onBuyCarFromRival(activeRival, car, askingPrice);
                          }}
                          disabled={playerCash < askingPrice}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                        >
                          Buy Wholesale
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sell Car to Rival Wholesale Modal */}
      {sellModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg liquid-glass border border-slate-700/60 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-display font-bold text-base text-white">
                  Wholesale Stock to {activeRival.name}
                </h3>
                <p className="text-xs text-slate-400">
                  Select a vehicle from your garage to sell immediately for cash.
                </p>
              </div>
              <button
                onClick={() => setSellModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 scrollbar-thin">
              {playerCars.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-6">
                  You currently have no vehicles in your garage.
                </div>
              ) : (
                playerCars.map((car) => {
                  const cat = CAT[car.cid];
                  const estWorth = worth(car, 'known', []);
                  const offerPrice = Math.round(estWorth * 0.92);
                  const isSelected = selectedSellCar?.uid === car.uid;

                  return (
                    <div
                      key={car.uid}
                      onClick={() => setSelectedSellCar(car)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'border-purple-500 bg-purple-500/20'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <span className="font-display font-bold text-xs text-white block">
                          {cat.year} {cat.make} {cat.model}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {car.km.toLocaleString()} km · Basis: {currencySymbol}{car.basis.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-xs font-bold text-emerald-400 block">
                          {currencySymbol}{offerPrice.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400">Rival Offer</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {selectedSellCar && (
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-300">
                  Total Payout:{' '}
                  <b className="text-emerald-400">
                    {currencySymbol}
                    {Math.round(worth(selectedSellCar, 'known', []) * 0.92).toLocaleString()}
                  </b>
                </span>
                <button
                  onClick={() => {
                    if (!selectedSellCar) return;
                    sound.playCash();
                    const price = Math.round(worth(selectedSellCar, 'known', []) * 0.92);
                    onSellCarToRival(activeRival, selectedSellCar, price);
                    setSellModalOpen(false);
                    setSelectedSellCar(null);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-md"
                >
                  Confirm Wholesale Sale
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
