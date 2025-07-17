'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { boardSetup } from '@/lib/game/boardSetup';
import { diamondCoords } from '@/lib/game/coordinates';
import type {
  BoardState,
  Move,
  PieceColor,
  GameState,
  GameStatus,
} from '@/types/game';

// Result types for server actions
export interface CreateMatchResult {
  success: boolean;
  matchId?: string;
  error?: string;
}

export interface JoinMatchResult {
  success: boolean;
  gameId?: string;
  error?: string;
}

export interface MakeMoveResult {
  success: boolean;
  error?: string;
  gameState?: any;
}

export interface GameStateResult {
  success: boolean;
  gameState?: any; // Using any for now since our DB structure differs from GameState
  error?: string;
}

export interface UserMatchesResult {
  success: boolean;
  matches?: any[];
  error?: string;
}

/**
 * Create a new match for the authenticated user
 */
export async function createMatch(): Promise<CreateMatchResult> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    const match = await prisma.match.create({
      data: {
        player1Id: session.user.id,
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
 * Join an existing match and create the first game
 */
export async function joinMatch(matchId: string): Promise<JoinMatchResult> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    // Check if match exists and is available
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { player1: true, player2: true },
    });

    if (!match) {
      return { success: false, error: 'Match not found' };
    }

    if (match.status !== 'WAITING_FOR_PLAYER') {
      return { success: false, error: 'Match is not available to join' };
    }

    if (match.player1Id === session.user.id) {
      return { success: false, error: 'Cannot join your own match' };
    }

    if (match.player2Id) {
      return { success: false, error: 'Match is already full' };
    }

    // Create initial board state
    const initialBoard = boardSetup.createInitialBoard();
    const boardJson = JSON.stringify(Array.from(initialBoard.entries()));

    // Join match and create initial game
    const [updatedMatch, game] = await prisma.$transaction([
      prisma.match.update({
        where: { id: matchId },
        data: {
          player2Id: session.user.id,
          status: 'IN_PROGRESS',
        },
      }),
      prisma.game.create({
        data: {
          matchId,
          gameNumber: 1,
          status: 'IN_PROGRESS',
          currentTurn: 'WHITE',
          board: boardJson,
          moveHistory: '[]',
          whitePlayerId: match.player1Id, // Player 1 is white
          blackPlayerId: session.user.id, // Player 2 is black
        },
      }),
    ]);

    // Game created successfully - no need to update match again

    revalidatePath('/');
    revalidatePath(`/match/${matchId}`);

    return { success: true, gameId: game.id };
  } catch (error) {
    console.error('Error joining match:', error);
    return { success: false, error: 'Failed to join match' };
  }
}

/**
 * Make a move in the current game
 */
export async function makeMove(
  gameId: string,
  move: Move
): Promise<MakeMoveResult> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get current game state
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        match: {
          include: { player1: true, player2: true },
        },
      },
    });

    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    if (game.status !== 'IN_PROGRESS') {
      return { success: false, error: 'Game is not in progress' };
    }

    // Check if it's the player's turn
    const isWhitePlayer = game.whitePlayerId === session.user.id;
    const isBlackPlayer = game.blackPlayerId === session.user.id;

    if (!isWhitePlayer && !isBlackPlayer) {
      return { success: false, error: 'You are not a player in this game' };
    }

    const playerColor: PieceColor = isWhitePlayer ? 'WHITE' : 'BLACK';

    if (game.currentTurn !== playerColor) {
      return { success: false, error: 'Not your turn' };
    }

    // Parse current board state
    const boardEntries = JSON.parse(game.board) as Array<[string, any]>;
    const board: BoardState = new Map(boardEntries);

    // Basic move validation (simplified for now)
    const fromKey = diamondCoords.positionToKey(move.from);
    const toKey = diamondCoords.positionToKey(move.to);
    const piece = board.get(fromKey);

    if (!piece) {
      return { success: false, error: 'No piece at source position' };
    }

    if (piece.color !== playerColor) {
      return { success: false, error: 'Not your piece' };
    }

    // Execute move (basic implementation)
    board.delete(fromKey);
    board.set(toKey, piece);

    // Update move history
    const moveHistory = JSON.parse(game.moveHistory) as Move[];
    moveHistory.push(move);

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
    });

    revalidatePath(`/match/${game.matchId}`);
    revalidatePath(`/game/${gameId}`);

    return {
      success: true,
      gameState: {
        board: updatedGame.board,
        currentTurn: updatedGame.currentTurn as PieceColor,
        status: updatedGame.status,
        moveHistory: updatedGame.moveHistory,
      },
    };
  } catch (error) {
    console.error('Error making move:', error);
    return { success: false, error: 'Failed to make move' };
  }
}

/**
 * Get current game state with all related data
 */
export async function getGameState(gameId: string): Promise<GameStateResult> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
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
        ttl: 5, // Cache for 5 seconds
        swr: 10, // Serve stale for 10 seconds while revalidating
      },
    });

    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    // Check if user is part of this game
    const isPlayer =
      game.whitePlayerId === session.user.id ||
      game.blackPlayerId === session.user.id;

    if (!isPlayer) {
      return { success: false, error: 'Access denied' };
    }

    // Parse board state
    const boardEntries = JSON.parse(game.board);
    const board: BoardState = new Map(boardEntries);

    const gameData = {
      id: game.id,
      gameNumber: game.gameNumber,
      status: game.status,
      currentTurn: game.currentTurn as PieceColor,
      board: JSON.stringify(Array.from(board.entries())), // Keep as string for API
      moveHistory: JSON.parse(game.moveHistory),
      whitePlayerId: game.whitePlayerId,
      blackPlayerId: game.blackPlayerId,
      startedAt: game.startedAt,
      completedAt: game.completedAt,
      result: game.result,
      match: game.match,
      whitePlayer: game.whitePlayer,
      blackPlayer: game.blackPlayer,
    };

    return { success: true, gameState: gameData };
  } catch (error) {
    console.error('Error getting game state:', error);
    return { success: false, error: 'Failed to get game state' };
  }
}

/**
 * Get user's matches with recent activity
 */
export async function getUserMatches(): Promise<UserMatchesResult> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    const matches = await prisma.match.findMany({
      where: {
        OR: [{ player1Id: session.user.id }, { player2Id: session.user.id }],
      },
      include: {
        player1: true,
        player2: true,
        games: {
          orderBy: { gameNumber: 'desc' },
          take: 1, // Get most recent game
        },
      },
      orderBy: { updatedAt: 'desc' },
      cacheStrategy: {
        ttl: 10, // Cache user matches for 10 seconds
        swr: 30, // Serve stale for 30 seconds
      },
    });

    return { success: true, matches };
  } catch (error) {
    console.error('Error getting user matches:', error);
    return { success: false, error: 'Failed to get matches' };
  }
}
