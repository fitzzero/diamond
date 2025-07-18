'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Typography,
  Button,
  Stack,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  LinearProgress,
  Badge,
  Box,
} from '@mui/material';
import {
  PlayArrow,
  Share,
  ExitToApp,
  SignalWifi4Bar,
  SignalWifiOff,
  Refresh,
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import { useMatchSession } from '@/hooks/useGame';
import { MainLayout } from '@/components/layout';
import { DiamondBoard, MoveHistory } from '@/components/game';
import type { DiamondPosition, PieceColor, Move } from '@/types/game';
import { diamondCoords, chessCoords } from '@/lib/game/coordinates';
import { moveValidator } from '@/lib/game/moveValidation';

export default function MatchPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const matchId = params.id as string;

  const {
    match,
    game,
    isMatchLoading,
    isGameLoading,
    matchError,
    gameError,
    joinMatch,
    makeMove,
    refresh, // Single refresh function now
    realtimeStatus,
    isGameStarting,
  } = useMatchSession(matchId);

  const [selectedSquare, setSelectedSquare] = useState<DiamondPosition | null>(
    null
  );
  const [validMoves, setValidMoves] = useState<DiamondPosition[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [moveLoading, setMoveLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);

  // Auto-dismiss notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Clear selections when game changes or it's not the user's turn
  // Note: We need to calculate isMyTurn here to avoid hooks order issues
  const isPlayer1 = match?.player1Id === user?.id;
  const isPlayer2 = match?.player2Id === user?.id;
  const isParticipant = isPlayer1 || isPlayer2;
  const currentIsMyTurn =
    game &&
    isParticipant &&
    ((game.currentTurn === 'WHITE' && isPlayer1) ||
      (game.currentTurn === 'BLACK' && isPlayer2));

  useEffect(() => {
    if (!currentIsMyTurn || !game) {
      setSelectedSquare(null);
      setValidMoves([]);
    }
  }, [currentIsMyTurn, game?.currentTurn, game?.id]);

  const handleJoinMatch = async () => {
    if (joinLoading) return;
    setJoinLoading(true);
    try {
      await joinMatch();
      setNotification('Successfully joined! Game starting...');
    } catch (error) {
      setNotification(
        error instanceof Error ? error.message : 'Failed to join match'
      );
    } finally {
      setJoinLoading(false);
    }
  };

  const handleShareMatch = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setNotification('Match link copied to clipboard!');
    });
  };

  const handlePieceMove = async (from: ChessPosition, to: ChessPosition) => {
    if (moveLoading || !game || !isParticipant) return;

    const isMyTurn =
      (game.currentTurn === 'WHITE' && isPlayer1) ||
      (game.currentTurn === 'BLACK' && isPlayer2);
    if (!isMyTurn) {
      setNotification("It's not your turn!");
      return;
    }

    setMoveLoading(true);
    try {
      const piece = game.boardState.get(chessCoords.positionToKey(from));
      if (!piece) {
        setNotification('No piece at source position');
        return;
      }

      if (piece.color !== game.currentTurn) {
        setNotification('You can only move your own pieces');
        return;
      }

      const move: Move = { from, to, piece };
      await makeMove(move);
      setNotification('Move made successfully!');
      setSelectedSquare(null);
      setValidMoves([]);
    } catch (error) {
      setNotification(error instanceof Error ? error.message : 'Move failed');
    } finally {
      setMoveLoading(false);
    }
  };

  const handleManualRefresh = () => {
    refresh();
    setNotification('Refreshing...');
  };

  const handleSquareClick = (position: ChessPosition) => {
    if (
      !game ||
      !match ||
      !isParticipant ||
      match.status !== 'IN_PROGRESS' ||
      !isMyTurn ||
      moveLoading
    ) {
      return;
    }

    const pieceKey = chessCoords.positionToKey(position);
    const clickedPiece = game.boardState.get(pieceKey);

    // If no piece is selected
    if (!selectedSquare) {
      // Can only select own pieces
      if (clickedPiece && clickedPiece.color === game.currentTurn) {
        setSelectedSquare(position);

        // Calculate valid moves for this piece using proper move validation
        try {
          const allLegalMoves = moveValidator.getAllLegalMoves(
            game.boardState,
            game.currentTurn
          );
          const pieceMoves = allLegalMoves.filter(
            (move: Move) =>
              move.from.file === position.file &&
              move.from.rank === position.rank
          );
          setValidMoves(pieceMoves.map((move: Move) => move.to));
        } catch (error) {
          console.error('Error calculating moves:', error);
          setValidMoves([]);
        }
      }
      return;
    }

    // If clicking the same square, deselect
    if (
      selectedSquare.file === position.file &&
      selectedSquare.rank === position.rank
    ) {
      setSelectedSquare(null);
      setValidMoves([]);
      return;
    }

    // If selecting a different piece of the same color
    if (clickedPiece && clickedPiece.color === game.currentTurn) {
      setSelectedSquare(position);

      // Calculate valid moves for the new piece
      try {
        const allLegalMoves = moveValidator.getAllLegalMoves(
          game.boardState,
          game.currentTurn
        );
        const pieceMoves = allLegalMoves.filter(
          (move: Move) =>
            move.from.file === position.file && move.from.rank === position.rank
        );
        setValidMoves(pieceMoves.map((move: Move) => move.to));
      } catch (error) {
        console.error('Error calculating moves:', error);
        setValidMoves([]);
      }
      return;
    }

    // Try to make a move from selected square to clicked square
    const isValidMove = validMoves.some(
      move => move.file === position.file && move.rank === position.rank
    );

    if (isValidMove) {
      handlePieceMove(selectedSquare, position);
    } else {
      setNotification('Invalid move');
      // Clear selection if invalid move attempted
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  // Auth check
  if (!isAuthenticated) {
    return (
      <MainLayout>
        <Alert severity="warning">
          You must be signed in to view this match.
        </Alert>
      </MainLayout>
    );
  }

  // Loading state
  if (isMatchLoading) {
    return (
      <MainLayout>
        <Stack alignItems="center" spacing={2} sx={{ py: 8 }}>
          <CircularProgress size={60} />
          <Typography variant="h6" color="text.secondary">
            Loading match...
          </Typography>
        </Stack>
      </MainLayout>
    );
  }

  // Error state
  if (matchError || !match) {
    return (
      <MainLayout>
        <Stack spacing={2}>
          <Alert severity="error">{matchError || 'Match not found'}</Alert>
          <Button onClick={() => router.push('/')} variant="contained">
            Return Home
          </Button>
        </Stack>
      </MainLayout>
    );
  }

  const canJoin = match.status === 'WAITING_FOR_PLAYER' && !isParticipant;
  const isMyTurn = currentIsMyTurn; // Use the value calculated earlier

  return (
    <MainLayout>
      <Stack spacing={3}>
        {/* Header */}
        <Card
          sx={{
            display: 'relative',
            zIndex: 1,
            p: 2,
          }}
        >
          {isGameLoading || isGameStarting ? (
            <LinearProgress sx={{ mt: 2 }} />
          ) : (
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              flexWrap="wrap"
              spacing={2}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="body1">
                  Match #{matchId.slice(-6)}
                </Typography>
                <Chip
                  size="small"
                  label={match.status.replace('_', ' ').toUpperCase()}
                  color={
                    match.status === 'IN_PROGRESS'
                      ? 'success'
                      : match.status === 'WAITING_FOR_PLAYER'
                        ? 'warning'
                        : 'default'
                  }
                />
                {isGameStarting && (
                  <Chip
                    icon={<CircularProgress size={16} />}
                    label="Game Starting..."
                    color="info"
                  />
                )}
              </Stack>

              <Stack direction="row" spacing={2} alignItems="center">
                {match.status === 'WAITING_FOR_PLAYER' && isPlayer1 && (
                  <Button
                    variant="outlined"
                    startIcon={<Share />}
                    onClick={handleShareMatch}
                  >
                    Share
                  </Button>
                )}
              </Stack>
            </Stack>
          )}
        </Card>

        {/* Waiting States */}
        {match.status === 'WAITING_FOR_PLAYER' && canJoin && (
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                This match is waiting for a second player.
              </Typography>
              <Button
                variant="contained"
                startIcon={<PlayArrow />}
                onClick={handleJoinMatch}
                disabled={joinLoading}
                size="large"
              >
                {joinLoading ? 'Joining...' : 'Join Match'}
              </Button>
            </CardContent>
          </Card>
        )}

        {match.status === 'WAITING_FOR_PLAYER' && isPlayer1 && (
          <Alert severity="info">
            Waiting for another player to join. Share the match link to invite
            someone!
          </Alert>
        )}

        {/* Game Board */}
        {game?.boardState ? (
          <Box sx={{ position: 'relative' }}>
            <DiamondBoard
              boardState={game.boardState}
              currentTurn={game.currentTurn}
              onSquareClick={handleSquareClick}
              onPieceMove={handlePieceMove}
              selectedSquare={selectedSquare}
              validMoves={validMoves}
              readOnly={
                !isParticipant ||
                match.status !== 'IN_PROGRESS' ||
                !isMyTurn ||
                moveLoading
              }
              player1={match.player1}
              player2={match.player2}
              currentUserId={user?.id}
              matchStatus={match.status}
            />
            {moveLoading && (
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 20,
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: 2,
                  p: 2,
                  boxShadow: 4,
                }}
              >
                <CircularProgress />
              </Box>
            )}
          </Box>
        ) : isGameStarting ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <CircularProgress size={60} sx={{ mb: 2 }} />
              <Typography color="text.secondary">Game starting...</Typography>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <Typography color="text.secondary">
                {match.status === 'WAITING_FOR_PLAYER'
                  ? 'Game will start once both players have joined'
                  : 'Game board not available'}
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Match Actions
            </Typography>
            <Button
              variant="outlined"
              startIcon={<ExitToApp />}
              onClick={() => router.push('/')}
            >
              Leave Match
            </Button>
          </CardContent>
        </Card>

        {/* Game History */}
        {game && <MoveHistory moves={game.moveHistory || []} />}
      </Stack>

      {/* Notification */}
      {notification && (
        <Alert
          severity="info"
          onClose={() => setNotification(null)}
          sx={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
          }}
        >
          {notification}
        </Alert>
      )}
    </MainLayout>
  );
}
