'use server';

import {
  doc,
  collection,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { auth } from '@/lib/auth';
import {
  db,
  collections,
  type FirestoreUser,
  type FirestoreMatch,
  type FirestoreGame,
} from '@/lib/firebase';
import { ensureUserExists } from '@/lib/user-sync';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
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
  MatchSessionResult,
  MatchWithPlayers,
  TurnValidationResult,
} from '@/types/game';

// Helper function to get authenticated user and sync to Firestore
async function getAuthenticatedUser() {
  let user = null;

  // Try NextAuth first
  const session = await auth();
  if (session?.user?.id) {
    user = session.user;
  } else {
    // Fall back to test authentication
    const cookieStore = await cookies();
    const testAuthCookie = cookieStore.get('test-auth-user');

    if (testAuthCookie) {
      try {
        const testUser = JSON.parse(testAuthCookie.value);
        console.log('🧪 Auth via test cookie - User ID:', testUser.id);
        user = testUser;
      } catch (error) {
        console.error('Error parsing test auth cookie:', error);
      }
    }
  }

  // If we have a user, ensure they exist in Firestore
  if (user?.id) {
    const syncResult = await ensureUserExists({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      discordId: user.discordId,
    });

    if (!syncResult.success && 'error' in syncResult) {
      console.warn('Failed to sync user to Firestore:', syncResult.error);
    }

    return user;
  }

  console.log('❌ No authentication found');
  return null;
}

// Helper to convert Firestore Timestamp to Date
function timestampToDate(timestamp: any): Date {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  if (timestamp?.seconds) {
    return new Date(timestamp.seconds * 1000);
  }
  return timestamp instanceof Date ? timestamp : new Date(timestamp);
}

// Helper to convert BoardState Map to Firestore object
function boardStateToFirestore(boardState: BoardState): Record<string, any> {
  const obj: Record<string, any> = {};
  for (const [key, piece] of boardState.entries()) {
    obj[key] = piece;
  }
  return obj;
}

// Helper to convert Firestore object back to BoardState Map
function firestoreToBoardState(
  firestoreBoard: Record<string, any>
): BoardState {
  const map = new Map();
  for (const [key, piece] of Object.entries(firestoreBoard)) {
    if (piece) map.set(key, piece);
  }
  return map;
}

