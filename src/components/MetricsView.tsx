import React, { useState, useEffect } from 'react';
import {
  Award, BarChart3, TrendingUp, DollarSign, Users, Car,
  ShieldCheck, AlertTriangle, Scale, Trophy, Sparkles, Globe, ArrowUpRight, Zap
} from 'lucide-react';
import { GameState } from '../game/engine';
import { fmt } from '../game/valuation';
import { auth, subscribeToOnlineDealers, CloudUserProfile } from '../lib/firebase';

interface MetricsViewProps {
  state: GameState;
  netWorth: number;
  onNavigateTab: (tab: string) => void;
  onFlash: (msg: string) => void;
}

/**
 * UNDISCLOSED TYCOON INDEX FORMULA (For Developer Reference):
 * Tycoon Index = Math.floor(
 *   100
 *   + (NetWorth / 1000) * 0.35
 *   + (TotalFlips * 12)
 *   + (TotalProfit > 0 ? (TotalProfit / 5000) * 15 : 0)
 *   + (Reputation * 4)
 *   + (ActiveConnections * 25)
 *   + (CarsCount * 18)
 *   - (ActiveLegalSuits * 30)
 *   - (Debt > 0 ? (Debt / 2000) * 5 : 0)
 * )
 */
export function calculateTycoonIndex(state: GameState, netWorth: number): number {
  const flips = state.stats.flips || 0;
  const profit = state.stats.profit || 0;
  const rep = state.rep || 100;
  const connectionsCount = Object.values(state.connections.contacts).filter((c) => c.status === 'active').length;
  const carsCount = state.cars.length;
  const activeSuits = state.suits.filter((s) => s.stage !== 'closed').length;
  const debt = state.debt || 0;

  const score = Math.floor(
    100 +
    (netWorth / 1000) * 0.35 +
    flips * 12 +
    (profit > 0 ? (profit / 5000) * 15 : 0) +
    rep * 4 +
    connectionsCount * 25 +
    carsCount * 18 -
    activeSuits * 30 -
    (debt > 0 ? (debt / 2000) * 5 : 0)
  );

  return Math.max(10, score);
}

export function getTycoonRank(score: number): { title: string; color: string; badge: string } {
  if (score >= 2500) return { title: 'Apex Auto Mogul', color: 'from-amber-400 to-yellow-600', badge: '👑 Tier 1' };
  if (score >= 1200) return { title: 'Master Wholesaler', color: 'from-purple-500 to-indigo-600', badge: '💎 Tier 2' };
  if (score >= 600) return { title: 'Established Lot Owner', color: 'from-blue-500 to-cyan-600', badge: '⭐ Tier 3' };
  if (score >= 300) return { title: 'Rising Flipper', color: 'from-emerald-500 to-teal-600', badge: '🔥 Tier 4' };
  return { title: 'Rookie Trader', color: 'from-slate-500 to-gray-600', badge: '🌱 Tier 5' };
}

