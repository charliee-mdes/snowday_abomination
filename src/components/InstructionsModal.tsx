import React from 'react';
import { X, Navigation, Compass, Snowflake, Shield, Zap } from 'lucide-react';

interface InstructionsModalProps {
  onClose: () => void;
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="max-w-lg w-full bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Snowflake className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base md:text-lg font-mono font-black text-white tracking-wider">
              FIELD TACTICS & CONTROLS
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Core Feature: Central Threat Direction Guide */}
        <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-cyan-300 font-mono font-bold text-xs uppercase tracking-wider">
            <Navigation className="w-4 h-4 text-cyan-400" />
            <span>CENTRAL DIRECTIONAL INTERFACE</span>
          </div>
          <p className="text-xs font-mono text-slate-300 leading-relaxed">
            The crosshair is surrounded by a dynamic 360° radar ring and direction chevron pointer:
          </p>
          <ul className="text-xs font-mono text-slate-300 space-y-1 list-disc list-inside">
            <li><strong>Rotating Chevron:</strong> Points directly toward the nearest enemy in real-time.</li>
            <li><strong>Directional Cue:</strong> Tells you exactly <code className="text-cyan-300">TURN LEFT 45°</code>, <code className="text-rose-400">BEHIND YOU!</code>, or <code className="text-emerald-300">TARGET IN SIGHT</code>.</li>
            <li><strong>Snap Turn [Key: F]:</strong> Tap <code className="text-cyan-300">F</code> or click <code className="text-cyan-300">[SNAP]</code> to instantly pivot and face the nearest monster!</li>
          </ul>
        </div>

        {/* 2. Controls Grid */}
        <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
          <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase">Look Around 360°</span>
            <span className="text-white font-bold">Mouse Look / Click-Drag</span>
            <span className="text-slate-500 text-[10px] block mt-0.5">or A/D/Left/Right keys</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase">Throw Snowball</span>
            <span className="text-white font-bold">Left Click or Spacebar</span>
            <span className="text-slate-500 text-[10px] block mt-0.5">or bottom throw button</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase">Face Nearest Enemy</span>
            <span className="text-cyan-300 font-bold">Press [F] or [E]</span>
            <span className="text-slate-500 text-[10px] block mt-0.5">Quick directional assist</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase">Switch Snowball</span>
            <span className="text-white font-bold">Keys [1], [2], [3], [4]</span>
            <span className="text-slate-500 text-[10px] block mt-0.5">Unlock with wave combos</span>
          </div>
        </div>

        {/* 3. Monster Intel */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            Monster Intel
          </span>
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
            <div className="p-2 rounded-lg bg-slate-950/50 border border-slate-800">
              <span className="text-lg">👹</span>
              <div className="text-[11px] font-bold text-white mt-1">Frost Scout</div>
              <div className="text-[10px] text-slate-400">Swift flanker (1 hit)</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-950/50 border border-slate-800">
              <span className="text-lg">⛄</span>
              <div className="text-[11px] font-bold text-white mt-1">Snow Golem</div>
              <div className="text-[10px] text-slate-400">Heavy brute (3 hits)</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-950/50 border border-slate-800">
              <span className="text-lg">🐺</span>
              <div className="text-[11px] font-bold text-white mt-1">Frost Stalker</div>
              <div className="text-[10px] text-slate-400">Crystalline lurker</div>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="mt-2 w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-mono font-bold text-xs tracking-wider transition-all cursor-pointer"
        >
          READY FOR BATTLE
        </button>
      </div>
    </div>
  );
};
