import React, { useState } from 'react';
import { MonsterType } from '../game/types';
import { ENEMY_INTEL_LIST, EnemyIntel } from '../game/monsterIntel';
import { Enemy3DViewer } from './Enemy3DViewer';
import { 
  X, 
  ShieldAlert, 
  Zap, 
  Target, 
  Compass, 
  Sparkles, 
  ChevronRight, 
  Heart, 
  Gauge, 
  Award, 
  Crosshair, 
  Info,
  Snowflake,
  Play
} from 'lucide-react';

interface EnemyOverviewScreenProps {
  onClose: () => void;
  onStartPlaying?: () => void;
  initialMonsterType?: MonsterType;
}

export const EnemyOverviewScreen: React.FC<EnemyOverviewScreenProps> = ({
  onClose,
  onStartPlaying,
  initialMonsterType = 'scout',
}) => {
  const [selectedType, setSelectedType] = useState<MonsterType>(initialMonsterType);

  const selectedIntel: EnemyIntel = 
    ENEMY_INTEL_LIST.find((item) => item.type === selectedType) || ENEMY_INTEL_LIST[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/90 backdrop-blur-md select-none overflow-y-auto animate-in fade-in duration-300">
      <div className="relative w-full max-w-5xl bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <ShieldAlert className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base md:text-lg font-mono font-black text-white tracking-wider uppercase flex items-center gap-2">
                <span>ENEMY DOSSIER & 3D BESTIARY</span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  4 SPECIES CLASSIFIED
                </span>
              </h2>
              <p className="text-[11px] font-mono text-slate-400 hidden xs:block">
                Inspect 3D character models, weaknesses, and survival tactics before deployment
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onStartPlaying && (
              <button
                onClick={onStartPlaying}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-mono font-black text-xs tracking-wider transition-all shadow-md cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>DEPLOY TO LEVEL</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Close Dossier"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content Body: 3D Stage on Left, Intel Sheet on Right */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto min-h-0">
          {/* 3D Character Model Stage */}
          <div className="lg:col-span-6 bg-gradient-to-b from-slate-950/80 via-slate-900/50 to-slate-950/90 relative flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800 p-4 min-h-[320px] lg:min-h-0">
            {/* Top Badges overlay on 3D Stage */}
            <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-1.5 pointer-events-none">
              <span className="px-2.5 py-0.5 rounded-full bg-slate-950/80 border border-slate-700 text-[10px] font-mono font-bold text-slate-300 uppercase">
                {selectedIntel.title}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-[10px] font-mono font-bold text-cyan-300 uppercase">
                Wave {selectedIntel.firstWave}+ Threat
              </span>
            </div>

            {/* Live 3D Interactive Turntable Viewer */}
            <div className="flex-1 w-full h-full flex items-center justify-center">
              <Enemy3DViewer
                key={selectedType}
                monsterType={selectedType}
                className="w-full h-full"
              />
            </div>

            {/* Threat Rating Star Bar */}
            <div className="mt-2 flex items-center justify-between text-xs font-mono text-slate-400 px-2 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] font-bold text-slate-300 uppercase">Threat Level:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`text-sm ${
                      star <= selectedIntel.threatRating
                        ? selectedIntel.threatRating === 5
                          ? 'text-rose-400'
                          : selectedIntel.threatRating >= 3
                          ? 'text-amber-400'
                          : 'text-cyan-400'
                        : 'text-slate-700'
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Detailed Telemetry, Combat Dossier & Tactics */}
          <div className="lg:col-span-6 p-4 sm:p-6 flex flex-col justify-between gap-4 overflow-y-auto">
            <div className="flex flex-col gap-3">
              {/* Header Title & Subtitle */}
              <div className="border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl sm:text-2xl font-black font-mono tracking-wide text-white">
                    {selectedIntel.name}
                  </h3>
                </div>
                <p className="text-xs font-mono text-cyan-300/80 font-bold uppercase tracking-wider">
                  {selectedIntel.title} • {selectedIntel.badges.join(' • ')}
                </p>
              </div>

              {/* Combat Telemetry Gauges */}
              <div className="grid grid-cols-3 gap-2">
                {/* Health HP */}
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col">
                  <span className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1">
                    <Heart className="w-3 h-3 text-rose-400" />
                    <span>Health</span>
                  </span>
                  <span className="text-lg font-mono font-black text-rose-300 mt-0.5">
                    {selectedIntel.health} HP
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {selectedIntel.health <= 30 ? '1 Hit' : selectedIntel.health <= 90 ? '3 Hits' : 'Boss Scale'}
                  </span>
                </div>

                {/* Speed */}
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col">
                  <span className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1">
                    <Gauge className="w-3 h-3 text-cyan-400" />
                    <span>Speed</span>
                  </span>
                  <span className="text-lg font-mono font-black text-cyan-300 mt-0.5">
                    {selectedIntel.speedRating}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Sprint velocity
                  </span>
                </div>

                {/* Score Bounty */}
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col">
                  <span className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1">
                    <Award className="w-3 h-3 text-amber-400" />
                    <span>Bounty</span>
                  </span>
                  <span className="text-lg font-mono font-black text-amber-300 mt-0.5">
                    +{selectedIntel.scoreValue}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Base score points
                  </span>
                </div>
              </div>

              {/* Field Description */}
              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Morphology & Behavior
                </span>
                <p className="text-xs font-mono text-slate-300 leading-relaxed">
                  {selectedIntel.description}
                </p>
              </div>

              {/* Tactical Tip & Recommended Snowball Weaponry */}
              <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/40 flex flex-col gap-1.5 shadow-sm">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
                  <Target className="w-4 h-4 text-cyan-400" />
                  <span>Defensive Countermeasure</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-white">
                  <span className="text-slate-400">Recommended Ammo:</span>
                  <span className="font-bold text-amber-300 px-2 py-0.5 rounded bg-slate-900 border border-amber-500/30">
                    {selectedIntel.recommendedAmmo}
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-300 mt-1 leading-relaxed">
                  {selectedIntel.tacticalTip}
                </p>
              </div>

              {/* Anatomical Key Features */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Visual Identification Checklist:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs font-mono text-slate-300">
                  {selectedIntel.visualFeatures.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-950/50 border border-slate-800">
                      <ChevronRight className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Deploy Button on Mobile / Desktop */}
            {onStartPlaying && (
              <button
                onClick={onStartPlaying}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-mono font-black text-xs sm:text-sm tracking-wider transition-all shadow-md cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>START LEVEL DEFENSE</span>
              </button>
            )}
          </div>
        </div>

        {/* Bottom Monster Selection Ribbon: Click to switch between all 4 models */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-mono font-bold text-slate-400 uppercase shrink-0 px-2">
            Select Specimen:
          </span>
          <div className="flex items-center gap-2 flex-1">
            {ENEMY_INTEL_LIST.map((monster) => {
              const isSelected = monster.type === selectedType;
              const isBoss = monster.type === 'boss';

              return (
                <button
                  key={monster.type}
                  onClick={() => setSelectedType(monster.type)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? isBoss
                        ? 'border-rose-400 bg-rose-950/50 text-white shadow-[0_0_14px_rgba(244,63,94,0.3)]'
                        : 'border-cyan-400 bg-cyan-950/50 text-white shadow-[0_0_14px_rgba(56,189,248,0.25)]'
                      : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 text-slate-300'
                  }`}
                >
                  <span className="text-xl shrink-0">
                    {monster.type === 'scout'
                      ? '👹'
                      : monster.type === 'golem'
                      ? '⛄'
                      : monster.type === 'stalker'
                      ? '🐺'
                      : '👑'}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono font-black truncate">{monster.name}</span>
                      {isBoss && (
                        <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40">
                          BOSS
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      Wave {monster.firstWave}+ • {monster.health} HP
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
