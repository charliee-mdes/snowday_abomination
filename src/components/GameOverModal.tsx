import React from 'react';
import { GameStats } from '../game/types';
import { RotateCcw, Trophy, Target, Zap, Snowflake } from 'lucide-react';

interface GameOverModalProps {
  stats: GameStats;
  won: boolean;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  won,
  onRestart,
}) => {
  const isNewHighScore = stats.score >= stats.highScore && stats.score > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md select-none animate-in fade-in duration-300">
      <div className="max-w-md w-full bg-slate-900 border border-slate-700/80 rounded-2xl p-6 md:p-8 shadow-2xl flex flex-col items-center text-center">
        {/* Title Badge */}
        <div className="w-14 h-14 rounded-full bg-slate-800 border border-cyan-400/40 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(56,189,248,0.25)]">
          {won ? (
            <Trophy className="w-8 h-8 text-yellow-400" />
          ) : (
            <Snowflake className="w-8 h-8 text-cyan-400" />
          )}
        </div>

        <h2 className="text-2xl md:text-3xl font-black font-mono tracking-wider text-white">
          {won ? 'OUTPOST DEFENDED!' : 'FROSTBITE OVERRUN'}
        </h2>
        
        <p className="text-xs md:text-sm font-mono text-slate-400 mt-1 mb-6">
          {won 
            ? 'You held off the blizzard titan horde and secured the arctic outpost!' 
            : `The snow monsters extinguished your warmth brazier on Wave ${stats.wave}.`}
        </p>

        {/* High Score Celebration */}
        {isNewHighScore && (
          <div className="w-full py-1.5 px-3 rounded-lg bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold tracking-widest uppercase mb-4 flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(251,191,36,0.2)]">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>NEW HIGH SCORE RECORD!</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 w-full mb-6 text-left">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Final Score</span>
            <span className="text-xl font-mono font-black text-cyan-300">{stats.score.toLocaleString()}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Wave Reached</span>
            <span className="text-xl font-mono font-black text-white">Wave {stats.wave}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Monsters Defeated</span>
            <span className="text-xl font-mono font-black text-white">{stats.monstersDefeated}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Accuracy</span>
            <span className="text-xl font-mono font-black text-emerald-400">{stats.accuracy}%</span>
          </div>
        </div>

        {/* Restart Button */}
        <button
          onClick={onRestart}
          className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-mono font-black text-sm tracking-wider shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>DEFEND AGAIN</span>
        </button>
      </div>
    </div>
  );
};
