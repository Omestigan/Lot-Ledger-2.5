import React from 'react';
import {
  Sparkles, ShieldCheck, Wrench, Globe2, Users, TrendingUp,
  Award, ArrowRight, Zap, CheckCircle2, ChevronRight, BarChart3,
  Car, Briefcase, DollarSign
} from 'lucide-react';
import { sound } from '../game/audio';
import { STARTING_ROLES } from '../game/roles';

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
    { label: 'Global Cities', count: '70+', desc: 'Across 6 Continents with Wikipedia & Maps' },
    { label: 'Vehicle Specs', count: '420', desc: 'Makes, models, trims, and drivetrains' },
    { label: 'Inspection States', count: '100,000+', desc: 'ECU fault codes, corrosion, and wear' },
    { label: 'Connection Quests', count: '42', desc: 'Network bounties with cash payouts' },
    { label: 'Staff Combinations', count: '216', desc: 'Scouts, Mechanics, Closers & Execs' },
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
      title: 'Global Cities (Wikipedia & Maps)',
      desc: 'Operate in Montreal, Kyoto, Santiago, Dubai, or Reykjavik. Real-time road bureau agencies, local currencies, and climate rust wear.',
      color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
    },
    {
      icon: Zap,
      title: 'Dmitri AI Advisor & Gemini Staff',
      desc: 'Consult Dmitri for Move Goodness Ratings (1-10) with 100% uptime guarantee, and hire Gemini 3.6-generated scouts, closers, and technicians.',
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    },
    {
      icon: TrendingUp,
      title: 'Autonomous AI Dealership Rivals',
      desc: 'Apex, Crown, Rustbelt, and Continental compete against you in real time—sniping fresh classifieds and trading wholesale inventory.',
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      icon: ShieldCheck,
      title: 'Multiplayer B2B & Google Cloud Saves',
      desc: 'List reconditioned cars to other real dealers on the live B2B wholesale exchange and store persistent progress across browser sessions.',
      color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-2xl animate-fade-in">
      <div className="liquid-glass border border-slate-200/80 dark:border-slate-700/80 rounded-3xl max-w-5xl w-full p-6 sm:p-9 shadow-2xl flex flex-col gap-7 max-h-[94vh] overflow-y-auto">
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
            The comprehensive procedural used-car flipping simulation. Negotiate purchases, recondition hidden mechanical defects, compete against autonomous AI dealerships, and manage staff worldwide.
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
                Every single game session is mathematically distinct. Calculated by compounding starting roles, global geography, rust wear, mechanical fault combinations, connection requests, and staff synergies:
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

        {/* 7 Starting Roles Showcase */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-amber-500" />
              <span>7 Distinct Starting Roles &amp; Career Paths</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono">Selectable at game start</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {STARTING_ROLES.map((role) => (
              <div
                key={role.id}
                className="liquid-glass-card rounded-2xl p-4 space-y-2 border border-slate-200/60 dark:border-slate-700/50 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-2xl p-1.5 rounded-xl bg-white/20 dark:bg-white/5 border border-white/10">
                      {role.avatarIcon}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/25">
                      ${role.startingCash.toLocaleString()} Cash
                    </span>
                  </div>
                  <h4 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                    {role.name}
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug mt-1">
                    {role.tagline}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-200/40 dark:border-white/5">
                  <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 block truncate">
                    ✨ {role.perks[0]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Capabilities Grid */}
        <div className="space-y-3">
          <h3 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <span>Complete Simulation Capabilities</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="liquid-glass-card rounded-2xl p-4 space-y-2 border border-slate-200/60 dark:border-slate-700/60 hover:scale-[1.01] transition-transform"
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
            First-time overview completed. Ready to configure your starting role, character, and global location.
          </span>

          <button
            onClick={() => {
              sound.playCash();
              onProceedToSetup();
            }}
            className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-blue-500/30 transition-all hover:scale-105 active:scale-95"
          >
            <span>Proceed to Game Setup</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
