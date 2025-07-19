'use client';

import {
  Card,
  CardContent,
  Stack,
  Avatar,
  Box,
  Typography,
  Button,
} from '@mui/material';
import { Add, Login, Person } from '@mui/icons-material';
import { usePathname, useRouter } from 'next/navigation';
import type { PieceColor } from '@/types/game';
import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useAuth } from '@/hooks/useAuth';
import { createMatch } from '@/lib/firestore-actions';
import { chessAnalytics } from '@/lib/analytics';
import React from 'react';

interface PlayerCardProps {
  player: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
  color: PieceColor;
  isMyTurn: boolean;
  isCurrentUser: boolean;
  position: 'top-left' | 'bottom-right';
  boardSize: number;
  winStatus?: 'winner' | 'loser' | null;
}

export default function PlayerCard({
  player,
  color,
  isMyTurn,
  isCurrentUser,
  position,
  boardSize,
  winStatus,
}: PlayerCardProps) {
  const { isMobile } = useBreakpoints();
  const { user, isAuthenticated, signIn } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Detect if we're in a match route
  const isInMatchRoute = pathname?.startsWith('/match/');

  // Add global CSS for winner pulse animation
  const injectPulseStyles = () => {
    if (typeof window !== 'undefined') {
      const existingStyle = document.getElementById('winner-pulse-styles');
      if (!existingStyle) {
        const style = document.createElement('style');
        style.id = 'winner-pulse-styles';
        style.textContent = `
          .winner-pulse {
            animation: winner-pulse 2s ease-in-out infinite;
          }
          
          @keyframes winner-pulse {
            0%, 100% {
              transform: scale(1);
              box-shadow: 0 4px 20px rgba(76, 175, 80, 0.3);
            }
            50% {
              transform: scale(1.02);
              box-shadow: 0 6px 25px rgba(76, 175, 80, 0.5);
            }
          }
        `;
        document.head.appendChild(style);
      }
    }
  };

  // Inject pulse styles when component mounts
  React.useEffect(() => {
    if (winStatus === 'winner') {
      injectPulseStyles();
    }
  }, [winStatus]);

  // Calculate position relative to board
  const getCardPosition = () => {
    const xDistance = isMobile ? '90px' : '5%';
    const yDistance = isMobile ? '90px' : '20%';
    return {
      position: 'absolute' as const,
      top: position === 'top-left' ? yDistance : undefined,
      left: position === 'top-left' ? xDistance : undefined,
      right: position === 'top-left' ? undefined : xDistance,
      bottom: position === 'top-left' ? undefined : yDistance,
      width: isMobile ? 'auto' : 240,
    };
  };

  const getWinnerStyles = () => {
    if (winStatus === 'winner') {
      return {
        border: '3px solid',
        borderColor: 'success.main',
        background:
          'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(56, 142, 60, 0.05) 100%)',
      };
    }
    if (winStatus === 'loser') {
      return {
        border: '2px solid',
        borderColor: 'error.light',
        opacity: 0.8,
      };
    }
    return {};
  };

  const getTurnStyles = () => {
    if (winStatus) return {}; // Don't show turn styles if game is over

    if (isMyTurn) {
      return {
        border: '2px solid',
        borderColor: 'warning.main',
        background:
          'linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 160, 0, 0.05) 100%)',
        boxShadow: '0 4px 20px rgba(255, 193, 7, 0.2)',
      };
    }
    return {};
  };

  // Handle actions for demo mode
  const handleWhitePlayerAction = () => {
    if (isAuthenticated && user) {
      router.push(`/user/${user.id}`);
    } else {
      signIn('discord');
    }
  };

  const handleBlackPlayerAction = async () => {
    try {
      const result = await createMatch();
      if (result.success && result.matchId) {
        // Track successful match creation
        chessAnalytics.trackMatchCreated(result.matchId);
        router.push(`/match/${result.matchId}`);
      }
    } catch (error) {
      console.error('Error creating match:', error);
    }
  };

  // Demo mode: Not in match route
  if (!isInMatchRoute) {
    // White player (bottom-right): Current user or sign in CTA
    if (color === 'WHITE') {
      const whiteContent = (
        <Stack direction="row" spacing={1} alignItems="center">
          <Avatar
            src={isAuthenticated && user ? user.image || undefined : undefined}
            sx={{
              width: isMobile ? 64 : 36,
              height: isMobile ? 64 : 36,
              bgcolor: 'grey.100',
              color: 'grey.800',
            }}
          >
            {isAuthenticated && user ? user.name?.charAt(0) || '?' : <Login />}
          </Avatar>
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              display: {
                xs: 'none',
                md: 'block',
              },
            }}
          >
            <Typography
              variant="body2"
              noWrap
              sx={{
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            >
              {isAuthenticated && user ? user.name || 'You' : 'Sign In to Play'}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: 'grey.100',
                  border: '1px solid grey.400',
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 400,
                  fontSize: '0.75rem',
                }}
              >
                {isAuthenticated && user
                  ? 'WHITE • Click for profile'
                  : 'WHITE • Join with Discord'}
              </Typography>
            </Stack>
          </Box>
        </Stack>
      );

      return isMobile ? (
        <Box sx={{ ...getCardPosition() }}>{whiteContent}</Box>
      ) : (
        <Card
          sx={{
            ...getCardPosition(),
            bgcolor: 'background.paper',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            '&:hover': {
              transform: 'scale(1.02)',
              boxShadow: 4,
            },
          }}
          onClick={handleWhitePlayerAction}
        >
          <CardContent
            sx={{
              p: isMobile ? 2 : 1.5,
              '&:last-child': { pb: isMobile ? 2 : 1.5 },
            }}
          >
            {whiteContent}
          </CardContent>
        </Card>
      );
    }

    // Black player (top-left): Create match CTA
    const blackContent = (
      <Stack direction="row" spacing={1} alignItems="center">
        <Avatar
          sx={{
            width: isMobile ? 64 : 36,
            height: isMobile ? 64 : 36,
            bgcolor: 'grey.800',
            color: 'grey.100',
          }}
        >
          <Add />
        </Avatar>
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: {
              xs: 'none',
              md: 'block',
            },
          }}
        >
          <Typography
            variant="body2"
            noWrap
            sx={{
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            Create Match
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: 'grey.800',
                border: '1px solid grey.600',
              }}
            />
            <Typography
              variant="caption"
              sx={{
                fontWeight: 400,
                fontSize: '0.75rem',
              }}
            >
              BLACK • Play vs opponent
            </Typography>
          </Stack>
        </Box>
      </Stack>
    );

    return isMobile ? (
      <Box sx={{ ...getCardPosition() }}>{blackContent}</Box>
    ) : (
      <Card
        sx={{
          ...getCardPosition(),
          bgcolor: 'background.paper',
          backdropFilter: 'blur(8px)',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          '&:hover': {
            transform: 'scale(1.02)',
            boxShadow: 4,
          },
        }}
        onClick={handleBlackPlayerAction}
      >
        <CardContent
          sx={{
            p: isMobile ? 2 : 1.5,
            '&:last-child': { pb: isMobile ? 2 : 1.5 },
          }}
        >
          {blackContent}
        </CardContent>
      </Card>
    );
  }

  // Regular match mode: Show actual player info
  const matchContent = (
    <Stack direction="row" spacing={1} alignItems="center">
      <Avatar
        src={player?.image || undefined}
        sx={{
          width: isMobile ? 64 : 36,
          height: isMobile ? 64 : 36,
          bgcolor: color === 'WHITE' ? 'grey.100' : 'grey.800',
          color: color === 'WHITE' ? 'grey.800' : 'grey.100',
        }}
      >
        {player?.name?.charAt(0) || '?'}
      </Avatar>
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: {
            xs: 'none',
            md: 'block',
          },
        }}
      >
        <Typography
          variant="body2"
          noWrap
          sx={{
            fontWeight: 600,
            color: isMyTurn ? 'inherit' : 'text.primary',
            fontSize: '0.875rem',
          }}
        >
          {player?.name || 'Anonymous'}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: color === 'WHITE' ? 'grey.100' : 'grey.800',
              border: '1px solid',
              borderColor: color === 'WHITE' ? 'grey.400' : 'grey.600',
            }}
          />
          <Typography
            variant="caption"
            sx={{
              color: isMyTurn ? 'inherit' : 'text.secondary',
              fontWeight: isMyTurn ? 600 : 400,
              fontSize: '0.75rem',
            }}
          >
            {winStatus
              ? color // Just show color when game is complete
              : `${color} • ${isMyTurn ? 'Your Turn!' : 'Waiting...'}`}
          </Typography>
        </Stack>
      </Box>
    </Stack>
  );

  return (
    <Card
      className={winStatus === 'winner' ? 'winner-pulse' : ''}
      sx={{
        ...getCardPosition(),
        ...getWinnerStyles(),
        ...getTurnStyles(),
        bgcolor: 'background.paper',
        backdropFilter: 'blur(8px)',
        transition: 'all 0.3s ease',
        '&:hover':
          isMyTurn && !winStatus
            ? {
                transform: 'scale(1.02)',
                boxShadow: '0 6px 25px rgba(255, 193, 7, 0.3)',
              }
            : {},
      }}
    >
      <CardContent
        sx={{
          p: isMobile ? 2 : 1.5,
          '&:last-child': { pb: isMobile ? 2 : 1.5 },
        }}
      >
        {matchContent}
      </CardContent>
    </Card>
  );
}
