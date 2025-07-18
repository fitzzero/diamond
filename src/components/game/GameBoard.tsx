'use client';

import { useState, useCallback, useMemo } from 'react';
import { Box, Alert, Typography, Button, Stack } from '@mui/material';
import type {
  BoardState,
  DiamondPosition,
  PieceColor,
  Move,
  GameStatus,
} from '@/types/game';
import { DiamondBoard } from './';
import { diamondCoords } from '@/lib/game/coordinates';
import { moveValidator } from '@/lib/game/moveValidation';

interface GameBoardProps {
  gameId: string;
  boardState: BoardState;
  currentTurn: PieceColor;
  gameStatus: GameStatus;
  playerColor?: PieceColor;
  onMove: (move: Move) => Promise<void>;
  moveHistory?: Move[];
  isLoading?: boolean;
  readOnly?: boolean;
}

export default function GameBoard({
  gameId,
  boardState,
  currentTurn,
  gameStatus,
  playerColor,
  onMove,
  moveHistory = [],
  isLoading = false,
  readOnly = false,
}: GameBoardProps) {
  const [selectedSquare, setSelectedSquare] = useState<DiamondPosition | null>(
    null
  );
  const [validMoves, setValidMoves] = useState<DiamondPosition[]>([]);
  const [lastMove, setLastMove] = useState<Move | null>(
    moveHistory.length > 0 ? moveHistory[moveHistory.length - 1] : null
  );
  const [error, setError] = useState<string | null>(null);

  // Use the imported moveValidator instance

  // Check if it's the current player's turn
  const isPlayerTurn = useMemo(() => {
    if (!playerColor) return true; // Spectator mode or local play
    return currentTurn === playerColor;
  }, [currentTurn, playerColor]);

  // Calculate highlighted squares (last move)
  const highlightedSquares = useMemo(() => {
    if (!lastMove) return [];
    return [lastMove.from, lastMove.to];
  }, [lastMove]);

  // Handle square selection and piece movement
  const handleSquareClick = useCallback(
    async (position: DiamondPosition) => {
      if (readOnly || isLoading || !isPlayerTurn) return;

      setError(null);

      const pieceKey = diamondCoords.positionToKey(position);
      const clickedPiece = boardState.get(pieceKey);

      // If no piece is selected
      if (!selectedSquare) {
        // Can only select own pieces
        if (clickedPiece && clickedPiece.color === currentTurn) {
          setSelectedSquare(position);

          // Calculate valid moves for this piece
          try {
            const moves = moveValidator.getAllLegalMoves(
              boardState,
              currentTurn
            );
            const pieceMoves = moves.filter(
              (move: Move) =>
                move.from.x === position.x && move.from.y === position.y
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
      if (selectedSquare.x === position.x && selectedSquare.y === position.y) {
        setSelectedSquare(null);
        setValidMoves([]);
        return;
      }

      // If selecting a different piece of the same color
      if (clickedPiece && clickedPiece.color === currentTurn) {
        setSelectedSquare(position);

        // Calculate valid moves for the new piece
        try {
          const moves = moveValidator.getAllLegalMoves(boardState, currentTurn);
          const pieceMoves = moves.filter(
            (move: Move) =>
              move.from.x === position.x && move.from.y === position.y
          );
          setValidMoves(pieceMoves.map((move: Move) => move.to));
        } catch (error) {
          console.error('Error calculating moves:', error);
          setValidMoves([]);
        }
        return;
      }

      // Try to make a move
      const isValidMove = validMoves.some(
        move => move.x === position.x && move.y === position.y
      );

      if (!isValidMove) {
        setError('Invalid move');
        return;
      }

      try {
        const move: Move = {
          from: selectedSquare,
          to: position,
          piece: boardState.get(diamondCoords.positionToKey(selectedSquare))!,
          capturedPiece: clickedPiece || undefined,
        };

        await onMove(move);

        // Clear selection after successful move
        setSelectedSquare(null);
        setValidMoves([]);
        setLastMove(move);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : 'Failed to make move'
        );
      }
    },
    [
      readOnly,
      isLoading,
      isPlayerTurn,
      selectedSquare,
      validMoves,
      boardState,
      currentTurn,
      moveValidator,
      onMove,
    ]
  );

  // Get game status message
  const getStatusMessage = () => {
    switch (gameStatus) {
      case 'check':
        return `${currentTurn} is in check!`;
      case 'checkmate':
        return `Checkmate! ${currentTurn === 'WHITE' ? 'Black' : 'White'} wins!`;
      case 'stalemate':
        return 'Stalemate! The game is a draw.';
      case 'draw':
        return 'The game is a draw.';
      case 'active':
        if (!isPlayerTurn && playerColor) {
          return `Waiting for opponent...`;
        }
        return null;
      default:
        return null;
    }
  };

  const statusMessage = getStatusMessage();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
        p: 2,
      }}
    >
      {/* Game Status Messages */}
      {statusMessage && (
        <Alert
          severity={
            gameStatus === 'check'
              ? 'warning'
              : gameStatus === 'checkmate'
                ? 'error'
                : 'info'
          }
          sx={{ width: '100%' }}
        >
          <Typography variant="h6">{statusMessage}</Typography>
        </Alert>
      )}

      {/* Error Messages */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Turn/Player Information */}
      <Stack direction="row" spacing={3} alignItems="center">
        {playerColor && (
          <Typography variant="body2" color="text.secondary">
            Playing as: {playerColor === 'WHITE' ? '⚪ White' : '⚫ Black'}
          </Typography>
        )}
        {!isPlayerTurn && playerColor && gameStatus === 'active' && (
          <Typography variant="body2" color="warning.main">
            Opponent's turn
          </Typography>
        )}
      </Stack>

      {/* The Diamond Chess Board */}
      <DiamondBoard
        boardState={boardState}
        currentTurn={currentTurn}
        onSquareClick={handleSquareClick}
        highlightedSquares={highlightedSquares}
        selectedSquare={selectedSquare}
        validMoves={validMoves}
        readOnly={readOnly || !isPlayerTurn}
      />

      {/* Move History Summary */}
      {moveHistory.length > 0 && (
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Move {moveHistory.length} • Last:{' '}
            {lastMove
              ? `${lastMove.piece.type} ${diamondCoords.positionToKey(lastMove.from)} → ${diamondCoords.positionToKey(lastMove.to)}`
              : 'None'}
          </Typography>
        </Box>
      )}

      {/* Development Info */}
      {process.env.NODE_ENV === 'development' && selectedSquare && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="caption" display="block">
            Debug: Selected ({selectedSquare.x}, {selectedSquare.y}) • Valid
            moves: {validMoves.length}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
