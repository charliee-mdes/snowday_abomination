import React from 'react';
import { GameStats, PlayerState } from '../game/types';
import { Flame, Shield, Trophy, Zap, Crosshair } from 'lucide-react';

interface TopHUDProps {
  stats: GameStats;
  player: PlayerState;
  enemiesRemaining: number;
}

export const TopHUD: React.FC<TopHUDProps> = ({
  stats,
  player,
  enemiesRemaining,
}) => {
  // Warmth percentage
  const warmthPct = Math.max(0, Math.min(100, (player.warmth / player.maxWarmth) * 100));
  const isCold = warmthPct < 30;

  return (
    <div className="absolute top-0 left-0 right-0 p-3 md:p-5 pointer-events-none z-20 flex items-start justify-between">
      {/* Top Left: Outpost Warmth / Player Health */}
      <div className="flex flex-col gap-1.5 min-w-[140px] md:min-w-[200px]">
        <div className="flex items-center justify-between text-xs font-mono font-bold tracking-wider text-slate-300">
          <div className="flex items-center gap-1.5">
            <Flame className={`w-4 h-4 ${isCold ? 'text-rose-500 animate-pulse' : 'text-amber-400'}`} />
            <span>OUTPOST WARMTH</span>
          </div>
          <span className={isCold ? 'text-rose-400 font-black' : 'text-amber-300'}>
            {Math.round(warmthPct)}%
          </span>
        </div>

        {/* Health Bar */}
        <div className="w-full h-3 bg-slate-900/80 rounded-full border border-slate-700/60 overflow-hidden p-0.5 shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isCold
                ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
                : warmthPct < 60
                ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'
                : 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
            }`}
            style={{ width: `${warmthPct}%` }}
          />
        </div>
      </div>

      {/* Top Center: Wave Status */}
      <div className="flex flex-col items-center">
        <div className="px-4 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700/80 shadow-lg text-center backdrop-blur-sm">
          <div className="text-[10px] font-mono tracking-widest text-cyan-400 font-bold">
            FROSTBITE DEFENSE
          </div>
          <div className="text-sm md:text-base font-mono font-black text-white tracking-wider">
            WAVE {stats.wave}
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
            {enemiesRemaining > 0 ? `${enemiesRemaining} Enemies Left` : 'Wave Incoming'}
          </div>
        </div>
      </div>

      {/* Top Right: Score & Combo Badge */}
      <div className="flex flex-col items-end gap-1.5">
        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-700/80 text-right backdrop-blur-sm shadow-lg">
          <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="flex flex-col text-right">
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Score</span>
            <span className="text-sm md:text-base font-mono font-black text-white">
              {stats.score.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Combo Multiplier Alert */}
        {stats.combo > 1 && (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-400/60 text-cyan-200 text-xs font-mono font-bold tracking-wider shadow-[0_0_12px_rgba(56,189,248,0.3)]">
            <Zap className="w-3.5 h-3.5 text-yellow-300" />
            <span>x{stats.combo} COMBO ({ (1 + (stats.combo - 1) * 0.2).toFixed(1) }x)</span>
          </div>
        )}

        {/* High Score */}
        <div className="text-[10px] font-mono text-slate-400">
          BEST: <span className="text-slate-200 font-bold">{stats.highScore.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};
