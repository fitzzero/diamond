'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { boardSetup } from '@/lib/game/boardSetup';
import { chessCoords } from '@/lib/game/coordinates';
import { moveValidator } from '@/lib/game/moveValidation';
import type {
  BoardState,
  Move,
  PieceColor,
  GameState,
  EnhancedGameState,
  CreateMatchResult,
  JoinMatchResult,
  MakeMoveResult,
  UserMatchesResult,
  GetMatchResult,
  MatchSessionResult, // Add the new type
  MatchWithPlayers,
  GameWithDetails,
  TurnValidationResult,
} from '@/types/game';

// Helper function to get authenticated user (supports both NextAuth and test auth)
async function getAuthenticatedUser() {
  // Try NextAuth first
  const session = await auth();
  if (session?.user?.id) {
    return session.user;
  }

  // Fall back to test authentication
  const cookieStore = await cookies();
  const testAuthCookie = cookieStore.get('test-auth-user');

  if (testAuthCookie) {
    try {
      const testUser = JSON.parse(testAuthCookie.value);
      console.log('🧪 Auth via test cookie - User ID:', testUser.id);
      return testUser;
    } catch (error) {
      console.error('Error parsing test auth cookie:', error);
    }
  }

  console.log('❌ No authentication found');
  return null;
}

// Helper function to validate player's turn
function validatePlayerTurn(game: any, userId: string): TurnValidationResult {
  const isWhitePlayer = game.whitePlayerId === userId;
  const isBlackPlayer = game.blackPlayerId === userId;

  if (!isWhitePlayer && !isBlackPlayer) {
    return {
      isPlayerTurn: false,
      currentTurn: game.currentTurn,
      playerColor: 'WHITE', // default
      error: 'You are not a player in this game',
    };
  }

  const playerColor: PieceColor = isWhitePlayer ? 'WHITE' : 'BLACK';
  const isPlayerTurn = game.currentTurn === playerColor;

  return {
    isPlayerTurn,
    currentTurn: game.currentTurn,
    playerColor,
    error: isPlayerTurn ? undefined : 'Not your turn',
  };
}

// Helper function to convert game data to EnhancedGameState
function toEnhancedGameState(game: any): EnhancedGameState {
  try {
    // Parse board state - handle multiple possible formats
    let boardEntries: Array<[string, any]> = [];

    if (game.board) {
      if (typeof game.board === 'string') {
        // Case 1: JSON string
        const parsed = JSON.parse(game.board);
        if (Array.isArray(parsed)) {
          boardEntries = parsed;
        } else if (parsed && parsed.pieces && Array.isArray(parsed.pieces)) {
          // Case 2: Object with pieces array (legacy format)
          boardEntries = parsed.pieces;
        }
      } else if (Array.isArray(game.board)) {
        // Case 3: Direct array
        boardEntries = game.board;
      } else if (
        game.board &&
        game.board.pieces &&
        Array.isArray(game.board.pieces)
      ) {
        // Case 4: Object with pieces array
        boardEntries = game.board.pieces;
      } else if (typeof game.board === 'object') {
        // Case 5: Try to convert object to entries
        boardEntries = Object.entries(game.board).filter(
          ([key, value]) =>
            typeof key === 'string' && value && typeof value === 'object'
        );
      }
    }

    const boardState: BoardState = new Map(boardEntries);

    // Parse move history - handle multiple possible formats
    let moveHistory: any[] = [];

    if (game.moveHistory) {
      if (typeof game.moveHistory === 'string') {
        try {
          moveHistory = JSON.parse(game.moveHistory);
        } catch (e) {
          console.warn('Failed to parse moveHistory as JSON:', e);
          moveHistory = [];
        }
      } else if (Array.isArray(game.moveHistory)) {
        moveHistory = game.moveHistory;
      }
    }

    // Ensure moveHistory is always an array
    if (!Array.isArray(moveHistory)) {
      moveHistory = [];
    }

    return {
      id: game.id,
      gameNumber: game.gameNumber,
      status: game.status,
      currentTurn: game.currentTurn,
      boardState, // Return as Map for frontend
      moveHistory,
      whitePlayerId: game.whitePlayerId,
      blackPlayerId: game.blackPlayerId,
      startedAt: game.startedAt,
      completedAt: game.completedAt,
      result: game.result,
      match: game.match,
      whitePlayer: game.whitePlayer, // User type automatically excludes PII
      blackPlayer: game.blackPlayer, // User type automatically excludes PII
    };
  } catch (error) {
    console.error('🚨 Error in toEnhancedGameState:', error);
    console.error('🔍 Game data:', JSON.stringify(game, null, 2));

    // Return a safe fallback state
    return {
      id: game.id || 'unknown',
      gameNumber: game.gameNumber || 1,
      status: game.status || 'IN_PROGRESS',
      currentTurn: game.currentTurn || 'WHITE',
      boardState: new Map(), // Empty board as fallback
      moveHistory: [],
      whitePlayerId: game.whitePlayerId || '',
      blackPlayerId: game.blackPlayerId || '',
      startedAt: game.startedAt || new Date(),
      completedAt: game.completedAt || null,
      result: game.result || null,
      match: game.match || {},
      whitePlayer: game.whitePlayer || {},
      blackPlayer: game.blackPlayer || {},
    };
  }
}

