import * as THREE from 'three';

/**
 * Procedural CanvasTextures for Frostbite Outpost.
 * Vibrant daytime palette with colorful whimsy, zero 404s, SRGBColorSpace.
 */

// Bright crisp daytime snow texture with colorful sunlight glints
export function createSnowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Bright, cheerful daylight snow (slight warm ivory tint with pastel violet shadow base)
  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, '#f8fafc');
  grad.addColorStop(0.5, '#f1f5f9');
  grad.addColorStop(1, '#e2e8f0');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Subtle powdery noise
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 12;
    data[i] = Math.min(255, Math.max(0, data[i] + noise + 4));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise + 2));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise + 8));
  }
  ctx.putImageData(imgData, 0, 0);

  // Colorful sun glitter crystals (cyan, golden yellow, soft pink, violet)
  const glintColors = ['#fde047', '#38bdf8', '#f472b6', '#a78bfa', '#ffffff'];
  for (let i = 0; i < 450; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = Math.random() * 1.6;
    ctx.fillStyle = glintColors[Math.floor(Math.random() * glintColors.length)];
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(16, 16);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Ice cracks normal/bump map
export function createIceBumpTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 15; i++) {
    let x = Math.random() * 256;
    let y = Math.random() * 256;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let j = 0; j < 4; j++) {
      x += (Math.random() - 0.5) * 40;
      y += (Math.random() - 0.5) * 40;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

// Colorful festive rune ring for defense outpost
export function createRuneRingTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 512, 512);

  // Outer radiant ring
  ctx.strokeStyle = '#c084fc'; // Purple/lavender
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(256, 256, 230, 0, Math.PI * 2);
  ctx.stroke();

  // Secondary bright cyan ring
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(256, 256, 210, 0, Math.PI * 2);
  ctx.stroke();

  // Colorful compass ticks
  const colors = ['#f43f5e', '#fb923c', '#facc15', '#4ade80', '#38bdf8', '#c084fc'];
  for (let i = 0; i < 36; i++) {
    const angle = (i * Math.PI) / 18;
    const isMajor = i % 9 === 0;
    const len = isMajor ? 20 : 9;
    const r1 = 230;
    const r2 = r1 - len;
    ctx.beginPath();
    ctx.moveTo(256 + Math.cos(angle) * r1, 256 + Math.sin(angle) * r1);
    ctx.lineTo(256 + Math.cos(angle) * r2, 256 + Math.sin(angle) * r2);
    ctx.strokeStyle = colors[i % colors.length];
    ctx.lineWidth = isMajor ? 5 : 2.5;
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Colorful winter knit stripes texture (for scarves, beanies, mittens)
export function createKnitStripeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Candy cane & festive purple/cyan stripes
  const stripeColors = ['#f43f5e', '#ffffff', '#38bdf8', '#ffffff', '#c084fc', '#ffffff'];
  const h = 128 / stripeColors.length;

  stripeColors.forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, i * h, 128, h);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Googly cartoon eye texture with glossy highlights
export function createCartoonEyeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Sclera
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(64, 64, 60, 0, Math.PI * 2);
  ctx.fill();

  // Dark pupil
  ctx.fillStyle = '#1e1b4b'; // deep indigo
  ctx.beginPath();
  ctx.arc(68, 62, 32, 0, Math.PI * 2);
  ctx.fill();

  // Iris ring
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Big primary shine
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(56, 50, 12, 0, Math.PI * 2);
  ctx.fill();

  // Secondary small shine
  ctx.beginPath();
  ctx.arc(76, 72, 6, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Rosy blush cheek texture
export function createBlushTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
  grad.addColorStop(0, 'rgba(244, 63, 94, 0.85)');
  grad.addColorStop(0.5, 'rgba(251, 113, 133, 0.45)');
  grad.addColorStop(1, 'rgba(251, 113, 133, 0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(32, 32, 30, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Snowflake particle sprite texture (sunny & iridescent)
export function createSnowflakeSprite(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.3, 'rgba(224, 231, 255, 0.9)');
  gradient.addColorStop(0.7, 'rgba(192, 132, 252, 0.4)');
  gradient.addColorStop(1, 'rgba(192, 132, 252, 0)');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(32, 32, 30, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
