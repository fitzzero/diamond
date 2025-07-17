'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { boardSetup } from '@/lib/game/boardSetup';
import { diamondCoords } from '@/lib/game/coordinates';
import type { Move, BoardState, PieceColor } from '@/types/game';

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
  gameState?: {
    board: string;
    currentTurn: PieceColor;
    status: string;
    moveHistory: string;
  };
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
 * Get current game state
 */
export async function getGameState(gameId: string) {
  try {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        match: {
          include: { player1: true, player2: true },
        },
      },
    });

    if (!game) {
      return null;
    }

    return {
      id: game.id,
      matchId: game.matchId,
      gameNumber: game.gameNumber,
      status: game.status,
      currentTurn: game.currentTurn as PieceColor,
      board: game.board,
      moveHistory: game.moveHistory,
      createdAt: game.createdAt,
      completedAt: game.completedAt,
      match: {
        id: game.match.id,
        status: game.match.status,
        player1: {
          id: game.match.player1.id,
          username: game.match.player1.username,
          image: game.match.player1.image,
        },
        player2: game.match.player2
          ? {
              id: game.match.player2.id,
              username: game.match.player2.username,
              image: game.match.player2.image,
            }
          : null,
      },
    };
  } catch (error) {
    console.error('Error getting game state:', error);
    return null;
  }
}

/**
 * Get all matches for the current user
 */
export async function getUserMatches() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return [];
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
          take: 1, // Get the most recent game
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const mappedMatches = matches.map((match: any) => ({
      id: match.id,
      status: match.status,
      createdAt: match.createdAt,
      updatedAt: match.updatedAt,
      player1: {
        id: match.player1.id,
        username: match.player1.username,
        image: match.player1.image,
      },
      player2: match.player2
        ? {
            id: match.player2.id,
            username: match.player2.username,
            image: match.player2.image,
          }
        : null,
      currentGame:
        match.games && match.games.length > 0
          ? {
              id: match.games[0].id,
              status: match.games[0].status,
              currentTurn: match.games[0].currentTurn,
            }
          : null,
    }));

    return mappedMatches;
  } catch (error) {
    console.error('Error getting user matches:', error);
    return [];
  }
}
