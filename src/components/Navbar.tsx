import React, { useState, useEffect } from 'react';
import {
  Car, Users, ShoppingBag, ArrowLeftRight, Wrench, Briefcase, TrendingUp,
  Scale, Store, BookOpen, Volume2, VolumeX, Sun, Moon, Calendar, DollarSign,
  Clock, ShieldAlert, Sparkles, UserCheck, Globe, BarChart3, HelpCircle,
  MoveLeft, MoveRight, SlidersHorizontal, RotateCcw, X, Check, Gavel
} from 'lucide-react';
import { fmt } from '../game/valuation';
import { GameState } from '../game/engine';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { sound } from '../game/audio';

const DEFAULT_TAB_ORDER = [
  'welcome', 'worldmap', 'auction', 'rivals', 'b2b', 'metrics', 'market',
  'garage', 'connections', 'offers', 'trade', 'staff', 'invest',
  'legal', 'shop', 'ledger'
];

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
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [tabOrder, setTabOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('lot_ledger_tab_order');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const merged = [...parsed.filter((id) => DEFAULT_TAB_ORDER.includes(id))];
          DEFAULT_TAB_ORDER.forEach((id) => {
            if (!merged.includes(id)) merged.push(id);
          });
          return merged;
        }
      }
    } catch (e) {}
    return DEFAULT_TAB_ORDER;
  });

  useEffect(() => {
    try {
      localStorage.setItem('lot_ledger_tab_order', JSON.stringify(tabOrder));
    } catch (e) {}
  }, [tabOrder]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (usr) => {
      setAuthUser(usr);
    });
    return () => unsub();
  }, []);

  const currencySym = state.customLocation?.currencySymbol || '$';

  const allTabsMap: Record<string, any> = {
    welcome: { id: 'welcome', label: 'Welcome', icon: Sparkles },
    worldmap: { id: 'worldmap', label: 'Global Cities', badgeColor: 'bg-zinc-800 text-zinc-200 font-bold border border-zinc-700', count: state.customLocation?.city || 'Globe', icon: Globe },
    auction: { id: 'auction', label: 'Live Auction', badgeColor: 'bg-zinc-800 text-zinc-100 font-bold border border-zinc-700', count: '3.0 LIVE', icon: Gavel },
    rivals: { id: 'rivals', label: 'AI Rivals', badgeColor: 'bg-zinc-800 text-zinc-200 font-bold border border-zinc-700', count: `${state.rivals?.length || 4} AI`, icon: Store },
    b2b: { id: 'b2b', label: 'B2B Network', badgeColor: 'bg-emerald-950/80 text-emerald-300 font-bold border border-emerald-800/80', count: 'LIVE', icon: Users },
    metrics: { id: 'metrics', label: 'Metrics', badgeColor: 'bg-zinc-800 text-zinc-200 font-bold border border-zinc-700', count: 'RANK', icon: BarChart3 },
    market: { id: 'market', label: 'Market', count: state.listings.length, icon: ShoppingBag },
    garage: { id: 'garage', label: 'Garage', count: `${state.cars.length}/${state.slots}`, icon: Car },
    connections: {
      id: 'connections',
      label: 'Connections',
      count: Object.values(state.connections.contacts).filter((c) => c.status === 'active').length,
      badgeColor: 'bg-zinc-800 text-zinc-200 border border-zinc-700',
      icon: Users,
    },
    offers: { id: 'offers', label: 'Offers', count: state.offers.length || '', icon: ArrowLeftRight },
    trade: { id: 'trade', label: 'Trade', count: state.transit.length || '', icon: ArrowLeftRight },
    staff: { id: 'staff', label: 'Staff', count: state.staff.length || '', icon: Briefcase },
    invest: { id: 'invest', label: 'Invest', icon: TrendingUp },
    legal: { id: 'legal', label: 'Legal', count: state.suits.filter((s) => s.stage !== 'closed').length || '', icon: Scale },
    shop: { id: 'shop', label: 'Shop', icon: Store },
    ledger: { id: 'ledger', label: 'Ledger', icon: BookOpen },
  };

  const tabs = tabOrder.map((id) => allTabsMap[id]).filter(Boolean);

  const moveTab = (index: number, direction: 'left' | 'right') => {
    sound.playClick();
    const newOrder = [...tabOrder];
    const targetIdx = direction === 'left' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newOrder.length) return;
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIdx];
    newOrder[targetIdx] = temp;
    setTabOrder(newOrder);
  };

  const resetTabOrder = () => {
    sound.playClick();
    setTabOrder(DEFAULT_TAB_ORDER);
  };

  const dateStr = new Date(2026, 9, 22 + state.day).toLocaleDateString('en-CA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/92 dark:bg-zinc-950/95 text-white border-b border-zinc-800/80 shadow-2xl backdrop-blur-2xl transition-all">
      {/* Upper Status Ribbon */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs border-b border-zinc-800/60">
        {/* Brand / Logo - Sits flush on background with NO weird rectangle outline and NO highlighting */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sound.playClick();
              onOpenWelcome();
            }}
            className="flex items-center gap-2.5 group text-left focus:outline-none cursor-pointer p-0 bg-transparent border-0"
            title="View Welcome & Guide"
          >
            {/* Sleek Borderless L&L Emblem */}
            <div className="w-8 h-8 flex items-center justify-center font-display font-black text-sm tracking-tighter text-zinc-100 group-hover:text-white transition-colors">
              <span className="text-xl leading-none font-extrabold select-none">🏎️</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-base tracking-tight text-white group-hover:text-zinc-200 transition-colors">
                  Lot &amp; Ledger
                </span>
                <span className="text-[10px] font-mono tracking-normal text-zinc-400 font-semibold flex items-center gap-1">
                  <span>v3.0 AI</span>
                  <span className="text-[9px] font-extrabold text-amber-400 tracking-wider">BETA</span>
                </span>
              </div>
              <span className="text-[11px] text-zinc-400 block leading-none mt-0.5">
                Automotive Trade &amp; Network Tycoon
              </span>
            </div>
          </button>
        </div>

        {/* Live HUD Stats */}
        <div className="flex items-center flex-wrap gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-zinc-300">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-zinc-400">Day {state.day}:</span>
            <span className="font-semibold text-white">{dateStr}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-zinc-400">Cash:</span>
            <span className={`font-bold tabular-nums text-sm ${state.cash < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {fmt(state.cash)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400">Net Worth:</span>
            <span className="font-bold text-white tabular-nums text-sm">
              {fmt(netWorth)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-zinc-400">Visits:</span>
            <span className="font-semibold text-white">
              {state.visits}/3
            </span>
            <span className="text-zinc-600">·</span>
            <span className="text-zinc-400">Work:</span>
            <span className="font-semibold text-white">{state.hrs.toFixed(1)}h</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playClick();
              onOpenAiAdvisor();
            }}
            className="px-3.5 py-1.5 text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border border-zinc-700/80 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="Ask Dmitri — Automotive AI Advisor"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Dmitri (AI)</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onOpenTutorial();
            }}
            className="px-3 py-1.5 text-xs font-semibold bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="Interactive Tutorial Walkthrough"
          >
            <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
            <span>Guide</span>
          </button>

          <button
            onClick={() => {
              sound.playCash();
              onEndDay();
            }}
            className="px-4 py-1.5 text-xs font-bold bg-white hover:bg-zinc-100 text-zinc-950 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            End Day
          </button>

          <button
            onClick={() => {
              sound.playCash();
              onWaitWeek();
            }}
            className="px-3 py-1.5 text-xs font-medium bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60 rounded-xl transition-colors cursor-pointer"
            title="Advance 7 days"
          >
            +7 Days
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onToggleSound();
            }}
            className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800/80 transition-colors cursor-pointer"
            title={soundEnabled ? 'Mute Audio' : 'Enable Audio'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onToggleDarkMode();
            }}
            className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800/80 transition-colors cursor-pointer"
            title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-300" />}
          </button>

          {authUser ? (
            <button
              onClick={() => {
                sound.playClick();
                onOpenAccounts();
              }}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
              title={`Google Account: ${authUser.displayName || authUser.email}`}
            >
              {authUser.photoURL ? (
                <img src={authUser.photoURL} alt="Avatar" className="w-4 h-4 rounded-full border border-emerald-400" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
              <span className="truncate max-w-[85px]">{authUser.displayName || authUser.email?.split('@')[0] || state.player?.name || 'Account'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </button>
          ) : (
            <button
              onClick={() => {
                sound.playClick();
                onOpenAccounts();
              }}
              className="px-3 py-1.5 text-xs font-bold text-zinc-950 bg-white hover:bg-zinc-100 border border-white/60 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Sign in with Google"
            >
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 overflow-x-auto scrollbar-none flex items-center gap-1.5 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                sound.playTab();
                onTabChange(tab.id);
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-all cursor-pointer shrink-0 active:scale-95 ${
                isActive
                  ? 'bg-white text-zinc-950 shadow-md font-bold'
                  : 'bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800/80'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count !== '' && (
                <span
                  className={`px-2 py-0.2 text-[10px] font-mono rounded-full font-semibold ${
                    tab.badgeColor || (isActive ? 'bg-zinc-900 text-white' : 'bg-zinc-800 text-zinc-300')
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}

        {/* Rearrange Tabs Button */}
        <button
          onClick={() => {
            sound.playClick();
            setIsReorderModalOpen(true);
          }}
          className="px-2.5 py-1.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1 shrink-0 transition-all cursor-pointer"
          title="Rearrange Navigation Tab Order"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Rearrange</span>
        </button>

        {/* Floating Quick Consult Button */}
        <div className="ml-auto mr-1 shrink-0">
          <button
            onClick={() => {
              sound.playClick();
              onOpenAiAdvisor();
            }}
            className="px-3 py-1.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-amber-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Consult Dmitri</span>
          </button>
        </div>
      </div>

      {/* Tab Reorder Modal */}
      {isReorderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-zinc-950/95 rounded-3xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 border border-zinc-800 text-white my-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">Customize Navigation Tab Order</h3>
              </div>
              <button
                onClick={() => setIsReorderModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400 font-mono">
              Use the arrow buttons to move tabs left or right. Your custom tab layout persists automatically.
            </p>

            <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
              {tabs.map((tab, idx) => {
                const Icon = tab.icon;
                return (
                  <div
                    key={tab.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-zinc-400" />
                      <span className="font-bold text-white">{tab.label}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveTab(idx, 'left')}
                        disabled={idx === 0}
                        className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-zinc-200 cursor-pointer"
                        title="Move Left"
                      >
                        <MoveLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveTab(idx, 'right')}
                        disabled={idx === tabs.length - 1}
                        className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-zinc-200 cursor-pointer"
                        title="Move Right"
                      >
                        <MoveRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-zinc-800 text-xs">
              <button
                onClick={resetTabOrder}
                className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white font-mono flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Default</span>
              </button>

              <button
                onClick={() => setIsReorderModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Layout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