/**
 * Create a new match for the authenticated user
 */
export async function createMatch(): Promise<CreateMatchResult> {
  try {
    const user = await getAuthenticatedUser();

    if (!user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    const match = await prisma.match.create({
      data: {
        player1Id: user.id,
        status: 'WAITING_FOR_PLAYER',
      },
    });

    revalidatePath('/');
    return { success: true, matchId: match.id };
  } catch (error) {
    console.error('Error creating match:', error);
    return { success: false, error: 'Failed to create match' };
  }
}

/**
 * Join an existing match and create the first game with enhanced real-time support
 */
export async function joinMatch(matchId: string): Promise<JoinMatchResult> {
  try {
    const user = await getAuthenticatedUser();

    if (!user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    // Check if match exists and is available
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        player1: true,
        player2: true,
        games: {
          orderBy: { gameNumber: 'desc' },
          take: 1,
        },
      },
    });

    if (!match) {
      return { success: false, error: 'Match not found' };
    }

    if (match.status !== 'WAITING_FOR_PLAYER') {
      return { success: false, error: 'Match is not available to join' };
    }

    if (match.player1Id === user.id) {
      return { success: false, error: 'Cannot join your own match' };
    }

    if (match.player2Id) {
      return { success: false, error: 'Match is already full' };
    }

    // Create initial board state
    const initialBoard = boardSetup.createInitialBoard();
    const boardJson = JSON.stringify(Array.from(initialBoard.entries()));

    // Join match and create initial game in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Update match status and add player 2
      const updatedMatch = await tx.match.update({
        where: { id: matchId },
        data: {
          player2Id: user.id,
          status: 'IN_PROGRESS',
        },
        include: {
          player1: true,
          player2: true,
        },
      });

      // Create initial game
      const game = await tx.game.create({
        data: {
          matchId,
          gameNumber: 1,
          status: 'IN_PROGRESS',
          currentTurn: 'WHITE',
          board: boardJson,
          moveHistory: '[]',
          whitePlayerId: match.player1Id, // Player 1 is white
          blackPlayerId: user.id, // Player 2 is black
        },
        include: {
          match: true,
          whitePlayer: true,
          blackPlayer: true,
        },
      });

      return { updatedMatch, game };
    });

    // Create enhanced match with players and games (User types automatically exclude PII)
    const enhancedMatch: MatchWithPlayers = {
      ...result.updatedMatch,
      player1: result.updatedMatch.player1!,
      player2: result.updatedMatch.player2!,
      games: [result.game as GameWithDetails],
    };

    // Revalidate pages for real-time updates
    revalidatePath('/');
    revalidatePath(`/match/${matchId}`);

    return {
      success: true,
      gameId: result.game.id,
      match: enhancedMatch,
    };
  } catch (error) {
    console.error('Error joining match:', error);
    return { success: false, error: 'Failed to join match' };
  }
}

/**
 * Make a move in the current game with enhanced validation
 */
