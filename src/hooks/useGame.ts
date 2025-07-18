'use client';

import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { useAuth } from '@/hooks/useAuth';
import {
  getGameState,
  makeMove,
  getUserMatches,
  createMatch,
  joinMatch,
} from '@/lib/actions/gameActions';
import type {
  Move,
  PieceColor,
  UseGameOptions,
  UseMatchOptions,
  ConnectionStatus,
  RealtimeStatus,
  EnhancedGameState,
  MatchWithPlayers,
  UserMatchesResult,
  GetMatchResult,
  GameStateResult,
} from '@/types/game';

// Enhanced SWR fetcher functions with better error handling
const gameStateFetcher = async (gameId: string): Promise<GameStateResult> => {
  try {
    return await getGameState(gameId);
  } catch (error) {
    console.error('Game state fetch error:', error);
    throw error;
  }
};

const userMatchesFetcher = async (): Promise<UserMatchesResult> => {
  try {
    return await getUserMatches();
  } catch (error) {
    console.error('User matches fetch error:', error);
    throw error;
  }
};

const matchFetcher = async (matchId: string): Promise<GetMatchResult> => {
  try {
    const { getMatch } = await import('@/lib/actions/gameActions');
    return await getMatch(matchId);
  } catch (error) {
    console.error('Match fetch error:', error);
    throw error;
  }
};

/**
 * Enhanced hook to get and subscribe to game state with real-time updates
 */
