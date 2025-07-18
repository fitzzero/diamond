'use client';

import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import {
  getGameState,
  makeMove,
  getUserMatches,
  createMatch,
  joinMatch,
} from '@/lib/actions/gameActions';
import type { Move, PieceColor } from '@/types/game';

// SWR fetcher functions
const gameStateFetcher = async (gameId: string) => {
  return await getGameState(gameId);
};

const userMatchesFetcher = async () => {
  return await getUserMatches();
};

/**
 * Hook to get and subscribe to game state
 */
export function useGame(gameId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    gameId ? ['game', gameId] : null,
    () => gameStateFetcher(gameId!),
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateOnMount: false, // Prevent revalidation on component mount
      revalidateIfStale: false, // Don't revalidate if data is stale
      dedupingInterval: 5000, // Increase deduping interval
    }
  );

  const makeGameMove = async (move: Move) => {
    if (!gameId) throw new Error('No game ID');

    // Optimistic update
    const currentGame = data;
    if (currentGame?.success && currentGame.gameState) {
      // Update the game state optimistically
      mutate(
        {
          ...currentGame,
          gameState: {
            ...currentGame.gameState,
            currentTurn:
              currentGame.gameState.currentTurn === 'WHITE' ? 'BLACK' : 'WHITE',
          },
        },
        false // Don't revalidate immediately
      );
    }

    try {
      const result = await makeMove(gameId, move);

      if (result.success) {
        // Revalidate to get the actual server state
        await mutate();
        return result;
      } else {
        // Rollback optimistic update on error
        await mutate();
        throw new Error(result.error || 'Move failed');
      }
    } catch (error) {
      // Rollback optimistic update on error
      await mutate();
      throw error;
    }
  };

  return {
    game: data?.success ? data.gameState : null,
    isLoading,
    error,
    makeMove: makeGameMove,
    refresh: mutate,
  };
}

/**
 * Hook to get current user's matches
 */
export function useUserMatches() {
  const { data: session } = useSession();

  const { data, error, isLoading, mutate } = useSWR(
    session?.user ? ['user-matches', session.user.id] : null,
    userMatchesFetcher,
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateOnMount: false, // Prevent revalidation on component mount
      revalidateIfStale: false, // Don't revalidate if data is stale
      dedupingInterval: 5000, // Increase deduping interval
    }
  );

  const createNewMatch = async () => {
    const result = await createMatch();

    if (result.success) {
      // Revalidate matches list
      await mutate();
      return result;
    } else {
      throw new Error(result.error || 'Failed to create match');
    }
  };

  const joinExistingMatch = async (matchId: string) => {
    const result = await joinMatch(matchId);

    if (result.success) {
      // Revalidate matches list
      await mutate();
      return result;
    } else {
      throw new Error(result.error || 'Failed to join match');
    }
  };

  return {
    matches: data || { success: false, matches: [], error: 'No data' },
    isLoading,
    error,
    createMatch: createNewMatch,
    joinMatch: joinExistingMatch,
    refresh: mutate,
  };
}

/**
 * Hook to get a specific match by ID
 */
export function useMatch(matchId: string | null) {
  const { data: session } = useSession();

  const { data, error, isLoading, mutate } = useSWR(
    session?.user && matchId ? ['match', matchId] : null,
    async ([, id]) => {
      const { getMatch } = await import('@/lib/actions/gameActions');
      return await getMatch(id);
    },
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateOnMount: true,
      dedupingInterval: 5000,
    }
  );

  // Extract match from the result
  const match = data?.success ? data.match : null;

  return {
    match,
    isLoading,
    error: error || (data && !data.success ? data.error : null),
    refresh: mutate,
  };
}

/**
 * Hook to get current user session with auth state
 */
export function useCurrentUser() {
  const { data: session, status } = useSession();

  return {
    user: session?.user || null,
    isLoading: status === 'loading',
    isAuthenticated: !!session?.user,
    status,
  };
}

/**
 * Hook for real-time game updates (can be enhanced with Prisma Pulse)
 */
export function useRealtimeGame(gameId: string | null) {
  const { game, isLoading, error, makeMove, refresh } = useGame(gameId);

  // NOTE: True real-time subscriptions require Prisma Pulse (separate product)
  // Prisma Accelerate (which we have) provides connection pooling and caching
  // For now, we use optimized polling with Accelerate caching for better performance

  return {
    game,
    isLoading,
    error,
    makeMove,
    refresh,
    // Future: Prisma Pulse WebSocket subscriptions
    connectionStatus: 'polling' as const, // vs 'connected', 'disconnected'
  };
}
