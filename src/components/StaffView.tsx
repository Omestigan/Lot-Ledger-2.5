import React, { useState } from 'react';
import {
  Briefcase, UserCheck, Wrench, Sparkles, AlertCircle, Trash2,
  Users, DollarSign, TrendingUp, ShieldCheck, Skull, Compass, RefreshCw, CheckCircle2
} from 'lucide-react';
import { fmt } from '../game/valuation';
import { sound } from '../game/audio';
import { WorldLocation } from '../game/locations';

export interface StaffMember {
  id: number;
  name: string;
  role: 'scout' | 'mechanic' | 'legal' | 'underground' | 'closer' | 'executive';
  roleLabel: string;
  contract: 'hourly' | 'commission' | 'retainer';
  wage: number;
  commissionRate?: number;
  skill: number;
  experience: number;
  trait: string;
  perkDescription: string;
  morale: number;
  jobs: number;
  referredBy?: string;
}

interface StaffViewProps {
  staff: StaffMember[];
  pool: StaffMember[];
  onHire: (candidate: StaffMember, contractType: string) => void;
  onFire: (employeeId: number) => void;
  onInterview: (candidateId: number) => void;
  autoRepair: boolean;
  onToggleAutoRepair: () => void;
  maxStaff: number;
  location?: WorldLocation;
  connections?: any[];
  onAddCandidatesToPool?: (newCandidates: StaffMember[]) => void;
  onFlash?: (msg: string) => void;
}

