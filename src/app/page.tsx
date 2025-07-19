'use client';

import { Box, Typography, Alert, Snackbar } from '@mui/material';
import { useAuth } from '@/hooks/useAuth';
import { useUserMatchesRealtime } from '@/hooks/useFirestoreGame';
import { MainLayout } from '@/components/layout';
import { DemoGameBoard, CompactMatchCard } from '@/components/game';
import { useState, useEffect } from 'react';
import { chessAnalytics, trackPageView } from '@/lib/analytics';
import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useRecentCompletedMatches } from '@/hooks/useFirestoreGame';
import { Avatar, Stack } from '@mui/material';
import Link from 'next/link';

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const { isMobile } = useBreakpoints();
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

  const { matches: recentMatches, isLoading: recentLoading } =
    useRecentCompletedMatches();

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

        {isMobile && !isAuthenticated && (
          <Typography variant="body1" align="center" sx={{ mb: 4 }}>
            Sign in to create or join matches with friends
          </Typography>
        )}

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

        {/* Recent Matches Ticker */}
        <Box sx={{ mt: 6 }}>
          <Typography variant="h6" gutterBottom>
            Recent Matches
          </Typography>
          <Stack
            direction="row"
            spacing={2}
            sx={{ overflowX: 'auto', pb: 2, mt: 2 }}
          >
            {recentMatches.map(match => {
              const winner =
                match.winnerId === match.player1Id
                  ? match.player1
                  : match.player2;
              const loser =
                match.winnerId === match.player1Id
                  ? match.player2
                  : match.player1;
              return (
                <Link
                  href={`/match/${match.id}`}
                  key={match.id}
                  style={{ textDecoration: 'none' }}
                >
                  <Box
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      p: 1,
                      minWidth: 120,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Avatar
                        src={winner?.image || undefined}
                        sx={{
                          border: '2px solid',
                          borderColor: 'success.main',
                          boxShadow: '0 0 8px rgba(76, 175, 80, 0.5)',
                        }}
                      >
                        {winner?.name?.[0]}
                      </Avatar>
                      <Avatar src={loser?.image || undefined}>
                        {loser?.name?.[0]}
                      </Avatar>
                    </Stack>
                  </Box>
                </Link>
              );
            })}
          </Stack>
        </Box>
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
