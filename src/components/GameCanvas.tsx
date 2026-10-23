import React, { useEffect, useRef, useState } from 'react';
import {
  CellType,
  Difficulty,
  Direction,
  EnemyState,
  HeroId,
  HeroState,
  Particle,
  CameraFlashEffect,
} from '../game/types';
import {
  HERO_RENDERED_HEIGHT,
  HERO_RENDERED_WIDTH,
  ENEMY_RENDERED_HEIGHT,
  ENEMY_RENDERED_WIDTH,
  DETECTION_HEIGHT_MULTIPLIER,
  CAMERA_FOV_DEGREES,
  CAMERA_VISION_MULTIPLIER,
  DOT_SCORE,
  ENEMY_SPEED_FAST,
  ENEMY_SPEED_NORMAL,
  HERO_SPEED,
  TILE_SIZE,
  VILLIAN_ASSET_PATH,
  MILK_DOT_ASSET_PATH,
  CAP_POWERUP_ASSET_PATH,
  CAP_LIFETIME,
  INVULNERABILITY_DURATION,
  CAP_SPAWN_INTERVAL_MIN,
  CAP_SPAWN_INTERVAL_MAX,
  HEROES,
} from '../game/constants';
import {
  calculateCameraProximity,
  calculateDangerProximity,
  calculateDistance,
  checkDotCollection,
  countRemainingDots,
  directionToAngle,
  directionToDelta,
  getOppositeDirection,
  isHeroInCameraVision,
  isHeroSpotted,
  isWalkable,
  normalizeAngle,
  calculateEnemySpeed,
  getEnemyCountForDifficulty,
} from '../game/rules';
import { getLevelConfig, TOTAL_LEVELS } from '../game/mazeData';
import { findNextBfsStep, getAvailableDirections } from '../game/pathfinding';
import {
  ProcessedCharacter,
  drawAnimatedCharacter,
  processCharacterAsset,
  processDarkBackgroundAsset,
} from '../game/imageProcessor';
import { drawMaze, drawParticles, drawSurveillanceZone } from '../game/mazeRenderer';
import { sounds } from '../game/audio';
import { CapPowerUpState, GridCoord } from '../game/types';

interface GameCanvasProps {
  selectedHero: HeroId;
  gameState: 'playing' | 'paused' | 'gameover' | 'victory' | 'level_clear';
  level: number;
  difficulty: Difficulty;
  maxSessionPowerUps?: number;
  sessionPowerUpsSpawned?: number;
  onPowerUpSpawned?: () => void;
  onScoreChange: (score: number) => void;
  onRemainingDotsChange: (remaining: number, total: number) => void;
  onDangerProximityChange: (proximity: number) => void;
  onInvulnerabilityChange?: (remainingTime: number) => void;
  onGameOver: () => void;
  onLevelComplete: (clearedLevel: number) => void;
  onVictory: () => void;
  touchDirection: Direction | null;
  onClearTouchDirection: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  selectedHero,
  gameState,
  level,
  difficulty,
  maxSessionPowerUps = 3,
  sessionPowerUpsSpawned = 0,
  onPowerUpSpawned,
  onScoreChange,
  onRemainingDotsChange,
  onDangerProximityChange,
  onInvulnerabilityChange,
  onGameOver,
  onLevelComplete,
  onVictory,
  touchDirection,
  onClearTouchDirection,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Loaded & processed assets cache
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const assetsRef = useRef<Record<string, ProcessedCharacter>>({});

  // Core gameplay state stored in refs to decouple 60FPS loop from React render cycle
  const gridRef = useRef<CellType[][]>([]);
  const scoreRef = useRef(0);
  const totalDotsRef = useRef(0);
  const remainingDotsRef = useRef(0);

  // Cap power-up and invulnerability state refs
  const capPowerUpRef = useRef<CapPowerUpState | null>(null);
  const capSpawnTimerRef = useRef(CAP_SPAWN_INTERVAL_MIN + Math.random() * (CAP_SPAWN_INTERVAL_MAX - CAP_SPAWN_INTERVAL_MIN));
  const invulnerabilityTimerRef = useRef(0);

