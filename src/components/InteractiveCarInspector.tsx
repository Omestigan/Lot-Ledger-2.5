import React, { useState } from 'react';
import {
  X, Wrench, AlertTriangle, ShieldCheck, Cpu, Droplets,
  Activity, CheckCircle2, Search, Zap, Gauge
} from 'lucide-react';
import { Car, Issue } from '../game/types';
import { CAT, RUSTN } from '../game/data';
import { sound } from '../game/audio';

interface InteractiveCarInspectorProps {
  car: Car;
  onClose: () => void;
  onInspectZone: (zone: string) => void;
  hasObdTool: boolean;
}

export const InteractiveCarInspector: React.FC<InteractiveCarInspectorProps> = ({
  car,
  onClose,
  onInspectZone,
  hasObdTool,
}) => {
  const [activeZone, setActiveZone] = useState<string>('engine');
  const catalog = CAT[car.cid];

  const zones = [
    { id: 'engine', label: 'Engine Bay', icon: Activity, desc: 'Valve covers, head gasket, timing belt, fluids' },
    { id: 'suspension', label: 'Suspension & Wheels', icon: Wrench, desc: 'Ball joints, tie rods, struts, wheel bearings' },
    { id: 'brakes', label: 'Braking System', icon: Gauge, desc: 'Rotor thickness, pad life, corroded brake lines' },
    { id: 'body', label: 'Body & Undercarriage', icon: Droplets, desc: 'Rocker rust, subframe corrosion, paint depth' },
    { id: 'cabin', label: 'Cabin & Odometer', icon: Search, desc: 'Pedal wear, flood damage, cluster tampering' },
    { id: 'obd', label: 'OBD-II Diagnostic Port', icon: Cpu, desc: 'Stored trouble codes, readiness monitors' },
  ];

  const getZoneFindings = (zoneId: string) => {
    const K = car.know;
    const findings: { label: string; status: 'ok' | 'issue' | 'sus'; detail: string }[] = [];

    if (zoneId === 'engine') {
      const engIssues = car.issues.filter((i) => i.sys === 'Engine' && !i.fixed);
      if (engIssues.length > 0 && engIssues.some((i) => K.issues[i.id])) {
        engIssues.forEach((i) => {
          if (K.issues[i.id]) {
            findings.push({ label: i.label, status: 'issue', detail: `Severity ${i.sev}/3. Estimated parts: $${i.lo} - $${i.hi}` });
          }
        });
      } else {
        findings.push({ label: 'Oil Level & Color', status: 'ok', detail: 'Clean oil level on dipstick; no foaming.' });
        findings.push({ label: 'Belt Condition', status: 'ok', detail: 'Drive belts supple with no deep cracking.' });
      }
    } else if (zoneId === 'suspension') {
      const suspIssues = car.issues.filter((i) => i.sys === 'Suspension' && !i.fixed);
      if (suspIssues.some((i) => K.issues[i.id])) {
        suspIssues.forEach((i) => {
          if (K.issues[i.id]) {
            findings.push({ label: i.label, status: 'issue', detail: `Requires replacement. Estimated parts: $${i.lo} - $${i.hi}` });
          }
        });
      } else {
        findings.push({ label: 'Struts & Bushings', status: 'ok', detail: 'No hydraulic dampening leakage.' });
        findings.push({ label: 'Ball Joints & Tie Rods', status: 'ok', detail: 'Zero vertical play in wheel assembly.' });
      }
    } else if (zoneId === 'brakes') {
      const brkIssues = car.issues.filter((i) => i.sys === 'Brakes' && !i.fixed);
      if (brkIssues.some((i) => K.issues[i.id])) {
        brkIssues.forEach((i) => {
          if (K.issues[i.id]) {
            findings.push({ label: i.label, status: 'issue', detail: `Critical safety system. Parts: $${i.lo} - $${i.hi}` });
          }
        });
      } else {
        findings.push({ label: 'Rotor Condition', status: 'ok', detail: 'Smooth braking surfaces without grooving.' });
        findings.push({ label: 'Brake Lines', status: 'ok', detail: 'Hard lines free of heavy flaky rust.' });
      }
    } else if (zoneId === 'body') {
      if (K.rust != null) {
        findings.push({
          label: `Underbody Rust: ${RUSTN[K.rust]}`,
          status: K.rust >= 3 ? 'issue' : K.rust >= 1 ? 'sus' : 'ok',
          detail: K.rust >= 3 ? 'Rocker panels compromised; inspection failure risk.' : 'Surface coating intact.',
        });
      }
      if (K.accident) {
        findings.push({ label: 'Uneven Panel Gaps & Overspray', status: 'sus', detail: 'Indicates prior collision bodywork.' });
      } else {
        findings.push({ label: 'Paint Thickness & Gaps', status: 'ok', detail: 'Consistent panel seams throughout.' });
      }
    } else if (zoneId === 'cabin') {
      if (K.odoSus || K.odo) {
        findings.push({ label: 'Odometer Rollback Detected', status: 'issue', detail: `Heavy bolster and pedal wear does not match ${car.shown.toLocaleString()} km.` });
      } else {
        findings.push({ label: 'Odometer Legitimacy', status: 'ok', detail: 'Cluster wear matches recorded mileage.' });
      }
      if (K.water) {
        findings.push({ label: 'Moisture / Flood Damage', status: 'issue', detail: 'Damp undercarpet smell; fusebox oxidation.' });
      }
    } else if (zoneId === 'obd') {
      if (!hasObdTool) {
        findings.push({ label: 'OBD-II Scanner Required', status: 'sus', detail: 'Purchase an OBD scanner in the Shop to extract ECU diagnostic trouble codes.' });
      } else {
        const obdIssues = car.issues.filter((i) => i.det.obd > 0 && !i.fixed);
        if (obdIssues.some((i) => K.issues[i.id])) {
          obdIssues.forEach((i) => {
            if (K.issues[i.id]) {
              findings.push({ label: `ECU Code: ${i.label}`, status: 'issue', detail: `Stored DTC detected in memory.` });
            }
          });
        } else {
          findings.push({ label: 'ECU Emissions Monitors', status: 'ok', detail: 'All monitors ready; zero pending DTC codes.' });
        }
      }
    }

    return findings;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="liquid-glass rounded-3xl max-w-3xl w-full p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>Interactive Vehicle Diagnostic Bay</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {catalog.year} {catalog.make} {catalog.model} · VIN {car.vin}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Diagnostic Zones Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {zones.map((zone) => {
            const Icon = zone.icon;
            const isSelected = activeZone === zone.id;
            return (
              <button
                key={zone.id}
                onClick={() => {
                  sound.playClick();
                  setActiveZone(zone.id);
                  onInspectZone(zone.id);
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold text-xs flex items-center gap-1.5">
                    <Icon className="w-4 h-4 text-blue-500" />
                    <span>{zone.label}</span>
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                  {zone.desc}
                </span>
              </button>
            );
          })}
        </div>

        {/* Diagnostic Findings for Active Zone */}
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">
            <span className="font-display font-bold text-sm text-slate-900 dark:text-white capitalize">
              {zones.find((z) => z.id === activeZone)?.label} Inspection Report
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Live Reading
            </span>
          </div>

          <div className="space-y-2.5">
            {getZoneFindings(activeZone).map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex items-start gap-3"
              >
                <div className="mt-0.5">
                  {item.status === 'ok' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : item.status === 'issue' ? (
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                  ) : (
                    <Zap className="w-4 h-4 text-amber-500" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {item.label}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded uppercase ${
                        item.status === 'ok'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : item.status === 'issue'
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-[11px]">
                    {item.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white font-medium rounded-lg text-xs cursor-pointer"
          >
            Finish Inspection
          </button>
        </div>
      </div>
    </div>
  );
};
