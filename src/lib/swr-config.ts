'use client';

import { SWRConfig } from 'swr';
import type { SWRConfiguration } from 'swr';

// Global SWR configuration
export const swrConfig: SWRConfiguration = {
  // Default options for all SWR hooks
  errorRetryCount: 3,
  errorRetryInterval: 2000,
  dedupingInterval: 2000,
  focusThrottleInterval: 5000,

  // Error handling
  onError: (error, key) => {
    console.error(`SWR Error for key "${key}":`, error);

    // Handle specific error types
    if (error.status === 401) {
      // Redirect to login on authentication errors
      window.location.href = '/api/auth/signin';
      return;
    }

    if (error.status === 403) {
      console.warn('Access forbidden:', key);
      return;
    }

    // Log errors in development (less verbose)
    if (process.env.NODE_ENV === 'development') {
      console.error(`SWR Error [${key}]:`, error?.message || error);
    }
  },

  // Success handler
  onSuccess: (data, key) => {
    // Success logging removed to reduce verbosity
  },

  // Custom error handling for server actions
  onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
    // Don't retry on 404
    if (error.status === 404) return;

    // Don't retry on authentication errors
    if (error.status === 401 || error.status === 403) return;

    // Only retry up to 3 times
    if (retryCount >= 3) return;

    // Exponential backoff
    const timeout = Math.min(1000 * Math.pow(2, retryCount), 10000);
    setTimeout(() => revalidate({ retryCount }), timeout);
  },
};

// Provider component for wrapping the app
export function SWRProvider({ children }: { children: React.ReactNode }) {
  return SWRConfig({ value: swrConfig, children });
}

// Utility functions for cache management
export const swrUtils = {
  // Clear all SWR cache
  clearCache: () => {
    if (typeof window !== 'undefined') {
      // This will clear all SWR cache
      window.location.reload();
    }
  },

  // Clear specific cache keys
  clearGameCache: (gameId: string) => {
    // Implementation would depend on accessing the SWR cache
    // For now, we'll rely on the refresh methods in hooks
  },

  // Preload game data
  preloadGame: async (gameId: string) => {
    try {
      const { getGameState } = await import('@/lib/actions/gameActions');
      return await getGameState(gameId);
    } catch (error) {
      console.error('Failed to preload game:', error);
      return null;
    }
  },
};

// Real-time update utilities (for future Prisma Pulse integration)
export const realtimeUtils = {
  // Setup game subscription with Prisma Pulse (placeholder)
  setupGameSubscription: (gameId: string, onUpdate: (data: any) => void) => {
    // TODO: Implement with Prisma Pulse for true real-time subscriptions
    // Prisma Pulse provides WebSocket-based database change subscriptions

    // For now, return a cleanup function
    return () => {
      // Cleanup subscription
    };
  },

  // Check connection status (enhanced for Accelerate)
  isConnected: () => {
    // With Prisma Accelerate: connection pooling is handled automatically
    // With Prisma Pulse: would check WebSocket connection status
    return true;
  },

  // Reconnect logic (for future Pulse integration)
  reconnect: () => {
    // TODO: Implement reconnection logic for Prisma Pulse
    console.log(
      'Accelerate: Using connection pooling, no manual reconnection needed'
    );
  },

  // Performance: Leverage Accelerate caching
  getCacheStats: () => {
    // TODO: Add metrics when available from Accelerate
    return { hits: 0, misses: 0, latency: 0 };
  },
};
