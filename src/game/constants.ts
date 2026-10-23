// Enlarged arcade maze scale
export const TILE_SIZE = 44;

// Directional Camera Vision Cone parameters
export const CAMERA_FOV_DEGREES = 70; // 35 degrees on either side
export const CAMERA_VISION_MULTIPLIER = 3; // Max viewing distance = 3x enemy height (60 * 3 = 180px)

// Backward-compatible alias
export const DETECTION_HEIGHT_MULTIPLIER = 3;

// Character rendered dimensions
export const HERO_RENDERED_HEIGHT = 50;
export const HERO_RENDERED_WIDTH = 38;

export const ENEMY_RENDERED_HEIGHT = 60;
export const ENEMY_RENDERED_WIDTH = 32;

// Default camera vision distance = 60 * 3 = 180 world pixels
export const DEFAULT_VISION_DISTANCE =
  ENEMY_RENDERED_HEIGHT * CAMERA_VISION_MULTIPLIER;

export const DEFAULT_DETECTION_RADIUS = DEFAULT_VISION_DISTANCE;

// Movement speeds
export const HERO_SPEED = 160;
export const ENEMY_SPEED_NORMAL = 100;
export const ENEMY_SPEED_FAST = 118;

// Dot score value
export const DOT_SCORE = 10;

// Proximity warning thresholds
export const WARNING_DISTANCE_FACTOR = 1.8;

// Character metadata
export const HEROES = [
  {
    id: 'hero_1' as const,
    name: 'Слесарь-аппаратчик',
    tagline: 'Серый кот в ярком неоновом комбинезоне. Хладнокровный, ловкий и расчётливый.',
    assetPath: '/assets/aistudio/hero_1_666a4b89.png',
  },
  {
    id: 'hero_2' as const,
    name: 'Инженер по ВТП',
    tagline: 'Агент в смокинге с сигнальными полосами. Мастер уклонения от вспышек фотокамер.',
    assetPath: '/assets/aistudio/hero_2_0414096b.png',
  },
];

export const VILLIAN_ASSET_PATH =
  '/assets/aistudio/villian_5b646240.png';

export const MILK_DOT_ASSET_PATH =
  '/assets/aistudio/milk_ede4f6ca.jpg';

export const CAP_POWERUP_ASSET_PATH =
  '/assets/aistudio/cap_2933350d.jpg';

export const CAP_LIFETIME = 10; // 10 seconds map lifetime
export const INVULNERABILITY_DURATION = 10; // 10 seconds invulnerability
export const CAP_SPAWN_INTERVAL_MIN = 15; // 15 seconds
export const CAP_SPAWN_INTERVAL_MAX = 25; // 25 seconds