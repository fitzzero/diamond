import type {
  DiamondPosition,
  Piece,
  PieceColor,
  PieceType,
  BoardState,
} from '@/types/game';
import { diamondCoords } from './coordinates';

/**
 * Diamond Chess Piece Movement Rules
 *
 * Modified pawn mechanics:
 * - White pawns: Move NW/NE (up-left/up-right in diamond), capture diagonally right (N in diamond)
 * - Black pawns: Move SW/SE (down-left/down-right in diamond), capture diagonally left (S in diamond)
 *
 * All other pieces follow standard chess rules adapted to diamond grid
 */

export interface MoveOptions {
  capturesOnly?: boolean;
  includeBlocked?: boolean;
}

export class PieceMovement {
  /**
   * Get all possible moves for a piece at given position
   */
  getPossibleMoves(
    piece: Piece,
    position: DiamondPosition,
    board: BoardState,
    options: MoveOptions = {}
  ): DiamondPosition[] {
    switch (piece.type) {
      case 'pawn':
        return this.getPawnMoves(piece, position, board, options);
      case 'rook':
        return this.getRookMoves(piece.color, position, board, options);
      case 'bishop':
        return this.getBishopMoves(piece.color, position, board, options);
      case 'queen':
        return this.getQueenMoves(piece.color, position, board, options);
      case 'king':
        return this.getKingMoves(piece.color, position, board, options);
      case 'knight':
        return this.getKnightMoves(piece.color, position, board, options);
      default:
        return [];
    }
  }

  /**
   * Diamond Chess Pawn Movement - Original Rules
   * White: Move NW/NE (diagonally forward), capture N (straight forward)
   * Black: Move SW/SE (diagonally forward), capture S (straight forward)
   */
  private getPawnMoves(
    piece: Piece,
    position: DiamondPosition,
    board: BoardState,
    options: MoveOptions
  ): DiamondPosition[] {
    const moves: DiamondPosition[] = [];
    const { x, y } = position;
    const isWhite = piece.color === 'white';

    if (options.capturesOnly) {
      // Only capture moves - different from movement direction!
      if (isWhite) {
        // White pawns capture straight forward (N in diamond = smaller Y)
        const capturePos = { x, y: y - 1 };
        if (this.isValidMove(capturePos, board, piece.color, true)) {
          moves.push(capturePos);
        }
      } else {
        // Black pawns capture straight forward (S in diamond = larger Y)
        const capturePos = { x, y: y + 1 };
        if (this.isValidMove(capturePos, board, piece.color, true)) {
          moves.push(capturePos);
        }
      }
    } else {
      if (isWhite) {
        // White pawn movement: NW and NE (diagonally forward toward smaller Y)
        const movePositions = [
          { x: x - 1, y: y - 1 }, // NW
          { x: x + 1, y: y - 1 }, // NE
        ];

        for (const movePos of movePositions) {
          if (this.isValidMove(movePos, board, piece.color, false)) {
            moves.push(movePos);
          }
        }

        // White pawn capture: straight forward (N = smaller Y)
        const capturePos = { x, y: y - 1 };
        if (this.isValidMove(capturePos, board, piece.color, true)) {
          moves.push(capturePos);
        }
      } else {
        // Black pawn movement: SW and SE (diagonally forward toward larger Y)
        const movePositions = [
          { x: x - 1, y: y + 1 }, // SW
          { x: x + 1, y: y + 1 }, // SE
        ];

        for (const movePos of movePositions) {
          if (this.isValidMove(movePos, board, piece.color, false)) {
            moves.push(movePos);
          }
        }

        // Black pawn capture: straight forward (S = larger Y)
        const capturePos = { x, y: y + 1 };
        if (this.isValidMove(capturePos, board, piece.color, true)) {
          moves.push(capturePos);
        }
      }
    }

    return moves;
  }

  /**
   * Rook movement - horizontal and vertical lines in diamond
   */
  private getRookMoves(
    color: PieceColor,
    position: DiamondPosition,
    board: BoardState,
    options: MoveOptions
  ): DiamondPosition[] {
    const moves: DiamondPosition[] = [];
    const directions = [
      { x: 1, y: 0 }, // Right
      { x: -1, y: 0 }, // Left
      { x: 0, y: 1 }, // Up
      { x: 0, y: -1 }, // Down
    ];

    for (const direction of directions) {
      moves.push(
        ...this.getLineMoves(color, position, direction, board, options)
      );
    }

    return moves;
  }

