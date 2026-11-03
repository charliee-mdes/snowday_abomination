import * as THREE from 'three';

export type MonsterType = 'scout' | 'golem' | 'stalker' | 'boss';

export interface Monster {
  id: string;
  type: MonsterType;
  group: THREE.Group;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  targetPosition: THREE.Vector3;
  speed: number;
  health: number;
  maxHealth: number;
  radius: number;
  walkCycle: number;
  hitTimer: number; // For hit flash
  attackCooldown: number;
  scoreValue: number;
  height: number;
  displayName?: string;
  // Specific part references for procedural animation
  parts: {
    head?: THREE.Object3D;
    leftArm?: THREE.Object3D;
    rightArm?: THREE.Object3D;
    leftLeg?: THREE.Object3D;
    rightLeg?: THREE.Object3D;
    body?: THREE.Object3D;
    eyes?: THREE.Object3D[];
    hat?: THREE.Object3D;
    scarf?: THREE.Object3D;
    horn?: THREE.Object3D;
    pomPom?: THREE.Object3D;
    tail?: THREE.Object3D;
  };
}

export type SnowballType = 'standard' | 'frost_shard' | 'heavy_boulder' | 'blizzard_burst';

export interface Snowball {
  id: string;
  type: SnowballType;
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  gravity: number;
  damage: number;
  radius: number;
  life: number;
  maxLife: number;
  isSpecial?: boolean;
}

export interface ImpactParticle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  rotationSpeed: THREE.Vector3;
  life: number;
  maxLife: number;
  color: THREE.Color;
}

export interface ThreatInfo {
  nearestMonster: {
    id: string;
    type: MonsterType;
    distance: number; // in meters
    relativeAngleDeg: number; // -180 to 180 degrees relative to camera forward (0 = right in front, positive = right, negative = left, +/-180 = behind)
    directionLabel: string; // "IN SIGHT", "TURN RIGHT 45°", "BEHIND YOU", etc.
    urgency: 'critical' | 'warning' | 'normal';
    screenX?: number; // Normalized -1 to 1 screen space if in view
    screenY?: number;
    isInView: boolean;
  } | null;
  allThreats: Array<{
    id: string;
    type: MonsterType;
    distance: number;
    relativeAngleDeg: number; // For 360 radar ring
    urgency: 'critical' | 'warning' | 'normal';
  }>;
  totalEnemies: number;
}

export interface GameStats {
  score: number;
  highScore: number;
  wave: number;
  snowballsThrown: number;
  snowballsHit: number;
  accuracy: number;
  monstersDefeated: number;
  combo: number;
  maxCombo: number;
  comboTimer: number;
}

export interface PlayerState {
  warmth: number; // 0 to 100% health
  maxWarmth: number;
  isReloading: boolean;
  reloadProgress: number; // 0 to 1
  selectedSnowball: SnowballType;
  unlockedSnowballs: Record<SnowballType, boolean>;
  specialCharges: Record<SnowballType, number>;
}

export interface GameSettings {
  mouseSensitivity: number; // 0.5 to 3.0
  invertY: boolean;
  soundVolume: number;
  soundMuted: boolean;
  autoSnapAssist: boolean;
  reticleStyle: 'tactical' | 'minimal' | 'radar';
}
