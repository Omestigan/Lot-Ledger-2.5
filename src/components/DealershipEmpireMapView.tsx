import React, { useState } from 'react';
import {
  Building2, Plus, ArrowUpRight, ShieldCheck, DollarSign, Sparkles,
  Car as CarIcon, Hammer, Layers, Trophy, Check, AlertCircle, Info, Move
} from 'lucide-react';
import { Car } from '../game/types';
import { GameState } from '../game/engine';
import { fmt } from '../game/valuation';
import { sound } from '../game/audio';
import {
  DealershipEmpireState,
  DealershipBuilding,
  AVAILABLE_BUILDING_CATALOG,
  getEmpireTotalBonuses
} from '../game/empire';

interface DealershipEmpireMapViewProps {
  state: GameState;
  onUpgradeBuilding: (buildingId: string, cost: number) => void;
  onConstructBuilding: (typeId: string, gridX: number, gridY: number, cost: number) => void;
  onPlaceDisplayCar: (carUid: number, gridX: number, gridY: number) => void;
  onOpenTuningStudio?: (car: Car) => void;
  onFlashNotification: (msg: string) => void;
}

export const DealershipEmpireMapView: React.FC<DealershipEmpireMapViewProps> = ({
  state,
  onUpgradeBuilding,
  onConstructBuilding,
  onPlaceDisplayCar,
  onOpenTuningStudio,
  onFlashNotification,
}) => {
  const empire: DealershipEmpireState = state.empire || {
    level: 1,
    reputationXp: 120,
    gridWidth: 8,
    gridHeight: 6,
    buildings: [],
    displayCars: [],
    totalVisitorsToday: 24,
    passiveDailyRevenue: 1650,
  };

  const [selectedTile, setSelectedTile] = useState<{ x: number; y: number } | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<DealershipBuilding | null>(null);
  const [isBuildCatalogOpen, setIsBuildCatalogOpen] = useState(false);

  const bonuses = getEmpireTotalBonuses(empire);

  // Check what occupies each tile
  const getOccupantAt = (x: number, y: number) => {
    const building = empire.buildings.find((b) => b.gridX === x && b.gridY === y);
    if (building) return { type: 'building' as const, data: building };

    const dispCar = (empire.displayCars || []).find((c: { carUid: number; gridX: number; gridY: number }) => c.gridX === x && c.gridY === y);
    if (dispCar) {
      const carObj = state.cars.find((c: Car) => c.uid === dispCar.carUid);
      return { type: 'car' as const, data: dispCar, car: carObj };
    }

    return null;
  };


  const handleTileClick = (x: number, y: number) => {
    sound.playClick();
    setSelectedTile({ x, y });
    const occupant = getOccupantAt(x, y);
    if (occupant?.type === 'building') {
      setSelectedBuilding(occupant.data);
      setIsBuildCatalogOpen(false);
    } else {
      setSelectedBuilding(null);
    }
  };

  const handleUpgrade = (building: DealershipBuilding) => {
    sound.playCash();
    if (state.cash < building.upgradeCost) {
      onFlashNotification('Insufficient cash to upgrade this dealership facility!');
      return;
    }
    onUpgradeBuilding(building.id, building.upgradeCost);
    setSelectedBuilding({
      ...building,
      level: building.level + 1,
      upgradeCost: Math.round(building.upgradeCost * 1.6),
    });
    onFlashNotification(`Upgraded ${building.name} to Level ${building.level + 1}!`);
  };

  const handleConstruct = (catalogItem: typeof AVAILABLE_BUILDING_CATALOG[0]) => {
    if (!selectedTile) return;
    if (state.cash < catalogItem.unlockCost) {
      onFlashNotification('Insufficient cash balance to construct facility!');
      return;
    }
    sound.playCash();
    onConstructBuilding(catalogItem.typeId, selectedTile.x, selectedTile.y, catalogItem.unlockCost);
    setIsBuildCatalogOpen(false);
    onFlashNotification(`Constructed new ${catalogItem.name} on lot plot [${selectedTile.x}, ${selectedTile.y}]!`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-zinc-100 font-sans">
      {/* Top Empire Stats Ribbon */}
      <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl backdrop-blur-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white text-zinc-950 flex items-center justify-center shadow-lg font-bold">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-display font-black tracking-tight text-white">
                Dealership Headquarters &amp; Empire Map
              </h1>
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold bg-white text-zinc-950 rounded-full">
                CLASH TYCOON
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Construct facilities, upgrade service bays, and display tuned supercars on your lot grid.
            </p>
          </div>
        </div>

        {/* Total Empire Buffs Display */}
        <div className="flex items-center flex-wrap gap-2 text-xs font-mono">
          <div className="px-3 py-2 rounded-2xl bg-zinc-950 border border-zinc-800">
            <span className="text-[10px] text-zinc-500 uppercase font-bold block">Passive Revenue</span>
            <span className="text-emerald-400 font-bold">+{fmt(bonuses.dailyRevenue)}/day</span>
          </div>

          <div className="px-3 py-2 rounded-2xl bg-zinc-950 border border-zinc-800">
            <span className="text-[10px] text-zinc-500 uppercase font-bold block">Lot Capacity</span>
            <span className="text-white font-bold">+{bonuses.extraSlots} Spots</span>
          </div>

          <div className="px-3 py-2 rounded-2xl bg-zinc-950 border border-zinc-800">
            <span className="text-[10px] text-zinc-500 uppercase font-bold block">Tuning Rebate</span>
            <span className="text-amber-400 font-bold">-{bonuses.tuningDiscountPct}% Parts Cost</span>
          </div>
        </div>
      </div>

      {/* Main Grid & Management Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Interactive Isometric Lot Map Grid (8 cols) */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-sm text-white">Dealership Headquarters Parcel Grid</h3>
            </div>
            <span className="text-xs font-mono text-zinc-500">
              Click any tile to construct, inspect, or park display cars
            </span>
          </div>

          {/* Grid Canvas */}
          <div className="relative bg-zinc-950 p-6 rounded-2xl border border-zinc-800/80 shadow-inner overflow-x-auto">
            <div
              className="grid gap-2 mx-auto"
              style={{
                gridTemplateColumns: `repeat(${empire.gridWidth}, minmax(70px, 1fr))`,
              }}
            >
              {Array.from({ length: empire.gridHeight }).map((_, y) =>
                Array.from({ length: empire.gridWidth }).map((_, x) => {
                  const occupant = getOccupantAt(x, y);
                  const isSelected = selectedTile?.x === x && selectedTile?.y === y;

                  return (
                    <div
                      key={`tile_${x}_${y}`}
                      onClick={() => handleTileClick(x, y)}
                      className={`h-24 rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-center p-2 text-center relative group select-none active:scale-95 ${
                        isSelected
                          ? 'border-white bg-zinc-800/90 shadow-xl'
                          : occupant
                          ? 'border-zinc-700 bg-zinc-900/90 hover:border-zinc-500'
                          : 'border-dashed border-zinc-800/80 bg-zinc-950/60 hover:border-zinc-700 hover:bg-zinc-900/40'
                      }`}
                    >
                      {/* Plot coordinates badge */}
                      <span className="absolute top-1.5 left-2 text-[9px] font-mono text-zinc-600 group-hover:text-zinc-400">
                        {x},{y}
                      </span>

                      {occupant?.type === 'building' && (
                        <div className="space-y-1">
                          <span className="text-2xl block">{occupant.data.icon}</span>
                          <span className="text-[10px] font-mono font-bold text-white truncate max-w-[65px] block">
                            {occupant.data.name.split(' ')[0]}
                          </span>
                          <span className="text-[9px] font-mono text-amber-400 bg-zinc-950 px-1.5 py-0.2 rounded-full border border-zinc-800 font-semibold block">
                            Lv. {occupant.data.level}
                          </span>
                        </div>
                      )}

                      {occupant?.type === 'car' && (
                        <div className="space-y-1">
                          <span className="text-2xl block">🏎️</span>
                          <span className="text-[10px] font-mono font-bold text-white truncate max-w-[65px] block">
                            {occupant.car?.adTitle?.split(' ')[1] || 'Car'}
                          </span>
                          <span className="text-[9px] font-mono text-emerald-400 bg-zinc-950 px-1.5 py-0.2 rounded-full border border-zinc-800 font-semibold block">
                            Display
                          </span>
                        </div>
                      )}

                      {!occupant && (
                        <div className="text-zinc-600 group-hover:text-zinc-400 flex flex-col items-center gap-1">
                          <Plus className="w-4 h-4" />
                          <span className="text-[9px] font-mono uppercase">Plot</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Inspector & Construction Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {selectedBuilding ? (
            /* BUILDING DETAILS & UPGRADE CARD */
            <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl space-y-4 font-mono">
              <div className="flex items-center gap-3">
                <span className="text-3xl p-2 rounded-2xl bg-zinc-950 border border-zinc-800">{selectedBuilding.icon}</span>
                <div>
                  <h3 className="text-base font-bold text-white font-sans">{selectedBuilding.name}</h3>
                  <span className="text-xs text-amber-400 font-bold">Level {selectedBuilding.level} of {selectedBuilding.maxLevel}</span>
                </div>
              </div>

              <p className="text-xs text-zinc-400 font-sans leading-relaxed">{selectedBuilding.description}</p>

              {/* Current Building Output */}
              <div className="space-y-2 p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Daily Revenue:</span>
                  <span className="text-emerald-400 font-bold">+{fmt(selectedBuilding.revenuePerDay * selectedBuilding.level)}/day</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Lot Space Buff:</span>
                  <span className="text-white font-bold">+{selectedBuilding.slotCapacityBonus * selectedBuilding.level} Slots</span>
                </div>
                {selectedBuilding.tuningDiscountPct > 0 && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Workshop Discount:</span>
                    <span className="text-amber-400 font-bold">-{selectedBuilding.tuningDiscountPct * selectedBuilding.level}%</span>
                  </div>
                )}
              </div>

              {/* Upgrade Button */}
              {selectedBuilding.level < selectedBuilding.maxLevel ? (
                <button
                  onClick={() => handleUpgrade(selectedBuilding)}
                  className="w-full py-3 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs font-mono transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Upgrade to Level {selectedBuilding.level + 1} ({fmt(selectedBuilding.upgradeCost)})</span>
                </button>
              ) : (
                <div className="p-3 text-center bg-zinc-950 rounded-2xl text-xs text-emerald-400 font-bold border border-zinc-800">
                  Maximum Upgrade Level Reached
                </div>
              )}
            </div>
          ) : selectedTile ? (
            /* EMPTY PLOT CONSTRUCTION OPTIONS */
            <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl space-y-4">
              <div>
                <h3 className="font-bold text-base text-white">Construct New Facility</h3>
                <p className="text-xs text-zinc-400 font-mono">
                  Selected Lot Plot [{selectedTile.x}, {selectedTile.y}]
                </p>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {AVAILABLE_BUILDING_CATALOG.map((item) => (
                  <div
                    key={item.typeId}
                    className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-all flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{item.icon}</span>
                        <h4 className="text-xs font-bold text-white">{item.name}</h4>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-snug">{item.description}</p>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-400">
                        <span>+{fmt(item.revenuePerDay)}/day</span>
                        {item.slotCapacityBonus > 0 && <span>· +{item.slotCapacityBonus} Slots</span>}
                      </div>
                    </div>

                    <button
                      onClick={() => handleConstruct(item)}
                      disabled={state.cash < item.unlockCost}
                      className="px-3 py-2 rounded-xl bg-white hover:bg-zinc-200 disabled:opacity-40 text-zinc-950 font-bold text-xs font-mono shrink-0 cursor-pointer shadow-md"
                    >
                      {fmt(item.unlockCost)}
                    </button>
                  </div>
                ))}
              </div>

              {/* Park Car on Plot Option */}
              {state.cars.length > 0 && (
                <div className="pt-3 border-t border-zinc-800 space-y-2">
                  <span className="text-xs font-mono font-bold text-zinc-400 block">
                    Or Park Display Vehicle on Plot:
                  </span>
                  <div className="flex gap-2">
                    <select
                      id="car-plot-select"
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
                    >
                      {state.cars.map((c: Car) => (
                        <option key={c.uid} value={c.uid}>
                          {c.adTitle}
                        </option>
                      ))}

                    </select>
                    <button
                      onClick={() => {
                        const sel = document.getElementById('car-plot-select') as HTMLSelectElement;
                        if (sel && sel.value) {
                          onPlaceDisplayCar(parseInt(sel.value), selectedTile.x, selectedTile.y);
                          onFlashNotification('Vehicle placed on showroom display plot!');
                        }
                      }}
                      className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-mono font-bold cursor-pointer"
                    >
                      Park
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* DEFAULT HELPER CARD */
            <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center mx-auto text-amber-400 shadow-inner">
                <Move className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-white">Select Any Lot Plot</h3>
              <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                Click any tile on the headquarters grid to construct high-yield facilities, upgrade bays, or stage tuned cars.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
