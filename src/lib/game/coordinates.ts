import type {
  ChessPosition,
  DiamondDisplayPosition,
  DiamondPosition,
  CoordinateConverter,
} from '@/types/game';

/**
 * Diamond Chess Coordinate System
 *
 * PRIMARY SYSTEM: Standard 8x8 Chess Grid
 * - file: 0-7 (left to right, a-h)
 * - rank: 0-7 (bottom to top, 1-8)
 *
 * VISUAL DISPLAY: Diamond rotation for UI
 * - Standard chess board rotated 45 degrees
 * - All game logic uses standard coordinates
 * - Only UI rendering uses diamond display positions
 */

class ChessCoordinateSystem implements CoordinateConverter {
  /**
   * Check if a chess position is valid (within 8x8 board)
   */
  isValidChessPosition(pos: ChessPosition): boolean {
    return pos.file >= 0 && pos.file <= 7 && pos.rank >= 0 && pos.rank <= 7;
  }

  /**
   * Convert chess position to storage key
   */
  positionToKey(pos: ChessPosition): string {
    return `${pos.file},${pos.rank}`;
  }

  /**
   * Convert storage key to chess position
   */
  keyToPosition(key: string): ChessPosition {
    const [file, rank] = key.split(',').map(Number);
    return { file, rank };
  }

  /**
   * Convert standard chess position to diamond display position for UI rendering
   *
   * Diamond transformation for visual display:
   * - [0,0] (a1) = center left of diamond = (-3.5, 0)
   * - [0,7] (a8) = top center of diamond = (0, 3.5)
   * - [7,0] (h1) = bottom center of diamond = (0, -3.5)
   * - [7,7] (h8) = center right of diamond = (3.5, 0)
   */
  chessToDisplayDiamond(pos: ChessPosition): DiamondDisplayPosition {
    // Transform chess coordinates to diamond coordinates
    // x increases from left to right across the diamond
    // y increases from bottom to top of the diamond

    const x = 0.5 * (pos.file + pos.rank) - 3.5;
    const y = 0.5 * (pos.rank - pos.file);

    return { x, y };
  }

  /**
   * Convert diamond display position back to chess position
   *
   * Inverse of the diamond transformation
   */
  displayDiamondToChess(pos: DiamondDisplayPosition): ChessPosition | null {
    // Inverse diamond transformation
    // From: x = 0.5 * (file + rank) - 3.5, y = 0.5 * (rank - file)
    // Solve for file and rank:
    // x + 3.5 = 0.5 * (file + rank) -> file + rank = 2 * (x + 3.5)
    // y = 0.5 * (rank - file) -> rank - file = 2 * y
    // Adding: 2 * rank = 2 * (x + 3.5) + 2 * y -> rank = x + y + 3.5
    // Subtracting: 2 * file = 2 * (x + 3.5) - 2 * y -> file = x - y + 3.5

    const file = Math.round(pos.x - pos.y + 3.5);
    const rank = Math.round(pos.x + pos.y + 3.5);

    // Check if the result is valid
    if (file < 0 || file > 7 || rank < 0 || rank > 7) {
      return null;
    }

    return { file, rank };
  }

  /**
   * Convert legacy diamond position to chess position (for migration compatibility)
   */
  legacyDiamondToChess(pos: DiamondPosition): ChessPosition | null {
    return this.displayDiamondToChess({ x: pos.x, y: pos.y });
  }

  /**
   * Convert chess position to legacy diamond position (for migration compatibility)
   */
  chessToLegacyDiamond(pos: ChessPosition): DiamondPosition {
    const display = this.chessToDisplayDiamond(pos);
    return { x: display.x, y: display.y };
  }

  /**
   * Get all valid chess positions on the board
   */
  getAllValidPositions(): ChessPosition[] {
    const positions: ChessPosition[] = [];
    for (let file = 0; file <= 7; file++) {
      for (let rank = 0; rank <= 7; rank++) {
        positions.push({ file, rank });
      }
    }
    return positions;
  }

  /**
   * Convert chess notation (e.g., "e4") to chess position
   */
  notationToPosition(notation: string): ChessPosition | null {
    if (notation.length !== 2) return null;

    const file = notation.charCodeAt(0) - 'a'.charCodeAt(0);
    const rank = parseInt(notation[1]) - 1;

    const pos = { file, rank };
    return this.isValidChessPosition(pos) ? pos : null;
  }

  /**
   * Convert chess position to chess notation (e.g., "e4")
   */
  positionToNotation(pos: ChessPosition): string {
    if (!this.isValidChessPosition(pos)) return '';

    const fileChar = String.fromCharCode('a'.charCodeAt(0) + pos.file);
    const rankChar = (pos.rank + 1).toString();

    return fileChar + rankChar;
  }

  /**
   * Calculate distance between two chess positions
   */
  getDistance(from: ChessPosition, to: ChessPosition): number {
    const fileDiff = Math.abs(to.file - from.file);
    const rankDiff = Math.abs(to.rank - from.rank);
    return Math.max(fileDiff, rankDiff); // Chebyshev distance (chess king distance)
  }

  /**
   * Check if two positions are on the same diagonal
   */
  isOnSameDiagonal(from: ChessPosition, to: ChessPosition): boolean {
    const fileDiff = Math.abs(to.file - from.file);
    const rankDiff = Math.abs(to.rank - from.rank);
    return fileDiff === rankDiff && fileDiff > 0;
  }

  /**
   * Check if two positions are on the same rank or file
   */
  isOnSameRankOrFile(from: ChessPosition, to: ChessPosition): boolean {
    return (
      (from.file === to.file || from.rank === to.rank) &&
      !(from.file === to.file && from.rank === to.rank)
    );
  }

  /**
   * Get all positions between two positions (exclusive)
   * Returns empty array if positions are not in a straight line
   */
  getPositionsBetween(from: ChessPosition, to: ChessPosition): ChessPosition[] {
    const positions: ChessPosition[] = [];

    const fileDiff = to.file - from.file;
    const rankDiff = to.rank - from.rank;

    // Check if positions are in a straight line (rank, file, or diagonal)
    if (
      fileDiff !== 0 &&
      rankDiff !== 0 &&
      Math.abs(fileDiff) !== Math.abs(rankDiff)
    ) {
      return []; // Not in a straight line
    }

    const steps = Math.max(Math.abs(fileDiff), Math.abs(rankDiff));
    const fileStep = fileDiff === 0 ? 0 : fileDiff / Math.abs(fileDiff);
    const rankStep = rankDiff === 0 ? 0 : rankDiff / Math.abs(rankDiff);

    for (let i = 1; i < steps; i++) {
      const pos = {
        file: from.file + i * fileStep,
        rank: from.rank + i * rankStep,
      };
      positions.push(pos);
    }

    return positions;
  }
}

// Export singleton instance
export const chessCoords = new ChessCoordinateSystem();

// Legacy export for compatibility during migration
export const diamondCoords = {
  positionToKey: (pos: DiamondPosition) =>
    chessCoords.positionToKey(
      chessCoords.legacyDiamondToChess(pos) || { file: 0, rank: 0 }
    ),
  keyToPosition: (key: string) => {
    const chessPos = chessCoords.keyToPosition(key);
    return chessCoords.chessToLegacyDiamond(chessPos);
  },
  isValidDiamondPosition: (pos: DiamondPosition) => {
    const chessPos = chessCoords.legacyDiamondToChess(pos);
    return chessPos ? chessCoords.isValidChessPosition(chessPos) : false;
  },
};
