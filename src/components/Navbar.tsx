import React from 'react';
import {
  Car, Users, ShoppingBag, ArrowLeftRight, Wrench, Briefcase, TrendingUp,
  Scale, Store, BookOpen, Volume2, VolumeX, Sun, Moon, Calendar, DollarSign,
  Clock, ShieldAlert, Sparkles, UserCheck, Globe, BarChart3, HelpCircle
} from 'lucide-react';
import { fmt } from '../game/valuation';
import { GameState } from '../game/engine';

interface NavbarProps {
  state: GameState;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onEndDay: () => void;
  onWaitWeek: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenAccounts: () => void;
  onOpenWelcome: () => void;
  onOpenTutorial: () => void;
  onOpenAiAdvisor: () => void;
  netWorth: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  state,
  activeTab,
  onTabChange,
  onEndDay,
  onWaitWeek,
  soundEnabled,
  onToggleSound,
  isDarkMode,
  onToggleDarkMode,
  onOpenAccounts,
  onOpenWelcome,
  onOpenTutorial,
  onOpenAiAdvisor,
  netWorth,
}) => {
  const currencySym = state.customLocation?.currencySymbol || '$';

  const tabs = [
    { id: 'welcome', label: 'Welcome', icon: Sparkles },
    { id: 'worldmap', label: 'Global Cities', badgeColor: 'bg-zinc-800 text-zinc-200 font-bold border border-zinc-700', count: state.customLocation?.city || 'Globe', icon: Globe },
    { id: 'rivals', label: 'AI Rivals', badgeColor: 'bg-zinc-800 text-zinc-200 font-bold border border-zinc-700', count: `${state.rivals?.length || 4} AI`, icon: Store },
    { id: 'b2b', label: 'B2B Network', badgeColor: 'bg-emerald-950/80 text-emerald-300 font-bold border border-emerald-800/80', count: 'LIVE', icon: Users },
    { id: 'metrics', label: 'Metrics', badgeColor: 'bg-zinc-800 text-zinc-200 font-bold border border-zinc-700', count: 'RANK', icon: BarChart3 },
    { id: 'market', label: 'Market', count: state.listings.length, icon: ShoppingBag },
    { id: 'garage', label: 'Garage', count: `${state.cars.length}/${state.slots}`, icon: Car },
    {
      id: 'connections',
      label: 'Connections',
      count: Object.values(state.connections.contacts).filter((c) => c.status === 'active').length,
      badgeColor: 'bg-zinc-800 text-zinc-200 border border-zinc-700',
      icon: Users,
    },
    { id: 'offers', label: 'Offers', count: state.offers.length || '', icon: ArrowLeftRight },
    { id: 'trade', label: 'Trade', count: state.transit.length || '', icon: ArrowLeftRight },
    { id: 'staff', label: 'Staff', count: state.staff.length || '', icon: Briefcase },
    { id: 'invest', label: 'Invest', icon: TrendingUp },
    { id: 'legal', label: 'Legal', count: state.suits.filter((s) => s.stage !== 'closed').length || '', icon: Scale },
    { id: 'shop', label: 'Shop', icon: Store },
    { id: 'ledger', label: 'Ledger', icon: BookOpen },
  ];

  const dateStr = new Date(2026, 9, 22 + state.day).toLocaleDateString('en-CA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <header className="sticky top-0 z-40 liquid-glass border-b border-slate-200/50 dark:border-white/10 shadow-md">
      {/* Upper Status Ribbon */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-200/50 dark:border-white/5">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenWelcome}
            className="flex items-center gap-2.5 group text-left focus:outline-none floating-btn cursor-pointer"
            title="View Welcome & Guide"
          >
            <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white dark:bg-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700/80 flex items-center justify-center font-extrabold text-sm shadow-xs group-hover:bg-zinc-800 transition-all">
              L&amp;L
            </div>
            <div>
              <span className="font-display font-black text-base tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                Lot &amp; Ledger
                <span className="text-[10px] font-mono tracking-normal text-zinc-700 dark:text-zinc-300 font-semibold px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800/90 rounded-md border border-zinc-300 dark:border-zinc-700/80 flex items-center gap-1">
                  <span>v2.0 Network</span>
                  <span className="text-[9px] font-bold text-amber-500 dark:text-amber-400 bg-amber-400/10 px-1 py-0.2 rounded uppercase tracking-wider">BETA</span>
                </span>
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block leading-none mt-0.5">
                Automotive Trade &amp; Network Tycoon
              </span>
            </div>
          </button>
        </div>

        {/* Live HUD Stats */}
        <div className="flex items-center flex-wrap gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 dark:text-slate-400">Day {state.day}:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{dateStr}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-slate-500 dark:text-slate-400">Cash:</span>
            <span className={`font-bold tabular-nums text-sm ${state.cash < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {fmt(state.cash)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400">Net Worth:</span>
            <span className="font-bold text-slate-900 dark:text-white tabular-nums text-sm">
              {fmt(netWorth)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-slate-500 dark:text-slate-400">Visits:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {state.visits}/3
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500 dark:text-slate-400">Work:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{state.hrs.toFixed(1)}h</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAiAdvisor}
            className="px-3.5 py-2 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 rounded-xl shadow-xs floating-btn transition-all flex items-center gap-1.5 cursor-pointer"
            title="Ask Dmitri — Automotive AI Advisor"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Dmitri (AI)</span>
          </button>

          <button
            onClick={onOpenTutorial}
            className="px-3 py-2 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-xl transition-all floating-btn flex items-center gap-1.5 cursor-pointer"
            title="Interactive Tutorial Walkthrough"
          >
            <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
            <span>Guide</span>
          </button>

          <button
            onClick={onEndDay}
            className="px-4 py-2 text-xs font-bold bg-zinc-100 hover:bg-white text-zinc-950 rounded-xl shadow-xs floating-btn transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            End Day
          </button>

          <button
            onClick={onWaitWeek}
            className="px-3 py-2 text-xs font-medium bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 border border-zinc-700/60 rounded-xl transition-colors cursor-pointer"
            title="Advance 7 days"
          >
            +7 Days
          </button>

          <button
            onClick={onToggleSound}
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={soundEnabled ? 'Mute Audio' : 'Enable Audio'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-blue-600 dark:text-blue-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          <button
            onClick={onToggleDarkMode}
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          <button
            onClick={onOpenAccounts}
            className="px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-200/60 hover:bg-slate-300/60 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5 text-blue-500" />
            <span className="truncate max-w-[80px]">{state.player?.name || 'Account'}</span>
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs - Apple iOS Segmented Glass Bar */}
      <div className="max-w-7xl mx-auto px-4 overflow-x-auto scrollbar-none flex items-center gap-1.5 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-all cursor-pointer shrink-0 active:scale-95 ${
                isActive
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-md ring-1 ring-black/10 dark:ring-white/30 font-bold'
                  : 'liquid-glass-pill text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count !== '' && (
                <span
                  className={`px-2 py-0.2 text-[10px] font-mono rounded-full font-semibold ${
                    tab.badgeColor || (isActive ? 'bg-blue-600 text-white' : 'bg-zinc-200/80 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300')
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}

        {/* Floating Quick Consult Button */}
        <div className="ml-auto mr-1 shrink-0">
          <button
            onClick={onOpenAiAdvisor}
            className="px-3 py-1.5 rounded-full liquid-glass border border-amber-500/40 hover:border-amber-400 text-zinc-900 dark:text-zinc-100 hover:bg-amber-500/10 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span>Consult Dmitri</span>
          </button>
        </div>
      </div>
    </header>

  );
};
