import React, { useState } from 'react';
import { Car } from '../game/types';
import { CAT, RUSTN } from '../game/data';
import { getCarPhoto } from '../game/carImages';
import { AlertTriangle, Wrench, ShieldAlert, Sparkles, Eye } from 'lucide-react';

interface CarPhotoCardProps {
  car: Car;
  className?: string;
  showInspectorButton?: boolean;
  onOpenInspector?: () => void;
  compact?: boolean;
}

export const CarPhotoCard: React.FC<CarPhotoCardProps> = ({
  car,
  className = '',
  showInspectorButton = false,
  onOpenInspector,
  compact = false,
}) => {
  const [imgError, setImgError] = useState(false);
  const [viewMode, setViewMode] = useState<'photo' | 'specs'>('photo');

  const catalogEntry = CAT[car.cid];
  const photoUrl = getCarPhoto(catalogEntry.make, catalogEntry.model, catalogEntry.cls);

  return (
    <div className={`relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-white shadow-xs group ${className}`}>
      {/* View Toggle Pill in top right (hidden in compact thumbnails) */}
      {!compact && (
        <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1 bg-black/60 backdrop-blur-md p-0.5 rounded-lg border border-white/10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setViewMode('photo');
            }}
            className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${
              viewMode === 'photo' ? 'bg-white text-slate-900 font-semibold' : 'text-slate-300 hover:text-white'
            }`}
          >
            Photo
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setViewMode('specs');
            }}
            className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${
              viewMode === 'specs' ? 'bg-white text-slate-900 font-semibold' : 'text-slate-300 hover:text-white'
            }`}
          >
            Specs
          </button>
        </div>
      )}

      {/* Main Visual Frame */}
      <div className="relative h-44 w-full bg-slate-900 overflow-hidden flex items-center justify-center">
        {viewMode === 'photo' && !imgError ? (
          <>
            <img
              src={photoUrl}
              alt={`${catalogEntry.year} ${catalogEntry.make} ${catalogEntry.model}`}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            {/* Scrim Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80" />
          </>
        ) : (
          /* Technical Blueprint / Specs View */
          <div className="w-full h-full bg-gradient-to-br from-zinc-950 via-zinc-900 to-black p-4 flex flex-col justify-between font-mono text-xs border border-zinc-800">
            <div className="flex justify-between items-start text-zinc-300">
              <span className="font-bold text-sm tracking-wide text-zinc-100">CHASSIS SPECIFICATIONS</span>
              <span className="text-[10px] text-zinc-400">VIN: {car.vin.slice(0, 10)}...</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-300">
              <div>
                <span className="text-zinc-500 block text-[10px]">DRIVETRAIN</span>
                <span className="font-semibold text-white">{car.tr} · {catalogEntry.drv}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">ENGINE SPEC</span>
                <span className="font-semibold text-white">{car.eng}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">RUST LEVEL</span>
                <span className={`font-semibold ${car.rust >= 3 ? 'text-rose-400' : 'text-zinc-200'}`}>
                  {RUSTN[car.rust]}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">ODOMETER</span>
                <span className="font-semibold text-white">{car.shown.toLocaleString()} km</span>
              </div>
            </div>
            <div className="text-[10px] text-zinc-400 border-t border-zinc-800 pt-1">
              Factory Curb Weight: {catalogEntry.cls.toUpperCase()} · Reliability Rating: {(catalogEntry.rel * 100).toFixed(0)}%
            </div>
          </div>
        )}

        {/* Floating Badges */}
        <div className="absolute bottom-2.5 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="w-3 h-3 rounded-full border border-white/40 shadow-xs"
              style={{ backgroundColor: car.color[1] }}
              title={`Color: ${car.color[0]}`}
            />
            <span className="text-[11px] font-semibold text-white drop-shadow-md">
              {car.color[0]}
            </span>

            {car.winter && (
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-zinc-800/90 text-zinc-200 border border-zinc-700/80 backdrop-blur-xs">
                Winter Tires
              </span>
            )}

            {car.title !== 'clean' && (
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-rose-600/90 text-white uppercase backdrop-blur-xs">
                {car.title}
              </span>
            )}
          </div>

          {showInspectorButton && onOpenInspector && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenInspector();
              }}
              className="pointer-events-auto px-2 py-1 text-[11px] font-medium bg-zinc-900/90 hover:bg-zinc-800 text-white rounded backdrop-blur-xs transition-colors flex items-center gap-1 shadow-xs cursor-pointer border border-zinc-700/60"
            >
              <Eye className="w-3 h-3 text-zinc-300" />
              <span>Inspect</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