  const heroRef = useRef<HeroState>({
    id: selectedHero,
    x: 0,
    y: 0,
    currentCol: 0,
    currentRow: 0,
    targetCol: 0,
    targetRow: 0,
    dir: 'NONE',
    nextDir: 'NONE',
    facing: 'right',
    speed: HERO_SPEED,
    isMoving: false,
    walkCycle: 0,
  });

  const enemiesRef = useRef<EnemyState[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const cameraFlashRef = useRef<CameraFlashEffect>({
    active: false,
    alpha: 0,
    color: '#ffffff',
    x: 0,
    y: 0,
    radius: 0,
  });

  const hitstopRef = useRef(0);
  const isEndingRef = useRef(false);
  const isGameOverRef = useRef(false);

  // Helper function to find a random walkable cell for spawning cap power-up
  const getRandomWalkableCell = (
    grid: CellType[][],
    heroCoord: GridCoord,
    enemiesCoords: GridCoord[]
  ): GridCoord | null => {
    const candidates: GridCoord[] = [];
    const rows = grid.length;
    const cols = grid[0].length;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Must be a walkable corridor (0 or 2, not a wall 1)
        if (grid[r][c] !== 1) {
          // Distance from hero (must be >= 3.0 cells away)
          const heroDist = Math.hypot(c - heroCoord.col, r - heroCoord.row);
          if (heroDist < 3.0) continue;

          // Distance from any enemy (must be >= 2.5 cells away)
          const enemyTooClose = enemiesCoords.some(
            (e) => Math.hypot(c - e.col, r - e.row) < 2.5
          );
          if (enemyTooClose) continue;

          candidates.push({ col: c, row: r });
        }
      }
    }

    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
  };

  // Initialize maze & enemies for current level & difficulty
  const initGameLevel = () => {
    const levelConfig = getLevelConfig(level);
    const newGrid = levelConfig.layout.map((row) => [...row]);
    gridRef.current = newGrid;
    const initialDots = countRemainingDots(newGrid);
    totalDotsRef.current = initialDots;
    remainingDotsRef.current = initialDots;
    isEndingRef.current = false;
    isGameOverRef.current = false;
    hitstopRef.current = 0;
    particlesRef.current = [];
    cameraFlashRef.current = {
      active: false,
      alpha: 0,
      color: '#ffffff',
      x: 0,
      y: 0,
      radius: 0,
    };

    // Reset power-up & invulnerability timers
    capPowerUpRef.current = null;
    capSpawnTimerRef.current = CAP_SPAWN_INTERVAL_MIN + Math.random() * (CAP_SPAWN_INTERVAL_MAX - CAP_SPAWN_INTERVAL_MIN);
    invulnerabilityTimerRef.current = 0;
    sounds.stopInvulnerabilityMusic();
    onInvulnerabilityChange?.(0);

    onRemainingDotsChange(initialDots, initialDots);
    onDangerProximityChange(0);

    // Reset Hero to level's heroStart
    heroRef.current = {
      id: selectedHero,
      x: levelConfig.heroStart.col * TILE_SIZE + TILE_SIZE / 2,
      y: levelConfig.heroStart.row * TILE_SIZE + TILE_SIZE / 2,
      currentCol: levelConfig.heroStart.col,
      currentRow: levelConfig.heroStart.row,
      targetCol: levelConfig.heroStart.col,
      targetRow: levelConfig.heroStart.row,
      dir: 'NONE',
      nextDir: 'NONE',
      facing: 'right',
      speed: HERO_SPEED,
      isMoving: false,
      walkCycle: 0,
    };

    // Filter enemies by difficulty
    //const enemyCount = getEnemyCountForDifficulty(difficulty);
    //const activeConfigs = levelConfig.enemies.slice(0, enemyCount);

    // Select enemies by difficulty.
    // Stalker is always present on every difficulty.
    const stalker = levelConfig.enemies.find(
      (enemy) => enemy.personality === 'stalker'
    );

    const alpha = levelConfig.enemies.find(
      (enemy) => enemy.personality === 'patrol_alpha'
    );

    const beta = levelConfig.enemies.find(
      (enemy) => enemy.personality === 'patrol_beta'
    );

    let activeConfigs = [];

    if (difficulty === 'easy') {
      activeConfigs = stalker ? [stalker] : [];
    } else if (difficulty === 'medium') {
      activeConfigs = [stalker, alpha].filter(
        (enemy) => enemy !== undefined
      );
    } else {
      activeConfigs = [stalker, alpha, beta].filter(
        (enemy) => enemy !== undefined
      );
    }

    enemiesRef.current = activeConfigs.map((cfg, index) => {
      const renderedHeight = ENEMY_RENDERED_HEIGHT; // 60px
      // Strictly 3x character rendered height (60 * 3 = 180 world pixels)
      const detectionRadius = renderedHeight * 1.5;

      // Enemy speed scaled according to formula:
      // enemySpeed = baseEnemySpeed * (1 + (level - 1) * 0.01)
      const baseSpeed = cfg.personality === 'stalker' ? ENEMY_SPEED_FAST : ENEMY_SPEED_NORMAL;
      const speed = calculateEnemySpeed(baseSpeed, level);

      const initialFacingAngle = index % 2 === 0 ? 0 : Math.PI; // 0 = right, PI = left

      return {
        id: cfg.id,
        name: cfg.name,
        personality: cfg.personality,
        x: cfg.startCoord.col * TILE_SIZE + TILE_SIZE / 2,
        y: cfg.startCoord.row * TILE_SIZE + TILE_SIZE / 2,
        currentCol: cfg.startCoord.col,
        currentRow: cfg.startCoord.row,
        targetCol: cfg.startCoord.col,
        targetRow: cfg.startCoord.row,
        dir: 'NONE' as Direction,
        facing: index % 2 === 0 ? ('right' as const) : ('left' as const),
        facingAngle: initialFacingAngle,
        fovDegrees: CAMERA_FOV_DEGREES,
        maxVisionDistance: detectionRadius,
        speed,
        isMoving: true,
        walkCycle: 0,
        renderedHeight,
        detectionRadius,
        proximityRatio: 0,
        patrolWaypoints: cfg.patrolWaypoints,
        patrolIndex: 0,
        isAlerted: false,
      };
    });
  };

  // Asset Loading and Background Removal
  useEffect(() => {
    let mounted = true;

    async function loadAllAssets() {
      try {
        const [hero1, hero2, villian, milk, cap] = await Promise.all([
          processCharacterAsset('/assets/aistudio/hero_1_666a4b89.png'),
          processCharacterAsset('/assets/aistudio/hero_2_0414096b.png'),
          processCharacterAsset(VILLIAN_ASSET_PATH),
          processDarkBackgroundAsset(MILK_DOT_ASSET_PATH),
          processDarkBackgroundAsset(CAP_POWERUP_ASSET_PATH),
        ]);

        if (mounted) {
          assetsRef.current = {
            hero_1: hero1,
            hero_2: hero2,
            villian,
            milk,
            cap,
          };
          setAssetsLoaded(true);
        }
      } catch (err) {
        console.error('Asset processing failed:', err);
      }
    }

    loadAllAssets();
    return () => {
      mounted = false;
    };
  }, []);

  // Update selected hero in ref
  useEffect(() => {
    heroRef.current.id = selectedHero;
  }, [selectedHero]);

  // Reset or initialize on state transition into playing
  useEffect(() => {
    if (gameState === 'playing' && isEndingRef.current) {
      initGameLevel();
    }
  }, [gameState]);

  // Re-initialize whenever level or difficulty changes
  useEffect(() => {
    initGameLevel();
  }, [level, difficulty]);

  // Keyboard controls with buffered turning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;

      let newDir: Direction | null = null;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        newDir = 'UP';
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        newDir = 'DOWN';
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        newDir = 'LEFT';
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        newDir = 'RIGHT';
      }

      if (newDir) {
        e.preventDefault();
        const hero = heroRef.current;
        const grid = gridRef.current;

        // Immediate reversal allowed without waiting for grid intersection
        if (newDir === getOppositeDirection(hero.dir)) {
          hero.dir = newDir;
          hero.nextDir = 'NONE';
          if (newDir === 'LEFT') hero.facing = 'left';
          if (newDir === 'RIGHT') hero.facing = 'right';
          hero.isMoving = true;
          return;
        }

        hero.nextDir = newDir;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Mobile touch controls listener
  useEffect(() => {
    if (touchDirection && gameState === 'playing') {
      const hero = heroRef.current;
      if (touchDirection === getOppositeDirection(hero.dir)) {
        hero.dir = touchDirection;
        hero.nextDir = 'NONE';
        if (touchDirection === 'LEFT') hero.facing = 'left';
        if (touchDirection === 'RIGHT') hero.facing = 'right';
        hero.isMoving = true;
      } else {
        hero.nextDir = touchDirection;
      }
      onClearTouchDirection();
    }
  }, [touchDirection, gameState, onClearTouchDirection]);

  // Main 60FPS Game Loop
  useEffect(() => {
    if (!assetsLoaded) return;

    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const rawDt = (time - lastTime) / 1000;
      lastTime = time;
      // Clamped delta-time to prevent tunneling
      const dt = Math.min(rawDt, 0.05);

      const canvas = canvasRef.current;
      if (!canvas) {
        animId = requestAnimationFrame(loop);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animId = requestAnimationFrame(loop);
        return;
      }

      const grid = gridRef.current;
      const hero = heroRef.current;
      const enemies = enemiesRef.current;
      const particles = particlesRef.current;
      const cameraFlash = cameraFlashRef.current;

      // Handle hitstop freeze on detection/spotted event
      if (hitstopRef.current > 0) {
        hitstopRef.current -= dt;
        if (hitstopRef.current <= 0 && isGameOverRef.current) {
          onGameOver();
        }
      }

      // If active simulation (playing and not frozen in hitstop)
      if (gameState === 'playing' && hitstopRef.current <= 0 && !isEndingRef.current) {
        const isInvulnerable = invulnerabilityTimerRef.current > 0;

        // --- 1. HERO MOVEMENT & TURNING ---
        const heroTileCol = Math.floor(hero.x / TILE_SIZE);
        const heroTileRow = Math.floor(hero.y / TILE_SIZE);
        const tileCenterX = heroTileCol * TILE_SIZE + TILE_SIZE / 2;
        const tileCenterY = heroTileRow * TILE_SIZE + TILE_SIZE / 2;

        const distToCenter = Math.hypot(hero.x - tileCenterX, hero.y - tileCenterY);
        const atIntersection = distToCenter < 7.0;

        // Try buffered turn
        if (hero.nextDir !== 'NONE' && atIntersection) {
          const dNext = directionToDelta(hero.nextDir);
          const nextTargetCol = heroTileCol + dNext.dx;
          const nextTargetRow = heroTileRow + dNext.dy;

          if (isWalkable(nextTargetCol, nextTargetRow, grid)) {
            hero.dir = hero.nextDir;
            hero.nextDir = 'NONE';
            hero.x = tileCenterX;
            hero.y = tileCenterY;
            if (hero.dir === 'LEFT') hero.facing = 'left';
            if (hero.dir === 'RIGHT') hero.facing = 'right';
            hero.isMoving = true;
          }
        }

        // Advance along current direction (boosted speed during invulnerability for zero slowdowns)
        if (hero.dir !== 'NONE') {
          const delta = directionToDelta(hero.dir);
          const currentSpeed = isInvulnerable ? HERO_SPEED * 1.18 : HERO_SPEED;
          const step = currentSpeed * dt;
          const nextX = hero.x + delta.dx * step;
          const nextY = hero.y + delta.dy * step;

          // Check wall collision ahead (18px lead for 44px tiles)
          const checkCol = Math.floor((nextX + delta.dx * 18) / TILE_SIZE);
          const checkRow = Math.floor((nextY + delta.dy * 18) / TILE_SIZE);

          if (isWalkable(checkCol, checkRow, grid)) {
            hero.x = nextX;
            hero.y = nextY;
            hero.isMoving = true;
            hero.walkCycle += dt * 11;
          } else {
            // Hit wall: snap flush to tile center and halt
            hero.x = tileCenterX;
            hero.y = tileCenterY;
            hero.isMoving = false;
          }
        } else {
          hero.isMoving = false;
        }

        // Idle breathing increment
        if (!hero.isMoving) {
          hero.walkCycle += dt * 3;
        }

        // --- 2. DOT COLLECTION & SCORE ---
        const dotRes = checkDotCollection({ x: hero.x, y: hero.y }, grid, TILE_SIZE);
        if (dotRes.collected) {
          scoreRef.current += DOT_SCORE;
          remainingDotsRef.current -= 1;
          onScoreChange(scoreRef.current);
          onRemainingDotsChange(remainingDotsRef.current, totalDotsRef.current);
          sounds.playDotCollect();

          // Spawn collectible sparkle particles (pure bright white glow)
          const dotX = dotRes.col * TILE_SIZE + TILE_SIZE / 2;
          const dotY = dotRes.row * TILE_SIZE + TILE_SIZE / 2;
          for (let p = 0; p < 8; p++) {
            const angle = Math.random() * Math.PI * 2;
            const pSpeed = 35 + Math.random() * 65;
            particles.push({
              x: dotX,
              y: dotY,
              vx: Math.cos(angle) * pSpeed,
              vy: Math.sin(angle) * pSpeed,
              size: 2.5 + Math.random() * 2.5,
              color: '#ffffff',
              alpha: 1.0,
              life: 0,
              maxLife: 0.28 + Math.random() * 0.15,
            });
          }

          // Check victory or level clear
          if (remainingDotsRef.current === 0) {
            isEndingRef.current = true;
            sounds.playVictory();
            if (level >= TOTAL_LEVELS) {
              onVictory();
            } else {
              onLevelComplete(level);
            }
          }
        }

        // --- 3. POWER-UP & INVULNERABILITY TIMERS ---
        if (invulnerabilityTimerRef.current > 0) {
          invulnerabilityTimerRef.current -= dt;
          if (invulnerabilityTimerRef.current <= 0) {
            invulnerabilityTimerRef.current = 0;
            sounds.stopInvulnerabilityMusic();
          }
          onInvulnerabilityChange?.(invulnerabilityTimerRef.current);
        } else {
          onInvulnerabilityChange?.(0);
        }

        // isInvulnerable already evaluated at start of loop

        // Cap Spawning & Lifetime (enforcing 1–3 appearances per game session limit)
        if (capPowerUpRef.current === null && sessionPowerUpsSpawned < maxSessionPowerUps) {
          capSpawnTimerRef.current -= dt;
          if (capSpawnTimerRef.current <= 0) {
            const heroCoord = {
              col: Math.floor(hero.x / TILE_SIZE),
              row: Math.floor(hero.y / TILE_SIZE),
            };
            const enemiesCoords = enemies.map((e) => ({
              col: Math.floor(e.x / TILE_SIZE),
              row: Math.floor(e.y / TILE_SIZE),
            }));

            const spawnTile = getRandomWalkableCell(grid, heroCoord, enemiesCoords);
            if (spawnTile) {
              capPowerUpRef.current = {
                col: spawnTile.col,
                row: spawnTile.row,
                x: spawnTile.col * TILE_SIZE + TILE_SIZE / 2,
                y: spawnTile.row * TILE_SIZE + TILE_SIZE / 2,
                remainingLifetime: CAP_LIFETIME,
              };
              // Record appearance toward session total immediately upon spawn
              onPowerUpSpawned?.();
            }
            capSpawnTimerRef.current = CAP_SPAWN_INTERVAL_MIN + Math.random() * (CAP_SPAWN_INTERVAL_MAX - CAP_SPAWN_INTERVAL_MIN);
          }
        } else if (capPowerUpRef.current !== null) {
          const capItem = capPowerUpRef.current;
          capItem.remainingLifetime -= dt;

          // Hero pickup collision
          const distToHero = Math.hypot(hero.x - capItem.x, hero.y - capItem.y);
          if (distToHero < TILE_SIZE * 0.75) {
            capPowerUpRef.current = null;
            invulnerabilityTimerRef.current = INVULNERABILITY_DURATION;

            sounds.playPowerUpCollect();
            sounds.startInvulnerabilityMusic();

            // Sparkle burst
            for (let p = 0; p < 18; p++) {
              const angle = Math.random() * Math.PI * 2;
              const pSpeed = 60 + Math.random() * 120;
              particles.push({
                x: capItem.x,
                y: capItem.y,
                vx: Math.cos(angle) * pSpeed,
                vy: Math.sin(angle) * pSpeed,
                size: 3 + Math.random() * 3,
                color: '#a3e635',
                alpha: 1.0,
                life: 0,
                maxLife: 0.45,
              });
            }

            capSpawnTimerRef.current = CAP_SPAWN_INTERVAL_MIN + Math.random() * (CAP_SPAWN_INTERVAL_MAX - CAP_SPAWN_INTERVAL_MIN);
          } else if (capItem.remainingLifetime <= 0) {
            // Lifetime expired without collection
            capPowerUpRef.current = null;
            capSpawnTimerRef.current = CAP_SPAWN_INTERVAL_MIN + Math.random() * (CAP_SPAWN_INTERVAL_MAX - CAP_SPAWN_INTERVAL_MIN);
          }
        }

        // --- 4. ENEMY AI MOVEMENT & DIRECTIONAL CAMERA VISION ---
        let maxProximity = 0;

        for (const enemy of enemies) {
          // If enemy reached target tile center, select next target tile & direction
          const targetX = enemy.targetCol * TILE_SIZE + TILE_SIZE / 2;
          const targetY = enemy.targetRow * TILE_SIZE + TILE_SIZE / 2;
          const distToTarget = Math.hypot(targetX - enemy.x, targetY - enemy.y);

          if (distToTarget < 2.0 || enemy.dir === 'NONE') {
            enemy.x = targetX;
            enemy.y = targetY;
            enemy.currentCol = enemy.targetCol;
            enemy.currentRow = enemy.targetRow;

            let goalCoord = { col: enemy.currentCol, row: enemy.currentRow };

            if (enemy.personality === 'stalker') {
              goalCoord = {
                col: Math.floor(hero.x / TILE_SIZE),
                row: Math.floor(hero.y / TILE_SIZE),
              };
            } else {
              const wp = enemy.patrolWaypoints[enemy.patrolIndex];
              goalCoord = wp;

              if (enemy.currentCol === wp.col && enemy.currentRow === wp.row) {
                enemy.patrolIndex = (enemy.patrolIndex + 1) % enemy.patrolWaypoints.length;
                goalCoord = enemy.patrolWaypoints[enemy.patrolIndex];
              }
            }

            let nextStep = findNextBfsStep(
              enemy.currentCol,
              enemy.currentRow,
              goalCoord.col,
              goalCoord.row,
              grid
            );

            if (nextStep === 'NONE') {
              const available = getAvailableDirections(
                enemy.currentCol,
                enemy.currentRow,
                grid,
                enemy.dir,
                true
              );
              if (available.length > 0) {
                nextStep = available[Math.floor(Math.random() * available.length)];
              } else {
                const anyDir = getAvailableDirections(
                  enemy.currentCol,
                  enemy.currentRow,
                  grid,
                  enemy.dir,
                  false
                );
                nextStep = anyDir.length > 0 ? anyDir[0] : 'NONE';
              }
            }

            if (nextStep !== 'NONE') {
              const delta = directionToDelta(nextStep);
              enemy.dir = nextStep;
              enemy.targetCol = enemy.currentCol + delta.dx;
              enemy.targetRow = enemy.currentRow + delta.dy;
              if (delta.dx < 0) enemy.facing = 'left';
              if (delta.dx > 0) enemy.facing = 'right';
              enemy.isMoving = true;
            } else {
              enemy.dir = 'NONE';
              enemy.isMoving = false;
            }
          }

          // Advance enemy smoothly towards targetCol, targetRow
          if (enemy.dir !== 'NONE') {
            const nextTargetX = enemy.targetCol * TILE_SIZE + TILE_SIZE / 2;
            const nextTargetY = enemy.targetRow * TILE_SIZE + TILE_SIZE / 2;
            const toX = nextTargetX - enemy.x;
            const toY = nextTargetY - enemy.y;
            const remainingDist = Math.hypot(toX, toY);
            const stepDist = enemy.speed * dt;

            if (stepDist >= remainingDist) {
              enemy.x = nextTargetX;
              enemy.y = nextTargetY;
              enemy.currentCol = enemy.targetCol;
              enemy.currentRow = enemy.targetRow;
              enemy.walkCycle += (remainingDist / Math.max(1, enemy.speed)) * 10;
            } else {
              enemy.x += (toX / remainingDist) * stepDist;
              enemy.y += (toY / remainingDist) * stepDist;
              enemy.walkCycle += dt * 10;
            }
            enemy.isMoving = true;

            // Smoothly rotate camera vision angle towards movement direction
            const desiredAngle = directionToAngle(enemy.dir, enemy.facingAngle);
            const angleDiff = normalizeAngle(desiredAngle - enemy.facingAngle);
            enemy.facingAngle = normalizeAngle(enemy.facingAngle + angleDiff * Math.min(1, dt * 12));
          } else {
            enemy.isMoving = false;
          }

          // Directional Camera Vision Detection
          const spotted = isHeroInCameraVision(
            { x: hero.x, y: hero.y },
            { x: enemy.x, y: enemy.y },
            enemy.facingAngle,
            enemy.fovDegrees,
            enemy.maxVisionDistance,
            grid,
            TILE_SIZE
          );

          const proximity = calculateCameraProximity(
            { x: hero.x, y: hero.y },
            { x: enemy.x, y: enemy.y },
            enemy.facingAngle,
            enemy.fovDegrees,
            enemy.maxVisionDistance,
            grid,
            TILE_SIZE
          );

          enemy.proximityRatio = spotted ? 1.0 : proximity;
          if (enemy.proximityRatio > maxProximity) {
            maxProximity = enemy.proximityRatio;
          }

          // DETECTION TRIGGERED! (Bypassed if invulnerable)
          if (spotted && !isInvulnerable && !isEndingRef.current) {
            isEndingRef.current = true;
            isGameOverRef.current = true;
            hitstopRef.current = 0.45; // 450ms flash hitstop

            sounds.playCameraFlash();

            cameraFlash.active = true;
            cameraFlash.alpha = 0.95;
            cameraFlash.x = enemy.x;
            cameraFlash.y = enemy.y;
            cameraFlash.radius = enemy.maxVisionDistance;

            for (let i = 0; i < 24; i++) {
              const angle = Math.random() * Math.PI * 2;
              const pSpeed = 60 + Math.random() * 140;
              particles.push({
                x: enemy.x,
                y: enemy.y,
                vx: Math.cos(angle) * pSpeed,
                vy: Math.sin(angle) * pSpeed,
                size: 3 + Math.random() * 3,
                color: '#ef4444',
                alpha: 1.0,
                life: 0,
                maxLife: 0.45,
              });
            }
          }
        }

        // Live proximity warning sound & HUD state
        sounds.playProximityWarning(isInvulnerable ? 0 : maxProximity);
        onDangerProximityChange(isInvulnerable ? 0 : maxProximity);
      }

      // Update particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += dt;
        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.alpha = 1 - p.life / p.maxLife;
      }

      // Update camera flash alpha decay
      if (cameraFlash.active) {
        cameraFlash.alpha -= dt * 2.2;
        if (cameraFlash.alpha <= 0) {
          cameraFlash.active = false;
        }
      }

      // --- HIGH-DPI RENDERING PASS ---
      const totalMazeW = grid[0].length * TILE_SIZE; // 924
      const totalMazeH = grid.length * TILE_SIZE; // 924

      const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
      const rect = canvas.getBoundingClientRect();
      const cssW = Math.max(100, rect.width || totalMazeW);
      const cssH = Math.max(100, rect.height || totalMazeH);

      const targetCanvasW = Math.round(cssW * dpr);
      const targetCanvasH = Math.round(cssH * dpr);

      if (canvas.width !== targetCanvasW || canvas.height !== targetCanvasH) {
        canvas.width = targetCanvasW;
        canvas.height = targetCanvasH;
      }

      ctx.save();
      ctx.clearRect(0, 0, targetCanvasW, targetCanvasH);

      // Uniform scaling to preserve 1:1 maze tile geometry
      const scale = Math.min(targetCanvasW / totalMazeW, targetCanvasH / totalMazeH);
      const offsetX = (targetCanvasW - totalMazeW * scale) / 2;
      const offsetY = (targetCanvasH - totalMazeH * scale) / 2;

      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // 1. Draw Maze Floor & Two-Tone Walls & Collectible Milk Bottles
      drawMaze(ctx, grid, time / 1000, assetsRef.current['milk']);

      // 2. Draw Cap Power-Up item if spawned
      const capItem = capPowerUpRef.current;
      const capAsset = assetsRef.current['cap'];
      if (capItem && capAsset) {
        const renderH = 30;
        const renderW = (capAsset.width / capAsset.height) * renderH;
        const floatOffset = Math.sin(time / 1000 * 4.0) * 2.0;

        // Glowing pulsing ring under cap item
        const pulse = Math.sin(time / 1000 * 6.0) * 2 + 13;
        ctx.beginPath();
        ctx.arc(capItem.x, capItem.y + floatOffset, pulse, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(163, 230, 53, 0.35)';
        ctx.fill();

        ctx.drawImage(
          capAsset.canvas,
          capItem.x - renderW / 2,
          capItem.y - renderH / 2 + floatOffset,
          renderW,
          renderH
        );
      }

      // 3. Draw Directional Camera Surveillance Cones for each enemy
      for (const enemy of enemies) {
        drawSurveillanceZone(ctx, enemy, time / 1000, grid);
      }

      // 4. Draw Hero Character (with invulnerability blinking)
      const heroAsset = assetsRef.current[hero.id];
      const isInvulnerableNow = invulnerabilityTimerRef.current > 0;
      if (heroAsset) {
        drawAnimatedCharacter(
          ctx,
          heroAsset,
          hero.x,
          hero.y,
          HERO_RENDERED_WIDTH,
          HERO_RENDERED_HEIGHT,
          hero.facing,
          hero.isMoving,
          hero.walkCycle,
          isInvulnerableNow,
          time / 1000
        );
      }

      // 4. Draw Enemy Characters (Photographers)
      const villianAsset = assetsRef.current['villian'];
      if (villianAsset) {
        for (const enemy of enemies) {
          drawAnimatedCharacter(
            ctx,
            villianAsset,
            enemy.x,
            enemy.y,
            ENEMY_RENDERED_WIDTH,
            ENEMY_RENDERED_HEIGHT,
            enemy.facing,
            enemy.isMoving,
            enemy.walkCycle
          );
        }
      }

      // 5. Draw Particle Bursts
      drawParticles(ctx, particles);

      // 6. Camera Flash Fullscreen Burst when spotted
      if (cameraFlash.active && cameraFlash.alpha > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, cameraFlash.alpha)})`;
        ctx.fillRect(0, 0, totalMazeW, totalMazeH);

        // Flash Ring shockwave
        ctx.beginPath();
        ctx.arc(cameraFlash.x, cameraFlash.y, cameraFlash.radius * (1.5 - cameraFlash.alpha * 0.5), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(239, 68, 68, ${cameraFlash.alpha})`;
        ctx.lineWidth = 4;
        ctx.stroke();
      }

      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [
    assetsLoaded,
    gameState,
    level,
    onGameOver,
    onLevelComplete,
    onVictory,
    onScoreChange,
    onRemainingDotsChange,
    onDangerProximityChange,
  ]);

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden p-0 m-0 bg-slate-950">
      <div className="relative flex items-center justify-center aspect-square h-[98vh] w-[98vh] max-h-full max-w-full overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950 shadow-2xl shadow-blue-950/80">
        <canvas
          ref={canvasRef}
          className="block h-full w-full object-contain"
        />

        {/* Loading overlay while assets process */}
        {!assetsLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-white z-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mb-3" />
            <p className="text-sm font-mono text-blue-400">PROCESSING OPERATIVE ARTWORK...</p>
          </div>
        )}
      </div>
    </div>
  );
};
