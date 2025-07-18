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
  Divider,
} from '@mui/material';
import { PlayArrow, Person, Share, ExitToApp } from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import { useMatch, useGame } from '@/hooks/useGame';
import { MainLayout } from '@/components/layout';
import { DiamondBoard, MoveHistory, GameStatus } from '@/components/game';
import { joinMatch, makeMove } from '@/lib/actions/gameActions';
import type { DiamondPosition, PieceColor, Move } from '@/types/game';
import { diamondCoords } from '@/lib/game/coordinates';

export default function MatchPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const matchId = params.id as string;

  const {
    match,
    isLoading: matchLoading,
    error: matchError,
    refresh: refreshMatch,
  } = useMatch(matchId);
  const {
    game,
    isLoading: gameLoading,
    error: gameError,
    refresh: refreshGame,
  } = useGame(match?.games?.[0]?.id || null);

  const [joinLoading, setJoinLoading] = useState(false);
  const [selectedSquare, setSelectedSquare] = useState<DiamondPosition | null>(
    null
  );
  const [validMoves, setValidMoves] = useState<DiamondPosition[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [moveLoading, setMoveLoading] = useState(false);

  // Auto-refresh game state every 5 seconds when game is in progress
  useEffect(() => {
    if (match?.status === 'IN_PROGRESS' && game) {
      const interval = setInterval(() => {
        refreshGame();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [match?.status, game, refreshGame]);

  const handleJoinMatch = async () => {
    if (joinLoading) return;

    setJoinLoading(true);
    try {
      const result = await joinMatch(matchId);

      if (result.success) {
        setNotification('Successfully joined the match!');
        refreshMatch();
        refreshGame();
      } else {
        setNotification(result.error || 'Failed to join match');
      }
    } catch (error) {
      console.error('Error joining match:', error);
      setNotification('An error occurred while joining the match');
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
    // TODO: Implement piece selection and move logic
    setSelectedSquare(position);
    console.log('Square clicked:', position);
  };

  const handlePieceMove = async (
    from: DiamondPosition,
    to: DiamondPosition
  ) => {
    if (moveLoading || !game || !isParticipant) return;

    // Check if it's the player's turn
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

      // Make the move using server action
      const result = await makeMove(game.id, move);

      if (result.success) {
        setNotification('Move made successfully!');
        // Clear selection
        setSelectedSquare(null);
        setValidMoves([]);
        // Refresh game state
        refreshGame();
      } else {
        setNotification(result.error || 'Move failed');
      }
    } catch (error) {
      console.error('Error making move:', error);
      setNotification('An error occurred while making the move');
    } finally {
      setMoveLoading(false);
    }
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

  if (matchLoading) {
    return (
      <MainLayout>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        </Container>
      </MainLayout>
    );
  }

  if (matchError || !match) {
    return (
      <MainLayout>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error">
            Match not found or unable to load match data.
          </Alert>
          <Button
            onClick={() => router.push('/')}
            sx={{ mt: 2 }}
            variant="contained"
          >
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

  return (
    <MainLayout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Match Header */}
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

            <Stack direction="row" spacing={2}>
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

          <Chip
            label={match.status.replace('_', ' ').toUpperCase()}
            color={
              match.status === 'IN_PROGRESS'
                ? 'success'
                : match.status === 'WAITING_FOR_PLAYER'
                  ? 'warning'
                  : 'default'
            }
            sx={{ mb: 2 }}
          />
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1.5fr 1fr' },
            gap: { xs: 2, md: 4 },
            minHeight: { xs: 'auto', md: '70vh' }, // Better mobile height management
          }}
        >
          {/* Game Board Section */}
          <Stack spacing={{ xs: 2, md: 3 }}>
            <Paper sx={{ p: { xs: 2, md: 3 } }}>
              <Typography variant="h6" gutterBottom>
                Game Board
              </Typography>

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

              {/* Game Board */}
              {game?.boardState ? (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
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
                      moveLoading
                    }
                  />
                  {moveLoading && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 10,
                      }}
                    >
                      <CircularProgress size={40} />
                    </Box>
                  )}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography color="text.secondary">
                    {match.status === 'WAITING_FOR_PLAYER'
                      ? 'Game will start once both players have joined'
                      : 'Loading game board...'}
                  </Typography>
                </Box>
              )}
            </Paper>

            {/* Game Status Section */}
            {game && (
              <GameStatus
                currentTurn={game.currentTurn}
                gameStatus={game.status}
                moves={game.moveHistory || []}
                whitePlayer={match.player1}
                blackPlayer={match.player2}
                currentUserId={user?.id}
                matchStatus={match.status}
              />
            )}
          </Stack>

          {/* Match Info Sidebar */}
          <Stack
            spacing={{ xs: 2, md: 3 }}
            sx={{
              order: { xs: -1, lg: 0 }, // Move sidebar above board on mobile
              maxHeight: { xs: '50vh', lg: 'auto' }, // Limit height on mobile
              overflow: { xs: 'auto', lg: 'visible' },
            }}
          >
            {/* Move History */}
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
          </Stack>
        </Box>

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
      </Container>
    </MainLayout>
  );
}
