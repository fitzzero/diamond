'use client';

import { useMemo } from 'react';
import {
  Box,
  Typography,
  Alert,
  Chip,
  Card,
  CardContent,
  Stack,
  Avatar,
  LinearProgress,
  Divider,
  Paper,
} from '@mui/material';
import {
  Warning,
  CheckCircle,
  Cancel,
  Timer,
  EmojiEvents,
  Shield,
  SportsEsports,
  Person,
} from '@mui/icons-material';
import type { PieceColor, Move } from '@/types/game';

interface GameStatusProps {
  currentTurn: PieceColor;
  gameStatus: string;
  moves: Move[];
  whitePlayer?: { id: string; name: string; image?: string };
  blackPlayer?: { id: string; name: string; image?: string };
  currentUserId?: string;
  matchStatus: string;
}

export default function GameStatus({
  currentTurn,
  gameStatus,
  moves,
  whitePlayer,
  blackPlayer,
  currentUserId,
  matchStatus,
}: GameStatusProps) {
  // Calculate game state from moves
  const gameState = useMemo(() => {
    if (moves.length === 0) {
      return { type: 'waiting', message: 'Game ready to start' };
    }

    const lastMove = moves[moves.length - 1];

    if (lastMove.isCheckmate) {
      const winner = lastMove.piece.color;
      return {
        type: 'checkmate',
        message: `${winner === 'WHITE' ? whitePlayer?.name || 'White' : blackPlayer?.name || 'Black'} wins by checkmate!`,
        winner,
        icon: <EmojiEvents />,
        severity: 'error' as const,
      };
    }

    if (lastMove.isStalemate) {
      return {
        type: 'stalemate',
        message: 'Game drawn by stalemate',
        icon: <Shield />,
        severity: 'info' as const,
      };
    }

    if (lastMove.isCheck) {
      const inCheckPlayer = currentTurn;
      const playerName =
        inCheckPlayer === 'WHITE'
          ? whitePlayer?.name || 'White'
          : blackPlayer?.name || 'Black';

      return {
        type: 'check',
        message: `${playerName} is in check!`,
        icon: <Warning />,
        severity: 'warning' as const,
        inCheck: inCheckPlayer,
      };
    }

    return {
      type: 'active',
      message: 'Game in progress',
    };
  }, [moves, currentTurn, whitePlayer, blackPlayer]);

  const getCurrentPlayer = () => {
    return currentTurn === 'WHITE' ? whitePlayer : blackPlayer;
  };

  const getOpponentPlayer = () => {
    return currentTurn === 'WHITE' ? blackPlayer : whitePlayer;
  };

  const isCurrentUserTurn = () => {
    const currentPlayer = getCurrentPlayer();
    return currentPlayer?.id === currentUserId;
  };

  const getMoveCount = () => {
    return Math.ceil(moves.length / 2);
  };

  // Render turn indicator
  const renderTurnIndicator = () => {
    const currentPlayer = getCurrentPlayer();
    const isUserTurn = isCurrentUserTurn();

    if (matchStatus !== 'IN_PROGRESS') {
      return (
        <Paper
          elevation={2}
          sx={{
            p: 2,
            textAlign: 'center',
            bgcolor: 'action.hover',
          }}
        >
          <Typography variant="h6" color="text.secondary">
            {matchStatus === 'WAITING_FOR_PLAYER'
              ? 'Waiting for opponent...'
              : 'Game not in progress'}
          </Typography>
        </Paper>
      );
    }

    return (
      <Card
        elevation={3}
        sx={{
          bgcolor: isUserTurn ? 'primary.main' : 'background.paper',
          color: isUserTurn ? 'primary.contrastText' : 'text.primary',
          transition: 'all 0.3s ease',
          border: isUserTurn ? '2px solid' : '1px solid',
          borderColor: isUserTurn ? 'primary.light' : 'divider',
        }}
      >
        <CardContent sx={{ textAlign: 'center', py: 2 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="center"
            spacing={2}
          >
            <Avatar
              src={currentPlayer?.image}
              sx={{
                width: 40,
                height: 40,
                bgcolor: currentTurn === 'WHITE' ? 'grey.100' : 'grey.800',
                color: currentTurn === 'WHITE' ? 'grey.800' : 'grey.100',
              }}
            >
              {currentPlayer?.name?.[0]?.toUpperCase() || <Person />}
            </Avatar>

            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {currentPlayer?.name ||
                  (currentTurn === 'WHITE' ? 'White' : 'Black')}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                {isUserTurn ? 'Your turn' : 'Thinking...'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {currentTurn === 'WHITE' ? '⚪' : '⚫'}
              {isUserTurn && (
                <Timer sx={{ animation: 'pulse 1.5s infinite' }} />
              )}
            </Box>
          </Stack>

          {isUserTurn && (
            <LinearProgress
              sx={{
                mt: 2,
                height: 4,
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.2)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: 'rgba(255,255,255,0.8)',
                },
              }}
            />
          )}
        </CardContent>
      </Card>
    );
  };

  // Render game status alerts
  const renderGameStatusAlert = () => {
    if (gameState.type === 'waiting' || gameState.type === 'active') {
      return null;
    }

    return (
      <Alert
        severity={gameState.severity}
        icon={gameState.icon}
        sx={{
          fontSize: '1rem',
          fontWeight: 'bold',
          '& .MuiAlert-icon': {
            fontSize: '1.5rem',
          },
        }}
      >
        <Typography variant="h6" component="div">
          {gameState.message}
        </Typography>
        {gameState.type === 'checkmate' && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            Game over! {gameState.winner === 'WHITE' ? 'White' : 'Black'} has
            won the match.
          </Typography>
        )}
        {gameState.type === 'check' && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            The king must be moved to safety or the check must be blocked.
          </Typography>
        )}
      </Alert>
    );
  };

  // Render player info cards
  const renderPlayerCards = () => {
    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        {/* White Player */}
        <Card
          variant="outlined"
          sx={{
            bgcolor:
              currentTurn === 'WHITE' ? 'action.selected' : 'background.paper',
            borderColor: currentTurn === 'WHITE' ? 'primary.main' : 'divider',
          }}
        >
          <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="center"
              spacing={1}
            >
              <Avatar
                src={whitePlayer?.image}
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: 'grey.100',
                  color: 'grey.800',
                }}
              >
                {whitePlayer?.name?.[0]?.toUpperCase() || 'W'}
              </Avatar>
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {whitePlayer?.name || 'White'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ⚪ White pieces
                </Typography>
              </Box>
            </Stack>
            {currentTurn === 'WHITE' && (
              <Chip
                label="Current turn"
                size="small"
                color="primary"
                sx={{ mt: 1 }}
              />
            )}
          </CardContent>
        </Card>

        {/* Black Player */}
        <Card
          variant="outlined"
          sx={{
            bgcolor:
              currentTurn === 'BLACK' ? 'action.selected' : 'background.paper',
            borderColor: currentTurn === 'BLACK' ? 'primary.main' : 'divider',
          }}
        >
          <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="center"
              spacing={1}
            >
              <Avatar
                src={blackPlayer?.image}
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: 'grey.800',
                  color: 'grey.100',
                }}
              >
                {blackPlayer?.name?.[0]?.toUpperCase() || 'B'}
              </Avatar>
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {blackPlayer?.name || 'Black'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ⚫ Black pieces
                </Typography>
              </Box>
            </Stack>
            {currentTurn === 'BLACK' && (
              <Chip
                label="Current turn"
                size="small"
                color="primary"
                sx={{ mt: 1 }}
              />
            )}
          </CardContent>
        </Card>
      </Box>
    );
  };

  return (
    <Stack spacing={2}>
      {/* Game Status Alert */}
      {renderGameStatusAlert()}

      {/* Current Turn Indicator */}
      {renderTurnIndicator()}

      {/* Game Info */}
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Move #{getMoveCount()}
              </Typography>
              <Chip
                icon={<SportsEsports />}
                label={gameStatus || 'Active'}
                size="small"
                variant="outlined"
              />
            </Box>

            <Divider />

            {/* Player Cards */}
            {renderPlayerCards()}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
