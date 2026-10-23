import { DETECTION_HEIGHT_MULTIPLIER, WARNING_DISTANCE_FACTOR } from './constants';
import { CellType, Difficulty, Direction, GridCoord, Position } from './types';

/**
 * Calculates maximum camera viewing distance strictly according to the rule:
 * maxVisionDistance = enemyRenderedHeight * 3
 */
export function calculateDetectionRadius(enemyRenderedHeight: number): number {
  return enemyRenderedHeight * DETECTION_HEIGHT_MULTIPLIER;
}

/**
 * Converts a grid Direction to radians (in Canvas coordinates):
 * RIGHT: 0 rad
 * DOWN: PI / 2 rad (90 deg)
 * LEFT: PI rad (180 deg)
 * UP: -PI / 2 rad (-90 deg)
 */
export function directionToAngle(dir: Direction, currentAngle = 0): number {
  switch (dir) {
    case 'RIGHT':
      return 0;
    case 'DOWN':
      return Math.PI / 2;
    case 'LEFT':
      return Math.PI;
    case 'UP':
      return -Math.PI / 2;
    default:
      return currentAngle;
  }
}

/**
 * Normalizes an angle in radians into the range [-PI, PI]
 */
export function normalizeAngle(rad: number): number {
  let a = rad % (Math.PI * 2);
  if (a > Math.PI) a -= Math.PI * 2;
  if (a < -Math.PI) a += Math.PI * 2;
  return a;
}

/**
 * Calculates Euclidean distance between two points in world coordinates
 */
export function calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x2 - x1, y2 - y1);
}

/**
 * Line of sight check: verifies that the straight line between (x1, y1) and (x2, y2)
 * does not intersect any wall cell in the maze grid.
 * Maze walls strictly block the camera's line of sight!
 */
export function hasLineOfSight(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  grid: CellType[][],
  tileSize: number
): boolean {
  const dist = Math.hypot(x2 - x1, y2 - y1);
  if (dist === 0) return true;

  // Step sampling along the ray (step size = 1/4 of a tile)
  const stepDist = tileSize * 0.25;
  const steps = Math.max(1, Math.ceil(dist / stepDist));

  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const px = x1 + (x2 - x1) * t;
    const py = y1 + (y2 - y1) * t;
    const col = Math.floor(px / tileSize);
    const row = Math.floor(py / tileSize);

    if (row >= 0 && row < grid.length && col >= 0 && col < grid[0].length) {
      if (grid[row][col] === 1) {
        // Wall blocks camera vision!
        return false;
      }
    }
  }

  return true;
}

/**
 * Casts a ray from (startX, startY) along an angle up to maxDist.
 * Returns the distance to the first wall collision, or maxDist if unobstructed.
 */
export function getRaycastDistance(
  startX: number,
  startY: number,
  angle: number,
  maxDist: number,
  grid: CellType[][],
  tileSize: number
): number {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const step = tileSize * 0.2; // ~8.8px steps for 44px tiles
  let dist = 0;

  while (dist < maxDist) {
    dist += step;
    const checkDist = Math.min(dist, maxDist);
    const px = startX + cos * checkDist;
    const py = startY + sin * checkDist;
    const col = Math.floor(px / tileSize);
    const row = Math.floor(py / tileSize);

    if (row < 0 || row >= grid.length || col < 0 || col >= grid[0].length) {
      return checkDist;
    }
    if (grid[row][col] === 1) {
      return checkDist;
    }
  }

  return maxDist;
}

/**
 * Directional Camera Vision Cone Detection:
 * The enemy detects the hero ONLY when:
 * 1. Hero is within maximum viewing distance (approx 3x enemy rendered height)
 * 2. Hero is within the directional field of view (70 degrees total, 35 deg on each side of facing)
 * 3. Maze walls DO NOT block line of sight between the camera and hero.
 *
 * Being behind the enemy or around a wall corner NEVER triggers detection!
 */
export function isHeroInCameraVision(
  heroPos: Position,
  enemyCameraPos: Position,
  facingAngle: number,
  fovDegrees: number,
  maxVisionDistance: number,
  grid: CellType[][],
  tileSize: number
): boolean {
  const dx = heroPos.x - enemyCameraPos.x;
  const dy = heroPos.y - enemyCameraPos.y;
  const dist = Math.hypot(dx, dy);

  // 1. Check distance
  if (dist > maxVisionDistance) {
    return false;
  }

  // 2. Check angle (FOV check)
  const angleToHero = Math.atan2(dy, dx);
  const angleDiff = Math.abs(normalizeAngle(angleToHero - facingAngle));
  const halfFovRad = ((fovDegrees / 2) * Math.PI) / 180;

  if (angleDiff > halfFovRad) {
    // Outside cone or behind enemy
    return false;
  }

  // 3. Check line of sight (walls block camera vision)
  return hasLineOfSight(enemyCameraPos.x, enemyCameraPos.y, heroPos.x, heroPos.y, grid, tileSize);
}

/**
 * Legacy alias for backwards compatibility
 */
export function isHeroSpotted(
  heroPos: Position,
  enemyPos: Position,
  enemyRenderedHeight: number
): boolean {
  // Simple distance threshold kept for fallback unit tests
  const radius = calculateDetectionRadius(enemyRenderedHeight);
  return calculateDistance(heroPos.x, heroPos.y, enemyPos.x, enemyPos.y) < radius;
}

/**
 * Calculates danger proximity ratio for directional camera cone:
 * 1.0: Hero is inside the camera vision cone with clear line of sight (SPOTTED).
 * 0.1 -> 0.9: Hero is in front of the camera approaching the cone.
 * 0.0: Hero is behind the enemy, around a corner, or far away.
 */
