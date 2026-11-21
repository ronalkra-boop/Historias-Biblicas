import { VIEW_HEIGHT, VIEW_WIDTH, particlePool } from './rules';
import type { GameWorld, HazardWave, InteractSpot, LionEnemy, Platform } from './types';

interface BubbleWrapCache {
  key: string;
  lines: string[];
  width: number;
  height: number;
}

let bubbleWrapCache: BubbleWrapCache | null = null;
const INK = '#2A180E';

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawPalmTree(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseY: number,
  height: number,
  sway: number
) {
  ctx.save();
  const topX = x + Math.sin(sway) * 6;
  const topY = baseY - height;

  // Curved trunk
  ctx.strokeStyle = '#7C4A26';
  ctx.lineWidth = 11;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.quadraticCurveTo(x - 10, baseY - height * 0.5, topX, topY);
  ctx.stroke();

  // Fronds
  const angles = [-2.6, -2.0, -1.2, -0.5, 0.15];
  ctx.strokeStyle = '#1E6B3A';
  ctx.lineWidth = 6;
  for (const a of angles) {
    const endX = topX + Math.cos(a + Math.sin(sway) * 0.06) * 44;
    const endY = topY + Math.sin(a) * 28 + 12;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo((topX + endX) / 2, topY - 16, endX, endY);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, alpha = 0.72) {
  ctx.save();
  ctx.fillStyle = `rgba(255, 252, 242, ${alpha})`;
  ctx.beginPath();
  ctx.arc(x, y, 22 * scale, 0, Math.PI * 2);
  ctx.arc(x + 22 * scale, y - 7 * scale, 26 * scale, 0, Math.PI * 2);
  ctx.arc(x + 48 * scale, y, 20 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSkyBackdrop(ctx: CanvasRenderingContext2D, world: GameWorld) {
  const grad = ctx.createLinearGradient(0, 0, 0, VIEW_HEIGHT);
  const cam = world.cameraX;
  const t = world.elapsed;

  switch (world.stage) {
    case 'babylon_terrace': {
      grad.addColorStop(0, '#0B132B');
      grad.addColorStop(0.55, '#1C2541');
      grad.addColorStop(1, '#312E81');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

      // Twinkling stars
      for (let i = 0; i < 34; i++) {
        const sx = ((i * 173 - cam * 0.08) % VIEW_WIDTH + VIEW_WIDTH) % VIEW_WIDTH;
        const sy = 36 + ((i * 67) % 250);
        const tw = 1.2 + Math.sin(t * 2.4 + i) * 0.8;
        ctx.fillStyle = i % 4 === 0 ? '#FDE68A' : 'rgba(255, 251, 235, 0.88)';
        ctx.beginPath();
        ctx.arc(sx, sy, Math.max(0.8, tw), 0, Math.PI * 2);
        ctx.fill();
      }
      // Crescent moon
      ctx.fillStyle = 'rgba(253, 224, 71, 0.16)';
      ctx.beginPath();
      ctx.arc(1070 - cam * 0.05, 110, 56, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.arc(1070 - cam * 0.05, 110, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#131D38';
      ctx.beginPath();
      ctx.arc(1082 - cam * 0.05, 102, 26, 0, Math.PI * 2);
      ctx.fill();

      // Stepped Babylonian Ziggurats & Hanging Gardens silhouettes
      ctx.fillStyle = '#1E1B4B';
      for (let i = 0; i < 4; i++) {
        const zx = i * 420 - (cam * 0.2) % 420;
        ctx.fillRect(zx + 60, 410, 220, 166);
        ctx.fillRect(zx + 95, 360, 150, 50);
        ctx.fillRect(zx + 130, 320, 80, 40);
        // Lapis & gold frieze line
        ctx.fillStyle = '#D97706';
        ctx.fillRect(zx + 95, 360, 150, 4);
        ctx.fillStyle = '#1E1B4B';
      }

      // Glazed lapis palace columns + flickering torches
      for (let i = 0; i < 6; i++) {
        const px = i * 320 - (cam * 0.5) % 320;
        ctx.fillStyle = '#1D3557';
        ctx.fillRect(px + 20, 240, 26, 336);
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(px + 16, 240, 34, 8);
        // Wall torch glow
        const flick = Math.sin(t * 14 + i) * 3;
        ctx.fillStyle = 'rgba(251, 146, 60, 0.24)';
        ctx.beginPath();
        ctx.arc(px + 33, 355, 28 + flick, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FBBF24';
        ctx.beginPath();
        ctx.arc(px + 33, 355, 7, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'lions_den': {
      grad.addColorStop(0, '#0F172A');
      grad.addColorStop(0.55, '#1F2937');
      grad.addColorStop(1, '#292524');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

      // Stone cave ribs
      ctx.fillStyle = '#26211E';
      for (let i = 0; i < 6; i++) {
        const ax = i * 280 - (cam * 0.35) % 280;
        ctx.fillRect(ax, 100, 44, 476);
        ctx.beginPath();
        ctx.arc(ax + 140, 100, 118, Math.PI, Math.PI * 2);
        ctx.strokeStyle = '#332C28';
        ctx.lineWidth = 22;
        ctx.stroke();
      }

      // Radiant heavenly light shaft from the den opening
      const shaftGrad = ctx.createLinearGradient(0, 0, 0, 580);
      shaftGrad.addColorStop(0, 'rgba(254, 240, 138, 0.34)');
      shaftGrad.addColorStop(0.6, 'rgba(253, 224, 71, 0.14)');
      shaftGrad.addColorStop(1, 'rgba(253, 224, 71, 0.02)');
      ctx.fillStyle = shaftGrad;
      ctx.beginPath();
      ctx.moveTo(540 - cam * 0.25, 0);
      ctx.lineTo(740 - cam * 0.25, 0);
      ctx.lineTo(960 - cam * 0.25, 576);
      ctx.lineTo(350 - cam * 0.25, 576);
      ctx.closePath();
      ctx.fill();

      // Hovering Winged Angel of the Lord in the light shaft
      const angX = 640 - cam * 0.25;
      const angY = 178 + Math.sin(world.angelFloatPhase) * 10;
      ctx.save();
      ctx.fillStyle = 'rgba(254, 249, 195, 0.28)';
      ctx.beginPath();
      ctx.arc(angX, angY, 54, 0, Math.PI * 2);
      ctx.fill();
      // Wings
      ctx.fillStyle = '#FEF9C3';
      ctx.beginPath();
      ctx.ellipse(angX - 30, angY - 4, 26, 12, -0.35, 0, Math.PI * 2);
      ctx.ellipse(angX + 30, angY - 4, 26, 12, 0.35, 0, Math.PI * 2);
      ctx.fill();
      // Robe & Halo
      roundedRect(ctx, angX - 13, angY - 6, 26, 40, 10);
      ctx.fill();
      ctx.fillStyle = '#FDE68A';
      ctx.beginPath();
      ctx.arc(angX, angY - 14, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FACC15';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(angX, angY - 26, 14, 4.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      break;
    }
    case 'fiery_furnace': {
      grad.addColorStop(0, '#2B0908');
      grad.addColorStop(0.55, '#6B1D14');
      grad.addColorStop(1, '#B45309');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

      const glow = ctx.createRadialGradient(640, 520, 60, 640, 440, 560);
      glow.addColorStop(0, 'rgba(251, 191, 36, 0.34)');
      glow.addColorStop(1, 'rgba(251, 146, 60, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

      // Vaulted brick bays
      ctx.fillStyle = '#451A14';
      for (let i = 0; i < 6; i++) {
        const bx = i * 310 - (cam * 0.25) % 310;
        ctx.fillRect(bx + 15, 95, 52, 481);
        ctx.strokeStyle = '#7C2D12';
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.arc(bx + 170, 140, 118, Math.PI, Math.PI * 2);
        ctx.stroke();
      }

      // Floating embers
      ctx.fillStyle = '#FDE047';
      for (let i = 0; i < 18; i++) {
        const ex = ((i * 97 + t * 28) % VIEW_WIDTH);
        const ey = ((580 - ((t * 55 + i * 47) % 520)));
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        ctx.arc(ex, ey, 2.2 + (i % 3), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      break;
    }
    case 'galilee_storm': {
      const c = world.stormCalm;
      if (c > 0.5) {
        grad.addColorStop(0, '#38BDF8');
        grad.addColorStop(0.55, '#BAE6FD');
        grad.addColorStop(1, '#FEF3C7');
      } else {
        grad.addColorStop(0, '#0B132B');
        grad.addColorStop(0.55, '#1E3A5F');
        grad.addColorStop(1, '#334155');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

      if (c > 0.5) {
        // Golden sunrise after Jesus calms the storm
        ctx.fillStyle = 'rgba(254, 240, 138, 0.55)';
        ctx.beginPath();
        ctx.arc(1030, 160, 74, 0, Math.PI * 2);
        ctx.fill();
        drawCloud(ctx, 220, 120, 1.1, 0.85);
        drawCloud(ctx, 640, 105, 0.95, 0.8);
      } else {
        // Storm clouds & slanted rain
        ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.arc(160 + i * 260, 96, 86, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.strokeStyle = 'rgba(186, 230, 253, 0.28)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let i = 0; i < 36; i++) {
          const rx = ((i * 73 + t * 240) % (VIEW_WIDTH + 120)) - 60;
          const ry = ((i * 59 + t * 480) % 520);
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx - 12, ry + 26);
        }
        ctx.stroke();
      }

      // Towering wooden mast & billowing linen sail on the boat
      const mastX = 670 - cam;
      ctx.fillStyle = '#78350F';
      ctx.fillRect(mastX - 6, 155, 12, 395);
      ctx.fillStyle = c > 0.5 ? '#FFFBEB' : '#E2E8F0';
      ctx.beginPath();
      ctx.moveTo(mastX + 6, 175);
      ctx.quadraticCurveTo(
        mastX + 160 + Math.sin(t * 4) * (1 - c) * 18,
        290,
        mastX + 6,
        400
      );
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Sea waves behind the boat
      ctx.fillStyle = c > 0.5 ? '#0284C7' : '#0F2942';
      ctx.beginPath();
      ctx.moveTo(0, 540);
      for (let x = 0; x <= VIEW_WIDTH; x += 40) {
        const amp = (1 - c) * 18 + 3;
        const y = 528 + Math.sin(x * 0.02 + t * 3.4) * amp;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(VIEW_WIDTH, VIEW_HEIGHT);
      ctx.lineTo(0, VIEW_HEIGHT);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'zaqueo_house': {
      grad.addColorStop(0, '#FDE68A');
      grad.addColorStop(1, '#FFFBEB');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

      // Cedar roof beams & pillars
      ctx.fillStyle = '#78350F';
      ctx.fillRect(0, 0, VIEW_WIDTH, 34);
      ctx.fillRect(80, 34, 26, 542);
      ctx.fillRect(1174, 34, 26, 542);

      // Arched window overlooking sunlit Jericho
      ctx.fillStyle = '#7DD3FC';
      roundedRect(ctx, 490, 120, 300, 210, 28);
      ctx.fill();
      ctx.fillStyle = '#E7C68E';
      ctx.fillRect(490, 250, 300, 80);
      ctx.strokeStyle = '#92400E';
      ctx.lineWidth = 10;
      roundedRect(ctx, 490, 120, 300, 210, 28);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(640, 120);
      ctx.lineTo(640, 330);
      ctx.stroke();

      // Hanging brass oil lamps with warm glow
      for (const lx of [280, 960]) {
        ctx.strokeStyle = '#78350F';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(lx, 34);
        ctx.lineTo(lx, 155);
        ctx.stroke();
        ctx.fillStyle = 'rgba(251, 191, 36, 0.25)';
        ctx.beginPath();
        ctx.arc(lx, 162, 38 + Math.sin(t * 7 + lx) * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#B45309';
        roundedRect(ctx, lx - 16, 154, 32, 14, 6);
        ctx.fill();
        ctx.fillStyle = '#FEF08A';
        ctx.beginPath();
        ctx.arc(lx, 150, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Woven terracotta rug along the floor
      ctx.fillStyle = '#B91C1C';
      ctx.fillRect(160, 566, 940, 12);
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(175, 569, 910, 5);
      break;
    }
    case 'red_sea': {
      grad.addColorStop(0, '#FB923C');
      grad.addColorStop(0.45, '#FEF3C7');
      grad.addColorStop(1, '#E0F2FE');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

      // Pillar of golden fire/cloud guiding Israel
      const pillarGrad = ctx.createLinearGradient(0, 0, 0, 420);
      pillarGrad.addColorStop(0, 'rgba(253, 224, 71, 0.55)');
      pillarGrad.addColorStop(1, 'rgba(251, 146, 60, 0.06)');
      ctx.fillStyle = pillarGrad;
      ctx.fillRect(920 - cam * 0.25, 0, 120, 440);

      // Parted translucent walls of the Red Sea with white foam crests
      const wallHeight = 165 + world.seaPartedLevel * 235;
      for (let i = 0; i < 3; i++) {
        const wx = 340 + i * 520 - cam;
        const gap = 85 + world.seaPartedLevel * 125;
        const waveBob = Math.sin(t * 3 + i) * 5;

        // Left wall
        ctx.fillStyle = 'rgba(14, 116, 144, 0.78)';
        roundedRect(ctx, wx - gap - 96, 576 - wallHeight + waveBob, 96, wallHeight, 28);
        ctx.fill();
        ctx.fillStyle = 'rgba(224, 242, 254, 0.85)';
        roundedRect(ctx, wx - gap - 90, 576 - wallHeight + waveBob, 84, 14, 8);
        ctx.fill();

        // Right wall
        ctx.fillStyle = 'rgba(14, 116, 144, 0.78)';
        roundedRect(ctx, wx + gap, 576 - wallHeight - waveBob, 96, wallHeight, 28);
        ctx.fill();
        ctx.fillStyle = 'rgba(224, 242, 254, 0.85)';
        roundedRect(ctx, wx + gap + 6, 576 - wallHeight - waveBob, 84, 14, 8);
        ctx.fill();
      }
      break;
    }
    case 'noah_ark': {
      grad.addColorStop(0, '#60A5FA');
      grad.addColorStop(0.5, '#DBEAFE');
      grad.addColorStop(1, '#ECFDF5');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

      drawCloud(ctx, 180 - (cam * 0.1) % 240, 110, 1.15, 0.8);
      drawCloud(ctx, 620 - (cam * 0.1) % 240, 95, 1.0, 0.75);

      // Gentle rain until 3+ animal pairs are guided, then vibrant rainbow
      const doneCount = world.interactSpots.filter((s) => s.done).length;
      if (doneCount >= 3 || world.outcome === 'victory') {
        const colors = ['#EF4444', '#F59E0B', '#FACC15', '#22C55E', '#3B82F6', '#8B5CF6'];
        colors.forEach((col, idx) => {
          ctx.strokeStyle = col;
          ctx.lineWidth = 8;
          ctx.globalAlpha = world.outcome === 'victory' ? 0.78 : 0.4;
          ctx.beginPath();
          ctx.arc(980 - cam * 0.4, 490, 355 - idx * 10, Math.PI, Math.PI * 2);
          ctx.stroke();
        });
        ctx.globalAlpha = 1;
      } else {
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.22)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < 24; i++) {
          const rx = ((i * 89 + t * 80) % VIEW_WIDTH);
          const ry = ((i * 71 + t * 320) % 520);
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx - 4, ry + 18);
        }
        ctx.stroke();
      }

      // Rolling green hills
      ctx.fillStyle = '#86EFAC';
      ctx.beginPath();
      ctx.moveTo(0, 576);
      for (let x = 0; x <= VIEW_WIDTH; x += 64) {
        ctx.lineTo(x, 472 + Math.sin((x + cam * 0.22) * 0.006) * 32);
      }
      ctx.lineTo(VIEW_WIDTH, 576);
      ctx.closePath();
      ctx.fill();

      // Detailed wooden Ark on the right
      const arkX = 1455 - cam;
      ctx.fillStyle = '#78350F';
      roundedRect(ctx, arkX, 336, 430, 240, 30);
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3;
      ctx.stroke();
      // Wood plank seams
      ctx.strokeStyle = '#5C280B';
      ctx.lineWidth = 2;
      for (let py = 376; py < 560; py += 28) {
        ctx.beginPath();
        ctx.moveTo(arkX + 12, py);
        ctx.lineTo(arkX + 418, py);
        ctx.stroke();
      }
      // Pitched Ark roof & glowing window
      ctx.fillStyle = '#92400E';
      roundedRect(ctx, arkX + 36, 302, 356, 42, 10);
      ctx.fill();
      ctx.fillStyle = '#FEF3C7';
      roundedRect(ctx, arkX + 185, 314, 52, 26, 6);
      ctx.fill();
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 3;
      ctx.stroke();
      break;
    }
    default: {
      // Sunlit Holy Land stages: jericho_road, capernaum_crowd, jericho_gate, valley_elah, galilee_hills
      grad.addColorStop(0, '#60C5F1');
      grad.addColorStop(0.5, '#FEF3C7');
      grad.addColorStop(1, '#FDE68A');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

      // Sun & warm halo
      const sunX = 1040 - cam * 0.07;
      ctx.fillStyle = 'rgba(253, 224, 71, 0.24)';
      ctx.beginPath();
      ctx.arc(sunX, 124, 92, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.arc(sunX, 124, 52, 0, Math.PI * 2);
      ctx.fill();

      drawCloud(ctx, 210 - (cam * 0.08) % 300, 126, 1.05, 0.72);
      drawCloud(ctx, 690 - (cam * 0.08) % 300, 96, 0.9, 0.65);

      // Far Judean hills
      ctx.fillStyle = world.stage === 'galilee_hills' ? '#86EFAC' : world.stage === 'valley_elah' ? '#A3B18A' : '#E7C68E';
      ctx.beginPath();
      ctx.moveTo(0, 576);
      for (let x = 0; x <= VIEW_WIDTH; x += 64) {
        const h =
          445 +
          Math.sin((x + cam * 0.18) * 0.0055) * 48 +
          Math.cos((x + cam * 0.18) * 0.013) * 18;
        ctx.lineTo(x, h);
      }
      ctx.lineTo(VIEW_WIDTH, 576);
      ctx.closePath();
      ctx.fill();

      if (world.stage === 'valley_elah') {
        // Israelite & Philistine tents on opposite hilltops
        for (let i = 0; i < 4; i++) {
          const tx = 140 + i * 190 - cam * 0.35;
          ctx.fillStyle = '#FEF3C7';
          ctx.beginPath();
          ctx.moveTo(tx, 500);
          ctx.lineTo(tx + 34, 448);
          ctx.lineTo(tx + 68, 500);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#B45309';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        for (let i = 0; i < 3; i++) {
          const tx = 980 + i * 160 - cam * 0.35;
          ctx.fillStyle = '#991B1B';
          ctx.beginPath();
          ctx.moveTo(tx, 500);
          ctx.lineTo(tx + 36, 444);
          ctx.lineTo(tx + 72, 500);
          ctx.closePath();
          ctx.fill();
        }
      } else if (world.stage === 'galilee_hills') {
        // Shimmering Sea of Galilee in the distance
        ctx.fillStyle = '#38BDF8';
        ctx.fillRect(0, 495, VIEW_WIDTH, 81);
        ctx.fillStyle = '#4ADE80';
        ctx.beginPath();
        ctx.moveTo(0, 576);
        for (let x = 0; x <= VIEW_WIDTH; x += 80) {
          ctx.lineTo(x, 518 + Math.sin((x + cam * 0.3) * 0.008) * 18);
        }
        ctx.lineTo(VIEW_WIDTH, 576);
        ctx.closePath();
        ctx.fill();
      } else {
        // Adobe town arches & palm trees (Jericho / Capernaum)
        for (let i = 0; i < 7; i++) {
          const hx = i * 260 - (cam * 0.35) % 260;
          ctx.fillStyle = '#DEB887';
          roundedRect(ctx, hx + 28, 438, 86, 138, 8);
          ctx.fill();
          // Dome roof
          ctx.fillStyle = '#D4A56A';
          ctx.beginPath();
          ctx.arc(hx + 71, 438, 30, Math.PI, Math.PI * 2);
          ctx.fill();
          // Dark arched doorway
          ctx.fillStyle = '#8C5A32';
          roundedRect(ctx, hx + 55, 512, 32, 64, 16);
          ctx.fill();

          if (i % 2 === 0) {
            drawPalmTree(ctx, hx + 165, 576, 128, t * 1.6 + i);
          }
        }
      }
      break;
    }
  }
}

function drawPlatform(
  ctx: CanvasRenderingContext2D,
  plat: Platform,
  cam: number,
  world: GameWorld
) {
  const x = plat.x - cam;
  if (x + plat.w < -40 || x > VIEW_WIDTH + 40) return;

  if (plat.kind === 'ground') {
    ctx.fillStyle = world.stage === 'galilee_hills' || world.stage === 'noah_ark' ? '#65A30D' : '#B47B44';
    ctx.fillRect(x, plat.y, plat.w, plat.h);
    ctx.fillStyle = world.stage === 'galilee_hills' || world.stage === 'noah_ark' ? '#84CC16' : '#E2B47A';
    ctx.fillRect(x, plat.y, plat.w, 16);

    // Shimmering brook in the Valley of Elah!
    if (world.stage === 'valley_elah') {
      const bx = 175 - cam;
      ctx.fillStyle = '#38BDF8';
      roundedRect(ctx, bx, plat.y + 4, 760, 26, 12);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      for (let rx = 0; rx < 700; rx += 85) {
        const shift = (world.elapsed * 45 + rx) % 700;
        ctx.fillRect(bx + 20 + shift, plat.y + 13, 32, 3);
      }
    }
  } else if (plat.kind === 'crate') {
    ctx.fillStyle = '#9A4A18';
    roundedRect(ctx, x, plat.y, plat.w, plat.h, 8);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.strokeStyle = '#6B2F0E';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 9, plat.y + 9);
    ctx.lineTo(x + plat.w - 9, plat.y + plat.h - 9);
    ctx.moveTo(x + plat.w - 9, plat.y + 9);
    ctx.lineTo(x + 9, plat.y + plat.h - 9);
    ctx.stroke();
  } else if (plat.kind === 'awning') {
    // Market awning poles
    ctx.fillStyle = '#78350F';
    ctx.fillRect(x + 8, plat.y + plat.h, 6, Math.max(0, world.groundY - (plat.y + plat.h)));
    ctx.fillRect(x + plat.w - 14, plat.y + plat.h, 6, Math.max(0, world.groundY - (plat.y + plat.h)));
    // Striped cloth canopy
    ctx.fillStyle = '#C2410C';
    roundedRect(ctx, x, plat.y, plat.w, plat.h, 8);
    ctx.fill();
    ctx.fillStyle = '#FEF3C7';
    for (let sx = 0; sx < plat.w - 16; sx += 28) {
      ctx.fillRect(x + sx + 6, plat.y + 2, 12, plat.h - 4);
    }
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    roundedRect(ctx, x, plat.y, plat.w, plat.h, 8);
    ctx.stroke();
  } else if (plat.kind === 'branch') {
    ctx.fillStyle = '#6B4226';
    roundedRect(ctx, x, plat.y, plat.w, plat.h, 10);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#15803D';
    ctx.beginPath();
    ctx.arc(x + plat.w * 0.5, plat.y - 4, 24, Math.PI, Math.PI * 2);
    ctx.fill();
  } else if (plat.kind === 'grass') {
    ctx.fillStyle = '#78350F';
    roundedRect(ctx, x, plat.y + 6, plat.w, plat.h - 6, 6);
    ctx.fill();
    ctx.fillStyle = '#22C55E';
    roundedRect(ctx, x, plat.y, plat.w, 12, 6);
    ctx.fill();
    ctx.strokeStyle = '#166534';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else if (plat.kind === 'wood') {
    ctx.fillStyle = '#7C3E18';
    roundedRect(ctx, x, plat.y, plat.w, plat.h, 6);
    ctx.fill();
    ctx.fillStyle = '#A1622B';
    ctx.fillRect(x + 2, plat.y + 2, plat.w - 4, 7);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    roundedRect(ctx, x, plat.y, plat.w, plat.h, 6);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#475569';
    roundedRect(ctx, x, plat.y, plat.w, plat.h, 6);
    ctx.fill();
    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(x + 2, plat.y + 2, plat.w - 4, 6);
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2;
    roundedRect(ctx, x, plat.y, plat.w, plat.h, 6);
    ctx.stroke();
  }
}

function drawSycamore(ctx: CanvasRenderingContext2D, world: GameWorld, cam: number) {
  if (world.stage !== 'jericho_road') return;
  const trunk = world.climbables[0];
  if (!trunk) return;
  const tx = trunk.x - cam;

  // Trunk & roots
  ctx.fillStyle = '#6B3E26';
  roundedRect(ctx, tx, trunk.y, trunk.w, trunk.h, 12);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Climbable bark rungs visual cue
  ctx.fillStyle = '#9A633C';
  for (let ry = trunk.y + 30; ry < trunk.y + trunk.h - 24; ry += 38) {
    roundedRect(ctx, tx + 9, ry, trunk.w - 18, 7, 3);
    ctx.fill();
  }

  // Multi-layered lush canopy
  ctx.fillStyle = '#14532D';
  ctx.beginPath();
  ctx.arc(tx + 25, trunk.y - 26, 126, 0, Math.PI * 2);
  ctx.arc(tx - 68, trunk.y + 12, 86, 0, Math.PI * 2);
  ctx.arc(tx + 118, trunk.y + 10, 88, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#15803D';
  ctx.beginPath();
  ctx.arc(tx + 16, trunk.y - 36, 94, 0, Math.PI * 2);
  ctx.arc(tx + 82, trunk.y - 4, 66, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#22C55E';
  ctx.beginPath();
  ctx.arc(tx + 30, trunk.y - 48, 58, 0, Math.PI * 2);
  ctx.fill();
}

type HeldProp = 'none' | 'staff' | 'sling' | 'basket' | 'cane' | 'crook' | 'pouch';

function drawPersonSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  tunicColor: string,
  sashColor: string,
  facing: 1 | -1,
  walkCycle: number,
  options?: {
    halo?: boolean;
    crouching?: boolean;
    hitFlash?: boolean;
    beard?: boolean;
    headband?: boolean;
    scaleX?: number;
    scaleY?: number;
    prop?: HeldProp;
    dewAura?: boolean;
  }
) {
  ctx.save();
  const cx = x + w / 2;
  const footY = y + h;
  const sx = options?.scaleX ?? 1;
  const sy = options?.scaleY ?? 1;

  // Ground contact shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.24)';
  ctx.beginPath();
  ctx.ellipse(cx, footY, w * 0.5, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Squash & stretch anchored at feet
  ctx.translate(cx, footY);
  ctx.scale(sx, sy);
  ctx.translate(-cx, -footY);

  const drawH = options?.crouching ? h * 0.7 : h;
  const topY = y + (h - drawH);

  // Protective celestial dew aura (Horno de Fuego)
  if (options?.dewAura) {
    ctx.fillStyle = 'rgba(56, 189, 248, 0.24)';
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.85)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, topY + drawH * 0.48, w * 0.92, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Radiant golden halo & soft glow
  if (options?.halo) {
    ctx.fillStyle = 'rgba(254, 240, 138, 0.2)';
    ctx.beginPath();
    ctx.arc(cx, topY + 24, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(cx, topY - 4, 16, 5.5, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  const stride = Math.sin(walkCycle) * 5.5;

  // Animated feet / sandals
  ctx.fillStyle = '#4A2511';
  ctx.beginPath();
  ctx.ellipse(cx - 7 + stride * 0.6, footY - 3, 5.5, 4, 0, 0, Math.PI * 2);
  ctx.ellipse(cx + 7 - stride * 0.6, footY - 3, 5.5, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Layered robe / tunic with warm ink outline
  ctx.fillStyle = options?.hitFlash ? '#FFFFFF' : tunicColor;
  roundedRect(ctx, x + 2, topY + 18, w - 4, drawH - 22, 10);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Diagonal mantle / belt sash
  ctx.fillStyle = options?.hitFlash ? '#FFFFFF' : sashColor;
  ctx.fillRect(x + 4, topY + 29, w - 8, 7);
  ctx.beginPath();
  ctx.moveTo(x + 6, topY + 20);
  ctx.lineTo(x + 15, topY + 20);
  ctx.lineTo(x + w - 7, topY + 36);
  ctx.lineTo(x + w - 15, topY + 36);
  ctx.closePath();
  ctx.fill();

  // Front hand & story prop
  const handX = cx + facing * (w * 0.44);
  const handY = topY + 31 - stride * 0.45;

  if (options?.prop === 'staff' || options?.prop === 'crook') {
    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(handX, topY - 6);
    ctx.lineTo(handX, footY - 2);
    ctx.stroke();
    if (options.prop === 'crook') {
      ctx.beginPath();
      ctx.arc(handX + facing * 6, topY - 6, 6, Math.PI, 0, facing < 0);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#FDE047';
      ctx.beginPath();
      ctx.arc(handX, topY - 8, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (options?.prop === 'sling') {
    ctx.strokeStyle = '#92400E';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(handX, handY);
    ctx.quadraticCurveTo(handX + facing * 14, handY + 10, handX + facing * 10, handY - 8);
    ctx.stroke();
    ctx.fillStyle = '#CBD5E1';
    ctx.beginPath();
    ctx.arc(handX + facing * 11, handY - 9, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (options?.prop === 'basket') {
    ctx.fillStyle = '#B45309';
    roundedRect(ctx, handX - 8, handY - 4, 18, 12, 5);
    ctx.fill();
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(handX + 1, handY - 5, 4.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (options?.prop === 'cane') {
    ctx.strokeStyle = '#92400E';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(handX, handY);
    ctx.lineTo(handX + facing * 10, footY - 1);
    ctx.stroke();
  }

  // Hand circle
  ctx.fillStyle = options?.hitFlash ? '#FFFFFF' : '#F6C69F';
  ctx.beginPath();
  ctx.arc(handX, handY, 4.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Head with ink outline
  ctx.fillStyle = options?.hitFlash ? '#FFFFFF' : '#F6C69F';
  ctx.beginPath();
  ctx.arc(cx, topY + 13, 13.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Hair cap
  ctx.fillStyle = '#311D12';
  ctx.beginPath();
  ctx.arc(cx, topY + 10, 13.5, Math.PI * 0.95, Math.PI * 2.05);
  ctx.fill();

  if (options?.headband) {
    ctx.fillStyle = sashColor;
    ctx.fillRect(cx - 12, topY + 6, 24, 4.5);
  }
  if (options?.beard) {
    ctx.fillStyle = '#451A03';
    ctx.beginPath();
    ctx.arc(cx + facing * 1, topY + 16, 10, 0.1, Math.PI - 0.1);
    ctx.fill();
  }

  // Expressive eye + rosy cheek
  ctx.fillStyle = '#1E1B18';
  ctx.beginPath();
  ctx.arc(cx + facing * 5.2, topY + 12.2, 2.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(cx + facing * 5.8, topY + 11.4, 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(239, 68, 68, 0.24)';
  ctx.beginPath();
  ctx.arc(cx + facing * 7.2, topY + 15.8, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawInteractSpot(
  ctx: CanvasRenderingContext2D,
  spot: InteractSpot,
  world: GameWorld,
  cam: number
) {
  const sx = spot.x - cam;
  if (sx < -80 || sx > VIEW_WIDTH + 80) return;

  const pulse = 1 + Math.sin(world.elapsed * 4.2) * 0.1;

  if (spot.kind === 'animal_pair') {
    const kind = spot.animalKind ?? 'sheep';
    ctx.save();
    ctx.globalAlpha = spot.done ? 0.35 : 1;
    if (kind === 'sheep') {
      ctx.fillStyle = '#FFFBEB';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx - 8, spot.y, 12, 0, Math.PI * 2);
      ctx.arc(sx + 6, spot.y - 2, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#292524';
      ctx.beginPath();
      ctx.arc(sx + 18, spot.y - 5, 7, 0, Math.PI * 2);
      ctx.fill();
    } else if (kind === 'elephant') {
      ctx.fillStyle = '#94A3B8';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      roundedRect(ctx, sx - 24, spot.y - 16, 46, 32, 12);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(sx + 20, spot.y - 8, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Trunk
      ctx.strokeStyle = '#64748B';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(sx + 30, spot.y - 6);
      ctx.quadraticCurveTo(sx + 38, spot.y + 6, sx + 28, spot.y + 12);
      ctx.stroke();
    } else if (kind === 'lion') {
      ctx.fillStyle = '#D97706';
      roundedRect(ctx, sx - 20, spot.y - 8, 40, 24, 10);
      ctx.fill();
      ctx.fillStyle = '#78350F';
      ctx.beginPath();
      ctx.arc(sx + 16, spot.y - 6, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(sx + 16, spot.y - 6, 8.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Dove pair
      ctx.fillStyle = '#F8FAFC';
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(sx, spot.y - 4, 16, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(sx + 12, spot.y - 10, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    if (!spot.done) {
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(sx, spot.y - 34, 6 * pulse, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }

  if (spot.kind === 'furnace_friend') {
    drawPersonSprite(
      ctx,
      sx - 18,
      spot.y - 20,
      36,
      56,
      spot.done ? '#FEF08A' : '#0284C7',
      '#F59E0B',
      -1,
      0,
      { dewAura: spot.done }
    );
    return;
  }

  if (spot.kind === 'deliver_bread') {
    drawPersonSprite(ctx, sx - 16, spot.y - 16, 32, 48, '#64748B', '#F59E0B', -1, 0);
    if (spot.done) {
      ctx.fillStyle = '#FBBF24';
      ctx.beginPath();
      ctx.arc(sx, spot.y - 32, 8, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }

  if (!spot.done) {
    ctx.save();
    ctx.fillStyle = 'rgba(251, 191, 36, 0.28)';
    ctx.beginPath();
    ctx.arc(sx, spot.y, 28 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(sx, spot.y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawLion(ctx: CanvasRenderingContext2D, lion: LionEnemy, cam: number, t: number) {
  const x = lion.x - cam;
  if (x + lion.w < -40 || x > VIEW_WIDTH + 40) return;

  ctx.save();
  const cx = x + lion.w / 2;

  if (lion.state === 'telegraph') {
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(cx, lion.y + 22, 46 + Math.sin(t * 25) * 4, 0, Math.PI * 2);
    ctx.stroke();
  } else if (lion.state === 'calmed') {
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(cx, lion.y - 4, 20, 6, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Swishing tail
  const tailX = lion.facing === 1 ? x - 2 : x + lion.w + 2;
  ctx.strokeStyle = '#B45309';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(tailX, lion.y + 24);
  ctx.quadraticCurveTo(
    tailX - lion.facing * 14,
    lion.y + 10 + Math.sin(t * 6) * 5,
    tailX - lion.facing * 18,
    lion.y + 16
  );
  ctx.stroke();

  // Body
  ctx.fillStyle = lion.hitFlashTimer > 0 ? '#FFFFFF' : lion.state === 'calmed' ? '#F59E0B' : '#D97706';
  roundedRect(ctx, x, lion.y + 12, lion.w, lion.h - 12, 14);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Mane & Head
  const headX = lion.facing === 1 ? x + lion.w - 14 : x + 14;
  ctx.fillStyle = '#78350F';
  ctx.beginPath();
  ctx.arc(headX, lion.y + 18, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#F59E0B';
  ctx.beginPath();
  ctx.arc(headX, lion.y + 18, 13.5, 0, Math.PI * 2);
  ctx.fill();

  // Eye (peacefully closed arc when calmed!)
  ctx.strokeStyle = '#1E1B18';
  ctx.fillStyle = '#1E1B18';
  if (lion.state === 'calmed') {
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(headX + lion.facing * 4, lion.y + 17, 3.5, 0, Math.PI);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(headX + lion.facing * 4, lion.y + 16, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawHazard(ctx: CanvasRenderingContext2D, h: HazardWave, cam: number, t: number) {
  const x = h.x - cam;
  if (x + h.w < -40 || x > VIEW_WIDTH + 40 || h.state === 'stopped') return;

  if (h.state === 'telegraph') {
    ctx.fillStyle = 'rgba(245, 158, 11, 0.36)';
    roundedRect(ctx, x - 6, h.y - 6, h.w + 12, h.h + 12, 12);
    ctx.fill();
  }

  if (h.kind === 'fire_jet') {
    if (h.state === 'active') {
      const flicker = Math.sin(t * 24) * 6;
      ctx.fillStyle = '#EF4444';
      roundedRect(ctx, x, h.y + flicker, h.w, h.h - flicker, 18);
      ctx.fill();
      ctx.fillStyle = '#FBBF24';
      roundedRect(ctx, x + 10, h.y + 24 + flicker, h.w - 20, h.h - 24 - flicker, 12);
      ctx.fill();
    } else {
      ctx.fillStyle = h.state === 'telegraph' ? '#F59E0B' : '#78350F';
      roundedRect(ctx, x + 6, h.y + h.h - 14, h.w - 12, 14, 6);
      ctx.fill();
    }
  } else if (h.kind === 'sea_wave') {
    ctx.fillStyle = '#0284C7';
    roundedRect(ctx, x, h.y, h.w, h.h, 18);
    ctx.fill();
    ctx.strokeStyle = '#E0F2FE';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + 10, h.y + 9);
    ctx.lineTo(x + h.w - 10, h.y + 9);
    ctx.stroke();
  } else if (h.kind === 'spear') {
    ctx.fillStyle = '#92400E';
    ctx.fillRect(x + 14, h.y + 8, h.w - 14, 6);
    ctx.fillStyle = '#E2E8F0';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, h.y + 11);
    ctx.lineTo(x + 18, h.y + 2);
    ctx.lineTo(x + 18, h.y + 20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (h.kind === 'chariot') {
    ctx.fillStyle = '#78350F';
    roundedRect(ctx, x, h.y, h.w, h.h - 12, 10);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(x + 22, h.y + h.h - 10, 14, 0, Math.PI * 2);
    ctx.arc(x + h.w - 22, h.y + h.h - 10, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.stroke();
  } else {
    drawPersonSprite(ctx, x + 8, h.y, 40, h.h, '#64748B', '#CBD5E1', h.vx >= 0 ? 1 : -1, t * 8);
  }
}

function drawGoliath(ctx: CanvasRenderingContext2D, world: GameWorld, cam: number) {
  const g = world.goliath;
  if (!g) return;
  const x = g.x - cam;
  const y = g.state === 'defeated' ? g.y + 92 : g.y;
  const h = g.state === 'defeated' ? 68 : g.h;

  ctx.save();
  if (g.state === 'vulnerable') {
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x + g.w / 2, y + 32, 56 + Math.sin(world.elapsed * 12) * 4, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Bronze armor torso
  ctx.fillStyle = g.hitFlashTimer > 0 ? '#FFFFFF' : '#475569';
  roundedRect(ctx, x, y + 32, g.w, h - 32, 16);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Bronze belt & shoulder plates
  ctx.fillStyle = '#D97706';
  ctx.fillRect(x + 8, y + 84, g.w - 16, 12);

  // Helmet & red crest plume
  if (g.state !== 'defeated') {
    ctx.fillStyle = '#DC2626';
    ctx.beginPath();
    ctx.ellipse(x + g.w / 2 + 6, y - 4, 24, 10, -0.25, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#F59E0B';
  ctx.beginPath();
  ctx.arc(x + g.w / 2, y + 24, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Embossed tower shield
  if (g.shieldUp && g.state !== 'defeated') {
    ctx.fillStyle = '#94A3B8';
    roundedRect(ctx, x - 20, y + 44, 26, 98, 8);
    ctx.fill();
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  // Goliath HP bar
  if (g.state !== 'defeated') {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    roundedRect(ctx, x + 2, y - 28, g.w - 4, 14, 7);
    ctx.fill();
    ctx.fillStyle = '#EF4444';
    roundedRect(ctx, x + 4, y - 26, ((g.w - 8) * g.hp) / g.maxHp, 10, 5);
    ctx.fill();
  }
  ctx.restore();
}

function drawOffscreenCompass(ctx: CanvasRenderingContext2D, world: GameWorld, cam: number) {
  const targetX = world.objectiveTargetX;
  if (targetX === null || world.outcome) return;

  const screenX = targetX - cam;
  if (screenX >= 80 && screenX <= VIEW_WIDTH - 80) return;

  const isRight = screenX > VIEW_WIDTH - 80;
  const ax = isRight ? VIEW_WIDTH - 52 : 52;
  const ay = 340 + Math.sin(world.elapsed * 5) * 6;

  ctx.save();
  ctx.fillStyle = 'rgba(28, 25, 23, 0.85)';
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(ax, ay, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FDE047';
  ctx.beginPath();
  if (isRight) {
    ctx.moveTo(ax - 5, ay - 9);
    ctx.lineTo(ax + 9, ay);
    ctx.lineTo(ax - 5, ay + 9);
  } else {
    ctx.moveTo(ax + 5, ay - 9);
    ctx.lineTo(ax - 9, ay);
    ctx.lineTo(ax + 5, ay + 9);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawSpeechBubble(
  ctx: CanvasRenderingContext2D,
  world: GameWorld,
  cam: number,
  isSpeaking: boolean
) {
  const d = world.dialogue;
  if (!d) return;

  ctx.save();
  ctx.font = '600 15px "Plus Jakarta Sans", system-ui, sans-serif';

  const maxTextWidth = 400;
  const cacheKey = `${d.id}::${d.speaker}::${d.text}`;

  let lines: string[];
  let bubbleW: number;
  let bubbleH: number;

  if (bubbleWrapCache && bubbleWrapCache.key === cacheKey) {
    lines = bubbleWrapCache.lines;
    bubbleW = bubbleWrapCache.width;
    bubbleH = bubbleWrapCache.height;
  } else {
    const words = d.text.split(' ');
    lines = [];
    let current = '';
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (ctx.measureText(test).width > maxTextWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);

    let maxLineW = ctx.measureText(d.speaker).width + 58;
    for (const l of lines) {
      maxLineW = Math.max(maxLineW, ctx.measureText(l).width);
    }
    bubbleW = Math.min(450, Math.max(245, maxLineW + 38));
    bubbleH = 46 + lines.length * 22;
    bubbleWrapCache = { key: cacheKey, lines, width: bubbleW, height: bubbleH };
  }

  const rawX = d.x - cam - bubbleW / 2;
  const bx = Math.max(24, Math.min(VIEW_WIDTH - bubbleW - 24, rawX));
  const by = Math.max(128, Math.min(VIEW_HEIGHT - bubbleH - 120, d.y - bubbleH - 14));

  // Soft storybook card shadow
  ctx.fillStyle = 'rgba(28, 19, 12, 0.22)';
  roundedRect(ctx, bx + 4, by + 5, bubbleW, bubbleH, 16);
  ctx.fill();

  // Warm parchment scroll background
  ctx.fillStyle = 'rgba(255, 251, 240, 0.97)';
  roundedRect(ctx, bx, by, bubbleW, bubbleH, 16);
  ctx.fill();
  ctx.strokeStyle = '#D97706';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Speaker header
  ctx.font = '700 13px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillStyle = '#B45309';
  ctx.fillText(d.speaker.toUpperCase(), bx + 18, by + 23);

  // Sound wave indicator while TTS is actively speaking
  if (isSpeaking) {
    const waveX = bx + bubbleW - 38;
    const waveY = by + 19;
    ctx.fillStyle = '#D97706';
    for (let i = 0; i < 3; i++) {
      const barH = 4 + Math.abs(Math.sin(world.elapsed * 12 + i * 1.4)) * 9;
      roundedRect(ctx, waveX + i * 7, waveY - barH / 2, 4, barH, 2);
      ctx.fill();
    }
  }

  // Body lines
  ctx.font = '600 15px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillStyle = '#292524';
  lines.forEach((line, idx) => {
    ctx.fillText(line, bx + 18, by + 46 + idx * 22);
  });
  ctx.restore();
}

export function getStageFrameColors(world: GameWorld): { top: string; bottom: string } {
  switch (world.stage) {
    case 'babylon_terrace':
      return { top: '#0B132B', bottom: '#475569' };
    case 'lions_den':
      return { top: '#0F172A', bottom: '#475569' };
    case 'fiery_furnace':
      return { top: '#2B0908', bottom: '#475569' };
    case 'galilee_storm':
      return world.stormCalm > 0.5
        ? { top: '#38BDF8', bottom: '#7C3E18' }
        : { top: '#0B132B', bottom: '#7C3E18' };
    case 'zaqueo_house':
      return { top: '#78350F', bottom: '#7C3E18' };
    case 'red_sea':
      return { top: '#FB923C', bottom: '#B47B44' };
    case 'noah_ark':
      return { top: '#60A5FA', bottom: '#65A30D' };
    case 'galilee_hills':
      return { top: '#60C5F1', bottom: '#65A30D' };
    default:
      return { top: '#60C5F1', bottom: '#B47B44' };
  }
}

export function renderWorld(
  ctx: CanvasRenderingContext2D,
  world: GameWorld,
  isSpeaking = false
) {
  ctx.save();
  const shake = world.trauma * world.trauma * 9;
  if (shake > 0.2) {
    ctx.translate((Math.random() * 2 - 1) * shake, (Math.random() * 2 - 1) * shake);
  }
  if (world.story === 'tormenta') {
    ctx.translate(VIEW_WIDTH / 2, VIEW_HEIGHT / 2);
    ctx.rotate(world.boatTilt);
    ctx.translate(-VIEW_WIDTH / 2, -VIEW_HEIGHT / 2);
  }

  const cam = world.cameraX;
  drawSkyBackdrop(ctx, world);

  for (const plat of world.platforms) {
    drawPlatform(ctx, plat, cam, world);
  }

  drawSycamore(ctx, world, cam);

  // Crowd groups (Zaqueo)
  for (const c of world.crowdGroups) {
    if (c.parted) continue;
    const cx = c.x - cam;
    const robes = ['#64748B', '#7C2D12', '#4D7C0F'];
    for (let i = 0; i < 3; i++) {
      drawPersonSprite(ctx, cx + i * 38, c.y + 8, 34, 58, robes[i % 3], '#FEF3C7', -1, 0);
    }
  }

  // Prayer windows (Daniel terrace)
  for (const pw of world.prayerWindows) {
    const px = pw.x - cam;
    ctx.fillStyle = pw.prayed ? '#FDE047' : '#334155';
    roundedRect(ctx, px - 28, pw.y - 84, 56, 84, 24);
    ctx.fill();
    ctx.strokeStyle = pw.prayed ? '#F59E0B' : '#94A3B8';
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  // Angel lights (Daniel den)
  for (const al of world.angelLights) {
    const ax = al.x - cam;
    const ay = al.y + Math.sin(world.angelFloatPhase) * 6;
    ctx.fillStyle = al.activated ? 'rgba(253, 224, 71, 0.92)' : 'rgba(253, 224, 71, 0.34)';
    ctx.beginPath();
    ctx.arc(ax, ay, al.activated ? 22 : 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FEF08A';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Guards (Daniel terrace)
  for (const g of world.guards) {
    const gx = g.x - cam;
    if (g.state === 'telegraph' || g.state === 'alert') {
      ctx.fillStyle =
        g.state === 'alert' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)';
      ctx.beginPath();
      ctx.moveTo(gx + 18, g.y + 20);
      ctx.lineTo(gx + 18 + g.facing * g.sightRange, g.y - 18);
      ctx.lineTo(gx + 18 + g.facing * g.sightRange, g.y + 62);
      ctx.closePath();
      ctx.fill();
    }
    drawPersonSprite(ctx, gx, g.y, 38, 62, '#7F1D1D', '#F59E0B', g.facing, 0, { prop: 'staff' });
  }

  // Chest & Neighbors (Zaqueo house)
  if (world.stage === 'zaqueo_house') {
    const chestX = 312 - cam;
    if (world.chestOpened) {
      ctx.fillStyle = 'rgba(253, 224, 71, 0.32)';
      ctx.beginPath();
      ctx.arc(chestX + 28, 535, 42, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = world.chestOpened ? '#F59E0B' : '#78350F';
    roundedRect(ctx, chestX, 530, 56, 46, 8);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    for (const n of world.neighbors) {
      drawPersonSprite(
        ctx,
        n.x - 18 - cam,
        n.y,
        36,
        60,
        n.blessed ? '#059669' : '#57534E',
        '#FDE68A',
        -1,
        0,
        { halo: n.blessed }
      );
    }
  }

  // Interact spots
  for (const spot of world.interactSpots) {
    drawInteractSpot(ctx, spot, world, cam);
  }

  // Jesus NPC
  if (world.jesus.active) {
    drawPersonSprite(
      ctx,
      world.jesus.x - cam,
      world.jesus.y,
      40,
      64,
      '#FFFDF7',
      '#B91C1C',
      world.jesus.facing,
      world.jesus.walkCycle,
      { halo: true, beard: true }
    );
  }

  // Fourth figure angel walking in furnace once a friend joins
  if (
    world.story === 'horno' &&
    world.interactSpots.some((s) => s.kind === 'furnace_friend' && s.done)
  ) {
    drawPersonSprite(
      ctx,
      world.player.x - 46 - cam,
      world.player.y - 6,
      38,
      62,
      '#FEF9C3',
      '#F59E0B',
      1,
      world.player.walkCycle,
      { halo: true }
    );
  }

  // Lions, Goliath, Hazards
  for (const lion of world.lions) {
    drawLion(ctx, lion, cam, world.elapsed);
  }
  drawGoliath(ctx, world, cam);
  for (const h of world.hazards) {
    drawHazard(ctx, h, cam, world.elapsed);
  }

  // Sling stones
  for (const s of world.slingStones) {
    if (!s.active) continue;
    ctx.fillStyle = '#E2E8F0';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(s.x - cam, s.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Collectibles with golden sparkle ring
  for (const item of world.collectibles) {
    if (item.collected) continue;
    const ix = item.x - cam;
    const bob = Math.sin(world.elapsed * 3.5 + item.x * 0.02) * 5;
    const col =
      item.kind === 'dew' ? '#38BDF8' : item.kind === 'stone' ? '#CBD5E1' : '#FBBF24';

    ctx.fillStyle = item.kind === 'dew' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(251, 191, 36, 0.25)';
    ctx.beginPath();
    ctx.arc(ix, item.y + bob, 17, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = col;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ix, item.y + bob, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Player character palette & prop per story
  const playerStyle: Record<
    string,
    { tunic: string; sash: string; beard?: boolean; headband?: boolean; prop?: HeldProp }
  > = {
    zaqueo: { tunic: '#B91C1C', sash: '#F59E0B' },
    flujo: { tunic: '#9D174D', sash: '#FDE68A', headband: true },
    bartimeo: { tunic: '#B45309', sash: '#FEF3C7', beard: true, prop: 'cane' },
    panes: { tunic: '#15803D', sash: '#FBBF24', prop: 'basket' },
    tormenta: { tunic: '#1D4ED8', sash: '#E2E8F0', beard: true },
    daniel: { tunic: '#1E40AF', sash: '#FDE047', beard: true },
    david: { tunic: '#047857', sash: '#F59E0B', headband: true, prop: 'sling' },
    horno: { tunic: '#0369A1', sash: '#38BDF8' },
    moises: { tunic: '#7C2D12', sash: '#F59E0B', beard: true, prop: 'staff' },
    noe: { tunic: '#4D7C0F', sash: '#D97706', beard: true, prop: 'crook' },
  };
  const pal = playerStyle[world.story] ?? { tunic: '#B91C1C', sash: '#F59E0B' };

  if (!(world.player.invulnTimer > 0 && Math.floor(world.elapsed * 16) % 2 === 0)) {
    drawPersonSprite(
      ctx,
      world.player.x - cam,
      world.player.y,
      world.player.w,
      world.player.h,
      pal.tunic,
      pal.sash,
      world.player.facing,
      world.player.walkCycle,
      {
        crouching: world.player.crouching,
        hitFlash: world.player.hitFlashTimer > 0,
        beard: pal.beard,
        headband: pal.headband,
        scaleX: world.player.scaleX,
        scaleY: world.player.scaleY,
        prop: pal.prop,
        dewAura: world.dewShieldCharges > 0,
      }
    );
  }

  // Bartimeo gentle darkness vignette that clears as sightRevealed increases
  if (world.story === 'bartimeo' && world.sightRevealed < 0.99) {
    const px = world.player.x + world.player.w / 2 - cam;
    const py = world.player.y + world.player.h / 2;
    const clearRadius = 155 + world.sightRevealed * 520;
    const fog = ctx.createRadialGradient(px, py, clearRadius * 0.45, px, py, clearRadius);
    fog.addColorStop(0, 'rgba(15, 23, 42, 0)');
    fog.addColorStop(1, `rgba(15, 23, 42, ${0.7 * (1 - world.sightRevealed)})`);
    ctx.fillStyle = fog;
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  }

  // Particles
  for (let i = 0; i < particlePool.length; i++) {
    const p = particlePool[i];
    if (!p.active) continue;
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x - cam, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Off-screen objective directional guide
  drawOffscreenCompass(ctx, world, cam);

  // Floating [E] prompt
  if (world.nearbyPrompt) {
    ctx.font = '700 14px "Plus Jakarta Sans", system-ui, sans-serif';
    const textW = ctx.measureText(world.nearbyPrompt.label).width + 28;
    const px = Math.max(
      20,
      Math.min(VIEW_WIDTH - textW - 20, world.nearbyPrompt.x - cam - textW / 2)
    );
    const py = Math.max(115, world.nearbyPrompt.y - 16);
    ctx.fillStyle = 'rgba(28, 25, 23, 0.92)';
    roundedRect(ctx, px, py, textW, 32, 10);
    ctx.fill();
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#FDE047';
    ctx.fillText(world.nearbyPrompt.label, px + 14, py + 21);
  }

  drawSpeechBubble(ctx, world, cam, isSpeaking);
  ctx.restore();
}
