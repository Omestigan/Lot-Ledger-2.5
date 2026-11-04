import React, { useState } from 'react';
import {
  X, ShoppingBag, ShieldCheck, CreditCard, Sparkles, CheckCircle2,
  FileText, ArrowRight, DollarSign, Building, MapPin, Mail, Award, Lock
} from 'lucide-react';
import { CloudPurchase, recordPurchaseInFirestore, auth } from '../lib/firebase';
import { sound } from '../game/audio';

export interface PurchasePack {
  id: string;
  title: string;
  priceUSD: number;
  badge?: string;
  popular?: boolean;
  cashBonus?: number;
  extraSlots?: number;
  vipPerks?: string[];
  description: string;
}

export const PURCHASE_PACKS: PurchasePack[] = [
  {
    id: 'pack_starter',
    title: 'Starter Dealer Capital',
    priceUSD: 2.99,
    cashBonus: 5000,
    badge: 'FAST START',
    description: 'Inject $5,000 working capital to buy your next flip vehicle.',
  },
  {
    id: 'pack_booster',
    title: 'Tycoon Growth Fund',
    priceUSD: 9.99,
    cashBonus: 25000,
    popular: true,
    badge: 'MOST POPULAR',
    vipPerks: ['Free Commercial Auto Insurance for 30 Days'],
    description: '$25,000 liquidity + 30 days free commercial auto insurance.',
  },
  {
    id: 'pack_empire',
    title: 'Empire Bankroll & Lot Expansion',
    priceUSD: 24.99,
    cashBonus: 75000,
    extraSlots: 3,
    badge: 'LOT EXPANSION',
    vipPerks: ['+3 Parking Lot Spots', 'VIP Verified Dealer Gold Badge'],
    description: '$75,000 capital, +3 parking spots, and VIP Verified status.',
  },
  {
    id: 'pack_mega',
    title: 'Automotive Mogul Package',
    priceUSD: 49.99,
    cashBonus: 200000,
    extraSlots: 5,
    badge: 'BEST VALUE',
    vipPerks: ['+5 Parking Lot Spots', 'Free License & Bond', 'Unlimited Gemini AI Scans'],
    description: '$200,000 capital, +5 parking spots, Provincial License & Bond.',
  },
  {
    id: 'pass_vip_badge',
    title: 'VIP Dealer Gold Network Pass',
    priceUSD: 4.99,
    badge: 'PERMANENT PERK',
    vipPerks: ['Golden VIP Badge in Live Chat & B2B Market', '+10% Sales Price Negotiation Bonus'],
    description: 'Gold VIP Dealer badge across B2B wholesale network + 10% negotiation boost.',
  },
];

interface InGameCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPack: PurchasePack | null;
  dealershipName: string;
  onApplyReward: (pack: PurchasePack) => void;
  onFlash: (msg: string) => void;
}

