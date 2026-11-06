import React, { useEffect, useRef, useState } from 'react';
import { ThreatInfo, MonsterType, GameStats } from '../game/types';
import { ENEMY_INTEL_LIST } from '../game/monsterIntel';
import { sound } from '../game/audio';
import { ElfBrain, LineSource } from '../game/elfBrain';

/**
 * Jingles the Elf — a peripheral sidekick who pops in from the screen edge
 * when you've been ignoring the nearest monster for too long, and cheers
 * when you finally turn to face it. What he says is written on the fly by
 * Gemini based on how you're playing (see game/elfBrain.ts); the direction
 * hints are always computed by the game so they stay accurate.
 */

interface ElfSidekickProps {
  threatInfo: ThreatInfo | null;
  stats: GameStats;
  warmth: number;
  active: boolean;
}

type Side = 'left' | 'right';
type Mood = 'hidden' | 'warning' | 'happy';

interface ElfState {
  mood: Mood;
  side: Side;
  exclaim: string;
  hint: string;
}

// --- Tuning ---------------------------------------------------------------
const WARN_DELAY_MS = 1200;      // how long the nearest enemy can be off-screen before the elf pops in
const CRITICAL_DELAY_MS = 450;   // ...when it's dangerously close
const PHRASE_ROTATE_MS = 3200;   // swap to a fresh phrase while still warning
const HAPPY_MS = 1400;           // how long the "yay you did it" moment lasts
const COOLDOWN_MS = 2500;        // breather after cheering before warning again
const BEHIND_DEG = 140;

const monsterName = (type: MonsterType) =>
  ENEMY_INTEL_LIST.find((i) => i.type === type)?.name ?? 'Snow beastie';

const buildHint = (type: MonsterType, angle: number, critical: boolean) => {
  const name = monsterName(type);
  if (Math.abs(angle) > BEHIND_DEG) {
    return critical ? `${name} is RIGHT behind ya!` : `${name} sneakin’ up behind ya!`;
  }
  const dir = angle >= 0 ? 'right' : 'left';
  return critical ? `${name} on your ${dir}, turn turn TURN!` : `${name} over to your ${dir}!`;
};

