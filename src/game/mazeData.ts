import { CellType, Difficulty, EnemyConfig, GridCoord, MazeLevel } from './types';

/**
 * ASCII map legend:
 * '#' : Wall (1)
 * '.' : Collectible dot (2)
 * ' ' : Empty walkable path (0)
 * 'H' : Hero starting position (walkable, 0)
 * 'A' : Enemy 1 (Alpha) start position (walkable, 0)
 * 'B' : Enemy 2 (Beta) start position (walkable, 0)
 * 'C' : Enemy 3 (Stalker) start position (walkable, 0)
 */

interface RawLevelDef {
  id: number;
  name: string;
  ascii: string[];
  patrolA: GridCoord[];
  patrolB: GridCoord[];
  patrolC: GridCoord[];
}

const LEVEL_DEFS: RawLevelDef[] = [
  // Level 1: Классический Штаб
  {
    id: 1,
    name: 'Классический Штаб',
    ascii: [
      '#####################',
      '#.........#.........#',
      '#.###.###.#.###.###.#',
      '#.###.###.#.###.###.#',
      '#...................#',
      '#.###.#.#####.#.###.#',
      '#.....#...#...#.....#',
      '#####.### # ###.#####',
      '#####.#  A B  #.#####',
      '#.....# ## ## #.....#',
      '#.###.  # C #  .###.#',
      '#.....# ##### #.....#',
      '#####.#       #.#####',
      '#####.# ##### #.#####',
      '#.........#.........#',
      '#.###.###.#.###.###.#',
      '#...#.....H.....#...#',
      '###.#.#.#####.#.#.###',
      '#.....#...#...#.....#',
      '#.#######.#.#######.#',
      '#####################',
    ],
    patrolA: [{ col: 1, row: 1 }, { col: 9, row: 1 }, { col: 9, row: 6 }, { col: 1, row: 6 }, { col: 1, row: 14 }],
    patrolB: [{ col: 19, row: 1 }, { col: 11, row: 1 }, { col: 11, row: 6 }, { col: 19, row: 6 }, { col: 19, row: 14 }],
    patrolC: [{ col: 10, row: 4 }, { col: 5, row: 4 }, { col: 5, row: 14 }, { col: 15, row: 14 }, { col: 15, row: 4 }],
  },

  // Level 2: Двойная Спираль
  {
    id: 2,
    name: 'Двойная Спираль',
    ascii: [
      '#####################',
      '#.........#.........#',
      '#.#######.#.#######.#',
      '#.#.......#.......#.#',
      '#.#.#####.#.#####.#.#',
      '#.#.#...#...#...#.#.#',
      '#.#.#.#.#####.#.#.#.#',
      '#.#...#.#   #.#...#.#',
      '#...#.#  A B  #.#...#',
      '#.###.#.## ##.#.###.#',
      '#.....#.# C #.#.....#',
      '#.###.#.#####.#.###.#',
      '#...#.#       #.#...#',
      '#.#...#.# # #.#...#.#',
      '#.#.#.#.#####.#.#.#.#',
      '#.#.#...#...#...#.#.#',
      '#.#.#####.H.#####.#.#',
      '#.#.......#.......#.#',
      '#.#######.#.#######.#',
      '#.........#.........#',
      '#####################',
    ],
    patrolA: [{ col: 1, row: 1 }, { col: 9, row: 1 }, { col: 1, row: 8 }, { col: 9, row: 8 }],
    patrolB: [{ col: 19, row: 1 }, { col: 11, row: 1 }, { col: 19, row: 8 }, { col: 11, row: 8 }],
    patrolC: [{ col: 10, row: 5 }, { col: 5, row: 7 }, { col: 10, row: 13 }, { col: 15, row: 7 }],
  },

  // Level 3: Сектор Колонн
  {
    id: 3,
    name: 'Сектор Колонн',
    ascii: [
      '#####################',
      '#...................#',
      '#.##.##.##.##.##.##.#',
      '#...................#',
      '#.##.##.##.##.##.##.#',
      '#...................#',
      '#.....#...#...#.....#',
      '#####.### # ###.#####',
      '#####.#  A B  #.#####',
      '#.....# ## ## #.....#',
      '#.###.  # C #  .###.#',
      '#.....# ##### #.....#',
      '#####.#       #.#####',
      '#####.### # ###.#####',
      '#.....#...#...#.....#',
      '#.........H.........#',
      '#.##.##.##.##.##.##.#',
      '#...................#',
      '#.##.##.##.##.##.##.#',
      '#...................#',
      '#####################',
    ],
    patrolA: [{ col: 1, row: 1 }, { col: 9, row: 1 }, { col: 5, row: 7 }, { col: 9, row: 7 }, { col: 5, row: 13 }],
    patrolB: [{ col: 19, row: 1 }, { col: 11, row: 1 }, { col: 15, row: 7 }, { col: 11, row: 7 }, { col: 15, row: 13 }],
    patrolC: [{ col: 10, row: 5 }, { col: 5, row: 5 }, { col: 5, row: 15 }, { col: 15, row: 15 }, { col: 15, row: 5 }],
  },

  // Level 4: Камерные Залы
  {
    id: 4,
    name: 'Камерные Залы',
    ascii: [
      '#####################',
      '#.........#.........#',
      '#.#######.#.#######.#',
      '#.#.....#.#.#.....#.#',
      '#.#.###.#.#.#.###.#.#',
      '#.#.#...#.#.#...#.#.#',
      '#...#...#.#.#...#...#',
      '#####.### # ###.#####',
      '#####.#  A B  #.#####',
      '#.....# ## ## #.....#',
      '#.###.#   C   #.###.#',
      '#.....# ##### #.....#',
      '#####.#       #.#####',
      '#####.### # ###.#####',
      '#...#...#.#.#...#...#',
      '#.#.#...#.#.#...#.#.#',
      '#.#.###.#.H.#.###.#.#',
      '#.#.....#.#.#.....#.#',
      '#.#######.#.#######.#',
      '#...................#',
      '#####################',
    ],
    patrolA: [{ col: 1, row: 1 }, { col: 9, row: 1 }, { col: 1, row: 6 }, { col: 5, row: 6 }, { col: 1, row: 14 }],
    patrolB: [{ col: 19, row: 1 }, { col: 11, row: 1 }, { col: 19, row: 6 }, { col: 15, row: 6 }, { col: 19, row: 14 }],
    patrolC: [{ col: 10, row: 6 }, { col: 1, row: 9 }, { col: 10, row: 13 }, { col: 19, row: 9 }],
  },

  // Level 5: Зигзаг Лабиринт
  {
    id: 5,
    name: 'Зигзаг Лабиринт',
    ascii: [
      '#####################',
      '#...................#',
      '#.#################.#',
      '#.................#.#',
      '#.###############.#.#',
      '#.#...............#.#',
      '#.#.#############.#.#',
      '#...#...#   #...#...#',
      '###.#.#  A B  #.#.###',
      '#...#.# ## ## #.#...#',
      '#.....    C   #.....#',
      '#...#.# ##### #.#...#',
      '###.#.#       #.#.###',
      '#...#.#.#####.#.#...#',
      '#.#.#############.#.#',
      '#.#...............#.#',
      '#.###############.#.#',
      '#.................#.#',
      '#.#################.#',
      '#.........H.........#',
      '#####################',
    ],
    patrolA: [{ col: 1, row: 1 }, { col: 19, row: 1 }, { col: 19, row: 3 }, { col: 1, row: 7 }],
    patrolB: [{ col: 19, row: 19 }, { col: 1, row: 19 }, { col: 1, row: 17 }, { col: 19, row: 13 }],
    patrolC: [{ col: 10, row: 7 }, { col: 5, row: 10 }, { col: 10, row: 13 }, { col: 15, row: 10 }],
  },

  // Level 6: Четырёхлистник
  {
    id: 6,
    name: 'Четырёхлистник',
    ascii: [
      '#####################',
      '#.........#.........#',
      '#.###.###.#.###.###.#',
      '#.###.###.#.###.###.#',
      '#.###.###.#.###.###.#',
      '#.........#.........#',
      '#.###.###.#.###.###.#',
      '#...#.#   #   #.#...#',
      '###.#.#  A B  #.#.###',
      '#...#.# ## ## #.#...#',
      '#.....    C   #.....#',
      '#...#.# ##### #.#...#',
      '###.#.#       #.#.###',
      '#...#.#.#####.#.#...#',
      '#.###.###.#.###.###.#',
      '#.........H.........#',
      '#.###.###.#.###.###.#',
      '#.###.###.#.###.###.#',
      '#.###.###.#.###.###.#',
      '#.........#.........#',
      '#####################',
    ],
    patrolA: [{ col: 1, row: 1 }, { col: 9, row: 1 }, { col: 9, row: 5 }, { col: 1, row: 5 }, { col: 1, row: 10 }],
    patrolB: [{ col: 19, row: 1 }, { col: 11, row: 1 }, { col: 11, row: 5 }, { col: 19, row: 5 }, { col: 19, row: 10 }],
    patrolC: [{ col: 10, row: 5 }, { col: 5, row: 10 }, { col: 10, row: 13 }, { col: 15, row: 10 }],
  },

  // Level 7: Сетка Сенсоров
  {
    id: 7,
    name: 'Сетка Сенсоров',
    ascii: [
      '#####################',
      '#.#.#.#.#.#.#.#.#.#.#',
      '#...................#',
      '#.#.#.###.#.###.#.#.#',
      '#.....#...#...#.....#',
      '#.###.#.#####.#.###.#',
      '#...#.#...#...#.#...#',
      '###.#.### # ###.#.###',
      '#...#.#  A B  #.#...#',
      '#.###.# ## ## #.###.#',
      '#.....    C   #.....#',
      '#.###.# ##### #.###.#',
      '#...#.#       #.#...#',
      '###.#.#########.#.###',
      '#...#.....#.....#...#',
      '#.###.###.#.###.###.#',
      '#.........H.........#',
      '#.#.#.#########.#.#.#',
      '#...................#',
      '#.#.#.#.#.#.#.#.#.#.#',
      '#####################',
    ],
    patrolA: [{ col: 1, row: 2 }, { col: 9, row: 2 }, { col: 1, row: 6 }, { col: 9, row: 6 }, { col: 1, row: 10 }],
    patrolB: [{ col: 19, row: 2 }, { col: 11, row: 2 }, { col: 19, row: 6 }, { col: 11, row: 6 }, { col: 19, row: 10 }],
    patrolC: [{ col: 10, row: 4 }, { col: 3, row: 10 }, { col: 10, row: 14 }, { col: 17, row: 10 }],
  },

  // Level 8: Атриум Наблюдения
  {
    id: 8,
    name: 'Атриум Наблюдения',
    ascii: [
      '#####################',
      '#...................#',
      '#.#####.#.#.#.#####.#',
      '#.#...#.#.#.#.#...#.#',
      '#.#.#.#.#.#.#.#.#.#.#',
      '#...#...........#...#',
      '###.#.#########.#.###',
      '#...#.#   #   #.#...#',
      '#.###.#  A B  #.###.#',
      '#.....# ## ## #.....#',
      '#.###.#   C   #.###.#',
      '#.....# ##### #.....#',
      '#.###.#       #.###.#',
      '#...#.#.#####.#.#...#',
      '###.#.#...#...#.#.###',
      '#...#...........#...#',
      '#.#.#.###.H.###.#.#.#',
      '#.#...#.#.#.#.#...#.#',
      '#.#####.#.#.#.#####.#',
      '#...................#',
      '#####################',
    ],
    patrolA: [{ col: 1, row: 1 }, { col: 9, row: 1 }, { col: 1, row: 5 }, { col: 5, row: 5 }, { col: 1, row: 9 }],
    patrolB: [{ col: 19, row: 1 }, { col: 11, row: 1 }, { col: 19, row: 5 }, { col: 15, row: 5 }, { col: 19, row: 9 }],
    patrolC: [{ col: 10, row: 5 }, { col: 5, row: 9 }, { col: 10, row: 15 }, { col: 15, row: 9 }],
  },

  // Level 9: Складские Ангары
  {
    id: 9,
    name: 'Складские Ангары',
    ascii: [
      '#####################',
      '#...................#',
      '#.#.###.###.###.###.#',
      '#.#.#...#...#...#.#.#',
      '#.#.#.###.#.###.#.#.#',
      '#.#.#.#...#...#.#.#.#',
      '#...#.#.#####.#.#...#',
      '###.#.#   #   #.#.###',
      '#...#.#  A B  #.#...#',
      '#.###.# ## ## #.###.#',
      '#.....    C   #.....#',
      '#.###.# ##### #.###.#',
      '#...#.#       #.#...#',
      '###.#.#########.#.###',
      '#...#...........#...#',
      '#.#.#############.#.#',
      '#.#.......H.......#.#',
      '#.#.#############.#.#',
      '#.#...............#.#',
      '#...................#',
      '#####################',
    ],
    patrolA: [{ col: 1, row: 1 }, { col: 9, row: 1 }, { col: 1, row: 6 }, { col: 1, row: 10 }, { col: 1, row: 14 }],
    patrolB: [{ col: 19, row: 1 }, { col: 11, row: 1 }, { col: 19, row: 6 }, { col: 19, row: 10 }, { col: 19, row: 14 }],
    patrolC: [{ col: 10, row: 6 }, { col: 5, row: 10 }, { col: 10, row: 14 }, { col: 15, row: 10 }],
  },

  // Level 10: Главный Терминал
  {
    id: 10,
    name: 'Главный Терминал',
    ascii: [
      '#####################',
      '#.........#.........#',
      '#.#######.#.#######.#',
      '#.#.....#.#.#.....#.#',
      '#.#.###.#.#.#.###.#.#',
      '#...#.#.#.#.#.#.#...#',
      '###.#.#.#.#.#.#.#.###',
      '#...#.#.# # #.#.#...#',
      '#.###.#  A B  #.###.#',
      '#.....# ## ## #.....#',
      '#.###.    C    .###.#',
      '#.....# ##### #.....#',
      '#.###.#       #.###.#',
      '#...#.#.#####.#.#...#',
      '###.#.#...#...#.#.###',
      '#...#...#.#.#...#...#',
      '#.#####.#.H.#.#####.#',
      '#.#...#.#.#.#.#...#.#',
      '#.#.#.#.#.#.#.#.#.#.#',
      '#...#...........#...#',
      '#####################',
    ],
    patrolA: [{ col: 1, row: 1 }, { col: 9, row: 1 }, { col: 1, row: 5 }, { col: 1, row: 9 }, { col: 1, row: 15 }],
    patrolB: [{ col: 19, row: 1 }, { col: 11, row: 1 }, { col: 19, row: 5 }, { col: 19, row: 9 }, { col: 19, row: 15 }],
    patrolC: [{ col: 10, row: 4 }, { col: 4, row: 9 }, { col: 10, row: 15 }, { col: 16, row: 9 }],
  },
];

