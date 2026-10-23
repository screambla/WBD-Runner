import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDetectionRadius,
  calculateDistance,
  isHeroSpotted,
  calculateDangerProximity,
  isWalkable,
  countRemainingDots,
  checkDotCollection,
  checkWinCondition,
  directionToDelta,
  getOppositeDirection,
  calculateEnemySpeed,
  getEnemyCountForDifficulty,
} from './rules';
import { CellType } from './types';

test('calculateDetectionRadius enforces 3x rendered character height', () => {
  assert.equal(calculateDetectionRadius(60), 180);
  assert.equal(calculateDetectionRadius(50), 150);
  assert.equal(calculateDetectionRadius(40), 120);
});

test('calculateDistance computes Euclidean distance accurately', () => {
  const dist = calculateDistance(0, 0, 3, 4);
  assert.equal(dist, 5);
});

test('isHeroSpotted triggers when hero enters 3x height radius', () => {
  const enemyHeight = 60; // radius = 180
  const enemyPos = { x: 300, y: 300 };

  // Exactly inside (dist = 120 < 180)
  assert.equal(isHeroSpotted({ x: 300, y: 420 }, enemyPos, enemyHeight), true);

  // Outside (dist = 220 > 180)
  assert.equal(isHeroSpotted({ x: 300, y: 520 }, enemyPos, enemyHeight), false);

  // Near boundary
  assert.equal(isHeroSpotted({ x: 300, y: 479 }, enemyPos, enemyHeight), true);
  assert.equal(isHeroSpotted({ x: 300, y: 481 }, enemyPos, enemyHeight), false);
});

test('calculateDangerProximity returns correct warning gradients', () => {
  const radius = 180;
  const enemyPos = { x: 0, y: 0 };

  // At or inside radius -> 1.0 (imminent danger)
  assert.equal(calculateDangerProximity({ x: 120, y: 0 }, enemyPos, radius), 1.0);
  assert.equal(calculateDangerProximity({ x: 180, y: 0 }, enemyPos, radius), 1.0);

  // Far beyond warning threshold (180 * 1.8 = 324) -> 0.0 (neutral)
  assert.equal(calculateDangerProximity({ x: 350, y: 0 }, enemyPos, radius), 0.0);

  // Midway between 324 and 180 -> ~0.5
  const midDist = 180 + (324 - 180) / 2; // 252
  const proximity = calculateDangerProximity({ x: midDist, y: 0 }, enemyPos, radius);
  assert.ok(proximity > 0.45 && proximity < 0.55);
});

test('isWalkable validates walls vs open corridors correctly', () => {
  const grid: CellType[][] = [
    [1, 1, 1],
    [1, 2, 0],
    [1, 1, 1],
  ];

  assert.equal(isWalkable(0, 0, grid), false); // Wall
  assert.equal(isWalkable(1, 1, grid), true); // Dot corridor
  assert.equal(isWalkable(2, 1, grid), true); // Walked path
  assert.equal(isWalkable(-1, 0, grid), false); // Out of bounds
  assert.equal(isWalkable(3, 0, grid), false); // Out of bounds
});

test('dot collection updates grid and decreases remaining count', () => {
  const grid: CellType[][] = [
    [1, 1, 1],
    [1, 2, 1],
    [1, 1, 1],
  ];
  assert.equal(countRemainingDots(grid), 1);

  // Collect dot at (1,1) with tileSize 44
  const heroPos = { x: 1 * 44 + 22, y: 1 * 44 + 22 };
  const res = checkDotCollection(heroPos, grid, 44);
  assert.equal(res.collected, true);
  assert.equal(res.col, 1);
  assert.equal(res.row, 1);
  assert.equal(countRemainingDots(grid), 0);
  assert.equal(checkWinCondition(0), true);
});

test('direction conversions behave properly', () => {
  assert.deepEqual(directionToDelta('UP'), { dx: 0, dy: -1 });
  assert.deepEqual(directionToDelta('RIGHT'), { dx: 1, dy: 0 });
  assert.equal(getOppositeDirection('UP'), 'DOWN');
  assert.equal(getOppositeDirection('LEFT'), 'RIGHT');
});

