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
 * - Pawns: White pawns move NW/NE diagonally, capture N (straight up)
 * - Pawns: Black pawns move SW/SE diagonally, capture S (straight down)
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
   * - White pawns: Move NW/NE diagonally, capture N (straight up)
   * - Black pawns: Move SW/SE diagonally, capture S (straight down)
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
      // Diamond Chess: Pawns capture straight forward/backward
      if (isWhite) {
        // White pawns capture straight up (north)
        const capturePos = { file, rank: rank + 1 };
        if (this.canCapture(capturePos, piece.color, board)) {
          moves.push(capturePos);
        }
      } else {
        // Black pawns capture straight down (south)
        const capturePos = { file, rank: rank - 1 };
        if (this.canCapture(capturePos, piece.color, board)) {
          moves.push(capturePos);
        }
      }
    } else {
      // Diamond Chess: Pawns move diagonally
      if (isWhite) {
        // White pawns move NW and NE diagonally
        const moveNW = { file: file - 1, rank: rank + 1 }; // Northwest
        const moveNE = { file: file + 1, rank: rank + 1 }; // Northeast

        if (this.isEmptySquare(moveNW, board)) moves.push(moveNW);
        if (this.isEmptySquare(moveNE, board)) moves.push(moveNE);

        // Two-square initial move from starting position
        if (rank === 1) {
          // Check both diagonal double moves if the single moves are clear
          if (this.isEmptySquare(moveNW, board)) {
            const doubleNW = { file: file - 2, rank: rank + 2 };
            if (this.isEmptySquare(doubleNW, board)) moves.push(doubleNW);
          }
          if (this.isEmptySquare(moveNE, board)) {
            const doubleNE = { file: file + 2, rank: rank + 2 };
            if (this.isEmptySquare(doubleNE, board)) moves.push(doubleNE);
          }
        }

        // Capture moves (straight up for white in Diamond Chess)
        const capturePos = { file, rank: rank + 1 };
        if (this.canCapture(capturePos, piece.color, board)) {
          moves.push(capturePos);
        }
      } else {
        // Black pawns move SW and SE diagonally
        const moveSW = { file: file - 1, rank: rank - 1 }; // Southwest
        const moveSE = { file: file + 1, rank: rank - 1 }; // Southeast

        if (this.isEmptySquare(moveSW, board)) moves.push(moveSW);
        if (this.isEmptySquare(moveSE, board)) moves.push(moveSE);

        // Two-square initial move from starting position
        if (rank === 6) {
          // Check both diagonal double moves if the single moves are clear
          if (this.isEmptySquare(moveSW, board)) {
            const doubleSW = { file: file - 2, rank: rank - 2 };
            if (this.isEmptySquare(doubleSW, board)) moves.push(doubleSW);
          }
          if (this.isEmptySquare(moveSE, board)) {
            const doubleSE = { file: file + 2, rank: rank - 2 };
            if (this.isEmptySquare(doubleSE, board)) moves.push(doubleSE);
          }
        }

        // Capture moves (straight down for black in Diamond Chess)
        const capturePos = { file, rank: rank - 1 };
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
