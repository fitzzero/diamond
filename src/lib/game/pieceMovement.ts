import type {
  BoardState,
  Piece,
  PieceColor,
  ChessPosition,
} from '@/types/game';
import { chessCoords } from './coordinates';

/**
 * Standard Chess Piece Movement Logic
 *
 * Implements standard chess piece movement rules on an 8x8 grid.
 * This is much simpler than trying to adapt chess rules to diamond coordinates.
 *
 * Diamond Chess Special Rules:
 * - Pawns: White pawns move Left (-file) and Up (+rank), capture diagonally Top Left (-1 file, +1 rank)
 * - Pawns: Black pawns move Right (+file) and Down (-rank), capture diagonally Bottom Right (+1 file, -1 rank)
 * - All other pieces follow standard chess movement rules
 */

interface MoveOptions {
  capturesOnly?: boolean; // Only return moves that capture opponent pieces
}

class StandardPieceMovement {
  /**
   * Get all possible moves for a piece at a given position
   */
  getPossibleMoves(
    piece: Piece,
    position: ChessPosition,
    board: BoardState,
    options: MoveOptions = {}
  ): ChessPosition[] {
    if (!chessCoords.isValidChessPosition(position)) {
      return [];
    }

    switch (piece.type) {
      case 'pawn':
        return this.getPawnMoves(piece, position, board, options);
      case 'rook':
        return this.getRookMoves(piece, position, board, options);
      case 'bishop':
        return this.getBishopMoves(piece, position, board, options);
      case 'queen':
        return this.getQueenMoves(piece, position, board, options);
      case 'king':
        return this.getKingMoves(piece, position, board, options);
      case 'knight':
        return this.getKnightMoves(piece, position, board, options);
      default:
        return [];
    }
  }

  /**
   * Diamond Chess Pawn Movement:
   * - White pawns: Move Left (-file) and Up (+rank), capture Top Left (-1 file, +1 rank)
   * - Black pawns: Move Right (+file) and Down (-rank), capture Bottom Right (+1 file, -1 rank)
   */
  private getPawnMoves(
    piece: Piece,
    position: ChessPosition,
    board: BoardState,
    options: MoveOptions
  ): ChessPosition[] {
    const moves: ChessPosition[] = [];
    const { file, rank } = position;
    const isWhite = piece.color === 'WHITE';

    if (options.capturesOnly) {
      // Diamond Chess: Pawns capture diagonally only
      if (isWhite) {
        // White pawns capture only to top left (-1 file, +1 rank)
        const capturePos = { file: file - 1, rank: rank + 1 };
        if (this.canCapture(capturePos, piece.color, board)) {
          moves.push(capturePos);
        }
      } else {
        // Black pawns capture only to bottom right (+1 file, -1 rank)
        const capturePos = { file: file + 1, rank: rank - 1 };
        if (this.canCapture(capturePos, piece.color, board)) {
          moves.push(capturePos);
        }
      }
    } else {
      // Diamond Chess: Pawns move Left/Up (White) or Right/Down (Black)
      if (isWhite) {
        // White pawns move Left (-file) and Up (+rank) - these are separate moves
        const moveLeft = { file: file - 1, rank: rank }; // Move left
        const moveUp = { file: file, rank: rank + 1 }; // Move up

        if (this.isEmptySquare(moveLeft, board)) moves.push(moveLeft);
        if (this.isEmptySquare(moveUp, board)) moves.push(moveUp);

        // Add capture move (diagonally top-left)
        const capturePos = { file: file - 1, rank: rank + 1 };
        if (this.canCapture(capturePos, piece.color, board)) {
          moves.push(capturePos);
        }
      } else {
        // Black pawns move Right (+file) and Down (-rank) - these are separate moves
        const moveRight = { file: file + 1, rank: rank }; // Move right
        const moveDown = { file: file, rank: rank - 1 }; // Move down

        if (this.isEmptySquare(moveRight, board)) moves.push(moveRight);
        if (this.isEmptySquare(moveDown, board)) moves.push(moveDown);

        // Add capture move (diagonally bottom-right)
        const capturePos = { file: file + 1, rank: rank - 1 };
        if (this.canCapture(capturePos, piece.color, board)) {
          moves.push(capturePos);
        }
      }
    }

    return moves.filter(pos => chessCoords.isValidChessPosition(pos));
  }

  /**
   * Standard rook movement (horizontal and vertical lines)
   */
  private getRookMoves(
    piece: Piece,
    position: ChessPosition,
    board: BoardState,
    options: MoveOptions
  ): ChessPosition[] {
    const moves: ChessPosition[] = [];
    const directions = [
      { file: 1, rank: 0 }, // Right
      { file: -1, rank: 0 }, // Left
      { file: 0, rank: 1 }, // Up
      { file: 0, rank: -1 }, // Down
    ];

    for (const direction of directions) {
      moves.push(
        ...this.getMovesInDirection(
          position,
          direction,
          board,
          piece.color,
          options
        )
      );
    }

    return moves;
  }

