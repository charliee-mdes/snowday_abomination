import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { 
  Monster, 
  MonsterType, 
  Snowball, 
  SnowballType, 
  ImpactParticle, 
  ThreatInfo, 
  GameStats, 
  PlayerState, 
  GameSettings 
} from './types';
import { createMonster, updateMonsterAnimation, flashMonsterHit, disposeMonster } from './monsters';
import { setupEnvironment, EnvironmentObjects } from './environment';
import { PlayerViewModel } from './viewmodel';
import { sound } from './audio';

// Pre-allocated math vectors for zero GC in render loop (Three.js directive 4.3)
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _camDir = new THREE.Vector3();
const _monsterDir = new THREE.Vector3();
const _screenPos = new THREE.Vector3();

export interface GameEngineCallbacks {
  onThreatUpdate: (threatInfo: ThreatInfo) => void;
  onStatsUpdate: (stats: GameStats) => void;
  onPlayerUpdate: (player: PlayerState) => void;
  onGameOver: (won: boolean) => void;
  onWaveComplete: (wave: number) => void;
}

export class GameEngine {
  private container: HTMLElement;
  private callbacks: GameEngineCallbacks;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private clock!: THREE.Clock;
  private isSoftwareGl: boolean = false;

  // Game Entities
  private env!: EnvironmentObjects;
  private viewModel!: PlayerViewModel;
  private monsters: Monster[] = [];
  private snowballs: Snowball[] = [];
  private impactParticles: ImpactParticle[] = [];

  // Reusable Geometries & Materials
  private snowballGeo: THREE.SphereGeometry;
  private snowballMat: THREE.MeshStandardMaterial;
  private iceShardGeo: THREE.ConeGeometry;
  private iceShardMat: THREE.MeshStandardMaterial;
  private heavyBoulderGeo: THREE.DodecahedronGeometry;
  private heavyBoulderMat: THREE.MeshStandardMaterial;
  private particleGeo: THREE.BoxGeometry;
  // Particle materials are shared (one per color) so short-lived particles don't allocate GPU resources
  private splatMats = new Map<number, THREE.MeshBasicMaterial>();
  private shatterMats: THREE.MeshStandardMaterial[];

  // Camera & Player Controls
  private yaw: number = 0;
  private pitch: number = 0;
  private isPointerLocked: boolean = false;
  private isDragging: boolean = false;
  private previousMousePosition = { x: 0, y: 0 };
  private keysDown: Set<string> = new Set();
  
  // Snap turn smoothing
  private targetYaw: number | null = null;
  private snapProgress: number = 0;

  // Game Loop State
  private frameId: number = 0;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private lastShootTime: number = 0;
  private shootCooldown: number = 0.35; // seconds

  // Horde & Wave Spawner
  private wave: number = 1;
  private waveEnemiesTotal: number = 0;
  private waveEnemiesSpawned: number = 0;
  private waveSpawnTimer: number = 0;
  private waveState: 'home' | 'active' | 'spawning' | 'intermission' = 'home';
  private intermissionTimer: number = 2.0;

  // Stats & State
  public stats: GameStats = {
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
  };

  public player: PlayerState = {
    warmth: 100,
    maxWarmth: 100,
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
  };

  public settings: GameSettings = {
    mouseSensitivity: 1.2,
    invertY: false,
    soundVolume: 0.7,
    soundMuted: false,
  };

  public get domElement(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  constructor(container: HTMLElement, callbacks: GameEngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    // Load saved high score
    const savedHighScore = localStorage.getItem('frostbite_high_score');
    if (savedHighScore) {
      this.stats.highScore = parseInt(savedHighScore, 10) || 0;
    }

    // Initialize Shared Geometries
    this.snowballGeo = new THREE.SphereGeometry(0.22, 10, 10);
    this.snowballMat = new THREE.MeshStandardMaterial({
      color: 0xf0fdfa,
      roughness: 0.75,
      metalness: 0.05,
    });

    this.iceShardGeo = new THREE.ConeGeometry(0.18, 0.65, 5);
    this.iceShardGeo.rotateX(Math.PI / 2);
    this.iceShardMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.2,
      metalness: 0.8,
    });