export const MetricsView: React.FC<MetricsViewProps> = ({
  state,
  netWorth,
  onNavigateTab,
  onFlash,
}) => {
  const [onlineDealers, setOnlineDealers] = useState<CloudUserProfile[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'rivals' | 'players'>('all');

  useEffect(() => {
    const unsub = subscribeToOnlineDealers((dealers) => {
      setOnlineDealers(dealers);
    });
    return () => unsub();
  }, []);

  const myTycoonIndex = calculateTycoonIndex(state, netWorth);
  const myRank = getTycoonRank(myTycoonIndex);

  const activeConnectionsCount = Object.values(state.connections.contacts).filter((c) => c.status === 'active').length;
  const activeSuitsCount = state.suits.filter((s) => s.stage !== 'closed').length;

  // AI Benchmark Rivals for comparison
  const aiRivals = [
    {
      name: 'Veloce Prestige Motors',
      dealership: 'Veloce Motors',
      netWorth: 850000,
      flips: 82,
      connections: 12,
      score: 1850,
      isMe: false,
      isAi: true,
    },
    {
      name: 'Crown City Auctions',
      dealership: 'Crown City Lot',
      netWorth: 420000,
      flips: 48,
      connections: 8,
      score: 1120,
      isMe: false,
      isAi: true,
    },
    {
      name: 'Rustbelt Clearance Yard',
      dealership: 'Rustbelt Liquidation',
      netWorth: 180000,
      flips: 29,
      connections: 5,
      score: 540,
      isMe: false,
      isAi: true,
    },
  ];

  // Combined Leaderboard
  const combinedList = [
    {
      name: state.player?.name || 'My Dealership',
      dealership: `${state.player?.name || 'Pro'}'s Auto Lot`,
      netWorth,
      flips: state.stats.flips || 0,
      connections: activeConnectionsCount,
      score: myTycoonIndex,
      isMe: true,
      isAi: false,
    },
    ...aiRivals,
    ...onlineDealers.map((d) => ({
      name: d.displayName,
      dealership: d.dealershipName,
      netWorth: d.netWorth || 50000,
      flips: 10,
      connections: 3,
      score: Math.floor(100 + ((d.netWorth || 50000) / 1000) * 0.35 + 10 * 12 + (d.reputation || 100) * 4),
      isMe: d.uid === auth.currentUser?.uid,
      isAi: false,
    })),
  ].sort((a, b) => b.score - a.score);

  const filteredList = combinedList.filter((item) => {
    if (activeFilter === 'rivals') return item.isAi;
    if (activeFilter === 'players') return !item.isAi;
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Floating Header */}
      <div className="liquid-glass rounded-3xl p-6 shadow-xl border border-white/70 dark:border-slate-800 floating-panel flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-zinc-900 dark:text-zinc-100" />
            <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white">
              Player Metrics &amp; Tycoon Comparison
            </h2>
            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700">
              Multi-Factor Audit
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Compare your dealership efficiency, liquidity, and overall Tycoon Index score against rival automotive networks.
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('b2b')}
          className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
        >
          <Globe className="w-4 h-4" />
          <span>Open B2B Trade Network</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Hero Tycoon Score Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 liquid-glass rounded-3xl p-6 shadow-xl border border-zinc-300 dark:border-zinc-800 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/10 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
                Calculated Rating
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${myRank.color} text-white shadow-xs`}>
                {myRank.badge}
              </span>
            </div>

            <div className="font-display font-extrabold text-4xl text-slate-900 dark:text-white mt-1 tabular-nums">
              {myTycoonIndex.toLocaleString()}
            </div>
            <div className="font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-300 bg-clip-text text-transparent mt-0.5">
              {myRank.title}
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
              Proprietary dealership valuation index computed from net worth, flip throughput, relationship reach, and risk control.
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Global Rank:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              #{combinedList.findIndex((i) => i.isMe) + 1} of {combinedList.length}
            </span>
          </div>
        </div>

        {/* 6 Key Performance Metric Badges */}
        <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="liquid-glass-card rounded-2xl p-4 floating-panel flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono mb-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                <span>Net Worth</span>
              </div>
              <div className="font-bold text-base text-slate-900 dark:text-white tabular-nums">
                {fmt(netWorth)}
              </div>
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-2">Cash: {fmt(state.cash)}</span>
          </div>

          <div className="liquid-glass-card rounded-2xl p-4 floating-panel flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono mb-1">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>Total Flips</span>
              </div>
              <div className="font-bold text-base text-slate-900 dark:text-white tabular-nums">
                {state.stats.flips || 0}
              </div>
            </div>
            <span className="text-[10px] text-emerald-500 font-mono mt-2">Profit: {fmt(state.stats.profit || 0)}</span>
          </div>

          <div className="liquid-glass-card rounded-2xl p-4 floating-panel flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono mb-1">
                <Users className="w-3.5 h-3.5 text-blue-500" />
                <span>Connections</span>
              </div>
              <div className="font-bold text-base text-slate-900 dark:text-white tabular-nums">
                {activeConnectionsCount} Active
              </div>
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-2">Trust Avg: {state.rep}%</span>
          </div>

          <div className="liquid-glass-card rounded-2xl p-4 floating-panel flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono mb-1">
                <Car className="w-3.5 h-3.5 text-indigo-500" />
                <span>Garage Slots</span>
              </div>
              <div className="font-bold text-base text-slate-900 dark:text-white tabular-nums">
                {state.cars.length} / {state.slots}
              </div>
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-2">
              {state.slots - state.cars.length} Available
            </span>
          </div>

          <div className="liquid-glass-card rounded-2xl p-4 floating-panel flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono mb-1">
                <Zap className="w-3.5 h-3.5 text-purple-500" />
                <span>Credit Score</span>
              </div>
              <div className="font-bold text-base text-slate-900 dark:text-white tabular-nums">
                {state.credit || 680}
              </div>
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-2">Debt: {fmt(state.debt || 0)}</span>
          </div>

          <div className="liquid-glass-card rounded-2xl p-4 floating-panel flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono mb-1">
                <Scale className="w-3.5 h-3.5 text-rose-500" />
                <span>Legal Suits</span>
              </div>
              <div className={`font-bold text-base tabular-nums ${activeSuitsCount > 0 ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                {activeSuitsCount} Open
              </div>
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-2">
              {activeSuitsCount === 0 ? 'Clean Record' : 'Requires Counsel'}
            </span>
          </div>
        </div>
      </div>

      {/* Leaderboard & Comparison Table */}
      <div className="liquid-glass rounded-3xl p-6 shadow-xl border border-white/70 dark:border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
              Global Tycoon Index Leaderboard
            </h3>
          </div>

          <div className="flex items-center p-1 rounded-xl liquid-glass-input text-xs">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              All ({combinedList.length})
            </button>
            <button
              onClick={() => setActiveFilter('players')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                activeFilter === 'players'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Online Players
            </button>
            <button
              onClick={() => setActiveFilter('rivals')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                activeFilter === 'rivals'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              AI Rivals
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-mono text-[11px] uppercase">
                <th className="py-2.5 px-3">Rank</th>
                <th className="py-2.5 px-3">Dealer &amp; Dealership</th>
                <th className="py-2.5 px-3">Net Worth</th>
                <th className="py-2.5 px-3">Flips</th>
                <th className="py-2.5 px-3">Connections</th>
                <th className="py-2.5 px-3 text-right">Tycoon Index</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
              {filteredList.map((item, idx) => (
                <tr
                  key={idx}
                  className={`transition-colors ${
                    item.isMe
                      ? 'bg-blue-500/10 font-semibold border-l-4 border-l-blue-500'
                      : 'hover:bg-slate-100/50 dark:hover:bg-slate-800/30'
                  }`}
                >
                  <td className="py-3 px-3 font-mono">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold ${
                      idx === 0 ? 'bg-amber-500 text-white shadow-xs' : idx === 1 ? 'bg-slate-300 dark:bg-slate-600 text-slate-900 dark:text-white' : idx === 2 ? 'bg-amber-700 text-white' : 'text-slate-400'
                    }`}>
                      #{idx + 1}
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{item.name}</span>
                          {item.isMe && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-600 text-white">
                              YOU
                            </span>
                          )}
                          {item.isAi && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-500">
                              AI
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">{item.dealership}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {fmt(item.netWorth)}
                  </td>

                  <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">
                    {item.flips}
                  </td>

                  <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">
                    {item.connections}
                  </td>

                  <td className="py-3 px-3 text-right font-mono font-extrabold text-sm text-slate-900 dark:text-white">
                    {item.score.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