test('BFS pathfinding navigates corridors around walls', async () => {
  const { findNextBfsStep } = await import('./pathfinding');
  // Simple 3x3 with wall in middle
  // 1 1 1
  // 0 1 0
  // 0 0 0
  const grid: CellType[][] = [
    [1, 1, 1],
    [0, 1, 0],
    [0, 0, 0],
  ];
  // From (0, 1) to (2, 1), can't go through middle (1, 1)
  // Must go DOWN to (0, 2) first
  const step = findNextBfsStep(0, 1, 2, 1, grid);
  assert.equal(step, 'DOWN');
});

test('directional camera vision cone detects hero in front and ignores behind/side', async () => {
  const { isHeroInCameraVision, hasLineOfSight } = await import('./rules');

  // Open 5x5 grid with no walls
  const openGrid: CellType[][] = Array.from({ length: 5 }, () => Array(5).fill(0));
  const tileSize = 44;
  const enemyCameraPos = { x: 2 * tileSize + 22, y: 2 * tileSize + 22 }; // center at (110, 110)
  const facingAngle = 0; // facing RIGHT
  const fov = 70; // 70 deg cone
  const maxDist = 180; // 3x 60px

  // 1. Directly in front (hero at x=180, y=110, dist=70 < 180, angle=0)
  const frontSpotted = isHeroInCameraVision(
    { x: enemyCameraPos.x + 70, y: enemyCameraPos.y },
    enemyCameraPos,
    facingAngle,
    fov,
    maxDist,
    openGrid,
    tileSize
  );
  assert.equal(frontSpotted, true, 'Hero in front should be spotted');

  // 2. Behind enemy (hero at x=enemy.x - 70, y=enemy.y)
  const behindSpotted = isHeroInCameraVision(
    { x: enemyCameraPos.x - 70, y: enemyCameraPos.y },
    enemyCameraPos,
    facingAngle,
    fov,
    maxDist,
    openGrid,
    tileSize
  );
  assert.equal(behindSpotted, false, 'Hero behind enemy should NEVER be spotted');

  // 3. To the side (90 deg perpendicular, angle=PI/2 > 35 deg)
  const sideSpotted = isHeroInCameraVision(
    { x: enemyCameraPos.x, y: enemyCameraPos.y + 70 },
    enemyCameraPos,
    facingAngle,
    fov,
    maxDist,
    openGrid,
    tileSize
  );
  assert.equal(sideSpotted, false, 'Hero at 90 deg side should be outside 70 deg cone');

  // 4. In front but beyond max distance (dist = 220 > 180)
  const farSpotted = isHeroInCameraVision(
    { x: enemyCameraPos.x + 220, y: enemyCameraPos.y },
    enemyCameraPos,
    facingAngle,
    fov,
    maxDist,
    openGrid,
    tileSize
  );
  assert.equal(farSpotted, false, 'Hero beyond 3x max distance should not be spotted');

  // 5. In front within cone, but separated by a wall
  const wallGrid: CellType[][] = [
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 1, 0], // Wall at col 3, row 2!
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
  ];
  // Hero is at col 4, row 2 (x = 4*44+22 = 198), with wall at col 3 (x=132..176)
  const wallBlocked = isHeroInCameraVision(
    { x: 4 * tileSize + 22, y: 2 * tileSize + 22 },
    enemyCameraPos,
    facingAngle,
    fov,
    maxDist,
    wallGrid,
    tileSize
  );
  assert.equal(wallBlocked, false, 'Wall between camera and hero must block detection');
});

test('getRaycastDistance stops at wall obstacles', async () => {
  const { getRaycastDistance } = await import('./rules');
  const tileSize = 44;
  const grid: CellType[][] = [
    [0, 0, 0, 1, 0],
  ];
  // Cast from x=22, y=22 heading RIGHT (angle=0)
  // Wall starts at col 3 (x=132). Ray should hit wall around x=132.
  const rayDist = getRaycastDistance(22, 22, 0, 200, grid, tileSize);
  assert.ok(rayDist < 140, `Ray distance should stop at wall: ${rayDist}`);
  assert.ok(rayDist >= 110, `Ray distance should reach wall: ${rayDist}`);
});