  /**
   * Standard bishop movement (diagonal lines)
   */
  private getBishopMoves(
    piece: Piece,
    position: ChessPosition,
    board: BoardState,
    options: MoveOptions
  ): ChessPosition[] {
    const moves: ChessPosition[] = [];
    const directions = [
      { file: 1, rank: 1 }, // Up-Right
      { file: -1, rank: -1 }, // Down-Left
      { file: 1, rank: -1 }, // Down-Right
      { file: -1, rank: 1 }, // Up-Left
    ];

    for (const direction of directions) {
      moves.push(
        ...this.getMovesInDirection(
          position,
          direction,
          board,
          piece.color,
          options
        )
      );
    }

    return moves;
  }

  /**
   * Standard queen movement (combination of rook and bishop)
   */
  private getQueenMoves(
    piece: Piece,
    position: ChessPosition,
    board: BoardState,
    options: MoveOptions
  ): ChessPosition[] {
    const rookMoves = this.getRookMoves(piece, position, board, options);
    const bishopMoves = this.getBishopMoves(piece, position, board, options);
    return [...rookMoves, ...bishopMoves];
  }

  /**
   * Standard king movement (one square in any direction)
   */
  private getKingMoves(
    piece: Piece,
    position: ChessPosition,
    board: BoardState,
    options: MoveOptions
  ): ChessPosition[] {
    const moves: ChessPosition[] = [];
    const { file, rank } = position;

    const directions = [
      { file: 1, rank: 0 }, // Right
      { file: -1, rank: 0 }, // Left
      { file: 0, rank: 1 }, // Up
      { file: 0, rank: -1 }, // Down
      { file: 1, rank: 1 }, // Up-Right
      { file: -1, rank: -1 }, // Down-Left
      { file: 1, rank: -1 }, // Down-Right
      { file: -1, rank: 1 }, // Up-Left
    ];

    for (const direction of directions) {
      const newPos = {
        file: file + direction.file,
        rank: rank + direction.rank,
      };

      if (chessCoords.isValidChessPosition(newPos)) {
        if (options.capturesOnly) {
          // Only capture moves
          if (this.canCapture(newPos, piece.color, board)) {
            moves.push(newPos);
          }
        } else {
          // Both movement and capture moves
          if (
            this.isEmptySquare(newPos, board) ||
            this.canCapture(newPos, piece.color, board)
          ) {
            moves.push(newPos);
          }
        }
      }
    }

    return moves;
  }

  /**
   * Standard knight movement (L-shapes)
   */
  private getKnightMoves(
    piece: Piece,
    position: ChessPosition,
    board: BoardState,
    options: MoveOptions
  ): ChessPosition[] {
    const moves: ChessPosition[] = [];
    const { file, rank } = position;

    const knightMoves = [
      { file: file + 2, rank: rank + 1 },
      { file: file + 2, rank: rank - 1 },
      { file: file - 2, rank: rank + 1 },
      { file: file - 2, rank: rank - 1 },
      { file: file + 1, rank: rank + 2 },
      { file: file - 1, rank: rank + 2 },
      { file: file + 1, rank: rank - 2 },
      { file: file - 1, rank: rank - 2 },
    ];

    for (const move of knightMoves) {
      if (chessCoords.isValidChessPosition(move)) {
        if (options.capturesOnly) {
          // Only capture moves
          if (this.canCapture(move, piece.color, board)) {
            moves.push(move);
          }
        } else {
          // Both movement and capture moves
          if (
            this.isEmptySquare(move, board) ||
            this.canCapture(move, piece.color, board)
          ) {
            moves.push(move);
          }
        }
      }
    }

    return moves;
  }

  /**
   * Helper method to get moves in a specific direction (for sliding pieces)
   */
  private getMovesInDirection(
    position: ChessPosition,
    direction: { file: number; rank: number },
    board: BoardState,
    color: PieceColor,
    options: MoveOptions
  ): ChessPosition[] {
    const moves: ChessPosition[] = [];
    let current = {
      file: position.file + direction.file,
      rank: position.rank + direction.rank,
    };

    while (chessCoords.isValidChessPosition(current)) {
      if (this.isEmptySquare(current, board)) {
        // Empty square - can move here if not captures-only
        if (!options.capturesOnly) {
          moves.push({ ...current });
        }
      } else if (this.canCapture(current, color, board)) {
        // Enemy piece - can capture
        moves.push({ ...current });
        break; // Stop after capture
      } else {
        // Own piece - stop
        break;
      }

      current.file += direction.file;
      current.rank += direction.rank;
    }

    return moves;
  }

  /**
   * Check if a square is empty
   */
  private isEmptySquare(position: ChessPosition, board: BoardState): boolean {
    if (!chessCoords.isValidChessPosition(position)) {
      return false;
    }
    const key = chessCoords.positionToKey(position);
    return !board.has(key);
  }

  /**
   * Check if a piece can capture at the given position
   */
  private canCapture(
    position: ChessPosition,
    color: PieceColor,
    board: BoardState
  ): boolean {
    if (!chessCoords.isValidChessPosition(position)) {
      return false;
    }
    const key = chessCoords.positionToKey(position);
    const piece = board.get(key);
    return piece !== undefined && piece.color !== color;
  }

  /**
   * Get piece at position
   */
  private getPieceAt(position: ChessPosition, board: BoardState): Piece | null {
    const key = chessCoords.positionToKey(position);
    return board.get(key) || null;
  }
}

// Export singleton instance
export const pieceMovement = new StandardPieceMovement();
