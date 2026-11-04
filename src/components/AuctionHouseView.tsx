import React, { useState, useEffect, useRef } from 'react';
import {
  Gavel, Volume2, VolumeX, MessageSquare, Vote, Clock, Sparkles, Send,
  ShieldCheck, AlertTriangle, Trophy, Zap, ChevronRight, User, Check, RefreshCw
} from 'lucide-react';
import { GameState } from '../game/engine';
import { Car } from '../game/types';
import { fmt } from '../game/valuation';
import { sound } from '../game/audio';
import {
  auth,
  CloudAuctionBid,
  subscribeToAuctionBids,
  placeAuctionBidInFirestore,
  CloudAuctionVote,
  subscribeToAuctionVotes,
  castAuctionVoteInFirestore,
  subscribeToLiveChat,
  sendLiveChatMessage,
  CloudChatMessage
} from '../lib/firebase';

interface AuctionHouseViewProps {
  state: GameState;
  onBuyCar: (car: Car, price: number) => void;
  onFlashNotification: (msg: string) => void;
}

export interface AuctionItem {
  cid: number;
  make: string;
  model: string;
  year: number;
  mileage: number;
  val: number;
  rare: string;
  hp: number;
  condition: string;
}

const AUCTION_CARS_POOL: AuctionItem[] = [
  { cid: 0, make: 'Porsche', model: '911 GT3 RS', year: 2023, mileage: 4100, val: 245000, rare: 'legendary', hp: 518, condition: 'Mint' },
  { cid: 1, make: 'Ferrari', model: '488 Pista', year: 2020, mileage: 8200, val: 320000, rare: 'legendary', hp: 710, condition: 'Mint' },
  { cid: 2, make: 'Lamborghini', model: 'Huracán STO', year: 2022, mileage: 3900, val: 295000, rare: 'legendary', hp: 631, condition: 'Mint' },
  { cid: 3, make: 'BMW', model: 'M3 Competition xDrive', year: 2024, mileage: 6500, val: 88000, rare: 'rare', hp: 503, condition: 'Excellent' },
  { cid: 4, make: 'Mercedes-AMG', model: 'GT Black Series', year: 2021, mileage: 2100, val: 380000, rare: 'legendary', hp: 720, condition: 'Mint' },
  { cid: 5, make: 'Audi', model: 'R8 V10 Performance', year: 2022, mileage: 11200, val: 165000, rare: 'epic', hp: 602, condition: 'Excellent' },
  { cid: 6, make: 'Chevrolet', model: 'Corvette Z06', year: 2023, mileage: 5400, val: 125000, rare: 'epic', hp: 670, condition: 'Mint' },
  { cid: 7, make: 'Ford', model: 'GT Heritage Edition', year: 2021, mileage: 1200, val: 890000, rare: 'mythic', hp: 660, condition: 'Mint' },
];

function createCarFromAuctionItem(item: AuctionItem, boughtPrice: number): Car {
  return {
    uid: Date.now() + Math.floor(Math.random() * 1000),
    cid: item.cid,
    trim: 0,
    color: ['Obsidian Black', '#1a1a1a'],
    vin: `1HG${Date.now().toString(36).toUpperCase()}88`,
    owners: 1,
    use: 'personal',
    km: Math.round(item.mileage * 1.60934),
    shown: Math.round(item.mileage * 1.60934),
    rolled: false,
    tr: 'Automatic',
    eng: `${item.hp} HP High-Performance V8`,
    q: 0.95,
    issues: [],
    rust: 0,
    dents: 0,
    repaint: false,
    gaps: false,
    interior: 10,
    water: false,
    tread: 90,
    winter: false,
    modded: false,
    title: 'clean',
    adTitle: `${item.year} ${item.make} ${item.model} (${item.rare.toUpperCase()})`,
    reg: 'valid',
    lien: 0,
    lienPaid: true,
    cloned: false,
    recall: false,
    receipts: 12,
    masked: false,
    detail: true,
    regd: true,
    latent: [],
    job: null,
    sale: null,
    idle: 0,
    basis: boughtPrice,
    bought: Date.now(),
    partGrade: 'new',
    know: {
      issues: {},
      rust: 0,
      dents: 0,
      interior: 10,
      tires: { tread: 90, winter: false },
      accident: false,
      water: false,
      odo: true,
      odoSus: false,
      hist: 'Verified Clean Title Auction Certificate',
      ppi: true,
      said: [],
      mech: 'Inspected and certified in mint condition',
      full: true,
    },
  };
}