/**
 * Parses raw level ASCII into structured MazeLevel
 */
function parseLevel(def: RawLevelDef): MazeLevel {
  const layout: CellType[][] = [];
  let heroStart: GridCoord = { col: 10, row: 16 };
  let startA: GridCoord = { col: 9, row: 8 };
  let startB: GridCoord = { col: 11, row: 8 };
  let startC: GridCoord = { col: 10, row: 10 };

  for (let r = 0; r < def.ascii.length; r++) {
    const rowStr = def.ascii[r];
    const row: CellType[] = [];
    for (let c = 0; c < rowStr.length; c++) {
      const char = rowStr[c];
      if (char === '#') {
        row.push(1);
      } else if (char === '.') {
        row.push(2);
      } else if (char === 'H') {
        heroStart = { col: c, row: r };
        row.push(0);
      } else if (char === 'A') {
        startA = { col: c, row: r };
        row.push(0);
      } else if (char === 'B') {
        startB = { col: c, row: r };
        row.push(0);
      } else if (char === 'C') {
        startC = { col: c, row: r };
        row.push(0);
      } else {
        // ' ' or unknown -> empty corridor
        row.push(0);
      }
    }
    layout.push(row);
  }

  const enemies: EnemyConfig[] = [
    {
      id: 1,
      name: 'Патрульный Альфа',
      personality: 'patrol_alpha',
      startCoord: startA,
      patrolWaypoints: def.patrolA,
    },
    {
      id: 2,
      name: 'Патрульный Бета',
      personality: 'patrol_beta',
      startCoord: startB,
      patrolWaypoints: def.patrolB,
    },
    {
      id: 3,
      name: 'Сталкер',
      personality: 'stalker',
      startCoord: startC,
      patrolWaypoints: def.patrolC,
    },
  ];

  return {
    id: def.id,
    name: def.name,
    layout,
    heroStart,
    enemies,
  };
}

