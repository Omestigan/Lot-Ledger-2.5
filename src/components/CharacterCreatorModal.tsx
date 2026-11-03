import React, { useState } from 'react';
import {
  X, MapPin, Sparkles, Check, ArrowRight, ShieldAlert,
  DollarSign, Wrench, Briefcase, FileText, Users, Award
} from 'lucide-react';
import { GameMode, PlayerCharacter, RegionId } from '../game/types';
import { BACKGROUNDS, REGIONS } from '../game/data';
import { sound } from '../game/audio';

import { WorldLocation, PRESET_WORLD_CITIES } from '../game/locations';

interface CharacterCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmStart: (region: RegionId, mode: GameMode, player: PlayerCharacter, location?: WorldLocation) => void;
  initialRegion?: RegionId;
  initialMode?: GameMode;
  initialPlayer?: PlayerCharacter;
  initialLocation?: WorldLocation;
}

const SKIN_TONES = ['#f1d3b8', '#e0b48f', '#bf8d63', '#8c5a3a', '#5e3a24'];
const HAIR_COLORS = ['#16120e', '#4a2e1b', '#8a5a2b', '#c9a15a', '#b8b8b8', '#a03a24'];
const SHIRT_COLORS = ['#1d5fa6', '#b4561c', '#1f7a4d', '#6b2a35', '#3a4750', '#b59a5a'];

export const CharacterCreatorModal: React.FC<CharacterCreatorModalProps> = ({
  isOpen,
  onClose,
  onConfirmStart,
  initialRegion = 'qc',
  initialMode = 'free',
  initialPlayer,
  initialLocation,
}) => {
  const [selectedLocation, setSelectedLocation] = useState<WorldLocation>(initialLocation || PRESET_WORLD_CITIES[0]);
  const [region, setRegion] = useState<RegionId>(initialRegion);
  const [mode, setMode] = useState<GameMode>(initialMode);
  const [name, setName] = useState(initialPlayer?.name || 'Alex');
  const [skin, setSkin] = useState(initialPlayer?.skin || 1);
  const [hair, setHair] = useState(initialPlayer?.hair || 1);
  const [style, setStyle] = useState(initialPlayer?.style || 0);
  const [shirt, setShirt] = useState(initialPlayer?.shirt || 0);
  const [bg, setBg] = useState<'none' | 'wrench' | 'sales' | 'clerk' | 'social' | 'auction'>(
    (initialPlayer?.bg as any) || 'none'
  );

  if (!isOpen) return null;

  const currentRegion = REGIONS[region] || REGIONS.qc;

  const handleStart = () => {
    sound.playCash();
    const playerChar: PlayerCharacter = {
      name: name.trim() || 'Alex',
      skin,
      hair,
      style,
      shirt,
      bg,
    };
    onConfirmStart(region, mode, playerChar, selectedLocation);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="liquid-glass rounded-3xl max-w-4xl w-full p-6 shadow-2xl flex flex-col gap-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <span>Start New Journey: Character &amp; Market Setup</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Customize your flipper persona, background advantages, starting region, and rules.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Character & Background */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Visual Avatar Customizer */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-4">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 block">
              Persona &amp; Appearance
            </span>

            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={24}
                className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
              />
            </div>

            {/* Skin Tone Swatches */}
            <div>
              <span className="text-[11px] text-slate-500 block mb-1.5">Skin Tone</span>
              <div className="flex gap-2">
                {SKIN_TONES.map((color, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSkin(idx)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                      skin === idx ? 'border-blue-600 scale-110 shadow-xs' : 'border-white/80'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Hair Color Swatches */}
            <div>
              <span className="text-[11px] text-slate-500 block mb-1.5">Hair Color</span>
              <div className="flex gap-2">
                {HAIR_COLORS.map((color, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setHair(idx)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                      hair === idx ? 'border-blue-600 scale-110 shadow-xs' : 'border-white/80'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Hair Style */}
            <div>
              <span className="text-[11px] text-slate-500 block mb-1.5">Hairstyle</span>
              <div className="grid grid-cols-4 gap-1.5">
                {['Short', 'Cropped', 'Long', 'Cap'].map((lbl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setStyle(idx)}
                    className={`py-1.5 px-2 text-xs rounded-md border font-medium transition-colors cursor-pointer ${
                      style === idx
                        ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-semibold'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Background Perks Selection */}
          <div className="space-y-3">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 block">
              Starting Career Background
            </span>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {Object.keys(BACKGROUNDS).map((key) => {
                const b = BACKGROUNDS[key];
                const isSelected = bg === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setBg(key as any)}
                    className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{b.n}</span>
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      {b.d}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 2: Regional Market Setup */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 block">
            Select Starting Province / State
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
            {Object.keys(REGIONS).map((regKey) => {
              const r = REGIONS[regKey];
              const isSelected = region === regKey;
              return (
                <button
                  key={regKey}
                  type="button"
                  onClick={() => setRegion(regKey as RegionId)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'
                  }`}
                >
                  <span className="font-bold text-xs text-slate-900 dark:text-white">
                    {r.name.split(',')[0]}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono mt-1">
                    {(r.priv * 100).toFixed(1)}% Tax
                  </span>
                </button>
              );
            })}
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-xs flex flex-wrap items-center justify-between gap-3 font-mono">
            <div>
              <span className="text-slate-500">Registry:</span>{' '}
              <b className="text-slate-800 dark:text-slate-200">{currentRegion.auth}</b>
            </div>
            <div>
              <span className="text-slate-500">Sales Tax:</span>{' '}
              <b className="text-slate-800 dark:text-slate-200">{currentRegion.taxN} ({(currentRegion.priv * 100).toFixed(2)}%)</b>
            </div>
            <div>
              <span className="text-slate-500">Rust Index:</span>{' '}
              <b className="text-slate-800 dark:text-slate-200">{currentRegion.rust >= 1 ? 'Heavy' : currentRegion.rust >= 0.6 ? 'Moderate' : 'Low'}</b>
            </div>
            <div>
              <span className="text-slate-500">Winter Laws:</span>{' '}
              <b className="text-slate-800 dark:text-slate-200">{currentRegion.win === 'law' ? 'Mandatory' : 'Optional'}</b>
            </div>
          </div>
        </div>

        {/* Section 3: Game Mode */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 block">
            Game Mode
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'free', label: 'Free Play', desc: 'No time limit. Build your automotive network at your own pace.' },
              { id: 'twelve', label: '12-Month Challenge', desc: 'Turn $2,000 into $20,000 net worth within 365 days.' },
              { id: 'iron', label: 'Ironman Mode', desc: 'High stakes: a single bankruptcy liquidates your empire permanently.' },
            ].map((m) => {
              const isSelected = mode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id as GameMode)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'
                  }`}
                >
                  <span className="font-semibold text-xs text-slate-900 dark:text-white block">
                    {m.label}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block leading-relaxed">
                    {m.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Confirmation */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            Cancel
          </button>

          <button
            onClick={handleStart}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs shadow-md transition-colors flex items-center gap-2 cursor-pointer"
          >
            <span>Begin Venture in {currentRegion.name.split(',')[0]}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
