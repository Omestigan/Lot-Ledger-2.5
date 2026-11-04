import React, { useState } from 'react';
import {
  Wrench, ShieldCheck, DollarSign, Car as CarIcon, AlertTriangle,
  Sparkles, CheckCircle2, ChevronRight, Eye, Tag, Hammer, Trash2
} from 'lucide-react';
import { Car, ConnectionPerk, Region } from '../game/types';
import { CAT, RUSTN } from '../game/data';
import { estimate, fmt, scrapV } from '../game/valuation';
import { SvgCarSilhouette } from './SvgCarSilhouette';
import { sound } from '../game/audio';

interface GarageViewProps {
  cars: Car[];
  selectedCar: Car | null;
  onSelectCar: (car: Car) => void;
  onDiagnose: (car: Car) => void;
  onRepair: (car: Car, issueId: string, how: 'diy' | 'shop') => void;
  onBodyFix: (car: Car, what: string, how: 'diy' | 'shop') => void;
  onRegister: (car: Car) => void;
  onPayLien: (car: Car) => void;
  onTires: (car: Car) => void;
  onWinterSet: (car: Car) => void;
  onDetail: (car: Car, how: 'diy' | 'shop') => void;
  onListForSale: (car: Car, ask: number, disc: boolean, ad: number) => void;
  onUnlist: (car: Car) => void;
  onWholesale: (car: Car) => void;
  onScrap: (car: Car) => void;
  onPartOut: (car: Car) => void;
  onOpenInspector: (car: Car) => void;
  onOpenTuningStudio?: (car: Car) => void;
  slots: number;
  region: Region;
  activePerks: ConnectionPerk[];
  apprLevel: number;
  mechLevel: number;
}


