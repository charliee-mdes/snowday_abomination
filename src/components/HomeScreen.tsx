import React from 'react';
import { GameStats } from '../game/types';
import { ENEMY_INTEL_LIST } from '../game/monsterIntel';
import { 
  Play, 
  ShieldAlert, 
  HelpCircle, 
  Sliders, 
  Trophy, 
  Compass, 
  Crosshair, 
  Snowflake,
  ChevronRight,
  Eye
} from 'lucide-react';

interface HomeScreenProps {
  stats: GameStats;
  onStartGame: () => void;
  onOpenEnemyOverview: () => void;
  onOpenHelp: () => void;
  onOpenSettings?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  stats,
  onStartGame,
  onOpenEnemyOverview,
  onOpenHelp,
  onOpenSettings,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-[2px] select-none pointer-events-auto overflow-y-auto">
      <div className="max-w-2xl w-full flex flex-col items-center text-center my-auto">
        {/* Outpost Badge */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-400/50 text-cyan-300 text-xs font-mono font-bold tracking-widest uppercase mb-4 shadow-[0_0_16px_rgba(56,189,248,0.3)] animate-in fade-in duration-300">
          <Snowflake className="w-3.5 h-3.5 text-cyan-300 animate-spin [animation-duration:12s]" />
          <span>OUTPOST DEFENSE POST 01 • DAYTIME SECTOR</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black font-mono tracking-wider text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
          FROSTBITE OUTPOST
        </h1>

        <p className="text-sm sm:text-base font-mono font-bold text-cyan-200 mt-2 tracking-wide max-w-lg drop-shadow">
          360° First-Person Snowball Shooter
        </p>

        <p className="text-xs sm:text-sm font-mono text-slate-300 mt-1.5 max-w-md opacity-90">
          Defend your warmth brazier against relentless snow monsters charging from every direction using your central threat radar.
        </p>

        {/* Main Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-7 w-full max-w-md">
          {/* Primary Play Button */}
          <button
            onClick={onStartGame}
            className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-cyan-400 hover:bg-cyan-300 active:scale-95 text-slate-950 font-mono font-black text-sm md:text-base tracking-wider shadow-lg shadow-cyan-400/30 transition-all cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>START LEVEL</span>
          </button>

          {/* Enemy Overview & 3D Models Button */}
          <button
            onClick={onOpenEnemyOverview}
            className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-cyan-200 hover:text-white border border-cyan-400/40 hover:border-cyan-400 font-mono font-bold text-sm tracking-wider shadow-md transition-all cursor-pointer active:scale-95"
          >
            <ShieldAlert className="w-5 h-5 text-cyan-400" />
            <span>ENEMY OVERVIEW</span>
          </button>
        </div>

        {/* Secondary Navigation (How to Play & Controls) */}
        <div className="flex items-center gap-2.5 mt-3">
          <button
            onClick={onOpenHelp}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-mono font-bold transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>HOW TO PLAY & TACTICS</span>
          </button>
        </div>

        {/* Quick Specimen Preview Shelf (Clickable to jump directly into the 3D model viewer) */}
        <div className="mt-8 w-full max-w-lg p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 backdrop-blur-md flex flex-col gap-2.5 shadow-xl">
          <div className="flex items-center justify-between text-left">
            <span className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>CLASSIFIED SNOW MONSTERS (4 SPECIES)</span>
            </span>
            <button
              onClick={onOpenEnemyOverview}
              className="text-[10px] font-mono text-cyan-400 hover:text-cyan-200 font-bold flex items-center gap-0.5 cursor-pointer"
            >
              <span>INSPECT ALL 3D MODELS</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {ENEMY_INTEL_LIST.map((monster) => (
              <button
                key={monster.type}
                onClick={onOpenEnemyOverview}
                className="flex flex-col items-center p-2 rounded-xl bg-slate-900/70 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer group"
                title={`Inspect 3D ${monster.name}`}
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">
                  {monster.type === 'scout'
                    ? '👹'
                    : monster.type === 'golem'
                    ? '⛄'
                    : monster.type === 'stalker'
                    ? '🐺'
                    : '👑'}
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-200 mt-1 truncate w-full text-center">
                  {monster.name.split(' ')[0]}
                </span>
                <span className="text-[9px] font-mono text-cyan-400/80">
                  Wave {monster.firstWave}+
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Telemetry Record Footer */}
        {stats.highScore > 0 && (
          <div className="mt-5 flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/70 border border-slate-800 text-xs font-mono text-slate-300">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>RECORD HIGH SCORE:</span>
            <span className="font-bold text-amber-300">{stats.highScore.toLocaleString()} PTS</span>
          </div>
        )}

        {/* Key Controls Quick Reference */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-[11px] font-mono text-slate-400">
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-200">Mouse</kbd> Look 360°</span>
          <span>•</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-200">Click / Space</kbd> Throw</span>
          <span>•</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-cyan-300 font-bold">F</kbd> Snap Face Nearest Enemy</span>
        </div>
      </div>
    </div>
  );
};
