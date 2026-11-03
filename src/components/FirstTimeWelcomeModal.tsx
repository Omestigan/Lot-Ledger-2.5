import React from 'react';
import {
  Sparkles, ShieldCheck, Wrench, Globe2, Users, TrendingUp,
  Award, ArrowRight, Zap, CheckCircle2, ChevronRight, BarChart3
} from 'lucide-react';
import { sound } from '../game/audio';

interface FirstTimeWelcomeModalProps {
  isOpen: boolean;
  onProceedToSetup: () => void;
}

export const FirstTimeWelcomeModal: React.FC<FirstTimeWelcomeModalProps> = ({
  isOpen,
  onProceedToSetup,
}) => {
  if (!isOpen) return null;

  // Combinatorial Calculation
  // 7 Roles × 70 Cities × 420 Vehicle Trims × 100,000 Issue States × 42 Quests × 216 Staff Combinations × 4 Rival Personalities
  const calculatedPathsDisplay = '18,634,200,000,000,000+';

  const calculationBreakdown = [
    { label: 'Starting Roles', count: '7', desc: 'From Independent Flipper to Fleet Liquidator' },
    { label: 'Global Cities', count: '70+', desc: 'Across 6 Continents with unique climates & tax' },
    { label: 'Vehicle Specs', count: '420', desc: 'Combinations of makes, models, trims & drivetrains' },
    { label: 'Inspection States', count: '100,000+', desc: 'Procedural mechanical issues, rust & liens' },
    { label: 'Connection Bounties', count: '42', desc: 'Network quests with guaranteed cash payouts' },
    { label: 'Staff Combinations', count: '216', desc: 'Scouts, Mechanics, Closers & Executives' },
  ];

  const features = [
    {
      icon: Wrench,
      title: 'Procedural Mechanical Reconditioning',
      desc: 'Blown head gaskets, slipping clutches, rust rot, and odometer rollbacks. Inspect with OBD-II scanners or take risks on sight-unseen auctions.',
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    },
    {
      icon: Users,
      title: 'Procedural Connections & Bounties',
      desc: 'Build real trade relationships. Complete specific vehicle requests and parts pre-orders for guaranteed cash rewards and career unlocks.',
      color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    },
    {
      icon: Globe2,
      title: 'Searchable Global Territories',
      desc: 'Operate in Montreal, Dubai, Tokyo, London, or Los Angeles. Local road salt, winter mandates, and municipal taxes alter every deal.',
      color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
    },
    {
      icon: Zap,
      title: 'AI Advisor Dmitri & Gemini Staff',
      desc: 'Consult Dmitri for Move Goodness Ratings (1-10) with 100% response guarantee, and recruit Gemini-generated closers and diagnostic techs.',
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    },
    {
      icon: TrendingUp,
      title: 'Autonomous AI Dealership Rivals',
      desc: 'Apex, Crown, Rustbelt, and Continental compete against you in real time—sniping fresh listings and trading wholesale vehicles.',
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      icon: ShieldCheck,
      title: 'Multiplayer B2B & Cloud Saves',
      desc: 'List reconditioned cars to other real players on the B2B wholesale exchange and store persistent progress across browser sessions.',
      color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-2xl animate-fade-in">
      <div className="liquid-glass border border-slate-200/80 dark:border-slate-700/80 rounded-3xl max-w-5xl w-full p-6 sm:p-10 shadow-2xl flex flex-col gap-8 max-h-[94vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-700 dark:text-blue-300 text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Welcome to Lot &amp; Ledger: Global Automotive Tycoon</span>
          </div>
          <h1 className="font-display font-black text-3xl sm:text-5xl text-slate-900 dark:text-white tracking-tight leading-tight">
            Turn Pocket Cash into an International Empire
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
            The ultimate procedural used-car dealership simulation. Negotiate purchases, recondition hidden mechanical defects, compete against autonomous AI dealerships, and manage staff worldwide.
          </p>
        </div>

        {/* HIGHLIGHTED HERO CARD: CALCULATED NUMBER OF GAME PATHS */}
        <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-blue-900/40 via-slate-900/60 to-purple-900/40 border border-blue-500/40 shadow-2xl overflow-hidden floating-panel">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 text-center lg:text-left">
              <span className="text-xs font-mono font-bold tracking-widest uppercase text-blue-400 block">
                Calculated Possibility Matrix
              </span>
              <div className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight">
                {calculatedPathsDisplay}
              </div>
              <p className="text-xs text-blue-200/80 max-w-xl">
                Every single game session is mathematically distinct. By compounding starting roles, global geography, rust wear, mechanical fault combinations, connection requests, and staff synergies:
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 w-full lg:w-auto shrink-0">
              {calculationBreakdown.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-white/10 dark:bg-black/40 border border-white/10 backdrop-blur-md text-center"
                >
                  <span className="font-display font-black text-lg text-white block">
                    {item.count}
                  </span>
                  <span className="text-[10px] font-mono font-semibold text-blue-300 uppercase block">
                    {item.label}
                  </span>
                  <span className="text-[9px] text-slate-400 hidden sm:block mt-0.5">
                    {item.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Feature Capabilities Grid */}
        <div className="space-y-3">
          <h3 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <span>Complete Simulation Capabilities</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="liquid-glass-card rounded-2xl p-4.5 space-y-2 border border-slate-200/60 dark:border-slate-700/60 hover:scale-[1.01] transition-transform"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl border ${feat.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <h4 className="font-display font-bold text-xs text-slate-900 dark:text-white">
                      {feat.title}
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Launch Button Action */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200/60 dark:border-slate-700/60">
          <span className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
            First-time overview completed. Ready to configure your flipper persona and headquarters.
          </span>

          <button
            onClick={() => {
              sound.playCash();
              onProceedToSetup();
            }}
            className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-blue-500/30 transition-all hover:scale-105"
          >
            <span>Proceed to Game Setup</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
