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

// Standard chess position (0-7, 0-7) - This is now our primary coordinate system
export interface ChessPosition {
  file: number; // 0-7 (a-h) - left to right
  rank: number; // 0-7 (1-8) - bottom to top
}

// Diamond display position - only used for UI rendering
export interface DiamondDisplayPosition {
  x: number; // Diamond x-coordinate for visual display
  y: number; // Diamond y-coordinate for visual display
}

// Legacy diamond position - keeping for compatibility during transition
export interface DiamondPosition {
  x: number;
  y: number;
}

// Move representation using standard chess coordinates
export interface Move {
  from: ChessPosition;
  to: ChessPosition;
  piece: Piece;
  capturedPiece?: Piece;
  isCheck?: boolean;
  isCheckmate?: boolean;
  isStalemate?: boolean;
  moveNotation?: string; // Algebraic notation
}

// Board state - using standard chess coordinates
export type BoardState = Map<string, Piece>; // key: "file,rank", value: Piece

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
    kingPosition: ChessPosition;
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
  // Convert standard chess position to diamond display position for UI
  chessToDisplayDiamond: (pos: ChessPosition) => DiamondDisplayPosition;
  // Convert diamond display position back to chess position
  displayDiamondToChess: (pos: DiamondDisplayPosition) => ChessPosition | null;
  // Check if chess position is valid (0-7, 0-7)
  isValidChessPosition: (pos: ChessPosition) => boolean;
  // Convert position to storage key
  positionToKey: (pos: ChessPosition) => string;
  // Convert storage key to position
  keyToPosition: (key: string) => ChessPosition;

  // Legacy diamond support (for migration)
  legacyDiamondToChess: (pos: DiamondPosition) => ChessPosition | null;
  chessToLegacyDiamond: (pos: ChessPosition) => DiamondPosition;
}

// === FIRESTORE-ALIGNED TYPES FOR SERVER ACTIONS ===

// Define types for Firestore compatibility
export type PrismaMatchStatus =
  | 'WAITING_FOR_PLAYER'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';
export type PrismaGameStatus =
  | 'IN_PROGRESS'
  | 'CHECKMATE'
  | 'STALEMATE'
  | 'DRAW'
  | 'RESIGNATION'
  | 'TIMEOUT';
export type PrismaPieceColor = 'WHITE' | 'BLACK';
export type PrismaGameResult = 'WHITE_WINS' | 'BLACK_WINS' | 'DRAW';

// User type (PII-omitted for Firestore)
export interface User {
  id: string;
  name: string | null;
  email: string | null; // Always null due to PII omission
  emailVerified: Date | null; // Always null due to PII omission
  image: string | null;
  discordId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Base Match type
export interface PrismaMatch {
  id: string;
  status: PrismaMatchStatus;
  player1Id: string;
  player2Id: string | null;
  winnerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Base Game type
export interface PrismaGame {
  id: string;
  matchId: string;
  gameNumber: number;
  status: PrismaGameStatus;
  currentTurn: PrismaPieceColor;
  board: string; // JSON string of board state
  moveHistory: string; // JSON string of move history
  whitePlayerId: string;
  blackPlayerId: string;
  startedAt: Date;
  completedAt: Date | null;
  result: PrismaGameResult | null;
}

// Enhanced Match type with related data
export interface MatchWithPlayers extends PrismaMatch {
  player1: User;
  player2: User | null;
  games: GameWithDetails[];
}

// Enhanced Game type with related data
export interface GameWithDetails extends PrismaGame {
  match: PrismaMatch;
  whitePlayer: User;
  blackPlayer: User;
}

// Enhanced Game State for client consumption
export interface EnhancedGameState {
  id: string;
  gameNumber: number;
  status: PrismaGameStatus;
  currentTurn: PrismaPieceColor;
  boardState: BoardState; // Parsed from JSON - now uses standard chess coordinates
  moveHistory: Move[]; // Parsed from JSON - now uses standard chess coordinates
  whitePlayerId: string;
  blackPlayerId: string;
  startedAt: Date;
  completedAt: Date | null;
  result: PrismaGameResult | null;
  match: PrismaMatch;
  whitePlayer: User;
  blackPlayer: User;
}

// === SERVER ACTION RESULT TYPES ===

export interface CreateMatchResult {
  success: boolean;
  matchId?: string;
  error?: string;
}

export interface JoinMatchResult {
  success: boolean;
  gameId?: string;
  match?: MatchWithPlayers;
  error?: string;
}

export interface MakeMoveResult {
  success: boolean;
  gameState?: EnhancedGameState;
  error?: string;
}

export interface UserMatchesResult {
  success: boolean;
  matches?: MatchWithPlayers[];
  error?: string;
}

export interface GetMatchResult {
  success: boolean;
  match?: MatchWithPlayers;
  error?: string;
}

// Unified match session result for single polling source
export interface MatchSessionResult {
  success: boolean;
  match?: MatchWithPlayers;
  game?: EnhancedGameState;
  error?: string;
}

// === REAL-TIME TYPES ===

export interface RealtimeSubscription {
  gameId: string;
  userId: string;
  lastUpdateTime: number;
}

export interface GameUpdateEvent {
  type: 'move' | 'join' | 'status_change' | 'turn_change';
  gameId: string;
  data: Partial<EnhancedGameState>;
  timestamp: number;
}

export interface MatchUpdateEvent {
  type: 'player_joined' | 'game_started' | 'status_change';
  matchId: string;
  data: Partial<MatchWithPlayers>;
  timestamp: number;
}

// === CONNECTION STATUS TYPES ===

export type ConnectionStatus =
  | 'connected'
  | 'disconnected'
  | 'reconnecting'
  | 'polling';

export interface RealtimeStatus {
  connectionStatus: ConnectionStatus;
  lastUpdate: number;
  updateInterval: number;
  isRealtime: boolean;
}

// === HOOK CONFIGURATION TYPES ===

export interface UseMatchOptions {
  realtime?: boolean;
  pollInterval?: number;
  includeInactiveGames?: boolean;
}

// === MOVE VALIDATION TYPES ===

export interface MoveValidationResult {
  isValid: boolean;
  error?: string;
  validMoves?: ChessPosition[];
  wouldCauseCheck?: boolean;
  wouldEndGame?: boolean;
}

export interface TurnValidationResult {
  isPlayerTurn: boolean;
  currentTurn: PrismaPieceColor;
  playerColor: PrismaPieceColor;
  error?: string;
}
