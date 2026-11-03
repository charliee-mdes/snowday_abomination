import * as THREE from 'three';
import { 
  createSnowTexture, 
  createIceBumpTexture, 
  createRuneRingTexture, 
  createSnowflakeSprite 
} from './textures';

export interface EnvironmentObjects {
  snowTerrain: THREE.Mesh;
  centralPlatform: THREE.Group;
  brazierLight: THREE.PointLight;
  snowParticles: THREE.Points;
  mountainGroup: THREE.Group;
  updateParticles: (delta: number) => void;
  updateBrazier: (time: number) => void;
  dispose: () => void;
}

/**
 * Sets up a bright daytime winter wonderland environment.
 * Features:
 * - Daytime sunny atmosphere with warm sunlight and soft lilac horizon fog
 * - Majestic 360-degree purple mountain range with snow-capped peaks
 * - Colorful whimsical candy-frosted pine trees with pastel tints and baubles
 * - Boundless undulating snow landscape with sun glints
 */
export function setupEnvironment(scene: THREE.Scene, isSoftwareGl: boolean): EnvironmentObjects {
  // 1. Daytime Sky & Atmospheric Fog
  const skyColor = new THREE.Color(0xb6c5ea); // Soft periwinkle lilac daylight sky
  scene.background = skyColor;
  // Use linear fog so the purple mountains remain stunningly visible in the distance
  scene.fog = new THREE.Fog(skyColor, 40, 160);

  // 2. Boundless Daytime Snowy Terrain
  const snowTexture = createSnowTexture();
  const iceBump = createIceBumpTexture();

  const terrainGeo = new THREE.PlaneGeometry(220, 220, 48, 48);
  terrainGeo.rotateX(-Math.PI / 2);

  // Gentle rolling dunes outside central defense ring
  const posAttr = terrainGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);
    const distFromCenter = Math.sqrt(x * x + z * z);
    if (distFromCenter > 11) {
      const dune = Math.sin(x * 0.08) * Math.cos(z * 0.08) * 1.5 +
                   Math.sin(x * 0.03 + z * 0.02) * 2.4;
      posAttr.setY(i, dune);
    } else {
      posAttr.setY(i, 0); // Flat central defense area
    }
  }
  terrainGeo.computeVertexNormals();

  const terrainMat = new THREE.MeshStandardMaterial({
    map: snowTexture,
    bumpMap: iceBump,
    bumpScale: 0.12,
    roughness: 0.75,
    metalness: 0.04,
    color: 0xfcfdff,
  });

  const snowTerrain = new THREE.Mesh(terrainGeo, terrainMat);
  snowTerrain.receiveShadow = !isSoftwareGl;
  scene.add(snowTerrain);

  // 3. 360-DEGREE MAJESTIC PURPLE MOUNTAIN RANGE
  const mountainGroup = new THREE.Group();
  const purpleShades = [0x581c87, 0x6b21a8, 0x7e22ce, 0x4c1d95, 0x3b0764, 0x86198f];
  const snowCapMat = new THREE.MeshStandardMaterial({
    color: 0xfaf5ff,
    roughness: 0.7,
    metalness: 0.05,
  });

  // Layer 1: Distant Colossal Mountain Peaks (Radius 85m - 120m)
  const mountainCount = 36;
  for (let i = 0; i < mountainCount; i++) {
    const angle = (i / mountainCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.15;
    const dist = 95 + Math.random() * 35;
    const height = 40 + Math.random() * 32;
    const radius = 18 + Math.random() * 14;

    const singleMountain = new THREE.Group();
    singleMountain.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);

    // Purple rock base (low-poly pyramid with 5-7 radial segments)
    const segments = 5 + Math.floor(Math.random() * 3);
    const coneGeo = new THREE.ConeGeometry(radius, height, segments);
    coneGeo.translate(0, height * 0.5, 0);

    const shade = purpleShades[i % purpleShades.length];
    const mountainMat = new THREE.MeshStandardMaterial({
      color: shade,
      roughness: 0.85,
      metalness: 0.1,
      flatShading: true,
    });

    const mountainMesh = new THREE.Mesh(coneGeo, mountainMat);
    singleMountain.add(mountainMesh);

    // Snow-capped peak on top of mountain
    const capHeight = height * 0.38;
    const capRadius = radius * 0.38;
    const capGeo = new THREE.ConeGeometry(capRadius, capHeight, segments);
    capGeo.translate(0, height - capHeight * 0.45, 0);
    const capMesh = new THREE.Mesh(capGeo, snowCapMat);
    singleMountain.add(capMesh);

    mountainGroup.add(singleMountain);
  }

  // Layer 2: Mid-distance purple foothills (Radius 60m - 80m)
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2 + 0.1 + (Math.random() - 0.5) * 0.2;
    const dist = 65 + Math.random() * 18;
    const height = 18 + Math.random() * 16;
    const radius = 12 + Math.random() * 8;

    const foothill = new THREE.Group();
    foothill.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);

    const coneGeo = new THREE.ConeGeometry(radius, height, 6);
    coneGeo.translate(0, height * 0.5, 0);
    const foothillMat = new THREE.MeshStandardMaterial({
      color: 0x7c3aed, // Vibrant violet
      roughness: 0.8,
      metalness: 0.15,
      flatShading: true,
    });
    const mesh = new THREE.Mesh(coneGeo, foothillMat);
    foothill.add(mesh);

    // Snow frosting on ridge
    const capGeo = new THREE.ConeGeometry(radius * 0.45, height * 0.35, 6);
    capGeo.translate(0, height - height * 0.15, 0);
    const cap = new THREE.Mesh(capGeo, snowCapMat);
    foothill.add(cap);

    mountainGroup.add(foothill);
  }

  scene.add(mountainGroup);

  // 4. Central Defense Platform & Whimsical Hearth
  const centralPlatform = new THREE.Group();
  centralPlatform.position.set(0, 0.02, 0);

  // Colorful Rune Ring
  const runeTexture = createRuneRingTexture();
  const runeGeo = new THREE.PlaneGeometry(16, 16);
  runeGeo.rotateX(-Math.PI / 2);
  const runeMat = new THREE.MeshBasicMaterial({
    map: runeTexture,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
  });
  const runeMesh = new THREE.Mesh(runeGeo, runeMat);
  centralPlatform.add(runeMesh);

  // Whimsical Defense Hearth / Brazier in center
  const brazierGroup = new THREE.Group();
  brazierGroup.position.set(0, 0, -0.6);

  // Candy striped stone pedestal
  const pedestalGeo = new THREE.CylinderGeometry(0.5, 0.7, 0.9, 8);
  const pedestalMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.75,
    metalness: 0.2,
  });
  const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
  pedestal.position.y = 0.45;
  pedestal.castShadow = !isSoftwareGl;
  brazierGroup.add(pedestal);

  // Golden star / sun warmth emblem
  const starGeo = new THREE.DodecahedronGeometry(0.32, 1);
  const starMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24, // Sunny amber
    roughness: 0.2,
    metalness: 0.8,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.4,
  });
  const starMesh = new THREE.Mesh(starGeo, starMat);
  starMesh.position.y = 1.05;
  brazierGroup.add(starMesh);

  // Warm Brazier point light
  const brazierLight = new THREE.PointLight(0xf59e0b, 2.0, 12, 1.2);
  brazierLight.position.set(0, 1.2, -0.6);
  scene.add(brazierLight);

  centralPlatform.add(brazierGroup);
  scene.add(centralPlatform);

  // 5. COLORFUL WHIMSICAL CANDY PINE TREES (Teal, Mint, Pink, Lilac)
  const treeCount = 40;
  const treeGroup = new THREE.Group();

  const trunkGeo = new THREE.CylinderGeometry(0.2, 0.35, 1.8, 6);
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x4a2818,
    roughness: 0.9,
  });

  const boughGeo = new THREE.ConeGeometry(1.6, 2.2, 7);
  // Colorful tree palette for whimsy!
  const whimsicalTreeColors = [
    0x059669, // Vibrant emerald mint
    0x0284c7, // Candy blue
    0x14b8a6, // Bright turquoise
  ];

  const baubleColors = [0xf43f5e, 0xfacc15, 0x38bdf8, 0xa855f7, 0x4ade80];
  const baubleGeo = new THREE.SphereGeometry(0.14, 6, 6);

  for (let i = 0; i < treeCount; i++) {
    const angle = (i / treeCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.25;
    const dist = 18 + Math.random() * 38;
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;

    const singleTree = new THREE.Group();
    singleTree.position.set(x, 0, z);

    const s = 0.85 + Math.random() * 0.45;
    singleTree.scale.set(s, s, s);

    // Trunk
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.9;
    trunk.castShadow = !isSoftwareGl;
    singleTree.add(trunk);

    // Pick vibrant color for this whimsical tree
    const treeColor = whimsicalTreeColors[i % whimsicalTreeColors.length];
    const boughMat = new THREE.MeshStandardMaterial({
      color: treeColor,
      roughness: 0.65,
      metalness: 0.1,
    });

    // 3 tiered snow-dusted foliage tiers
    for (let t = 0; t < 3; t++) {
      const tierScale = 1 - t * 0.25;
      const bough = new THREE.Mesh(boughGeo, boughMat);
      bough.position.y = 2.0 + t * 1.3;
      bough.scale.set(tierScale, tierScale, tierScale);
      bough.castShadow = !isSoftwareGl;
      singleTree.add(bough);

      // Fluffy white snow cap
      const snowCap = new THREE.Mesh(boughGeo, snowCapMat);
      snowCap.position.y = 2.08 + t * 1.3;
      snowCap.scale.set(tierScale * 0.94, tierScale * 0.45, tierScale * 0.94);
      singleTree.add(snowCap);

      // Cute colorful frozen baubles on the branches!
      const bauble = new THREE.Mesh(
        baubleGeo,
        new THREE.MeshStandardMaterial({
          color: baubleColors[(i + t) % baubleColors.length],
          roughness: 0.2,
          metalness: 0.6,
        })
      );
      bauble.position.set(
        Math.cos(t * 2) * (tierScale * 1.1),
        1.7 + t * 1.3,
        Math.sin(t * 2) * (tierScale * 1.1)
      );
      singleTree.add(bauble);
    }

    treeGroup.add(singleTree);
  }
  scene.add(treeGroup);

  // 6. DAYTIME LIGHTING RIG (Warm Golden Sun + Radiant Blue Sky Fill)
  // Warm golden sun
  const sunLight = new THREE.DirectionalLight(0xfffaed, 2.3);
  sunLight.position.set(30, 48, 25);
  sunLight.castShadow = !isSoftwareGl;
  if (!isSoftwareGl) {
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    const d = 36;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 95;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.02;
  }
  scene.add(sunLight);

  // Sky fill light: periwinkle sky to pastel lavender snow reflection
  const hemiLight = new THREE.HemisphereLight(0xc7d2fe, 0xf1f5f9, 1.2);
  scene.add(hemiLight);

  // 7. Swirling Sunlit Snowflake / Sparkle Particle System
  const particleCount = 900;
  const particleGeo = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);
  const particleVelocities: { x: number; y: number; z: number }[] = [];

  for (let i = 0; i < particleCount; i++) {
    particlePositions[i * 3] = (Math.random() - 0.5) * 65;
    particlePositions[i * 3 + 1] = Math.random() * 22;
    particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 65;

    particleVelocities.push({
      x: (Math.random() - 0.5) * 1.2 + 0.5,
      y: -(1.2 + Math.random() * 2.0),
      z: (Math.random() - 0.5) * 1.2 - 0.4,
    });
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

  const snowSprite = createSnowflakeSprite();
  const particleMat = new THREE.PointsMaterial({
    map: snowSprite,
    size: 0.38,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const snowParticles = new THREE.Points(particleGeo, particleMat);
  scene.add(snowParticles);

  // Snow particles update function
  const updateParticles = (delta: number) => {
    const pos = particleGeo.attributes.position as THREE.BufferAttribute;
    const array = pos.array as Float32Array;

    for (let i = 0; i < particleCount; i++) {
      let x = array[i * 3];
      let y = array[i * 3 + 1];
      let z = array[i * 3 + 2];

      const vel = particleVelocities[i];
      x += vel.x * delta;
      y += vel.y * delta;
      z += vel.z * delta;

      if (y < 0) {
        y = 22;
        x = (Math.random() - 0.5) * 65;
        z = (Math.random() - 0.5) * 65;
      }
      if (x > 33) x = -33;
      if (x < -33) x = 33;
      if (z > 33) z = -33;
      if (z < -33) z = 33;

      array[i * 3] = x;
      array[i * 3 + 1] = y;
      array[i * 3 + 2] = z;
    }
    pos.needsUpdate = true;
  };

  // Brazier rotation & sunny glow
  const updateBrazier = (time: number) => {
    starMesh.rotation.y = time * 0.8;
    starMesh.rotation.x = Math.sin(time) * 0.2;
    const pulse = Math.sin(time * 3) * 0.25;
    brazierLight.intensity = 2.0 + pulse;
  };

  const dispose = () => {
    terrainGeo.dispose();
    terrainMat.dispose();
    snowTexture.dispose();
    iceBump.dispose();
    runeTexture.dispose();
    runeGeo.dispose();
    runeMat.dispose();
    snowSprite.dispose();
    particleGeo.dispose();
    particleMat.dispose();
  };

  return {
    snowTerrain,
    centralPlatform,
    brazierLight,
    snowParticles,
    mountainGroup,
    updateParticles,
    updateBrazier,
    dispose,
  };
}
