'use client';

import {
  Card,
  CardContent,
  CardActions,
  Stack,
  Avatar,
  Box,
  Typography,
  Button,
  Chip,
} from '@mui/material';
import { PlayArrow, Visibility, EmojiEvents } from '@mui/icons-material';
import Link from 'next/link';
import type { MatchWithPlayers } from '@/types/game';

interface CompactMatchCardProps {
  match: MatchWithPlayers;
  currentUserId?: string;
}

export default function CompactMatchCard({
  match: rawMatch,
  currentUserId,
}: CompactMatchCardProps) {
  // Cast for Firestore compatibility - Firestore data structure is compatible
  const match = rawMatch as any;

  // Determine if current user is in this match
  const isPlayer1 = match.player1Id === currentUserId;
  const isPlayer2 = match.player2Id === currentUserId;
  const isParticipant = isPlayer1 || isPlayer2;

  // Get status color and text
  const getStatusInfo = () => {
    switch (match.status) {
      case 'WAITING_FOR_PLAYER':
        return { color: 'warning' as const, text: 'Waiting for Player' };
      case 'IN_PROGRESS':
        return { color: 'success' as const, text: 'In Progress' };
      case 'COMPLETED':
        return { color: 'default' as const, text: 'Completed' };
      case 'CANCELLED':
        return { color: 'error' as const, text: 'Cancelled' };
      default:
        return { color: 'default' as const, text: match.status };
    }
  };

  const statusInfo = getStatusInfo();

  // Determine winner for completed matches
  const getWinnerInfo = () => {
    if (match.status !== 'COMPLETED' || !match.winnerId) return null;

    const isPlayer1Winner = match.winnerId === match.player1Id;
    const isPlayer2Winner = match.winnerId === match.player2Id;

    if (!match.winnerId || (!isPlayer1Winner && !isPlayer2Winner)) {
      return { type: 'draw', text: 'Draw' };
    }

    if (isParticipant) {
      const didCurrentUserWin = match.winnerId === currentUserId;
      return {
        type: didCurrentUserWin ? 'win' : 'loss',
        text: didCurrentUserWin ? 'Victory' : 'Defeat',
      };
    }

    return {
      type: 'win',
      text: `${isPlayer1Winner ? match.player1?.name || 'Player 1' : match.player2?.name || 'Player 2'} wins`,
    };
  };

  const winnerInfo = getWinnerInfo();

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s ease',
        border: '1px solid',
        borderColor: 'divider',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 4,
          borderColor: 'primary.main',
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Stack spacing={2}>
          {/* Match ID and Status */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
          >
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              #{match.id.slice(-6)}
            </Typography>
            <Chip
              label={statusInfo.text}
              color={statusInfo.color}
              size="small"
              variant="outlined"
            />
          </Stack>

          {/* Player vs Player Layout */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              {/* Player 1 (White) */}
              <Stack alignItems="center" spacing={0.5} sx={{ flex: 1 }}>
                <Avatar
                  src={match.player1?.image || undefined}
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: 'grey.100',
                    color: 'grey.800',
                    border: '2px solid',
                    borderColor:
                      match.winnerId === match.player1?.id
                        ? 'success.main'
                        : 'grey.300',
                  }}
                >
                  {match.player1?.name?.charAt(0) || '?'}
                </Avatar>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={500}
                  textAlign="center"
                  noWrap
                  sx={{ maxWidth: 60 }}
                >
                  {match.player1?.name || 'Player 1'}
                </Typography>
                {/* White piece indicator */}
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: 'grey.100',
                    border: '1px solid grey.400',
                  }}
                />
              </Stack>

              {/* VS Section */}
              <Stack alignItems="center" spacing={0.5} sx={{ minWidth: 60 }}>
                <Typography
                  variant="h6"
                  color="text.secondary"
                  fontWeight={700}
                  sx={{ fontSize: '1rem' }}
                >
                  VS
                </Typography>
                {winnerInfo && (
                  <Chip
                    icon={
                      winnerInfo.type === 'win' ? <EmojiEvents /> : undefined
                    }
                    label={winnerInfo.text}
                    size="small"
                    color={
                      winnerInfo.type === 'win'
                        ? 'success'
                        : winnerInfo.type === 'loss'
                          ? 'error'
                          : 'info'
                    }
                    variant="filled"
                    sx={{ fontSize: '0.7rem', height: 20 }}
                  />
                )}
              </Stack>

              {/* Player 2 (Black) */}
              <Stack alignItems="center" spacing={0.5} sx={{ flex: 1 }}>
                {match.player2 ? (
                  <>
                    <Avatar
                      src={match.player2.image || undefined}
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: 'grey.800',
                        color: 'grey.100',
                        border: '2px solid',
                        borderColor:
                          match.winnerId === match.player2?.id
                            ? 'success.main'
                            : 'grey.600',
                      }}
                    >
                      {match.player2.name?.charAt(0) || '?'}
                    </Avatar>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={500}
                      textAlign="center"
                      noWrap
                      sx={{ maxWidth: 60 }}
                    >
                      {match.player2.name || 'Player 2'}
                    </Typography>
                  </>
                ) : (
                  <>
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: 'action.disabled',
                        color: 'text.disabled',
                        border: '2px dashed',
                        borderColor: 'action.disabled',
                      }}
                    >
                      ?
                    </Avatar>
                    <Typography
                      variant="caption"
                      color="text.disabled"
                      fontWeight={500}
                      textAlign="center"
                    >
                      Waiting...
                    </Typography>
                  </>
                )}
                {/* Black piece indicator */}
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: match.player2 ? 'grey.800' : 'action.disabled',
                    border: '1px solid',
                    borderColor: match.player2 ? 'grey.600' : 'action.disabled',
                  }}
                />
              </Stack>
            </Stack>
          </Box>

          {/* Match Date */}
          <Typography
            variant="caption"
            color="text.secondary"
            textAlign="center"
          >
            {new Date(match.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </Typography>
        </Stack>
      </CardContent>

      {/* Actions */}
      <CardActions sx={{ pt: 0, justifyContent: 'center' }}>
        <Button
          component={Link}
          href={`/match/${match.id}`}
          size="small"
          startIcon={
            match.status === 'WAITING_FOR_PLAYER' && !isParticipant ? (
              <PlayArrow />
            ) : (
              <Visibility />
            )
          }
          variant={
            match.status === 'IN_PROGRESS' && isParticipant
              ? 'contained'
              : 'outlined'
          }
          sx={{ fontSize: '0.8rem' }}
        >
          {match.status === 'WAITING_FOR_PLAYER' && !isParticipant
            ? 'Join'
            : match.status === 'IN_PROGRESS' && isParticipant
              ? 'Continue'
              : 'View'}
        </Button>
      </CardActions>
    </Card>
  );
}
