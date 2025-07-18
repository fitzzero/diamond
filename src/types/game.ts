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

// === PRISMA-ALIGNED TYPES FOR SERVER ACTIONS ===

import type {
  User,
  Match as PrismaMatch,
  Game as PrismaGame,
  MatchStatus as PrismaMatchStatus,
  GameStatus as PrismaGameStatus,
  PieceColor as PrismaPieceColor,
  GameResult as PrismaGameResult,
} from '@/generated/prisma';

// Enhanced Match type with related data (User type automatically excludes PII via Prisma omit)
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
  boardState: BoardState; // Parsed from JSON
  moveHistory: Move[]; // Parsed from JSON
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

export interface GameStateResult {
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

export interface UseGameOptions {
  realtime?: boolean;
  pollInterval?: number;
  enableOptimisticUpdates?: boolean;
}

export interface UseMatchOptions {
  realtime?: boolean;
  pollInterval?: number;
  includeInactiveGames?: boolean;
}

// === MOVE VALIDATION TYPES ===

export interface MoveValidationResult {
  isValid: boolean;
  error?: string;
  validMoves?: DiamondPosition[];
  wouldCauseCheck?: boolean;
  wouldEndGame?: boolean;
}

export interface TurnValidationResult {
  isPlayerTurn: boolean;
  currentTurn: PrismaPieceColor;
  playerColor: PrismaPieceColor;
  error?: string;
}
