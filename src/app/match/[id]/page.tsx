'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Container,
  Button,
  Stack,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  Paper,
  LinearProgress,
  Badge,
} from '@mui/material';
import {
  PlayArrow,
  Person,
  Share,
  ExitToApp,
  Timer,
  SignalWifi4Bar,
  SignalWifiOff,
  Refresh,
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import { useMatchSession } from '@/hooks/useGame';
import { MainLayout } from '@/components/layout';
import { DiamondBoard, MoveHistory, GameStatus } from '@/components/game';
import type { DiamondPosition, PieceColor, Move } from '@/types/game';
import { diamondCoords } from '@/lib/game/coordinates';

export default function MatchPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const matchId = params.id as string;

  // Use the enhanced match session hook for seamless real-time experience
  const {
    match,
    game,
    isMatchLoading,
    isGameLoading,
    matchError,
    gameError,
    joinMatch,
    makeMove,
    refreshMatch,
    refreshGame,
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

  // Handle seamless match joining
  const handleJoinMatch = async () => {
    if (joinLoading) return;

    setJoinLoading(true);
    try {
      const result = await joinMatch();
      setNotification('Successfully joined! Game starting...');
    } catch (error) {
      console.error('Error joining match:', error);
      setNotification(
        error instanceof Error ? error.message : 'Failed to join match'
      );
    } finally {
      setJoinLoading(false);
    }
  };

  const handleShareMatch = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setNotification('Match link copied to clipboard!');
    });
  };

  const handleSquareClick = (position: DiamondPosition) => {
    // TODO: Implement enhanced piece selection with valid moves display
    setSelectedSquare(position);
    console.log('Square clicked:', position);
  };

  const handlePieceMove = async (
    from: DiamondPosition,
    to: DiamondPosition
  ) => {
    if (moveLoading || !game || !isParticipant) return;

    // Enhanced turn validation
    const isMyTurn =
      (game.currentTurn === 'WHITE' && isPlayer1) ||
      (game.currentTurn === 'BLACK' && isPlayer2);

    if (!isMyTurn) {
      setNotification("It's not your turn!");
      return;
    }

    setMoveLoading(true);
    try {
      // Get the piece being moved
      const piece = game.boardState.get(diamondCoords.positionToKey(from));

      if (!piece) {
        setNotification('No piece at source position');
        return;
      }

      // Check if it's the correct player's piece
      if (piece.color !== game.currentTurn) {
        setNotification('You can only move your own pieces');
        return;
      }

      // Create move object
      const move: Move = {
        from,
        to,
        piece,
      };

      // Make the move using enhanced server action
      await makeMove(move);
      setNotification('Move made successfully!');

      // Clear selection
      setSelectedSquare(null);
      setValidMoves([]);
    } catch (error) {
      console.error('Error making move:', error);
      setNotification(error instanceof Error ? error.message : 'Move failed');
    } finally {
      setMoveLoading(false);
    }
  };

  const handleManualRefresh = () => {
    refreshMatch();
    refreshGame();
    setNotification('Refreshing...');
  };

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="warning">
            You must be signed in to view this match.
          </Alert>
        </Container>
      </MainLayout>
    );
  }

  if (isMatchLoading) {
    return (
      <MainLayout>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              py: 8,
            }}
          >
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Loading match...
            </Typography>
          </Box>
        </Container>
      </MainLayout>
    );
  }

  if (matchError || !match) {
    return (
      <MainLayout>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {matchError || 'Match not found or unable to load match data.'}
          </Alert>
          <Button onClick={() => router.push('/')} variant="contained">
            Return Home
          </Button>
        </Container>
      </MainLayout>
    );
  }

  const isPlayer1 = match.player1Id === user?.id;
  const isPlayer2 = match.player2Id === user?.id;
  const isParticipant = isPlayer1 || isPlayer2;
  const canJoin = match.status === 'WAITING_FOR_PLAYER' && !isParticipant;
  const currentPlayerColor: PieceColor = isPlayer1 ? 'WHITE' : 'BLACK';

  // Enhanced turn detection
  const isMyTurn =
    game &&
    isParticipant &&
    ((game.currentTurn === 'WHITE' && isPlayer1) ||
      (game.currentTurn === 'BLACK' && isPlayer2));

  return (
    <MainLayout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Enhanced Match Header with Real-time Status */}
        <Box sx={{ mb: 4 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 2 }}
          >
            <Typography variant="h4" component="h1">
              Match #{matchId.slice(-6)}
            </Typography>

            <Stack direction="row" spacing={2} alignItems="center">
              {/* Real-time Connection Status */}
              <Badge
                color={
                  realtimeStatus?.connectionStatus === 'polling'
                    ? 'success'
                    : 'error'
                }
                variant="dot"
              >
                {realtimeStatus?.connectionStatus === 'polling' ? (
                  <SignalWifi4Bar color="success" />
                ) : (
                  <SignalWifiOff color="error" />
                )}
              </Badge>

              {/* Manual Refresh */}
              <Button
                variant="outlined"
                size="small"
                startIcon={<Refresh />}
                onClick={handleManualRefresh}
              >
                Refresh
              </Button>

              {/* Share Match */}
              {match.status === 'WAITING_FOR_PLAYER' && isPlayer1 && (
                <Button
                  variant="outlined"
                  startIcon={<Share />}
                  onClick={handleShareMatch}
                  size="small"
                >
                  Share Match
                </Button>
              )}
            </Stack>
          </Stack>

          {/* Enhanced Status Display */}
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Chip
              label={match.status.replace('_', ' ').toUpperCase()}
              color={
                match.status === 'IN_PROGRESS'
                  ? 'success'
                  : match.status === 'WAITING_FOR_PLAYER'
                    ? 'warning'
                    : 'default'
              }
            />

            {/* Turn Indicator */}
            {game && match.status === 'IN_PROGRESS' && (
              <Chip
                icon={<Timer />}
                label={
                  isMyTurn
                    ? 'Your Turn!'
                    : `${game.currentTurn === 'WHITE' ? 'White' : 'Black'}'s Turn`
                }
                color={isMyTurn ? 'primary' : 'default'}
                variant={isMyTurn ? 'filled' : 'outlined'}
              />
            )}

            {/* Game Starting Indicator */}
            {isGameStarting && (
              <Chip
                icon={<CircularProgress size={16} />}
                label="Game Starting..."
                color="info"
              />
            )}
          </Stack>

          {/* Real-time Loading Indicator */}
          {(isGameLoading || isGameStarting) && (
            <LinearProgress sx={{ width: '100%', borderRadius: 1 }} />
          )}
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1.5fr 1fr' },
            gap: { xs: 2, md: 4 },
            minHeight: { xs: 'auto', md: '70vh' },
          }}
        >
          {/* Game Board Section */}
          <Stack spacing={{ xs: 2, md: 3 }}>
            <Paper sx={{ p: { xs: 2, md: 3 } }}>
              <Typography variant="h6" gutterBottom>
                Game Board
                {/* Player Color Indicator */}
                {isParticipant && game && (
                  <Chip
                    label={`You are ${currentPlayerColor}`}
                    size="small"
                    color={
                      currentPlayerColor === 'WHITE' ? 'default' : 'primary'
                    }
                    sx={{ ml: 2 }}
                  />
                )}
              </Typography>

              {/* Waiting for Player */}
              {match.status === 'WAITING_FOR_PLAYER' && canJoin && (
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Typography variant="body1" sx={{ mb: 2 }}>
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
                </Box>
              )}

              {match.status === 'WAITING_FOR_PLAYER' &&
                !canJoin &&
                !isParticipant && (
                  <Alert severity="info" sx={{ mb: 3 }}>
                    This match is waiting for a second player, but you cannot
                    join.
                  </Alert>
                )}

              {match.status === 'WAITING_FOR_PLAYER' && isPlayer1 && (
                <Alert severity="info" sx={{ mb: 3 }}>
                  Waiting for another player to join. Share the match link to
                  invite someone!
                </Alert>
              )}

              {/* Game Board or Loading State */}
              {game?.boardState ? (
                <Box
                  sx={{
                    position: 'relative',
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
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
                  />

                  {/* Move Loading Overlay */}
                  {moveLoading && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 10,
                        bgcolor: 'rgba(255, 255, 255, 0.8)',
                        borderRadius: 2,
                        p: 2,
                      }}
                    >
                      <CircularProgress size={40} />
                    </Box>
                  )}
                </Box>
              ) : isGameStarting ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <CircularProgress size={60} sx={{ mb: 2 }} />
                  <Typography color="text.secondary">
                    Game starting...
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography color="text.secondary">
                    {match.status === 'WAITING_FOR_PLAYER'
                      ? 'Game will start once both players have joined'
                      : isGameLoading
                        ? 'Loading game board...'
                        : 'Game board not available'}
                  </Typography>
                </Box>
              )}
            </Paper>

            {/* Enhanced Game Status Section */}
            {game && (
              <GameStatus
                currentTurn={game.currentTurn}
                gameStatus={game.status}
                moves={game.moveHistory || []}
                whitePlayer={{
                  id: match.player1.id,
                  name: match.player1.name || 'Player 1',
                  image: match.player1.image || undefined,
                }}
                blackPlayer={
                  match.player2
                    ? {
                        id: match.player2.id,
                        name: match.player2.name || 'Player 2',
                        image: match.player2.image || undefined,
                      }
                    : undefined
                }
                currentUserId={user?.id}
                matchStatus={match.status}
              />
            )}
          </Stack>

          {/* Enhanced Match Info Sidebar */}
          <Stack
            spacing={{ xs: 2, md: 3 }}
            sx={{
              order: { xs: -1, lg: 0 },
              maxHeight: { xs: '50vh', lg: 'auto' },
              overflow: { xs: 'auto', lg: 'visible' },
            }}
          >
            {/* Real-time Move History */}
            {game && (
              <MoveHistory moves={game.moveHistory || []} compact={true} />
            )}

            {/* Match Actions */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Actions
                </Typography>
                <Stack spacing={2}>
                  <Button
                    variant="outlined"
                    startIcon={<ExitToApp />}
                    onClick={() => router.push('/')}
                    fullWidth
                  >
                    Leave Match
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            {/* Real-time Status Info */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Connection Status
                </Typography>
                <Stack spacing={1}>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Typography variant="body2">Status:</Typography>
                    <Typography
                      variant="body2"
                      color={
                        realtimeStatus?.connectionStatus === 'polling'
                          ? 'success.main'
                          : 'error.main'
                      }
                    >
                      {realtimeStatus?.connectionStatus || 'Unknown'}
                    </Typography>
                  </Box>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Typography variant="body2">Update Interval:</Typography>
                    <Typography variant="body2">
                      {realtimeStatus
                        ? `${realtimeStatus.updateInterval / 1000}s`
                        : 'N/A'}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Box>

        {/* Enhanced Notification */}
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
              minWidth: 300,
            }}
          >
            {notification}
          </Alert>
        )}
      </Container>
    </MainLayout>
  );
}
