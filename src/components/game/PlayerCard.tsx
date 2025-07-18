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
}

export default function PlayerCard({
  player,
  color,
  isMyTurn,
  isCurrentUser,
  position,
  boardSize,
}: PlayerCardProps) {
  const { isMobile } = useBreakpoints();
  const xDistance = isMobile ? '100px' : '10%';
  const yDistance = isMobile ? '100px' : '20%';
  const positioning: any = {
    position: 'absolute',
    top: position === 'top-left' ? yDistance : undefined,
    left: position === 'top-left' ? xDistance : undefined,
    right: position === 'top-left' ? undefined : xDistance,
    bottom: position === 'top-left' ? undefined : yDistance,
  };
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
            {color} • {isMyTurn ? 'Your Turn!' : 'Waiting...'}
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
      sx={{
        ...positioning,
        bgcolor: isMyTurn ? 'primary.main' : 'background.paper',
        color: isMyTurn ? 'primary.contrastText' : 'text.primary',
        borderColor: isMyTurn ? 'primary.main' : 'divider',
        boxShadow: isMyTurn ? 4 : 1,
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