export function calculateCameraProximity(
  heroPos: Position,
  enemyCameraPos: Position,
  facingAngle: number,
  fovDegrees: number,
  maxVisionDistance: number,
  grid: CellType[][],
  tileSize: number
): number {
  const inVision = isHeroInCameraVision(
    heroPos,
    enemyCameraPos,
    facingAngle,
    fovDegrees,
    maxVisionDistance,
    grid,
    tileSize
  );

  if (inVision) {
    return 1.0;
  }

  // Check if hero is approaching the front cone without walls blocking
  const dx = heroPos.x - enemyCameraPos.x;
  const dy = heroPos.y - enemyCameraPos.y;
  const dist = Math.hypot(dx, dy);

  if (dist > maxVisionDistance * 1.4) {
    return 0.0;
  }

  const angleToHero = Math.atan2(dy, dx);
  const angleDiff = Math.abs(normalizeAngle(angleToHero - facingAngle));
  const warningAngleRad = (((fovDegrees * 1.3) / 2) * Math.PI) / 180;

  if (angleDiff > warningAngleRad) {
    return 0.0;
  }

  // If wall blocks sight, no warning
  if (!hasLineOfSight(enemyCameraPos.x, enemyCameraPos.y, heroPos.x, heroPos.y, grid, tileSize)) {
    return 0.0;
  }

  // Approaching front warning: ramp from 0 to 0.8
  const distRatio = 1 - dist / (maxVisionDistance * 1.4);
  const angleRatio = 1 - angleDiff / warningAngleRad;
  return Math.min(0.85, Math.max(0.1, distRatio * angleRatio * 0.85));
}

export function calculateDangerProximity(
  heroPos: Position,
  enemyPos: Position,
  detectionRadius: number
): number {
  const dist = calculateDistance(heroPos.x, heroPos.y, enemyPos.x, enemyPos.y);
  if (dist <= detectionRadius) {
    return 1.0;
  }
  const maxWarningDist = detectionRadius * WARNING_DISTANCE_FACTOR;
  if (dist >= maxWarningDist) {
    return 0.0;
  }
  return (maxWarningDist - dist) / (maxWarningDist - detectionRadius);
}

/**
 * Direction vectors in grid steps
 */
export function directionToDelta(dir: Direction): { dx: number; dy: number } {
  switch (dir) {
    case 'UP':
      return { dx: 0, dy: -1 };
    case 'DOWN':
      return { dx: 0, dy: 1 };
    case 'LEFT':
      return { dx: -1, dy: 0 };
    case 'RIGHT':
      return { dx: 1, dy: 0 };
    default:
      return { dx: 0, dy: 0 };
  }
}

export function getOppositeDirection(dir: Direction): Direction {
  switch (dir) {
    case 'UP':
      return 'DOWN';
    case 'DOWN':
      return 'UP';
    case 'LEFT':
      return 'RIGHT';
    case 'RIGHT':
      return 'LEFT';
    default:
      return 'NONE';
  }
}

/**
 * Validates whether a tile coordinate is within bounds and walkable (not a wall)
 */
export function isWalkable(col: number, row: number, grid: CellType[][]): boolean {
  if (row < 0 || row >= grid.length) return false;
  const rowData = grid[row];
  if (!rowData || col < 0 || col >= rowData.length) return false;
  return rowData[col] !== 1; // 1 is wall
}

/**
 * Counts remaining collectible dots on the grid (value === 2)
 */
export function countRemainingDots(grid: CellType[][]): number {
  let count = 0;
  for (let r = 0; r < grid.length; r++) {
    const row = grid[r];
    for (let c = 0; c < row.length; c++) {
      if (row[c] === 2) {
        count++;
      }
    }
  }
  return count;
}

/**
 * Evaluates dot collection for a given hero position
 */
export function checkDotCollection(
  heroPos: Position,
  grid: CellType[][],
  tileSize: number
): { collected: boolean; col: number; row: number } {
  const col = Math.floor(heroPos.x / tileSize);
  const row = Math.floor(heroPos.y / tileSize);

  if (row >= 0 && row < grid.length && col >= 0 && col < grid[0].length) {
    if (grid[row][col] === 2) {
      // Check center proximity (hero center within 14px of tile center)
      const dotCenterX = col * tileSize + tileSize / 2;
      const dotCenterY = row * tileSize + tileSize / 2;
      const dist = Math.hypot(heroPos.x - dotCenterX, heroPos.y - dotCenterY);
      if (dist < tileSize * 0.5) {
        grid[row][col] = 0; // Mark collected
        return { collected: true, col, row };
      }
    }
  }
  return { collected: false, col: -1, row: -1 };
}

/**
 * Win condition: all dots have been collected
 */
export function checkWinCondition(remainingDots: number): boolean {
  return remainingDots === 0;
}

/**
 * Calculates enemy speed based on base speed and current level L (1 to 10):
 * enemySpeed = baseEnemySpeed * (1 + (level - 1) * 0.01)
 * Level 1: 100%
 * Level 2: 101%
 * ...
 * Level 10: 109%
 */
export function calculateEnemySpeed(baseEnemySpeed: number, level: number): number {
  const currentLevel = Math.max(1, Math.min(10, Math.floor(level)));
  const speed = baseEnemySpeed * (1 + (currentLevel - 1) * 0.01);
  return Math.round(speed * 100) / 100;
}

/**
 * Returns the number of active enemies for a given difficulty setting:
 * - 'easy': 1 active enemy
 * - 'medium': 2 active enemies
 * - 'hard': 3 active enemies
 */
export function getEnemyCountForDifficulty(difficulty: Difficulty): number {
  switch (difficulty) {
    case 'easy':
      return 1;
    case 'medium':
      return 2;
    case 'hard':
      return 3;
    default:
      return 2;
  }
}

