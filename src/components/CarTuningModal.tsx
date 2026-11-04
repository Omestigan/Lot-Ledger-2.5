import React, { useState } from 'react';
import {
  Wrench, Zap, DollarSign, Gauge, ShieldAlert, Check, ChevronRight,
  Sparkles, Sliders, ArrowUpRight, Flame, Layers, Info, RotateCcw
} from 'lucide-react';
import { Car, ConnectionPerk, Region } from '../game/types';
import { CAT } from '../game/data';
import { fmt, worth } from '../game/valuation';
import { sound } from '../game/audio';
import {
  TUNING_PARTS_CATALOG,
  TuningPart,
  calculateCarPerformanceMetrics
} from '../game/tuning';

interface CarTuningModalProps {
  car: Car;
  playerCash: number;
  isOpen: boolean;
  onClose: () => void;
  onApplyTuning: (carUid: number, updatedCar: Car, totalCost: number) => void;
  tuningDiscountPct?: number; // e.g. from empire workshop
}

export const CarTuningModal: React.FC<CarTuningModalProps> = ({
  car,
  playerCash,
  isOpen,
  onClose,
  onApplyTuning,
  tuningDiscountPct = 0,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<TuningPart['category'] | 'all'>('all');
  
  // Staged modifications state
  const [installedPartIds, setInstalledPartIds] = useState<string[]>(() => {
    return car.tuning?.parts ? [...car.tuning.parts] : [];
  });
  const [boostPsi, setBoostPsi] = useState<number>(car.tuning?.boostPsi || 0);
  const [gearRatioBias, setGearRatioBias] = useState<'short' | 'balanced' | 'tall'>(
    car.tuning?.gearRatioBias || 'balanced'
  );
  const [suspensionStiffness, setSuspensionStiffness] = useState<number>(
    car.tuning?.suspensionStiffness || 5
  );

  if (!isOpen) return null;

  const catalogEntry = CAT[car.cid];

  // Calculate current baseline metrics vs previewed staged metrics
  const originalMetrics = calculateCarPerformanceMetrics(car, catalogEntry);

  const previewCar: Car = {
    ...car,
    tuning: {
      ...car.tuning,
      parts: installedPartIds,
      boostPsi,
      gearRatioBias,
      suspensionStiffness,
    },
  };
  const previewMetrics = calculateCarPerformanceMetrics(previewCar, catalogEntry);

  // Calculate current market worth vs projected tuned worth
  const currentWorth = worth(car, 'known');
  const previewWorth = worth(previewCar, 'known');
  const worthDelta = previewWorth - currentWorth;

  // Compute newly added parts cost (discount applied)
  const previouslyInstalled = car.tuning?.parts || [];
  const newlyAddedPartIds = installedPartIds.filter((id) => !previouslyInstalled.includes(id));
  const newlyAddedParts = TUNING_PARTS_CATALOG.filter((p) => newlyAddedPartIds.includes(p.id));
  
  const rawPartsCost = newlyAddedParts.reduce((sum, p) => sum + p.cost, 0);
  const discountMultiplier = Math.max(0.6, 1 - (tuningDiscountPct / 100));
  const totalCost = Math.round(rawPartsCost * discountMultiplier);

  const togglePart = (part: TuningPart) => {
    sound.playWrench();
    if (installedPartIds.includes(part.id)) {
      setInstalledPartIds((prev) => prev.filter((id) => id !== part.id));
    } else {
      setInstalledPartIds((prev) => [...prev, part.id]);
    }
  };

  const handleSave = () => {
    if (playerCash < totalCost) {
      sound.playClick();
      return;
    }
    sound.playCash();
    const currentTuningInvested = (car.tuning?.totalInvested || 0) + totalCost;
    const updatedCar: Car = {
      ...previewCar,
      basis: (car.basis || 0) + totalCost,
      tuning: {
        ...previewCar.tuning,
        totalInvested: currentTuningInvested,
      },
      modded: installedPartIds.length > 0 || boostPsi > 0,
      perfMetrics: previewMetrics,
    };
    onApplyTuning(car.uid, updatedCar, totalCost);
    onClose();
  };

  const categories: { id: TuningPart['category'] | 'all'; label: string }[] = [
    { id: 'all', label: 'All Parts' },
    { id: 'ecu', label: 'ECU & Chips' },
    { id: 'forced_induction', label: 'Turbo / Superchargers' },
    { id: 'exhaust', label: 'Exhaust & Headers' },
    { id: 'suspension', label: 'Suspension / Stance' },
    { id: 'brakes', label: 'Big Brakes' },
    { id: 'tires', label: 'Wheels & Slicks' },
    { id: 'weight', label: 'Weight Reduction' },
    { id: 'aero', label: 'Aero & Wings' },
  ];

  const filteredParts = TUNING_PARTS_CATALOG.filter(
    (p) => selectedCategory === 'all' || p.category === selectedCategory
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xl">
      <div className="bg-zinc-950/95 border border-zinc-800 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl text-zinc-100 overflow-hidden font-sans">
        {/* Top Header */}
        <div className="p-5 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-4 bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-lg font-bold">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white font-display">
                  Performance Dyno &amp; Tuning Studio
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-white text-zinc-950 rounded-full">
                  v3.1 PRO TUNER
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">
                Modifying: <span className="text-white font-semibold">{car.adTitle || `${catalogEntry.year} ${catalogEntry.make} ${catalogEntry.model}`}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {tuningDiscountPct > 0 && (
              <span className="px-2.5 py-1 text-[11px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-xl">
                Empire Workshop: -{tuningDiscountPct}% Discount
              </span>
            )}
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Live Performance Comparison HUD Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 p-4 bg-zinc-900/80 border-b border-zinc-800 text-xs font-mono">
          {/* Horsepower */}
          <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
            <span className="text-[10px] text-zinc-500 block uppercase font-bold">Horsepower</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-black text-white">{previewMetrics.hp} HP</span>
              {previewMetrics.hp > originalMetrics.hp && (
                <span className="text-[10px] font-bold text-emerald-400">
                  +{previewMetrics.hp - originalMetrics.hp}
                </span>
              )}
            </div>
          </div>

          {/* 0-60 MPH */}
          <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
            <span className="text-[10px] text-zinc-500 block uppercase font-bold">0-60 MPH (0-100)</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-black text-white">{previewMetrics.zeroToSixtySec}s</span>
              {previewMetrics.zeroToSixtySec < originalMetrics.zeroToSixtySec && (
                <span className="text-[10px] font-bold text-emerald-400">
                  {(previewMetrics.zeroToSixtySec - originalMetrics.zeroToSixtySec).toFixed(2)}s
                </span>
              )}
            </div>
          </div>

          {/* 1/4 Mile Drag */}
          <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
            <span className="text-[10px] text-zinc-500 block uppercase font-bold">1/4 Mile Drag</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-black text-white">{previewMetrics.quarterMileSec}s</span>
              {previewMetrics.quarterMileSec < originalMetrics.quarterMileSec && (
                <span className="text-[10px] font-bold text-emerald-400">
                  {(previewMetrics.quarterMileSec - originalMetrics.quarterMileSec).toFixed(2)}s
                </span>
              )}
            </div>
          </div>

          {/* Top Speed */}
          <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
            <span className="text-[10px] text-zinc-500 block uppercase font-bold">Top Speed</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-black text-white">{previewMetrics.topSpeedKmh} km/h</span>
              <span className="text-[10px] text-zinc-500">({previewMetrics.topSpeedMph} mph)</span>
            </div>
          </div>

          {/* Fuel Consumption */}
          <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
            <span className="text-[10px] text-zinc-500 block uppercase font-bold">Fuel Consumption</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-black text-zinc-200">{previewMetrics.fuelL100km} L/100</span>
              <span className="text-[10px] text-zinc-500">({previewMetrics.fuelMpg} MPG)</span>
            </div>
          </div>

          {/* Reliability & Handling */}
          <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
            <span className="text-[10px] text-zinc-500 block uppercase font-bold">Handling / Rel.</span>
            <div className="flex items-center justify-between text-xs font-bold mt-1">
              <span className="text-cyan-400">{previewMetrics.handlingScore}/100</span>
              <span className="text-zinc-600">·</span>
              <span className={previewMetrics.reliabilityScore < 50 ? 'text-rose-400' : 'text-emerald-400'}>
                {previewMetrics.reliabilityScore}%
              </span>
            </div>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="p-3 border-b border-zinc-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none bg-zinc-950">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-mono font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-white text-zinc-950 shadow-md font-bold'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Main Body: Catalog & Fine Tuning */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Parts List (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
                Performance Hardware Catalog ({filteredParts.length} parts)
              </span>
              <span className="text-[11px] font-mono text-zinc-500">
                {installedPartIds.length} parts installed
              </span>
            </div>

            <div className="space-y-2.5">
              {filteredParts.map((part) => {
                const isInstalled = installedPartIds.includes(part.id);
                const wasPreviouslyInstalled = previouslyInstalled.includes(part.id);
                const discountedPrice = Math.round(part.cost * discountMultiplier);

                return (
                  <div
                    key={part.id}
                    onClick={() => togglePart(part)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                      isInstalled
                        ? 'bg-zinc-900 border-amber-400/70 shadow-lg'
                        : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase bg-zinc-800 text-zinc-300">
                          Stage {part.stage}
                        </span>
                        <span className="text-[11px] font-mono text-amber-400 font-semibold">{part.brand}</span>
                        <h4 className="text-sm font-bold text-white">{part.name}</h4>
                      </div>
                      <p className="text-xs text-zinc-400 font-sans leading-relaxed">{part.desc}</p>
                      
                      {/* Metric impact tags */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[10px]">
                        {part.hpBonus > 0 && (
                          <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900">
                            +{part.hpBonus} HP
                          </span>
                        )}
                        {part.torqueBonus > 0 && (
                          <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900">
                            +{part.torqueBonus} Nm
                          </span>
                        )}
                        {part.weightDeltaKg !== 0 && (
                          <span className="text-cyan-400 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-900">
                            {part.weightDeltaKg > 0 ? `+${part.weightDeltaKg}` : part.weightDeltaKg} kg
                          </span>
                        )}
                        {part.handlingBonus > 0 && (
                          <span className="text-purple-400 font-bold bg-purple-950/60 px-2 py-0.5 rounded border border-purple-900">
                            +{part.handlingBonus} Grip
                          </span>
                        )}
                        {part.reliabilityDelta < 0 && (
                          <span className="text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-900">
                            {part.reliabilityDelta}% Rel.
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {wasPreviouslyInstalled ? (
                        <span className="text-xs font-mono font-bold text-emerald-400 block">INSTALLED</span>
                      ) : (
                        <div>
                          <span className="text-sm font-bold font-mono text-white block">
                            {fmt(discountedPrice)}
                          </span>
                          {tuningDiscountPct > 0 && (
                            <span className="text-[10px] font-mono text-zinc-500 line-through">
                              {fmt(part.cost)}
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className={`w-5 h-5 rounded-lg border mt-2 ml-auto flex items-center justify-center ${
                        isInstalled ? 'bg-amber-400 text-zinc-950 border-amber-400' : 'border-zinc-700 bg-zinc-900'
                      }`}>
                        {isInstalled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Fine Tuning Sliders & Dyno Setup */}
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-4 font-mono">
              <h3 className="font-bold text-xs uppercase tracking-wider text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Fine Calibration Parameters</span>
              </h3>

              {/* Turbo Boost Wastegate PSI */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Turbo Wastegate Boost</span>
                  <span className="font-bold text-amber-400">{boostPsi.toFixed(1)} PSI</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="22"
                  step="0.5"
                  value={boostPsi}
                  onChange={(e) => setBoostPsi(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <span className="text-[10px] text-zinc-500 block">
                  Higher PSI pushes more horsepower at the cost of engine thermal stress and lower reliability.
                </span>
              </div>

              {/* Transmission Gear Ratio Bias */}
              <div className="space-y-1.5 pt-2">
                <span className="text-xs text-zinc-400 block">Final Drive Ratio Bias</span>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {(['short', 'balanced', 'tall'] as const).map((bias) => (
                    <button
                      key={bias}
                      onClick={() => setGearRatioBias(bias)}
                      className={`py-2 rounded-xl border text-center font-bold capitalize transition-all cursor-pointer ${
                        gearRatioBias === bias
                          ? 'bg-white text-zinc-950 border-white'
                          : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                    >
                      {bias === 'short' ? 'Short (Accel)' : bias === 'tall' ? 'Tall (Top Speed)' : 'Balanced'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Suspension Stiffness */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Damper Stiffness</span>
                  <span className="font-bold text-cyan-400">Level {suspensionStiffness}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={suspensionStiffness}
                  onChange={(e) => setSuspensionStiffness(parseInt(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>

            {/* Quick Reset Button */}
            <button
              onClick={() => {
                sound.playClick();
                setInstalledPartIds(previouslyInstalled);
                setBoostPsi(car.tuning?.boostPsi || 0);
                setGearRatioBias(car.tuning?.gearRatioBias || 'balanced');
                setSuspensionStiffness(car.tuning?.suspensionStiffness || 5);
              }}
              className="w-full py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-400 hover:text-white flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Staged Changes</span>
            </button>
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6 text-xs font-mono">
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase font-bold">Total Dyno Bill</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-white">{fmt(totalCost)}</span>
                <span className="text-zinc-400">
                  (Cash: <span className={playerCash < totalCost ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>{fmt(playerCash)}</span>)
                </span>
              </div>
            </div>

            <div className="hidden sm:block border-l border-zinc-800 pl-4">
              <span className="text-zinc-500 block text-[10px] uppercase font-bold">Invested Basis</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-zinc-400">{fmt(car.basis)}</span>
                <span className="text-zinc-500">→</span>
                <span className="text-white font-bold">{fmt(car.basis + totalCost)}</span>
                {totalCost > 0 && <span className="text-emerald-400 font-bold text-[11px]">(+{fmt(totalCost)})</span>}
              </div>
            </div>

            <div className="border-l border-zinc-800 pl-4">
              <span className="text-zinc-500 block text-[10px] uppercase font-bold">Est. Market Valuation</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-zinc-400">{fmt(currentWorth)}</span>
                <span className="text-zinc-500">→</span>
                <span className="text-amber-400 font-bold">{fmt(previewWorth)}</span>
                {worthDelta !== 0 && (
                  <span className={worthDelta > 0 ? 'text-emerald-400 font-bold text-[11px]' : 'text-rose-400 font-bold text-[11px]'}>
                    ({worthDelta > 0 ? '+' : ''}{fmt(worthDelta)})
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold font-mono transition-colors cursor-pointer border border-zinc-800"
            >
              Cancel
            </button>

            <button
              disabled={playerCash < totalCost}
              onClick={handleSave}
              className="px-6 py-2.5 rounded-2xl bg-white hover:bg-zinc-200 disabled:opacity-40 text-zinc-950 text-xs font-bold font-mono transition-all shadow-xl cursor-pointer flex items-center gap-2 active:scale-95"
            >
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Install &amp; Dyno Flash ({fmt(totalCost)})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
