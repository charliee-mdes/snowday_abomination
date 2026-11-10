import React from 'react';
import { ThreatInfo } from '../game/types';
import { Crosshair, Compass, AlertTriangle, ShieldAlert, Sparkles, Navigation } from 'lucide-react';

interface CentralReticleProps {
  threatInfo: ThreatInfo | null;
  onSnapTurn: () => void;
}

export const CentralReticle: React.FC<CentralReticleProps> = ({
  threatInfo,
  onSnapTurn,
}) => {
  const nearest = threatInfo?.nearestMonster;
  const allThreats = threatInfo?.allThreats || [];
  const totalEnemies = threatInfo?.totalEnemies || 0;

  // Relative angle in degrees (-180 to +180)
  const relAngle = nearest ? nearest.relativeAngleDeg : 0;
  const isTargetInSight = nearest ? nearest.isInView && Math.abs(relAngle) < 14 : false;
  const isBehind = nearest ? Math.abs(relAngle) > 135 : false;

  // Urgency styling
  const urgency = nearest?.urgency || 'normal';
  const colorClass = urgency === 'critical'
    ? 'text-rose-400 border-rose-500 bg-rose-950/40'
    : urgency === 'warning'
    ? 'text-amber-400 border-amber-500 bg-amber-950/40'
    : 'text-cyan-400 border-cyan-500 bg-cyan-950/40';

  const glowColor = urgency === 'critical'
    ? 'rgba(244, 63, 94, 0.4)'
    : urgency === 'warning'
    ? 'rgba(251, 191, 36, 0.3)'
    : 'rgba(56, 189, 248, 0.25)';

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center select-none z-20">
      {/* Outer Tactical 360 Degree Threat Radar Ring */}
      <div 
        className="relative w-48 h-48 md:w-56 md:h-56 rounded-full border border-cyan-500/20 flex items-center justify-center transition-all duration-300"
        style={{
          boxShadow: `0 0 24px ${glowColor}, inset 0 0 16px ${glowColor}`,
        }}
      >
        {/* Cardinal North/Front, East/Right, South/Behind, West/Left indicators */}
        <div className="absolute top-1 text-[9px] font-mono tracking-widest text-cyan-400/70 font-bold">
          FRONT
        </div>
        <div className="absolute bottom-1 text-[9px] font-mono tracking-widest text-cyan-400/70 font-bold">
          BEHIND
        </div>
        <div className="absolute right-1 text-[9px] font-mono tracking-widest text-cyan-400/70 font-bold">
          R
        </div>
        <div className="absolute left-1 text-[9px] font-mono tracking-widest text-cyan-400/70 font-bold">
          L
        </div>

        {/* 360 Radar blips for ALL active monsters approaching */}
        {allThreats.map((threat) => {
          // Calculate blip position along the radar circle:
          // angle 0 is top (front), 90 is right, 180 is bottom (behind), -90 is left
          const rad = ((threat.relativeAngleDeg - 90) * Math.PI) / 180;
          const radarRadius = 76; // pixels from center
          const blipX = Math.cos(rad) * radarRadius;
          const blipY = Math.sin(rad) * radarRadius;

          const isNearest = nearest && threat.id === nearest.id;
          const blipColor = threat.urgency === 'critical'
            ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
            : threat.urgency === 'warning'
            ? 'bg-amber-400 shadow-[0_0_6px_#fbbf24]'
            : 'bg-cyan-400 shadow-[0_0_6px_#38bdf8]';

          return (
            <div
              key={threat.id}
              className={`absolute rounded-full transition-transform duration-100 ${
                isNearest ? 'w-3 h-3 border-2 border-white' : 'w-2 h-2'
              } ${blipColor}`}
              style={{
                transform: `translate(${blipX}px, ${blipY}px)`,
              }}
              title={`${threat.type} (${threat.distance}m)`}
            />
          );
        })}

        {/* DYNAMIC DIRECTIONAL POINTER ARROW (Rotating around reticle to point toward nearest threat) */}
        {nearest && (
          <div
            className="absolute inset-0 flex items-center justify-center transition-transform duration-150 ease-out"
            style={{
              transform: `rotate(${relAngle}deg)`,
            }}
          >
            {/* Pointer Chevron Arrow perched at the top edge of the ring */}
            <div className="absolute -top-6 flex flex-col items-center">
              <div 
                className={`w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[18px] transition-colors duration-200 ${
                  urgency === 'critical'
                    ? 'border-b-rose-500 drop-shadow-[0_0_8px_#f43f5e]'
                    : urgency === 'warning'
                    ? 'border-b-amber-400 drop-shadow-[0_0_8px_#fbbf24]'
                    : 'border-b-cyan-400 drop-shadow-[0_0_8px_#38bdf8]'
                }`}
              />
              {/* Distance on pointer */}
              <div className="mt-1 px-1.5 py-0.5 rounded text-[10px] font-black font-mono bg-slate-950/90 border border-slate-700 text-white tracking-wider whitespace-nowrap">
                {nearest.distance}m
              </div>
            </div>
          </div>
        )}

        {/* Inner Crosshair Ring */}
        <div className="relative w-14 h-14 rounded-full border border-cyan-400/40 flex items-center justify-center">
          {/* Central Aim Dot */}
          <div 
            className={`w-2 h-2 rounded-full transition-all duration-200 ${
              isTargetInSight 
                ? 'bg-rose-500 scale-125 shadow-[0_0_12px_#f43f5e]' 
                : 'bg-cyan-300 shadow-[0_0_6px_#38bdf8]'
            }`} 
          />

          {/* Crosshair Tick Marks */}
          <div className="absolute -top-2 w-0.5 h-2 bg-cyan-400/80" />
          <div className="absolute -bottom-2 w-0.5 h-2 bg-cyan-400/80" />
          <div className="absolute -left-2 w-2 h-0.5 bg-cyan-400/80" />
          <div className="absolute -right-2 w-2 h-0.5 bg-cyan-400/80" />

          {/* In-Sight Locked Reticle Brackets */}
          {isTargetInSight && (
            <div className="absolute -inset-2 border-2 border-dashed border-rose-500 rounded-full animate-spin [animation-duration:8s]" />
          )}
        </div>
      </div>

      {/* PROMINENT CENTRAL DIRECTIONAL BANNER (Right below the crosshair) */}
      <div className="absolute top-[calc(50%+115px)] flex flex-col items-center gap-1.5">
        {nearest ? (
          <div className="flex flex-col items-center">
            {/* High-visibility Turn Direction Badge */}
            <div 
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full border shadow-lg backdrop-blur-md transition-all duration-200 ${colorClass}`}
            >
              {isBehind ? (
                <AlertTriangle className="w-4 h-4 shrink-0 animate-bounce" />
              ) : isTargetInSight ? (
                <Crosshair className="w-4 h-4 shrink-0" />
              ) : (
                <Navigation 
                  className="w-4 h-4 shrink-0 transition-transform duration-150"
                  style={{ transform: `rotate(${relAngle}deg)` }}
                />
              )}

              <span className="text-xs md:text-sm font-black tracking-widest uppercase font-mono">
                {nearest.directionLabel}
              </span>

              <span className="text-xs font-mono font-bold opacity-80 border-l border-white/20 pl-2">
                {nearest.distance}m
              </span>
            </div>

            {/* Monster Type & Snap Assist Button */}
            <div className="mt-2 flex items-center gap-2 pointer-events-auto">
              <span className="text-[11px] font-mono tracking-wider text-slate-300 uppercase px-2 py-0.5 bg-slate-900/80 rounded border border-slate-700">
                Threat: <span className="font-bold text-white">{nearest.type}</span>
              </span>

              {/* Quick Snap Turn Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSnapTurn();
                }}
                className="group flex items-center gap-1 text-[11px] font-mono font-bold tracking-wider px-2.5 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-200 border border-cyan-400/40 hover:border-cyan-400 transition-all cursor-pointer shadow-sm active:scale-95"
                title="Face nearest enemy instantly [Key: F]"
              >
                <Compass className="w-3.5 h-3.5 text-cyan-300 group-hover:rotate-45 transition-transform" />
                <span>SNAP [F]</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="px-3 py-1 rounded-full bg-slate-900/60 border border-slate-800 text-[11px] font-mono text-cyan-300/70">
            RADAR CLEAR • PREPARING NEXT WAVE
          </div>
        )}

        {/* Total Surrounding Threats Pill */}
        <div className="mt-1 text-[10px] font-mono text-slate-400 tracking-wider">
          {totalEnemies > 0 ? (
            <span>{totalEnemies} MONSTERS SURROUNDING POST</span>
          ) : (
            <span>PERIMETER SECURE</span>
          )}
        </div>
      </div>
    </div>
  );
};