export const GarageView: React.FC<GarageViewProps> = ({
  cars,
  selectedCar,
  onSelectCar,
  onDiagnose,
  onRepair,
  onBodyFix,
  onRegister,
  onPayLien,
  onTires,
  onWinterSet,
  onDetail,
  onListForSale,
  onUnlist,
  onWholesale,
  onScrap,
  onPartOut,
  onOpenInspector,
  onOpenTuningStudio,
  slots,
  region,
  activePerks,
  apprLevel,
  mechLevel,
}) => {
  const [partsGrade, setPartsGrade] = useState<'new' | 'after' | 'used'>('new');
  const [askPriceInput, setAskPriceInput] = useState<string>('');
  const [discloseDefects, setDiscloseDefects] = useState<boolean>(true);
  const [adTier, setAdTier] = useState<number>(0);

  React.useEffect(() => {
    if (!selectedCar && cars.length > 0) {
      onSelectCar(cars[0]);
    }
  }, [cars, selectedCar, onSelectCar]);

  const [estLo, estHi] = selectedCar
    ? estimate(selectedCar, region, apprLevel, activePerks)
    : [0, 0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
      {/* Cars In Garage (Left 7 cols) */}
      <div className="lg:col-span-7 flex flex-col gap-3">
        {/* Parking Header */}
        <div className="liquid-glass border border-slate-200/80 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <CarIcon className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
              <span>Driveway &amp; Workshop</span>
            </h3>
            <span className="text-xs text-slate-500">
              Capacity: {cars.length} of {slots} parking spot(s) occupied
            </span>
          </div>
        </div>

        {/* Cars List */}
        <div className="flex flex-col gap-3">
          {cars.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 liquid-glass border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl">
              Your garage is currently empty. Visit the Market or Connections tab to acquire vehicles!
            </div>
          ) : (
            cars.map((car) => {
              const cat = CAT[car.cid];
              const isSelected = selectedCar?.uid === car.uid;
              const [lo, hi] = estimate(car, region, apprLevel, activePerks);

              return (
                <div
                  key={car.uid}
                  onClick={() => {
                    sound.playClick();
                    onSelectCar(car);
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-zinc-900 bg-zinc-100/90 dark:border-zinc-100 dark:bg-zinc-800/80 shadow-xs ring-1 ring-zinc-900/10 dark:ring-white/10'
                      : 'liquid-glass-card border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-400 dark:hover:border-zinc-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
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
                        {car.regd ? (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
                            Plated
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-semibold">
                            Unregistered
                          </span>
                        )}
                        {car.sale && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 font-semibold border border-zinc-300 dark:border-zinc-700">
                            Listed {fmt(car.sale.ask)}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {car.km.toLocaleString()} km · Invested: <b className="font-mono text-slate-700 dark:text-slate-300">{fmt(car.basis)}</b>
                      </div>
                    </div>
                  </div>

                  <div className="text-right sm:shrink-0 font-mono">
                    <span className="font-bold text-slate-900 dark:text-white text-sm block">
                      {fmt((lo + hi) / 2)}
                    </span>
                    <span className="text-[10px] text-slate-400">Est. Resale Value</span>
                  </div>
                </div>
              );
            })
          )}

          {/* Empty Slots */}
          {[...Array(Math.max(0, slots - cars.length))].map((_, i) => (
            <div
              key={i}
              className="p-5 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl text-center text-xs text-slate-400 font-mono"
            >
              + Free Parking Spot Available
            </div>
          ))}
        </div>
      </div>

      {/* Selected Car Workbench (Right 5 cols) */}
      <div className="lg:col-span-5 liquid-glass border border-slate-200/80 dark:border-slate-700/50 rounded-2xl p-5 shadow-md sticky top-28 space-y-4">
        {selectedCar ? (
          <>
            <div className="relative group rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800/80 p-3 bg-slate-950/70 shadow-inner">
              <SvgCarSilhouette
                cls={CAT[selectedCar.cid].cls}
                color={selectedCar.color?.[1] || '#38bdf8'}
                className="w-full h-36"
                showBlueprintGrid={true}
              />
              <div className="absolute top-2.5 left-3 flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-200 border border-zinc-700">
                  VIN: {selectedCar.vin.slice(0, 8)}•••
                </span>
                <span className="font-mono text-[10px] text-slate-300 bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-800">
                  {selectedCar.color?.[0] || 'Factory'}
                </span>
              </div>
              <div className="absolute bottom-2.5 right-3 flex items-center gap-2">
                {onOpenTuningStudio && (
                  <button
                    onClick={() => onOpenTuningStudio(selectedCar)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-zinc-950 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer font-bold"
                  >
                    <span>⚡ Dyno Tuning</span>
                  </button>
                )}
                <button
                  onClick={() => onOpenInspector(selectedCar)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  Blueprint
                </button>
              </div>
            </div>


            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                  {CAT[selectedCar.cid].year} {CAT[selectedCar.cid].make} {CAT[selectedCar.cid].model}
                </h3>
                <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                  Est: {fmt(estLo)} – {fmt(estHi)}
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Invested basis: <b className="text-slate-700 dark:text-slate-300 font-mono">{fmt(selectedCar.basis)}</b> · Title: {selectedCar.title}
              </div>
            </div>

            {/* Warnings / Alerts */}
            {selectedCar.lienFlag && !selectedCar.lienPaid && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg text-xs flex items-center justify-between">
                <span className="text-rose-800 dark:text-rose-300 font-medium">
                  Lien of {fmt(selectedCar.lien)} registered!
                </span>
                <button
                  onClick={() => onPayLien(selectedCar)}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-semibold text-xs cursor-pointer"
                >
                  Pay Lien
                </button>
              </div>
            )}

            {!selectedCar.regd && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg text-xs flex items-center justify-between">
                <span className="text-amber-800 dark:text-amber-300">
                  Unregistered ({region.taxN} &amp; safety inspection required)
                </span>
                <button
                  onClick={() => onRegister(selectedCar)}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-semibold text-xs cursor-pointer"
                >
                  Register
                </button>
              </div>
            )}

            {/* Diagnostic & Workbench */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Workbench &amp; Repairs
                </h4>
                <button
                  onClick={() => onDiagnose(selectedCar)}
                  className="text-xs text-zinc-900 dark:text-zinc-100 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Diagnose (1.5h)</span>
                </button>
              </div>

              {/* Parts Grade Selector */}
              <div className="flex items-center gap-2 mb-3 text-xs">
                <span className="text-slate-500">Parts Grade:</span>
                {(['new', 'after', 'used'] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setPartsGrade(g)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer capitalize ${
                      partsGrade === g
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {g === 'after' ? 'Aftermarket' : g}
                  </button>
                ))}
              </div>

              {/* Known Issues List */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedCar.issues.filter((i) => !i.fixed && selectedCar.know.issues[i.id]).length === 0 ? (
                  <div className="text-xs text-slate-400 p-2 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                    No active mechanical faults identified.
                  </div>
                ) : (
                  selectedCar.issues
                    .filter((i) => !i.fixed && selectedCar.know.issues[i.id])
                    .map((issue) => {
                      const gradeMultiplier = partsGrade === 'new' ? 1 : partsGrade === 'after' ? 0.72 : 0.45;
                      const partsCost = Math.round(issue.parts * gradeMultiplier);
                      const shopCost = Math.round(partsCost * 1.15 + issue.hrs * 115);

                      return (
                        <div
                          key={issue.id}
                          className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-xs flex items-center justify-between gap-2"
                        >
                          <div>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                              {issue.label}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {issue.sys} · ~{issue.hrs} hrs DIY
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => {
                                sound.playWrench();
                                onRepair(selectedCar, issue.id, 'diy');
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded font-mono text-[11px] cursor-pointer"
                            >
                              DIY {fmt(partsCost)}
                            </button>
                            <button
                              onClick={() => {
                                sound.playWrench();
                                onRepair(selectedCar, issue.id, 'shop');
                              }}
                              className="px-2 py-1 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded font-mono text-[11px] cursor-pointer font-semibold border border-zinc-300 dark:border-zinc-700"
                            >
                              Shop {fmt(shopCost)}
                            </button>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            {/* Upgrades & Maintenance */}
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                Upgrades &amp; Detailing
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => onDetail(selectedCar, 'diy')}
                  disabled={selectedCar.detail}
                  className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 text-left transition-colors cursor-pointer"
                >
                  Detail DIY ($30 · 5h)
                </button>
                <button
                  onClick={() => onWinterSet(selectedCar)}
                  disabled={selectedCar.winter}
                  className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 text-left transition-colors cursor-pointer"
                >
                  Winter Tire Set ($520)
                </button>
              </div>
            </div>

            {/* Sell on Marketplace */}
            <div className="p-4 liquid-glass-card rounded-xl border border-slate-200/70 dark:border-slate-700/50 space-y-3">
              <span className="font-bold text-xs text-slate-900 dark:text-white block">
                Sell Vehicle
              </span>

              {selectedCar.sale ? (
                <div className="space-y-2">
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    Currently listed on public market for <b className="font-mono">{fmt(selectedCar.sale.ask)}</b>.
                    Check the Offers tab for buyer bids and swaps!
                  </div>
                  <button
                    onClick={() => onUnlist(selectedCar)}
                    className="w-full py-1.5 text-xs font-medium border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Unlist from Market
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder={`Asking Price (suggested ${fmt((estLo + estHi) / 2)})`}
                      value={askPriceInput}
                      onChange={(e) => setAskPriceInput(e.target.value)}
                      className="text-xs px-3 py-1.5 liquid-glass-input rounded-lg flex-1 text-slate-900 dark:text-white font-mono"
                    />
                    <button
                      onClick={() => {
                        const price = +askPriceInput || Math.round((estLo + estHi) / 2);
                        sound.playCash();
                        onListForSale(selectedCar, price, discloseDefects, adTier);
                      }}
                      className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors"
                    >
                      List for Sale
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={discloseDefects}
                        onChange={(e) => setDiscloseDefects(e.target.checked)}
                        className="rounded text-zinc-900 dark:text-zinc-100 cursor-pointer"
                      />
                      <span>Disclose all known defects (prevents lawsuits)</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Wholesale / Scrap Fallbacks */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-mono">
                <button
                  onClick={() => onWholesale(selectedCar)}
                  className="text-zinc-900 dark:text-zinc-100 font-semibold hover:underline cursor-pointer"
                >
                  Wholesale Dealer (~{fmt(Math.round(estLo * 0.75))})
                </button>
                <button
                  onClick={() => onScrap(selectedCar)}
                  className="text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                >
                  Scrap Yard ({fmt(scrapV(selectedCar, activePerks))})
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="py-16 text-center text-xs text-slate-400">
            Select a vehicle in your driveway from the left to repair faults, install upgrades, or list for sale.
          </div>
        )}
      </div>
    </div>
  );
};
