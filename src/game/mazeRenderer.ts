import { CellType, EnemyState, Particle } from './types';
import { TILE_SIZE } from './constants';
import { getRaycastDistance } from './rules';
import { ProcessedCharacter } from './imageProcessor';

/**
 * Renders the maze floor, two-tone walls, collectible milk bottles, and particle effects.
 */
export function drawMaze(
  ctx: CanvasRenderingContext2D,
  grid: CellType[][],
  time: number,
  milkAsset?: ProcessedCharacter | null
) {
  const rows = grid.length;
  const cols = grid[0].length;
  const width = cols * TILE_SIZE;
  const height = rows * TILE_SIZE;

  // 1. Dark navy/charcoal floor
  ctx.fillStyle = '#080c15';
  ctx.fillRect(0, 0, width, height);

  // Subtle floor grid pattern for arcade depth
  ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
  ctx.lineWidth = 1;
  for (let c = 0; c <= cols; c += 2) {
    ctx.beginPath();
    ctx.moveTo(c * TILE_SIZE, 0);
    ctx.lineTo(c * TILE_SIZE, height);
    ctx.stroke();
  }
  for (let r = 0; r <= rows; r += 2) {
    ctx.beginPath();
    ctx.moveTo(0, r * TILE_SIZE);
    ctx.lineTo(width, r * TILE_SIZE);
    ctx.stroke();
  }

  // 2. Render Walls (Two-tone: Upper clean white tile, Lower saturated medium blue)
  const whiteHeight = 24; // Upper section ~55% of 44px
  const blueHeight = TILE_SIZE - whiteHeight; // Lower section ~45% of 44px

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 1) {
        const x = c * TILE_SIZE;
        const y = r * TILE_SIZE;

        // Upper Section: Clean White Tile
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(x, y, TILE_SIZE, whiteHeight);

        // White tile glossy bevel/highlight
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 1, y + 1, TILE_SIZE - 2, 3);

        // White tile subtle grout border
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, TILE_SIZE - 1, whiteHeight);

        // Lower Section: Saturated Medium Blue
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(x, y + whiteHeight, TILE_SIZE, blueHeight);

        // Blue base shadow / grounding depth
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(x, y + TILE_SIZE - 3, TILE_SIZE, 3);

        // Transition seam between white tile and blue section
        ctx.fillStyle = '#1e3a8a';
        ctx.fillRect(x, y + whiteHeight - 1, TILE_SIZE, 1.5);

        // Outer crisp outline of the entire block
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.45)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
      } else if (grid[r][c] === 2) {
        // 3. Collectible Milk Bottle (Walkable corridor item)
        const dotCenterX = c * TILE_SIZE + TILE_SIZE / 2;
        const dotCenterY = r * TILE_SIZE + TILE_SIZE / 2;

        if (milkAsset) {
          const renderH = 26; // Scaled to fit comfortably inside 44px corridor tile
          const renderW = (milkAsset.width / milkAsset.height) * renderH;

          // Gentle floating levitation animation
          const floatOffset = Math.sin(time * 3.5 + (c + r) * 0.4) * 1.5;

          // Soft blue/cyan ambient glow under bottle
          ctx.beginPath();
          ctx.arc(dotCenterX, dotCenterY + floatOffset, 11, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
          ctx.fill();

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(
            milkAsset.canvas,
            dotCenterX - renderW / 2,
            dotCenterY - renderH / 2 + floatOffset,
            renderW,
            renderH
          );
        } else {
          // Fallback if asset is loading
          const pulse = Math.sin(time * 4 + (c + r) * 0.5) * 0.5 + 0.5;
          const dotRadius = 4.6 + pulse * 0.8;

          ctx.beginPath();
          ctx.arc(dotCenterX, dotCenterY, dotRadius + 4.5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(254, 240, 138, 0.22)';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(dotCenterX, dotCenterY, dotRadius, 0, Math.PI * 2);
          ctx.fillStyle = '#fef08a';
          ctx.fill();
        }
      }
    }
  }
}

/**
 * Draws the Directional Camera Vision Cone for an enemy:
 * - 70° Field of View projecting along the enemy's facing direction
 * - Raycast against maze walls (walls block camera vision)
 * - Maximum vision length is 3x enemy rendered height (180px)
 * - Dynamic warning colors: slate/cyan when calm, amber when near, red alert when spotted
 */