export async function makeMove(
  gameId: string,
  move: Move
): Promise<MakeMoveResult> {
  try {
    const user = await getAuthenticatedUser();

    if (!user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get current game state with all related data
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        match: {
          include: { player1: true, player2: true },
        },
        whitePlayer: true,
        blackPlayer: true,
      },
    });

    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    if (game.status !== 'IN_PROGRESS') {
      return { success: false, error: 'Game is not in progress' };
    }

    // Validate player's turn
    const turnValidation = validatePlayerTurn(game, user.id);
    if (!turnValidation.isPlayerTurn) {
      return { success: false, error: turnValidation.error };
    }

    // Parse current board state
    const boardEntries = JSON.parse(game.board) as Array<[string, any]>;
    const board: BoardState = new Map(boardEntries);

    // Basic move validation
    const fromKey = chessCoords.positionToKey(move.from);
    const toKey = chessCoords.positionToKey(move.to);
    const piece = board.get(fromKey);

    if (!piece) {
      return { success: false, error: 'No piece at source position' };
    }

    if (piece.color !== turnValidation.playerColor) {
      return { success: false, error: 'Not your piece' };
    }

    // Execute move
    board.delete(fromKey);
    board.set(toKey, piece);

    // Update move history
    const moveHistory = JSON.parse(game.moveHistory) as Move[];
    const enhancedMove = {
      ...move,
      piece,
      moveNotation: `${piece.type}${chessCoords.positionToKey(move.from)}-${chessCoords.positionToKey(move.to)}`,
    };
    moveHistory.push(enhancedMove);

    // Determine next turn
    const nextTurn: PieceColor =
      game.currentTurn === 'WHITE' ? 'BLACK' : 'WHITE';

    // Check for endgame conditions (checkmate, stalemate)
    const gameState: GameState = {
      id: game.id,
      board,
      currentTurn: nextTurn,
      status: 'active' as const,
      moves: moveHistory,
    };

    let gameStatus = 'IN_PROGRESS';
    let gameResult = null;
    let matchWinnerId = null;
    let completedAt = null;

    // Check for checkmate
    if (moveValidator.isCheckmate(gameState)) {
      gameStatus = 'CHECKMATE';
      completedAt = new Date();

      // The player who just moved wins (current turn is the player who got checkmated)
      if (nextTurn === 'WHITE') {
        // Black wins (white is checkmated)
        gameResult = 'BLACK_WINS';
        matchWinnerId = game.blackPlayerId;
      } else {
        // White wins (black is checkmated)
        gameResult = 'WHITE_WINS';
        matchWinnerId = game.whitePlayerId;
      }

      console.log(
        `🏆 Checkmate! ${gameResult === 'WHITE_WINS' ? 'White' : 'Black'} wins!`
      );
    }
    // Check for stalemate
    else if (moveValidator.isStalemate(gameState)) {
      gameStatus = 'STALEMATE';
      gameResult = 'DRAW';
      completedAt = new Date();

      console.log(`🤝 Stalemate! Game ends in a draw.`);
    }

    // Prepare update data
    const gameUpdateData: any = {
      board: JSON.stringify(Array.from(board.entries())),
      moveHistory: JSON.stringify(moveHistory),
      currentTurn: nextTurn,
      status: gameStatus,
    };

    if (gameResult) {
      gameUpdateData.result = gameResult;
    }

    if (completedAt) {
      gameUpdateData.completedAt = completedAt;
    }

    // Update game and potentially match in a transaction
    const updatedGame = await prisma.$transaction(async (tx: any) => {
      // Update the game
      const game = await tx.game.update({
        where: { id: gameId },
        data: gameUpdateData,
        include: {
          match: true,
          whitePlayer: true,
          blackPlayer: true,
        },
      });

      // If there's a winner, update the match
      if (matchWinnerId) {
        await tx.match.update({
          where: { id: game.matchId },
          data: {
            status: 'COMPLETED',
            winnerId: matchWinnerId,
          },
        });
      }

      return game;
    });

    // Revalidate for real-time updates
    revalidatePath(`/match/${game.matchId}`);
    revalidatePath(`/game/${gameId}`);

    const enhancedGameState = toEnhancedGameState(updatedGame);

    return {
      success: true,
      gameState: enhancedGameState,
    };
  } catch (error) {
    console.error('Error making move:', error);
    return { success: false, error: 'Failed to make move' };
  }
}

/**
 * Get user's matches with enhanced real-time support
 */
