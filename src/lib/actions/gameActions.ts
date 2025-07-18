'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { boardSetup } from '@/lib/game/boardSetup';
import { diamondCoords } from '@/lib/game/coordinates';
import type {
  BoardState,
  Move,
  PieceColor,
  EnhancedGameState,
  CreateMatchResult,
  JoinMatchResult,
  MakeMoveResult,
  GameStateResult,
  UserMatchesResult,
  GetMatchResult,
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
      return testUser;
    } catch (error) {
      console.error('Error parsing test auth cookie:', error);
    }
  }

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
  // Parse board state
  const boardEntries = JSON.parse(game.board);
  const boardState: BoardState = new Map(boardEntries);

  return {
    id: game.id,
    gameNumber: game.gameNumber,
    status: game.status,
    currentTurn: game.currentTurn,
    boardState, // Return as Map for frontend
    moveHistory: JSON.parse(game.moveHistory),
    whitePlayerId: game.whitePlayerId,
    blackPlayerId: game.blackPlayerId,
    startedAt: game.startedAt,
    completedAt: game.completedAt,
    result: game.result,
    match: game.match,
    whitePlayer: game.whitePlayer, // User type automatically excludes PII
    blackPlayer: game.blackPlayer, // User type automatically excludes PII
  };
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
    const fromKey = diamondCoords.positionToKey(move.from);
    const toKey = diamondCoords.positionToKey(move.to);
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
      moveNotation: `${piece.type}${diamondCoords.positionToKey(move.from)}-${diamondCoords.positionToKey(move.to)}`,
    };
    moveHistory.push(enhancedMove);

    // Determine next turn
    const nextTurn: PieceColor =
      game.currentTurn === 'WHITE' ? 'BLACK' : 'WHITE';

    // Save updated game state
    const updatedGame = await prisma.game.update({
      where: { id: gameId },
      data: {
        board: JSON.stringify(Array.from(board.entries())),
        moveHistory: JSON.stringify(moveHistory),
        currentTurn: nextTurn,
      },
      include: {
        match: true,
        whitePlayer: true,
        blackPlayer: true,
      },
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
 * Get current game state with enhanced real-time caching
 */
export async function getGameState(gameId: string): Promise<GameStateResult> {
  try {
    const user = await getAuthenticatedUser();

    if (!user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        match: {
          include: {
            player1: true,
            player2: true,
          },
        },
        whitePlayer: true,
        blackPlayer: true,
      },
      cacheStrategy: {
        ttl: 3, // Cache for 3 seconds for faster updates
        swr: 8, // Serve stale for 8 seconds while revalidating
      },
    });

    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    // Check if user is part of this game
    const isPlayer =
      game.whitePlayerId === user.id || game.blackPlayerId === user.id;

    if (!isPlayer) {
      return { success: false, error: 'Access denied' };
    }

    const enhancedGameState = toEnhancedGameState(game);

    // Only log in development and when there might be meaningful changes
    if (process.env.NODE_ENV === 'development') {
      const moveCount = enhancedGameState.moveHistory.length;
      // Only log if it's a new game (0 moves) or if there are recent moves
      if (moveCount === 0 || moveCount > 0) {
        console.log(
          `🎮 Game state fetched: ${gameId.slice(-6)} | ${moveCount} moves | ${enhancedGameState.currentTurn}'s turn`
        );
      }
    }

    return { success: true, gameState: enhancedGameState };
  } catch (error) {
    console.error('Error getting game state:', error);
    return { success: false, error: 'Failed to get game state' };
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
