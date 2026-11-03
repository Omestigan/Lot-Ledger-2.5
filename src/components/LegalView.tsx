import React from 'react';
import { Scale, ShieldAlert, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import { fmt } from '../game/valuation';
import { sound } from '../game/audio';

interface LegalViewProps {
  suits: any[];
  rep: number;
  onSettle: (suitId: number) => void;
  onDefend: (suitId: number) => void;
  onHireCounsel: (suitId: number, counselType: string) => void;
}

export const LegalView: React.FC<LegalViewProps> = ({
  suits,
  rep,
  onSettle,
  onDefend,
  onHireCounsel,
}) => {
  const activeSuits = suits.filter((s) => s.stage !== 'closed');
  const closedSuits = suits.filter((s) => s.stage === 'closed');

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-blue-600" />
            <span>Small Claims &amp; Legal Disputes</span>
          </h2>
          <span className="text-xs text-slate-500">
            Reputation Score: <b className="text-slate-800 dark:text-slate-200 font-mono">{rep}/100</b>. Hiding defects or tampering with odometers triggers buyer claims.
          </span>
        </div>
      </div>

      {/* Active Suits */}
      <div>
        <h3 className="font-display font-bold text-base text-slate-900 dark:text-white mb-3">
          Active Legal Actions ({activeSuits.length})
        </h3>

        {activeSuits.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl">
            Clean record! No outstanding civil claims or statutory warranty disputes.
          </div>
        ) : (
          <div className="space-y-3">
            {activeSuits.map((suit) => {
              const isDefendant = suit.role === 'def';
              return (
                <div
                  key={suit.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-sm text-slate-900 dark:text-white block">
                        {suit.title}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        Claimed Amount: <b className="text-slate-900 dark:text-white">{fmt(suit.amt)}</b> · Counsel: {suit.counsel}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-semibold uppercase">
                      {suit.stage}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {suit.counsel === 'self' && (
                      <button
                        onClick={() => onHireCounsel(suit.id, 'para')}
                        className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded font-medium cursor-pointer"
                      >
                        Hire Paralegal ($450)
                      </button>
                    )}
                    <button
                      onClick={() => onSettle(suit.id)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded font-semibold cursor-pointer"
                    >
                      Settle Out of Court
                    </button>
                    <button
                      onClick={() => onDefend(suit.id)}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold cursor-pointer"
                    >
                      Defend at Hearing
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Closed History */}
      {closedSuits.length > 0 && (
        <div>
          <h3 className="font-display font-bold text-sm text-slate-500 mb-2">
            Dispute Archive ({closedSuits.length})
          </h3>
          <div className="space-y-1.5 font-mono text-xs text-slate-500">
            {closedSuits.map((s) => (
              <div key={s.id} className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg flex justify-between">
                <span>{s.title}</span>
                <span>{fmt(s.amt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
