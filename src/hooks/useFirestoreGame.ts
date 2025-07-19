'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  doc,
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  Unsubscribe,
  getDoc,
} from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { db, collections } from '@/lib/firebase';
import {
  createMatch,
  joinMatch,
  makeMove as firestoreMakeMove,
} from '@/lib/firestore-actions';
import { chessAnalytics } from '@/lib/analytics';
import type {
  Move,
  MatchWithPlayers,
  EnhancedGameState,
  ConnectionStatus,
} from '@/types/game';

// Real-time status for Firestore
interface FirestoreRealtimeStatus {
  connectionStatus: ConnectionStatus;
  lastUpdate: number;
  isRealtime: boolean;
}

/**
 * 🔥 REAL-TIME User Matches Hook (NO MORE POLLING!)
 * Uses Firestore onSnapshot for instant updates when matches change
 */
export function useUserMatchesRealtime() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<MatchWithPlayers[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<FirestoreRealtimeStatus>(
    {
      connectionStatus: 'reconnecting',
      lastUpdate: Date.now(),
      isRealtime: true,
    }
  );

  useEffect(() => {
    if (!user?.id) {
      setMatches([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setRealtimeStatus(prev => ({ ...prev, connectionStatus: 'reconnecting' }));

    // Query for matches where user is player1 or player2
    const matchesQuery1 = query(
      collection(db, collections.matches),
      where('player1Id', '==', user.id),
      orderBy('updatedAt', 'desc')
    );

    const matchesQuery2 = query(
      collection(db, collections.matches),
      where('player2Id', '==', user.id),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribes: Unsubscribe[] = [];

    // Listen to both queries and merge results
    const matchMap = new Map<string, any>();

    const updateMatches = () => {
      const allMatches = Array.from(matchMap.values()).sort((a, b) => {
        // Active matches first, then by updatedAt
        if (a.status === 'IN_PROGRESS' && b.status !== 'IN_PROGRESS') return -1;
        if (b.status === 'IN_PROGRESS' && a.status !== 'IN_PROGRESS') return 1;
        return b.updatedAt.getTime() - a.updatedAt.getTime();
      });

      setMatches(allMatches);
      setIsLoading(false);
      setRealtimeStatus(prev => ({
        ...prev,
        connectionStatus: 'connected',
        lastUpdate: Date.now(),
      }));
    };

    const unsubscribe1 = onSnapshot(
      matchesQuery1,
      snapshot => {
        snapshot.docs.forEach(doc => {
          matchMap.set(doc.id, {
            id: doc.id,
            ...doc.data(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          });
        });
        updateMatches();
      },
      error => {
        console.error('Error in matches listener 1:', error);
        setError('Failed to load matches');
        setRealtimeStatus(prev => ({
          ...prev,
          connectionStatus: 'disconnected',
        }));
      }
    );

    const unsubscribe2 = onSnapshot(
      matchesQuery2,
      snapshot => {
        snapshot.docs.forEach(doc => {
          matchMap.set(doc.id, {
            id: doc.id,
            ...doc.data(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          });
        });
        updateMatches();
      },
      error => {
        console.error('Error in matches listener 2:', error);
        setError('Failed to load matches');
        setRealtimeStatus(prev => ({
          ...prev,
          connectionStatus: 'disconnected',
        }));
      }
    );

    unsubscribes.push(unsubscribe1, unsubscribe2);

    // Cleanup listeners on unmount
    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [user?.id]);

  const refresh = useCallback(() => {
    // With real-time listeners, refresh is automatic!
    console.log('🔥 Firestore real-time - no manual refresh needed!');
  }, []);

  return {
    matches,
    isLoading,
    error,
    refresh,
    realtimeStatus,
  };
}

/**
 * 🔥 REAL-TIME Match Session Hook (NO MORE POLLING!)
 * Uses Firestore onSnapshot for instant updates when games change
 */
export function useMatchSessionRealtime(matchId: string | null) {
  const { user } = useAuth();
  const [match, setMatch] = useState<MatchWithPlayers | null>(null);
  const [game, setGame] = useState<EnhancedGameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMakingMove, setIsMakingMove] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<FirestoreRealtimeStatus>(
    {
      connectionStatus: 'reconnecting',
      lastUpdate: Date.now(),
      isRealtime: true,
    }
  );

  useEffect(() => {
    if (!user?.id || !matchId) {
      setMatch(null);
      setGame(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setRealtimeStatus(prev => ({ ...prev, connectionStatus: 'reconnecting' }));

    // Listen to match document
    const matchRef = doc(db, collections.matches, matchId);
    const unsubscribeMatch = onSnapshot(
      matchRef,
      async matchDoc => {
        if (!matchDoc.exists()) {
          setError('Match not found');
          setIsLoading(false);
          return;
        }

        try {
          const matchData = matchDoc.data()!;

          // Fetch player documents to populate player1 and player2
          const [player1Doc, player2Doc] = await Promise.all([
            getDoc(doc(db, collections.users, matchData.player1Id)),
            matchData.player2Id
              ? getDoc(doc(db, collections.users, matchData.player2Id))
              : Promise.resolve(null),
          ]);

          const enhancedMatch: MatchWithPlayers = {
            id: matchDoc.id,
            status: matchData.status,
            player1Id: matchData.player1Id,
            player2Id: matchData.player2Id,
            winnerId: matchData.winnerId,
            createdAt: matchData.createdAt?.toDate() || new Date(),
            updatedAt: matchData.updatedAt?.toDate() || new Date(),
            player1: player1Doc.exists()
              ? {
                  id: player1Doc.id,
                  name: player1Doc.data()?.name || null,
                  email: null, // PII omitted
                  emailVerified: null, // PII omitted
                  image: player1Doc.data()?.image || null,
                  discordId: player1Doc.data()?.discordId || null,
                  createdAt:
                    player1Doc.data()?.createdAt?.toDate() || new Date(),
                  updatedAt:
                    player1Doc.data()?.updatedAt?.toDate() || new Date(),
                }
              : {
                  // Fallback user if player1 doc doesn't exist (shouldn't happen)
                  id: matchData.player1Id,
                  name: 'Unknown Player',
                  email: null,
                  emailVerified: null,
                  image: null,
                  discordId: null,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
            player2: player2Doc?.exists()
              ? {
                  id: player2Doc.id,
                  name: player2Doc.data()?.name || null,
                  email: null, // PII omitted
                  emailVerified: null, // PII omitted
                  image: player2Doc.data()?.image || null,
                  discordId: player2Doc.data()?.discordId || null,
                  createdAt:
                    player2Doc.data()?.createdAt?.toDate() || new Date(),
                  updatedAt:
                    player2Doc.data()?.updatedAt?.toDate() || new Date(),
                }
              : null,
            games: [], // Will be populated by game listener
          };

          setMatch(enhancedMatch);
          setRealtimeStatus(prev => ({
            ...prev,
            connectionStatus: 'connected',
            lastUpdate: Date.now(),
          }));
        } catch (error) {
          console.error('Error processing match data:', error);
          setError('Failed to load match data');
        }
      },
      error => {
        console.error('Error in match listener:', error);
        setError('Failed to load match');
        setRealtimeStatus(prev => ({
          ...prev,
          connectionStatus: 'disconnected',
        }));
      }
    );

    // Listen to current game (latest game in the match)
    const gamesQuery = query(
      collection(db, collections.matches, matchId, collections.games),
      orderBy('gameNumber', 'desc'),
      limit(1)
    );

    const unsubscribeGame = onSnapshot(
      gamesQuery,
      snapshot => {
        if (snapshot.empty) {
          setGame(null);
          setIsLoading(false);
          return;
        }

        const gameDoc = snapshot.docs[0];
        const gameData = gameDoc.data();

        // Check if user is part of this game
        const isPlayer =
          gameData.whitePlayerId === user.id ||
          gameData.blackPlayerId === user.id;

        if (isPlayer) {
          // Convert Firestore data to EnhancedGameState
          const boardState = new Map();
          if (gameData.boardState && typeof gameData.boardState === 'object') {
            for (const [key, piece] of Object.entries(gameData.boardState)) {
              if (piece) boardState.set(key, piece);
            }
          }

          const enhancedGame: EnhancedGameState = {
            id: gameDoc.id,
            gameNumber: gameData.gameNumber,
            status: gameData.status,
            currentTurn: gameData.currentTurn,
            boardState,
            moveHistory: Array.isArray(gameData.moveHistory)
              ? gameData.moveHistory
              : [],
            whitePlayerId: gameData.whitePlayerId,
            blackPlayerId: gameData.blackPlayerId,
            startedAt: gameData.startedAt?.toDate() || new Date(),
            completedAt: gameData.completedAt?.toDate() || null,
            result: gameData.result,
            match: match || ({} as any), // Will be filled by match listener
            whitePlayer: {} as any, // Simplified for real-time
            blackPlayer: {} as any, // Simplified for real-time
          };

          setGame(enhancedGame);
        } else {
          setGame(null);
        }

        setIsLoading(false);
      },
      error => {
        console.error('Error in game listener:', error);
        setError('Failed to load game');
        setRealtimeStatus(prev => ({
          ...prev,
          connectionStatus: 'disconnected',
        }));
      }
    );

    // Cleanup listeners on unmount
    return () => {
      unsubscribeMatch();
      unsubscribeGame();
    };
  }, [user?.id, matchId]); // Remove 'match' from dependencies to prevent infinite loop

  // Enhanced make move with real-time optimistic updates
  const makeGameMove = async (move: Move) => {
    if (!game?.id || !matchId) throw new Error('No game or match available');

    setIsMakingMove(true);

    try {
      const result = await firestoreMakeMove(game.id, move);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Track successful move
      if (result.success && result.gameState) {
        const moveNumber = result.gameState.moveHistory?.length || 0;
        chessAnalytics.trackPieceMoved(
          move.piece.type,
          `${move.from.file},${move.from.rank}`,
          `${move.to.file},${move.to.rank}`,
          moveNumber
        );
      }

      // No need to manually update state - Firestore listeners will handle it! 🔥
      setIsMakingMove(false);
      return result.gameState;
    } catch (error) {
      setIsMakingMove(false);
      throw error;
    }
  };

  // Enhanced join match with real-time updates
  const joinMatchWithRealtime = async () => {
    if (!matchId) throw new Error('No match ID');

    try {
      const result = await joinMatch(matchId);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Track successful match join
      if (result.success && user?.id) {
        chessAnalytics.trackMatchJoined(matchId, user.id);
      }

      // No need to manually update - listeners will handle it! 🔥
      return result;
    } catch (error) {
      throw error;
    }
  };

  const refresh = useCallback(() => {
    // With real-time listeners, refresh is automatic!
    console.log('🔥 Firestore real-time - no manual refresh needed!');
  }, []);

  return {
    // Match data
    match,
    isMatchLoading: isLoading,
    matchError: error,

    // Game data
    game,
    isGameLoading: isLoading && !game,
    gameError: error,

    // Actions
    joinMatch: joinMatchWithRealtime,
    makeMove: makeGameMove,

    // Utilities
    refresh,
    isGameStarting:
      (match as any)?.status === 'IN_PROGRESS' && !game && !isLoading,
    isMakingMove,

    // Status
    realtimeStatus,
  };
}

/**
 * 🔥 Create Match Hook with Real-time Updates
 */
export function useCreateMatch() {
  const [isCreating, setIsCreating] = useState(false);

  const create = async () => {
    setIsCreating(true);
    try {
      const result = await createMatch();
      setIsCreating(false);
      return result;
    } catch (error) {
      setIsCreating(false);
      throw error;
    }
  };

  return {
    createMatch: create,
    isCreating,
  };
}