test('calculateEnemySpeed follows formula: baseEnemySpeed * (1 + (L - 1) * 0.01)', () => {
  const baseSpeed = 100;
  // Level 1: 100%
  assert.equal(calculateEnemySpeed(baseSpeed, 1), 100);
  // Level 2: 101%
  assert.equal(calculateEnemySpeed(baseSpeed, 2), 101);
  // Level 3: 102%
  assert.equal(calculateEnemySpeed(baseSpeed, 3), 102);
  // Level 5: 104%
  assert.equal(calculateEnemySpeed(baseSpeed, 5), 104);
  // Level 10: 109%
  assert.equal(calculateEnemySpeed(baseSpeed, 10), 109);

  // Fast enemy base speed 118
  assert.equal(Math.round(calculateEnemySpeed(118, 10)), Math.round(118 * 1.09));
});

test('getEnemyCountForDifficulty returns correct count per difficulty setting', () => {
  assert.equal(getEnemyCountForDifficulty('easy'), 1);
  assert.equal(getEnemyCountForDifficulty('medium'), 2);
  assert.equal(getEnemyCountForDifficulty('hard'), 3);
});

test('all 10 maze levels are valid and 100% traversable from hero start', async () => {
  const { MAZE_LEVELS } = await import('./mazeData');
  assert.equal(MAZE_LEVELS.length, 10, 'There must be exactly 10 maze levels');

  MAZE_LEVELS.forEach((level, lvlIdx) => {
    const { layout, heroStart, enemies, id } = level;
    assert.equal(layout.length, 21, `Level ${id} must have 21 rows`);
    assert.equal(layout[0].length, 21, `Level ${id} must have 21 columns`);

    // Boundary walls check
    for (let c = 0; c < 21; c++) {
      assert.equal(layout[0][c], 1, `Level ${id} top border must be wall at col ${c}`);
      assert.equal(layout[20][c], 1, `Level ${id} bottom border must be wall at col ${c}`);
    }
    for (let r = 0; r < 21; r++) {
      assert.equal(layout[r][0], 1, `Level ${id} left border must be wall at row ${r}`);
      assert.equal(layout[r][20], 1, `Level ${id} right border must be wall at row ${r}`);
    }

    // Hero start must be walkable
    assert.notEqual(layout[heroStart.row][heroStart.col], 1, `Hero start must not be wall in level ${id}`);

    // All enemies must spawn on walkable tiles
    enemies.forEach((enemy) => {
      assert.notEqual(
        layout[enemy.startCoord.row][enemy.startCoord.col],
        1,
        `Enemy ${enemy.id} start must not be wall in level ${id}`
      );
    });

    // Flood fill from hero start to ensure all dots (2) are reachable
    const visited = Array.from({ length: 21 }, () => Array(21).fill(false));
    const queue: [number, number][] = [[heroStart.col, heroStart.row]];
    visited[heroStart.row][heroStart.col] = true;

    while (queue.length > 0) {
      const [col, row] = queue.shift()!;
      const neighbors = [
        [col + 1, row],
        [col - 1, row],
        [col, row + 1],
        [col, row - 1],
      ];
      for (const [nc, nr] of neighbors) {
        if (nr >= 0 && nr < 21 && nc >= 0 && nc < 21) {
          if (!visited[nr][nc] && layout[nr][nc] !== 1) {
            visited[nr][nc] = true;
            queue.push([nc, nr]);
          }
        }
      }
    }

    const unreachableDots: string[] = [];
    let dotCount = 0;
    for (let r = 0; r < 21; r++) {
      for (let c = 0; c < 21; c++) {
        if (layout[r][c] === 2) {
          dotCount++;
          if (!visited[r][c]) {
            unreachableDots.push(`(${c},${r})`);
          }
        }
      }
    }

    assert.equal(
      unreachableDots.length,
      0,
      `Level ${id} (${level.name}) has ${unreachableDots.length} unreachable dots at: ${unreachableDots.slice(0, 10).join(', ')}`
    );

    assert.ok(dotCount >= 50, `Level ${id} must have a healthy number of dots (found ${dotCount})`);
  });
});


