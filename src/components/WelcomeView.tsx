import React from 'react';
import {
  Sparkles, Wrench, ShieldCheck, TrendingUp, Users, Globe2,
  DollarSign, ArrowRight, Play, CheckCircle2, Award, Scale, HelpCircle
} from 'lucide-react';
import heroDealership from '../assets/images/lot_dealership_hero_1793325465223.jpg';

interface WelcomeViewProps {
  onStartGame: () => void;
  onOpenCharacterCreator: () => void;
  onOpenTutorial: () => void;
  onNavigateTab: (tab: string) => void;
  hasActiveGame: boolean;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({
  onStartGame,
  onOpenCharacterCreator,
  onOpenTutorial,
  onNavigateTab,
  hasActiveGame,
}) => {
  const gamePaths = [
    {
      title: 'The Certified Dealer',
      badge: 'Reputation 100',
      icon: ShieldCheck,
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900',
      description:
        'Disclose all mechanical defects, obtain provincial dealer licensing, provide statutory warranties, and avoid costly curbstoning investigations.',
    },
    {
      title: 'The Shadow Flipper',
      badge: 'High Margin',
      icon: DollarSign,
      color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900',
      description:
        'Hunt yard stock and repo auction bargains sight-unseen. Negotiate ruthlessly, flip fast before 12-month limits, and dodge buyer fraud lawsuits.',
    },
    {
      title: 'The Master Mechanic',
      badge: 'DIY Craft',
      icon: Wrench,
      color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900',
      description:
        'Tackle blown head gaskets, slipping transmissions, and rusted rocker panels in your driveway using aftermarket or salvage parts to maximize margins.',
    },
    {
      title: 'The Relationship Broker',
      badge: 'Connections System',
      icon: Users,
      color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900',
      description:
        'Expand your procedurally generated network of scrapyards, auction directors, freight haulers, and VIP collectors to unlock exclusive wholesale inventory.',
    },
    {
      title: 'Import & Export Mogul',
      badge: 'Global Routes',
      icon: Globe2,
      color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-900',
      description:
        'Source rust-free trucks from Michigan, 15+ year JDM icons from Yokohama, and European sedans from Hamburg, or export sports cars to lucrative foreign markets.',
    },
    {
      title: 'Capital & Angel Investor',
      badge: 'Passive Wealth',
      icon: TrendingUp,
      color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900',
      description:
        'Reinvest car flipping profits into Canadian index ETFs, dividend stocks, or angel-invest in early-stage mobility and software startups.',
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Hero Showcase Card */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200/60 dark:border-slate-700/50 shadow-xl liquid-glass floating-panel">
        <div className="relative h-72 sm:h-96 w-full overflow-hidden">
          <img
            src={heroDealership}
            alt="Lot and Ledger Dealership"
            className="w-full h-full object-cover object-center brightness-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        </div>

        <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/90 text-white text-xs font-semibold mb-3 backdrop-blur-md shadow-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Full Automotive Flipping Simulation &amp; Network Tycoon</span>
            </div>
            <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight leading-tight">
              Turn $2,000 Capital into an Automotive Empire
            </h1>
            <p className="text-slate-300 text-sm mt-2 leading-relaxed">
              Every car has hidden mechanical defects, rust history, and motivated sellers.
              Inspect with OBD scanners, negotiate in person, navigate regional tax laws, and build an expansive procedural relationship network.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={onOpenTutorial}
              className="px-4 py-2.5 bg-amber-500/90 hover:bg-amber-500 text-white font-semibold rounded-xl shadow-lg floating-btn transition-all flex items-center gap-2 text-sm cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Interactive Tutorial</span>
            </button>

            {hasActiveGame ? (
              <button
                onClick={onStartGame}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg floating-btn transition-all flex items-center gap-2 text-sm cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Resume Game</span>
              </button>
            ) : null}

            <button
              onClick={() => onNavigateTab('worldmap')}
              className="px-4 py-2.5 bg-blue-600/90 hover:bg-blue-600 text-white font-semibold rounded-xl shadow-lg floating-btn transition-all flex items-center gap-2 text-sm cursor-pointer"
            >
              <Globe2 className="w-4 h-4" />
              <span>World Map HQ</span>
            </button>

            <button
              onClick={onOpenCharacterCreator}
              className="px-5 py-2.5 bg-white/95 backdrop-blur text-slate-950 hover:bg-white font-semibold rounded-xl shadow-lg floating-btn transition-all flex items-center gap-2 text-sm cursor-pointer"
            >
              <span>New Game / Region</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Procedural Generation Feature Spotlight & Massive Combinatorial Path Counter */}
      <div className="liquid-glass border border-slate-200/80 dark:border-slate-700/50 rounded-3xl p-6 shadow-md floating-panel space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-5 rounded-2xl bg-gradient-to-r from-blue-900/60 via-slate-900/80 to-purple-900/60 border border-blue-500/40 text-white">
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-400 block">
              Calculated Game Path Combinations
            </span>
            <div className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight mt-1">
              18,634,200,000,000,000+ Possibilities
            </div>
            <p className="text-xs text-blue-200/80 mt-1 max-w-xl">
              Calculated across 7 Starting Roles × 70 Global Cities × 420 Vehicle Trims × 100,000 Inspection Fault Permutations × 42 Network Quests × 216 Gemini Staff Synergies × 4 AI Rival Personalities.
            </p>
          </div>

          <button
            onClick={onOpenCharacterCreator}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-lg flex items-center gap-2 shrink-0 cursor-pointer transition-transform hover:scale-105"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Setup New Game</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl liquid-glass-card border border-slate-200/60 dark:border-slate-700/40 text-xs">
            <span className="font-bold text-slate-900 dark:text-white block mb-1">
              No Artificial Level Locks
            </span>
            <p className="text-slate-600 dark:text-slate-400 text-[11px]">
              You don’t have to wait until level 10 to meet elite contacts. Quality connections (up to 5 stars) can be discovered from your very first week through referrals, favors, and trades.
            </p>
          </div>

          <div className="p-4 rounded-2xl liquid-glass-card border border-slate-200/60 dark:border-slate-700/40 text-xs">
            <span className="font-bold text-slate-900 dark:text-white block mb-1">
              Searchable Global Cities Directory
            </span>
            <p className="text-slate-600 dark:text-slate-400 text-[11px]">
              Explore 70+ global hubs from Montreal to Tokyo, Dubai, London, and Sydney. Weather rust risks, municipal taxes, and winter mandates dynamically shape every vehicle valuation.
            </p>
          </div>

          <div className="p-4 rounded-2xl liquid-glass-card border border-slate-200/60 dark:border-slate-700/40 text-xs">
            <span className="font-bold text-slate-900 dark:text-white block mb-1">
              Realistic Mechanical Depth
            </span>
            <p className="text-slate-600 dark:text-slate-400 text-[11px]">
              Over 68 authentic models across 9 classes. Simulated catalytic converter clogs, Takata airbag recalls, timing chain stretch, and Quebec road salt rocker rust.
            </p>
          </div>
        </div>
      </div>

      {/* The 6 Game Paths Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white">
            6 Distinct Playstyles &amp; Career Paths
          </h2>
          <span className="text-xs text-slate-500">Pick any combination in your journey</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {gamePaths.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="liquid-glass-card border border-slate-200/60 dark:border-slate-700/40 rounded-2xl p-5 shadow-sm flex flex-col justify-between floating-panel"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${p.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300">
                      {p.badge}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                    {p.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {p.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Regional Regulations Trust Guide */}
      <div className="liquid-glass border border-slate-200/80 dark:border-slate-700/50 rounded-3xl p-6 shadow-md floating-panel">
        <h3 className="font-display font-bold text-lg mb-2 text-slate-900 dark:text-white">
          Provincial &amp; State Regulations Matter
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl mb-4">
          Registration fees, sales tax, and winter tire laws adapt dynamically based on your chosen starting location:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs font-mono">
          <div className="liquid-glass-card p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/40">
            <span className="text-blue-600 dark:text-blue-400 font-bold block">Quebec</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">SAAQ · 9.975% QST</span>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 block mt-1">Winter tire law</span>
          </div>
          <div className="liquid-glass-card p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/40">
            <span className="text-blue-600 dark:text-blue-400 font-bold block">Ontario</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">ServiceON · 13% HST</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">Safety cert required</span>
          </div>
          <div className="liquid-glass-card p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/40">
            <span className="text-blue-600 dark:text-blue-400 font-bold block">Michigan</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">SOS · 6% Use Tax</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-1">Cheap US muscle</span>
          </div>
          <div className="liquid-glass-card p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/40">
            <span className="text-blue-600 dark:text-blue-400 font-bold block">Alberta</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Registries · 0% PST</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-1">Zero rust trucks</span>
          </div>
          <div className="liquid-glass-card p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/40">
            <span className="text-blue-600 dark:text-blue-400 font-bold block">British Col.</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">ICBC · 12% PST</span>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 block mt-1">Mountain tire law</span>
          </div>
          <div className="liquid-glass-card p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/40">
            <span className="text-blue-600 dark:text-blue-400 font-bold block">Nova Scotia</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Service NS · 15% HST</span>
            <span className="text-[10px] text-rose-600 dark:text-rose-400 block mt-1">Heavy salt &amp; sea air</span>
          </div>
        </div>
      </div>
    </div>
  );
};
