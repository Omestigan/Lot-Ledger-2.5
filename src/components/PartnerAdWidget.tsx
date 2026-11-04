import React, { useState, useEffect } from 'react';
import { Play, Sparkles, DollarSign, Award, Volume2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { sound } from '../game/audio';

export interface PartnerAd {
  id: string;
  brand: string;
  headline: string;
  description: string;
  rewardCash: number;
  badge: string;
  logoEmoji: string;
}

export const PARTNER_ADS: PartnerAd[] = [
  {
    id: 'ad_castrol',
    brand: 'Castrol GTX EDGE Synthetic',
    headline: 'Ultimate Engine Protection for Flip Vehicles',
    description: 'Keep internal valves & pistons operating smooth. Sponsored reward for verified dealerships.',
    rewardCash: 250,
    badge: 'CASTROL SPONSOR',
    logoEmoji: '🛢️',
  },
  {
    id: 'ad_michelin',
    brand: 'Michelin Pilot Sport 5',
    headline: 'High-Performance Rubber for Auction Flips',
    description: 'Boost buyer inspection scores and test-drive confidence with premium tread.',
    rewardCash: 350,
    badge: 'TIRE SPONSOR',
    logoEmoji: '🛞',
  },
  {
    id: 'ad_progressive',
    brand: 'Commercial Auto Insurance',
    headline: 'Fleet Coverage & Unplated Dealer Transit',
    description: 'Protect your lot from unexpected transport damage and civil liability.',
    rewardCash: 200,
    badge: 'INSURANCE SPONSOR',
    logoEmoji: '🛡️',
  },
  {
    id: 'ad_copart',
    brand: 'Copart Wholesale Salvage & Clean Title',
    headline: 'Direct Dealer Auctions Nationwide',
    description: 'Source thousands of clear-title trade-ins and repairable insurance inventory.',
    rewardCash: 300,
    badge: 'AUCTION NETWORK',
    logoEmoji: '🏷️',
  },
];

interface PartnerAdWidgetProps {
  onEarnCash: (amount: number) => void;
  onFlash: (msg: string) => void;
}

export const PartnerAdWidget: React.FC<PartnerAdWidgetProps> = ({ onEarnCash, onFlash }) => {
  const [currentAdIdx, setCurrentAdIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const ad = PARTNER_ADS[currentAdIdx];

  const handleWatchAd = () => {
    sound.playClick();
    setIsPlaying(true);
    setCountdown(5);
  };

  useEffect(() => {
    let timer: any = null;
    if (isPlaying && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (isPlaying && countdown === 0) {
      sound.playCash();
      setIsPlaying(false);
      onEarnCash(ad.rewardCash);
      onFlash(`Sponsored Partner Bonus Earned: +$${ad.rewardCash.toLocaleString()} Cash!`);
      // Rotate to next ad
      setCurrentAdIdx((prev) => (prev + 1) % PARTNER_ADS.length);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, countdown, ad, onEarnCash, onFlash]);

  return (
    <div className="p-4 rounded-2xl bg-zinc-950/90 border border-amber-500/30 text-white shadow-lg space-y-3 font-sans">
      <div className="flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none">{ad.logoEmoji}</span>
          <div>
            <span className="font-bold text-amber-400 block">{ad.brand}</span>
            <span className="text-[10px] text-zinc-400">{ad.badge}</span>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/40 flex items-center gap-1">
          <DollarSign className="w-3 h-3 text-emerald-400" />
          <span>+${ad.rewardCash} Cash</span>
        </span>
      </div>

      <p className="text-xs text-zinc-300 leading-relaxed font-medium">{ad.headline}</p>
      <p className="text-[11px] text-zinc-400">{ad.description}</p>

      {isPlaying ? (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center space-y-1">
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-300 font-mono">
            <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
            <span>Viewing Partner Spotlight ({countdown}s)</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-amber-400 h-1.5 transition-all duration-1000"
              style={{ width: `${((5 - countdown) / 5) * 100}%` }}
            />
          </div>
        </div>
      ) : (
        <button
          onClick={handleWatchAd}
          className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Watch Sponsored Spotlight (+${ad.rewardCash})</span>
        </button>
      )}
    </div>
  );
};
