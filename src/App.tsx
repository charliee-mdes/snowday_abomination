import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/engine';
import { ThreatInfo, GameStats, PlayerState, GameSettings, SnowballType } from './game/types';
import { sound } from './game/audio';
import { CentralReticle } from './components/CentralReticle';
import { TopHUD } from './components/TopHUD';
import { BottomDock } from './components/BottomDock';
import { GameOverModal } from './components/GameOverModal';
import { InstructionsModal } from './components/InstructionsModal';
import { HomeScreen } from './components/HomeScreen';
import { EnemyOverviewScreen } from './components/EnemyOverviewScreen';
import { MousePointer, Crosshair, Sparkles } from 'lucide-react';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Screen flow states
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
  const [showEnemyOverview, setShowEnemyOverview] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<{ open: boolean; won: boolean }>({ open: false, won: false });
  const [waveCompleteAlert, setWaveCompleteAlert] = useState<number | null>(null);
  const [isPointerLocked, setIsPointerLocked] = useState<boolean>(false);

  // React State for UI overlays (driven by engine callbacks)
  const [threatInfo, setThreatInfo] = useState<ThreatInfo | null>(null);
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    highScore: 0,
    wave: 1,
    snowballsThrown: 0,
    snowballsHit: 0,
    accuracy: 0,
    monstersDefeated: 0,
    combo: 0,
    maxCombo: 0,
    comboTimer: 0,
  });
  const [player, setPlayer] = useState<PlayerState>({
    warmth: 100,
    maxWarmth: 100,
    isReloading: false,
    reloadProgress: 1,
    selectedSnowball: 'standard',
    unlockedSnowballs: {
      standard: true,
      frost_shard: false,
      heavy_boulder: false,
      blizzard_burst: false,
    },
    specialCharges: {
      standard: Infinity,
      frost_shard: 5,
      heavy_boulder: 3,
      blizzard_burst: 2,
    },
  });
  const [settings, setSettings] = useState<GameSettings>({
    mouseSensitivity: 1.2,
    invertY: false,
    soundVolume: 0.7,
    soundMuted: false,
    autoSnapAssist: false,
    reticleStyle: 'tactical',
  });

  // Initialize Game Engine once on mount
  useEffect(() => {
    if (!mountRef.current) return;

    const engine = new GameEngine(mountRef.current, {
      onThreatUpdate: (threat) => {
        setThreatInfo(threat);
      },
      onStatsUpdate: (newStats) => {
        setStats(newStats);
      },
      onPlayerUpdate: (newPlayer) => {
        setPlayer(newPlayer);
      },
      onGameOver: (won) => {
        setGameOver({ open: true, won });
      },
      onWaveComplete: (wave) => {
        setWaveCompleteAlert(wave);
        setTimeout(() => setWaveCompleteAlert(null), 3000);
      },
    });

    engineRef.current = engine;

    const handlePointerLockChange = () => {
      setIsPointerLocked(document.pointerLockElement === engine.domElement);
    };
    document.addEventListener('pointerlockchange', handlePointerLockChange);

    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Update sound settings when settings change
  const handleUpdateSettings = useCallback((newSettings: Partial<GameSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (engineRef.current) {
        engineRef.current.settings = updated;
      }
      if (newSettings.soundVolume !== undefined) {
        sound.setVolume(newSettings.soundVolume);
      }
      if (newSettings.soundMuted !== undefined) {
        sound.setMuted(newSettings.soundMuted);
      }
      return updated;
    });
  }, []);

  const handleSelectSnowball = useCallback((type: SnowballType) => {
    engineRef.current?.selectSnowball(type);
  }, []);

  const handleThrowSnowball = useCallback(() => {
    engineRef.current?.throwSnowball();
  }, []);

  const handleSnapTurn = useCallback(() => {
    engineRef.current?.snapToNearestThreat();
  }, []);

  // Start Playing level from home screen or overview
  const handleStartLevel = useCallback(() => {
    setIsGameStarted(true);
    setShowEnemyOverview(false);
    setGameOver({ open: false, won: false });
    engineRef.current?.startLevel();
  }, []);

  // Return to home screen
  const handleReturnToHome = useCallback(() => {
    setIsGameStarted(false);
    setShowEnemyOverview(false);
    setGameOver({ open: false, won: false });
    engineRef.current?.returnToHome();
  }, []);

  const handleRestart = useCallback(() => {
    setGameOver({ open: false, won: false });
    engineRef.current?.startLevel();
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* Three.js Isolated Canvas Mount (Directive 4.1) */}
      <div 
        ref={mountRef} 
        className="absolute inset-0 cursor-crosshair z-0"
        tabIndex={0}
      />

      {/* 1. HOME SCREEN (Displayed prior to starting level) */}
      {!isGameStarted && (
        <HomeScreen
          stats={stats}
          onStartGame={handleStartLevel}
          onOpenEnemyOverview={() => setShowEnemyOverview(true)}
          onOpenHelp={() => setShowHelp(true)}
        />
      )}

      {/* 2. ACTIVE GAMEPLAY HUD & OVERLAYS */}
      {isGameStarted && (
        <>
          {/* Top Status HUD */}
          <TopHUD
            stats={stats}
            player={player}
            enemiesRemaining={threatInfo?.totalEnemies || 0}
            totalWaveEnemies={stats.wave * 4}
          />

          {/* CENTRAL DIRECTIONAL RETICLE (The Core Feature) */}
          <CentralReticle
            threatInfo={threatInfo}
            onSnapTurn={handleSnapTurn}
            styleMode={settings.reticleStyle}
          />

          {/* Wave Victory Fanfare Banner */}
          {waveCompleteAlert !== null && (
            <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-in fade-in zoom-in-90 duration-300">
              <div className="px-6 py-2.5 rounded-xl bg-cyan-950/90 border border-cyan-400 text-center shadow-[0_0_24px_rgba(56,189,248,0.4)]">
                <span className="text-xs font-mono font-bold tracking-widest text-cyan-300 uppercase block">
                  WAVE CLEARED!
                </span>
                <span className="text-lg font-mono font-black text-white">
                  PREPARING WAVE {waveCompleteAlert + 1}
                </span>
              </div>
            </div>
          )}

          {/* Helpful Aim Assist Tip (Shows briefly when not pointer locked) */}
          {!isPointerLocked && !gameOver.open && !showEnemyOverview && !showHelp && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
              <div className="px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 text-slate-300 text-[11px] font-mono flex items-center gap-1.5 shadow-md">
                <MousePointer className="w-3.5 h-3.5 text-cyan-400" />
                <span>Click to lock mouse aim • Press [F] to face nearest threat</span>
              </div>
            </div>
          )}

          {/* Unified Bottom Control Dock (Directive 5) */}
          <BottomDock
            player={player}
            settings={settings}
            onSelectSnowball={handleSelectSnowball}
            onUpdateSettings={handleUpdateSettings}
            onThrowSnowball={handleThrowSnowball}
            onSnapTurn={handleSnapTurn}
            onOpenHelp={() => setShowHelp(true)}
            onRestart={handleRestart}
            onOpenEnemyOverview={() => setShowEnemyOverview(true)}
            onReturnToHome={handleReturnToHome}
          />
        </>
      )}

      {/* 3. ENEMY OVERVIEW SCREEN WITH 3D CHARACTER MODELS */}
      {showEnemyOverview && (
        <EnemyOverviewScreen
          onClose={() => setShowEnemyOverview(false)}
          onStartPlaying={!isGameStarted ? handleStartLevel : undefined}
        />
      )}

      {/* 4. INSTRUCTIONS & INTEL MODAL */}
      {showHelp && (
        <InstructionsModal onClose={() => setShowHelp(false)} />
      )}

      {/* 5. GAME OVER / VICTORY MODAL */}
      {gameOver.open && (
        <GameOverModal
          stats={stats}
          won={gameOver.won}
          onRestart={handleRestart}
          onOpenEnemyOverview={() => setShowEnemyOverview(true)}
          onReturnToHome={handleReturnToHome}
        />
      )}
    </div>
  );
}
