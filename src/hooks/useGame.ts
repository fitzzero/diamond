'use client';

import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { useAuth } from '@/hooks/useAuth';
import {
  makeMove,
  getUserMatches,
  createMatch,
  joinMatch,
  getMatchSession, // Add the new unified endpoint
} from '@/lib/actions/gameActions';
import type {
  Move,
  PieceColor,
  UseMatchOptions,
  ConnectionStatus,
  RealtimeStatus,
  EnhancedGameState,
  MatchWithPlayers,
  UserMatchesResult,
  MatchSessionResult, // Add the new type
  BoardState,
} from '@/types/game';
import { useState } from 'react';

// Enhanced SWR fetcher functions with better error handling
const userMatchesFetcher = async (): Promise<UserMatchesResult> => {
  try {
    return await getUserMatches();
  } catch (error) {
    console.error('User matches fetch error:', error);
    throw error;
  }
};

// New unified fetcher for match sessions
const matchSessionFetcher = async (
  matchId: string
): Promise<MatchSessionResult> => {
  try {
    return await getMatchSession(matchId);
  } catch (error) {
    console.error('Match session fetch error:', error);
    throw error;
  }
};

/**
 * User matches hook - temporarily disabled to prevent cache conflicts
 *
 * TODO: Re-implement with proper cache key isolation when needed
 * Strategy for re-enabling:
 * 1. Use different cache keys (e.g., 'user-matches-list' vs 'match-session')
 * 2. Implement conditional polling (disable when on match pages)
 * 3. Use different Prisma cache strategies for different endpoints
 * 4. Consider using React Query with proper cache boundaries
 */
export function useUserMatches(options: UseMatchOptions = {}) {
  return {
    matches: [],
    isLoading: false,
    error: null,
    refresh: () => Promise.resolve(),
    mutate: () => Promise.resolve(),
  };
}

/**
 * Current user hook - temporarily disabled to prevent cache conflicts
 *
 * Use useAuth() hook directly for authentication instead.
 * This hook is not critical since useAuth() provides the same functionality
 * without SWR caching complexity.
 */
export function useCurrentUser() {
  return {
    user: null,
    isLoading: false,
    error: null,
    refresh: () => Promise.resolve(),
    mutate: () => Promise.resolve(),
  };
}

/**
 * Unified hook for managing complete match sessions with single polling source
 */
export function useMatchSession(matchId: string | null) {
  const { user } = useAuth();
  const [isMakingMove, setIsMakingMove] = useState(false);

  const { data, error, isLoading, mutate } = useSWR(
    user && matchId ? ['match-session', matchId] : null,
    ([, id]) => matchSessionFetcher(id),
    {
      refreshInterval: !isMakingMove ? 2000 : 0, // 2 second polling, pause during moves
      revalidateOnFocus: !isMakingMove,
      revalidateOnReconnect: true,
      revalidateOnMount: true,
      revalidateIfStale: !isMakingMove,
      dedupingInterval: 1000, // Fast deduping for real-time feel
      errorRetryInterval: 3000,
      errorRetryCount: 3,
    }
  );

  // Extract match and game from unified response
  const match = data?.success ? data.match : null;
  const game = data?.success ? data.game : null;
  const sessionError = error || (data && !data.success ? data.error : null);

  // Enhanced make move with optimistic updates
  const makeGameMove = async (move: Move) => {
    if (!game?.id) throw new Error('No game available');

    setIsMakingMove(true); // Pause polling

    // Store original data for potential revert
    const originalData = data;

    // Optimistic update
    if (data?.success && game) {
      const newBoardState = new Map(game.boardState);
      const fromKey = `${move.from.x},${move.from.y}`;
      const toKey = `${move.to.x},${move.to.y}`;
      const piece = newBoardState.get(fromKey);

      if (piece) {
        // Move piece optimistically
        newBoardState.delete(fromKey);
        newBoardState.set(toKey, piece);

        const optimisticMove = {
          ...move,
          piece,
          moveNotation: `${piece.type}${fromKey}-${toKey}`,
        };

        const optimisticGame: EnhancedGameState = {
          ...game,
          boardState: newBoardState,
          moveHistory: [...game.moveHistory, optimisticMove],
          currentTurn: game.currentTurn === 'WHITE' ? 'BLACK' : 'WHITE',
        };

        // Apply optimistic update - don't revalidate to prevent overwriting
        mutate(
          {
            success: true,
            match: data.match,
            game: optimisticGame,
          },
          { revalidate: false, populateCache: true }
        );
      }
    }

    try {
      const result = await makeMove(game.id, move);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Update with actual server response
      mutate(
        {
          success: true,
          match: data?.match,
          game: result.gameState,
        },
        { revalidate: false, populateCache: true }
      );

      // Re-enable polling after a delay to let Prisma Accelerate cache expire
      setTimeout(() => {
        setIsMakingMove(false);
      }, 1500); // 1.5 second delay to let Prisma Accelerate cache expire

      return result.gameState;
    } catch (error) {
      // Revert to original state on error
      if (originalData?.success) {
        mutate(originalData, { revalidate: false, populateCache: true });
      }
      setTimeout(() => {
        setIsMakingMove(false);
      }, 500);
      throw error;
    }
  };

  // Enhanced join match
  const joinMatchWithOptimisticUpdates = async () => {
    if (!matchId) throw new Error('No match ID');

    try {
      const result = await joinMatch(matchId);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Optimistically update with join result
      if (result.match) {
        const optimisticData = {
          success: true,
          match: result.match,
          game: result.match.games?.[0]
            ? ({
                ...result.match.games[0],
                boardState: new Map(),
                moveHistory: [],
              } as EnhancedGameState)
            : undefined,
        };

        mutate(optimisticData, { revalidate: false, populateCache: true });

        // Refresh after join to get proper game state
        setTimeout(() => {
          mutate();
        }, 1000);
      }

      return result;
    } catch (error) {
      throw error;
    }
  };

  // Game starting detection
  const isGameStarting = match?.status === 'IN_PROGRESS' && !game && !isLoading;

  return {
    // Match data
    match,
    isMatchLoading: isLoading,
    matchError: sessionError,

    // Game data
    game,
    isGameLoading: isLoading && !game,
    gameError: sessionError,

    // Actions
    joinMatch: joinMatchWithOptimisticUpdates,
    makeMove: makeGameMove,

    // Utilities
    refresh: mutate,
    isGameStarting,
    isMakingMove,

    // Status
    realtimeStatus: {
      connectionStatus: (error
        ? 'disconnected'
        : isLoading
          ? 'reconnecting'
          : 'polling') as ConnectionStatus,
      lastUpdate: Date.now(),
      updateInterval: 2000,
      isRealtime: true,
    },
  };
}
