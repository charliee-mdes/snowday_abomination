import * as THREE from 'three';
import { Monster, MonsterType } from './types';

// Materials pool for performance (low garbage collection)
const snowWhiteMat = new THREE.MeshStandardMaterial({
  color: 0xedf4fc,
  roughness: 0.85,
  metalness: 0.05,
});

const deepIceMat = new THREE.MeshStandardMaterial({
  color: 0x7dd3fc,
  roughness: 0.25,
  metalness: 0.45,
});

const darkCoalMat = new THREE.MeshStandardMaterial({
  color: 0x1e293b,
  roughness: 0.9,
  metalness: 0.1,
});

const glowingEyeCyan = new THREE.MeshBasicMaterial({
  color: 0x38bdf8,
});

const glowingEyeRed = new THREE.MeshBasicMaterial({
  color: 0xf43f5e,
});

const glowingEyeAmber = new THREE.MeshBasicMaterial({
  color: 0xfbbf24,
});

const hitFlashMat = new THREE.MeshBasicMaterial({
  color: 0xffffff,
});

/**
 * Creates a procedural 3-12 part Monster composite model based on type.
 * Pivots are aligned so mesh base sits at Y = 0.
 */
export function createMonster(id: string, type: MonsterType, spawnPosition: THREE.Vector3): Monster {
  const group = new THREE.Group();
  group.position.copy(spawnPosition);

  const parts: Monster['parts'] = {};
  let health = 30;
  let speed = 2.4;
  let radius = 1.0;
  let scoreValue = 100;
  let height = 2.0;

  if (type === 'scout') {
    // Frost Imp / Goblin: Quick, nimble, 6 distinct parts
    health = 30; // 1 snowball hit
    speed = 3.2;
    radius = 0.9;
    scoreValue = 100;
    height = 1.8;

    // 1. Lower body / hip
    const bodyGeo = new THREE.SphereGeometry(0.55, 8, 8);
    const bodyMesh = new THREE.Mesh(bodyGeo, snowWhiteMat);
    bodyMesh.position.y = 0.9;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    group.add(bodyMesh);
    parts.body = bodyMesh;

    // 2. Head with ice snout
    const headGeo = new THREE.DodecahedronGeometry(0.42, 1);
    const headMesh = new THREE.Mesh(headGeo, deepIceMat);
    headMesh.position.set(0, 1.55, 0.1);
    headMesh.castShadow = true;
    group.add(headMesh);
    parts.head = headMesh;

    // 3. Glowing icicle eyes
    const eyeGeo = new THREE.SphereGeometry(0.08, 6, 6);
    const leftEye = new THREE.Mesh(eyeGeo, glowingEyeRed);
    leftEye.position.set(-0.16, 0.08, 0.35);
    const rightEye = new THREE.Mesh(eyeGeo, glowingEyeRed);
    rightEye.position.set(0.16, 0.08, 0.35);
    headMesh.add(leftEye);
    headMesh.add(rightEye);
    parts.eyes = [leftEye, rightEye];

    // 4. Back ice quills / spikes (accent detail)
    const quillGeo = new THREE.ConeGeometry(0.12, 0.5, 4);
    for (let i = 0; i < 3; i++) {
      const quill = new THREE.Mesh(quillGeo, deepIceMat);
      quill.position.set(0, 1.1 + i * 0.25, -0.4);
      quill.rotation.x = -Math.PI / 3;
      group.add(quill);
    }

    // 5. Left Arm with ice claw
    const armGeo = new THREE.CylinderGeometry(0.1, 0.14, 0.65, 6);
    armGeo.translate(0, -0.3, 0); // pivot at shoulder
    const leftArm = new THREE.Mesh(armGeo, snowWhiteMat);
    leftArm.position.set(-0.65, 1.25, 0);
    leftArm.castShadow = true;
    group.add(leftArm);
    parts.leftArm = leftArm;

    // 6. Right Arm with ice claw
    const rightArm = new THREE.Mesh(armGeo, snowWhiteMat);
    rightArm.position.set(0.65, 1.25, 0);
    rightArm.castShadow = true;
    group.add(rightArm);
    parts.rightArm = rightArm;

    // 7. Left Leg
    const legGeo = new THREE.CylinderGeometry(0.12, 0.18, 0.7, 6);
    legGeo.translate(0, -0.35, 0); // pivot at hip
    const leftLeg = new THREE.Mesh(legGeo, deepIceMat);
    leftLeg.position.set(-0.28, 0.7, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);
    parts.leftLeg = leftLeg;

    // 8. Right Leg
    const rightLeg = new THREE.Mesh(legGeo, deepIceMat);
    rightLeg.position.set(0.28, 0.7, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);
    parts.rightLeg = rightLeg;

  } else if (type === 'golem') {
    // Abominable Snow Golem: Heavy, 9 parts, takes 3 hits
    health = 90;
    speed = 1.7;
    radius = 1.4;
    scoreValue = 250;
    height = 2.8;

    // 1. Massive bottom snow base
    const baseGeo = new THREE.DodecahedronGeometry(0.9, 2);
    const baseMesh = new THREE.Mesh(baseGeo, snowWhiteMat);
    baseMesh.position.y = 0.8;
    baseMesh.scale.set(1.1, 0.9, 1.1);
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    group.add(baseMesh);

    // 2. Chest torso boulder
    const chestGeo = new THREE.DodecahedronGeometry(0.75, 2);
    const chestMesh = new THREE.Mesh(chestGeo, snowWhiteMat);
    chestMesh.position.y = 1.8;
    chestMesh.castShadow = true;
    group.add(chestMesh);
    parts.body = chestMesh;

    // 3. Huge Head boulder with icicle brow
    const headGeo = new THREE.DodecahedronGeometry(0.55, 1);
    const headMesh = new THREE.Mesh(headGeo, deepIceMat);
    headMesh.position.set(0, 2.7, 0.1);
    headMesh.castShadow = true;
    group.add(headMesh);
    parts.head = headMesh;

    // 4. Coal burning eyes
    const eyeGeo = new THREE.BoxGeometry(0.14, 0.12, 0.12);
    const leftEye = new THREE.Mesh(eyeGeo, glowingEyeAmber);
    leftEye.position.set(-0.22, 0.1, 0.45);
    const rightEye = new THREE.Mesh(eyeGeo, glowingEyeAmber);
    rightEye.position.set(0.22, 0.1, 0.45);
    headMesh.add(leftEye);
    headMesh.add(rightEye);
    parts.eyes = [leftEye, rightEye];

    // 5. Jagged icicle teeth/mouth
    const toothGeo = new THREE.ConeGeometry(0.06, 0.22, 4);
    for (let i = -2; i <= 2; i++) {
      const tooth = new THREE.Mesh(toothGeo, deepIceMat);
      tooth.position.set(i * 0.1, -0.22, 0.45);
      tooth.rotation.x = Math.PI;
      headMesh.add(tooth);
    }

    // 6. Left Ice Club Arm (heavy)
    const armGeo = new THREE.CylinderGeometry(0.2, 0.32, 1.1, 6);
    armGeo.translate(0, -0.55, 0);
    const leftArm = new THREE.Mesh(armGeo, deepIceMat);
    leftArm.position.set(-1.0, 2.1, 0);
    leftArm.castShadow = true;
    group.add(leftArm);
    parts.leftArm = leftArm;

    // 7. Right Ice Club Arm
    const rightArm = new THREE.Mesh(armGeo, deepIceMat);
    rightArm.position.set(1.0, 2.1, 0);
    rightArm.castShadow = true;
    group.add(rightArm);
    parts.rightArm = rightArm;

    // 8 & 9. Heavy trunk leg supports
    const legGeo = new THREE.CylinderGeometry(0.25, 0.35, 0.8, 6);
    legGeo.translate(0, -0.4, 0);
    const leftLeg = new THREE.Mesh(legGeo, darkCoalMat);
    leftLeg.position.set(-0.45, 0.8, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);
    parts.leftLeg = leftLeg;

    const rightLeg = new THREE.Mesh(legGeo, darkCoalMat);
    rightLeg.position.set(0.45, 0.8, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);
    parts.rightLeg = rightLeg;

  } else if (type === 'stalker') {
    // Frost Stalker / Fiend: Crystalline, glowing, medium speed
    health = 60;
    speed = 2.6;
    radius = 1.1;
    scoreValue = 200;
    height = 2.2;

    // 1. Crystal core torso
    const chestGeo = new THREE.OctahedronGeometry(0.65, 0);
    const chestMesh = new THREE.Mesh(chestGeo, deepIceMat);
    chestMesh.position.y = 1.5;
    chestMesh.scale.set(0.8, 1.4, 0.8);
    chestMesh.castShadow = true;
    group.add(chestMesh);
    parts.body = chestMesh;

    // 2. Jagged Ice Head
    const headGeo = new THREE.ConeGeometry(0.38, 0.8, 5);
    const headMesh = new THREE.Mesh(headGeo, snowWhiteMat);
    headMesh.position.set(0, 2.3, 0.1);
    headMesh.rotation.x = Math.PI / 6;
    headMesh.castShadow = true;
    group.add(headMesh);
    parts.head = headMesh;

    // 3. Cyan Glowing Triple Eye Array
    const eyeGeo = new THREE.SphereGeometry(0.09, 6, 6);
    const leftEye = new THREE.Mesh(eyeGeo, glowingEyeCyan);
    leftEye.position.set(-0.15, -0.1, 0.28);
    const rightEye = new THREE.Mesh(eyeGeo, glowingEyeCyan);
    rightEye.position.set(0.15, -0.1, 0.28);
    const topEye = new THREE.Mesh(eyeGeo, glowingEyeCyan);
    topEye.position.set(0, 0.12, 0.25);
    headMesh.add(leftEye);
    headMesh.add(rightEye);
    headMesh.add(topEye);
    parts.eyes = [leftEye, rightEye, topEye];

    // 4. Floating Shoulder Ice Crystals
    for (let side = -1; side <= 1; side += 2) {
      const crystalGeo = new THREE.OctahedronGeometry(0.28, 0);
      const crystal = new THREE.Mesh(crystalGeo, deepIceMat);
      crystal.position.set(side * 0.85, 1.8, 0);
      group.add(crystal);
    }

    // 5. Scythe Arms
    const armGeo = new THREE.ConeGeometry(0.14, 1.0, 4);
    armGeo.translate(0, -0.5, 0);
    const leftArm = new THREE.Mesh(armGeo, deepIceMat);
    leftArm.position.set(-0.75, 1.6, 0);
    leftArm.rotation.z = 0.2;
    leftArm.castShadow = true;
    group.add(leftArm);
    parts.leftArm = leftArm;

    const rightArm = new THREE.Mesh(armGeo, deepIceMat);
    rightArm.position.set(0.75, 1.6, 0);
    rightArm.rotation.z = -0.2;
    rightArm.castShadow = true;
    group.add(rightArm);
    parts.rightArm = rightArm;

    // 6. Lower limbs
    const legGeo = new THREE.CylinderGeometry(0.12, 0.18, 0.9, 5);
    legGeo.translate(0, -0.45, 0);
    const leftLeg = new THREE.Mesh(legGeo, snowWhiteMat);
    leftLeg.position.set(-0.35, 0.9, 0);
    group.add(leftLeg);
    parts.leftLeg = leftLeg;

    const rightLeg = new THREE.Mesh(legGeo, snowWhiteMat);
    rightLeg.position.set(0.35, 0.9, 0);
    group.add(rightLeg);
    parts.rightLeg = rightLeg;

  } else {
    // Boss: Titan Frost King
    health = 360;
    speed = 1.3;
    radius = 2.2;
    scoreValue = 1200;
    height = 4.2;

    // Colossal scale
    const baseGeo = new THREE.DodecahedronGeometry(1.6, 2);
    const baseMesh = new THREE.Mesh(baseGeo, snowWhiteMat);
    baseMesh.position.y = 1.5;
    baseMesh.castShadow = true;
    group.add(baseMesh);

    const chestGeo = new THREE.DodecahedronGeometry(1.4, 1);
    const chestMesh = new THREE.Mesh(chestGeo, deepIceMat);
    chestMesh.position.y = 3.0;
    chestMesh.castShadow = true;
    group.add(chestMesh);
    parts.body = chestMesh;

    // Giant Head with Crown
    const headGeo = new THREE.DodecahedronGeometry(0.9, 1);
    const headMesh = new THREE.Mesh(headGeo, snowWhiteMat);
    headMesh.position.set(0, 4.4, 0.2);
    headMesh.castShadow = true;
    group.add(headMesh);
    parts.head = headMesh;

    // Glacial Crown Horns
    const hornGeo = new THREE.ConeGeometry(0.25, 1.2, 5);
    for (let i = -2; i <= 2; i++) {
      const horn = new THREE.Mesh(hornGeo, deepIceMat);
      horn.position.set(i * 0.35, 0.7, 0);
      horn.rotation.z = -i * 0.2;
      headMesh.add(horn);
    }

    // Glowing menacing fiery eyes
    const eyeGeo = new THREE.SphereGeometry(0.2, 8, 8);
    const leftEye = new THREE.Mesh(eyeGeo, glowingEyeRed);
    leftEye.position.set(-0.35, 0.15, 0.75);
    const rightEye = new THREE.Mesh(eyeGeo, glowingEyeRed);
    rightEye.position.set(0.35, 0.15, 0.75);
    headMesh.add(leftEye);
    headMesh.add(rightEye);
    parts.eyes = [leftEye, rightEye];

    // Colossal Arms
    const armGeo = new THREE.CylinderGeometry(0.4, 0.6, 2.0, 6);
    armGeo.translate(0, -1.0, 0);
    const leftArm = new THREE.Mesh(armGeo, deepIceMat);
    leftArm.position.set(-1.8, 3.4, 0);
    leftArm.castShadow = true;
    group.add(leftArm);
    parts.leftArm = leftArm;

    const rightArm = new THREE.Mesh(armGeo, deepIceMat);
    rightArm.position.set(1.8, 3.4, 0);
    rightArm.castShadow = true;
    group.add(rightArm);
    parts.rightArm = rightArm;

    // Stomping Colossus Legs
    const legGeo = new THREE.CylinderGeometry(0.5, 0.7, 1.6, 6);
    legGeo.translate(0, -0.8, 0);
    const leftLeg = new THREE.Mesh(legGeo, darkCoalMat);
    leftLeg.position.set(-0.8, 1.6, 0);
    group.add(leftLeg);
    parts.leftLeg = leftLeg;

    const rightLeg = new THREE.Mesh(legGeo, darkCoalMat);
    rightLeg.position.set(0.8, 1.6, 0);
    group.add(rightLeg);
    parts.rightLeg = rightLeg;
  }

  // Pre-allocate target
  const targetPosition = new THREE.Vector3(0, 0, 0);
  const velocity = new THREE.Vector3();

  return {
    id,
    type,
    group,
    position: group.position,
    velocity,
    targetPosition,
    speed,
    health,
    maxHealth: health,
    radius,
    walkCycle: Math.random() * 10,
    hitTimer: 0,
    attackCooldown: 0,
    scoreValue,
    height,
    parts,
  };
}