export const AuctionHouseView: React.FC<AuctionHouseViewProps> = ({
  state,
  onBuyCar,
  onFlashNotification,
}) => {
  const [activeTab, setActiveTab] = useState<'bidding' | 'chat' | 'schedule'>('bidding');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  
  // Auction State
  const [auctionId, setAuctionId] = useState<string>('daily_6pm_session_1');
  const [currentCarIdx, setCurrentCarIdx] = useState(0);
  const [currentBid, setCurrentBid] = useState(150000);
  const [highestBidder, setHighestBidder] = useState<string>('Opening Bid');
  const [timerSeconds, setTimerSeconds] = useState(15);
  const [bids, setBids] = useState<CloudAuctionBid[]>([]);
  const [auctioneerAnnouncement, setAuctioneerAnnouncement] = useState<string>(
    'Welcome to the Lot & Ledger Live Auction! Place your bids now.'
  );
  const [isSold, setIsSold] = useState(false);
  
  // Voting & AI Rivals
  const [votes, setVotes] = useState<CloudAuctionVote[]>([]);
  const [userVoted, setUserVoted] = useState<boolean | null>(null);
  
  // Live Chat
  const [chatMessages, setChatMessages] = useState<CloudChatMessage[]>([]);
  const [inputChat, setInputChat] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const activeCar = AUCTION_CARS_POOL[currentCarIdx % AUCTION_CARS_POOL.length];
  const user = auth.currentUser;
  const userName = user?.displayName || state.player?.name || 'Dealer_Owner';

  // AI Voice Auctioneer Utterance
  const speakAuctioneer = (text: string) => {
    setAuctioneerAnnouncement(text);
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1;
      utterance.pitch = 1.0;
      // Prefer energetic English voice if available
      const voices = window.speechSynthesis.getVoices();
      const prefVoice = voices.find((v) => v.lang.startsWith('en') && v.name.includes('Natural')) || voices[0];
      if (prefVoice) utterance.voice = prefVoice;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  };

  // Compute Daily 6:00 PM Countdown
  const now = new Date();
  const next6pm = new Date();
  next6pm.setHours(18, 0, 0, 0);
  if (now > next6pm) {
    next6pm.setDate(next6pm.getDate() + 1);
  }
  const diffMs = next6pm.getTime() - now.getTime();
  const hoursLeft = Math.floor(diffMs / (1000 * 60 * 60));
  const minsLeft = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const secsLeft = Math.floor((diffMs % (1000 * 60)) / 1000);
  const dateTodayStr = now.toISOString().slice(0, 10);

  // 6:00 PM Auction Schedule Check
  const [isSimulated6PM, setIsSimulated6PM] = useState(false);
  const currentHour = now.getHours();
  const isLive6PM = currentHour === 18 || isSimulated6PM;

  // Local Vote State for instant responsive feedback
  const [localVoteState, setLocalVoteState] = useState<{ allowAi: number; disallowAi: number; myVote: boolean | null }>(() => {
    try {
      const saved = localStorage.getItem(`lot_ledger_vote_${dateTodayStr}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { allowAi: 14, disallowAi: 8, myVote: null };
  });

  // Subscribe to Firestore Bids & Votes
  useEffect(() => {
    const unsubBids = subscribeToAuctionBids(auctionId, (newBids) => {
      setBids(newBids);
      if (newBids.length > 0) {
        const topBid = newBids[0];
        if (topBid.amount > currentBid) {
          setCurrentBid(topBid.amount);
          setHighestBidder(topBid.userName);
          setTimerSeconds(15); // Reset timer on new bid
          speakAuctioneer(`New bid of ${fmt(topBid.amount)} from ${topBid.userName}!`);
        }
      }
    });

    const unsubVotes = subscribeToAuctionVotes(dateTodayStr, (vList) => {
      setVotes(vList);
      if (vList.length > 0) {
        const allowCount = vList.filter((v) => v.allowAiRivals).length;
        const disallowCount = vList.filter((v) => !v.allowAiRivals).length;
        setLocalVoteState((prev) => ({
          ...prev,
          allowAi: 14 + allowCount,
          disallowAi: 8 + disallowCount,
        }));
      }
      if (user) {
        const myVote = vList.find((v) => v.userId === user.uid);
        if (myVote) setUserVoted(myVote.allowAiRivals);
      }
    });

    const unsubChat = subscribeToLiveChat((msgs) => {
      setChatMessages(msgs);
    });

    return () => {
      unsubBids();
      unsubVotes();
      unsubChat();
    };
  }, [auctionId, dateTodayStr, user]);

  // Live Timer & AI Rival Bidding Simulation
  useEffect(() => {
    if (isSold || !isLive6PM) return;

    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleHammerDrop();
          return 0;
        }
        if (prev === 10) speakAuctioneer(`Going once at ${fmt(currentBid)}!`);
        if (prev === 5) speakAuctioneer(`Going twice at ${fmt(currentBid)}!`);
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerSeconds, isSold, currentBid, isLive6PM]);

  // AI Rival Auto-Bidding (if enabled by vote)
  const totalAiAllowed = localVoteState.allowAi;
  const totalAiDisallowed = localVoteState.disallowAi;
  const isAiRivalsEnabled = totalAiAllowed >= totalAiDisallowed;

  useEffect(() => {
    if (!isLive6PM || !isAiRivalsEnabled || isSold || timerSeconds <= 3) return;

    const aiTrigger = setTimeout(() => {
      if (Math.random() < 0.35) {
        const aiRivals = ['Apex Autos AI', 'Veloce Capital', 'Redline Motors AI', 'Titan B2B Trader'];
        const randomRival = aiRivals[Math.floor(Math.random() * aiRivals.length)];
        const increment = [1000, 2500, 5000][Math.floor(Math.random() * 3)];
        const newAmount = currentBid + increment;

        if (newAmount <= (activeCar.val || 200000) * 1.3) {
          const aiBid: CloudAuctionBid = {
            id: `bid_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            auctionId,
            userId: 'ai_rival_bot',
            userName: randomRival,
            amount: newAmount,
            carTitle: `${activeCar.year} ${activeCar.make} ${activeCar.model}`,
            isAiRival: true,
            timestamp: Date.now(),
          };
          placeAuctionBidInFirestore(aiBid);
        }
      }
    }, 4000);

    return () => clearTimeout(aiTrigger);
  }, [currentBid, timerSeconds, isSold, isAiRivalsEnabled, isLive6PM]);

  const handleHammerDrop = () => {
    setIsSold(true);
    sound.playCash();
    const winnerMsg = `SOLD! The ${activeCar.year} ${activeCar.make} ${activeCar.model} goes to ${highestBidder} for ${fmt(
      currentBid
    )}!`;
    speakAuctioneer(winnerMsg);

    if (highestBidder === userName || (user && highestBidder === user.displayName)) {
      const wonCar = createCarFromAuctionItem(activeCar, currentBid);
      onBuyCar(wonCar, currentBid);
      onFlashNotification(`🎉 CONGRATULATIONS! You won the ${wonCar.adTitle}!`);
    }
  };

  const handlePlaceUserBid = async (increment: number) => {
    sound.playClick();
    if (!isLive6PM) {
      onFlashNotification('Auctions are locked until 6:00 PM daily!');
      return;
    }
    if (state.cash < currentBid + increment) {
      onFlashNotification('Insufficient cash balance to place this bid!');
      return;
    }

    const nextAmount = currentBid + increment;
    const userBid: CloudAuctionBid = {
      id: `bid_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      auctionId,
      userId: user?.uid || 'guest_user',
      userName,
      userEmail: user?.email || undefined,
      amount: nextAmount,
      carTitle: `${activeCar.year} ${activeCar.make} ${activeCar.model}`,
      isAiRival: false,
      timestamp: Date.now(),
    };

    const success = await placeAuctionBidInFirestore(userBid);
    if (success) {
      sound.playCash();
      setTimerSeconds(15);
    }
  };

  const handleCastVote = async (allowAi: boolean) => {
    sound.playClick();
    const userIdToUse = user?.uid || `guest_device_${dateTodayStr}`;
    const previousVote = localVoteState.myVote;

    // Dynamically update local state immediately
    setLocalVoteState((prev) => {
      let newAllow = prev.allowAi;
      let newDisallow = prev.disallowAi;

      if (previousVote === true && !allowAi) {
        newAllow = Math.max(0, newAllow - 1);
        newDisallow += 1;
      } else if (previousVote === false && allowAi) {
        newDisallow = Math.max(0, newDisallow - 1);
        newAllow += 1;
      } else if (previousVote === null) {
        if (allowAi) newAllow += 1;
        else newDisallow += 1;
      }

      const nextState = { allowAi: newAllow, disallowAi: newDisallow, myVote: allowAi };
      try {
        localStorage.setItem(`lot_ledger_vote_${dateTodayStr}`, JSON.stringify(nextState));
      } catch (e) {}
      return nextState;
    });

    setUserVoted(allowAi);

    // Save to Firestore
    const voteObj: CloudAuctionVote = {
      id: `${userIdToUse}_${dateTodayStr}`,
      userId: userIdToUse,
      userName,
      allowAiRivals: allowAi,
      dateStr: dateTodayStr,
      timestamp: Date.now(),
    };

    await castAuctionVoteInFirestore(voteObj);
    onFlashNotification(`Vote recorded for today's 6 PM Auction: ${allowAi ? 'ALLOW AI Rivals' : 'Player-Only Auction'}`);
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputChat.trim()) return;
    sound.playClick();

    const chatMsg: CloudChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      senderId: user?.uid || 'guest',
      senderName: userName,
      dealershipName: state.player?.name ? `${state.player.name}'s Auto Lot` : 'Apex Motors',
      message: inputChat.trim(),
      createdAt: Date.now(),
    };

    await sendLiveChatMessage(chatMsg);
    setInputChat('');
  };

  const nextCarOnBlock = () => {
    sound.playClick();
    setCurrentCarIdx((prev) => prev + 1);
    const nextCar = AUCTION_CARS_POOL[(currentCarIdx + 1) % AUCTION_CARS_POOL.length];
    const newBase = Math.round((nextCar.val || 150000) * 0.75);
    setCurrentBid(newBase);
    setHighestBidder('Reserve Bid');
    setTimerSeconds(15);
    setIsSold(false);
    setAuctionId(`session_${Date.now()}`);
    speakAuctioneer(`Now on the block: ${nextCar.year} ${nextCar.make} ${nextCar.model}. Opening at ${fmt(newBase)}!`);
  };

  const effectiveMyVote = userVoted !== null ? userVoted : localVoteState.myVote;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-zinc-100 font-sans">
      {/* Upper Glass Header */}
      <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl backdrop-blur-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white text-zinc-950 flex items-center justify-center shadow-lg font-bold">
            <Gavel className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-display font-black tracking-tight text-white">
                Daily 6:00 PM Live Multiplayer Auction
              </h1>
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold bg-white text-zinc-950 rounded-full">
                6:00 PM ONLY
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Live Voice AI Auctioneer · Strictly 6:00 PM Daily Event · Real-Time B2B Bidding
            </p>
          </div>
        </div>

        {/* Daily Countdown & Voice Control */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs font-mono flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <div>
              <span className="text-zinc-500 block text-[9px] uppercase font-bold">Next 6 PM Event</span>
              <span className="font-bold text-white">
                {hoursLeft.toString().padStart(2, '0')}:{minsLeft.toString().padStart(2, '0')}:{secsLeft.toString().padStart(2, '0')}
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsSimulated6PM(!isSimulated6PM)}
            className={`px-3 py-2 rounded-2xl border text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              isSimulated6PM
                ? 'bg-amber-400 text-zinc-950 border-amber-400 shadow-md'
                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
            title="Toggle 6 PM Session Simulation Mode"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{isSimulated6PM ? '6 PM Live Active' : 'Simulate 6 PM'}</span>
          </button>

          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              voiceEnabled
                ? 'bg-white text-zinc-950 border-white shadow-md'
                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
            title={voiceEnabled ? 'Mute AI Voice Auctioneer' : 'Enable AI Voice Auctioneer'}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{voiceEnabled ? 'AI Voice ON' : 'AI Voice Muted'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
        <button
          onClick={() => {
            sound.playTab();
            setActiveTab('bidding');
          }}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'bidding'
              ? 'bg-white text-zinc-950 shadow-md'
              : 'bg-zinc-900/60 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Gavel className="w-4 h-4" />
          <span>Live Bidding Floor</span>
        </button>

        <button
          onClick={() => {
            sound.playTab();
            setActiveTab('chat');
          }}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'chat'
              ? 'bg-white text-zinc-950 shadow-md'
              : 'bg-zinc-900/60 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Auction Chat</span>
          {chatMessages.length > 0 && (
            <span className="px-1.5 py-0.2 text-[10px] bg-zinc-800 text-zinc-200 rounded-full font-mono">
              {chatMessages.length}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            sound.playTab();
            setActiveTab('schedule');
          }}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'schedule'
              ? 'bg-white text-zinc-950 shadow-md'
              : 'bg-zinc-900/60 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Vote className="w-4 h-4" />
          <span>Daily Schedule &amp; AI Vote</span>
        </button>
      </div>

      {/* TAB 1: Live Bidding Block */}
      {activeTab === 'bidding' && (
        <>
          {!isLive6PM ? (
            /* LOCKED OUTSIDE 6:00 PM STATE */
            <div className="p-12 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl text-center space-y-6 max-w-2xl mx-auto my-8">
              <div className="w-16 h-16 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center mx-auto text-amber-400 shadow-inner">
                <Clock className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white font-display">
                  Auction Floor Locked — Opens Daily at 6:00 PM
                </h2>
                <p className="text-xs text-zinc-400 font-mono max-w-md mx-auto">
                  Per network regulations, live vehicle bidding takes place strictly during the daily 6:00 PM event window.
                </p>
              </div>

              {/* Countdown Banner */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 inline-block font-mono">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block">Doors Open In</span>
                <span className="text-3xl font-black text-amber-400 tabular-nums">
                  {hoursLeft.toString().padStart(2, '0')}:{minsLeft.toString().padStart(2, '0')}:{secsLeft.toString().padStart(2, '0')}
                </span>
              </div>

              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={() => setIsSimulated6PM(true)}
                  className="px-5 py-2.5 rounded-2xl bg-white text-zinc-950 font-bold text-xs flex items-center gap-2 hover:bg-zinc-200 transition-all cursor-pointer shadow-md"
                >
                  <Zap className="w-4 h-4" />
                  <span>Enter 6:00 PM Live Floor (Simulation)</span>
                </button>
              </div>
            </div>
          ) : (
            /* ACTIVE 6:00 PM BIDDING FLOOR */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Auction Block */}
              <div className="lg:col-span-2 space-y-6">
                {/* Vehicle Spotlight Card */}
                <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl relative overflow-hidden">
                  {/* Sold Ribbon */}
                  {isSold && (
                    <div className="absolute top-4 right-4 bg-emerald-500 text-zinc-950 px-4 py-1.5 rounded-full font-black text-sm uppercase tracking-wider shadow-lg flex items-center gap-1.5 z-10 animate-bounce">
                      <Trophy className="w-4 h-4" />
                      <span>HAMMER DROPPED - SOLD</span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase bg-zinc-800 text-zinc-300 rounded-md border border-zinc-700">
                          {activeCar.rare} Grade
                        </span>
                        <span className="text-xs text-zinc-400 font-mono">{activeCar.year} Model</span>
                      </div>
                      <h2 className="text-2xl font-black text-white font-display">
                        {activeCar.make} {activeCar.model}
                      </h2>
                      <p className="text-xs text-zinc-400 font-mono mt-0.5">
                        Est. Market Value: <span className="text-emerald-400 font-bold">{fmt(activeCar.val || 0)}</span> · {activeCar.mileage?.toLocaleString()} mi · {activeCar.hp} HP
                      </p>
                    </div>

                    {/* Live Auction Timer Badge */}
                    <div className={`px-5 py-3 rounded-2xl border text-center font-mono transition-all ${
                      timerSeconds <= 5 ? 'bg-rose-950/80 border-rose-800 text-rose-300 animate-pulse' : 'bg-zinc-950 border-zinc-800 text-white'
                    }`}>
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block">Countdown</span>
                      <span className="text-2xl font-black tabular-nums">{timerSeconds}s</span>
                    </div>
                  </div>

                  {/* AI Voice Auctioneer Broadcast Box */}
                  <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 mb-6 flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-amber-400 shrink-0 animate-spin" />
                    <div className="flex-1">
                      <span className="text-[10px] font-mono text-amber-400 uppercase font-bold block">
                        AI Voice Auctioneer Calling:
                      </span>
                      <p className="text-sm font-semibold text-zinc-100 italic">"{auctioneerAnnouncement}"</p>
                    </div>
                  </div>

                  {/* Current High Bid HUD */}
                  <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 mb-6 font-mono">
                    <div>
                      <span className="text-xs text-zinc-500 block font-semibold">Current Highest Bid</span>
                      <span className="text-3xl font-black text-emerald-400 tabular-nums">{fmt(currentBid)}</span>
                    </div>
                    <div>
                      <span className="text-xs text-zinc-500 block font-semibold">High Bidder</span>
                      <span className="text-base font-bold text-white flex items-center gap-1.5 mt-1">
                        <User className="w-4 h-4 text-zinc-400" />
                        <span>{highestBidder}</span>
                      </span>
                    </div>
                  </div>

                  {/* Quick Bid Action Buttons */}
                  <div className="space-y-3">
                    <span className="text-xs font-mono font-bold text-zinc-400 block uppercase">
                      Raise Bid Amount (Your Cash: {fmt(state.cash)}):
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        disabled={isSold}
                        onClick={() => handlePlaceUserBid(1000)}
                        className="py-3 px-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white text-xs font-bold font-mono transition-all border border-zinc-700 cursor-pointer active:scale-95"
                      >
                        +$1,000
                      </button>
                      <button
                        disabled={isSold}
                        onClick={() => handlePlaceUserBid(2500)}
                        className="py-3 px-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white text-xs font-bold font-mono transition-all border border-zinc-700 cursor-pointer active:scale-95"
                      >
                        +$2,500
                      </button>
                      <button
                        disabled={isSold}
                        onClick={() => handlePlaceUserBid(5000)}
                        className="py-3 px-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white text-xs font-bold font-mono transition-all border border-zinc-700 cursor-pointer active:scale-95"
                      >
                        +$5,000
                      </button>
                      <button
                        disabled={isSold}
                        onClick={() => handlePlaceUserBid(10000)}
                        className="py-3 px-3 rounded-2xl bg-white hover:bg-zinc-200 disabled:opacity-40 text-zinc-950 text-xs font-bold font-mono transition-all shadow-md cursor-pointer active:scale-95"
                      >
                        +$10,000
                      </button>
                    </div>
                  </div>

                  {/* Next Vehicle Button */}
                  {isSold && (
                    <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-end">
                      <button
                        onClick={nextCarOnBlock}
                        className="px-6 py-3 rounded-2xl bg-white text-zinc-950 font-bold text-xs flex items-center gap-2 hover:bg-zinc-200 transition-all cursor-pointer shadow-lg"
                      >
                        <span>Bring Next Vehicle to Block</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Real-time Bid Log Sidebar */}
              <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl flex flex-col h-[520px]">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-3">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <Gavel className="w-4 h-4 text-amber-400" />
                    <span>Live Bidding Feed</span>
                  </h3>
                  <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">
                    {bids.length} Bids
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                  {bids.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500 text-xs font-mono">
                      No bids recorded yet. Be the first to bid on this lot!
                    </div>
                  ) : (
                    bids.map((b) => (
                      <div
                        key={b.id}
                        className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs font-mono flex items-center justify-between"
                      >
                        <div>
                          <span className="font-bold text-white block">{b.userName}</span>
                          <span className="text-[10px] text-zinc-500">{new Date(b.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <span className="font-black text-emerald-400">{fmt(b.amount)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB 2: Dedicated Live Chat */}
      {activeTab === 'chat' && (
        <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl space-y-4 max-w-4xl mx-auto">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div>
              <h3 className="font-bold text-base text-white">Live Multiplayer Auction Chat</h3>
              <p className="text-xs text-zinc-400 font-mono">Connect with other auto dealers in real-time.</p>
            </div>
            <span className="px-2.5 py-1 text-xs font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Multiplayer Connected</span>
            </span>
          </div>

          <div className="h-80 overflow-y-auto space-y-2 p-3 bg-zinc-950 rounded-2xl border border-zinc-800 scrollbar-thin">
            {chatMessages.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-xs font-mono">
                No chat messages yet. Say hello to fellow dealers!
              </div>
            ) : (
              chatMessages.map((m) => (
                <div key={m.id} className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white">{m.senderName}</span>
                    <span className="text-[10px] text-zinc-500">
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-zinc-300 font-sans">{m.message}</p>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendChat} className="flex gap-2">
            <input
              type="text"
              value={inputChat}
              onChange={(e) => setInputChat(e.target.value)}
              placeholder="Type your message to the room..."
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-xs font-mono text-white focus:outline-none focus:border-zinc-600"
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-white text-zinc-950 font-bold text-xs flex items-center gap-1.5 hover:bg-zinc-200 transition-all cursor-pointer shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: Daily Schedule & AI Rivals Voting */}
      {activeTab === 'schedule' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl space-y-6">
            <div>
              <h3 className="font-black text-lg text-white font-display">Daily Auction Schedule &amp; Community Rules</h3>
              <p className="text-xs text-zinc-400 font-mono mt-1">
                Every day strictly at 6:00 PM local time, the Lot &amp; Ledger network hosts a premier live auction session.
              </p>
            </div>

            {/* Voting Widget */}
            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Today's Daily Vote: AI Rivals Participation</span>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    Vote on whether AI rivals should bid in today's 6:00 PM auction.
                  </span>
                </div>
                <Vote className="w-5 h-5 text-amber-400" />
              </div>

              {/* Dynamic Vote Stats Bar */}
              <div className="space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-zinc-300 text-[11px] font-bold">
                  <span>ALLOW AI RIVALS: {localVoteState.allowAi} Votes ({Math.round((localVoteState.allowAi / (localVoteState.allowAi + localVoteState.disallowAi)) * 100)}%)</span>
                  <span>PLAYER-ONLY: {localVoteState.disallowAi} Votes ({Math.round((localVoteState.disallowAi / (localVoteState.allowAi + localVoteState.disallowAi)) * 100)}%)</span>
                </div>
                <div className="h-3 bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden flex p-0.5">
                  <div
                    className="bg-emerald-400 h-full rounded-l-full transition-all duration-300"
                    style={{
                      width: `${(localVoteState.allowAi / (localVoteState.allowAi + localVoteState.disallowAi)) * 100}%`,
                    }}
                  />
                  <div
                    className="bg-amber-400 h-full rounded-r-full transition-all duration-300"
                    style={{
                      width: `${(localVoteState.disallowAi / (localVoteState.allowAi + localVoteState.disallowAi)) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {effectiveMyVote !== null && (
                <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-emerald-400 flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Your vote for <strong>{effectiveMyVote ? 'ALLOW AI RIVALS' : 'PLAYER-ONLY'}</strong> is saved and active for today's 6:00 PM auction.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => handleCastVote(true)}
                  className={`py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border active:scale-95 ${
                    effectiveMyVote === true
                      ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-lg font-black'
                      : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>Vote ALLOW AI Rivals</span>
                </button>

                <button
                  onClick={() => handleCastVote(false)}
                  className={`py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border active:scale-95 ${
                    effectiveMyVote === false
                      ? 'bg-amber-400 text-zinc-950 border-amber-300 shadow-lg font-black'
                      : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>Vote Player-Only</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

