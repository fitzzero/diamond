'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Collapse,
  Paper,
  Stack,
} from '@mui/material';
import {
  History,
  ExpandMore,
  ExpandLess,
  ChevronRight,
  Timeline,
} from '@mui/icons-material';
import { useBreakpoints } from '@/hooks';
import type { Move, ChessPosition } from '@/types/game';
import { chessCoords } from '@/lib/game/coordinates';

interface MoveHistoryProps {
  moves: Move[];
  currentMoveIndex?: number;
  onMoveClick?: (moveIndex: number) => void;
  compact?: boolean;
}

export default function MoveHistory({
  moves,
  currentMoveIndex = -1,
  onMoveClick,
  compact = false,
}: MoveHistoryProps) {
  const { isMobile } = useBreakpoints();
  const [expanded, setExpanded] = useState(!compact);

  // Convert Chess position to algebraic notation (e.g., a1, e4, h8)
  const positionToAlgebraic = (position: ChessPosition): string => {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];

    if (
      position.file >= 0 &&
      position.file < 8 &&
      position.rank >= 0 &&
      position.rank < 8
    ) {
      return `${files[position.file]}${ranks[position.rank]}`;
    }

    // Fallback for invalid positions
    return `(${position.file},${position.rank})`;
  };

  // Generate move notation
  const getMoveNotation = (move: Move, moveIndex: number): string => {
    const piece =
      move.piece.type === 'pawn' ? '' : move.piece.type.charAt(0).toUpperCase();
    const from = positionToAlgebraic(move.from);
    const to = positionToAlgebraic(move.to);
    const capture = move.capturedPiece ? 'x' : '-';

    let notation = `${piece}${from}${capture}${to}`;

    if (move.isCheckmate) {
      notation += '#';
    } else if (move.isCheck) {
      notation += '+';
    }

    return notation;
  };

  // Group moves by pairs (white, black)
  const movePairs: Array<{ white?: Move; black?: Move; moveNumber: number }> =
    [];

  for (let i = 0; i < moves.length; i += 2) {
    const white = moves[i];
    const black = moves[i + 1];
    const moveNumber = Math.floor(i / 2) + 1;

    movePairs.push({ white, black, moveNumber });
  }

  const getGameStatus = () => {
    if (moves.length === 0) return null;

    const lastMove = moves[moves.length - 1];
    if (lastMove.isCheckmate) {
      return {
        type: 'checkmate',
        message: `${lastMove.piece.color === 'WHITE' ? 'White' : 'Black'} wins by checkmate!`,
        color: 'error' as const,
      };
    }

    if (lastMove.isStalemate) {
      return {
        type: 'stalemate',
        message: 'Game drawn by stalemate',
        color: 'info' as const,
      };
    }

    if (lastMove.isCheck) {
      const nextPlayer = lastMove.piece.color === 'WHITE' ? 'Black' : 'White';
      return {
        type: 'check',
        message: `${nextPlayer} is in check!`,
        color: 'warning' as const,
      };
    }

    return null;
  };

  const gameStatus = getGameStatus();

  if (compact) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <History />
              <Typography variant="h6">Move History</Typography>
              <Chip label={moves.length} size="small" />
            </Box>
          }
          action={
            <IconButton onClick={() => setExpanded(!expanded)}>
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          }
          sx={{ pb: 1 }}
        />

        <Collapse in={expanded}>
          <CardContent
            sx={{
              pt: 0,
              maxHeight: isMobile ? 200 : 300,
              overflow: 'auto',
              px: { xs: 1, md: 2 }, // Less padding on mobile
            }}
          >
            {gameStatus && (
              <Box sx={{ mb: 2 }}>
                <Chip
                  label={gameStatus.message}
                  color={gameStatus.color}
                  icon={<Timeline />}
                  sx={{ fontWeight: 'bold' }}
                />
              </Box>
            )}

            {moves.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
              >
                No moves yet
              </Typography>
            ) : (
              <Stack spacing={0.5}>
                {movePairs.map((pair, pairIndex) => (
                  <Box
                    key={pairIndex}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                  >
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ minWidth: 24 }}
                    >
                      {pair.moveNumber}.
                    </Typography>

                    {pair.white && (
                      <Chip
                        label={getMoveNotation(pair.white, pairIndex * 2)}
                        size="small"
                        variant={
                          currentMoveIndex === pairIndex * 2
                            ? 'filled'
                            : 'outlined'
                        }
                        clickable={!!onMoveClick}
                        onClick={() => onMoveClick?.(pairIndex * 2)}
                        sx={{
                          fontSize: '0.75rem',
                          fontFamily: 'monospace',
                          bgcolor:
                            currentMoveIndex === pairIndex * 2
                              ? 'primary.main'
                              : 'transparent',
                        }}
                      />
                    )}

                    {pair.black && (
                      <Chip
                        label={getMoveNotation(pair.black, pairIndex * 2 + 1)}
                        size="small"
                        variant={
                          currentMoveIndex === pairIndex * 2 + 1
                            ? 'filled'
                            : 'outlined'
                        }
                        clickable={!!onMoveClick}
                        onClick={() => onMoveClick?.(pairIndex * 2 + 1)}
                        sx={{
                          fontSize: '0.75rem',
                          fontFamily: 'monospace',
                          bgcolor:
                            currentMoveIndex === pairIndex * 2 + 1
                              ? 'primary.main'
                              : 'transparent',
                        }}
                      />
                    )}
                  </Box>
                ))}
              </Stack>
            )}
          </CardContent>
        </Collapse>
      </Card>
    );
  }

  // Full table view
  return (
    <Card>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <History />
            <Typography variant="h6">Move History</Typography>
            <Chip label={`${moves.length} moves`} size="small" />
          </Box>
        }
      />

      <CardContent>
        {gameStatus && (
          <Box sx={{ mb: 3 }}>
            <Chip
              label={gameStatus.message}
              color={gameStatus.color}
              icon={<Timeline />}
              sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}
            />
          </Box>
        )}

        {moves.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No moves yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              The game will begin once both players have joined
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>White</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Black</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {movePairs.map((pair, pairIndex) => (
                  <TableRow
                    key={pairIndex}
                    sx={{
                      '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                      '&:hover': { bgcolor: 'action.selected' },
                    }}
                  >
                    <TableCell
                      sx={{ fontWeight: 'bold', color: 'text.secondary' }}
                    >
                      {pair.moveNumber}
                    </TableCell>

                    <TableCell>
                      {pair.white ? (
                        <Chip
                          label={getMoveNotation(pair.white, pairIndex * 2)}
                          size="small"
                          variant={
                            currentMoveIndex === pairIndex * 2
                              ? 'filled'
                              : 'outlined'
                          }
                          clickable={!!onMoveClick}
                          onClick={() => onMoveClick?.(pairIndex * 2)}
                          sx={{
                            fontFamily: 'monospace',
                            bgcolor:
                              currentMoveIndex === pairIndex * 2
                                ? 'primary.main'
                                : 'transparent',
                          }}
                        />
                      ) : (
                        <Typography variant="body2" color="text.disabled">
                          -
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell>
                      {pair.black ? (
                        <Chip
                          label={getMoveNotation(pair.black, pairIndex * 2 + 1)}
                          size="small"
                          variant={
                            currentMoveIndex === pairIndex * 2 + 1
                              ? 'filled'
                              : 'outlined'
                          }
                          clickable={!!onMoveClick}
                          onClick={() => onMoveClick?.(pairIndex * 2 + 1)}
                          sx={{
                            fontFamily: 'monospace',
                            bgcolor:
                              currentMoveIndex === pairIndex * 2 + 1
                                ? 'primary.main'
                                : 'transparent',
                          }}
                        />
                      ) : (
                        <Typography variant="body2" color="text.disabled">
                          -
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
}
