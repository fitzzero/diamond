import type {
  StandardPosition,
  DiamondPosition,
  CoordinateConverter,
} from '@/types/game';

/**
 * Diamond Chess Coordinate System
 *
 * Standard chess board (8x8) rotated 45 degrees to form a diamond.
 *
 * Standard coordinates:  Diamond coordinates:
 * (0,7) (1,7) ... (7,7)      (-7,0)
 * (0,6) (1,6) ... (7,6)    (-6,-1) ... (6,1)
 * ...                      ...         ...
 * (0,1) (1,1) ... (7,1)    (-1,-6) ... (1,6)
 * (0,0) (1,0) ... (7,0)      (0,-7)
 *
 * Transformation:
 * x_diamond = file - rank
 * y_diamond = -(file + rank - 7)
 */

export class DiamondCoordinates implements CoordinateConverter {
  /**
   * Convert standard chess position to diamond coordinates
   */
  standardToDiamond(pos: StandardPosition): DiamondPosition {
    const { file, rank } = pos;
    return {
      x: file - rank,
      y: -(file + rank - 7),
    };
  }

  /**
   * Convert diamond coordinates back to standard position
   * Returns null if the diamond position is invalid
   */
  diamondToStandard(pos: DiamondPosition): StandardPosition | null {
    const { x, y } = pos;

    // Calculate standard coordinates
    const file = (x - y + 7) / 2;
    const rank = (-y - x + 7) / 2;

    // Check if coordinates are valid integers within bounds
    if (
      !Number.isInteger(file) ||
      !Number.isInteger(rank) ||
      file < 0 ||
      file > 7 ||
      rank < 0 ||
      rank > 7
    ) {
      return null;
    }

    return { file, rank };
  }

  /**
   * Check if a diamond position is valid (within the diamond shape)
   */
  isValidDiamondPosition(pos: DiamondPosition): boolean {
    return this.diamondToStandard(pos) !== null;
  }

  /**
   * Convert diamond position to string key for Map storage
   */
  positionToKey(pos: DiamondPosition): string {
    return `${pos.x},${pos.y}`;
  }

  /**
   * Convert string key back to diamond position
   */
  keyToPosition(key: string): DiamondPosition {
    const [x, y] = key.split(',').map(Number);
    return { x, y };
  }

  /**
   * Get all valid diamond positions on the board
   */
  getAllValidPositions(): DiamondPosition[] {
    const positions: DiamondPosition[] = [];

    // Generate all positions in diamond range
    for (let x = -7; x <= 7; x++) {
      for (let y = -7; y <= 7; y++) {
        const pos = { x, y };
        if (this.isValidDiamondPosition(pos)) {
          positions.push(pos);
        }
      }
    }

    return positions;
  }

  /**
   * Get neighboring positions in diamond grid
   */
  getNeighbors(pos: DiamondPosition): DiamondPosition[] {
    const { x, y } = pos;
    const directions = [
      { x: 1, y: 0 }, // Right
      { x: -1, y: 0 }, // Left
      { x: 0, y: 1 }, // Up
      { x: 0, y: -1 }, // Down
      { x: 1, y: 1 }, // Up-Right
      { x: -1, y: -1 }, // Down-Left
      { x: 1, y: -1 }, // Down-Right
      { x: -1, y: 1 }, // Up-Left
    ];

    return directions
      .map(dir => ({ x: x + dir.x, y: y + dir.y }))
      .filter(neighbor => this.isValidDiamondPosition(neighbor));
  }

  /**
   * Calculate distance between two diamond positions
   */
  distance(pos1: DiamondPosition, pos2: DiamondPosition): number {
    return Math.max(
      Math.abs(pos1.x - pos2.x),
      Math.abs(pos1.y - pos2.y),
      Math.abs(pos1.x - pos1.y - (pos2.x - pos2.y))
    );
  }

  /**
   * Get algebraic notation for a diamond position (for display)
   */
  toAlgebraic(pos: DiamondPosition): string | null {
    const standard = this.diamondToStandard(pos);
    if (!standard) return null;

    const file = String.fromCharCode(97 + standard.file); // a-h
    const rank = (standard.rank + 1).toString(); // 1-8
    return file + rank;
  }

  /**
   * Parse algebraic notation to diamond position
   */
  fromAlgebraic(notation: string): DiamondPosition | null {
    if (notation.length !== 2) return null;

    const file = notation.charCodeAt(0) - 97; // a=0, b=1, etc.
    const rank = parseInt(notation.charAt(1)) - 1; // 1=0, 2=1, etc.

    if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;

    return this.standardToDiamond({ file, rank });
  }
}

// Export singleton instance
export const diamondCoords = new DiamondCoordinates();
