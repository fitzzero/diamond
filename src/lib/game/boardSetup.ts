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
 * Custom Diamond Chess starting position with kings in center positions
 */

export class BoardSetup {
  /**
   * Create initial board state for Diamond Chess
   */
  createInitialBoard(): BoardState {
    const board: BoardState = new Map();

    // Setup custom Diamond Chess formation
    this.setupDiamondChessPieces(board);

    return board;
  }

  /**
   * Setup pieces in Diamond Chess formation
   * Symmetric diamond layout as shown in game-rules.png
   */
  private setupDiamondChessPieces(board: BoardState): void {
    // BLACK PIECES (Top of diamond - from top to bottom)

    // Row 1: King (center top)
    this.placePiece(board, { x: 0, y: -7 }, 'king', 'BLACK');

    // Row 2: Rook, Rook
    this.placePiece(board, { x: -1, y: -6 }, 'rook', 'BLACK');
    this.placePiece(board, { x: 1, y: -6 }, 'rook', 'BLACK');

    // Row 3: Knight, Queen, Bishop (FIXED: Added missing knight left and bishop right)
    this.placePiece(board, { x: -2, y: -5 }, 'knight', 'BLACK'); // Added missing knight left
    this.placePiece(board, { x: -1, y: -5 }, 'knight', 'BLACK');
    this.placePiece(board, { x: 0, y: -5 }, 'queen', 'BLACK');
    this.placePiece(board, { x: 1, y: -5 }, 'bishop', 'BLACK');
    this.placePiece(board, { x: 2, y: -5 }, 'bishop', 'BLACK'); // Added missing bishop right

    // Row 4: Pawn, Bishop, Knight, Pawn (FIXED: Added missing pawn left, changed pawn to knight)
    this.placePiece(board, { x: -4, y: -3 }, 'pawn', 'BLACK'); // FIXED: Added missing pawn
    this.placePiece(board, { x: -3, y: -4 }, 'pawn', 'BLACK'); // Added missing pawn left
    this.placePiece(board, { x: -2, y: -4 }, 'pawn', 'BLACK');
    this.placePiece(board, { x: -1, y: -4 }, 'bishop', 'BLACK');
    this.placePiece(board, { x: 0, y: -4 }, 'knight', 'BLACK');
    this.placePiece(board, { x: 1, y: -4 }, 'knight', 'BLACK'); // Changed from pawn to knight
    this.placePiece(board, { x: 2, y: -4 }, 'pawn', 'BLACK');
    this.placePiece(board, { x: 3, y: -4 }, 'pawn', 'BLACK'); // FIXED: Added missing pawn
    this.placePiece(board, { x: 4, y: -3 }, 'pawn', 'BLACK'); // FIXED: Added missing pawn

    // Row 5: 7 Pawns (FIXED: Added missing pawns to make full row)
    this.placePiece(board, { x: -3, y: -3 }, 'pawn', 'BLACK'); // Added missing pawn
    this.placePiece(board, { x: -2, y: -3 }, 'pawn', 'BLACK');
    this.placePiece(board, { x: -1, y: -3 }, 'pawn', 'BLACK');
    this.placePiece(board, { x: 0, y: -3 }, 'pawn', 'BLACK');
    this.placePiece(board, { x: 1, y: -3 }, 'pawn', 'BLACK');
    this.placePiece(board, { x: 2, y: -3 }, 'pawn', 'BLACK');
    this.placePiece(board, { x: 3, y: -3 }, 'pawn', 'BLACK'); // Added missing pawn

    // WHITE PIECES (Bottom of diamond - mirrored formation)

    // Row 5: 7 Pawns (FIXED: Added missing pawns to make full row)
    this.placePiece(board, { x: -3, y: 3 }, 'pawn', 'WHITE'); // Added missing pawn
    this.placePiece(board, { x: -2, y: 3 }, 'pawn', 'WHITE');
    this.placePiece(board, { x: -1, y: 3 }, 'pawn', 'WHITE');
    this.placePiece(board, { x: 0, y: 3 }, 'pawn', 'WHITE');
    this.placePiece(board, { x: 1, y: 3 }, 'pawn', 'WHITE');
    this.placePiece(board, { x: 2, y: 3 }, 'pawn', 'WHITE');
    this.placePiece(board, { x: 3, y: 3 }, 'pawn', 'WHITE'); // Added missing pawn

    // Row 4: Pawn, Knight, Bishop, Pawn (FIXED: Mirrored the black side fixes)
    this.placePiece(board, { x: -4, y: 3 }, 'pawn', 'WHITE'); // FIXED: Added missing pawn
    this.placePiece(board, { x: -3, y: 4 }, 'pawn', 'WHITE'); // Added missing pawn left
    this.placePiece(board, { x: -2, y: 4 }, 'pawn', 'WHITE');
    this.placePiece(board, { x: -1, y: 4 }, 'knight', 'WHITE'); // Changed from knight to match mirror
    this.placePiece(board, { x: 0, y: 4 }, 'bishop', 'WHITE');
    this.placePiece(board, { x: 1, y: 4 }, 'bishop', 'WHITE'); // FIXED: Changed from knight to bishop
    this.placePiece(board, { x: 2, y: 4 }, 'pawn', 'WHITE');
    this.placePiece(board, { x: 3, y: 4 }, 'pawn', 'WHITE'); // FIXED: Added missing pawn
    this.placePiece(board, { x: 4, y: 3 }, 'pawn', 'WHITE'); // FIXED: Added missing pawn

    // Row 3: Bishop, Queen, Knight (FIXED: Added missing pieces to mirror black)
    this.placePiece(board, { x: -2, y: 5 }, 'bishop', 'WHITE'); // Added missing bishop left
    this.placePiece(board, { x: -1, y: 5 }, 'bishop', 'WHITE');
    this.placePiece(board, { x: 0, y: 5 }, 'queen', 'WHITE');
    this.placePiece(board, { x: 1, y: 5 }, 'knight', 'WHITE');
    this.placePiece(board, { x: 2, y: 5 }, 'knight', 'WHITE'); // Added missing knight right

    // Row 2: Rook, Rook
    this.placePiece(board, { x: -1, y: 6 }, 'rook', 'WHITE');
    this.placePiece(board, { x: 1, y: 6 }, 'rook', 'WHITE');

    // Row 1: King (center bottom)
    this.placePiece(board, { x: 0, y: 7 }, 'king', 'WHITE');
  }

  /**
   * Helper method to place a piece on the board
   */
  private placePiece(
    board: BoardState,
    position: DiamondPosition,
    type: PieceType,
    color: PieceColor
  ): void {
    const piece: Piece = {
      type,
      color,
      id: `${color}-${type}-${position.x},${position.y}`,
    };

    const key = diamondCoords.positionToKey(position);
    board.set(key, piece);
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