export const ElfSidekick: React.FC<ElfSidekickProps> = ({ threatInfo, stats, warmth, active }) => {
  const [elf, setElf] = useState<ElfState>({ mood: 'hidden', side: 'right', exclaim: '', hint: '' });
  const [lineSource, setLineSource] = useState<LineSource>('builtin');

  const brainRef = useRef<ElfBrain | null>(null);
  if (!brainRef.current) {
    brainRef.current = new ElfBrain();
    brainRef.current.onSourceChange = setLineSource;
  }
  const brain = brainRef.current;

  // Keep the brain's picture of the game current (a new wave triggers fresh lines)
  const monstersKey = [...new Set((threatInfo?.allThreats ?? []).map((t) => t.type))].sort().join(',');
  useEffect(() => {
    if (!active) return;
    brain.update({
      wave: stats.wave,
      warmth,
      score: stats.score,
      accuracy: stats.accuracy,
      monstersPresent: monstersKey ? (monstersKey.split(',') as MonsterType[]) : [],
    });
  }, [active, stats.wave, stats.score, stats.accuracy, warmth, monstersKey, brain]);

  // Getting hit while the elf is yelling is something he'll remember
  const prevWarmth = useRef(warmth);
  useEffect(() => {
    if (warmth < prevWarmth.current && rt.current.mood === 'warning') brain.recordHitWhileWarned();
    prevWarmth.current = warmth;
  }, [warmth, brain]);

  // Mutable timing state that shouldn't trigger re-renders on every frame
  const rt = useRef({
    mood: 'hidden' as Mood,
    offSince: null as number | null,
    cooldownUntil: 0,
    lastPhraseAt: 0,
    targetId: '',
    side: 'right' as Side,
    behind: false,
    critical: false,
    exclaim: '',
    hideTimer: 0 as ReturnType<typeof setTimeout> | 0,
    warnedAt: 0,
  });

  const commit = (next: ElfState) => {
    rt.current.mood = next.mood;
    rt.current.side = next.side;
    rt.current.exclaim = next.exclaim;
    setElf(next);
  };

  // Clear pending timer on unmount
  useEffect(() => () => {
    if (rt.current.hideTimer) clearTimeout(rt.current.hideTimer);
  }, []);

  useEffect(() => {
    const r = rt.current;
    const now = performance.now();
    const nearest = threatInfo?.nearestMonster;

    if (!active || !nearest) {
      r.offSince = null;
      if (r.mood === 'warning') commit({ ...elf, mood: 'hidden' });
      return;
    }

    const angle = nearest.relativeAngleDeg;
    const critical = nearest.urgency === 'critical';
    const behind = Math.abs(angle) > BEHIND_DEG;
    const offTarget = !nearest.isInView;

    if (offTarget) {
      if (r.offSince === null) r.offSince = now;

      // When the enemy is directly behind, keep the elf on whichever side it's already on
      const side: Side = behind && r.mood === 'warning' ? r.side : angle >= 0 ? 'right' : 'left';

      if (r.mood === 'warning') {
        const situationChanged =
          side !== r.side || nearest.id !== r.targetId || behind !== r.behind || critical !== r.critical;
        if (situationChanged || now - r.lastPhraseAt > PHRASE_ROTATE_MS) {
          const rotate = now - r.lastPhraseAt > PHRASE_ROTATE_MS || critical !== r.critical;
          r.targetId = nearest.id;
          r.behind = behind;
          r.critical = critical;
          if (rotate) r.lastPhraseAt = now;
          commit({
            mood: 'warning',
            side,
            exclaim: rotate ? brain.pick(critical ? 'critical' : 'warn') : r.exclaim,
            hint: buildHint(nearest.type, angle, critical),
          });
        }
        return;
      }

      const delay = critical ? CRITICAL_DELAY_MS : WARN_DELAY_MS;
      const canPop = r.mood === 'hidden' || critical; // a critical threat interrupts the cheer
      if (canPop && now - r.offSince >= delay && (now >= r.cooldownUntil || critical)) {
        if (r.hideTimer) clearTimeout(r.hideTimer);
        r.targetId = nearest.id;
        r.behind = behind;
        r.critical = critical;
        r.lastPhraseAt = now;
        r.warnedAt = now;
        sound.playElfJingle(false);
        brain.recordWarning();
        commit({
          mood: 'warning',
          side,
          exclaim: brain.pick(critical ? 'critical' : 'warn'),
          hint: buildHint(nearest.type, angle, critical),
        });
      }
      return;
    }

    // Player is looking at the nearest enemy
    r.offSince = null;
    if (r.mood === 'warning') {
      sound.playElfJingle(true);
      r.cooldownUntil = now + HAPPY_MS + COOLDOWN_MS;
      brain.recordReaction(now - r.warnedAt);
      commit({ mood: 'happy', side: r.side, exclaim: brain.pick('happy'), hint: brain.pick('cheer') });
      if (r.hideTimer) clearTimeout(r.hideTimer);
      r.hideTimer = setTimeout(() => {
        if (rt.current.mood === 'happy') {
          rt.current.mood = 'hidden';
          setElf((prev) => ({ ...prev, mood: 'hidden' }));
        }
      }, HAPPY_MS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threatInfo, active]);

  const visible = elf.mood !== 'hidden';
  const isLeft = elf.side === 'left';
  const isCriticalLook = elf.mood === 'warning' && rt.current.critical;

  return (
    <div
      className={`absolute top-[38%] z-[25] pointer-events-none flex items-end gap-1 transition-all duration-300 ease-out ${
        isLeft ? 'left-2 flex-row' : 'right-2 flex-row-reverse'
      }`}
      style={{
        transform: visible ? 'translateX(0)' : `translateX(${isLeft ? '-140%' : '140%'})`,
        opacity: visible ? 1 : 0,
      }}
      aria-live="polite"
      data-elf-source={lineSource}
    >
      {/* The elf himself — mirrored on the right so his pointing arm always aims off-screen */}
      <div className={isCriticalLook ? 'elf-shake' : 'elf-bob'}>
        <div style={{ transform: isLeft ? undefined : 'scaleX(-1)' }}>
          <ElfSvg mood={elf.mood} />
        </div>
      </div>

      {/* Speech bubble */}
      {visible && (
        <div key={elf.exclaim} className="elf-bubble-pop mb-16 max-w-[13rem]">
          <div
            className={`relative px-3 py-2 rounded-2xl border-2 shadow-lg ${
              elf.mood === 'happy'
                ? 'bg-emerald-50 border-emerald-500'
                : isCriticalLook
                ? 'bg-rose-50 border-rose-500'
                : 'bg-amber-50 border-amber-400'
            }`}
          >
            <div
              className={`text-sm font-black leading-tight ${
                elf.mood === 'happy' ? 'text-emerald-700' : isCriticalLook ? 'text-rose-600' : 'text-red-600'
              }`}
            >
              {elf.exclaim}
            </div>
            <div className="text-xs font-semibold text-slate-700 mt-0.5 leading-snug">
              {elf.mood === 'warning' && !rt.current.behind && (
                <span className="mr-1">{isLeft ? '◀' : '▶'}</span>
              )}
              {elf.hint}
            </div>
            {/* Bubble tail pointing back at the elf */}
            <div
              className={`absolute bottom-3 w-3 h-3 rotate-45 border-2 ${
                elf.mood === 'happy'
                  ? 'bg-emerald-50 border-emerald-500'
                  : isCriticalLook
                  ? 'bg-rose-50 border-rose-500'
                  : 'bg-amber-50 border-amber-400'
              } ${isLeft ? '-left-[7px] border-r-0 border-t-0' : '-right-[7px] border-l-0 border-b-0'}`}
            />
          </div>
        </div>
      )}
    </div>
  );
};

/** Hand-drawn elf. Drawn facing the viewer with his pointing arm extended to the LEFT. */
const ElfSvg: React.FC<{ mood: Mood }> = ({ mood }) => {
  const happy = mood === 'happy';
  return (
    <svg width="96" height="124" viewBox="0 0 100 130" className="drop-shadow-[0_4px_6px_rgba(0,0,0,0.45)]">
      {/* Floppy hat */}
      <path d="M28 44 Q36 12 80 6 Q66 22 72 44 Z" fill="#16a34a" stroke="#14532d" strokeWidth="2" />
      <circle cx="81" cy="6" r="4.5" fill="#facc15" stroke="#a16207" strokeWidth="1.5" />

      {/* Ears */}
      <path d="M32 58 L12 46 L33 67 Z" fill="#fcd9b6" stroke="#c2410c" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M68 58 L88 46 L67 67 Z" fill="#fcd9b6" stroke="#c2410c" strokeWidth="1.5" strokeLinejoin="round" />

      {/* Head */}
      <circle cx="50" cy="61" r="19" fill="#fcd9b6" stroke="#c2410c" strokeWidth="1.5" />

      {/* Hat band */}
      <rect x="27" y="40" width="46" height="9" rx="4.5" fill="#dc2626" stroke="#7f1d1d" strokeWidth="1.5" />
      <circle cx="36" cy="44.5" r="1.4" fill="#fff" />
      <circle cx="50" cy="44.5" r="1.4" fill="#fff" />
      <circle cx="64" cy="44.5" r="1.4" fill="#fff" />

      {/* Eyes */}
      {happy ? (
        <>
          <path d="M40 60 Q43 56 46 60" stroke="#1e293b" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M54 60 Q57 56 60 60" stroke="#1e293b" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx="43" cy="59" rx="3" ry="4" fill="#1e293b" />
          <ellipse cx="57" cy="59" rx="3" ry="4" fill="#1e293b" />
          <circle cx="44" cy="57.5" r="1.1" fill="#fff" />
          <circle cx="58" cy="57.5" r="1.1" fill="#fff" />
          {/* Worried eyebrows */}
          <path d="M39 52 L46 54" stroke="#7c2d12" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M61 52 L54 54" stroke="#7c2d12" strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}

      {/* Rosy cheeks + nose */}
      <circle cx="37" cy="66" r="3.6" fill="#fb7185" opacity="0.55" />
      <circle cx="63" cy="66" r="3.6" fill="#fb7185" opacity="0.55" />
      <circle cx="50" cy="64" r="2.4" fill="#f87171" />

      {/* Mouth */}
      {happy ? (
        <path d="M42 70 Q50 80 58 70 Z" fill="#7f1d1d" stroke="#7f1d1d" strokeWidth="1" strokeLinejoin="round" />
      ) : (
        <ellipse cx="50" cy="72.5" rx="3.6" ry="4.2" fill="#7f1d1d" />
      )}

      {/* Tunic with zig-zag collar */}
      <path d="M35 82 L65 82 L72 112 L28 112 Z" fill="#15803d" stroke="#14532d" strokeWidth="2" strokeLinejoin="round" />
      <path d="M35 82 L40 88 L45 82 L50 88 L55 82 L60 88 L65 82" fill="#dc2626" stroke="#7f1d1d" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="30" y="99" width="40" height="6" fill="#1f2937" />
      <rect x="46" y="98" width="8" height="8" rx="1.5" fill="#facc15" stroke="#a16207" strokeWidth="1.2" />

      {/* Striped legs */}
      <rect x="38" y="112" width="8" height="10" fill="#fff" stroke="#7f1d1d" strokeWidth="1" />
      <rect x="54" y="112" width="8" height="10" fill="#fff" stroke="#7f1d1d" strokeWidth="1" />
      <rect x="38" y="115" width="8" height="3" fill="#dc2626" />
      <rect x="54" y="115" width="8" height="3" fill="#dc2626" />

      {/* Curly shoes */}
      <path d="M36 122 L48 122 L48 127 L32 127 Q27 127 28 121 Q31 124 36 122 Z" fill="#15803d" stroke="#14532d" strokeWidth="1.3" />
      <path d="M52 122 L64 122 Q69 124 72 121 Q73 127 68 127 L52 127 Z" fill="#15803d" stroke="#14532d" strokeWidth="1.3" />

      {/* Arms */}
      {happy ? (
        <>
          {/* Both arms up — hooray! */}
          <path d="M36 86 L22 70" stroke="#15803d" strokeWidth="7" strokeLinecap="round" />
          <circle cx="20" cy="67" r="4.5" fill="#fcd9b6" stroke="#c2410c" strokeWidth="1.2" />
          <path d="M64 86 L78 70" stroke="#15803d" strokeWidth="7" strokeLinecap="round" />
          <circle cx="80" cy="67" r="4.5" fill="#fcd9b6" stroke="#c2410c" strokeWidth="1.2" />
        </>
      ) : (
        <>
          {/* Pointing arm, aimed off-screen toward the monster */}
          <path d="M36 87 L9 80" stroke="#15803d" strokeWidth="7" strokeLinecap="round" />
          <circle cx="7" cy="79.5" r="4.5" fill="#fcd9b6" stroke="#c2410c" strokeWidth="1.2" />
          <path d="M5 79 L1 78" stroke="#fcd9b6" strokeWidth="3" strokeLinecap="round" />
          {/* Other hand on hip */}
          <path d="M64 86 L73 95 L66 101" stroke="#15803d" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </>
      )}
    </svg>
  );
};
