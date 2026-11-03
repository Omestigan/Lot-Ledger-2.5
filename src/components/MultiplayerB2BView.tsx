import React, { useState, useEffect } from 'react';
import {
  Globe, Car, DollarSign, MessageSquare, Send, Tag, ShoppingBag,
  Users, ShieldCheck, Sparkles, CheckCircle2, AlertCircle, RefreshCw, Plus
} from 'lucide-react';
import {
  auth,
  subscribeToB2BOffers,
  subscribeToOnlineDealers,
  subscribeToLiveChat,
  createB2BOfferInFirestore,
  buyB2BOfferInFirestore,
  cancelB2BOfferInFirestore,
  sendLiveChatMessage,
  CloudB2BOffer,
  CloudUserProfile,
  CloudChatMessage
} from '../lib/firebase';
import { Car as LocalCar } from '../game/types';
import { CAT } from '../game/data';
import { fmt } from '../game/valuation';
import { CarPhotoCard } from './CarPhotoCard';
import { sound } from '../game/audio';

interface MultiplayerB2BViewProps {
  myCars: LocalCar[];
  myCash: number;
  dealershipName: string;
  onBuyCarFromB2B: (car: LocalCar, cost: number, sellerName: string) => void;
  onSellCarToB2B: (carUid: number) => void;
  onFlash: (msg: string) => void;
  onOpenAccounts?: () => void;
}

