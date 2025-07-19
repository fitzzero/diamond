'use client';

import { Box, Typography, Alert, Snackbar } from '@mui/material';
import { useAuth } from '@/hooks/useAuth';
import { useUserMatchesRealtime } from '@/hooks/useFirestoreGame';
import { MainLayout } from '@/components/layout';
import { DemoGameBoard, CompactMatchCard } from '@/components/game';
import { useState, useEffect } from 'react';
import { chessAnalytics, trackPageView } from '@/lib/analytics';

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const {
    matches: userMatches,
    isLoading: matchesLoading,
    refresh,
  } = useUserMatchesRealtime();

  const [notification, setNotification] = useState<{
    message: string;
    severity: 'success' | 'error';
  } | null>(null);

  // Real-time hook already sorts matches (active first, then most recent)
  const sortedMatches = isAuthenticated ? userMatches : [];

  // Track homepage visits
  useEffect(() => {
    trackPageView('homepage');
    chessAnalytics.trackHomepageVisited(isAuthenticated);
  }, [isAuthenticated]);

  return (
    <MainLayout>
      <Box sx={{ py: 4 }}>
        {/* Demo Game Board - Always Visible */}
        <Box sx={{ mb: 6 }}>
          <DemoGameBoard
            showTurnIndicator={false}
            showMoveCounter={false}
            showGameStatus={false}
          />
        </Box>

        {/* Match History - Only for Authenticated Users */}
        {isAuthenticated && (
          <Box>
            <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
              Your Matches
            </Typography>

            {sortedMatches.length === 0 ? (
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="h6">No matches yet!</Typography>
                <Typography>
                  Click the "Create Match" button above to start playing against
                  others.
                </Typography>
              </Alert>
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)',
                    lg: 'repeat(4, 1fr)',
                  },
                  gap: 2,
                }}
              >
                {sortedMatches.map((match: any) => (
                  <CompactMatchCard
                    key={match.id}
                    match={match}
                    currentUserId={user?.id}
                  />
                ))}
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Notification Snackbar */}
      {notification && (
        <Snackbar
          open={true}
          autoHideDuration={6000}
          onClose={() => setNotification(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setNotification(null)}
            severity={notification.severity}
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      )}
    </MainLayout>
  );
}
