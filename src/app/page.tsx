'use client';

import {
  Box,
  Typography,
  Container,
  Button,
  Stack,
  Card,
  CardContent,
  CardActions,
  Chip,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  DiamondOutlined,
  PlayArrow,
  Person,
  Add,
  Visibility,
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import { useUserMatches } from '@/hooks/useGame';
import { MainLayout } from '@/components/layout';
import { createMatch } from '@/lib/actions/gameActions';
import { theme } from '@/lib/theme';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function HomePage() {
  const { user, isAuthenticated, isLoading, signIn } = useAuth();
  const {
    matches: userMatches,
    isLoading: matchesLoading,
    refresh,
  } = useUserMatches();
  const router = useRouter();

  const [createMatchLoading, setCreateMatchLoading] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    severity: 'success' | 'error';
  } | null>(null);

  const handleSignIn = () => {
    signIn('discord');
  };

  const handleCreateMatch = async () => {
    if (createMatchLoading) return;

    setCreateMatchLoading(true);
    try {
      const result = await createMatch();

      if (result.success && result.matchId) {
        setNotification({
          message: 'Match created successfully!',
          severity: 'success',
        });
        // Refresh the matches list
        refresh();
        // Navigate to the new match
        router.push(`/match/${result.matchId}`);
      } else {
        setNotification({
          message: result.error || 'Failed to create match',
          severity: 'error',
        });
      }
    } catch (error) {
      console.error('Error creating match:', error);
      setNotification({
        message: 'An error occurred while creating the match',
        severity: 'error',
      });
    } finally {
      setCreateMatchLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <MainLayout showBackground={false}>
        <Container maxWidth="lg">
          <Box
            sx={{
              minHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              py: 4,
            }}
          >
            {/* Hero Section */}
            <Box sx={{ mb: { xs: 4, md: 6 } }}>
              {' '}
              {/* Less spacing on mobile */}
              <DiamondOutlined
                sx={{
                  fontSize: { xs: 80, md: 120 }, // Smaller on mobile
                  color: 'primary.main',
                  mb: 2,
                  transform: 'rotate(45deg)',
                }}
              />
              <Typography
                variant="h1"
                component="h1"
                sx={{
                  mb: 2,
                  fontSize: { xs: '2.5rem', md: '3.5rem' }, // Responsive font size
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Diamond Chess
              </Typography>
              <Typography
                variant="h5"
                component="h2"
                color="text.secondary"
                sx={{
                  mb: 4,
                  fontSize: { xs: '1.2rem', md: '1.5rem' },
                  px: { xs: 2, md: 0 },
                }}
              >
                Experience chess like never before on a rotated board with
                unique pawn mechanics
              </Typography>
            </Box>

            {/* Sign In Button */}
            <Button
              variant="contained"
              size="large"
              startIcon={<Person />}
              onClick={handleSignIn}
              disabled={isLoading}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                color: theme.palette.background.default,
                '&:hover': {
                  background: `linear-gradient(45deg, ${theme.palette.primary.light}, ${theme.palette.secondary.light})`,
                },
                mb: 6,
              }}
            >
              {isLoading ? 'Loading...' : 'Sign In with Discord'}
            </Button>

            {/* Game Rules Preview */}
            <Box
              sx={{
                backgroundColor: 'background.paper',
                borderRadius: 2,
                p: 4,
                border: '1px solid',
                borderColor: 'primary.main',
                borderOpacity: 0.2,
              }}
            >
              <Typography variant="h6" sx={{ mb: 2 }}>
                How Diamond Chess Works
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                Diamond Chess transforms the classic game by rotating the board
                45 degrees, creating a diamond orientation that changes how
                pieces move and interact. Pawns have unique movement patterns in
                this orientation!
              </Typography>
              <Button
                component={Link}
                href="/board-test"
                variant="outlined"
                startIcon={<Visibility />}
                sx={{ mt: 2 }}
              >
                See the Board
              </Button>
            </Box>
          </Box>
        </Container>

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

  return (
    <MainLayout>
      <Box sx={{ py: 4 }}>
        {/* Welcome Section */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Welcome back, {user?.name}! 👋
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Ready to play some Diamond Chess?
          </Typography>
        </Box>

        {/* Quick Actions */}
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={3}
            justifyContent="center"
          >
            <Button
              variant="contained"
              size="large"
              startIcon={<Add />}
              onClick={handleCreateMatch}
              disabled={createMatchLoading}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                color: theme.palette.background.default,
                '&:hover': {
                  background: `linear-gradient(45deg, ${theme.palette.primary.light}, ${theme.palette.secondary.light})`,
                },
                '&:disabled': {
                  background: `rgba(255, 0, 128, 0.3)`,
                  color: `rgba(255, 255, 255, 0.5)`,
                },
              }}
            >
              {createMatchLoading ? 'Creating...' : 'Create New Match'}
            </Button>
            <Button
              component={Link}
              href="/board-test"
              variant="outlined"
              size="large"
              startIcon={<Visibility />}
              sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
            >
              View Board Test
            </Button>
          </Stack>
        </Box>

        {/* Your Matches Section */}
        <Box>
          <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
            Your Matches
          </Typography>

          {userMatches.length === 0 ? (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="h6">No matches yet!</Typography>
              <Typography>
                Create your first match to start playing Diamond Chess.
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
                },
                gap: 3,
              }}
            >
              {userMatches.map((match: any) => (
                <Card
                  key={match.id}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      Match #{match.id.slice(-6)}
                    </Typography>
                    <Stack spacing={1}>
                      <Chip
                        label={match.status.replace('_', ' ').toUpperCase()}
                        color={
                          match.status === 'IN_PROGRESS'
                            ? 'success'
                            : match.status === 'WAITING_FOR_PLAYER'
                              ? 'warning'
                              : 'default'
                        }
                        size="small"
                      />
                      <Typography variant="body2" color="text.secondary">
                        Created:{' '}
                        {new Date(match.createdAt).toLocaleDateString()}
                      </Typography>
                      {match.games && match.games.length > 0 && (
                        <Typography variant="body2" color="text.secondary">
                          Game #{match.games[0].gameNumber}
                        </Typography>
                      )}
                    </Stack>
                  </CardContent>
                  <CardActions>
                    <Button
                      component={Link}
                      href={`/match/${match.id}`}
                      size="small"
                      startIcon={<PlayArrow />}
                    >
                      {match.status === 'WAITING_FOR_PLAYER' ? 'Join' : 'View'}
                    </Button>
                  </CardActions>
                </Card>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </MainLayout>
  );
}
