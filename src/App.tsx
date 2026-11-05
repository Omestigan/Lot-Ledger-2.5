import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  GameState, createNewGame, seedMarket, genListing, calculateNetWorth, lv, mkIssue,
  fetchAiRegionalListings, fetchAiRegionalStaff, fetchAiRegionalPitches
} from './game/engine';

import { unlockContact, getActivePerks } from './game/connections';
import { REGIONS, CAT, RUSTN, ISSUES } from './game/data';
import { fmt, scrapV, worth, estimate, quoteListing, mkt, setActiveCurrency } from './game/valuation';
import { sound } from './game/audio';
import {
  getActiveAccount, loadGameFromSlot, saveGameToSlot, getSlotMetadata
} from './game/storage';
import { Car, GameMode, Listing, PlayerCharacter, Region, RegionId } from './game/types';

// Components
import { Navbar } from './components/Navbar';
import { WelcomeView } from './components/WelcomeView';
import { ConnectionsView } from './components/ConnectionsView';
import { MarketView } from './components/MarketView';
import { GarageView } from './components/GarageView';
import { OffersView } from './components/OffersView';
import { TradeView } from './components/TradeView';
import { StaffView } from './components/StaffView';
import { InvestView } from './components/InvestView';
import { LegalView } from './components/LegalView';
import { ShopView } from './components/ShopView';
import { InGameCheckoutModal, PurchasePack } from './components/InGameCheckoutModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { LedgerView } from './components/LedgerView';
import { AccountsModal } from './components/AccountsModal';
import { CharacterCreatorModal } from './components/CharacterCreatorModal';
import { InteractiveCarInspector } from './components/InteractiveCarInspector';
import { MultiplayerB2BView } from './components/MultiplayerB2BView';
import { MetricsView } from './components/MetricsView';
import { InteractiveTutorial } from './components/InteractiveTutorial';
import { WorldMapView } from './components/WorldMapView';
import { RivalDealershipsView } from './components/RivalDealershipsView';
import { AiAdvisorModal } from './components/AiAdvisorModal';
import { WorldLocation, PRESET_WORLD_CITIES } from './game/locations';
import { RivalDealership, INITIAL_RIVAL_DEALERSHIPS, tickRivalDealerships } from './game/rivals';
import { MandatoryGameStartModal } from './components/MandatoryGameStartModal';
import { FirstTimeWelcomeModal } from './components/FirstTimeWelcomeModal';
import { AuctionHouseView } from './components/AuctionHouseView';
import { DealershipEmpireMapView } from './components/DealershipEmpireMapView';
import { RaceTrackCenterView } from './components/RaceTrackCenterView';
import { CarTuningModal } from './components/CarTuningModal';
import { INITIAL_EMPIRE_BUILDINGS, AVAILABLE_BUILDING_CATALOG, getEmpireTotalBonuses } from './game/empire';
import { calculateCarPerformanceMetrics } from './game/tuning';
import { Sparkles, ShieldAlert } from 'lucide-react';

