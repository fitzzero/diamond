'use client';

import {
  Box,
  Typography,
  Container,
  Button,
  Stack,
  Avatar,
  Chip,
} from '@mui/material';
import {
  DiamondOutlined,
  PlayArrow,
  Person,
  Logout,
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';

export default function HomePage() {
  const { user, isAuthenticated, isLoading, signIn, signOut } = useAuth();

  const handleSignIn = () => {
    signIn('discord');
  };

  const handleSignOut = () => {
    signOut();
  };

  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          py: 4,
        }}
      >
        {/* User Status */}
        {isAuthenticated && user && (
          <Box sx={{ position: 'absolute', top: 20, right: 20 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                src={user.image || undefined}
                sx={{ width: 40, height: 40 }}
              >
                {user.name?.[0]?.toUpperCase()}
              </Avatar>
              <Stack spacing={0.5}>
                <Typography variant="body2" color="text.primary">
                  {user.name}
                </Typography>
                <Chip
                  label="Online"
                  size="small"
                  color="success"
                  sx={{ fontSize: '0.7rem', height: 20 }}
                />
              </Stack>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Logout />}
                onClick={handleSignOut}
                sx={{ ml: 2 }}
              >
                Sign Out
              </Button>
            </Stack>
          </Box>
        )}

        {/* Hero Section */}
        <Box sx={{ mb: 6 }}>
          <DiamondOutlined
            sx={{
              fontSize: 120,
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
              background: 'linear-gradient(45deg, #f5f5dc, #cd853f)',
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
            sx={{ mb: 4, maxWidth: 600 }}
          >
            Experience chess like never before on a rotated board with unique
            pawn mechanics
          </Typography>
        </Box>

        {/* Action Buttons */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={3}
          sx={{ mb: 6 }}
        >
          {isAuthenticated ? (
            <Button
              variant="contained"
              size="large"
              startIcon={<PlayArrow />}
              disabled={isLoading}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                background: 'linear-gradient(45deg, #f5f5dc, #cd853f)',
                color: '#1a1a1a',
                '&:hover': {
                  background: 'linear-gradient(45deg, #fffef7, #deb887)',
                },
              }}
            >
              Create Match
            </Button>
          ) : (
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
                background: 'linear-gradient(45deg, #f5f5dc, #cd853f)',
                color: '#1a1a1a',
                '&:hover': {
                  background: 'linear-gradient(45deg, #fffef7, #deb887)',
                },
              }}
            >
              {isLoading ? 'Loading...' : 'Sign In with Discord'}
            </Button>
          )}
        </Stack>

        {/* Game Rules Preview */}
        <Box
          sx={{
            backgroundColor: 'background.paper',
            borderRadius: 2,
            p: 4,
            maxWidth: 800,
            border: '1px solid',
            borderColor: 'primary.main',
            borderOpacity: 0.2,
          }}
        >
          <Typography variant="h6" sx={{ mb: 2 }}>
            How It Works
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Diamond Chess transforms the classic game by rotating the board 45
            degrees, creating a diamond orientation that changes how pieces move
            and interact.
          </Typography>
          {isAuthenticated && (
            <Typography variant="body2" color="success.main" sx={{ mt: 2 }}>
              Welcome back, {user?.name}! Ready to play some Diamond Chess?
            </Typography>
          )}
        </Box>
      </Box>
    </Container>
  );
}
