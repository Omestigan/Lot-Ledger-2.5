import React, { useState } from 'react';
import { TrendingUp, Sparkles, AlertCircle, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { STOCKS } from '../game/data';
import { fmt } from '../game/valuation';
import { sound } from '../game/audio';

interface InvestViewProps {
  mk: Record<string, number[]>;
  hold: Record<string, { u: number; cost: number }>;
  pitches: any[];
  stakes: any[];
  cash: number;
  onBuyStock: (symbol: string, amount: number) => void;
  onSellStock: (symbol: string, amount: number, all?: boolean) => void;
  onDueDiligence: (pitchId: number) => void;
  onInvestStartup: (pitchId: number, pushEquity: boolean) => void;
}

export const InvestView: React.FC<InvestViewProps> = ({
  mk,
  hold,
  pitches,
  stakes,
  cash,
  onBuyStock,
  onSellStock,
  onDueDiligence,
  onInvestStartup,
}) => {
  const [tradeAmount, setTradeAmount] = useState<string>('200');

  // Compute portfolio total
  let totalPortfolio = 0;
  let totalCost = 0;
  Object.keys(hold).forEach((sym) => {
    const pos = hold[sym];
    const prices = mk[sym];
    const currPrice = prices ? prices[prices.length - 1] : 0;
    totalPortfolio += pos.u * currPrice;
    totalCost += pos.cost;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Portfolio Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs text-slate-500 font-mono">Total Portfolio Value</span>
          <div className="font-display font-black text-2xl text-slate-900 dark:text-white tabular-nums">
            {fmt(totalPortfolio)}
          </div>
          <div className="text-xs font-mono mt-0.5 flex items-center gap-1.5">
            <span className="text-slate-500">Unrealized P&amp;L:</span>
            <span
              className={`font-semibold ${
                totalPortfolio - totalCost >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {fmt(totalPortfolio - totalCost)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-mono">Trade Size:</span>
          <input
            type="number"
            value={tradeAmount}
            onChange={(e) => setTradeAmount(e.target.value)}
            className="w-24 px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Stocks & ETFs Grid */}
      <div>
        <h3 className="font-display font-bold text-base text-slate-900 dark:text-white mb-3">
          Canadian Index ETFs &amp; Equities
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {STOCKS.map((stock) => {
            const history = mk[stock.s] || [stock.p0];
            const currPrice = history[history.length - 1] || stock.p0;
            const prevPrice = history[history.length - 2] || currPrice;
            const changePct = ((currPrice - prevPrice) / prevPrice) * 100;
            const isUp = changePct >= 0;
            const pos = hold[stock.s];

            return (
              <div
                key={stock.s}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 dark:text-white font-mono">
                      {stock.s}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                      {stock.k}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block truncate">{stock.n}</span>

                  <div className="mt-2 flex items-baseline justify-between font-mono">
                    <span className="text-base font-bold text-slate-900 dark:text-white">
                      ${currPrice.toFixed(2)}
                    </span>
                    <span
                      className={`text-[11px] font-semibold flex items-center ${
                        isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      {changePct.toFixed(2)}%
                    </span>
                  </div>

                  {pos && (
                    <div className="mt-1 text-[11px] font-mono text-slate-500">
                      Holding: {fmt(pos.u * currPrice)} ({pos.u.toFixed(2)} units)
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      sound.playCash();
                      onBuyStock(stock.s, +tradeAmount);
                    }}
                    className="flex-1 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 rounded-xl font-mono font-bold text-[11px] transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    Buy
                  </button>
                  <button
                    onClick={() => {
                      sound.playCash();
                      onSellStock(stock.s, +tradeAmount);
                    }}
                    disabled={!pos || pos.u <= 0}
                    className="flex-1 py-1.5 liquid-glass-pill text-zinc-700 dark:text-zinc-300 disabled:opacity-40 rounded-xl font-mono font-bold text-[11px] transition-all cursor-pointer"
                  >
                    Sell
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Angel Investing Pitches */}
      <div className="space-y-3">
        <h3 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Regional Angel Startup Opportunities</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pitches.map((pitch) => (
            <div
              key={pitch.id}
              className="liquid-glass-card rounded-2xl p-4.5 flex flex-col justify-between gap-3 text-xs"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {pitch.name}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full liquid-glass-pill text-amber-600 dark:text-amber-400 font-bold uppercase">
                    {pitch.sec}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 italic leading-relaxed">"{pitch.pitch}"</p>

                <div className="mt-2.5 space-y-1 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                  <div>Ask: <b className="text-slate-900 dark:text-white">{fmt(pitch.ask)}</b> for {pitch.eq}% equity</div>
                  <div>Monthly Rev: {pitch.dd ? `${fmt(pitch.rev)} (Verified)` : `${fmt(pitch.claimed)} (Claimed)`}</div>
                </div>

                {pitch.dd && pitch.flags.length > 0 && (
                  <div className="mt-2 p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[10px] font-mono text-rose-600 dark:text-rose-300">
                    Red Flags: {pitch.flags.join(', ')}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2.5 border-t border-slate-200/50 dark:border-white/5">
                <button
                  onClick={() => onDueDiligence(pitch.id)}
                  disabled={pitch.dd}
                  className="flex-1 py-2 liquid-glass-pill text-zinc-700 dark:text-zinc-300 font-mono font-bold text-[11px] rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  Diligence ($100)
                </button>
                <button
                  onClick={() => {
                    sound.playCash();
                    onInvestStartup(pitch.id, false);
                  }}
                  className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 rounded-xl font-mono font-bold text-[11px] transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  Invest {fmt(pitch.ask)}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
