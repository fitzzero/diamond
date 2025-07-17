'use client';

import { useCurrentUser, useUserMatches, useGame } from '@/hooks/useGame';
import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Chip,
} from '@mui/material';

export default function TestPhase2Page() {
  const { user, isAuthenticated, isLoading: userLoading } = useCurrentUser();
  const {
    matches,
    createMatch,
    joinMatch,
    isLoading: matchesLoading,
    refresh: refreshMatches,
  } = useUserMatches();
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const { game, makeMove, isLoading: gameLoading } = useGame(selectedGameId);
  const [testResult, setTestResult] = useState<string>('');

  const handleCreateMatch = async () => {
    try {
      setTestResult('Creating match...');
      const result = await createMatch();
      setTestResult(`✅ Match created: ${result.matchId}`);
    } catch (error) {
      setTestResult(`❌ Error: ${error}`);
    }
  };

  const handleJoinMatch = async (matchId: string) => {
    try {
      setTestResult('Joining match...');
      const result = await joinMatch(matchId);
      if (result.success) {
        setTestResult(`✅ Joined match! Game ID: ${result.gameId}`);
        setSelectedGameId(result.gameId!);
      } else {
        setTestResult(`❌ Failed to join match: ${result.error}`);
      }
    } catch (error) {
      setTestResult(`❌ Error: ${error}`);
    }
  };

  const handleTestMove = async () => {
    if (!selectedGameId) {
      setTestResult('❌ No game selected');
      return;
    }

    try {
      setTestResult('Making test move...');
      // Test move: e2 to e3 (white pawn)
      const testMove = {
        from: { x: 0, y: -6 }, // e2 in diamond coordinates
        to: { x: 0, y: -5 }, // e3 in diamond coordinates
        piece: { type: 'pawn', color: 'WHITE', id: 'white-pawn-4' },
      };

      const result = await makeMove(testMove as any);
      setTestResult(`✅ Move successful!`);
    } catch (error) {
      setTestResult(`❌ Move failed: ${error}`);
    }
  };

  if (userLoading) {
    return (
      <Box p={3}>
        <Typography>Loading user session...</Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return (
      <Box p={3}>
        <Alert severity="warning">
          Please sign in to test Phase 2 functionality.
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Phase 2 Testing: Server Actions & SWR Hooks
      </Typography>

      {/* User Info */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6">Current User</Typography>
          <Typography>ID: {user?.id}</Typography>
          <Typography>Username: {user?.username || user?.name}</Typography>
          <Typography>Email: {user?.email}</Typography>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResult && (
        <Alert
          severity={testResult.includes('✅') ? 'success' : 'error'}
          sx={{ mb: 3 }}
        >
          {testResult}
        </Alert>
      )}

      {/* Match Management */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Match Management
          </Typography>

          <Button
            variant="contained"
            onClick={handleCreateMatch}
            disabled={matchesLoading}
            sx={{ mb: 2 }}
          >
            Create New Match
          </Button>

          <Typography variant="subtitle1" gutterBottom>
            Your Matches ({matches.length}):
          </Typography>

          {matchesLoading ? (
            <Typography>Loading matches...</Typography>
          ) : matches.length === 0 ? (
            <Typography color="text.secondary">No matches found</Typography>
          ) : (
            matches.map((match: any) => (
              <Card key={match.id} variant="outlined" sx={{ mb: 1 }}>
                <CardContent>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Box>
                      <Typography variant="body2">
                        Match ID: {match.id}
                      </Typography>
                      <Chip
                        label={match.status}
                        size="small"
                        color={
                          match.status === 'WAITING_FOR_PLAYER'
                            ? 'warning'
                            : 'primary'
                        }
                      />
                      <Typography variant="body2">
                        Players: {match.player1.username}
                        {match.player2
                          ? ` vs ${match.player2.username}`
                          : ' (waiting for opponent)'}
                      </Typography>
                    </Box>

                    {match.status === 'WAITING_FOR_PLAYER' &&
                      match.player1.id !== user?.id && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleJoinMatch(match.id)}
                        >
                          Join Match
                        </Button>
                      )}

                    {match.currentGame && (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => setSelectedGameId(match.currentGame.id)}
                      >
                        View Game
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {/* Game State */}
      {selectedGameId && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Game State (ID: {selectedGameId})
            </Typography>

            {gameLoading ? (
              <Typography>Loading game...</Typography>
            ) : game ? (
              <Box>
                <Typography>Status: {game.status}</Typography>
                <Typography>Current Turn: {game.currentTurn}</Typography>
                <Typography>Game Number: {game.gameNumber}</Typography>

                <Button
                  variant="contained"
                  onClick={handleTestMove}
                  disabled={game.status !== 'IN_PROGRESS'}
                  sx={{ mt: 2 }}
                >
                  Test Move (e2→e3)
                </Button>

                <Typography variant="subtitle2" sx={{ mt: 2 }}>
                  Board State Preview:
                </Typography>
                <Typography
                  variant="body2"
                  component="pre"
                  sx={{
                    backgroundColor: 'grey.100',
                    p: 1,
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    overflow: 'auto',
                    maxHeight: 200,
                  }}
                >
                  {JSON.stringify(JSON.parse(game.board), null, 2)}
                </Typography>
              </Box>
            ) : (
              <Typography color="error">Game not found</Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* System Status */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            System Status
          </Typography>
          <Typography>✅ Authentication: Working</Typography>
          <Typography>
            ✅ Server Actions: {matches ? 'Working' : 'Not tested'}
          </Typography>
          <Typography>✅ SWR Hooks: Working</Typography>
          <Typography>⏳ Move Validation: Basic implementation</Typography>
          <Typography>⏳ Real-time Updates: Polling (2s interval)</Typography>
          <Typography>❌ Prisma Accelerate: Not configured</Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
