import * as THREE from 'three';
import { SnowballType } from './types';

export class PlayerViewModel {
  public group: THREE.Group;
  private handGroup: THREE.Group;
  private snowballMesh: THREE.Mesh;
  private animState: 'idle' | 'throw' | 'reload' = 'idle';
  private animTimer: number = 0;
  private snowballMatStandard: THREE.MeshStandardMaterial;
  private snowballMatIce: THREE.MeshStandardMaterial;
  private snowballMatBoulder: THREE.MeshStandardMaterial;

  constructor() {
    this.group = new THREE.Group();
    this.handGroup = new THREE.Group();

    // Default viewmodel offset (bottom-right of camera)
    this.handGroup.position.set(0.32, -0.28, -0.55);
    this.handGroup.rotation.set(-0.1, -0.2, 0.05);

    // Glove: Winter tactical mitten (3 parts: forearm cuff, palm mitten, thumb)
    const gloveMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.85,
      metalness: 0.1,
    });

    const cuffMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.6,
      metalness: 0.2,
    });

    // 1. Forearm sleeve
    const armGeo = new THREE.CylinderGeometry(0.075, 0.09, 0.45, 8);
    armGeo.rotateX(Math.PI / 2.8);
    const armMesh = new THREE.Mesh(armGeo, gloveMat);
    armMesh.position.set(0.08, -0.15, 0.25);
    this.handGroup.add(armMesh);

    // 2. Wrist cuff
    const cuffGeo = new THREE.TorusGeometry(0.082, 0.02, 6, 12);
    cuffGeo.rotateX(Math.PI / 2.8);
    const cuffMesh = new THREE.Mesh(cuffGeo, cuffMat);
    cuffMesh.position.set(0.07, -0.06, 0.12);
    this.handGroup.add(cuffMesh);

    // 3. Palm mitten
    const palmGeo = new THREE.SphereGeometry(0.09, 8, 8);
    palmGeo.scale(1.1, 0.85, 1.3);
    const palmMesh = new THREE.Mesh(palmGeo, gloveMat);
    palmMesh.position.set(0.02, 0, 0);
    this.handGroup.add(palmMesh);

    // 4. Thumb
    const thumbGeo = new THREE.CapsuleGeometry(0.035, 0.08, 4, 8);
    const thumbMesh = new THREE.Mesh(thumbGeo, gloveMat);
    thumbMesh.position.set(-0.08, 0.04, -0.02);
    thumbMesh.rotation.set(0.3, 0.4, -0.6);
    this.handGroup.add(thumbMesh);

    // Snowball Materials
    this.snowballMatStandard = new THREE.MeshStandardMaterial({
      color: 0xf0f9ff,
      roughness: 0.8,
      metalness: 0.05,
    });

    this.snowballMatIce = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.2,
      metalness: 0.6,
    });

    this.snowballMatBoulder = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.95,
      metalness: 0.1,
    });

    // Snowball in hand
    const ballGeo = new THREE.DodecahedronGeometry(0.08, 2);
    this.snowballMesh = new THREE.Mesh(ballGeo, this.snowballMatStandard);
    this.snowballMesh.position.set(0, 0.06, -0.05);
    this.handGroup.add(this.snowballMesh);

    this.group.add(this.handGroup);
  }

  public setSnowballType(type: SnowballType) {
    if (type === 'frost_shard') {
      this.snowballMesh.material = this.snowballMatIce;
      this.snowballMesh.scale.set(0.9, 1.4, 0.9);
    } else if (type === 'heavy_boulder') {
      this.snowballMesh.material = this.snowballMatBoulder;
      this.snowballMesh.scale.set(1.4, 1.4, 1.4);
    } else if (type === 'blizzard_burst') {
      this.snowballMesh.material = this.snowballMatIce;
      this.snowballMesh.scale.set(1.1, 1.1, 1.1);
    } else {
      this.snowballMesh.material = this.snowballMatStandard;
      this.snowballMesh.scale.set(1.0, 1.0, 1.0);
    }
  }

  public triggerThrow() {
    this.animState = 'throw';
    this.animTimer = 0;
  }

  public update(delta: number, isMoving: boolean = false) {
    this.animTimer += delta;

    if (this.animState === 'idle') {
      // Gentle breathing idle sway
      const swayX = Math.sin(this.animTimer * 2.2) * 0.006;
      const swayY = Math.cos(this.animTimer * 4.4) * 0.005;
      const walkBob = isMoving ? Math.sin(this.animTimer * 8) * 0.015 : 0;

      this.handGroup.position.set(
        0.32 + swayX,
        -0.28 + swayY + walkBob,
        -0.55
      );
      this.handGroup.rotation.set(-0.1, -0.2, 0.05);
      this.snowballMesh.visible = true;

    } else if (this.animState === 'throw') {
      const throwDuration = 0.28;
      const progress = this.animTimer / throwDuration;

      if (progress < 0.25) {
        // Wind up / draw back
        const p = progress / 0.25;
        this.handGroup.position.set(
          0.35 + p * 0.05,
          -0.24 + p * 0.08,
          -0.45 + p * 0.1
        );
        this.handGroup.rotation.x = -0.1 - p * 0.3;
      } else if (progress < 0.6) {
        // Thrust forward
        const p = (progress - 0.25) / 0.35;
        this.handGroup.position.set(
          0.3 + (1 - p) * 0.05,
          -0.2 - p * 0.05,
          -0.35 - p * 0.25
        );
        this.handGroup.rotation.x = -0.4 + p * 0.6;
        if (progress > 0.45) {
          this.snowballMesh.visible = false; // Snowball released!
        }
      } else if (progress < 1.0) {
        // Lower hand
        const p = (progress - 0.6) / 0.4;
        this.handGroup.position.y = -0.25 - p * 0.15;
      } else {
        // Transition to reload scoop
        this.animState = 'reload';
        this.animTimer = 0;
      }

    } else if (this.animState === 'reload') {
      const reloadDuration = 0.24;
      const progress = this.animTimer / reloadDuration;

      if (progress < 0.5) {
        // Scooping snow from bottom
        this.snowballMesh.visible = false;
        this.handGroup.position.set(0.28, -0.42, -0.48);
        this.handGroup.rotation.set(-0.4, -0.1, 0.2);
      } else if (progress < 1.0) {
        // Packing and bringing back up
        this.snowballMesh.visible = true;
        const p = (progress - 0.5) / 0.5;
        this.handGroup.position.set(
          0.28 + p * 0.04,
          -0.42 + p * 0.14,
          -0.48 - p * 0.07
        );
        this.handGroup.rotation.set(-0.4 + p * 0.3, -0.1 - p * 0.1, 0.2 - p * 0.15);
      } else {
        this.animState = 'idle';
        this.animTimer = 0;
      }
    }
  }

  public dispose() {
    this.snowballMatStandard.dispose();
    this.snowballMatIce.dispose();
    this.snowballMatBoulder.dispose();
  }
}
