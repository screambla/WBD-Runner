export type GameState = 'title' | 'select' | 'playing' | 'paused' | 'gameover' | 'victory' | 'level_clear';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type HeroId = 'hero_1' | 'hero_2';

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'NONE';

export interface Position {
  x: number;
  y: number;
}

export interface GridCoord {
  col: number;
  row: number;
}

export type CellType = 0 | 1 | 2; // 0 = empty/walked path, 1 = wall, 2 = dot

export interface HeroState {
  id: HeroId;
  x: number;
  y: number;
  targetCol: number;
  targetRow: number;
  currentCol: number;
  currentRow: number;
  dir: Direction;
  nextDir: Direction;
  facing: 'left' | 'right';
  speed: number;
  isMoving: boolean;
  walkCycle: number;
}

export type EnemyPersonality = 'stalker' | 'patrol_alpha' | 'patrol_beta';

export interface EnemyState {
  id: number;
  name: string;
  personality: EnemyPersonality;
  x: number;
  y: number;
  currentCol: number;
  currentRow: number;
  targetCol: number;
  targetRow: number;
  dir: Direction;
  facing: 'left' | 'right';
  facingAngle: number; // In radians: 0 = right, PI/2 = down, PI = left, -PI/2 = up
  fovDegrees: number; // Total field of view (70 degrees)
  maxVisionDistance: number; // Max camera length (3x enemy rendered height = 180px)
  speed: number;
  isMoving: boolean;
  walkCycle: number;
  renderedHeight: number;
  detectionRadius: number; // Kept as maxVisionDistance
  proximityRatio: number; // 0 = safe, 1 = inside vision cone
  patrolWaypoints: GridCoord[];
  patrolIndex: number;
  isAlerted: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface CameraFlashEffect {
  active: boolean;
  alpha: number;
  color: string;
  x: number;
  y: number;
  radius: number;
}

export interface CharacterMeta {
  id: HeroId;
  name: string;
  tagline: string;
  assetPath: string;
}

export interface EnemyConfig {
  id: number;
  name: string;
  personality: EnemyPersonality;
  startCoord: GridCoord;
  patrolWaypoints: GridCoord[];
}

export interface MazeLevel {
  id: number;
  name: string;
  layout: CellType[][];
  heroStart: GridCoord;
  enemies: EnemyConfig[];
}

export interface CapPowerUpState {
  col: number;
  row: number;
  x: number;
  y: number;
  remainingLifetime: number; // Starts at 10s
}