export const InGameCheckoutModal: React.FC<InGameCheckoutModalProps> = ({
  isOpen,
  onClose,
  selectedPack,
  dealershipName,
  onApplyReward,
  onFlash,
}) => {
  const [step, setStep] = useState<'details' | 'billing' | 'review' | 'receipt'>('details');
  const [billingName, setBillingName] = useState(
    auth.currentUser?.displayName || 'Omar Al-Jubairi'
  );
  const [billingEmail, setBillingEmail] = useState(
    auth.currentUser?.email || 'omaraljubairi54@gmail.com'
  );
  const [businessAddress, setBusinessAddress] = useState('100 Commercial Way, Auto District');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastTxn, setLastTxn] = useState<CloudPurchase | null>(null);

  if (!isOpen || !selectedPack) return null;

  const handleProceedToBilling = () => {
    sound.playClick();
    setStep('billing');
  };

  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    setStep('review');
  };

  const handleAuthorizePurchase = async () => {
    setIsProcessing(true);
    sound.playCash();

    const txnId = `LL-TXN-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const currUser = auth.currentUser;

    const purchaseRecord: CloudPurchase = {
      id: txnId,
      userId: currUser?.uid || `usr_${Date.now()}`,
      userName: billingName.trim() || currUser?.displayName || 'Dealer',
      userEmail: billingEmail.trim() || currUser?.email || 'dealer@lotledger.com',
      dealershipName: dealershipName || `${billingName}'s Motors`,
      packId: selectedPack.id,
      packTitle: selectedPack.title,
      amountUSD: selectedPack.priceUSD,
      rewardDetails: selectedPack.description,
      billingName: billingName.trim(),
      billingAddress: businessAddress.trim(),
      paymentMethodType: 'In-Game Checkout (Direct Settlement)',
      status: 'completed',
      createdAt: Date.now(),
    };

    // Save transaction to Firebase Firestore
    await recordPurchaseInFirestore(purchaseRecord);

    // Grant reward in game engine
    onApplyReward(selectedPack);

    setLastTxn(purchaseRecord);
    setIsProcessing(false);
    setStep('receipt');
    onFlash(`Purchase Complete! ${selectedPack.title} applied to your dealership.`);
  };

  const handleCloseReceipt = () => {
    sound.playClick();
    setStep('details');
    setLastTxn(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="liquid-glass rounded-3xl max-w-xl w-full p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-zinc-900 dark:text-white">
                In-Game Microtransaction Checkout
              </h2>
              <span className="text-xs text-zinc-500 font-mono">
                Official Dealership Billing &amp; Firestore Secured Transaction
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Stepper */}
        <div className="flex items-center justify-between px-2 text-xs font-mono border-b border-zinc-800/60 pb-3">
          <div className={`flex items-center gap-1.5 ${step === 'details' ? 'text-amber-400 font-bold' : 'text-zinc-500'}`}>
            <span>1. Pack</span>
          </div>
          <span className="text-zinc-700">→</span>
          <div className={`flex items-center gap-1.5 ${step === 'billing' ? 'text-amber-400 font-bold' : 'text-zinc-500'}`}>
            <span>2. Billing</span>
          </div>
          <span className="text-zinc-700">→</span>
          <div className={`flex items-center gap-1.5 ${step === 'review' ? 'text-amber-400 font-bold' : 'text-zinc-500'}`}>
            <span>3. Review</span>
          </div>
          <span className="text-zinc-700">→</span>
          <div className={`flex items-center gap-1.5 ${step === 'receipt' ? 'text-emerald-400 font-bold' : 'text-zinc-500'}`}>
            <span>4. Receipt</span>
          </div>
        </div>

        {/* STEP 1: Pack Overview */}
        {step === 'details' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">
                    {selectedPack.badge || 'PACK ITEM'}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-0.5">{selectedPack.title}</h3>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-emerald-400 font-mono">
                    ${selectedPack.priceUSD.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-zinc-500 block">USD One-Time</span>
                </div>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">{selectedPack.description}</p>

              <div className="pt-3 border-t border-zinc-800 space-y-1.5 text-xs text-zinc-300">
                {selectedPack.cashBonus && (
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <DollarSign className="w-4 h-4" />
                    <span>In-Game Cash Bonus: +${selectedPack.cashBonus.toLocaleString()}</span>
                  </div>
                )}
                {selectedPack.extraSlots && (
                  <div className="flex items-center gap-2 text-amber-300 font-semibold">
                    <Building className="w-4 h-4" />
                    <span>Lot Capacity: +{selectedPack.extraSlots} Parking Spots</span>
                  </div>
                )}
                {selectedPack.vipPerks?.map((perk, i) => (
                  <div key={i} className="flex items-center gap-2 text-zinc-200">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{perk}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleProceedToBilling}
              className="w-full py-3 bg-white hover:bg-zinc-100 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
            >
              <span>Proceed to Billing Details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: Billing Info */}
        {step === 'billing' && (
          <form onSubmit={handleProceedToReview} className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
              <span className="font-bold text-white block">Dealership &amp; Billing Information</span>

              <div>
                <label className="text-[10px] font-mono text-zinc-400 block mb-1">Billing Name</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-black/60 border border-zinc-700 rounded-xl text-white">
                  <Building className="w-4 h-4 text-zinc-400 shrink-0" />
                  <input
                    type="text"
                    value={billingName}
                    onChange={(e) => setBillingName(e.target.value)}
                    className="w-full bg-transparent focus:outline-hidden font-medium text-xs text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-400 block mb-1">Receipt Email</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-black/60 border border-zinc-700 rounded-xl text-white">
                  <Mail className="w-4 h-4 text-zinc-400 shrink-0" />
                  <input
                    type="email"
                    value={billingEmail}
                    onChange={(e) => setBillingEmail(e.target.value)}
                    className="w-full bg-transparent focus:outline-hidden font-mono text-xs text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-400 block mb-1">Dealership Commercial Address</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-black/60 border border-zinc-700 rounded-xl text-white">
                  <MapPin className="w-4 h-4 text-zinc-400 shrink-0" />
                  <input
                    type="text"
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    className="w-full bg-transparent focus:outline-hidden text-xs text-white"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep('details')}
                className="py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-semibold cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-white hover:bg-zinc-100 text-zinc-950 font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
              >
                <span>Review Order Summary</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Order Review */}
        {step === 'review' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3 font-mono">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2 text-zinc-400">
                <span>ITEM</span>
                <span>AMOUNT</span>
              </div>
              <div className="flex items-center justify-between text-white font-bold">
                <span>{selectedPack.title}</span>
                <span className="text-emerald-400">${selectedPack.priceUSD.toFixed(2)} USD</span>
              </div>
              <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                <span>Taxes &amp; Processing Fees</span>
                <span>$0.00</span>
              </div>
              <div className="flex items-center justify-between border-t border-zinc-800 pt-2 text-sm text-white font-bold">
                <span>Total Due</span>
                <span className="text-emerald-400 font-mono text-base">${selectedPack.priceUSD.toFixed(2)} USD</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-300 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Instant In-Game Settlement</span>
              </div>
              <p className="text-[11px] text-emerald-200/90">
                Order will be saved to your Firebase user profile and instantly reflected in your dealership balance.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep('billing')}
                className="py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-semibold cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={handleAuthorizePurchase}
                disabled={isProcessing}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all active:scale-95 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isProcessing ? 'Processing Order...' : `Authorize & Complete ($${selectedPack.priceUSD.toFixed(2)})`}</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Official Invoice & Receipt */}
        {step === 'receipt' && lastTxn && (
          <div className="space-y-4 text-xs">
            <div className="p-5 rounded-2xl bg-zinc-950 border border-emerald-500/40 text-white space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="font-bold text-sm text-emerald-400">Transaction Approved</h3>
                    <span className="text-[10px] font-mono text-zinc-400">Order #{lastTxn.id}</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/40">
                  Firebase Synced
                </span>
              </div>

              <div className="space-y-1.5 font-mono text-[11px] text-zinc-300">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Billed To:</span>
                  <span className="font-bold text-white">{lastTxn.userName} ({lastTxn.dealershipName})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Email:</span>
                  <span>{lastTxn.userEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Date:</span>
                  <span>{new Date(lastTxn.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Pack Purchased:</span>
                  <span className="text-amber-300 font-bold">{lastTxn.packTitle}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-zinc-800 pt-2 font-bold text-emerald-400">
                  <span>Total Settled:</span>
                  <span>${lastTxn.amountUSD.toFixed(2)} USD</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleCloseReceipt}
              className="w-full py-3 bg-white hover:bg-zinc-100 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
            >
              <span>Return to Dealership Dashboard</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