export function drawSurveillanceZone(
  ctx: CanvasRenderingContext2D,
  enemy: EnemyState,
  time: number,
  grid?: CellType[][]
) {
  const { x, y, renderedHeight, proximityRatio } = enemy;
  const isSpotted = proximityRatio >= 1.0;
  const fovDegrees = enemy.fovDegrees || 70;
  const halfFovRad = ((fovDegrees / 2) * Math.PI) / 180;
  const maxVisionDistance = enemy.maxVisionDistance || enemy.detectionRadius || renderedHeight * 3;
  const facingAngle = enemy.facingAngle ?? (enemy.facing === 'left' ? Math.PI : 0);

  ctx.save();

  // Color selection:
  // Calm: stealth cyan beam
  // Close: warning vibrant orange
  // Spotted: alert flashing red
  let fillStartColor: string;
  let fillEndColor: string;
  let strokeColor: string;
  let pulseSpeed = 2;

  if (isSpotted) {
    const flash = Math.sin(time * 18) > 0;
    fillStartColor = flash ? 'rgba(239, 68, 68, 0.55)' : 'rgba(220, 38, 38, 0.35)';
    fillEndColor = flash ? 'rgba(239, 68, 68, 0.22)' : 'rgba(185, 28, 28, 0.1)';
    strokeColor = '#ef4444';
    pulseSpeed = 14;
  } else if (proximityRatio > 0.05) {
    const p = Math.min(1, proximityRatio);
    fillStartColor = `rgba(249, 115, 22, ${0.18 + p * 0.22})`;
    fillEndColor = `rgba(249, 115, 22, ${0.04 + p * 0.08})`;
    strokeColor = `rgba(249, 115, 22, ${0.5 + p * 0.45})`;
    pulseSpeed = 5 + p * 7;
  } else {
    fillStartColor = 'rgba(56, 189, 248, 0.18)';
    fillEndColor = 'rgba(56, 189, 248, 0.03)';
    strokeColor = 'rgba(56, 189, 248, 0.45)';
  }

  // 1. Raycast polygon calculation along the 70° FOV cone
  const numRays = 33;
  const startAngle = facingAngle - halfFovRad;
  const endAngle = facingAngle + halfFovRad;
  const angleStep = (endAngle - startAngle) / (numRays - 1);

  const hitPoints: { x: number; y: number; dist: number; angle: number }[] = [];

  for (let i = 0; i < numRays; i++) {
    const angle = startAngle + i * angleStep;
    const rayDist = grid
      ? getRaycastDistance(x, y, angle, maxVisionDistance, grid, TILE_SIZE)
      : maxVisionDistance;
    hitPoints.push({
      x: x + Math.cos(angle) * rayDist,
      y: y + Math.sin(angle) * rayDist,
      dist: rayDist,
      angle,
    });
  }

  // 2. Fill Directional Camera Cone with Radial Gradient
  const grad = ctx.createRadialGradient(x, y, 6, x, y, maxVisionDistance);
  grad.addColorStop(0, fillStartColor);
  grad.addColorStop(0.7, fillStartColor);
  grad.addColorStop(1, fillEndColor);

  ctx.beginPath();
  ctx.moveTo(x, y);
  for (const pt of hitPoints) {
    ctx.lineTo(pt.x, pt.y);
  }
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // 3. Side Boundary Rays (Left edge and Right edge of the camera vision cone)
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = isSpotted ? 2.5 : 1.5;
  ctx.beginPath();
  // Left side ray
  ctx.moveTo(x, y);
  ctx.lineTo(hitPoints[0].x, hitPoints[0].y);
  // Right side ray
  ctx.moveTo(x, y);
  ctx.lineTo(hitPoints[hitPoints.length - 1].x, hitPoints[hitPoints.length - 1].y);
  ctx.stroke();

  // 4. Perimeter Arc (Dashed radar style along the raycast boundary)
  ctx.beginPath();
  ctx.moveTo(hitPoints[0].x, hitPoints[0].y);
  for (let i = 1; i < hitPoints.length; i++) {
    ctx.lineTo(hitPoints[i].x, hitPoints[i].y);
  }
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = isSpotted ? 2.5 : 1.5;
  ctx.setLineDash([5, 5]);
  ctx.lineDashOffset = -time * pulseSpeed * 10;
  ctx.stroke();
  ctx.setLineDash([]);

  // 5. Sweeping Camera Lens Scan Beam
  const sweepAngle = facingAngle + Math.sin(time * 3.5) * halfFovRad * 0.85;
  const sweepDist = grid
    ? getRaycastDistance(x, y, sweepAngle, maxVisionDistance, grid, TILE_SIZE)
    : maxVisionDistance;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(sweepAngle) * sweepDist, y + Math.sin(sweepAngle) * sweepDist);
  ctx.strokeStyle = isSpotted
    ? 'rgba(255, 255, 255, 0.7)'
    : proximityRatio > 0.05
    ? 'rgba(254, 215, 170, 0.6)'
    : 'rgba(186, 230, 253, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 6. Camera Lens Hardware Indicator on Enemy pointing in facing direction
  const lensDist = 14;
  const lensX = x + Math.cos(facingAngle) * lensDist;
  const lensY = y + Math.sin(facingAngle) * lensDist;

  // Small camera lens dot
  ctx.beginPath();
  ctx.arc(lensX, lensY, 4, 0, Math.PI * 2);
  ctx.fillStyle = isSpotted ? '#ef4444' : proximityRatio > 0.05 ? '#f97316' : '#38bdf8';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.stroke();

  // 7. Tactical Text Label
  if (proximityRatio > 0.2) {
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = isSpotted ? '#fca5a5' : '#fed7aa';
    const label = isSpotted ? '!! CAMERA SPOTTED !!' : 'CAM FOV (70°)';
    ctx.fillText(label, x, y - renderedHeight / 2 - 14);
  }

  ctx.restore();
}

/**
 * Draws active particles
 */
export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