    this.heavyBoulderGeo = new THREE.DodecahedronGeometry(0.42, 1);
    this.heavyBoulderMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.9,
      metalness: 0.15,
    });

    this.particleGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    this.shatterMats = [0x7dd3fc, 0xffffff].map(
      (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.4 })
    );

    this.initThree();
    this.initControls();
    this.waveState = 'home';
    this.startLoop();
  }

  private initThree() {
    // 1. Detect software WebGL per Three.js directive
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Setup WebGLRenderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.renderer.setSize(width, height);
    this.container.appendChild(this.renderer.domElement);

    // 3. Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 150);
    this.camera.position.set(0, 1.65, 0); // Player eye level standing at outpost

    // 4. Mandatory Studio Environment Reflection (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Setup Winter Environment
    this.env = setupEnvironment(this.scene, this.isSoftwareGl);

    // 6. First-Person Hand ViewModel attached to camera
    this.viewModel = new PlayerViewModel();
    this.camera.add(this.viewModel.group);
    this.scene.add(this.camera);

    this.clock = new THREE.Clock();

    // Resize listener
    window.addEventListener('resize', this.onWindowResize);
  }

  private onWindowResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private initControls() {
    const canvas = this.renderer.domElement;

    // Pointer Lock on click
    canvas.addEventListener('click', () => {
      if (!this.isPointerLocked && !this.isPaused && this.waveState !== 'home') {
        canvas.requestPointerLock?.();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === canvas;
    });

    // Mouse movement
    window.addEventListener('mousemove', (e) => {
      if (this.isPointerLocked) {
        const factor = 0.0022 * this.settings.mouseSensitivity;
        this.yaw -= e.movementX * factor;
        const pitchDelta = e.movementY * factor * (this.settings.invertY ? -1 : 1);
        this.pitch = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, this.pitch - pitchDelta));
        this.updateCameraRotation();
      } else if (this.isDragging) {
        const deltaX = e.clientX - this.previousMousePosition.x;
        const deltaY = e.clientY - this.previousMousePosition.y;
        this.previousMousePosition = { x: e.clientX, y: e.clientY };

        const factor = 0.0035 * this.settings.mouseSensitivity;
        this.yaw -= deltaX * factor;
        const pitchDelta = deltaY * factor * (this.settings.invertY ? -1 : 1);
        this.pitch = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, this.pitch - pitchDelta));
        this.updateCameraRotation();
      }
    });

    // Drag-to-look fallback
    canvas.addEventListener('mousedown', (e) => {
      if (!this.isPointerLocked && e.button === 0) {
        this.isDragging = true;
        this.previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    // Touch support for mobile/tablets
    let touchStartX = 0;
    let touchStartY = 0;
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const dx = touch.clientX - touchStartX;
        const dy = touch.clientY - touchStartY;
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;

        const factor = 0.004 * this.settings.mouseSensitivity;
        this.yaw -= dx * factor;
        const pitchDelta = dy * factor * (this.settings.invertY ? -1 : 1);
        this.pitch = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, this.pitch - pitchDelta));
        this.updateCameraRotation();
      }
    }, { passive: true });

    // Keyboard bindings (WASD / Arrows to turn, Space or Left Click to throw)
    window.addEventListener('keydown', (e) => {
      this.keysDown.add(e.code);

      if (e.code === 'KeyF' || e.code === 'KeyE') {
        // Quick Turn assist key: snap to face nearest threat!
        this.snapToNearestThreat();
      } else if (e.code === 'Space') {
        e.preventDefault();
        this.throwSnowball();
      } else if (e.code === 'Digit1') {
        this.selectSnowball('standard');
      } else if (e.code === 'Digit2' && this.player.unlockedSnowballs.frost_shard) {
        this.selectSnowball('frost_shard');
      } else if (e.code === 'Digit3' && this.player.unlockedSnowballs.heavy_boulder) {
        this.selectSnowball('heavy_boulder');
      } else if (e.code === 'Digit4' && this.player.unlockedSnowballs.blizzard_burst) {
        this.selectSnowball('blizzard_burst');
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keysDown.delete(e.code);
    });

    // Click to shoot
    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0 && this.isPointerLocked) {
        this.throwSnowball();
      }
    });
  }

  private updateCameraRotation() {
    this.camera.rotation.set(0, 0, 0);
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }

  /**
   * Snaps the camera yaw to directly face the nearest approaching threat.
   * Prominently highlighted in the central HUD.
   */
  public snapToNearestThreat() {
    if (this.monsters.length === 0) return;

    let nearest: Monster | null = null;
    let minDist = Infinity;

    for (const m of this.monsters) {
      const d = m.position.length();
      if (d < minDist) {
        minDist = d;
        nearest = m;
      }
    }

    if (nearest) {
      // Calculate world angle to monster
      // In Three.js: forward is -Z. atan2(-x, -z) gives heading facing that coordinate
      const targetAngle = Math.atan2(-nearest.position.x, -nearest.position.z);
      this.targetYaw = targetAngle;
      this.snapProgress = 0;
      sound.playSnapTurn();
    }
  }

  public selectSnowball(type: SnowballType) {
    if (this.player.unlockedSnowballs[type]) {
      this.player.selectedSnowball = type;
      this.viewModel.setSnowballType(type);
      this.callbacks.onPlayerUpdate({ ...this.player });
    }
  }

  public throwSnowball() {
    if (this.isPaused || this.player.warmth <= 0 || this.waveState === 'home') return;

    const now = performance.now() / 1000;
    if (now - this.lastShootTime < this.shootCooldown) return;
    this.lastShootTime = now;

    // Check special charges
    const type = this.player.selectedSnowball;
    if (type !== 'standard') {
      if (this.player.specialCharges[type] <= 0) {
        this.selectSnowball('standard');
        return;
      }
      this.player.specialCharges[type]--;
      this.callbacks.onPlayerUpdate({ ...this.player });
    }

    // Trigger FPS hand throw animation
    this.viewModel.triggerThrow();
    sound.playThrow(type);

    // Get camera forward vector
    this.camera.getWorldDirection(_camDir);

    // Spawn snowball slightly in front of camera
    const spawnPos = this.camera.position.clone().addScaledVector(_camDir, 0.8);
    // Slight downward offset to match hand throw trajectory
    spawnPos.y -= 0.15;

    let mesh: THREE.Mesh;
    let speed = 28;
    let gravity = 9.8;
    let damage = 30;
    let radius = 0.25;

    if (type === 'frost_shard') {
      mesh = new THREE.Mesh(this.iceShardGeo, this.iceShardMat);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), _camDir);
      speed = 42; // Fast, piercing
      gravity = 4.0;
      damage = 70;
      radius = 0.3;
    } else if (type === 'heavy_boulder') {
      mesh = new THREE.Mesh(this.heavyBoulderGeo, this.heavyBoulderMat);
      speed = 22; // Heavy arc
      gravity = 14.0;
      damage = 140;
      radius = 0.55;
    } else if (type === 'blizzard_burst') {
      mesh = new THREE.Mesh(this.snowballGeo, this.iceShardMat);
      speed = 30;
      gravity = 6.0;
      damage = 90;
      radius = 0.45;
    } else {
      mesh = new THREE.Mesh(this.snowballGeo, this.snowballMat);
      speed = 28;
      gravity = 9.8;
      damage = 35;
      radius = 0.25;
    }

    mesh.position.copy(spawnPos);
    mesh.castShadow = !this.isSoftwareGl;
    this.scene.add(mesh);

    // Forward velocity with slight upward loft for satisfying arc
    const velocity = _camDir.clone().multiplyScalar(speed);
    velocity.y += 1.8;

    const snowball: Snowball = {
      id: Math.random().toString(),
      type,
      mesh,
      position: mesh.position,
      velocity,
      gravity,
      damage,
      radius,
      life: 0,
      maxLife: 3.5, // 3.5 seconds max flight
    };

    this.snowballs.push(snowball);

    // Update stats
    this.stats.snowballsThrown++;
    this.calculateAccuracy();
    this.callbacks.onStatsUpdate({ ...this.stats });
  }

  private calculateAccuracy() {
    if (this.stats.snowballsThrown > 0) {
      this.stats.accuracy = Math.round((this.stats.snowballsHit / this.stats.snowballsThrown) * 100);
    }
  }

  public startWave(waveNum: number) {
    this.wave = waveNum;
    this.stats.wave = waveNum;
    this.waveEnemiesTotal = 4 + waveNum * 3;
    if (waveNum === 5 || waveNum % 5 === 0) {
      this.waveEnemiesTotal += 2; // Extra for boss wave
    }
    this.waveEnemiesSpawned = 0;
    this.waveSpawnTimer = 0.8;
    this.waveState = 'spawning';

    sound.playWaveHorn();

    // Check snowball unlocks
    if (waveNum >= 2 && !this.player.unlockedSnowballs.frost_shard) {
      this.player.unlockedSnowballs.frost_shard = true;
      this.player.specialCharges.frost_shard = 10;
    }
    if (waveNum >= 3 && !this.player.unlockedSnowballs.heavy_boulder) {
      this.player.unlockedSnowballs.heavy_boulder = true;
      this.player.specialCharges.heavy_boulder = 8;
    }
    if (waveNum >= 4 && !this.player.unlockedSnowballs.blizzard_burst) {
      this.player.unlockedSnowballs.blizzard_burst = true;
      this.player.specialCharges.blizzard_burst = 5;
    }

    this.callbacks.onStatsUpdate({ ...this.stats });
    this.callbacks.onPlayerUpdate({ ...this.player });
  }

  private spawnHordeEnemy() {
    // 360-degree approach from all directions!
    const angle = Math.random() * Math.PI * 2;
    const distance = 26 + Math.random() * 12; // Spawn 26m - 38m out
    const spawnX = Math.cos(angle) * distance;
    const spawnZ = Math.sin(angle) * distance;
    const spawnPos = new THREE.Vector3(spawnX, 0, spawnZ);

    // Determine type based on wave
    let type: MonsterType = 'scout';
    const rand = Math.random();

    if (this.wave >= 5 && this.waveEnemiesSpawned === this.waveEnemiesTotal - 1) {
      type = 'boss'; // Boss at end of wave 5
    } else if (this.wave >= 3 && rand > 0.65) {
      type = 'stalker';
    } else if (this.wave >= 2 && rand > 0.4) {
      type = 'golem';
    } else {
      type = 'scout';
    }

    const monster = createMonster(Math.random().toString(), type, spawnPos);
    this.scene.add(monster.group);
    this.monsters.push(monster);
    this.waveEnemiesSpawned++;
  }

  private updateMonsters(delta: number) {
    // Spawn queue
    if (this.waveState === 'spawning') {
      this.waveSpawnTimer -= delta;
      if (this.waveSpawnTimer <= 0) {
        this.spawnHordeEnemy();
        // Stagger next spawn
        this.waveSpawnTimer = Math.max(0.6, 2.2 - this.wave * 0.15);
        if (this.waveEnemiesSpawned >= this.waveEnemiesTotal) {
          this.waveState = 'active';
        }
      }
    }

    // Update active monsters
    for (let i = this.monsters.length - 1; i >= 0; i--) {
      const m = this.monsters[i];

      // Move toward player outpost center (0, 0, 0)
      _v1.set(0, 0, 0).sub(m.position);
      const distToCenter = _v1.length();

      // Flocking / separation from other monsters
      _v2.set(0, 0, 0);
      for (let j = 0; j < this.monsters.length; j++) {
        if (i !== j) {
          const other = this.monsters[j];
          const sep = m.position.distanceTo(other.position);
          if (sep < m.radius + other.radius + 0.5 && sep > 0.01) {
            _monsterDir.copy(m.position).sub(other.position).normalize();
            _v2.addScaledVector(_monsterDir, 1.2 / sep);
          }
        }
      }

      if (distToCenter > 1.8) {
        // Walk toward center on the flat snow ground plane
        _v1.y = 0;
        _v1.normalize();
        _v2.y = 0;
        _v1.addScaledVector(_v2, 0.4);
        _v1.y = 0;
        _v1.normalize();
        m.position.addScaledVector(_v1, m.speed * delta);
        m.position.y = 0; // Lock monster flush to the ground plane

        // Face forward direction of travel
        m.group.rotation.y = Math.atan2(_v1.x, _v1.z);
      } else {
        // At player perimeter! Attack player
        m.attackCooldown -= delta;
        if (m.attackCooldown <= 0) {
          m.attackCooldown = 1.4;
          this.damagePlayer(m.type === 'boss' ? 30 : m.type === 'golem' ? 18 : 10);
        }
      }

      // Procedural animations
      updateMonsterAnimation(m, delta);
    }

    // Check if wave cleared
    if (this.waveState === 'active' && this.monsters.length === 0) {
      this.waveState = 'intermission';
      this.intermissionTimer = 3.0;
      this.callbacks.onWaveComplete(this.wave);
    } else if (this.waveState === 'intermission') {
      this.intermissionTimer -= delta;
      if (this.intermissionTimer <= 0) {
        this.startWave(this.wave + 1);
      }
    }
  }

  private damagePlayer(amount: number) {
    this.player.warmth = Math.max(0, this.player.warmth - amount);
    sound.playPlayerDamage();
    this.callbacks.onPlayerUpdate({ ...this.player });

    if (this.player.warmth <= 0) {
      this.gameOver(false);
    }
  }

  private updateSnowballs(delta: number) {
    for (let i = this.snowballs.length - 1; i >= 0; i--) {
      const sb = this.snowballs[i];
      sb.life += delta;

      // Gravity & position update
      sb.velocity.y -= sb.gravity * delta;
      sb.position.addScaledVector(sb.velocity, delta);
      sb.mesh.position.copy(sb.position);

      // Check ground collision
      if (sb.position.y <= 0.1) {
        this.createSnowSplat(sb.position, 6, 0xdff0fc);
        sound.playHit(false);
        this.removeSnowball(i);
        continue;
      }

      // Check max life expiry
      if (sb.life >= sb.maxLife) {
        this.removeSnowball(i);
        continue;
      }

      // Check collision against monsters
      let hit = false;
      for (let mIdx = this.monsters.length - 1; mIdx >= 0; mIdx--) {
        const monster = this.monsters[mIdx];
        const dist = sb.position.distanceTo(monster.position.clone().add(new THREE.Vector3(0, monster.height * 0.5, 0)));

        if (dist < sb.radius + monster.radius) {
          // Hit detected!
          hit = true;
          this.stats.snowballsHit++;
          this.calculateAccuracy();

          // Damage monster
          monster.health -= sb.damage;
          flashMonsterHit(monster);
          sound.playHit(monster.health <= 0);

          // Impact burst particles
          this.createSnowSplat(sb.position, 12, sb.type === 'frost_shard' ? 0x38bdf8 : 0xffffff);

          if (monster.health <= 0) {
            // Monster defeated!
            sound.playMonsterDefeated(monster.type === 'boss');
            this.stats.monstersDefeated++;
            this.stats.combo++;
            this.stats.maxCombo = Math.max(this.stats.maxCombo, this.stats.combo);
            this.stats.comboTimer = 3.5; // Combo window

            const comboMultiplier = 1 + (this.stats.combo - 1) * 0.2;
            const pts = Math.round(monster.scoreValue * comboMultiplier);
            this.stats.score += pts;
            if (this.stats.score > this.stats.highScore) {
              this.stats.highScore = this.stats.score;
              localStorage.setItem('frostbite_high_score', this.stats.highScore.toString());
            }

            // Shatter monster into ice chunks
            this.createMonsterShatter(monster);

            // Reward special ammo on combo
            if (this.stats.combo % 3 === 0) {
              this.player.specialCharges.frost_shard = Math.min(15, this.player.specialCharges.frost_shard + 3);
              this.player.specialCharges.heavy_boulder = Math.min(8, this.player.specialCharges.heavy_boulder + 2);
              this.callbacks.onPlayerUpdate({ ...this.player });
              sound.playCombo(this.stats.combo);
            }

            // Remove monster from scene and free its geometry
            disposeMonster(monster);
            this.monsters.splice(mIdx, 1);
          }

          this.callbacks.onStatsUpdate({ ...this.stats });
          this.removeSnowball(i);
          break;
        }
      }
    }
  }

  private removeSnowball(index: number) {
    const sb = this.snowballs[index];
    // Geometry and material are shared across all snowballs, so only remove the mesh
    this.scene.remove(sb.mesh);
    this.snowballs.splice(index, 1);
  }

  private createSnowSplat(position: THREE.Vector3, count: number, colorHex: number) {
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.particleGeo, this.getSplatMat(colorHex));
      mesh.position.copy(position);
      mesh.scale.setScalar(0.4 + Math.random() * 0.8);
      this.scene.add(mesh);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        Math.random() * 4 + 1,
        (Math.random() - 0.5) * 5
      );

      this.impactParticles.push({
        mesh,
        velocity: vel,
        rotationSpeed: new THREE.Vector3(Math.random() * 10, Math.random() * 10, Math.random() * 10),
        life: 0,
        maxLife: 0.5 + Math.random() * 0.4,
        color: new THREE.Color(colorHex),
      });
    }
  }

  private getSplatMat(colorHex: number): THREE.MeshBasicMaterial {
    let mat = this.splatMats.get(colorHex);
    if (!mat) {
      mat = new THREE.MeshBasicMaterial({ color: colorHex });
      this.splatMats.set(colorHex, mat);
    }
    return mat;
  }

  private createMonsterShatter(monster: Monster) {
    const count = monster.type === 'boss' ? 36 : 18;
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.particleGeo, this.shatterMats[Math.random() > 0.4 ? 0 : 1]);
      mesh.position.copy(monster.position);
      mesh.position.y += Math.random() * monster.height;
      mesh.scale.setScalar(0.8 + Math.random() * 1.2);
      this.scene.add(mesh);

      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 6;
      const vel = new THREE.Vector3(
        Math.cos(angle) * speed,
        Math.random() * 5 + 2,
        Math.sin(angle) * speed
      );

      this.impactParticles.push({
        mesh,
        velocity: vel,
        rotationSpeed: new THREE.Vector3(Math.random() * 8, Math.random() * 8, Math.random() * 8),
        life: 0,
        maxLife: 0.8 + Math.random() * 0.5,
        color: new THREE.Color(0x7dd3fc),
      });
    }
  }

  private updateParticles(delta: number) {
    for (let i = this.impactParticles.length - 1; i >= 0; i--) {
      const p = this.impactParticles[i];
      p.life += delta;

      if (p.life >= p.maxLife) {
        this.scene.remove(p.mesh); // geometry and material are shared
        this.impactParticles.splice(i, 1);
        continue;
      }

      p.velocity.y -= 14 * delta;
      p.mesh.position.addScaledVector(p.velocity, delta);
      p.mesh.rotation.x += p.rotationSpeed.x * delta;
      p.mesh.rotation.y += p.rotationSpeed.y * delta;

      const scale = Math.max(0.01, 1 - (p.life / p.maxLife));
      p.mesh.scale.setScalar(scale);
    }
  }

  /**
   * Calculates the central threat radar & directional pointing info.
   * This provides the data for the prominent central interface!
   */
  private updateThreatInterface() {
    this.camera.getWorldDirection(_camDir);

    // Camera forward heading on XZ plane:
    // When looking toward -Z, cameraYaw = 0.
    const camAngle = Math.atan2(_camDir.x, -_camDir.z);

    let nearestThreat: ThreatInfo['nearestMonster'] = null;
    let minDistance = Infinity;

    const allThreats: ThreatInfo['allThreats'] = [];

    for (const m of this.monsters) {
      // Vector from player (0,0) to monster
      const dx = m.position.x;
      const dz = m.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      // World angle to monster (atan2(dx, -dz) so 0 is -Z, positive is to the right +X)
      const monsterAngle = Math.atan2(dx, -dz);

      // Relative angle in radians
      let relAngle = monsterAngle - camAngle;
      // Normalize to [-PI, +PI]
      while (relAngle > Math.PI) relAngle -= Math.PI * 2;
      while (relAngle < -Math.PI) relAngle += Math.PI * 2;

      const relDeg = (relAngle * 180) / Math.PI;

      // Urgency level
      const urgency = dist < 7 ? 'critical' : dist < 14 ? 'warning' : 'normal';

      allThreats.push({
        id: m.id,
        type: m.type,
        distance: Math.round(dist * 10) / 10,
        relativeAngleDeg: Math.round(relDeg),
        urgency,
      });

      if (dist < minDistance) {
        minDistance = dist;

        // Screen projection to check if visible in viewport
        _screenPos.copy(m.position);
        _screenPos.y += m.height * 0.5;
        _screenPos.project(this.camera);

        const isInView = _screenPos.z < 1 && 
                         Math.abs(_screenPos.x) < 0.85 && 
                         Math.abs(_screenPos.y) < 0.85;

        // Direction text label
        let directionLabel = '';
        const absDeg = Math.abs(relDeg);

        if (absDeg < 12) {
          directionLabel = 'TARGET IN SIGHT';
        } else if (absDeg > 145) {
          directionLabel = 'BEHIND YOU!';
        } else if (relDeg > 0) {
          directionLabel = `TURN RIGHT ${Math.round(relDeg)}°`;
        } else {
          directionLabel = `TURN LEFT ${Math.round(-relDeg)}°`;
        }

        nearestThreat = {
          id: m.id,
          type: m.type,
          distance: Math.round(dist * 10) / 10,
          relativeAngleDeg: Math.round(relDeg),
          directionLabel,
          urgency,
          screenX: _screenPos.x,
          screenY: _screenPos.y,
          isInView,
        };
      }
    }

    // Pass threat info to the central UI
    this.callbacks.onThreatUpdate({
      nearestMonster: nearestThreat,
      allThreats,
      totalEnemies: this.monsters.length,
    });
  }

  private updateControls(delta: number) {
    // Keyboard turning with Arrow keys / A and D
    const turnSpeed = 2.4 * this.settings.mouseSensitivity;
    if (this.keysDown.has('KeyA') || this.keysDown.has('ArrowLeft')) {
      this.yaw += turnSpeed * delta;
      this.updateCameraRotation();
    }
    if (this.keysDown.has('KeyD') || this.keysDown.has('ArrowRight')) {
      this.yaw -= turnSpeed * delta;
      this.updateCameraRotation();
    }
    if (this.keysDown.has('KeyW') || this.keysDown.has('ArrowUp')) {
      this.pitch = Math.min(Math.PI / 2.3, this.pitch + turnSpeed * 0.6 * delta);
      this.updateCameraRotation();
    }
    if (this.keysDown.has('KeyS') || this.keysDown.has('ArrowDown')) {
      this.pitch = Math.max(-Math.PI / 2.3, this.pitch - turnSpeed * 0.6 * delta);
      this.updateCameraRotation();
    }

    // Smooth Snap-To-Threat interpolation if triggered
    if (this.targetYaw !== null) {
      this.snapProgress += delta * 7.0; // snappy smooth rotation
      // Shortest angle difference
      let diff = this.targetYaw - this.yaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;

      this.yaw += diff * Math.min(1.0, delta * 12.0);
      this.updateCameraRotation();

      if (Math.abs(diff) < 0.03 || this.snapProgress >= 1.0) {
        this.yaw = this.targetYaw;
        this.targetYaw = null;
        this.updateCameraRotation();
      }
    }
  }

  private startLoop() {
    this.isRunning = true;

    // Software WebGL pacing per directive 2.3
    const afterDraw = (cb: () => void) => {
      const gl = this.renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          this.frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          this.frameId = window.setTimeout(cb, 80);
        }
      };
      this.frameId = window.setTimeout(poll, 5);
    };

    const tick = () => {
      if (!this.isRunning) return;

      const delta = Math.min(0.1, this.clock.getDelta());
      const time = this.clock.getElapsedTime();

      if (this.waveState === 'home') {
        // Slow ambient pan in background of home screen
        this.yaw += 0.05 * delta;
        this.pitch = THREE.MathUtils.damp(this.pitch, 0.02, 3, delta);
        this.updateCameraRotation();
        this.env.updateParticles(delta);
        this.env.updateBrazier(time);
        this.viewModel.update(delta, false);
      } else if (!this.isPaused) {
        // Combo timer countdown
        if (this.stats.comboTimer > 0) {
          this.stats.comboTimer -= delta;
          if (this.stats.comboTimer <= 0) {
            this.stats.combo = 0;
            this.callbacks.onStatsUpdate({ ...this.stats });
          }
        }

        this.updateControls(delta);
        this.updateMonsters(delta);
        this.updateSnowballs(delta);
        this.updateParticles(delta);
        this.env.updateParticles(delta);
        this.env.updateBrazier(time);
        this.viewModel.update(delta, false);
        this.updateThreatInterface();
      }

      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      afterDraw(tick);
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  public setPaused(paused: boolean) {
    this.isPaused = paused;
  }

  public gameOver(won: boolean) {
    this.isPaused = true;
    this.callbacks.onGameOver(won);
  }

  /** Removes all monsters, snowballs and particles from the scene. */
  private clearEntities() {
    for (const m of this.monsters) disposeMonster(m);
    this.monsters = [];
    for (const s of this.snowballs) this.scene.remove(s.mesh);
    this.snowballs = [];
    for (const p of this.impactParticles) this.scene.remove(p.mesh);
    this.impactParticles = [];
  }

  public restartGame() {
    this.clearEntities();

    // Reset stats
    this.stats = {
      score: 0,
      highScore: this.stats.highScore,
      wave: 1,
      snowballsThrown: 0,
      snowballsHit: 0,
      accuracy: 0,
      monstersDefeated: 0,
      combo: 0,
      maxCombo: 0,
      comboTimer: 0,
    };

    // Reset player
    this.player = {
      warmth: 100,
      maxWarmth: 100,
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
    };

    this.yaw = 0;
    this.pitch = 0;
    this.updateCameraRotation();

    this.isPaused = false;
    this.startWave(1);
    this.callbacks.onStatsUpdate({ ...this.stats });
    this.callbacks.onPlayerUpdate({ ...this.player });
  }

  public startLevel() {
    this.restartGame();
    this.waveState = 'spawning';
    this.renderer.domElement.requestPointerLock?.();
  }

  public returnToHome() {
    this.clearEntities();

    this.player.warmth = 100;
    this.waveState = 'home';
    this.isPaused = false;
    this.yaw = 0;
    this.pitch = 0;
    this.updateCameraRotation();
    if (document.pointerLockElement) {
      document.exitPointerLock?.();
    }
    this.callbacks.onThreatUpdate({
      nearestMonster: null,
      allThreats: [],
      totalEnemies: 0,
    });
    this.callbacks.onPlayerUpdate({ ...this.player });
  }

  public dispose() {
    this.isRunning = false;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    window.removeEventListener('resize', this.onWindowResize);

    this.clearEntities();
    this.env.dispose();
    this.viewModel.dispose();
    this.snowballGeo.dispose();
    this.snowballMat.dispose();
    this.iceShardGeo.dispose();
    this.iceShardMat.dispose();
    this.heavyBoulderGeo.dispose();
    this.heavyBoulderMat.dispose();
    this.particleGeo.dispose();
    this.splatMats.forEach((m) => m.dispose());
    this.shatterMats.forEach((m) => m.dispose());
    this.renderer.dispose();
  }
}
