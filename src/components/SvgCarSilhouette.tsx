import React from 'react';

interface SvgCarSilhouetteProps {
  cls?: string;
  color?: string;
  className?: string;
  showBlueprintGrid?: boolean;
}

const ROOF_PATHS: Record<string, string> = {
  compact: '46,40 66,18 130,18 156,40',
  hatch: '44,40 62,18 138,18 158,40',
  sedan: '42,40 66,20 126,20 152,40',
  suv: '38,40 48,16 158,16 168,40',
  van: '34,40 40,14 160,14 170,40',
  truck: '44,40 62,18 106,18 120,40',
  sport: '50,40 82,26 120,26 150,40',
  lux: '40,40 66,20 128,20 156,40',
  conv: '52,40 62,30 116,30 130,40',
};

export const SvgCarSilhouette: React.FC<SvgCarSilhouetteProps> = ({
  cls = 'sedan',
  color = '#06b6d4',
  className = 'w-full h-24',
  showBlueprintGrid = false,
}) => {
  const normCls = cls.toLowerCase();
  const roof = ROOF_PATHS[normCls] || ROOF_PATHS.sedan;

  return (
    <div className={`relative flex items-center justify-center overflow-hidden rounded-xl bg-slate-950/40 dark:bg-slate-950/70 border border-slate-800/40 ${className}`}>
      {showBlueprintGrid && (
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, ${color} 1px, transparent 1px)`,
            backgroundSize: '12px 12px',
          }}
        />
      )}
      <svg
        viewBox="0 0 200 70"
        className="w-full h-full max-h-24 p-2 drop-shadow-[0_0_8px_rgba(6,182,212,0.25)] select-none"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Wheels */}
        <circle cx="48" cy="52" r="14" fill="#0b0f14" stroke={color} strokeWidth="2.5" />
        <circle cx="48" cy="52" r="6" fill={color} />
        <circle cx="152" cy="52" r="14" fill="#0b0f14" stroke={color} strokeWidth="2.5" />
        <circle cx="152" cy="52" r="6" fill={color} />

        {/* Lower Body */}
        <path
          d="M 16 46 Q 16 38 28 38 L 172 38 Q 186 38 186 46 L 180 54 Q 176 56 166 56 L 138 56 Q 134 50 120 50 L 80 50 Q 66 50 62 56 L 34 56 Q 24 56 20 54 Z"
          fill={color}
          fillOpacity="0.18"
          stroke={color}
          strokeWidth="2"
        />

        {/* Roof / Cabin */}
        <polygon
          points={roof}
          fill={color}
          fillOpacity="0.32"
          stroke={color}
          strokeWidth="2"
        />

        {/* Dimension & Blueprint accents */}
        <line x1="6" y1="64" x2="194" y2="64" stroke="#475569" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />
        
        {/* Subtle center line */}
        <line x1="48" y1="52" x2="152" y2="52" stroke={color} strokeWidth="1" strokeDasharray="2 3" opacity="0.35" />
      </svg>

      {/* Blueprint Class Badge */}
      <span className="absolute top-1.5 right-2 font-mono text-[9px] uppercase tracking-widest text-slate-400/80 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-800/60">
        SPEC:{cls}
      </span>
    </div>
  );
};
