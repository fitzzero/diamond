'use client';

import {
  Card,
  CardContent,
  Stack,
  Avatar,
  Box,
  Typography,
  Button,
  IconButton,
} from '@mui/material';
import { Person, Add, Login, AccountCircle } from '@mui/icons-material';
import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import type { PieceColor } from '@/types/game';

interface HomePlayerIndicatorProps {
  color: PieceColor;
  position: 'top-left' | 'bottom-right';
  boardSize: number;
  onCreateMatch?: () => void;
  onSignIn?: () => void;
}

export default function HomePlayerIndicator({
  color,
  position,
  boardSize,
  onCreateMatch,
  onSignIn,
}: HomePlayerIndicatorProps) {
  const { isMobile } = useBreakpoints();
  const { user, isAuthenticated, signIn } = useAuth();
  const router = useRouter();

  // Calculate position relative to board (similar to PlayerCard)
  const getCardPosition = () => {
    const cardSize = isMobile ? 200 : 180;
    const offset = isMobile ? -100 : -90;

    if (position === 'top-left') {
      return {
        position: 'absolute' as const,
        top: offset,
        left: offset,
        width: cardSize,
        zIndex: 10,
      };
    } else {
      return {
        position: 'absolute' as const,
        bottom: offset,
        right: offset,
        width: cardSize,
        zIndex: 10,
      };
    }
  };

  const handleWhitePlayerAction = () => {
    if (isAuthenticated && user) {
      // Navigate to user profile
      router.push(`/user/${user.id}`);
    } else {
      // Sign in
      if (onSignIn) {
        onSignIn();
      } else {
        signIn('discord');
      }
    }
  };

  const handleBlackPlayerAction = () => {
    if (onCreateMatch) {
      onCreateMatch();
    }
  };

  // White player indicator (current user or sign in CTA)
  if (color === 'WHITE') {
    return (
      <Card
        sx={{
          ...getCardPosition(),
          background:
            isAuthenticated && user
              ? 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,245,245,0.95) 100%)'
              : 'linear-gradient(135deg, rgba(25,118,210,0.95) 0%, rgba(21,101,192,0.95) 100%)',
          backdropFilter: 'blur(10px)',
          border: '2px solid',
          borderColor: isAuthenticated && user ? 'grey.300' : 'primary.main',
          boxShadow: 4,
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'scale(1.02)',
            boxShadow: 6,
          },
        }}
        onClick={handleWhitePlayerAction}
      >
        <CardContent sx={{ p: 2 }}>
          {isAuthenticated && user ? (
            // Logged in: Show user profile preview
            <Stack spacing={1.5} alignItems="center">
              <Avatar
                src={user.image || undefined}
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: 'grey.100',
                  color: 'grey.800',
                  border: '3px solid white',
                }}
              >
                {user.name?.charAt(0) || '?'}
              </Avatar>

              <Box textAlign="center">
                <Typography
                  variant="body1"
                  fontWeight={600}
                  color="text.primary"
                  noWrap
                >
                  {user.name || 'You'}
                </Typography>
                <Stack
                  direction="row"
                  spacing={0.5}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: 'grey.100',
                      border: '1px solid grey.400',
                    }}
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={500}
                  >
                    WHITE
                  </Typography>
                </Stack>
              </Box>

              <Typography
                variant="caption"
                color="primary.main"
                fontWeight={600}
                textAlign="center"
              >
                Click to view profile
              </Typography>
            </Stack>
          ) : (
            // Not logged in: Sign in CTA
            <Stack spacing={1.5} alignItems="center">
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: '3px solid rgba(255,255,255,0.3)',
                }}
              >
                <Login />
              </Avatar>

              <Box textAlign="center">
                <Typography variant="body1" fontWeight={600} color="white">
                  Sign In to Play
                </Typography>
                <Stack
                  direction="row"
                  spacing={0.5}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: 'rgba(255,255,255,0.8)',
                      border: '1px solid rgba(255,255,255,0.6)',
                    }}
                  />
                  <Typography
                    variant="caption"
                    color="rgba(255,255,255,0.9)"
                    fontWeight={500}
                  >
                    WHITE
                  </Typography>
                </Stack>
              </Box>

              <Typography
                variant="caption"
                color="rgba(255,255,255,0.8)"
                fontWeight={500}
                textAlign="center"
              >
                Join with Discord
              </Typography>
            </Stack>
          )}
        </CardContent>
      </Card>
    );
  }

  // Black player indicator (create match CTA)
  return (
    <Card
      sx={{
        ...getCardPosition(),
        background:
          'linear-gradient(135deg, rgba(46,125,50,0.95) 0%, rgba(27,94,32,0.95) 100%)',
        backdropFilter: 'blur(10px)',
        border: '2px solid',
        borderColor: 'success.main',
        boxShadow: 4,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'scale(1.02)',
          boxShadow: 6,
          background:
            'linear-gradient(135deg, rgba(56,142,60,0.95) 0%, rgba(27,94,32,0.95) 100%)',
        },
      }}
      onClick={handleBlackPlayerAction}
    >
      <CardContent sx={{ p: 2 }}>
        <Stack spacing={1.5} alignItems="center">
          <Avatar
            sx={{
              width: 48,
              height: 48,
              bgcolor: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '3px solid rgba(255,255,255,0.3)',
            }}
          >
            <Add fontSize="large" />
          </Avatar>

          <Box textAlign="center">
            <Typography variant="body1" fontWeight={600} color="white">
              Create Match
            </Typography>
            <Stack
              direction="row"
              spacing={0.5}
              alignItems="center"
              justifyContent="center"
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: 'grey.800',
                  border: '1px solid grey.600',
                }}
              />
              <Typography
                variant="caption"
                color="rgba(255,255,255,0.9)"
                fontWeight={500}
              >
                BLACK
              </Typography>
            </Stack>
          </Box>

          <Typography
            variant="caption"
            color="rgba(255,255,255,0.8)"
            fontWeight={500}
            textAlign="center"
          >
            Play vs a real opponent
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