  /**
   * Bishop movement - diagonal lines in diamond
   */
  private getBishopMoves(
    color: PieceColor,
    position: DiamondPosition,
    board: BoardState,
    options: MoveOptions
  ): DiamondPosition[] {
    const moves: DiamondPosition[] = [];
    const directions = [
      { x: 1, y: 1 }, // Up-Right
      { x: -1, y: -1 }, // Down-Left
      { x: 1, y: -1 }, // Down-Right
      { x: -1, y: 1 }, // Up-Left
    ];

    for (const direction of directions) {
      moves.push(
        ...this.getLineMoves(color, position, direction, board, options)
      );
    }

    return moves;
  }

  /**
   * Queen movement - combination of rook and bishop
   */
  private getQueenMoves(
    color: PieceColor,
    position: DiamondPosition,
    board: BoardState,
    options: MoveOptions
  ): DiamondPosition[] {
    return [
      ...this.getRookMoves(color, position, board, options),
      ...this.getBishopMoves(color, position, board, options),
    ];
  }

  /**
   * King movement - one square in any direction
   */
  private getKingMoves(
    color: PieceColor,
    position: DiamondPosition,
    board: BoardState,
    options: MoveOptions
  ): DiamondPosition[] {
    const moves: DiamondPosition[] = [];
    const { x, y } = position;

    const kingMoves = [
      { x: x + 1, y }, // Right
      { x: x - 1, y }, // Left
      { x, y: y + 1 }, // Up
      { x, y: y - 1 }, // Down
      { x: x + 1, y: y + 1 }, // Up-Right
      { x: x - 1, y: y - 1 }, // Down-Left
      { x: x + 1, y: y - 1 }, // Down-Right
      { x: x - 1, y: y + 1 }, // Up-Left
    ];

    for (const move of kingMoves) {
      if (diamondCoords.isValidDiamondPosition(move)) {
        const piece = this.getPieceAt(move, board);
        if (!piece || piece.color !== color) {
          moves.push(move);
        }
      }
    }

    return moves;
  }

  /**
   * Knight movement - L-shaped moves adapted to diamond grid
   */
  private getKnightMoves(
    color: PieceColor,
    position: DiamondPosition,
    board: BoardState,
    options: MoveOptions
  ): DiamondPosition[] {
    const moves: DiamondPosition[] = [];
    const { x, y } = position;

    const knightMoves = [
      { x: x + 2, y: y + 1 },
      { x: x + 2, y: y - 1 },
      { x: x - 2, y: y + 1 },
      { x: x - 2, y: y - 1 },
      { x: x + 1, y: y + 2 },
      { x: x - 1, y: y + 2 },
      { x: x + 1, y: y - 2 },
      { x: x - 1, y: y - 2 },
    ];

    for (const move of knightMoves) {
      if (diamondCoords.isValidDiamondPosition(move)) {
        const piece = this.getPieceAt(move, board);
        if (!piece || piece.color !== color) {
          moves.push(move);
        }
      }
    }

    return moves;
  }

  /**
   * Get moves along a line (for rook, bishop, queen)
   */
  private getLineMoves(
    color: PieceColor,
    position: DiamondPosition,
    direction: DiamondPosition,
    board: BoardState,
    options: MoveOptions
  ): DiamondPosition[] {
    const moves: DiamondPosition[] = [];
    let current = {
      x: position.x + direction.x,
      y: position.y + direction.y,
    };

    while (diamondCoords.isValidDiamondPosition(current)) {
      const piece = this.getPieceAt(current, board);

      if (!piece) {
        // Empty square
        if (!options.capturesOnly) {
          moves.push({ ...current });
        }
      } else {
        // Occupied square
        if (piece.color !== color) {
          // Enemy piece - can capture
          moves.push({ ...current });
        }
        break; // Can't move further
      }

      current.x += direction.x;
      current.y += direction.y;
    }

    return moves;
  }

  /**
   * Check if a move is valid
   */
  private isValidMove(
    position: DiamondPosition,
    board: BoardState,
    pieceColor: PieceColor,
    captureOnly: boolean
  ): boolean {
    if (!diamondCoords.isValidDiamondPosition(position)) {
      return false;
    }

    const piece = this.getPieceAt(position, board);

    if (captureOnly) {
      // Must have enemy piece to capture
      return piece !== null && piece.color !== pieceColor;
    } else {
      // Must be empty for regular move
      return piece === null;
    }
  }

  /**
   * Get piece at position
   */
  private getPieceAt(
    position: DiamondPosition,
    board: BoardState
  ): Piece | null {
    const key = diamondCoords.positionToKey(position);
    return board.get(key) || null;
  }
}

// Export singleton instance
export const pieceMovement = new PieceMovement();