/**
 * Procedural walk cycle and animation update for monsters.
 */
export function updateMonsterAnimation(monster: Monster, delta: number) {
  monster.walkCycle += delta * monster.speed * 1.5;
  const cycle = monster.walkCycle;

  // 1. Arm swing
  if (monster.parts.leftArm && monster.parts.rightArm) {
    monster.parts.leftArm.rotation.x = Math.sin(cycle) * 0.6;
    monster.parts.rightArm.rotation.x = -Math.sin(cycle) * 0.6;
  }

  // 2. Leg step
  if (monster.parts.leftLeg && monster.parts.rightLeg) {
    monster.parts.leftLeg.rotation.x = -Math.sin(cycle) * 0.5;
    monster.parts.rightLeg.rotation.x = Math.sin(cycle) * 0.5;
  }

  // 3. Head sway and breath
  if (monster.parts.head) {
    monster.parts.head.rotation.y = Math.sin(cycle * 0.5) * 0.15;
    monster.parts.head.position.y += Math.sin(cycle * 2) * 0.003;
  }

  // 4. Subtle body stomp bob
  if (monster.parts.body) {
    monster.parts.body.position.y += Math.abs(Math.sin(cycle)) * 0.005;
  }

  // 5. Hit flash recovery
  if (monster.hitTimer > 0) {
    monster.hitTimer -= delta;
    if (monster.hitTimer <= 0) {
      // Restore normal materials
      restoreMonsterMaterials(monster);
    }
  }
}

/** Flash monster white/ice on hit */
export function flashMonsterHit(monster: Monster) {
  monster.hitTimer = 0.12;
  monster.group.traverse(child => {
    if (child instanceof THREE.Mesh && child.material !== glowingEyeRed && child.material !== glowingEyeCyan && child.material !== glowingEyeAmber) {
      child.material = hitFlashMat;
    }
  });
}

function restoreMonsterMaterials(monster: Monster) {
  monster.group.traverse(child => {
    if (child instanceof THREE.Mesh) {
      if (child.name === 'head' || child.geometry.type === 'ConeGeometry' || child === monster.parts.head) {
        child.material = deepIceMat;
      } else if (child.material === hitFlashMat) {
        child.material = snowWhiteMat;
      }
    }
  });
}