export async function getUserMatches(): Promise<UserMatchesResult> {
  try {
    const user = await getAuthenticatedUser();

    if (!user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    const matches = await prisma.match.findMany({
      where: {
        OR: [{ player1Id: user.id }, { player2Id: user.id }],
      },
      include: {
        player1: true,
        player2: true,
        games: {
          orderBy: { gameNumber: 'desc' },
          take: 1, // Get most recent game
          include: {
            whitePlayer: true,
            blackPlayer: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      cacheStrategy: {
        ttl: 5, // Cache user matches for 5 seconds
        swr: 15, // Serve stale for 15 seconds
      },
    });

    // Transform matches to MatchWithPlayers (User types automatically exclude PII)
    const enhancedMatches: MatchWithPlayers[] = matches.map((match: any) => ({
      ...match,
      player1: match.player1,
      player2: match.player2,
      games: match.games.map((game: any) => game as GameWithDetails),
    }));

    return { success: true, matches: enhancedMatches };
  } catch (error) {
    console.error('Error getting user matches:', error);
    return { success: false, error: 'Failed to get matches' };
  }
}

/**
 * Get a specific match by ID with enhanced real-time support
 */
export async function getMatch(matchId: string): Promise<GetMatchResult> {
  try {
    const user = await getAuthenticatedUser();

    if (!user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        player1: true,
        player2: true,
        games: {
          orderBy: { gameNumber: 'desc' },
          take: 1, // Get most recent game
          include: {
            whitePlayer: true,
            blackPlayer: true,
          },
        },
      },
      cacheStrategy: {
        ttl: 3, // Cache match data for 3 seconds for faster updates
        swr: 10, // Serve stale for 10 seconds
      },
    });

    if (!match) {
      return { success: false, error: 'Match not found' };
    }

    // Transform to MatchWithPlayers (User types automatically exclude PII)
    const enhancedMatch: MatchWithPlayers = {
      ...match,
      player1: match.player1,
      player2: match.player2,
      games: match.games.map((game: any) => game as GameWithDetails),
    };

    // Only log meaningful match state changes in development
    if (process.env.NODE_ENV === 'development') {
      const hasGame = enhancedMatch.games.length > 0;
      console.log(
        `🎲 Match state: ${matchId.slice(-6)} | ${enhancedMatch.status} | ${hasGame ? 'Game active' : 'No game'}`
      );
    }

    return { success: true, match: enhancedMatch };
  } catch (error) {
    console.error('Error getting match:', error);
    return { success: false, error: 'Failed to get match' };
  }
}

/**
 * Get complete match session data (match + current game state) for unified polling
 */
export async function getMatchSession(
  matchId: string
): Promise<MatchSessionResult> {
  try {
    const user = await getAuthenticatedUser();

    if (!user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        player1: true,
        player2: true,
        games: {
          orderBy: { gameNumber: 'desc' },
          take: 1, // Get most recent game
          include: {
            match: true,
            whitePlayer: true,
            blackPlayer: true,
          },
        },
      },
      cacheStrategy: {
        ttl: 1, // Cache for 1 second for fastest updates (reduced from 2)
        swr: 2, // Serve stale for 2 seconds (reduced from 6)
      },
    });

    if (!match) {
      return { success: false, error: 'Match not found' };
    }

    // Transform to MatchWithPlayers
    const enhancedMatch: MatchWithPlayers = {
      ...match,
      player1: match.player1,
      player2: match.player2,
      games: match.games.map((game: any) => game as GameWithDetails),
    };

    // Get current game state if there's an active game
    let gameState: EnhancedGameState | undefined = undefined;
    if (match.games.length > 0) {
      const currentGame = match.games[0];

      // Check if user is part of this game
      const isPlayer =
        currentGame.whitePlayerId === user.id ||
        currentGame.blackPlayerId === user.id;

      if (isPlayer) {
        gameState = toEnhancedGameState(currentGame);
      }
    }

    // Development logging for meaningful state changes
    if (process.env.NODE_ENV === 'development') {
      const hasGame = !!gameState;
      const moveCount = gameState?.moveHistory.length || 0;
      console.log(
        `🎮 Match session: ${matchId.slice(-6)} | ${enhancedMatch.status} | ${hasGame ? `Game: ${moveCount} moves, ${gameState?.currentTurn}'s turn` : 'No game'}`
      );
    }

    return {
      success: true,
      match: enhancedMatch,
      game: gameState,
    };
  } catch (error) {
    console.error('Error getting match session:', error);
    return { success: false, error: 'Failed to get match session' };
  }
}