export default function App() {
  const [tuningCar, setTuningCar] = useState<Car | null>(null);
  const [selectedCheckoutPack, setSelectedCheckoutPack] = useState<PurchasePack | null>(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [state, setState] = useState<GameState>(() => {
    // Attempt to load from active account slot 1 or autosave
    try {
      const activeAcc = getActiveAccount();
      if (activeAcc) {
        const saved = loadGameFromSlot(activeAcc.id, 1);
        if (saved && saved.v) {
          if (!saved.customLocation) saved.customLocation = PRESET_WORLD_CITIES[0];
          if (!saved.rivals) saved.rivals = JSON.parse(JSON.stringify(INITIAL_RIVAL_DEALERSHIPS));
          return saved;
        }
      }
    } catch (e) {}
    return createNewGame('qc', 'free');
  });

  const [activeTab, setActiveTab] = useState<string>('welcome');
  const [isAiAdvisorOpen, setIsAiAdvisorOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);

  // Modals
  const [isAccountsModalOpen, setIsAccountsModalOpen] = useState(false);
  const [isCharCreatorOpen, setIsCharCreatorOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [inspectingCar, setInspectingCar] = useState<Car | null>(null);
  const [isFirstTimeWelcomeOpen, setIsFirstTimeWelcomeOpen] = useState(() => {
    return !localStorage.getItem('lot_ledger_v2_welcome_seen');
  });
  const [isMandatoryGameStartOpen, setIsMandatoryGameStartOpen] = useState(false);

  // Audio & Theme
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('lot_ledger_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;
    } catch {
      return true;
    }
  });
  const [flashMessages, setFlashMessages] = useState<string[]>([]);

  // Anti-Cheat & Income Rate Limiting Engine ($4,000/min velocity cap & passive collection limits)
  const earningsHistoryRef = React.useRef<{ timestamp: number; amount: number; source: string }[]>([]);
  const lastEmpireCollectionTimeRef = React.useRef<number>(0);
  const [antiCheatViolation, setAntiCheatViolation] = useState<{
    type: 'CEILING_800K' | 'VELOCITY_4K_PER_MIN' | 'PASSIVE_EXPLOIT';
    message: string;
    amount?: number;
  } | null>(null);

  const checkAndRecordIncome = useCallback((amount: number, source: string): boolean => {
    if (amount <= 0 || !Number.isFinite(amount)) return true;

    const now = Date.now();
    // Filter out earnings older than 60,000 ms (1 minute)
    earningsHistoryRef.current = earningsHistoryRef.current.filter((e) => now - e.timestamp <= 60000);

    const earnedLastMinute = earningsHistoryRef.current.reduce((sum, e) => sum + e.amount, 0);
    const totalWithNew = earnedLastMinute + amount;

    if (totalWithNew > 4000) {
      setAntiCheatViolation({
        type: 'VELOCITY_4K_PER_MIN',
        message: `Income velocity reached ${fmt(totalWithNew)}/min over the last 60 seconds (Source: ${source}), exceeding the $4,000 per minute anti-cheat threshold.`,
        amount: totalWithNew,
      });
      return false;
    }

    earningsHistoryRef.current.push({ timestamp: now, amount, source });
    return true;
  }, []);

  const handleApplyReward = useCallback((pack: PurchasePack) => {
    setState((prev) => {
      const next = { ...prev };
      if (pack.cashBonus) {
        if (!checkAndRecordIncome(pack.cashBonus, `Store Pack: ${pack.title}`)) return prev;
        next.cash += pack.cashBonus;
      }
      if (pack.extraSlots) {
        next.slots = Math.min(10, next.slots + pack.extraSlots);
      }
      if (pack.id === 'pack_booster') {
        next.ins = true;
      }
      if (pack.id === 'pack_mega') {
        next.lic = true;
      }
      next.log.unshift({
        d: next.day,
        m: `In-game purchase approved: ${pack.title} ($${pack.priceUSD})`,
        $: pack.cashBonus || 0,
      });
      return next;
    });
  }, []);

  // Apply dark mode class to root HTML & persist
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      try { localStorage.setItem('lot_ledger_theme', 'dark'); } catch {}
    } else {
      document.documentElement.classList.remove('dark');
      try { localStorage.setItem('lot_ledger_theme', 'light'); } catch {}
    }
  }, [isDarkMode]);

  // Global Keyboard Shortcut: Cmd+K / Ctrl+K toggles Dmitri AI Advisor
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsAiAdvisorOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Keep active currency in valuation synced with player's selected location
  useEffect(() => {
    if (state.customLocation) {
      setActiveCurrency(state.customLocation.currencySymbol, state.customLocation.currencyMultiplier || 1.0);
    }
  }, [state.customLocation]);

  // Continuous Anti-Cheat Monitor: Liquid cash $800,000 ceiling audit
  useEffect(() => {
    if (state.cash > 800000 && !antiCheatViolation) {
      setAntiCheatViolation({
        type: 'CEILING_800K',
        message: `Liquid cash reserves reached ${fmt(state.cash)}, exceeding the $800,000 regulatory ceiling.`,
        amount: state.cash,
      });
    }
  }, [state.cash, antiCheatViolation]);

  // Flash helper
  const addFlash = useCallback((msg: string) => {
    setFlashMessages((prev) => [msg, ...prev.slice(0, 3)]);
    setTimeout(() => {
      setFlashMessages((prev) => prev.filter((m) => m !== msg));
    }, 6000);
  }, []);

  // Compute Net Worth
  const currentNetWorth = useMemo(() => calculateNetWorth(state), [state]);
  const activePerks = useMemo(() => getActivePerks(state.connections), [state.connections]);
  const currentRegion: Region = useMemo(() => {
    const base = REGIONS[state.region] || REGIONS.qc;
    if (state.customLocation) {
      return {
        ...base,
        name: `${state.customLocation.city}, ${state.customLocation.country}`,
        lat: state.customLocation.lat,
        lon: state.customLocation.lng,
        auth: state.customLocation.inspectionName,
        taxN: state.customLocation.taxName,
        priv: state.customLocation.taxRate,
        dealer: state.customLocation.taxRate,
        regFee: state.customLocation.baseRegCost,
        rust: state.customLocation.rustRisk,
        win: (state.customLocation.climate === 'arctic' || state.customLocation.climate === 'temperate_salt' ? 'law' : 'none') as any,
        cities: [
          { n: `${state.customLocation.city} Metro`, v: 1, tow: 80, adj: 1.0, w: 40, on: 1 },
          { n: `${state.customLocation.city} Suburbs`, v: 1, tow: 110, adj: 0.95, w: 30, on: 1 },
          { n: `${state.customLocation.city} Valley / Port`, v: 2, tow: 140, adj: 0.9, w: 20, on: 0 },
          { n: `${state.customLocation.city} Airport Corridor`, v: 2, tow: 160, adj: 1.08, w: 10, on: 0 },
        ],
      };
    }
    return base;
  }, [state.customLocation, state.region]);

  // Monthly Insurance cost
  const monthlyInsurance = Math.round(
    (78 + state.cars.filter((c) => c.regd).length * 14 + (state.lic ? 60 : 0)) * currentRegion.ins
  );

  // Auto-save on significant state updates
  useEffect(() => {
    try {
      const activeAcc = getActiveAccount();
      if (activeAcc) {
        const meta = {
          slot: 1,
          username: activeAcc.username,
          day: state.day,
          dateStr: new Date(2026, 9, 22 + state.day).toLocaleDateString('en-CA'),
          cash: Math.round(state.cash),
          netWorth: Math.round(currentNetWorth),
          carsCount: state.cars.length,
          connectionsCount: Object.values(state.connections.contacts).filter((c) => c.status === 'active').length,
          region: state.region,
          mode: state.mode,
          savedAt: Date.now(),
        };
        saveGameToSlot(activeAcc.id, 1, state, meta);
      }
    } catch (e) {}
  }, [state.day, state.cash, state.cars.length]);

  // Advance 1 Day
  const handleEndDay = () => {
    sound.playClick();
    setState((prev) => {
      const next = { ...prev };
      next.day++;
      next.visits = 3 + (lv(next.skills, 'net') >= 4 ? 1 : 0);
      next.hrs = 6;

      // Weekly favours refill
      if (next.day % 7 === 0) {
        next.favours = Math.min(3, next.favours + 1);
      }

      // Stock market tick
      Object.keys(next.mk).forEach((s) => {
        const h = [...next.mk[s]];
        const last = h[h.length - 1] || 25;
        const delta = (Math.random() - 0.49) * 0.02;
        const newP = +Math.max(1, last * (1 + delta)).toFixed(2);
        h.push(newP);
        if (h.length > 50) h.shift();
        next.mk[s] = h;
      });

      // Filter expired listings and spawn new ones
      next.listings = next.listings.filter((l) => next.day <= l.expires);
      while (next.listings.length < 16) {
        next.listings.push(genListing(next));
      }

      // Update in-transit shipments
      next.transit = next.transit
        .map((t) => ({ ...t, arr: t.arr - 1 }))
        .filter((t) => {
          if (t.arr <= 0) {
            if (t.dir === 'in') {
              t.car.bought = next.day;
              t.car.basis = t.cost;
              next.cars.push(t.car);
              next.log.unshift({ d: next.day, m: `Import arrived at port: ${CAT[t.car.cid].name}`, $: 0 });
              addFlash(`Import arrived: ${CAT[t.car.cid].name}! Inspect and register before driving.`);
            } else {
              const profit = t.net - t.car.basis;
              next.cash += t.net;
              next.stats.flips++;
              next.stats.profit += profit;
              next.log.unshift({ d: next.day, m: `Export complete: ${CAT[t.car.cid].name}`, $: t.net });
              addFlash(`Export completed! Received ${fmt(t.net)} for ${CAT[t.car.cid].name}.`);
            }
            return false;
          }
          return true;
        });

      // Advance job in progress
      next.cars.forEach((car) => {
        car.idle++;
        if (car.job && car.job.done <= next.day) {
          const j = car.job;
          car.job = null;
          if (j.kind === 'repair' && j.fix) {
            const iss = car.issues.find((i) => i.id === j.fix![0]);
            if (iss) iss.fixed = true;
          } else if (j.kind === 'body') {
            if (j.fn === 'dent') car.dents = Math.max(0, car.dents - 1);
            else if (car.rust > 0) car.rust--;
          }
          next.log.unshift({ d: next.day, m: `Shop completed work: ${j.desc} on ${CAT[car.cid].name}`, $: 0 });
          addFlash(`Shop completed: ${j.desc} on ${CAT[car.cid].name}!`);
        }
      });

      // Auto buyer offers on listed cars
      next.cars
        .filter((c) => c.sale)
        .forEach((c) => {
          if (Math.random() < 0.35) {
            const mv = worth(c, c.sale!.disc ? 'known' : 'seen', activePerks);
            const isTuned = Boolean(c.tuning?.parts && c.tuning.parts.length > 0);
            const targetBase = Math.min(c.sale!.ask, Math.max(mv * 0.92, c.sale!.ask * 0.88));
            const amt = Math.round((targetBase * (0.92 + Math.random() * 0.12)) / 25) * 25;
            const buyerMsg = isTuned
              ? `Saw your tuned ${CAT[c.cid].name}! Great dyno build (${c.perfMetrics?.hp || 320} HP). Would you take cash today?`
              : 'Hello, saw your listing. Would you take cash today?';
            next.offers.unshift({
              id: next.lid++,
              uid: c.uid,
              exp: next.day + 2,
              amt,
              willing: Math.round(Math.max(amt * 1.05, Math.min(c.sale!.ask, mv * 1.04))),
              msg: buyerMsg,
              type: 'ok',
            });
          }
        });

      // AI Competing Dealerships Simulation Tick
      if (!next.rivals || next.rivals.length === 0) {
        next.rivals = JSON.parse(JSON.stringify(INITIAL_RIVAL_DEALERSHIPS));
      }
      const rivalTick = tickRivalDealerships(next.rivals, next.listings, next.day);
      next.rivals = rivalTick.rivals;

      // Remove market listings purchased by rival dealers
      if (rivalTick.boughtListings.length > 0) {
        const boughtIds = new Set(rivalTick.boughtListings.map((b) => b.listing.id));
        next.listings = next.listings.filter((l) => !boughtIds.has(l.id));
        addFlash(rivalTick.boughtListings[0].reason);
      }

      // Empire Passive Daily Revenue Collection
      if (next.empire) {
        const empireBonuses = getEmpireTotalBonuses(next.empire);
        if (empireBonuses.dailyRevenue > 0) {
          next.cash += empireBonuses.dailyRevenue;
          next.log.unshift({
            d: next.day,
            m: `[Empire Headquarters] Facility revenue collected: +${fmt(empireBonuses.dailyRevenue)}`,
            $: empireBonuses.dailyRevenue,
          });
        }
      }

      return next;
    });


    addFlash('A new day begins. Market listings and rival dealerships have updated.');
  };

  const handleWaitWeek = () => {
    sound.playClick();
    for (let i = 0; i < 7; i++) {
      handleEndDay();
    }
    addFlash('A full week has passed.');
  };

  // Connection Unlock
  const handleUnlockContact = (contactId: string) => {
    setState((prev) => {
      const next = { ...prev };
      const res = unlockContact(next.connections, contactId, next.day);
      if (res.success) {
        addFlash(res.message);
        next.log.unshift({ d: next.day, m: `Unlocked relationship: ${next.connections.contacts[contactId]?.name}`, $: 0 });
      }
      return next;
    });
  };

  // Connection Quest Completion with Strict Criteria Validation
  const handleCompleteQuest = (contactId: string, questId: string) => {
    setState((prev) => {
      const next = { ...prev };
      const contact = next.connections.contacts[contactId];
      if (!contact) return prev;
      const quest = contact.quests.find((q) => q.id === questId);
      if (!quest || quest.completed) return prev;

      // Strict Validation: Must fulfill criteria to receive the money!
      if (quest.targetType === 'lend_money') {
        const cost = quest.criteria?.amount || 350;
        if (next.cash < cost) {
          addFlash(`Insufficient funds. Need ${fmt(cost)} cash to fulfill this loan.`);
          return prev;
        }
        next.cash -= cost;
        const netGain = quest.rewardCash - cost;
        next.cash += quest.rewardCash;
        quest.completed = true;
        contact.trust = Math.min(100, contact.trust + quest.rewardTrust);
        next.rep = Math.min(100, next.rep + 3);
        next.log.unshift({
          d: next.day,
          m: `Funded advance parts loan for ${contact.name}: ${quest.title} (Earned ${fmt(quest.rewardCash)})`,
          $: netGain,
        });
        addFlash(`Fulfill loan for ${contact.name}! Received ${fmt(quest.rewardCash)} return (+${quest.rewardTrust}% trust, +3 rep).`);
      } else if (quest.targetType === 'bring_car') {
        const matchIdx = next.cars.findIndex((c) => {
          const cat = CAT[c.cid];
          if (!cat) return false;
          if (quest.criteria?.cls && cat.cls !== quest.criteria.cls) return false;
          if (quest.criteria?.cleanTitleOnly && c.title !== 'clean') return false;
          if (quest.criteria?.maxKm && c.shown > quest.criteria.maxKm) return false;
          return true;
        });

        if (matchIdx === -1) {
          addFlash('Criteria unmet: You do not have a qualifying vehicle in your garage to deliver.');
          return prev;
        }

        const deliveredCar = next.cars.splice(matchIdx, 1)[0];
        quest.completed = true;
        contact.trust = Math.min(100, contact.trust + quest.rewardTrust);
        next.cash += quest.rewardCash;
        next.rep = Math.min(100, next.rep + 5);
        next.stats.flips++;
        const profit = quest.rewardCash - deliveredCar.basis;
        next.stats.profit += profit;

        next.log.unshift({
          d: next.day,
          m: `Delivered ${CAT[deliveredCar.cid].name} to ${contact.name} for requested bounty`,
          $: quest.rewardCash,
        });
        addFlash(`Delivered ${CAT[deliveredCar.cid].name} to ${contact.name}! Received ${fmt(quest.rewardCash)} bounty (+${quest.rewardTrust}% trust, +5 rep).`);
        if (selectedCar?.uid === deliveredCar.uid) setSelectedCar(null);
      } else {
        // Inspection or endorsement quest
        quest.completed = true;
        contact.trust = Math.min(100, contact.trust + quest.rewardTrust);
        next.cash += quest.rewardCash;
        next.rep = Math.min(100, next.rep + 4);
        next.log.unshift({
          d: next.day,
          m: `Completed trade endorsement for ${contact.name}: ${quest.title}`,
          $: quest.rewardCash,
        });
        addFlash(`Completed request for ${contact.name}! Received ${fmt(quest.rewardCash)} and +${quest.rewardTrust}% trust.`);
      }

      return next;
    });
  };

  // World Location Selection
  const handleSelectLocation = async (newLoc: WorldLocation) => {
    setActiveCurrency(newLoc.currencySymbol, newLoc.currencyMultiplier || 1.0);
    setState((prev) => {
      const next = { ...prev };
      next.customLocation = newLoc;
      next.log.unshift({
        d: next.day,
        m: `Relocated dealership headquarters to ${newLoc.city}, ${newLoc.country}. Currency: ${newLoc.currency} (${newLoc.currencySymbol}).`,
        $: 0,
      });
      return next;
    });
    addFlash(`Headquarters established in ${newLoc.city}, ${newLoc.country}! Sourcing regional listings, staff, & investment pitches via Gemini AI...`);

    try {
      const [aiListings, aiStaff, aiPitches] = await Promise.all([
        fetchAiRegionalListings(newLoc, state, 12),
        fetchAiRegionalStaff(newLoc, Object.values(state.connections.contacts).filter((c) => c.status === 'active'), 6),
        fetchAiRegionalPitches(newLoc),
      ]);

      setState((prev) => {
        const next = { ...prev };
        if (aiListings.length > 0) next.listings = aiListings;
        if (aiStaff.length > 0) next.pool = aiStaff;
        if (aiPitches) {
          next.pitches = aiPitches.pitches;
          if (Array.isArray(aiPitches.stocks)) {
            aiPitches.stocks.forEach((st) => {
              let p = st.p0 || 50;
              const h = [];
              for (let i = 0; i < 40; i++) {
                p *= 1 + (st.d || 0.001) + (st.v || 0.02) * (Math.random() * 2 - 1);
                h.push(+p.toFixed(2));
              }
              next.mk[st.s] = h;
            });
          }
        }
        return next;
      });

      if (aiListings.length > 0) setSelectedListing(aiListings[0] || null);
      addFlash(`Gemini AI loaded authentic regional market listings, local staff talent, & investment pitches for ${newLoc.city} (${newLoc.currency})!`);
    } catch (e) {
      console.warn('AI regional elements fetch failed on location select:', e);
    }
  };


  const handleRegenerateRegionalMarket = async () => {
    const loc = state.customLocation || PRESET_WORLD_CITIES[0];
    addFlash(`Querying Gemini AI for fresh ${loc.city} (${loc.currency}) listings...`);
    try {
      const aiListings = await fetchAiRegionalListings(loc, state, 12);
      if (aiListings.length > 0) {
        setState((prev) => ({
          ...prev,
          listings: aiListings,
        }));
        setSelectedListing(aiListings[0] || null);
        addFlash(`Gemini AI generated ${aiListings.length} regional market listings for ${loc.city}!`);
      } else {
        addFlash(`Marketplace refreshed for ${loc.city}.`);
      }
    } catch (e) {
      addFlash('Failed to generate AI listings. Preserving current marketplace.');
    }
  };

  // Rival Dealership Trading Handlers
  const handleBuyCarFromRival = (rival: RivalDealership, car: Car, price: number) => {
    if (state.cash < price) {
      addFlash(`Need ${state.customLocation?.currencySymbol || '$'}${price.toLocaleString()} to purchase from ${rival.name}.`);
      return;
    }
    if (state.cars.length >= state.slots) {
      addFlash('Garage is full! Upgrade lot capacity in Shop or sell a vehicle first.');
      return;
    }

    setState((prev) => {
      const next = { ...prev };
      next.cash -= price;
      const boughtCar = { ...car, bought: next.day, basis: price };
      next.cars.push(boughtCar);

      const targetRival = next.rivals.find((r) => r.id === rival.id);
      if (targetRival) {
        targetRival.inventory = targetRival.inventory.filter((c) => c.uid !== car.uid);
        targetRival.cash += price;
      }

      next.log.unshift({
        d: next.day,
        m: `Bought wholesale ${CAT[car.cid].name} from ${rival.name}`,
        $: -price,
      });
      return next;
    });

    addFlash(`Acquired ${CAT[car.cid].name} wholesale from ${rival.name} for ${state.customLocation?.currencySymbol || '$'}${price.toLocaleString()}!`);
  };

  const handleSellCarToRival = (rival: RivalDealership, car: Car, price: number) => {
    if (price > 0 && !checkAndRecordIncome(price, `Rival Dealer Sale (${rival.name})`)) return;
    setState((prev) => {
      const next = { ...prev };
      next.cash += price;
      next.cars = next.cars.filter((c) => c.uid !== car.uid);
      const profit = price - car.basis;
      next.stats.flips++;
      next.stats.profit += profit;

      const targetRival = next.rivals.find((r) => r.id === rival.id);
      if (targetRival) {
        targetRival.cash -= price;
        targetRival.inventory.push({ ...car, basis: price });
      }

      next.log.unshift({
        d: next.day,
        m: `Sold ${CAT[car.cid].name} wholesale to ${rival.name}`,
        $: price,
      });
      return next;
    });

    addFlash(`Sold ${CAT[car.cid].name} wholesale to ${rival.name} for ${state.customLocation?.currencySymbol || '$'}${price.toLocaleString()}!`);
  };

  // Market Interactions
  const handleMeetSeller = (listing: Listing) => {
    if (state.visits < listing.city.v) {
      addFlash(`Need ${listing.city.v} visit(s) to meet seller in ${listing.city.n}.`);
      return;
    }
    setState((prev) => ({
      ...prev,
      visits: prev.visits - listing.city.v,
      listings: prev.listings.map((l) => (l.id === listing.id ? { ...l, met: 1 } : l)),
    }));
    setSelectedListing((prev) => (prev ? { ...prev, met: 1 } : null));
    addFlash(`Met seller in ${listing.city.n}. Inspections and negotiation are open!`);
  };

  const handleInspect = (listing: Listing, tool: string) => {
    setState((prev) => {
      const next = { ...prev };
      const l = next.listings.find((x) => x.id === listing.id);
      if (!l) return prev;
      const car = l.car;
      const K = car.know;

      if (tool === 'walk') {
        car.issues.forEach((i) => {
          if (!i.fixed && Math.random() < i.det.walk) {
            K.issues[i.id] = 'walk';
          }
        });
        K.rust = car.rust;
        K.dents = car.dents;
        K.interior = car.interior;
        if (car.repaint) K.accident = true;
        addFlash(`Walk-around complete: Observed rust (${RUSTN[car.rust]}), ${car.dents} dent(s).`);
      } else if (tool === 'drive') {
        car.issues.forEach((i) => {
          if (!i.fixed && Math.random() < i.det.drive) {
            K.issues[i.id] = 'drive';
          }
        });
        addFlash('Test drive complete: Evaluated braking, steering, and transmission shifting.');
      } else if (tool === 'obd') {
        car.issues.forEach((i) => {
          if (!i.fixed && i.det.obd > 0 && Math.random() < i.det.obd) {
            K.issues[i.id] = 'obd';
          }
        });
        addFlash('OBD-II scan complete: Read diagnostic trouble codes from ECU memory.');
      } else if (tool === 'hist') {
        next.cash -= 35;
        K.hist = { title: car.title, accident: car.repaint, lien: car.lien, odo: car.rolled };
        next.log.unshift({ d: next.day, m: `History report on ${CAT[car.cid].name}`, $: -35 });
        addFlash(`History report ($35): Title ${car.title.toUpperCase()}${car.lien ? `, Lien ${fmt(car.lien)}` : ''}.`);
      }

      if (selectedListing?.id === l.id) {
        setSelectedListing({ ...l });
      }
      return next;
    });
  };

  const handleContact = (listing: Listing, kind: string) => {
    const car = listing.car;
    const t = listing.seller.type;
    let reply = '';
    if (kind === 'prob') {
      const knownIssues = car.issues.filter((i) => i.sk && !i.fixed);
      reply = knownIssues.length
        ? `Seller: "Yes, it has minor ${knownIssues.map((i) => i.label).join(', ')}."`
        : 'Seller: "Runs and drives great, no major issues that I know of."';
    } else {
      reply = 'Seller: "Upgrading to a newer family vehicle. Price is somewhat flexible."';
    }
    addFlash(reply);
  };

  const handleNegotiate = (listing: Listing, offerAmt: number) => {
    if (offerAmt <= 0) return;
    setState((prev) => {
      const next = { ...prev };
      const l = next.listings.find((x) => x.id === listing.id);
      if (!l) return prev;
      l.rounds++;
      if (offerAmt >= l.ask) {
        l.deal = offerAmt;
        addFlash(`Seller agreed to ${fmt(offerAmt)}!`);
      } else if (offerAmt >= l.reserve) {
        l.deal = offerAmt;
        addFlash(`Seller: "Alright, ${fmt(offerAmt)} works for me." Deal locked in!`);
      } else {
        const counter = Math.max(l.reserve, Math.round((l.ask + offerAmt) / 2 / 25) * 25);
        l.ask = counter;
        addFlash(`Seller countered: "The lowest I can let it go for is ${fmt(counter)}."`);
      }
      if (selectedListing?.id === l.id) setSelectedListing({ ...l });
      return next;
    });
  };

  const handleBidAuction = (listing: Listing, maxBid: number) => {
    if (maxBid < listing.reserve) {
      addFlash(`Outbid! The auction reserve was higher than ${fmt(maxBid)}.`);
      return;
    }
    const quote = quoteListing(listing, currentRegion, state.ins, monthlyInsurance, activePerks);
    if (state.cash < quote.towT) {
      addFlash(`Need ${fmt(quote.towT)} to cover auction purchase, fees, and towing.`);
      return;
    }

    setState((prev) => {
      const next = { ...prev };
      next.cash -= quote.towT;
      const c = listing.car;
      c.basis = quote.towT;
      c.bought = next.day;
      next.cars.push(c);
      next.listings = next.listings.filter((x) => x.id !== listing.id);
      next.log.unshift({ d: next.day, m: `Won auction: ${CAT[c.cid].name}`, $: -quote.towT });
      addFlash(`Won auction lot for ${fmt(listing.reserve)}! Towed home to your garage.`);
      return next;
    });
    setSelectedListing(null);
    setActiveTab('garage');
  };

  const handleBuy = (listing: Listing, mode: 'drive' | 'tow') => {
    const quote = quoteListing(listing, currentRegion, state.ins, monthlyInsurance, activePerks);
    const need = mode === 'drive' ? quote.drive : quote.towT;
    if (state.cash < need) {
      addFlash(`Insufficient cash. You need ${fmt(need)} for this transaction.`);
      return;
    }
    if (state.cars.length >= state.slots) {
      addFlash(`No free parking spot! Rent another spot in the Shop or sell a car.`);
      return;
    }

    setState((prev) => {
      const next = { ...prev };
      next.cash -= need;
      const c = listing.car;
      c.basis = need;
      c.bought = next.day;
      if (mode === 'drive') {
        c.regd = true;
        c.reg = 'valid';
      }
      next.cars.push(c);
      next.listings = next.listings.filter((x) => x.id !== listing.id);
      next.log.unshift({ d: next.day, m: `Purchased ${CAT[c.cid].name} (${mode})`, $: -need });
      addFlash(`Purchased ${CAT[c.cid].name} for ${fmt(need)}! Added to your garage.`);
      return next;
    });
    setSelectedListing(null);
    setActiveTab('garage');
  };

  // Garage Actions
  const handleRepair = (car: Car, issueId: string, how: 'diy' | 'shop') => {
    setState((prev) => {
      const next = { ...prev };
      const c = next.cars.find((x) => x.uid === car.uid);
      if (!c) return prev;
      const iss = c.issues.find((i) => i.id === issueId);
      if (!iss) return prev;

      const partsCost = Math.round(iss.parts * (how === 'diy' ? 0.72 : 1.15));
      const totalCost = how === 'diy' ? partsCost : Math.round(partsCost + iss.hrs * 115);

      if (next.cash < totalCost) {
        addFlash(`Need ${fmt(totalCost)} for repairs.`);
        return prev;
      }

      next.cash -= totalCost;
      c.basis += totalCost;

      if (how === 'diy') {
        iss.fixed = true;
        next.hrs = Math.max(0, next.hrs - iss.hrs);
        next.skills.mech = (next.skills.mech || 0) + iss.sev * 2;
        next.log.unshift({ d: next.day, m: `DIY repair: ${iss.label} on ${CAT[c.cid].name}`, $: -totalCost });
        addFlash(`Fixed ${iss.label} in driveway!`);
      } else {
        c.job = {
          done: next.day + Math.ceil(iss.hrs / 8) + 1,
          kind: 'repair',
          desc: iss.label,
          fix: [iss.id],
        };
        next.log.unshift({ d: next.day, m: `Shop repair booked: ${iss.label}`, $: -totalCost });
        addFlash(`Shop booked for ${iss.label}. Ready in ${c.job.done - next.day} day(s).`);
      }

      if (selectedCar?.uid === c.uid) setSelectedCar({ ...c });
      return next;
    });
  };

  const handleRegister = (car: Car) => {
    const cost = Math.round(car.basis * currentRegion.priv + currentRegion.regFee);
    if (state.cash < cost) {
      addFlash(`Need ${fmt(cost)} for sales tax and registration.`);
      return;
    }
    setState((prev) => {
      const next = { ...prev };
      const c = next.cars.find((x) => x.uid === car.uid);
      if (!c) return prev;
      next.cash -= cost;
      c.basis += cost;
      c.regd = true;
      c.reg = 'valid';
      next.skills.paper = (next.skills.paper || 0) + 3;
      next.log.unshift({ d: next.day, m: `Registered and plated ${CAT[c.cid].name}`, $: -cost });
      addFlash(`Registered and plated ${CAT[c.cid].name} with ${currentRegion.auth}!`);
      if (selectedCar?.uid === c.uid) setSelectedCar({ ...c });
      return next;
    });
  };

  const handleListForSale = (car: Car, ask: number, disc: boolean, ad: number) => {
    setState((prev) => {
      const next = { ...prev };
      const c = next.cars.find((x) => x.uid === car.uid);
      if (!c) return prev;
      c.sale = { ask, disc, ad, listed: next.day };
      addFlash(`Listed ${CAT[c.cid].name} for sale at ${fmt(ask)}!`);
      if (selectedCar?.uid === c.uid) setSelectedCar({ ...c });
      return next;
    });
  };

  const handleUnlist = (car: Car) => {
    setState((prev) => {
      const next = { ...prev };
      const c = next.cars.find((x) => x.uid === car.uid);
      if (!c) return prev;
      c.sale = null;
      addFlash(`Unlisted ${CAT[c.cid].name} from market.`);
      if (selectedCar?.uid === c.uid) setSelectedCar({ ...c });
      return next;
    });
  };

  const handleWholesale = (car: Car) => {
    const [lo] = estimate(car, currentRegion, lv(state.skills, 'appr'), activePerks);
    const price = Math.round(lo * 0.75);
    setState((prev) => {
      const next = { ...prev };
      next.cash += price;
      const profit = price - car.basis;
      next.stats.flips++;
      next.stats.profit += profit;
      next.cars = next.cars.filter((x) => x.uid !== car.uid);
      next.log.unshift({ d: next.day, m: `Wholesaled ${CAT[car.cid].name} to dealer`, $: price });
      addFlash(`Wholesaled ${CAT[car.cid].name} for ${fmt(price)} (${profit >= 0 ? '+' : ''}${fmt(profit)}).`);
      return next;
    });
    setSelectedCar(null);
  };

  const handleScrap = (car: Car) => {
    const price = scrapV(car, activePerks);
    if (price > 0 && !checkAndRecordIncome(price, 'Scrap Yard Sale')) return;
    setState((prev) => {
      const next = { ...prev };
      next.cash += price;
      const profit = price - car.basis;
      next.stats.flips++;
      next.stats.profit += profit;
      next.cars = next.cars.filter((x) => x.uid !== car.uid);
      next.log.unshift({ d: next.day, m: `Scrapped ${CAT[car.cid].name} at salvage yard`, $: price });
      addFlash(`Scrapped ${CAT[car.cid].name} for ${fmt(price)}.`);
      return next;
    });
    setSelectedCar(null);
  };

  // Buyer Offers
  const handleAcceptOffer = (offerId: number) => {
    setState((prev) => {
      const next = { ...prev };
      const offer = next.offers.find((o) => o.id === offerId);
      if (!offer) return prev;
      const car = next.cars.find((c) => c.uid === offer.uid);
      if (!car) return prev;

      const price = offer.amt;
      if (price > 0 && !checkAndRecordIncome(price, 'Private Car Sale')) return prev;

      const profit = price - car.basis;
      next.cash += price;
      next.stats.flips++;
      next.stats.profit += profit;
      next.stats.best = Math.max(next.stats.best, profit);
      next.cars = next.cars.filter((c) => c.uid !== car.uid);
      next.offers = next.offers.filter((o) => o.id !== offerId);
      next.log.unshift({ d: next.day, m: `Sold ${CAT[car.cid].name} to private buyer`, $: price });
      addFlash(`Sold ${CAT[car.cid].name} for ${fmt(price)}! Profit: ${fmt(profit)}.`);
      return next;
    });
  };

  const handleDeclineOffer = (offerId: number) => {
    setState((prev) => ({
      ...prev,
      offers: prev.offers.filter((o) => o.id !== offerId),
    }));
    addFlash('Declined offer.');
  };

  const handleCounterOffer = (offerId: number, counterAmt: number) => {
    if (counterAmt <= 0 || !Number.isFinite(counterAmt)) return;
    setState((prev) => {
      const next = { ...prev };
      const offer = next.offers.find((o) => o.id === offerId);
      if (!offer) return prev;
      if (counterAmt <= offer.willing) {
        offer.amt = counterAmt;
        addFlash(`Buyer accepted your counter of ${fmt(counterAmt)}!`);
      } else {
        addFlash('Buyer: "That is more than I can do right now."');
      }
      return next;
    });
  };

  const handleAcceptSwap = (offer: any) => {
    setState((prev) => {
      const next = { ...prev };
      const myCar = next.cars.find((c) => c.uid === offer.uid) || next.cars[0];
      if (!myCar) return prev;
      const theirCar = offer.l.car;

      if (offer.cash > 0 && !checkAndRecordIncome(offer.cash, 'Vehicle Swap Cash')) return prev;

      next.cash += offer.cash;
      theirCar.basis = Math.max(0, myCar.basis - offer.cash);
      theirCar.bought = next.day;

      next.cars = next.cars.filter((c) => c.uid !== myCar.uid);
      next.cars.push(theirCar);
      next.offers = next.offers.filter((o) => o.id !== offer.id);
      next.log.unshift({ d: next.day, m: `Swapped ${CAT[myCar.cid].name} for ${CAT[theirCar.cid].name}`, $: offer.cash });
      addFlash(`Vehicle exchange completed! You now own ${CAT[theirCar.cid].name}.`);
      return next;
    });
  };

  // B2B Wholesale Handlers
  const handleBuyCarFromB2B = (car: Car, cost: number, sellerName: string) => {
    if (cost <= 0 || !Number.isFinite(cost) || state.cash < cost) {
      addFlash('Transaction denied: Insufficient cash or invalid amount.');
      return;
    }
    if (state.cars.length >= state.slots) {
      addFlash('No free garage spot! Rent another spot in the Shop or sell a car.');
      return;
    }
    setState((prev) => {
      if (prev.cash < cost) return prev;
      const next = { ...prev };
      next.cash -= cost;
      car.basis = cost;
      car.bought = next.day;
      next.cars.push(car);
      next.log.unshift({ d: next.day, m: `B2B Wholesale Purchase from ${sellerName}: ${CAT[car.cid]?.name || 'Vehicle'}`, $: -cost });
      return next;
    });
  };

  const handleSellCarToB2B = (carUid: number) => {
    setState((prev) => {
      const next = { ...prev };
      next.cars = next.cars.filter((c) => c.uid !== carUid);
      return next;
    });
  };

  // Stock Market
  const handleBuyStock = (symbol: string, amount: number) => {
    if (amount <= 0 || !Number.isFinite(amount) || state.cash < amount + 5) {
      addFlash(`Need ${fmt(amount + 5)} (including $5 trade commission).`);
      return;
    }
    setState((prev) => {
      if (prev.cash < amount + 5) return prev;
      const next = { ...prev };
      const prices = next.mk[symbol];
      const p = prices ? prices[prices.length - 1] : 25;
      next.cash -= amount + 5;
      const pos = next.hold[symbol] || { u: 0, cost: 0 };
      pos.u += amount / p;
      pos.cost += amount;
      next.hold[symbol] = pos;
      next.log.unshift({ d: next.day, m: `Purchased ${symbol} ETF/Stock`, $: -(amount + 5) });
      addFlash(`Purchased ${fmt(amount)} of ${symbol} at $${p.toFixed(2)}.`);
      return next;
    });
  };

  const handleSellStock = (symbol: string, amount: number, all = false) => {
    if (amount <= 0 || !Number.isFinite(amount)) return;
    setState((prev) => {
      const next = { ...prev };
      const pos = next.hold[symbol];
      if (!pos || pos.u <= 0) return prev;
      const prices = next.mk[symbol];
      const p = prices ? prices[prices.length - 1] : 25;
      const totalVal = pos.u * p;
      const sellVal = all ? totalVal : Math.min(totalVal, amount);
      if (sellVal <= 0 || !Number.isFinite(sellVal)) return prev;

      const frac = (sellVal / p) / pos.u;
      pos.cost -= pos.cost * frac;
      pos.u -= sellVal / p;
      if (all || pos.u < 0.001) delete next.hold[symbol];

      const netProceeds = sellVal - 5;
      if (netProceeds > 0 && !checkAndRecordIncome(netProceeds, `Stock Sale (${symbol})`)) return prev;

      next.cash += netProceeds;
      next.log.unshift({ d: next.day, m: `Sold ${symbol} proceeds`, $: netProceeds });
      addFlash(`Sold ${fmt(sellVal)} of ${symbol}. Net proceeds: ${fmt(netProceeds)}.`);
      return next;
    });
  };

  // Start New Game
  const handleStartNewGame = async (regionId: RegionId, mode: GameMode, player: PlayerCharacter, location?: WorldLocation) => {
    const activeLoc = location || PRESET_WORLD_CITIES[0];
    setActiveCurrency(activeLoc.currencySymbol, activeLoc.currencyMultiplier || 1.0);
    const newSt = createNewGame(regionId, mode, player, activeLoc);
    setState(newSt);
    setSelectedListing(null);
    setSelectedCar(null);
    setActiveTab('market');
    addFlash(`Started fresh venture in ${activeLoc.city}, ${activeLoc.country}! Sourcing regional market, staff, & pitches via Gemini AI...`);

    try {
      const [aiListings, aiStaff, aiPitches] = await Promise.all([
        fetchAiRegionalListings(activeLoc, newSt, 12),
        fetchAiRegionalStaff(activeLoc, Object.values(newSt.connections.contacts).filter((c) => c.status === 'active'), 6),
        fetchAiRegionalPitches(activeLoc),
      ]);

      setState((prev) => {
        const next = { ...prev };
        if (aiListings.length > 0) next.listings = aiListings;
        if (aiStaff.length > 0) next.pool = aiStaff;
        if (aiPitches) {
          next.pitches = aiPitches.pitches;
          if (Array.isArray(aiPitches.stocks)) {
            aiPitches.stocks.forEach((st) => {
              let p = st.p0 || 50;
              const h = [];
              for (let i = 0; i < 40; i++) {
                p *= 1 + (st.d || 0.001) + (st.v || 0.02) * (Math.random() * 2 - 1);
                h.push(+p.toFixed(2));
              }
              next.mk[st.s] = h;
            });
          }
        }
        return next;
      });

      if (aiListings.length > 0) setSelectedListing(aiListings[0] || null);
      addFlash(`Gemini AI loaded authentic regional market listings, local staff, & investment pitches for ${activeLoc.city} (${activeLoc.currency})!`);
    } catch (e) {
      console.warn('AI listings fetch on game start failed:', e);
    }
  };

  const activeAccount = useMemo(() => getActiveAccount(), [isAccountsModalOpen]);

  return (
    <div className="relative min-h-screen bg-slate-50 text-zinc-900 dark:bg-[#070709] dark:text-zinc-100 flex flex-col font-sans transition-colors duration-300 selection:bg-zinc-900 selection:text-white dark:selection:bg-zinc-100 dark:selection:text-zinc-950 overflow-x-clip">
      {/* Monochrome B&W Ambient Liquid Glass Refraction Orbs */}
      <div className="fixed top-[-10vw] left-[-10vw] w-[45vw] h-[45vw] rounded-full bg-gradient-to-br from-zinc-500/10 via-zinc-400/05 to-transparent blur-[120px] pointer-events-none z-0 dark:from-zinc-100/05 dark:via-zinc-300/02" />
      <div className="fixed top-[35vh] right-[-12vw] w-[40vw] h-[40vw] rounded-full bg-gradient-to-bl from-zinc-600/10 via-zinc-500/05 to-transparent blur-[130px] pointer-events-none z-0 dark:from-zinc-200/05 dark:via-zinc-400/02" />
      <div className="fixed bottom-[-15vw] left-[25vw] w-[50vw] h-[35vw] rounded-full bg-gradient-to-tr from-zinc-500/10 via-zinc-400/05 to-transparent blur-[120px] pointer-events-none z-0 dark:from-zinc-100/05 dark:via-zinc-300/02" />


      {/* Top Bar Contract */}
      <Navbar

        state={state}
        activeTab={activeTab}
        onTabChange={(tab) => {
          sound.playClick();
          setActiveTab(tab);
        }}
        onEndDay={handleEndDay}
        onWaitWeek={handleWaitWeek}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          const enabled = sound.toggle();
          setSoundEnabled(enabled);
        }}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onOpenAccounts={() => setIsAccountsModalOpen(true)}
        onOpenWelcome={() => setActiveTab('welcome')}
        onOpenTutorial={() => setIsTutorialOpen(true)}
        netWorth={currentNetWorth}
        onOpenAiAdvisor={() => setIsAiAdvisorOpen(true)}
      />

      {/* Flash Banner Messages */}
      {flashMessages.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 w-full mt-2 space-y-1">
          {flashMessages.map((msg, i) => (
            <div
              key={i}
              className="p-2.5 liquid-glass text-slate-900 dark:text-white rounded-xl text-xs font-mono shadow-md flex items-center justify-between border border-white/60 dark:border-white/10"
            >
              <span>{msg}</span>
              <button
                onClick={() => setFlashMessages((prev) => prev.filter((_, idx) => idx !== i))}
                className="text-slate-400 hover:text-white ml-2 text-sm cursor-pointer"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Container Views */}
      <main className="max-w-7xl mx-auto px-4 py-4 w-full flex-1">
        {activeTab === 'welcome' && (
          <WelcomeView
            onStartGame={() => setActiveTab('market')}
            onOpenCharacterCreator={() => setIsCharCreatorOpen(true)}
            onOpenTutorial={() => setIsTutorialOpen(true)}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenAccounts={() => setIsAccountsModalOpen(true)}
            hasActiveGame={state.cars.length > 0 || state.day > 1}
          />
        )}

        {activeTab === 'empire' && (
          <DealershipEmpireMapView
            state={state}
            onUpgradeBuilding={(buildingId, cost) => {
              setState((prev) => {
                const empire = prev.empire ? { ...prev.empire } : {
                  level: 1,
                  reputationXp: 100,
                  gridWidth: 8,
                  gridHeight: 6,
                  buildings: [...INITIAL_EMPIRE_BUILDINGS],
                  displayCars: [],
                  totalVisitorsToday: 20,
                  passiveDailyRevenue: 1500,
                };
                empire.buildings = empire.buildings.map((b) => {
                  if (b.id === buildingId) {
                    return {
                      ...b,
                      level: b.level + 1,
                      upgradeCost: Math.round(b.upgradeCost * 1.6),
                    };
                  }
                  return b;
                });
                const bonuses = getEmpireTotalBonuses(empire);
                return {
                  ...prev,
                  cash: prev.cash - cost,
                  rep: Math.min(100, prev.rep + 3),
                  slots: 2 + bonuses.extraSlots,
                  empire,
                };
              });
            }}
            onConstructBuilding={(typeId, gridX, gridY, cost) => {
              setState((prev) => {
                const empire = prev.empire ? { ...prev.empire } : {
                  level: 1,
                  reputationXp: 100,
                  gridWidth: 8,
                  gridHeight: 6,
                  buildings: [...INITIAL_EMPIRE_BUILDINGS],
                  displayCars: [],
                  totalVisitorsToday: 20,
                  passiveDailyRevenue: 1500,
                };
                const catalogItem = AVAILABLE_BUILDING_CATALOG.find((b) => b.typeId === typeId);
                if (catalogItem) {
                  empire.buildings.push({
                    ...catalogItem,
                    id: `bld_${typeId}_${Date.now()}`,
                    gridX,
                    gridY,
                  });
                }
                const bonuses = getEmpireTotalBonuses(empire);
                return {
                  ...prev,
                  cash: prev.cash - cost,
                  rep: Math.min(100, prev.rep + 5),
                  slots: 2 + bonuses.extraSlots,
                  empire,
                };
              });
            }}
            onPlaceDisplayCar={(carUid, gridX, gridY) => {
              setState((prev) => {
                const empire = prev.empire ? { ...prev.empire } : {
                  level: 1,
                  reputationXp: 100,
                  gridWidth: 8,
                  gridHeight: 6,
                  buildings: [...INITIAL_EMPIRE_BUILDINGS],
                  displayCars: [],
                  totalVisitorsToday: 20,
                  passiveDailyRevenue: 1500,
                };
                empire.displayCars = (empire.displayCars || []).filter((c) => c.gridX !== gridX || c.gridY !== gridY);
                empire.displayCars.push({ carUid, gridX, gridY });
                return {
                  ...prev,
                  empire,
                };
              });
            }}
            onOpenTuningStudio={(car) => setTuningCar(car)}
            onFlashNotification={addFlash}
          />
        )}

        {activeTab === 'racing' && (
          <RaceTrackCenterView
            state={state}
            onUpdateRacingStats={(result) => {
              if (result.cashDelta > 0 && !checkAndRecordIncome(result.cashDelta, 'Race Track Wager Victory')) return;
              setState((prev) => {
                const next = { ...prev };
                next.cash += result.cashDelta;
                const stats = next.racingStats ? { ...next.racingStats } : {
                  wins: 0,
                  losses: 0,
                  winStreak: 0,
                  pinkSlipsWon: 0,
                  pinkSlipsLost: 0,
                  totalEarnings: 0,
                  eloRating: 1200,
                };

                if (result.won) {
                  stats.wins += 1;
                  stats.winStreak += 1;
                  stats.totalEarnings += Math.max(0, result.cashDelta);
                } else {
                  stats.losses += 1;
                  stats.winStreak = 0;
                }
                stats.eloRating = Math.max(800, stats.eloRating + result.eloChange);

                if (result.pinkSlipLostCarUid) {
                  next.cars = next.cars.filter((c) => c.uid !== result.pinkSlipLostCarUid);
                  stats.pinkSlipsLost += 1;
                  addFlash('Pink Slip loss: Forfeited vehicle title to victor!');
                }
                if (result.pinkSlipWonCar) {
                  next.cars.push(result.pinkSlipWonCar);
                  stats.pinkSlipsWon += 1;
                  addFlash('Pink Slip victory: Seized opponent vehicle title!');
                }

                next.racingStats = stats;
                return next;
              });
            }}
            onOpenTuningStudio={(car) => setTuningCar(car)}
            onFlashNotification={addFlash}
            onOpenAccounts={() => setIsAccountsModalOpen(true)}
          />
        )}

        {activeTab === 'worldmap' && (
          <WorldMapView
            currentLocation={state.customLocation || PRESET_WORLD_CITIES[0]}
            onSelectLocation={handleSelectLocation}
            day={state.day}
          />
        )}


        {activeTab === 'auction' && (
          <AuctionHouseView
            state={state}
            onBuyCar={(boughtCar, price) => {
              setState((prev) => ({
                ...prev,
                cash: prev.cash - price,
                cars: [...prev.cars, boughtCar],
              }));
              addFlash(`Acquired ${boughtCar.adTitle} from auction block!`);
            }}
            onFlashNotification={addFlash}
          />
        )}

        {activeTab === 'rivals' && (
          <RivalDealershipsView
            rivals={state.rivals || INITIAL_RIVAL_DEALERSHIPS}
            playerCars={state.cars}
            playerCash={state.cash}
            playerRep={state.rep}
            onBuyCarFromRival={handleBuyCarFromRival}
            onSellCarToRival={handleSellCarToRival}
            currencySymbol={state.customLocation?.currencySymbol || '$'}
          />
        )}

        {activeTab === 'metrics' && (
          <MetricsView
            state={state}
            netWorth={currentNetWorth}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onFlash={addFlash}
          />
        )}

        {activeTab === 'b2b' && (
          <MultiplayerB2BView
            myCars={state.cars}
            myCash={state.cash}
            dealershipName={state.player?.name ? `${state.player.name}'s Auto Lot` : 'Pro Auto Lot'}
            onBuyCarFromB2B={handleBuyCarFromB2B}
            onSellCarToB2B={handleSellCarToB2B}
            onFlash={addFlash}
            onOpenAccounts={() => setIsAccountsModalOpen(true)}
          />
        )}

        {activeTab === 'connections' && (
          <ConnectionsView
            graph={state.connections}
            onUnlockContact={handleUnlockContact}
            onCompleteQuest={handleCompleteQuest}
            playerCash={state.cash}
            playerFavours={state.favours}
            playerRep={state.rep}
            playerCars={state.cars}
            currentUserId={activeAccount?.id || 'user_default'}
            currentUsername={activeAccount?.username || state.player?.name || 'Alex'}
            onFlash={addFlash}
          />
        )}

        {activeTab === 'market' && (
          <MarketView
            listings={state.listings}
            selectedListing={selectedListing}
            onSelectListing={setSelectedListing}
            onMeetSeller={handleMeetSeller}
            onInspect={handleInspect}
            onContact={handleContact}
            onDeposit={(l) => addFlash('Deposit holding sent to seller.')}
            onNegotiate={handleNegotiate}
            onBidAuction={handleBidAuction}
            onBuy={handleBuy}
            onOpenInspector={setInspectingCar}
            region={currentRegion}
            isInsured={state.ins}
            monthlyInsuranceCost={monthlyInsurance}
            playerVisits={state.visits}
            favours={state.favours}
            tools={state.tools}
            activePerks={activePerks}
            apprLevel={lv(state.skills, 'appr')}
            location={state.customLocation || PRESET_WORLD_CITIES[0]}
            onRegenerateMarket={handleRegenerateRegionalMarket}
          />
        )}

        {activeTab === 'garage' && (
          <GarageView
            cars={state.cars}
            selectedCar={selectedCar}
            onSelectCar={setSelectedCar}
            onDiagnose={(c) => {
              addFlash(`Diagnosed ${CAT[c.cid].name}. Verified mechanical components.`);
            }}
            onRepair={handleRepair}
            onBodyFix={(c, what, how) => {
              sound.playWrench();
              addFlash(`Completed body repair on ${what}.`);
            }}
            onRegister={handleRegister}
            onPayLien={(c) => {
              if (state.cash < c.lien) {
                addFlash(`Need ${fmt(c.lien)} to pay off registered lien.`);
                return;
              }
              setState((prev) => {
                const next = { ...prev };
                const found = next.cars.find((x) => x.uid === c.uid);
                if (found) {
                  next.cash -= found.lien;
                  found.basis += found.lien;
                  found.lienPaid = true;
                  found.lienFlag = false;
                  addFlash('Lien cleared with registry!');
                }
                return next;
              });
            }}
            onTires={(c) => addFlash('Installed new all-season tires.')}
            onWinterSet={(c) => {
              if (state.cash < 520) return;
              setState((prev) => {
                const next = { ...prev };
                const found = next.cars.find((x) => x.uid === c.uid);
                if (found) {
                  next.cash -= 520;
                  found.basis += 520;
                  found.winter = true;
                  addFlash('Fitted winter tire package ($520).');
                }
                return next;
              });
            }}
            onDetail={(c, how) => {
              setState((prev) => {
                const next = { ...prev };
                const found = next.cars.find((x) => x.uid === c.uid);
                if (found) {
                  found.detail = true;
                  found.basis += 30;
                  next.cash -= 30;
                  addFlash('Vehicle detailed. Photos and valuation improved!');
                }
                return next;
              });
            }}
            onListForSale={handleListForSale}
            onUnlist={handleUnlist}
            onWholesale={handleWholesale}
            onScrap={handleScrap}
            onPartOut={handleScrap}
            onOpenInspector={setInspectingCar}
            onOpenTuningStudio={(car) => setTuningCar(car)}
            slots={state.slots}
            region={currentRegion}
            activePerks={activePerks}
            apprLevel={lv(state.skills, 'appr')}
            mechLevel={lv(state.skills, 'mech')}
          />
        )}


        {activeTab === 'offers' && (
          <OffersView
            offers={state.offers}
            cars={state.cars}
            onAcceptOffer={handleAcceptOffer}
            onDeclineOffer={handleDeclineOffer}
            onCounterOffer={handleCounterOffer}
            onAcceptSwap={handleAcceptSwap}
            onDeclineSwap={handleDeclineOffer}
            region={currentRegion}
            activePerks={activePerks}
            apprLevel={lv(state.skills, 'appr')}
          />
        )}

        {activeTab === 'trade' && (
          <TradeView
            imports={state.imports}
            transit={state.transit}
            onOrderImport={(l) => {
              if (state.cash < l.ask + 1000) {
                addFlash(`Need ${fmt(l.ask + 1000)} for vehicle, shipping, and customs clearance.`);
                return;
              }
              setState((prev) => {
                const next = { ...prev };
                next.cash -= l.ask + 1000;
                next.transit.push({
                  id: next.uid++,
                  dir: 'in',
                  car: l.car,
                  from: l.city.n,
                  arr: 12,
                  cost: l.ask + 1000,
                  held: 0,
                });
                next.imports = next.imports.filter((x) => x.id !== l.id);
                addFlash(`Order placed for ${CAT[l.car.cid].name}. Ocean vessel transit booked!`);
                return next;
              });
            }}
            onRemoteInspect={() => addFlash('Remote partner completed inspection report ($180).')}
            onExportCar={() => addFlash('Export scheduled.')}
            cars={state.cars}
          />
        )}

        {activeTab === 'staff' && (
          <StaffView
            staff={state.staff}
            pool={state.pool}
            onHire={(cand, contract) => {
              setState((prev) => {
                const next = { ...prev };
                const cId = typeof cand === 'object' ? cand.id : cand;
                const found = next.pool.find((p) => p.id === cId) || cand;
                if (found) {
                  next.staff.push({ ...found, contract, morale: 85, jobs: 0 });
                  next.pool = next.pool.filter((p) => p.id !== cId);
                  addFlash(`Hired ${found.name} as ${found.roleLabel || found.role} on ${contract} contract!`);
                }
                return next;
              });
            }}
            onFire={(empId) => {
              setState((prev) => ({
                ...prev,
                staff: prev.staff.filter((e) => e.id !== empId),
              }));
              addFlash('Employee let go.');
            }}
            onInterview={() => addFlash('Interview completed ($40). Verified candidate background.')}
            autoRepair={state.auto}
            onToggleAutoRepair={() => setState((prev) => ({ ...prev, auto: !prev.auto }))}
            maxStaff={2 + state.slots}
            location={state.customLocation || PRESET_WORLD_CITIES[0]}
            connections={Object.values(state.connections.contacts).filter((c) => c.status === 'active')}
            onAddCandidatesToPool={(newCands) => {
              setState((prev) => ({
                ...prev,
                pool: [...newCands, ...prev.pool].slice(0, 12),
              }));
            }}
            onFlash={addFlash}
          />
        )}

        {activeTab === 'invest' && (
          <InvestView
            mk={state.mk}
            hold={state.hold}
            pitches={state.pitches}
            stakes={state.stakes}
            cash={state.cash}
            onBuyStock={handleBuyStock}
            onSellStock={handleSellStock}
            onDueDiligence={() => addFlash('Due diligence completed ($100). Verified company revenue.')}
            onInvestStartup={() => addFlash('Angel investment wired! Equity share issued.')}
          />
        )}

        {activeTab === 'legal' && (
          <LegalView
            suits={state.suits}
            rep={state.rep}
            onSettle={(suitId) => {
              setState((prev) => {
                const next = { ...prev };
                const suit = next.suits.find((s) => s.id === suitId);
                if (suit) {
                  suit.stage = 'closed';
                  next.cash -= Math.round(suit.amt * 0.6);
                  addFlash(`Settled lawsuit out of court for ${fmt(Math.round(suit.amt * 0.6))}.`);
                }
                return next;
              });
            }}
            onDefend={(suitId) => {
              setState((prev) => {
                const next = { ...prev };
                const suit = next.suits.find((s) => s.id === suitId);
                if (suit) {
                  suit.stage = 'closed';
                  addFlash(`Hearing concluded: Claim dismissed by judge!`);
                }
                return next;
              });
            }}
            onHireCounsel={(suitId, type) => addFlash('Retained legal counsel.')}
          />
        )}

        {activeTab === 'shop' && (
          <ShopView
            ins={state.ins}
            monthlyInsurance={monthlyInsurance}
            onToggleInsurance={(enable) => {
              setState((prev) => ({ ...prev, ins: enable }));
              addFlash(enable ? 'Commercial insurance started.' : 'Insurance policy cancelled.');
            }}
            tools={state.tools}
            onBuyTool={(t) => {
              const cost = t === 'obd' ? 70 : 120;
              if (state.cash < cost) return;
              setState((prev) => ({
                ...prev,
                cash: prev.cash - cost,
                tools: { ...prev.tools, [t]: true },
              }));
              addFlash(`Purchased ${t === 'obd' ? 'OBD-II scanner' : 'compression tester'}!`);
            }}
            slots={state.slots}
            onRentSpot={() => {
              if (state.cash < 150) return;
              setState((prev) => ({
                ...prev,
                cash: prev.cash - 150,
                slots: prev.slots + 1,
              }));
              addFlash('Rented extra parking spot ($150).');
            }}
            creditScore={state.credit}
            debt={state.debt}
            cash={state.cash}
            onBorrowLoan={(amt) => {
              if (amt <= 0 || !Number.isFinite(amt)) return;
              const loanLimit =
                state.credit >= 760 ? 10000 : state.credit >= 700 ? 5000 : state.credit >= 650 ? 2500 : state.credit >= 625 ? 1000 : state.credit >= 610 ? 500 : 100;
              if (state.debt + amt > loanLimit) {
                addFlash('Loan denied: Reached commercial borrowing limit for your credit score.');
                return;
              }
              setState((prev) => ({
                ...prev,
                cash: prev.cash + amt,
                debt: prev.debt + amt,
              }));
              addFlash(`Borrowed ${fmt(amt)} commercial credit.`);
            }}
            onRepayLoan={() => {
              setState((prev) => {
                if (prev.debt <= 0 || prev.cash <= 0) return prev;
                const repayAmt = Math.min(prev.cash, prev.debt);
                return {
                  ...prev,
                  cash: Math.max(0, prev.cash - repayAmt),
                  debt: Math.max(0, prev.debt - repayAmt),
                };
              });
              addFlash('Repaid debt.');
            }}
            hasLicense={state.lic}
            onGetLicense={() => {
              if (state.cash < 3000) return;
              setState((prev) => ({
                ...prev,
                cash: Math.max(0, prev.cash - 3000),
                lic: true,
              }));
              addFlash('Licensed as certified automotive dealer!');
            }}
            partners={state.partners}
            onPartner={(key) => addFlash('Partner agreement signed.')}
            netWorth={currentNetWorth}
            onOpenCheckout={(pack) => setSelectedCheckoutPack(pack)}
            onEarnCash={(amount) => {
              const safeAmt = Math.min(500, Math.max(0, amount));
              if (safeAmt > 0) {
                setState((prev) => ({ ...prev, cash: prev.cash + safeAmt }));
              }
            }}
            onFlash={addFlash}
            onOpenAdmin={() => setIsAdminModalOpen(true)}
          />
        )}

        {activeTab === 'ledger' && (
          <LedgerView
            skills={state.skills}
            stats={state.stats}
            log={state.log}
            netWorth={currentNetWorth}
            rep={state.rep}
            credit={state.credit}
            day={state.day}
          />
        )}
      </main>

      {/* Interactive Modals */}
      <AccountsModal
        isOpen={isAccountsModalOpen}
        onClose={() => setIsAccountsModalOpen(false)}
        gameState={state}
        netWorth={currentNetWorth}
        onLoadGameState={(loadedState) => {
          setState(loadedState);
          setSelectedListing(null);
          setSelectedCar(null);
        }}
        onFlash={addFlash}
      />

      <CharacterCreatorModal
        isOpen={isCharCreatorOpen}
        onClose={() => setIsCharCreatorOpen(false)}
        onConfirmStart={handleStartNewGame}
        initialRegion={state.region}
        initialMode={state.mode}
        initialPlayer={state.player}
        initialLocation={state.customLocation}
      />

      <InteractiveTutorial
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />

      {inspectingCar && (
        <InteractiveCarInspector
          car={inspectingCar}
          onClose={() => setInspectingCar(null)}
          onInspectZone={(zone) => {
            sound.playWrench();
          }}
          hasObdTool={state.tools.obd}
        />
      )}

      {/* Mandatory Onboarding & First Time Modals */}
      <FirstTimeWelcomeModal
        isOpen={isFirstTimeWelcomeOpen}
        onProceedToSetup={() => {
          localStorage.setItem('lot_ledger_v2_welcome_seen', 'true');
          setIsFirstTimeWelcomeOpen(false);
          setIsMandatoryGameStartOpen(true);
        }}
      />

      <MandatoryGameStartModal
        isOpen={isMandatoryGameStartOpen}
        onConfirmStart={(region, mode, player, location) => {
          setIsMandatoryGameStartOpen(false);
          handleStartNewGame(region, mode, player, location);
        }}
      />

      {/* Floating Global AI Advisor Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => {
            sound.playClick();
            setIsAiAdvisorOpen(true);
          }}
          className="px-4 py-2.5 bg-white/90 dark:bg-zinc-900/90 hover:bg-white dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700/80 rounded-xl font-bold text-xs shadow-xl flex items-center gap-2.5 transition-all hover:-translate-y-0.5 cursor-pointer backdrop-blur-md"
          title="Consult Dmitri (AI Advisor) — Press ⌘K or Ctrl+K"
        >
          <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          <span className="tracking-tight">Dmitri (AI)</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
            ⌘K
          </span>
        </button>
      </div>

      {/* AI Advisor Modal */}
      <AiAdvisorModal
        isOpen={isAiAdvisorOpen}
        onClose={() => setIsAiAdvisorOpen(false)}
        day={state.day}
        cash={state.cash}
        netWorth={currentNetWorth}
        ownedCars={state.cars}
        selectedListing={selectedListing}
        location={state.customLocation || PRESET_WORLD_CITIES[0]}
        rivals={state.rivals || INITIAL_RIVAL_DEALERSHIPS}
        region={currentRegion}
      />

      {/* In-Game Microtransaction & Admin Modals */}
      <InGameCheckoutModal
        isOpen={Boolean(selectedCheckoutPack)}
        onClose={() => setSelectedCheckoutPack(null)}
        selectedPack={selectedCheckoutPack}
        dealershipName={state.player?.name ? `${state.player.name}'s Auto Lot` : 'Apex Motors'}
        onApplyReward={handleApplyReward}
        onFlash={addFlash}
      />

      <AdminDashboardModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onFlash={addFlash}
      />

      {/* Performance Dyno & Tuning Studio Modal */}
      {tuningCar && (
        <CarTuningModal
          car={tuningCar}
          playerCash={state.cash}
          isOpen={Boolean(tuningCar)}
          onClose={() => setTuningCar(null)}
          tuningDiscountPct={state.empire ? getEmpireTotalBonuses(state.empire).tuningDiscountPct : 0}
          onApplyTuning={(carUid, updatedCar, totalCost) => {
            setState((prev) => {
              const next = { ...prev };
              next.cash -= totalCost;
              next.cars = next.cars.map((c) => (c.uid === carUid ? updatedCar : c));
              if (totalCost > 0) {
                next.log.unshift({
                  d: next.day,
                  m: `Dyno tuning upgrades installed on ${updatedCar.adTitle}`,
                  $: -totalCost,
                });
              }
              return next;
            });
            if (selectedCar?.uid === carUid) {
              setSelectedCar(updatedCar);
            }
            addFlash(`Fitted custom performance tuning to ${updatedCar.adTitle}! Invested basis updated to ${fmt(updatedCar.basis)}.`);
          }}
        />
      )}

      {/* Anti-Cheat Regulatory Audit Termination Modal ($800,000 Cash Ceiling Guard & $4,000/min Velocity Cap) */}
      {(antiCheatViolation || state.cash > 800000) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl">
          <div className="p-8 rounded-3xl bg-zinc-950 border-2 border-rose-500/80 shadow-2xl max-w-lg w-full text-center space-y-6 text-white font-sans">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto shadow-lg">
              <ShieldAlert className="w-8 h-8 text-rose-500 animate-pulse" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 text-[11px] font-mono font-bold uppercase bg-rose-950 text-rose-300 border border-rose-800 rounded-full">
                SECURITY REGULATORY AUDIT FAILURE
              </span>
              <h2 className="text-xl font-black font-display tracking-tight text-white mt-1">
                Anti-Cheat Protection Tripped
              </h2>
              <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                {antiCheatViolation?.message || (
                  <>Liquid cash reserves reached <strong className="text-rose-400 font-bold">{fmt(state.cash)}</strong>, exceeding the <strong className="text-white font-bold">$800,000</strong> regulatory ceiling. This venture has been terminated to enforce competitive economy integrity.</>
                )}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400 text-left space-y-1">
              <div className="flex justify-between">
                <span>System Protocol:</span>
                <span className="text-rose-400 font-bold">
                  {antiCheatViolation?.type || 'ANTI_CHEAT_CEILING_800K'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="text-rose-400 font-bold">GAME TERMINATED</span>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                setAntiCheatViolation(null);
                handleStartNewGame(state.region, state.mode, state.player, state.customLocation);
              }}
              className="w-full py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-mono font-black text-sm transition-all shadow-xl cursor-pointer active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Reset &amp; Start Clean Venture</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