export const MAZE_LEVELS: MazeLevel[] = LEVEL_DEFS.map(parseLevel);

export const TOTAL_LEVELS = MAZE_LEVELS.length; // 10

// Export Level 1 as the default INITIAL_MAZE_LAYOUT for backward compatibility
export const INITIAL_MAZE_LAYOUT: CellType[][] = MAZE_LEVELS[0].layout.map((row) => [...row]);
export const HERO_START_COORD: GridCoord = MAZE_LEVELS[0].heroStart;
export const ENEMY_SPAWN_CONFIGS = MAZE_LEVELS[0].enemies;

/**
 * Returns a deep copy of a specific level's maze layout
 */
export function getLevelMaze(levelNumber: number): CellType[][] {
  const index = Math.max(0, Math.min(TOTAL_LEVELS - 1, levelNumber - 1));
  return MAZE_LEVELS[index].layout.map((row) => [...row]);
}

/**
 * Returns the level configuration for the given level number (1 to 10)
 */
export function getLevelConfig(levelNumber: number): MazeLevel {
  const index = Math.max(0, Math.min(TOTAL_LEVELS - 1, levelNumber - 1));
  return MAZE_LEVELS[index];
}

/**
 * Backward compatibility alias
 */
export function cloneMaze(): CellType[][] {
  return getLevelMaze(1);
}
