import { CellType, Direction, GridCoord } from './types';
import { directionToDelta, getOppositeDirection, isWalkable } from './rules';

const ALL_DIRS: Direction[] = ['UP', 'RIGHT', 'DOWN', 'LEFT'];

/**
 * Returns all walkable directions from a given tile.
 * If forbidReverse is true and there are other choices, the opposite of currentDir is excluded
 * so enemies don't twitch back and forth continuously.
 */
export function getAvailableDirections(
  col: number,
  row: number,
  grid: CellType[][],
  currentDir: Direction = 'NONE',
  forbidReverse = true
): Direction[] {
  const opposite = getOppositeDirection(currentDir);
  const valid: Direction[] = [];

  for (const dir of ALL_DIRS) {
    const { dx, dy } = directionToDelta(dir);
    const nCol = col + dx;
    const nRow = row + dy;
    if (isWalkable(nCol, nRow, grid)) {
      valid.push(dir);
    }
  }

  if (forbidReverse && valid.length > 1 && opposite !== 'NONE') {
    const filtered = valid.filter((d) => d !== opposite);
    if (filtered.length > 0) return filtered;
  }

  return valid;
}

/**
 * Finds the first step direction using Breadth-First Search (BFS) on the grid.
 */
export function findNextBfsStep(
  startCol: number,
  startRow: number,
  targetCol: number,
  targetRow: number,
  grid: CellType[][]
): Direction {
  if (startCol === targetCol && startRow === targetRow) {
    return 'NONE';
  }

  const height = grid.length;
  const width = grid[0].length;
  const visited: boolean[][] = Array.from({ length: height }, () => Array(width).fill(false));
  const parentDir: Direction[][] = Array.from({ length: height }, () => Array(width).fill('NONE'));

  const queue: GridCoord[] = [{ col: startCol, row: startRow }];
  visited[startRow][startCol] = true;

  let reached = false;

  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (curr.col === targetCol && curr.row === targetRow) {
      reached = true;
      break;
    }

    for (const dir of ALL_DIRS) {
      const { dx, dy } = directionToDelta(dir);
      const nCol = curr.col + dx;
      const nRow = curr.row + dy;

      if (nRow >= 0 && nRow < height && nCol >= 0 && nCol < width) {
        if (!visited[nRow][nCol] && isWalkable(nCol, nRow, grid)) {
          visited[nRow][nCol] = true;
          parentDir[nRow][nCol] = dir;
          queue.push({ col: nCol, row: nRow });
        }
      }
    }
  }

  if (!reached) {
    // If exact target isn't reachable, pick any available direction
    const available = getAvailableDirections(startCol, startRow, grid);
    return available.length > 0 ? available[0] : 'NONE';
  }

  // Backtrack from target to find the first step from start
  let currCol = targetCol;
  let currRow = targetRow;
  let firstDir: Direction = 'NONE';

  while (!(currCol === startCol && currRow === startRow)) {
    const dir = parentDir[currRow][currCol];
    const { dx, dy } = directionToDelta(dir);
    const prevCol = currCol - dx;
    const prevRow = currRow - dy;

    if (prevCol === startCol && prevRow === startRow) {
      firstDir = dir;
      break;
    }

    currCol = prevCol;
    currRow = prevRow;
  }

  return firstDir;
}
