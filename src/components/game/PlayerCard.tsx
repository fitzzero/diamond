'use client';

import {
  Card,
  CardContent,
  Stack,
  Avatar,
  Box,
  Typography,
} from '@mui/material';
import type { PieceColor } from '@/types/game';
import { useBreakpoints } from '@/hooks/useBreakpoints';

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
  winStatus?: 'winner' | 'loser' | null; // Add win/loss status
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
            0% {
              box-shadow: 0 0 15px rgba(46, 125, 50, 0.5) !important;
            }
            50% {
              box-shadow: 0 0 25px rgba(46, 125, 50, 0.9) !important;
            }
            100% {
              box-shadow: 0 0 15px rgba(46, 125, 50, 0.5) !important;
            }
          }
        `;
        document.head.appendChild(style);
      }
    }
  };

  // Inject styles on mount
  if (winStatus === 'winner') {
    injectPulseStyles();
  }

  const xDistance = isMobile ? '100px' : '10%';
  const yDistance = isMobile ? '100px' : '20%';
  const positioning: any = {
    position: 'absolute',
    top: position === 'top-left' ? yDistance : undefined,
    left: position === 'top-left' ? xDistance : undefined,
    right: position === 'top-left' ? undefined : xDistance,
    bottom: position === 'top-left' ? undefined : yDistance,
  };

  // Determine styling based on win status
  const getWinStatusStyling = () => {
    if (winStatus === 'winner') {
      return {
        bgcolor: 'background.paper', // Keep default background
        color: 'text.primary', // Keep default text color
        borderColor: 'success.main',
        boxShadow: '0 0 20px rgba(46, 125, 50, 0.7)',
        '&:hover': {
          boxShadow: '0 0 25px rgba(46, 125, 50, 0.9)',
        },
      };
    } else if (winStatus === 'loser') {
      return {
        bgcolor: 'background.paper', // Keep default background
        color: 'text.primary', // Keep default text color
        borderColor: 'error.main',
        boxShadow: '0 0 15px rgba(211, 47, 47, 0.6)',
      };
    } else if (isMyTurn) {
      return {
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        borderColor: 'primary.main',
        boxShadow: 4,
      };
    } else {
      return {
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderColor: 'divider',
        boxShadow: 1,
      };
    }
  };

  const cardStyling = getWinStatusStyling();

  if (!player) {
    return (
      <Card
        sx={{
          ...positioning,
          minWidth: 180,
          bgcolor: 'background.paper',
          border: '2px solid',
          borderColor: 'divider',
          zIndex: 10,
        }}
      >
        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Typography variant="body2" color="text.secondary">
            Waiting for player...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const content = (
    <Stack direction="row" spacing={1} alignItems="center">
      <Avatar
        src={player.image || undefined}
        sx={{
          width: isMobile ? 64 : 36,
          height: isMobile ? 64 : 36,
          bgcolor: color === 'WHITE' ? 'grey.100' : 'grey.800',
          color: color === 'WHITE' ? 'grey.800' : 'grey.100',
        }}
      >
        {player.name?.charAt(0) || '?'}
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
          {player.name || 'Anonymous'}
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

  return isMobile ? (
    <Box
      sx={{
        ...positioning,
      }}
    >
      {content}
    </Box>
  ) : (
    <Card
      className={winStatus === 'winner' ? 'winner-pulse' : ''}
      sx={{
        ...positioning,
        ...cardStyling,
        transition: 'all 0.3s ease',
        zIndex: 10,
      }}
    >
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        {content}
      </CardContent>
    </Card>
  );
}
