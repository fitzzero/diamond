// Core game types for Diamond Chess

export type PieceColor = 'WHITE' | 'BLACK';
export type PieceType =
  | 'king'
  | 'queen'
  | 'rook'
  | 'bishop'
  | 'knight'
  | 'pawn';

export interface Piece {
  type: PieceType;
  color: PieceColor;
  id: string; // Unique identifier for each piece
}

// Standard chess position (0-7, 0-7)
export interface StandardPosition {
  file: number; // 0-7 (a-h)
  rank: number; // 0-7 (1-8)
}

// Diamond position - rotated 45 degrees
export interface DiamondPosition {
  x: number; // Diamond x-coordinate (-7 to 7)
  y: number; // Diamond y-coordinate (-7 to 7)
}

// Move representation
export interface Move {
  from: DiamondPosition;
  to: DiamondPosition;
  piece: Piece;
  capturedPiece?: Piece;
  isCheck?: boolean;
  isCheckmate?: boolean;
  isStalemate?: boolean;
  moveNotation?: string; // Algebraic notation
}

// Board state - using diamond coordinates
export type BoardState = Map<string, Piece>; // key: "x,y", value: Piece

// Game status
export type GameStatus =
  | 'setup'
  | 'active'
  | 'check'
  | 'checkmate'
  | 'stalemate'
  | 'draw'
  | 'abandoned';

// Complete game state
export interface GameState {
  id: string;
  board: BoardState;
  currentTurn: PieceColor;
  status: GameStatus;
  moves: Move[];
  check?: {
    color: PieceColor;
    kingPosition: DiamondPosition;
  };
}

// Match information
export interface MatchInfo {
  id: string;
  whitePlayerId: string;
  blackPlayerId: string;
  currentGameId?: string;
  status: 'waiting' | 'active' | 'completed';
  createdAt: Date;
}

// Coordinate conversion utilities type
export interface CoordinateConverter {
  standardToDiamond: (pos: StandardPosition) => DiamondPosition;
  diamondToStandard: (pos: DiamondPosition) => StandardPosition | null;
  isValidDiamondPosition: (pos: DiamondPosition) => boolean;
  positionToKey: (pos: DiamondPosition) => string;
  keyToPosition: (key: string) => DiamondPosition;
}
