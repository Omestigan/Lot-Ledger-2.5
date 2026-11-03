import React from 'react';
import { Globe2, Ship, Truck, ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Listing, Car } from '../game/types';
import { CAT } from '../game/data';
import { fmt } from '../game/valuation';
import { CarPhotoCard } from './CarPhotoCard';
import { sound } from '../game/audio';

interface TradeViewProps {
  imports: Listing[];
  transit: any[];
  onOrderImport: (listing: Listing) => void;
  onRemoteInspect: (listing: Listing) => void;
  onExportCar: (carId: number, destKey: string) => void;
  cars: Car[];
}

export const TradeView: React.FC<TradeViewProps> = ({
  imports,
  transit,
  onOrderImport,
  onRemoteInspect,
  onExportCar,
  cars,
}) => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Trade Header */}
      <div className="liquid-glass border border-slate-200/80 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <Globe2 className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
            <span>International Automotive Trade: Imports &amp; Exports</span>
          </h2>
          <span className="text-xs text-slate-500">
            Import 15+ year JDM legends from Japan or rust-free trucks from Michigan. Export high-demand vehicles abroad.
          </span>
        </div>
      </div>

      {/* In Transit Shipments */}
      {transit.length > 0 && (
        <div>
          <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <Ship className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            <span>Active Ocean &amp; Ground Shipments ({transit.length})</span>
          </h3>
          <div className="space-y-2">
            {transit.map((t) => (
              <div
                key={t.id}
                className="p-3.5 liquid-glass-card rounded-2xl border border-slate-200/60 dark:border-slate-700/40 flex items-center justify-between text-xs font-mono"
              >
                <div className="flex items-center gap-3">
                  <Truck className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {t.dir === 'in' ? `Importing from ${t.from}` : `Exporting to ${t.to}`}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      {CAT[t.car.cid].year} {CAT[t.car.cid].make} {CAT[t.car.cid].model}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-zinc-900 dark:text-zinc-100 font-semibold block">
                    {t.arr > 1 ? `Arrives in ${t.arr} days` : 'Clearing Customs at Port'}
                  </span>
                  {t.held === 1 && (
                    <span className="text-[10px] text-amber-500 font-semibold">Customs Hold</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Imports */}
      <div>
        <h3 className="font-display font-bold text-base text-slate-900 dark:text-white mb-3">
          Available Global Import Listings
        </h3>

        {imports.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 liquid-glass rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
            No international listings available this week. Import vessels dock weekly!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {imports.map((l) => {
              const car = l.car;
              const cat = CAT[car.cid];
              return (
                <div
                  key={l.id}
                  className="liquid-glass-card border border-slate-200/60 dark:border-slate-700/40 rounded-2xl p-4 shadow-sm flex flex-col justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="h-32 rounded-xl overflow-hidden mb-2">
                      <CarPhotoCard car={car} className="w-full h-full border-0" />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {cat.year} {cat.make} {cat.model}
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {fmt(l.ask)}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Origin: <b className="text-slate-700 dark:text-slate-300">{l.city.n}</b>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <button
                      onClick={() => onRemoteInspect(l)}
                      className="flex-1 py-1.5 border border-slate-300 dark:border-slate-700 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg font-medium text-[11px] cursor-pointer"
                    >
                      Inspect ($180)
                    </button>
                    <button
                      onClick={() => {
                        sound.playCash();
                        onOrderImport(l);
                      }}
                      className="flex-1 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-lg font-semibold text-[11px] cursor-pointer shadow-xs transition-colors"
                    >
                      Order Import
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
