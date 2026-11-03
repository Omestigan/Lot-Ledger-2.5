import React, { useState } from 'react';
import { ArrowLeftRight, Check, X, ShieldAlert, Sparkles, DollarSign } from 'lucide-react';
import { Car, ConnectionPerk, Region } from '../game/types';
import { CAT } from '../game/data';
import { fmt, estimate } from '../game/valuation';
import { CarPhotoCard } from './CarPhotoCard';
import { sound } from '../game/audio';

interface OffersViewProps {
  offers: any[];
  cars: Car[];
  onAcceptOffer: (offerId: number) => void;
  onDeclineOffer: (offerId: number) => void;
  onCounterOffer: (offerId: number, counterAmt: number) => void;
  onAcceptSwap: (offer: any) => void;
  onDeclineSwap: (offerId: number) => void;
  region: Region;
  activePerks: ConnectionPerk[];
  apprLevel: number;
}

export const OffersView: React.FC<OffersViewProps> = ({
  offers,
  cars,
  onAcceptOffer,
  onDeclineOffer,
  onCounterOffer,
  onAcceptSwap,
  onDeclineSwap,
  region,
  activePerks,
  apprLevel,
}) => {
  const [counterInputs, setCounterInputs] = useState<Record<number, string>>({});

  const handleCounterChange = (id: number, val: string) => {
    setCounterInputs((prev) => ({ ...prev, [id]: val }));
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="liquid-glass border border-slate-200/80 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
            <span>Buyer Messages, Bids &amp; Vehicle Swaps</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Incoming buyer offers on your listed cars. Watch out for overpayment cheque scams!
          </p>
        </div>
        <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700">
          {offers.length} Pending
        </span>
      </div>

      {offers.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400 liquid-glass rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
          No buyer offers right now. List cars from your Garage tab with competitive pricing to attract private buyers!
        </div>
      ) : (
        <div className="space-y-3">
          {offers.map((offer) => {
            const targetCar = cars.find((c) => c.uid === offer.uid);
            if (!targetCar && offer.type !== 'swap') return null;

            if (offer.type === 'swap') {
              const theirCar = offer.l.car;
              const myCar = targetCar || cars[0];
              const theirCat = CAT[theirCar.cid];
              const myCat = myCar ? CAT[myCar.cid] : null;

              return (
                <div
                  key={offer.id}
                  className="liquid-glass rounded-2xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-700/50 space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-2">
                    <span className="font-display font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Direct Vehicle Exchange Offer</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Expires Day {offer.exp}
                    </span>
                  </div>

                  {/* Visual Comparison: Your Car vs Their Car */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Your Car */}
                    {myCar && (
                      <div className="p-3 rounded-xl liquid-glass-card border border-slate-200/60 dark:border-slate-700/40">
                        <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                          You Give (Your Garage)
                        </span>
                        <div className="h-28 rounded-lg overflow-hidden mb-2">
                          <CarPhotoCard car={myCar} className="w-full h-full border-0" />
                        </div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white">
                          {myCat?.year} {myCat?.make} {myCat?.model}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {myCar.km.toLocaleString()} km · Basis: {fmt(myCar.basis)}
                        </div>
                      </div>
                    )}

                    {/* Their Car */}
                    <div className="p-3 rounded-xl liquid-glass-card border border-zinc-400/40 dark:border-zinc-700/60 bg-zinc-50 dark:bg-zinc-900/60">
                      <span className="text-[10px] font-mono uppercase text-zinc-900 dark:text-zinc-100 block mb-1 font-semibold">
                        You Receive (Their Car)
                      </span>
                      <div className="h-28 rounded-lg overflow-hidden mb-2">
                        <CarPhotoCard car={theirCar} className="w-full h-full border-0" />
                      </div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white">
                        {theirCat.year} {theirCat.make} {theirCat.model}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {theirCar.shown.toLocaleString()} km · {theirCar.eng} · {theirCar.tr}
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 liquid-glass-input rounded-xl text-xs flex items-center justify-between font-mono">
                    <span className="text-slate-600 dark:text-slate-300">
                      Cash Adjustment:
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {offer.cash > 0
                        ? `They pay you ${fmt(offer.cash)} cash`
                        : offer.cash < 0
                        ? `You pay them ${fmt(-offer.cash)} cash`
                        : 'Even trade (Zero cash difference)'}
                    </span>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onDeclineSwap(offer.id)}
                      className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg text-xs font-medium cursor-pointer"
                    >
                      Decline Trade
                    </button>
                    <button
                      onClick={() => {
                        sound.playCash();
                        onAcceptSwap(offer);
                      }}
                      className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors"
                    >
                      Accept Trade Swap
                    </button>
                  </div>
                </div>
              );
            }

            // Regular Buyer Offer
            const cat = targetCar ? CAT[targetCar.cid] : null;
            return (
              <div
                key={offer.id}
                className="liquid-glass rounded-2xl p-4 shadow-sm border border-slate-200/80 dark:border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-sm text-slate-900 dark:text-white">
                      {cat?.year} {cat?.make} {cat?.model}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {fmt(offer.amt)}
                    </span>
                    {offer.type === 'scam' && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
                        Suspicious Msg
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 italic">"{offer.msg}"</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="number"
                    placeholder="Counter ($)"
                    value={counterInputs[offer.id] || ''}
                    onChange={(e) => handleCounterChange(offer.id, e.target.value)}
                    className="w-24 px-2.5 py-1.5 text-xs liquid-glass-input rounded-lg font-mono text-slate-900 dark:text-white"
                  />
                  <button
                    onClick={() => {
                      const counter = +counterInputs[offer.id];
                      if (counter > 0) {
                        sound.playDeal();
                        onCounterOffer(offer.id, counter);
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-200/50 hover:bg-slate-300/50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium cursor-pointer transition-colors"
                  >
                    Counter
                  </button>
                  <button
                    onClick={() => {
                      sound.playCash();
                      onAcceptOffer(offer.id);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => onDeclineOffer(offer.id)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
