import React from 'react';
import { Store, Shield, Wrench, Car, CreditCard, Award, ShoppingBag, Sparkles, DollarSign, Lock } from 'lucide-react';
import { fmt } from '../game/valuation';
import { sound } from '../game/audio';
import { PURCHASE_PACKS, PurchasePack } from './InGameCheckoutModal';
import { PartnerAdWidget } from './PartnerAdWidget';

interface ShopViewProps {
  ins: boolean;
  monthlyInsurance: number;
  onToggleInsurance: (enable: boolean) => void;
  tools: { obd: boolean; comp: boolean };
  onBuyTool: (tool: string) => void;
  slots: number;
  onRentSpot: () => void;
  creditScore: number;
  debt: number;
  cash: number;
  onBorrowLoan: (amount: number) => void;
  onRepayLoan: () => void;
  hasLicense: boolean;
  onGetLicense: () => void;
  partners: { mech: boolean; det: boolean; flip: boolean };
  onPartner: (key: string) => void;
  netWorth: number;
  onOpenCheckout: (pack: PurchasePack) => void;
  onEarnCash: (amount: number) => void;
  onFlash: (msg: string) => void;
  onOpenAdmin: () => void;
}

export const ShopView: React.FC<ShopViewProps> = ({
  ins,
  monthlyInsurance,
  onToggleInsurance,
  tools,
  onBuyTool,
  slots,
  onRentSpot,
  creditScore,
  debt,
  cash,
  onBorrowLoan,
  onRepayLoan,
  hasLicense,
  onGetLicense,
  partners,
  onPartner,
  netWorth,
  onOpenCheckout,
  onEarnCash,
  onFlash,
  onOpenAdmin,
}) => {
  const loanLimit =
    creditScore >= 760 ? 10000 : creditScore >= 700 ? 5000 : creditScore >= 650 ? 2500 : creditScore >= 625 ? 1000 : creditScore >= 610 ? 500 : 100;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <Store className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
            <span>Shop &amp; Capital In-Game Store</span>
          </h2>
          <span className="text-xs text-slate-500">
            Equip your business with diagnostic hardware, microtransaction capital boosts, and partner ad rewards.
          </span>
        </div>

        <button
          onClick={() => {
            sound.playClick();
            onOpenAdmin();
          }}
          className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Admin Control Panel (Passcode Required)"
        >
          <Lock className="w-3.5 h-3.5 text-rose-400" />
          <span>Admin Control Panel</span>
        </button>
      </div>

      {/* SECTION: In-Game Purchases & Microtransactions */}
      <div className="bg-zinc-950 text-white rounded-2xl p-5 border border-amber-500/30 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-display font-bold text-base text-white">Dealership In-Game Capital Store</h3>
              <span className="text-xs text-zinc-400 font-mono">Firebase Saved Microtransactions &amp; VIP Passes</span>
            </div>
          </div>
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/40">
            Firestore Billing Enabled
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PURCHASE_PACKS.map((pack) => (
            <div
              key={pack.id}
              className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 text-xs transition-all relative ${
                pack.popular
                  ? 'bg-zinc-900 border-amber-500/60 shadow-lg'
                  : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {pack.badge || 'STORE PACK'}
                  </span>
                  <span className="font-mono font-extrabold text-emerald-400 text-sm">
                    ${pack.priceUSD.toFixed(2)}
                  </span>
                </div>

                <h4 className="font-bold text-white text-sm mt-1">{pack.title}</h4>
                <p className="text-zinc-400 text-[11px] mt-1 leading-relaxed">{pack.description}</p>
              </div>

              <button
                onClick={() => {
                  sound.playClick();
                  onOpenCheckout(pack);
                }}
                className="w-full py-2 bg-white hover:bg-zinc-100 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Buy Pack (${pack.priceUSD.toFixed(2)})</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION: Partner Ad Network Widget */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <PartnerAdWidget onEarnCash={onEarnCash} onFlash={onFlash} />
        </div>

        <div className="md:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Commercial Loans */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col justify-between gap-3 text-xs">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <span>Commercial Credit Line</span>
                  </span>
                  <span className="font-mono text-slate-500">
                    Score: <b className="text-slate-900 dark:text-white">{creditScore}</b>
                  </span>
                </div>
                <p className="text-slate-500 mt-1">
                  Current Borrowing Limit: <b className="text-slate-800 dark:text-slate-200 font-mono">{fmt(loanLimit)}</b>. Interest is 2.2%/mo. Current Debt: <b className="text-rose-600 font-mono">{fmt(debt)}</b>
                </p>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => {
                    sound.playCash();
                    onBorrowLoan(500);
                  }}
                  disabled={debt + 500 > loanLimit}
                  className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded font-semibold cursor-pointer"
                >
                  Borrow $500
                </button>
                <button
                  onClick={() => {
                    sound.playCash();
                    onRepayLoan();
                  }}
                  disabled={debt <= 0 || cash <= 0}
                  className="flex-1 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 rounded font-semibold cursor-pointer"
                >
                  Repay Debt
                </button>
              </div>
            </div>

            {/* Parking Lot Expansion */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col justify-between gap-3 text-xs">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Car className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
                    <span>Driveway &amp; Lot Capacity</span>
                  </span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {slots} Spots
                  </span>
                </div>
                <p className="text-slate-500 mt-1">
                  Expand capacity to park and hold more cars simultaneously. Rental costs $150 upfront, then $120/mo per extra spot.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => {
                    sound.playCash();
                    onRentSpot();
                  }}
                  disabled={slots >= 10}
                  className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 disabled:opacity-40 text-white dark:text-zinc-900 rounded font-semibold cursor-pointer shadow-xs transition-colors"
                >
                  Rent Extra Spot ($150)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Insurance */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col justify-between gap-3 text-xs">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
                <span>Commercial Auto Policy</span>
              </span>
              {ins && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
                  Active
                </span>
              )}
            </div>
            <p className="text-slate-500 mt-1">
              Required by law to test drive unplated vehicles and drive purchased cars home from private sellers. {fmt(monthlyInsurance)}/month.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            {ins ? (
              <button
                onClick={() => onToggleInsurance(false)}
                className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-medium cursor-pointer"
              >
                Cancel Policy
              </button>
            ) : (
              <button
                onClick={() => {
                  sound.playCash();
                  onToggleInsurance(true);
                }}
                className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded font-semibold cursor-pointer shadow-xs transition-colors"
              >
                Start Policy ({fmt(monthlyInsurance)})
              </button>
            )}
          </div>
        </div>

        {/* Diagnostic Tools */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-amber-500" />
              <span>Diagnostic Hardware</span>
            </span>
            <p className="text-slate-500 mt-1">
              OBD-II scanner reads hidden check-engine codes. Compression tester reveals internal ring and valve blow-by.
            </p>
          </div>

          <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => {
                sound.playCash();
                onBuyTool('obd');
              }}
              disabled={tools.obd}
              className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-800 dark:text-slate-200 rounded font-semibold cursor-pointer"
            >
              {tools.obd ? 'OBD-II Owned' : 'OBD-II Scanner ($70)'}
            </button>
            <button
              onClick={() => {
                sound.playCash();
                onBuyTool('comp');
              }}
              disabled={tools.comp}
              className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-800 dark:text-slate-200 rounded font-semibold cursor-pointer"
            >
              {tools.comp ? 'Kit Owned' : 'Compression Kit ($120)'}
            </button>
          </div>
        </div>

        {/* Parking Lot Expansion */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col justify-between gap-3 text-xs">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Car className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
                <span>Driveway &amp; Lot Capacity</span>
              </span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                {slots} Spots
              </span>
            </div>
            <p className="text-slate-500 mt-1">
              Expand capacity to park and hold more cars simultaneously. Rental costs $150 upfront, then $120/mo per extra spot.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              onClick={() => {
                sound.playCash();
                onRentSpot();
              }}
              disabled={slots >= 4}
              className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 disabled:opacity-40 text-white dark:text-zinc-900 rounded font-semibold cursor-pointer shadow-xs transition-colors"
            >
              Rent Extra Spot ($150)
            </button>
          </div>
        </div>

        {/* Commercial Loans */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col justify-between gap-3 text-xs">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Commercial Credit Line</span>
              </span>
              <span className="font-mono text-slate-500">
                Score: <b className="text-slate-900 dark:text-white">{creditScore}</b>
              </span>
            </div>
            <p className="text-slate-500 mt-1">
              Current Borrowing Limit: <b className="text-slate-800 dark:text-slate-200 font-mono">{fmt(loanLimit)}</b>. Interest is 2.2%/mo. Current Debt: <b className="text-rose-600 font-mono">{fmt(debt)}</b>
            </p>
          </div>

          <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => {
                sound.playCash();
                onBorrowLoan(500);
              }}
              disabled={debt + 500 > loanLimit}
              className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded font-semibold cursor-pointer"
            >
              Borrow $500
            </button>
            <button
              onClick={() => {
                sound.playCash();
                onRepayLoan();
              }}
              disabled={debt <= 0 || cash <= 0}
              className="flex-1 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 rounded font-semibold cursor-pointer"
            >
              Repay Debt
            </button>
          </div>
        </div>
      </div>

      {/* Dealer Licence */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <span className="font-display font-bold text-base text-slate-900 dark:text-white">
              Official Provincial Dealer Licence &amp; Bond
            </span>
            {hasLicense && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
                Licensed Dealer
              </span>
            )}
          </div>
          <p className="text-slate-500 mt-1 max-w-2xl">
            $3,000 for licensing bond and verified business premises (requires at least 3 parking spots). Removes the 5-car private curbstoning limit, avoids consumer protection agency fines, and boosts buyer trust by 20%.
          </p>
        </div>

        {!hasLicense && (
          <button
            onClick={() => {
              sound.playCash();
              onGetLicense();
            }}
            disabled={slots < 3 || cash < 3000}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white rounded-lg font-semibold shrink-0 cursor-pointer"
          >
            Get Licensed ($3,000)
          </button>
        )}
      </div>
    </div>
  );
};