export const MultiplayerB2BView: React.FC<MultiplayerB2BViewProps> = ({
  myCars,
  myCash,
  dealershipName,
  onBuyCarFromB2B,
  onSellCarToB2B,
  onFlash,
  onOpenAccounts,
}) => {
  const [b2bOffers, setB2bOffers] = useState<CloudB2BOffer[]>([]);
  const [dealers, setDealers] = useState<CloudUserProfile[]>([]);
  const [chatMessages, setChatMessages] = useState<CloudChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedCarUid, setSelectedCarUid] = useState<string>('');
  const [askingPriceInput, setAskingPriceInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'market' | 'lobby' | 'chat'>('market');
  const [isPublishing, setIsPublishing] = useState(false);

  // Subscribe to real-time Firestore feeds
  useEffect(() => {
    const unsubOffers = subscribeToB2BOffers((offers) => {
      setB2bOffers(offers);
    });

    const unsubDealers = subscribeToOnlineDealers((dealerList) => {
      setDealers(dealerList);
    });

    const unsubChat = subscribeToLiveChat((msgs) => {
      setChatMessages(msgs);
    });

    return () => {
      unsubOffers();
      unsubDealers();
      unsubChat();
    };
  }, []);

  const handleListCarForB2B = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      onFlash('Sign in with Google in Accounts to post B2B listings!');
      return;
    }

    const numericUid = parseInt(selectedCarUid, 10);
    const carToSell = myCars.find((c) => c.uid === numericUid);
    const price = parseFloat(askingPriceInput);

    if (!carToSell) {
      onFlash('Select a vehicle from your garage to list.');
      return;
    }
    if (isNaN(price) || price <= 0) {
      onFlash('Enter a valid asking price.');
      return;
    }

    const cat = CAT[carToSell.cid];
    const carTitle = `${cat.year} ${cat.make} ${cat.model}`;

    const newOffer: CloudB2BOffer = {
      id: `offer_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sellerId: auth.currentUser.uid,
      sellerName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Pro Dealer',
      sellerDealership: dealershipName,
      carTitle,
      make: cat.make,
      model: cat.model,
      year: cat.year,
      mileage: carToSell.km,
      condition: Math.max(10, 100 - carToSell.rust * 20),
      askingPrice: price,
      carData: JSON.stringify(carToSell),
      status: 'active',
      createdAt: Date.now(),
    };

    try {
      setIsPublishing(true);
      await createB2BOfferInFirestore(newOffer);
      onSellCarToB2B(carToSell.uid);
      setSelectedCarUid('');
      setAskingPriceInput('');
      sound.playDeal();
      onFlash(`Listed ${carTitle} on B2B Wholesale Market for ${fmt(price)}!`);
    } catch (err) {
      onFlash('Failed to list vehicle to B2B network.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleBuyOffer = async (offer: CloudB2BOffer) => {
    if (!auth.currentUser) {
      onFlash('Sign in with Google in Accounts to purchase B2B offers!');
      return;
    }

    if (offer.askingPrice > myCash) {
      onFlash('Insufficient cash to purchase this B2B wholesale vehicle.');
      return;
    }

    try {
      let carDataObj: LocalCar;
      try {
        carDataObj = JSON.parse(offer.carData);
        carDataObj.uid = Date.now();
      } catch (e) {
        onFlash('Corrupted vehicle data format.');
        return;
      }

      await buyB2BOfferInFirestore(offer.id, auth.currentUser.uid);
      onBuyCarFromB2B(carDataObj, offer.askingPrice, offer.sellerName);
      sound.playCash();
      onFlash(`Acquired ${offer.carTitle} from ${offer.sellerName} for ${fmt(offer.askingPrice)}!`);
    } catch (err) {
      onFlash('This listing was already claimed or cancelled.');
    }
  };

  const handleCancelOffer = async (offerId: string) => {
    try {
      await cancelB2BOfferInFirestore(offerId);
      onFlash('B2B listing cancelled.');
    } catch (err) {
      onFlash('Failed to cancel offer.');
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    if (!auth.currentUser) {
      onFlash('Sign in with Google in Accounts to chat live!');
      return;
    }

    const msgObj: CloudChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      senderId: auth.currentUser.uid,
      senderName: auth.currentUser.displayName || 'Dealer',
      dealershipName,
      message: newMessage.trim(),
      createdAt: Date.now(),
    };

    try {
      await sendLiveChatMessage(msgObj);
      setNewMessage('');
    } catch (e) {
      onFlash('Failed to send message.');
    }
  };

  const activeListings = b2bOffers.filter((o) => o.status === 'active');

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Network Header */}
      <div className="liquid-glass border border-slate-200/80 dark:border-slate-700/50 rounded-3xl p-6 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-6 h-6 text-blue-500 animate-pulse" />
            <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white">
              Real-Time B2B Wholesale Market &amp; Live Lobby
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
              Firestore Live Sync
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Trade cars directly with other players across the globe, view online dealerships, and negotiate wholesale flips in real time.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-2xl liquid-glass-input">
          <button
            onClick={() => setActiveTab('market')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'market'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>B2B Market ({activeListings.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('lobby')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'lobby'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Live Dealers ({dealers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Global Chat ({chatMessages.length})</span>
          </button>
        </div>
      </div>

      {/* Tab 1: B2B Wholesale Market */}
      {activeTab === 'market' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Post a B2B Wholesale Listing */}
          <div className="lg:col-span-1 space-y-4">
            <div className="liquid-glass border border-slate-200/80 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <Tag className="w-5 h-5 text-emerald-500" />
                <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                  Post Garage Car to B2B Market
                </h3>
              </div>

              {!auth.currentUser ? (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs space-y-2.5">
                  <p className="font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Google Sign-In Required</span>
                  </p>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                    Sign in with Google to post cars to the live multiplayer B2B network and sync transactions to Firestore.
                  </p>
                  {onOpenAccounts && (
                    <button
                      type="button"
                      onClick={onOpenAccounts}
                      className="w-full py-2 px-3 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold rounded-lg text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
                    >
                      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                      <span>Sign In with Google</span>
                    </button>
                  )}
                </div>
              ) : myCars.length === 0 ? (
                <div className="text-xs text-slate-400 italic py-4 text-center">
                  Your garage is empty. Acquire cars from the Market tab to list them B2B!
                </div>
              ) : (
                <form onSubmit={handleListCarForB2B} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                      Select Vehicle to Sell
                    </label>
                    <select
                      value={selectedCarUid}
                      onChange={(e) => setSelectedCarUid(e.target.value)}
                      className="w-full text-xs px-3 py-2 liquid-glass-input rounded-xl text-slate-900 dark:text-white"
                    >
                      <option value="">-- Choose Car --</option>
                      {myCars.map((c) => {
                        const cat = CAT[c.cid];
                        return (
                          <option key={c.uid} value={c.uid}>
                            {cat.year} {cat.make} {cat.model} (Basis: {fmt(c.basis)})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                      B2B Wholesale Asking Price ($)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 15500"
                      value={askingPriceInput}
                      onChange={(e) => setAskingPriceInput(e.target.value)}
                      className="w-full text-xs px-3 py-2 liquid-glass-input rounded-xl font-mono text-slate-900 dark:text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isPublishing}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isPublishing ? 'Publishing...' : 'Publish to B2B Market'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Right Column: Live Listings */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Live Wholesale Listings from Online Dealers
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Your Cash: <b className="text-emerald-500">{fmt(myCash)}</b>
              </span>
            </div>

            {activeListings.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400 liquid-glass rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
                No active B2B wholesale listings yet. Be the first player to post a car above!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeListings.map((offer) => {
                  let carDataObj: LocalCar | null = null;
                  try {
                    carDataObj = JSON.parse(offer.carData);
                  } catch (e) {}

                  const isMyOffer = auth.currentUser?.uid === offer.sellerId;

                  return (
                    <div
                      key={offer.id}
                      className="liquid-glass rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/50 shadow-xs flex flex-col justify-between gap-3"
                    >
                      <div>
                        {/* Seller header */}
                        <div className="flex items-center justify-between text-xs mb-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                          <div className="flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                            <span className="font-bold text-slate-900 dark:text-white">
                              {offer.sellerName}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">
                            {offer.sellerDealership || 'Independent Dealer'}
                          </span>
                        </div>

                        {/* Car Photo */}
                        {carDataObj && (
                          <div className="h-32 rounded-xl overflow-hidden mb-3">
                            <CarPhotoCard car={carDataObj} className="w-full h-full border-0" />
                          </div>
                        )}

                        <div className="font-bold text-sm text-slate-900 dark:text-white">
                          {offer.carTitle}
                        </div>
                        <div className="text-xs font-mono text-slate-500 mt-0.5">
                          {offer.mileage?.toLocaleString()} km · Condition: {offer.condition}%
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                        <div>
                          <span className="text-[10px] font-mono uppercase text-slate-400 block">
                            Asking Price
                          </span>
                          <span className="font-bold font-mono text-base text-emerald-600 dark:text-emerald-400">
                            {fmt(offer.askingPrice)}
                          </span>
                        </div>

                        {isMyOffer ? (
                          <button
                            onClick={() => handleCancelOffer(offer.id)}
                            className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold cursor-pointer"
                          >
                            Cancel Listing
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBuyOffer(offer)}
                            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer"
                          >
                            Buy Wholesale
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Live Dealers Lobby */}
      {activeTab === 'lobby' && (
        <div className="liquid-glass border border-slate-200/80 dark:border-slate-700/50 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              <span>Active Network Dealers ({dealers.length})</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Live Cloud Firestore Profiles
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {dealers.map((d) => (
              <div
                key={d.uid}
                className="p-4 rounded-xl liquid-glass-card border border-slate-200/80 dark:border-slate-700/50 flex items-center gap-3"
              >
                <img
                  src={d.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${d.uid}`}
                  alt="Avatar"
                  className="w-12 h-12 rounded-full border border-blue-500/30 bg-slate-800"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                    {d.displayName}
                  </div>
                  <div className="text-[11px] text-blue-600 dark:text-blue-400 truncate">
                    {d.dealershipName}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-1">
                    Net Worth: <b className="text-emerald-500">{fmt(d.netWorth || 0)}</b>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Global Chat */}
      {activeTab === 'chat' && (
        <div className="liquid-glass border border-slate-200/80 dark:border-slate-700/50 rounded-2xl p-6 shadow-sm space-y-4 max-w-3xl mx-auto">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              <span>Global Dealership Chat</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Broadcast messages to all players
            </span>
          </div>

          {/* Message Stream */}
          <div className="h-80 overflow-y-auto space-y-3 p-3 rounded-2xl liquid-glass-input">
            {chatMessages.length === 0 ? (
              <div className="text-xs text-slate-400 italic py-12 text-center">
                No chat messages yet. Send a message below to start the conversation!
              </div>
            ) : (
              chatMessages.map((msg) => {
                const isMe = auth.currentUser?.uid === msg.senderId;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col text-xs ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-0.5 font-mono">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {msg.senderName} ({msg.dealershipName || 'Auto Lot'})
                      </span>
                      <span>·</span>
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div
                      className={`px-3.5 py-2 rounded-2xl max-w-sm ${
                        isMe
                          ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 rounded-tr-none'
                          : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-tl-none'
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Send Input */}
          {auth.currentUser ? (
            <form onSubmit={handleSendChat} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Type a wholesale offer or trade inquiry..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 text-xs px-4 py-2.5 liquid-glass-input rounded-xl text-zinc-900 dark:text-white"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 disabled:opacity-40 text-white dark:text-zinc-950 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </button>
            </form>
          ) : (
            <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 text-xs">
              <span className="text-zinc-500 font-mono">Sign in with Google to send live dealer chat messages.</span>
              {onOpenAccounts && (
                <button
                  type="button"
                  onClick={onOpenAccounts}
                  className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
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
          )}
        </div>
      )}
    </div>
  );
};
