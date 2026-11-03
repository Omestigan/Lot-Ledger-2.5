import React from 'react';
import { BookOpen, Award, TrendingUp, CheckCircle2, History } from 'lucide-react';
import { SKN, LV } from '../game/data';
import { fmt } from '../game/valuation';
import { lv } from '../game/engine';

interface LedgerViewProps {
  skills: Record<string, number>;
  stats: { flips: number; profit: number; best: number };
  log: { d: number; m: string; $: number }[];
  netWorth: number;
  rep: number;
  credit: number;
  day: number;
}

export const LedgerView: React.FC<LedgerViewProps> = ({
  skills,
  stats,
  log,
  netWorth,
  rep,
  credit,
  day,
}) => {
  const milestones = [10000, 50000, 250000];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
        <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
          <span>General Ledger, Skills &amp; Milestone Trackers</span>
        </h2>
        <span className="text-xs text-slate-500">
          Monitor your skill progression, business milestones, and every audited financial transaction.
        </span>
      </div>

      {/* Net Worth Milestones */}
      <div>
        <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white mb-2">
          Wealth Milestones
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {milestones.map((target) => {
            const pct = Math.min(100, Math.max(0, (netWorth / target) * 100));
            return (
              <div
                key={target}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs text-xs"
              >
                <div className="flex items-center justify-between font-mono mb-1.5">
                  <span className="font-bold text-slate-900 dark:text-white">{fmt(target)}</span>
                  <span className="text-slate-500">{pct.toFixed(0)}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7 Core Skills Grid */}
      <div>
        <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white mb-2">
          Flipping &amp; Automotive Skills (Improves with Practice)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.keys(SKN).map((key) => {
            const currentLv = lv(skills, key);
            const a = LV[currentLv - 1] || 0;
            const b = LV[currentLv] || LV[currentLv - 1] || 10;
            const xp = skills[key] || 0;
            const pct = currentLv >= 10 ? 100 : Math.min(100, Math.max(0, ((xp - a) / (b - a)) * 100));

            return (
              <div
                key={key}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">{SKN[key]}</span>
                  <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                    Lv {currentLv}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-slate-400 block text-right">
                  {xp} XP
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Career Record Summary */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs text-xs">
        <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white mb-3">
          Career Record
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono">
          <div>
            <span className="text-slate-400 block text-[11px]">CARS FLIPPED</span>
            <b className="text-slate-900 dark:text-white text-base">{stats.flips}</b>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">TOTAL PROFIT</span>
            <b className="text-emerald-600 dark:text-emerald-400 text-base">{fmt(stats.profit)}</b>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">BEST FLIP</span>
            <b className="text-emerald-600 dark:text-emerald-400 text-base">{fmt(stats.best)}</b>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">REPUTATION</span>
            <b className="text-slate-900 dark:text-white text-base">{rep}/100</b>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">CREDIT SCORE</span>
            <b className="text-slate-900 dark:text-white text-base">{credit}</b>
          </div>
        </div>
      </div>

      {/* Financial Audit Log */}
      <div>
        <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white mb-2 flex items-center gap-2">
          <History className="w-4 h-4 text-slate-400" />
          <span>Accounting Audit Log</span>
        </h3>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto text-xs font-mono">
          {log.map((item, idx) => (
            <div key={idx} className="p-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-slate-400 text-[11px] shrink-0">Day {item.d}</span>
                <span className="text-slate-800 dark:text-slate-200">{item.m}</span>
              </div>
              {item.$ !== 0 && (
                <span
                  className={`font-semibold shrink-0 tabular-nums ${
                    item.$ > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'
                  }`}
                >
                  {item.$ > 0 ? `+${fmt(item.$)}` : fmt(item.$)}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