// Helper to convert Firestore docs to our types
function firestoreMatchToMatchWithPlayers(
  matchDoc: any,
  player1Doc: any,
  player2Doc: any,
  gameDocs: any[]
): MatchWithPlayers {
  return {
    id: matchDoc.id,
    status: matchDoc.data().status,
    player1Id: matchDoc.data().player1Id,
    player2Id: matchDoc.data().player2Id,
    winnerId: matchDoc.data().winnerId,
    createdAt: timestampToDate(matchDoc.data().createdAt),
    updatedAt: timestampToDate(matchDoc.data().updatedAt),
    player1: {
      id: player1Doc.id,
      name: player1Doc.data().name || null,
      image: player1Doc.data().image || null,
      email: null, // PII omitted per memory
      emailVerified: null, // PII omitted per memory
      discordId: player1Doc.data().discordId || null,
      createdAt: timestampToDate(player1Doc.data().createdAt),
      updatedAt: timestampToDate(player1Doc.data().updatedAt),
    },
    player2: player2Doc
      ? {
          id: player2Doc.id,
          name: player2Doc.data().name || null,
          image: player2Doc.data().image || null,
          email: null, // PII omitted per memory
          emailVerified: null, // PII omitted per memory
          discordId: player2Doc.data().discordId || null,
          createdAt: timestampToDate(player2Doc.data().createdAt),
          updatedAt: timestampToDate(player2Doc.data().updatedAt),
        }
      : null,
    games: gameDocs.map(gameDoc => ({
      id: gameDoc.id,
      gameNumber: gameDoc.data().gameNumber,
      status: gameDoc.data().status,
      currentTurn: gameDoc.data().currentTurn,
      board:
        typeof gameDoc.data().boardState === 'object' &&
        gameDoc.data().boardState !== null
          ? (gameDoc.data().boardState as Record<string, any>)
          : {},
      moveHistory: Array.isArray(gameDoc.data().moveHistory)
        ? (gameDoc.data().moveHistory as Move[])
        : [],
      whitePlayerId: gameDoc.data().whitePlayerId,
      blackPlayerId: gameDoc.data().blackPlayerId,
      startedAt: timestampToDate(gameDoc.data().startedAt),
      completedAt: gameDoc.data().completedAt
        ? timestampToDate(gameDoc.data().completedAt)
        : null,
      result: gameDoc.data().result,
      match: {
        id: matchDoc.id,
        status: matchDoc.data().status,
        player1Id: matchDoc.data().player1Id,
        player2Id: matchDoc.data().player2Id,
        winnerId: matchDoc.data().winnerId,
        createdAt: timestampToDate(matchDoc.data().createdAt),
        updatedAt: timestampToDate(matchDoc.data().updatedAt),
      },
      whitePlayer:
        gameDoc.data().whitePlayerId === player1Doc.id
          ? {
              id: player1Doc.id,
              name: player1Doc.data().name,
              image: player1Doc.data().image,
              createdAt: timestampToDate(player1Doc.data().createdAt),
              updatedAt: timestampToDate(player1Doc.data().updatedAt),
            }
          : player2Doc
            ? {
                id: player2Doc.id,
                name: player2Doc.data().name,
                image: player2Doc.data().image,
                createdAt: timestampToDate(player2Doc.data().createdAt),
                updatedAt: timestampToDate(player2Doc.data().updatedAt),
              }
            : null,
      blackPlayer:
        gameDoc.data().blackPlayerId === player1Doc.id
          ? {
              id: player1Doc.id,
              name: player1Doc.data().name,
              image: player1Doc.data().image,
              createdAt: timestampToDate(player1Doc.data().createdAt),
              updatedAt: timestampToDate(player1Doc.data().updatedAt),
            }
          : player2Doc
            ? {
                id: player2Doc.id,
                name: player2Doc.data().name,
                image: player2Doc.data().image,
                createdAt: timestampToDate(player2Doc.data().createdAt),
                updatedAt: timestampToDate(player2Doc.data().updatedAt),
              }
            : null,
    })),
  } as unknown as MatchWithPlayers;
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

    // Create match document
    const matchRef = await addDoc(collection(db, collections.matches), {
      status: 'WAITING_FOR_PLAYER',
      player1Id: user.id,
      player2Id: null,
      winnerId: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    revalidatePath('/');
    return { success: true, matchId: matchRef.id };
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
    const user = await getAuthenticatedUser();

    if (!user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    const result = await runTransaction(db, async transaction => {
      // Get match
      const matchRef = doc(db, collections.matches, matchId);
      const matchDoc = await transaction.get(matchRef);

      if (!matchDoc.exists()) {
        throw new Error('Match not found');
      }

      const matchData = matchDoc.data();

      if (matchData.status !== 'WAITING_FOR_PLAYER') {
        throw new Error('Match is not available to join');
      }

      if (matchData.player1Id === user.id) {
        throw new Error('Cannot join your own match');
      }

      if (matchData.player2Id) {
        throw new Error('Match is already full');
      }

      // Update match
      transaction.update(matchRef, {
        player2Id: user.id,
        status: 'IN_PROGRESS',
        updatedAt: serverTimestamp(),
      });

      // Create initial game
      const initialBoard = boardSetup.createInitialBoard();
      const gameRef = doc(
        collection(db, collections.matches, matchId, collections.games)
      );

      transaction.set(gameRef, {
        gameNumber: 1,
        status: 'IN_PROGRESS',
        currentTurn: 'WHITE',
        boardState: boardStateToFirestore(initialBoard),
        moveHistory: [],
        whitePlayerId: matchData.player1Id, // Player 1 is white
        blackPlayerId: user.id, // Player 2 is black
        startedAt: serverTimestamp(),
        completedAt: null,
        result: null,
      });

      return { gameId: gameRef.id };
    });

    // Fetch the updated match with players for return
    const matchDoc = await getDoc(doc(db, collections.matches, matchId));
    const matchData = matchDoc.data()!;

    const [player1Doc, player2Doc] = await Promise.all([
      getDoc(doc(db, collections.users, matchData.player1Id)),
      getDoc(doc(db, collections.users, matchData.player2Id)),
    ]);

    const enhancedMatch = firestoreMatchToMatchWithPlayers(
      matchDoc,
      player1Doc,
      player2Doc,
      []
    );

    // Revalidate pages for real-time updates
    revalidatePath('/');
    revalidatePath(`/match/${matchId}`);

    return {
      success: true,
      gameId: result.gameId,
      match: enhancedMatch,
    };
  } catch (error) {
    console.error('Error joining match:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to join match',
    };
  }
}

/**
 * Get user's matches with sorting and filtering
 */
export async function getUserMatches(): Promise<UserMatchesResult> {
  try {
    const user = await getAuthenticatedUser();

    if (!user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    // Query matches where user is player1 or player2
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

    const [matchesDocs1, matchesDocs2] = await Promise.all([
      getDocs(matchesQuery1),
      getDocs(matchesQuery2),
    ]);

    // Combine and dedupe results
    const allMatchDocs = [...matchesDocs1.docs, ...matchesDocs2.docs];
    const uniqueMatches = new Map();
    allMatchDocs.forEach(doc => {
      if (!uniqueMatches.has(doc.id)) {
        uniqueMatches.set(doc.id, doc);
      }
    });

    const matches: MatchWithPlayers[] = [];

    for (const matchDoc of uniqueMatches.values()) {
      const matchData = matchDoc.data();

      // Get player docs
      const [player1Doc, player2Doc] = await Promise.all([
        getDoc(doc(db, collections.users, matchData.player1Id)),
        matchData.player2Id
          ? getDoc(doc(db, collections.users, matchData.player2Id))
          : null,
      ]);

      // Get latest game
      const gamesQuery = query(
        collection(db, collections.matches, matchDoc.id, collections.games),
        orderBy('gameNumber', 'desc'),
        limit(1)
      );
      const gamesDocs = await getDocs(gamesQuery);

      matches.push(
        firestoreMatchToMatchWithPlayers(
          matchDoc,
          player1Doc,
          player2Doc,
          gamesDocs.docs
        )
      );
    }

    // Sort: active matches first, then by updatedAt desc
    matches.sort((a: any, b: any) => {
      if (a.status === 'IN_PROGRESS' && b.status !== 'IN_PROGRESS') return -1;
      if (b.status === 'IN_PROGRESS' && a.status !== 'IN_PROGRESS') return 1;
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });

    return { success: true, matches };
  } catch (error) {
    console.error('Error getting user matches:', error);
    return { success: false, error: 'Failed to get matches' };
  }
}

/**
 * Make a move in the current game with full validation
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

    // Find the match that contains this game
    // Since game documents are stored as subcollections, we need to search through active matches
    const matchesQuery = query(
      collection(db, collections.matches),
      where('status', '==', 'IN_PROGRESS')
    );
    const matchesDocs = await getDocs(matchesQuery);

    let targetMatchId = '';
    for (const matchDoc of matchesDocs.docs) {
      // Try to get the game document directly by ID
      const gameRef = doc(
        db,
        collections.matches,
        matchDoc.id,
        collections.games,
        gameId
      );
      const gameDoc = await getDoc(gameRef);
      if (gameDoc.exists()) {
        targetMatchId = matchDoc.id;
        break;
      }
    }

    if (!targetMatchId) {
      return { success: false, error: 'Game not found' };
    }

    const result = await runTransaction(db, async transaction => {
      // Get current game state
      const gameRef = doc(
        db,
        collections.matches,
        targetMatchId,
        collections.games,
        gameId
      );
      const gameDoc = await transaction.get(gameRef);

      if (!gameDoc.exists()) {
        throw new Error('Game not found');
      }

      const gameData = gameDoc.data();

      if (gameData.status !== 'IN_PROGRESS') {
        throw new Error('Game is not in progress');
      }

      // Validate player's turn
      const isWhitePlayer = gameData.whitePlayerId === user.id;
      const isBlackPlayer = gameData.blackPlayerId === user.id;

      if (!isWhitePlayer && !isBlackPlayer) {
        throw new Error('You are not a player in this game');
      }

      const playerColor: PieceColor = isWhitePlayer ? 'WHITE' : 'BLACK';
      if (gameData.currentTurn !== playerColor) {
        throw new Error('Not your turn');
      }

      // Parse current board state
      const board = firestoreToBoardState(gameData.boardState);

      // Basic move validation
      const fromKey = chessCoords.positionToKey(move.from);
      const toKey = chessCoords.positionToKey(move.to);
      const piece = board.get(fromKey);

      if (!piece) {
        throw new Error('No piece at source position');
      }

      if (piece.color !== playerColor) {
        throw new Error('Not your piece');
      }

      // Execute move
      board.delete(fromKey);
      board.set(toKey, piece);

      // Update move history
      const moveHistory = [...(gameData.moveHistory || [])];
      const enhancedMove = {
        ...move,
        piece,
        moveNotation: `${piece.type}${fromKey}-${toKey}`,
      };
      moveHistory.push(enhancedMove);

      // Determine next turn
      const nextTurn: PieceColor =
        gameData.currentTurn === 'WHITE' ? 'BLACK' : 'WHITE';

      // Update game
      transaction.update(gameRef, {
        boardState: boardStateToFirestore(board),
        moveHistory,
        currentTurn: nextTurn,
        updatedAt: serverTimestamp(),
      });

      return { targetMatchId };
    });

    // Get updated game session for return
    const sessionResult = await getMatchSession(result.targetMatchId);

    revalidatePath(`/match/${result.targetMatchId}`);

    return {
      success: true,
      gameState: sessionResult.game,
    };
  } catch (error) {
    console.error('Error making move:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to make move',
    };
  }
}

export async function getMatch(matchId: string): Promise<GetMatchResult> {
  try {
    const user = await getAuthenticatedUser();

    if (!user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    const matchDoc = await getDoc(doc(db, collections.matches, matchId));

    if (!matchDoc.exists()) {
      return { success: false, error: 'Match not found' };
    }

    const matchData = matchDoc.data();

    // Get player docs
    const [player1Doc, player2Doc] = await Promise.all([
      getDoc(doc(db, collections.users, matchData.player1Id)),
      matchData.player2Id
        ? getDoc(doc(db, collections.users, matchData.player2Id))
        : null,
    ]);

    // Get latest game
    const gamesQuery = query(
      collection(db, collections.matches, matchId, collections.games),
      orderBy('gameNumber', 'desc'),
      limit(1)
    );
    const gamesDocs = await getDocs(gamesQuery);

    const enhancedMatch = firestoreMatchToMatchWithPlayers(
      matchDoc,
      player1Doc,
      player2Doc,
      gamesDocs.docs
    );

    return { success: true, match: enhancedMatch };
  } catch (error) {
    console.error('Error getting match:', error);
    return { success: false, error: 'Failed to get match' };
  }
}

export async function getMatchSession(
  matchId: string
): Promise<MatchSessionResult> {
  try {
    const user = await getAuthenticatedUser();

    if (!user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get match with all related data
    const matchResult = await getMatch(matchId);
    if (!matchResult.success || !matchResult.match) {
      return { success: false, error: matchResult.error || 'Match not found' };
    }

    const match = matchResult.match;
    let gameState: EnhancedGameState | undefined = undefined;

    // If there's an active game, get enhanced game state
    if (match.games.length > 0) {
      const currentGame = match.games[0] as any;

      // Check if user is part of this game
      const isPlayer =
        currentGame.whitePlayerId === user.id ||
        currentGame.blackPlayerId === user.id;

      if (isPlayer) {
        gameState = {
          id: currentGame.id,
          gameNumber: currentGame.gameNumber,
          status: currentGame.status,
          currentTurn: currentGame.currentTurn,
          boardState: firestoreToBoardState(
            currentGame.board && typeof currentGame.board === 'object'
              ? (currentGame.board as Record<string, any>)
              : {}
          ),
          moveHistory: Array.isArray(currentGame.moveHistory)
            ? (currentGame.moveHistory as unknown as Move[])
            : [],
          whitePlayerId: currentGame.whitePlayerId,
          blackPlayerId: currentGame.blackPlayerId,
          startedAt: currentGame.startedAt,
          completedAt: currentGame.completedAt,
          result: currentGame.result,
          match: currentGame.match,
          whitePlayer: currentGame.whitePlayer!,
          blackPlayer: currentGame.blackPlayer!,
        };
      }
    }

    return {
      success: true,
      match,
      game: gameState,
    };
  } catch (error) {
    console.error('Error getting match session:', error);
    return { success: false, error: 'Failed to get match session' };
  }
}