export function useGame(gameId: string | null, options: UseGameOptions = {}) {
  const {
    realtime = true,
    pollInterval = 3000, // 3 seconds for active games
    enableOptimisticUpdates = true,
  } = options;

  const { data, error, isLoading, mutate } = useSWR(
    gameId ? ['game', gameId] : null,
    () => gameStateFetcher(gameId!),
    {
      refreshInterval: realtime ? pollInterval : 0,
      revalidateOnFocus: realtime,
      revalidateOnReconnect: realtime,
      revalidateOnMount: true,
      revalidateIfStale: realtime,
      dedupingInterval: 2000, // Reduce deduping for faster updates
      errorRetryInterval: 5000,
      errorRetryCount: 3,
      onError: error => {
        console.error('Game state error:', error);
      },
    }
  );

  const makeGameMove = async (move: Move) => {
    if (!gameId) throw new Error('No game ID');

    let currentGame = data;

    // Optimistic update if enabled
    if (
      enableOptimisticUpdates &&
      currentGame?.success &&
      currentGame.gameState
    ) {
      const optimisticGameState: EnhancedGameState = {
        ...currentGame.gameState,
        currentTurn: (currentGame.gameState.currentTurn === 'WHITE'
          ? 'BLACK'
          : 'WHITE') as PieceColor,
        moveHistory: [...currentGame.gameState.moveHistory, move],
      };

      mutate(
        {
          ...currentGame,
          gameState: optimisticGameState,
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
        if (enableOptimisticUpdates) {
          await mutate();
        }
        throw new Error(result.error || 'Move failed');
      }
    } catch (error) {
      // Rollback optimistic update on error
      if (enableOptimisticUpdates) {
        await mutate();
      }
      throw error;
    }
  };

  // Connection status based on last update time
  const connectionStatus: ConnectionStatus = error
    ? 'disconnected'
    : isLoading
      ? 'reconnecting'
      : 'polling';

  const realtimeStatus: RealtimeStatus = {
    connectionStatus,
    lastUpdate: Date.now(),
    updateInterval: pollInterval,
    isRealtime: realtime,
  };

  return {
    game: data?.success ? data.gameState : null,
    isLoading,
    error: error || (data && !data.success ? data.error : null),
    makeMove: makeGameMove,
    refresh: mutate,
    realtimeStatus,
  };
}

/**
 * Enhanced hook to get current user's matches with real-time updates
 */
export function useUserMatches(options: UseMatchOptions = {}) {
  const {
    realtime = true,
    pollInterval = 5000, // 5 seconds for matches list
  } = options;

  const { user } = useAuth();

  const { data, error, isLoading, mutate } = useSWR(
    user ? ['user-matches', user.id] : null,
    userMatchesFetcher,
    {
      refreshInterval: realtime ? pollInterval : 0,
      revalidateOnFocus: realtime,
      revalidateOnReconnect: realtime,
      revalidateOnMount: true,
      revalidateIfStale: realtime,
      dedupingInterval: 3000,
      errorRetryInterval: 10000,
      errorRetryCount: 3,
    }
  );

  const createNewMatch = async () => {
    const result = await createMatch();

    if (result.success) {
      // Revalidate matches list immediately
      await mutate();
      return result;
    } else {
      throw new Error(result.error || 'Failed to create match');
    }
  };

  const joinExistingMatch = async (matchId: string) => {
    const result = await joinMatch(matchId);

    if (result.success) {
      // Revalidate matches list immediately
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
 * Enhanced hook to get a specific match by ID with real-time updates
 */
export function useMatch(
  matchId: string | null,
  options: UseMatchOptions = {}
) {
  const {
    realtime = true,
    pollInterval = 3000, // 3 seconds for active matches
  } = options;

  const { user } = useAuth();

  const { data, error, isLoading, mutate } = useSWR(
    user && matchId ? ['match', matchId] : null,
    ([, id]) => matchFetcher(id),
    {
      refreshInterval: realtime ? pollInterval : 0,
      revalidateOnFocus: realtime,
      revalidateOnReconnect: realtime,
      revalidateOnMount: true,
      revalidateIfStale: realtime,
      dedupingInterval: 2000, // Faster updates for active matches
      errorRetryInterval: 5000,
      errorRetryCount: 3,
      onSuccess: data => {
        // Auto-refresh faster when match is in progress
        if (data?.success && data.match?.status === 'IN_PROGRESS') {
          // The polling will continue as configured
        }
      },
    }
  );

  // Enhanced join match with immediate UI updates
  const joinExistingMatch = async () => {
    if (!matchId) throw new Error('No match ID');

    const result = await joinMatch(matchId);

    if (result.success) {
      // Update the match data immediately with the result
      if (result.match) {
        mutate(
          { success: true, match: result.match },
          false // Don't revalidate immediately, use the fresh data
        );
      }

      // Then revalidate to ensure consistency
      setTimeout(() => mutate(), 500);

      return result;
    } else {
      throw new Error(result.error || 'Failed to join match');
    }
  };

  // Extract match from the result
  const match = data?.success ? data.match : null;

  // Connection status
  const connectionStatus: ConnectionStatus = error
    ? 'disconnected'
    : isLoading
      ? 'reconnecting'
      : 'polling';

  const realtimeStatus: RealtimeStatus = {
    connectionStatus,
    lastUpdate: Date.now(),
    updateInterval: pollInterval,
    isRealtime: realtime,
  };

  return {
    match,
    isLoading,
    error: error || (data && !data.success ? data.error : null),
    joinMatch: joinExistingMatch,
    refresh: mutate,
    realtimeStatus,
  };
}

/**
 * Enhanced hook to get current user session with auth state
 */
export function useCurrentUser() {
  const { user, isLoading, isAuthenticated } = useAuth();

  return {
    user: user || null,
    isLoading,
    isAuthenticated,
    status: isLoading
      ? 'loading'
      : isAuthenticated
        ? 'authenticated'
        : 'unauthenticated',
  };
}

/**
 * Enhanced hook for comprehensive real-time game management
 */
export function useRealtimeGame(
  gameId: string | null,
  options: UseGameOptions = {}
) {
  const enhancedOptions = {
    realtime: true,
    pollInterval: 2000, // 2 seconds for active gameplay
    enableOptimisticUpdates: true,
    ...options,
  };

  const gameHook = useGame(gameId, enhancedOptions);

  // Auto-adjust polling based on game state
  const adjustedPollInterval =
    gameHook.game?.status === 'IN_PROGRESS'
      ? 2000 // Fast polling for active games
      : 5000; // Slower polling for inactive games

  // Re-initialize hook with adjusted interval if needed
  const finalGameHook = useGame(gameId, {
    ...enhancedOptions,
    pollInterval: adjustedPollInterval,
  });

  return {
    ...finalGameHook,
    // Future: Enhanced real-time features
    // subscribeToMoves: () => {},
    // subscribeToStatusChanges: () => {},
  };
}

/**
 * Comprehensive hook for managing an entire match session
 */
export function useMatchSession(matchId: string | null) {
  const matchOptions: UseMatchOptions = {
    realtime: true,
    pollInterval: 3000,
  };

  const gameOptions: UseGameOptions = {
    realtime: true,
    pollInterval: 2000,
    enableOptimisticUpdates: true,
  };

  const matchHook = useMatch(matchId, matchOptions);
  const gameId = matchHook.match?.games?.[0]?.id || null;
  const gameHook = useRealtimeGame(gameId, gameOptions);

  // Seamless game start detection
  const isGameStarting =
    matchHook.match?.status === 'IN_PROGRESS' &&
    !gameHook.game &&
    !gameHook.isLoading;

  // Auto-refresh game when match transitions to IN_PROGRESS
  if (isGameStarting) {
    setTimeout(() => {
      gameHook.refresh();
    }, 1000);
  }

  return {
    match: matchHook.match,
    game: gameHook.game,
    isMatchLoading: matchHook.isLoading,
    isGameLoading: gameHook.isLoading,
    matchError: matchHook.error,
    gameError: gameHook.error,
    joinMatch: matchHook.joinMatch,
    makeMove: gameHook.makeMove,
    refreshMatch: matchHook.refresh,
    refreshGame: gameHook.refresh,
    realtimeStatus: gameHook.realtimeStatus,
    isGameStarting,
  };
}
