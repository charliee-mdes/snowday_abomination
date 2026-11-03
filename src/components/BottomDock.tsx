import React, { useState } from 'react';
import { SnowballType, PlayerState, GameSettings } from '../game/types';
import { 
  Volume2, 
  VolumeX, 
  Sliders, 
  Compass, 
  HelpCircle, 
  ChevronUp, 
  ChevronDown, 
  Snowflake, 
  ShieldAlert, 
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface BottomDockProps {
  player: PlayerState;
  settings: GameSettings;
  onSelectSnowball: (type: SnowballType) => void;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onThrowSnowball: () => void;
  onSnapTurn: () => void;
  onOpenHelp: () => void;
  onRestart: () => void;
}

export const BottomDock: React.FC<BottomDockProps> = ({
  player,
  settings,
  onSelectSnowball,
  onUpdateSettings,
  onThrowSnowball,
  onSnapTurn,
  onOpenHelp,
  onRestart,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'snowballs' | 'settings'>('snowballs');

  const snowballOptions: Array<{
    type: SnowballType;
    label: string;
    keyLabel: string;
    desc: string;
    icon: string;
    color: string;
  }> = [
    {
      type: 'standard',
      label: 'Snowball',
      keyLabel: '1',
      desc: 'Standard rapid throw',
      icon: '❄️',
      color: 'border-cyan-400 text-cyan-200',
    },
    {
      type: 'frost_shard',
      label: 'Ice Shard',
      keyLabel: '2',
      desc: 'High speed piercing',
      icon: '🧊',
      color: 'border-sky-400 text-sky-200',
    },
    {
      type: 'heavy_boulder',
      label: 'Snow Boulder',
      keyLabel: '3',
      desc: 'Heavy crushing blast',
      icon: '⚪',
      color: 'border-slate-300 text-slate-100',
    },
    {
      type: 'blizzard_burst',
      label: 'Blizzard Nova',
      keyLabel: '4',
      desc: 'Area frost explosion',
      icon: '✨',
      color: 'border-indigo-400 text-indigo-200',
    },
  ];

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-auto max-w-[min(940px,94vw)] w-full transition-transform duration-300">
      {/* Collapse / Expand Toggle Tab */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center gap-1.5 px-3 py-1 bg-slate-900/90 border-t border-x border-slate-700/80 rounded-t-lg text-[11px] font-mono font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors shadow-md cursor-pointer"
        title="Toggle HUD Dock"
      >
        {isCollapsed ? (
          <>
            <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
            <span>SHOW CONTROLS</span>
          </>
        ) : (
          <>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            <span>HIDE CONTROLS</span>
          </>
        )}
      </button>

      {/* Main Consolidated Dock Surface */}
      {!isCollapsed && (
        <div className="w-full bg-slate-950/95 border border-slate-800 rounded-xl p-2.5 md:p-3.5 shadow-2xl backdrop-blur-md flex flex-col gap-2.5">
          {/* Top Bar inside Dock: Tab navigation & Quick Action Buttons */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveTab('snowballs')}
                className={`px-3 py-1 rounded text-xs font-mono font-bold tracking-wider transition-colors cursor-pointer ${
                  activeTab === 'snowballs'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                SNOWBALL AMMO
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-3 py-1 rounded text-xs font-mono font-bold tracking-wider transition-colors cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                TACTICAL SETTINGS
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              {/* Primary On-Screen Throw Snowball Button (Super helpful for mobile/touch or clickers) */}
              <button
                onClick={onThrowSnowball}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-mono font-black text-xs md:text-sm tracking-wider shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
              >
                <Snowflake className="w-4 h-4" />
                <span>THROW [SPACE]</span>
              </button>

              {/* Snap Face Nearest Enemy Button */}
              <button
                onClick={onSnapTurn}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-cyan-300 font-mono font-bold text-xs tracking-wider border border-slate-700 transition-all cursor-pointer"
                title="Face nearest enemy instantly [Key: F]"
              >
                <Compass className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">FACE THREAT [F]</span>
              </button>

              {/* How to Play button */}
              <button
                onClick={onOpenHelp}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Controls & Intel"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tab 1: Snowball Ammo Loadout */}
          {activeTab === 'snowballs' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {snowballOptions.map((opt) => {
                const isUnlocked = player.unlockedSnowballs[opt.type];
                const isSelected = player.selectedSnowball === opt.type;
                const charges = player.specialCharges[opt.type];

                return (
                  <button
                    key={opt.type}
                    disabled={!isUnlocked}
                    onClick={() => onSelectSnowball(opt.type)}
                    className={`flex items-center gap-2.5 p-2 rounded-lg border text-left transition-all ${
                      isSelected
                        ? `${opt.color} bg-cyan-950/40 shadow-[0_0_12px_rgba(56,189,248,0.2)]`
                        : isUnlocked
                        ? 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 cursor-pointer'
                        : 'border-slate-800/40 bg-slate-950/40 opacity-40 cursor-not-allowed text-slate-600'
                    }`}
                  >
                    <span className="text-xl shrink-0">{opt.icon}</span>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-bold truncate">{opt.label}</span>
                        <span className="text-[10px] font-mono text-slate-400 px-1 py-0.2 bg-slate-800 rounded">
                          [{opt.keyLabel}]
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {opt.type === 'standard' ? 'Unlimited' : `${charges} left`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Tab 2: Tactical Settings */}
          {activeTab === 'settings' && (
            <div className="flex flex-wrap items-center justify-between gap-4 py-1 px-2 text-xs font-mono text-slate-300">
              {/* Mouse Sensitivity */}
              <div className="flex items-center gap-3">
                <span className="text-slate-400">Aim Sensitivity:</span>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.1"
                  value={settings.mouseSensitivity}
                  onChange={(e) => onUpdateSettings({ mouseSensitivity: parseFloat(e.target.value) })}
                  className="w-28 accent-cyan-400 cursor-pointer"
                />
                <span className="w-8 text-cyan-300 font-bold">{settings.mouseSensitivity.toFixed(1)}x</span>
              </div>

              {/* Invert Y */}
              <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={settings.invertY}
                  onChange={(e) => onUpdateSettings({ invertY: e.target.checked })}
                  className="rounded accent-cyan-400"
                />
                <span>Invert Look Y</span>
              </label>

              {/* Sound Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdateSettings({ soundMuted: !settings.soundMuted })}
                  className="p-1 rounded hover:bg-slate-800 text-slate-300 cursor-pointer"
                  title={settings.soundMuted ? 'Unmute' : 'Mute'}
                >
                  {settings.soundMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  disabled={settings.soundMuted}
                  value={settings.soundVolume}
                  onChange={(e) => onUpdateSettings({ soundVolume: parseFloat(e.target.value) })}
                  className="w-20 accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Restart Game button */}
              <button
                onClick={onRestart}
                className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 text-slate-300 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restart</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
