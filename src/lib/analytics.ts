import { logEvent, Analytics } from 'firebase/analytics';
import { analytics } from './firebase';

// Chess-specific event names
export const CHESS_EVENTS = {
  // Game Flow Events
  MATCH_CREATED: 'match_created',
  MATCH_JOINED: 'match_joined',
  GAME_STARTED: 'game_started',
  GAME_COMPLETED: 'game_completed',

  // Move Events
  PIECE_MOVED: 'piece_moved',
  INVALID_MOVE_ATTEMPTED: 'invalid_move_attempted',
  CHECK_GIVEN: 'check_given',
  CHECKMATE: 'checkmate',
  STALEMATE: 'stalemate',

  // User Engagement
  DEMO_BOARD_USED: 'demo_board_used',
  HOMEPAGE_VISITED: 'homepage_visited',
  MATCH_SHARED: 'match_shared',

  // Authentication
  USER_SIGNED_IN: 'user_signed_in',
  USER_SIGNED_OUT: 'user_signed_out',
} as const;

// Safe event tracking that handles analytics not being ready
const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  try {
    if (analytics && typeof window !== 'undefined') {
      logEvent(analytics as Analytics, eventName, {
        timestamp: new Date().toISOString(),
        ...parameters,
      });
      console.log(`📊 Tracked: ${eventName}`, parameters);
    }
  } catch (error) {
    // Silently fail - analytics shouldn't break the app
    console.warn('Analytics tracking failed:', error);
  }
};

// Convenience functions for common chess events
export const chessAnalytics = {
  // Game lifecycle events
  trackMatchCreated: (matchId: string) =>
    trackEvent(CHESS_EVENTS.MATCH_CREATED, { match_id: matchId }),

  trackMatchJoined: (matchId: string, userId: string) =>
    trackEvent(CHESS_EVENTS.MATCH_JOINED, {
      match_id: matchId,
      user_id: userId,
    }),

  trackGameStarted: (matchId: string, gameId: string) =>
    trackEvent(CHESS_EVENTS.GAME_STARTED, {
      match_id: matchId,
      game_id: gameId,
    }),

  trackGameCompleted: (
    matchId: string,
    gameId: string,
    result: string,
    moves: number,
    duration: number
  ) =>
    trackEvent(CHESS_EVENTS.GAME_COMPLETED, {
      match_id: matchId,
      game_id: gameId,
      result,
      total_moves: moves,
      game_duration_seconds: duration,
    }),

  // Move tracking
  trackPieceMoved: (
    pieceType: string,
    from: string,
    to: string,
    moveNumber: number,
    timeToMove?: number
  ) =>
    trackEvent(CHESS_EVENTS.PIECE_MOVED, {
      piece_type: pieceType,
      from_square: from,
      to_square: to,
      move_number: moveNumber,
      time_to_move_seconds: timeToMove,
    }),

  trackInvalidMove: (pieceType: string, attemptedMove: string) =>
    trackEvent(CHESS_EVENTS.INVALID_MOVE_ATTEMPTED, {
      piece_type: pieceType,
      attempted_move: attemptedMove,
    }),

  trackCheck: (kingColor: string, moveNumber: number) =>
    trackEvent(CHESS_EVENTS.CHECK_GIVEN, {
      king_color: kingColor,
      move_number: moveNumber,
    }),

  trackCheckmate: (
    winnerColor: string,
    moveNumber: number,
    gameDuration: number
  ) =>
    trackEvent(CHESS_EVENTS.CHECKMATE, {
      winner_color: winnerColor,
      final_move_number: moveNumber,
      game_duration_seconds: gameDuration,
    }),

  trackStalemate: (moveNumber: number, gameDuration: number) =>
    trackEvent(CHESS_EVENTS.STALEMATE, {
      final_move_number: moveNumber,
      game_duration_seconds: gameDuration,
    }),

  // Engagement tracking
  trackDemoBoardUsed: (movesPlayed: number) =>
    trackEvent(CHESS_EVENTS.DEMO_BOARD_USED, {
      moves_played: movesPlayed,
    }),

  trackHomepageVisited: (userAuthenticated: boolean) =>
    trackEvent(CHESS_EVENTS.HOMEPAGE_VISITED, {
      user_authenticated: userAuthenticated,
    }),

  trackMatchShared: (matchId: string, shareMethod: string) =>
    trackEvent(CHESS_EVENTS.MATCH_SHARED, {
      match_id: matchId,
      share_method: shareMethod, // 'clipboard', 'native_share', etc.
    }),

  // Authentication events
  trackUserSignIn: (provider: string, isNewUser: boolean) =>
    trackEvent(CHESS_EVENTS.USER_SIGNED_IN, {
      auth_provider: provider,
      is_new_user: isNewUser,
    }),

  trackUserSignOut: () => trackEvent(CHESS_EVENTS.USER_SIGNED_OUT),
};

// Custom event for flexibility
export const trackCustomEvent = trackEvent;

// Utility to track page views (can be called in page components)
export const trackPageView = (
  pageName: string,
  additionalData?: Record<string, any>
) => {
  trackEvent('page_view', {
    page_name: pageName,
    page_location: typeof window !== 'undefined' ? window.location.href : '',
    ...additionalData,
  });
};