const ROLE_ICONS: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  scout: { icon: Compass, color: 'text-cyan-500', bg: 'bg-cyan-500/10 border-cyan-500/20' },
  mechanic: { icon: Wrench, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20' },
  legal: { icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  underground: { icon: Skull, color: 'text-purple-500', bg: 'bg-purple-500/10 border-purple-500/20' },
  closer: { icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
  executive: { icon: Briefcase, color: 'text-rose-500', bg: 'bg-rose-500/10 border-rose-500/20' },
};

export const StaffView: React.FC<StaffViewProps> = ({
  staff,
  pool,
  onHire,
  onFire,
  onInterview,
  autoRepair,
  onToggleAutoRepair,
  maxStaff,
  location,
  connections = [],
  onAddCandidatesToPool,
  onFlash = () => {},
}) => {
  const [generating, setGenerating] = useState(false);

  const handleGenerateGeminiStaff = async () => {
    setGenerating(true);
    sound.playClick();
    try {
      const res = await fetch('/api/ai/generate-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location,
          connections: connections.slice(0, 4),
          count: 3,
        }),
      });

      const data = await res.json();
      if (data && data.candidates && data.candidates.length > 0) {
        if (onAddCandidatesToPool) {
          onAddCandidatesToPool(data.candidates);
        }
        onFlash(`Dmitri & your network scouted ${data.candidates.length} new candidates!`);
      }
    } catch (e) {
      console.error('Error generating staff:', e);
      onFlash('Recruitment dispatch completed with local candidates.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="liquid-glass border border-slate-200/80 dark:border-slate-700/60 rounded-3xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4 floating-panel">
        <div>
          <h2 className="font-display font-black text-2xl text-slate-900 dark:text-white flex items-center gap-2.5">
            <Briefcase className="w-6 h-6 text-zinc-900 dark:text-zinc-100" />
            <span>Dealership Staff &amp; Contractors</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Assemble a specialized team of scouts, diagnostic mechanics, legal experts, shadow brokers, sales closers, and executives.
          </p>
          <div className="mt-2 text-xs font-mono text-slate-600 dark:text-slate-300">
            Active Team: <b className="text-zinc-900 dark:text-zinc-100 font-bold">{staff.length}</b> of <b>{maxStaff}</b> capacity
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onToggleAutoRepair}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              autoRepair
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'liquid-glass-button text-slate-600 dark:text-slate-300'
            }`}
          >
            Mechanic Auto-Repairs: {autoRepair ? 'ENABLED' : 'OFF'}
          </button>

          <button
            onClick={handleGenerateGeminiStaff}
            disabled={generating}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-xs transition-colors disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${generating ? 'animate-spin text-amber-400' : 'text-amber-400'}`} />
            <span>{generating ? 'Scouting Network...' : 'Recruit Staff via Dmitri & Network'}</span>
          </button>
        </div>
      </div>

      {/* Active Staff Roster */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
            Your Active Dealership Team
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            Monthly Payroll: {fmt(staff.reduce((sum, e) => sum + (e.wage || 0), 0))}/mo
          </span>
        </div>

        {staff.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400 liquid-glass rounded-3xl border border-dashed border-slate-300 dark:border-slate-800">
            You operate solo. Recruit scouts to find hidden auction deals, mechanics to slash repair costs, or closers to boost retail sales markup!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {staff.map((emp) => {
              const roleMeta = ROLE_ICONS[emp.role] || ROLE_ICONS.mechanic;
              const Icon = roleMeta.icon;

              return (
                <div
                  key={emp.id}
                  className="liquid-glass-card rounded-2xl p-4.5 flex flex-col justify-between gap-3 text-xs border border-slate-200/60 dark:border-slate-700/60"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-xl border ${roleMeta.bg}`}>
                          <Icon className={`w-4 h-4 ${roleMeta.color}`} />
                        </div>
                        <div>
                          <span className="font-bold text-sm text-slate-900 dark:text-white block">
                            {emp.name}
                          </span>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                            {emp.roleLabel || emp.role}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 uppercase font-semibold">
                        {emp.contract}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 mt-2 italic">
                      "{emp.trait}"
                    </p>

                    <div className="mt-2.5 p-2 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                      <div className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span>{emp.perkDescription || 'Active dealership operational perk'}</span>
                      </div>
                      <div className="flex justify-between font-mono pt-1 text-[10px] text-slate-500">
                        <span>Skill: <b>{emp.skill}/10</b></span>
                        <span>Experience: <b>{emp.experience} yrs</b></span>
                        <span>Morale: <b>{emp.morale || 80}%</b></span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {emp.contract === 'commission' ? `${(emp.commissionRate ? emp.commissionRate * 100 : 8).toFixed(1)}% rev cut` : `${fmt(emp.wage)}/mo`}
                    </span>

                    <button
                      onClick={() => onFire(emp.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                      title="Terminate Contract"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Candidate Pool */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
            Available Candidates &amp; Contractors
          </h3>
          <span className="text-xs text-slate-400">
            {pool.length} applicant(s) waiting
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pool.map((cand) => {
            const roleMeta = ROLE_ICONS[cand.role] || ROLE_ICONS.mechanic;
            const Icon = roleMeta.icon;

            return (
              <div
                key={cand.id}
                className="liquid-glass-card rounded-2xl p-4.5 flex flex-col justify-between gap-3 text-xs border border-slate-200/60 dark:border-slate-700/60"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-xl border ${roleMeta.bg}`}>
                        <Icon className={`w-4 h-4 ${roleMeta.color}`} />
                      </div>
                      <div>
                        <span className="font-bold text-sm text-slate-900 dark:text-white block">
                          {cand.name}
                        </span>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                          {cand.roleLabel || cand.role}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize">
                      {cand.contract}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 mt-2 italic">
                    "{cand.trait}"
                  </p>

                  {cand.referredBy && (
                    <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 block mt-1">
                      Referred by: <b>{cand.referredBy}</b>
                    </span>
                  )}

                  <div className="mt-2.5 p-2 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                    <span className="text-blue-600 dark:text-blue-400 block font-medium">
                      {cand.perkDescription}
                    </span>
                    <div className="flex justify-between font-mono pt-1 text-[10px] text-slate-500">
                      <span>Skill: <b>{cand.skill}/10</b></span>
                      <span>Experience: <b>{cand.experience} yrs</b></span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2">
                  <div className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                    {cand.contract === 'commission'
                      ? `${(cand.commissionRate ? cand.commissionRate * 100 : 8).toFixed(1)}% cut`
                      : `${fmt(cand.wage)}/mo`}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onInterview(cand.id)}
                      className="px-2.5 py-1.5 liquid-glass-button rounded-lg text-[11px] font-semibold cursor-pointer"
                    >
                      Interview ($40)
                    </button>

                    <button
                      onClick={() => {
                        sound.playCash();
                        onHire(cand, cand.contract);
                      }}
                      disabled={staff.length >= maxStaff}
                      className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 disabled:opacity-50 font-bold rounded-lg text-[11px] cursor-pointer shadow-xs transition-colors"
                    >
                      Hire
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
