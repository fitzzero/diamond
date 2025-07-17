import type {
  BoardState,
  Piece,
  PieceColor,
  PieceType,
  DiamondPosition,
} from '@/types/game';
import { diamondCoords } from './coordinates';

/**
 * Diamond Chess Board Setup
 *
 * Standard chess starting position translated to diamond coordinates
 */

export class BoardSetup {
  /**
   * Create initial board state for Diamond Chess
   */
  createInitialBoard(): BoardState {
    const board: BoardState = new Map();

    // Setup white pieces (bottom of standard board)
    this.setupPieces(board, 'WHITE');

    // Setup black pieces (top of standard board)
    this.setupPieces(board, 'BLACK');

    return board;
  }

  /**
   * Setup pieces for one color
   */
  private setupPieces(board: BoardState, color: PieceColor): void {
    const isWhite = color === 'WHITE';

    // Piece arrangement on back rank
    const backRankPieces: PieceType[] = [
      'rook',
      'knight',
      'bishop',
      'queen',
      'king',
      'bishop',
      'knight',
      'rook',
    ];

    // Calculate ranks based on color
    const backRank = isWhite ? 0 : 7; // 0 for white, 7 for black
    const pawnRank = isWhite ? 1 : 6; // 1 for white, 6 for black

    // Place back rank pieces
    for (let file = 0; file < 8; file++) {
      const pieceType = backRankPieces[file];
      const standardPos = { file, rank: backRank };
      const diamondPos = diamondCoords.standardToDiamond(standardPos);

      const piece: Piece = {
        type: pieceType,
        color,
        id: `${color}-${pieceType}-${file}`, // Unique ID
      };

      const key = diamondCoords.positionToKey(diamondPos);
      board.set(key, piece);
    }

    // Place pawns
    for (let file = 0; file < 8; file++) {
      const standardPos = { file, rank: pawnRank };
      const diamondPos = diamondCoords.standardToDiamond(standardPos);

      const piece: Piece = {
        type: 'pawn',
        color,
        id: `${color}-pawn-${file}`,
      };

      const key = diamondCoords.positionToKey(diamondPos);
      board.set(key, piece);
    }
  }

  /**
   * Create an empty board
   */
  createEmptyBoard(): BoardState {
    return new Map();
  }

  /**
   * Create a board from piece positions (for testing)
   */
  createBoardFromPieces(
    pieces: Array<{ piece: Piece; position: DiamondPosition }>
  ): BoardState {
    const board: BoardState = new Map();

    for (const { piece, position } of pieces) {
      const key = diamondCoords.positionToKey(position);
      board.set(key, piece);
    }

    return board;
  }

  /**
   * Get all pieces of a specific color from board
   */
  getPiecesByColor(
    board: BoardState,
    color: PieceColor
  ): Array<{ piece: Piece; position: DiamondPosition }> {
    const pieces: Array<{ piece: Piece; position: DiamondPosition }> = [];

    for (const [key, piece] of board) {
      if (piece.color === color) {
        const position = diamondCoords.keyToPosition(key);
        pieces.push({ piece, position });
      }
    }

    return pieces;
  }

  /**
   * Find king position for a specific color
   */
  findKing(board: BoardState, color: PieceColor): DiamondPosition | null {
    for (const [key, piece] of board) {
      if (piece.type === 'king' && piece.color === color) {
        return diamondCoords.keyToPosition(key);
      }
    }
    return null;
  }

  /**
   * Get piece at specific position
   */
  getPieceAt(board: BoardState, position: DiamondPosition): Piece | null {
    const key = diamondCoords.positionToKey(position);
    return board.get(key) || null;
  }

  /**
   * Move piece on board (without validation)
   */
  movePiece(
    board: BoardState,
    from: DiamondPosition,
    to: DiamondPosition
  ): { board: BoardState; capturedPiece?: Piece } {
    const newBoard = new Map(board);
    const fromKey = diamondCoords.positionToKey(from);
    const toKey = diamondCoords.positionToKey(to);

    const piece = newBoard.get(fromKey);
    if (!piece) {
      throw new Error('No piece at source position');
    }

    const capturedPiece = newBoard.get(toKey);

    // Move the piece
    newBoard.delete(fromKey);
    newBoard.set(toKey, piece);

    return { board: newBoard, capturedPiece };
  }

  /**
   * Create a copy of the board
   */
  cloneBoard(board: BoardState): BoardState {
    return new Map(board);
  }

  /**
   * Get board representation as string (for debugging)
   */
  boardToString(board: BoardState): string {
    const lines: string[] = [];

    // Get all valid positions and sort them for display
    const positions = diamondCoords.getAllValidPositions();
    const groupedByY = new Map<number, DiamondPosition[]>();

    for (const pos of positions) {
      if (!groupedByY.has(pos.y)) {
        groupedByY.set(pos.y, []);
      }
      groupedByY.get(pos.y)!.push(pos);
    }

    // Sort by Y coordinate (top to bottom)
    const sortedYs = Array.from(groupedByY.keys()).sort((a, b) => b - a);

    for (const y of sortedYs) {
      const rowPositions = groupedByY.get(y)!.sort((a, b) => a.x - b.x);
      const line = rowPositions
        .map(pos => {
          const piece = this.getPieceAt(board, pos);
          if (!piece) return '.';

          const symbol = this.pieceToSymbol(piece);
          return piece.color === 'WHITE'
            ? symbol.toUpperCase()
            : symbol.toLowerCase();
        })
        .join(' ');

      lines.push(`Y${y.toString().padStart(2)}: ${line}`);
    }

    return lines.join('\n');
  }

  /**
   * Convert piece to single character symbol
   */
  private pieceToSymbol(piece: Piece): string {
    const symbols = {
      king: 'k',
      queen: 'q',
      rook: 'r',
      bishop: 'b',
      knight: 'n',
      pawn: 'p',
    };
    return symbols[piece.type];
  }
}

// Export singleton instance
export const boardSetup = new BoardSetup();
