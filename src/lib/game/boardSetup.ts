import type {
  BoardState,
  Piece,
  ChessPosition,
  PieceColor,
} from '@/types/game';
import { chessCoords } from './coordinates';

export interface BoardSetupInterface {
  createInitialBoard(): BoardState;
  findKing(board: BoardState, color: PieceColor): ChessPosition | null;
  getPieceAt(board: BoardState, position: ChessPosition): Piece | undefined;
}

class DiamondBoardSetup implements BoardSetupInterface {
  /**
   * Create the initial diamond chess board setup
   * White pieces positioned around bottom center (king at 7,0)
   * Black pieces positioned around top center (king at 0,7)
   */
  createInitialBoard(): BoardState {
    const board = new Map<string, Piece>();

    // White pieces (bottom center formation)
    this.placePiece(board, { file: 7, rank: 0 }, 'king', 'WHITE'); // King at bottom center
    this.placePiece(board, { file: 6, rank: 1 }, 'queen', 'WHITE'); // Queen
    this.placePiece(board, { file: 5, rank: 1 }, 'rook', 'WHITE'); // Rook 1
    this.placePiece(board, { file: 6, rank: 2 }, 'rook', 'WHITE'); // Rook 2
    this.placePiece(board, { file: 5, rank: 0 }, 'bishop', 'WHITE'); // Bishop 1
    this.placePiece(board, { file: 7, rank: 1 }, 'bishop', 'WHITE'); // Bishop 2
    this.placePiece(board, { file: 6, rank: 0 }, 'knight', 'WHITE'); // Knight 1
    this.placePiece(board, { file: 7, rank: 2 }, 'knight', 'WHITE'); // Knight 2

    // White pawns (7 pawns in diamond formation)
    this.placePiece(board, { file: 3, rank: 0 }, 'pawn', 'WHITE');
    this.placePiece(board, { file: 4, rank: 0 }, 'pawn', 'WHITE');
    this.placePiece(board, { file: 4, rank: 1 }, 'pawn', 'WHITE');
    this.placePiece(board, { file: 5, rank: 2 }, 'pawn', 'WHITE');
    this.placePiece(board, { file: 6, rank: 3 }, 'pawn', 'WHITE');
    this.placePiece(board, { file: 7, rank: 4 }, 'pawn', 'WHITE');
    this.placePiece(board, { file: 7, rank: 3 }, 'pawn', 'WHITE');

    // Black pieces (top center formation, mirrored from white)
    this.placePiece(board, { file: 0, rank: 7 }, 'king', 'BLACK'); // King at top center
    this.placePiece(board, { file: 1, rank: 6 }, 'queen', 'BLACK'); // Queen
    this.placePiece(board, { file: 2, rank: 6 }, 'rook', 'BLACK'); // Rook 1
    this.placePiece(board, { file: 1, rank: 5 }, 'rook', 'BLACK'); // Rook 2
    this.placePiece(board, { file: 2, rank: 7 }, 'bishop', 'BLACK'); // Bishop 1
    this.placePiece(board, { file: 0, rank: 6 }, 'bishop', 'BLACK'); // Bishop 2
    this.placePiece(board, { file: 1, rank: 7 }, 'knight', 'BLACK'); // Knight 1
    this.placePiece(board, { file: 0, rank: 5 }, 'knight', 'BLACK'); // Knight 2

    // Black pawns (7 pawns in diamond formation, mirrored)
    this.placePiece(board, { file: 4, rank: 7 }, 'pawn', 'BLACK');
    this.placePiece(board, { file: 3, rank: 7 }, 'pawn', 'BLACK');
    this.placePiece(board, { file: 3, rank: 6 }, 'pawn', 'BLACK');
    this.placePiece(board, { file: 2, rank: 5 }, 'pawn', 'BLACK');
    this.placePiece(board, { file: 1, rank: 4 }, 'pawn', 'BLACK');
    this.placePiece(board, { file: 0, rank: 3 }, 'pawn', 'BLACK');
    this.placePiece(board, { file: 0, rank: 4 }, 'pawn', 'BLACK');

    return board;
  }

  private placePiece(
    board: BoardState,
    position: ChessPosition,
    type: Piece['type'],
    color: PieceColor
  ): void {
    const key = chessCoords.positionToKey(position);
    const piece: Piece = {
      type,
      color,
      id: `${color}_${type}_${key}`,
    };
    board.set(key, piece);
  }

  /**
   * Find the king of the specified color on the board
   */
  findKing(board: BoardState, color: PieceColor): ChessPosition | null {
    for (const [positionKey, piece] of board.entries()) {
      if (piece.type === 'king' && piece.color === color) {
        return chessCoords.keyToPosition(positionKey);
      }
    }
    return null;
  }

  /**
   * Get the piece at the specified position
   */
  getPieceAt(board: BoardState, position: ChessPosition): Piece | undefined {
    const key = chessCoords.positionToKey(position);
    return board.get(key);
  }
}

export const boardSetup = new DiamondBoardSetup();
