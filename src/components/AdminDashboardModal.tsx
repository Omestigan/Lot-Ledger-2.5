import React, { useState, useEffect } from 'react';
import {
  X, ShieldCheck, Lock, Database, DollarSign, Users, ShoppingBag,
  MessageSquare, HardDrive, RefreshCw, Eye, CheckCircle2, AlertCircle
} from 'lucide-react';
import {
  CloudPurchase,
  subscribeToPurchases,
  subscribeToOnlineDealers,
  subscribeToB2BOffers,
  subscribeToLiveChat,
  CloudUserProfile,
  CloudB2BOffer,
  CloudChatMessage
} from '../lib/firebase';
import { sound } from '../game/audio';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFlash: (msg: string) => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  onFlash,
}) => {
  const [passwordInput, setPasswordInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState(false);

  // Firestore Database Streams
  const [purchases, setPurchases] = useState<CloudPurchase[]>([]);
  const [dealers, setDealers] = useState<CloudUserProfile[]>([]);
  const [offers, setOffers] = useState<CloudB2BOffer[]>([]);
  const [chatMsgs, setChatMsgs] = useState<CloudChatMessage[]>([]);
  const [activeTab, setActiveTab] = useState<'purchases' | 'users' | 'b2b' | 'chat'>('purchases');

  useEffect(() => {
    if (!isOpen || !isAuthenticated) return;

    const unsubPurchases = subscribeToPurchases((list) => setPurchases(list));
    const unsubDealers = subscribeToOnlineDealers((list) => setDealers(list));
    const unsubOffers = subscribeToB2BOffers((list) => setOffers(list));
    const unsubChat = subscribeToLiveChat((list) => setChatMsgs(list));

    return () => {
      unsubPurchases();
      unsubDealers();
      unsubOffers();
      unsubChat();
    };
  }, [isOpen, isAuthenticated]);

  if (!isOpen) return null;

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.trim() === 'omaroo2011@admin') {
      sound.playCash();
      setIsAuthenticated(true);
      setAuthError(false);
      onFlash('Admin Authentication Granted. Connected to Cloud Firestore!');
    } else {
      sound.playError();
      setAuthError(true);
      onFlash('Invalid Admin Password.');
    }
  };

  const handleClose = () => {
    sound.playClick();
    setPasswordInput('');
    setIsAuthenticated(false);
    setAuthError(false);
    onClose();
  };

  const totalRevenue = purchases.reduce((sum, p) => sum + p.amountUSD, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="liquid-glass rounded-3xl max-w-4xl w-full p-6 shadow-2xl flex flex-col gap-5 max-h-[92vh] overflow-y-auto border border-zinc-200 dark:border-zinc-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-zinc-900 dark:text-white flex items-center gap-2">
                <span>Lot &amp; Ledger Admin Control Panel</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40">
                  ADMIN ONLY
                </span>
              </h2>
              <span className="text-xs text-zinc-500 font-mono">
                Real-time Firebase Firestore database monitor &amp; microtransaction ledger
              </span>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* PASSWORD PROMPT SCREEN */}
        {!isAuthenticated ? (
          <form onSubmit={handleAdminAuth} className="py-8 px-4 max-w-md mx-auto w-full space-y-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400">
              <Lock className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-base text-white">Enter Admin Passcode</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Restricted dashboard access for database inspection and transaction logs.
              </p>
            </div>

            <div className="space-y-2">
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Passcode required"
                className="w-full px-4 py-2.5 bg-black/60 border border-zinc-700 rounded-xl text-center text-sm font-mono text-white focus:outline-hidden focus:border-amber-400"
                autoFocus
              />

              {authError && (
                <div className="text-xs text-rose-400 font-mono flex items-center justify-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Access Denied: Incorrect Admin Password</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-white hover:bg-zinc-100 text-zinc-950 font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-md"
            >
              Authenticate Admin Access
            </button>
          </form>
        ) : (
          /* AUTHENTICATED ADMIN DASHBOARD */
          <div className="space-y-5">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-emerald-500/30">
                <span className="text-zinc-400 text-[10px] block mb-1">TOTAL REVENUE</span>
                <span className="text-xl font-bold text-emerald-400">${totalRevenue.toFixed(2)} USD</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-amber-500/30">
                <span className="text-zinc-400 text-[10px] block mb-1">PURCHASES</span>
                <span className="text-xl font-bold text-amber-400">{purchases.length} Txns</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-400 text-[10px] block mb-1">ONLINE DEALERS</span>
                <span className="text-xl font-bold text-white">{dealers.length} Dealers</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-400 text-[10px] block mb-1">B2B OFFERS</span>
                <span className="text-xl font-bold text-white">{offers.length} Listings</span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 text-xs font-mono">
              <button
                onClick={() => setActiveTab('purchases')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  activeTab === 'purchases'
                    ? 'bg-amber-500 text-zinc-950 shadow-xs'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                Microtransactions ({purchases.length})
              </button>

              <button
                onClick={() => setActiveTab('users')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  activeTab === 'users'
                    ? 'bg-amber-500 text-zinc-950 shadow-xs'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                Users ({dealers.length})
              </button>

              <button
                onClick={() => setActiveTab('b2b')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  activeTab === 'b2b'
                    ? 'bg-amber-500 text-zinc-950 shadow-xs'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                B2B Listings ({offers.length})
              </button>

              <button
                onClick={() => setActiveTab('chat')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  activeTab === 'chat'
                    ? 'bg-amber-500 text-zinc-950 shadow-xs'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                Live Chat ({chatMsgs.length})
              </button>
            </div>

            {/* TAB CONTENT: Microtransactions */}
            {activeTab === 'purchases' && (
              <div className="space-y-2">
                <div className="flex justify-between text-[11px] font-mono text-zinc-400 px-2 uppercase">
                  <span>Order ID &amp; User</span>
                  <span>Pack Purchased</span>
                  <span>Amount &amp; Status</span>
                  <span>Date</span>
                </div>

                {purchases.length === 0 ? (
                  <div className="p-8 text-center text-xs text-zinc-500 font-mono italic rounded-2xl bg-zinc-900/50 border border-zinc-800">
                    No in-game purchases recorded yet in Firestore.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {purchases.map((p) => (
                      <div
                        key={p.id}
                        className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono"
                      >
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                            <span>{p.userName}</span>
                            <span className="text-[10px] text-zinc-500">({p.dealershipName})</span>
                          </div>
                          <div className="text-[10px] text-zinc-400">{p.userEmail || p.userId} · #{p.id}</div>
                        </div>

                        <div className="text-zinc-300 font-semibold">{p.packTitle}</div>

                        <div>
                          <span className="font-bold text-emerald-400">${p.amountUSD.toFixed(2)} USD</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 ml-2 font-bold">
                            {p.status.toUpperCase()}
                          </span>
                        </div>

                        <div className="text-[10px] text-zinc-500">
                          {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: Registered Users */}
            {activeTab === 'users' && (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1 text-xs font-mono">
                {dealers.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 italic rounded-2xl bg-zinc-900/50">
                    No online user profiles loaded.
                  </div>
                ) : (
                  dealers.map((u) => (
                    <div key={u.uid} className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-white">{u.displayName} ({u.dealershipName})</span>
                        <div className="text-[10px] text-zinc-500">{u.email || u.uid}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-emerald-400 font-bold">${u.netWorth?.toLocaleString() || 0}</span>
                        <span className="text-[10px] text-zinc-500 block">
                          Last active: {new Date(u.lastActive).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB CONTENT: B2B Offers */}
            {activeTab === 'b2b' && (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1 text-xs font-mono">
                {offers.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 italic rounded-2xl bg-zinc-900/50">
                    No active B2B wholesale listings.
                  </div>
                ) : (
                  offers.map((o) => (
                    <div key={o.id} className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-white">{o.carTitle}</span>
                        <div className="text-[10px] text-zinc-500">Seller: {o.sellerName} ({o.sellerDealership})</div>
                      </div>
                      <div className="text-right">
                        <span className="text-emerald-400 font-bold">${o.askingPrice?.toLocaleString()}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 ml-2">
                          {o.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB CONTENT: Chat Stream */}
            {activeTab === 'chat' && (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1 text-xs font-mono">
                {chatMsgs.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 italic rounded-2xl bg-zinc-900/50">
                    No chat history.
                  </div>
                ) : (
                  chatMsgs.map((c) => (
                    <div key={c.id} className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-start gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-white">{c.senderName}: </span>
                        <span className="text-zinc-300">{c.message}</span>
                        <span className="text-[10px] text-zinc-500 block mt-0.5">{new Date(c.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
