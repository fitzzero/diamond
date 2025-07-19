'use client';

import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Alert,
  Stack,
  Chip,
  Card,
  CardContent,
} from '@mui/material';
import {
  SportsMartialArts,
  Schedule,
  EmojiEvents,
  Handshake,
} from '@mui/icons-material';
import { DiamondBoard } from './';
import { useLocalGame } from '@/hooks';
import type { ChessPosition } from '@/types/game';

interface DemoGameBoardProps {
  // Optional styling overrides
  showTurnIndicator?: boolean;
  showMoveCounter?: boolean;
  showGameStatus?: boolean;
}

export default function DemoGameBoard({
  showTurnIndicator = true,
  showMoveCounter = true,
  showGameStatus = true,
}: DemoGameBoardProps) {
  const {
    boardState,
    currentTurn,
    moveHistory,
    isGameOver,
    gameResult,
    makeMove,
    getPossibleMoves,
  } = useLocalGame();

  const [selectedSquare, setSelectedSquare] = useState<ChessPosition | null>(
    null
  );
  const [validMoves, setValidMoves] = useState<ChessPosition[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  // Handle square clicks with move logic
  const handleSquareClick = useCallback(
    (position: ChessPosition) => {
      if (isGameOver) return;

      // Clear any existing notifications
      setNotification(null);

      const pieceKey = `${position.file},${position.rank}`;
      const clickedPiece = boardState.get(pieceKey);

      // If no piece is selected
      if (!selectedSquare) {
        // Can only select pieces of the current turn
        if (clickedPiece && clickedPiece.color === currentTurn) {
          setSelectedSquare(position);
          const moves = getPossibleMoves(position);
          setValidMoves(moves);
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
      if (clickedPiece && clickedPiece.color === currentTurn) {
        setSelectedSquare(position);
        const moves = getPossibleMoves(position);
        setValidMoves(moves);
        return;
      }

      // Try to make a move from selected square to clicked square
      const isValidMove = validMoves.some(
        move => move.file === position.file && move.rank === position.rank
      );

      if (isValidMove) {
        const result = makeMove(selectedSquare, position);
        if (result.success) {
          setSelectedSquare(null);
          setValidMoves([]);
          setNotification(
            `Move successful! ${currentTurn === 'WHITE' ? 'Black' : 'White'}'s turn.`
          );
        } else {
          setNotification(result.error || 'Move failed');
        }
      } else {
        setNotification('Invalid move');
        setSelectedSquare(null);
        setValidMoves([]);
      }
    },
    [
      isGameOver,
      boardState,
      selectedSquare,
      currentTurn,
      validMoves,
      makeMove,
      getPossibleMoves,
    ]
  );

  // Handle piece moves via drag and drop
  const handlePieceMove = useCallback(
    (from: ChessPosition, to: ChessPosition) => {
      if (isGameOver) return;

      const result = makeMove(from, to);
      if (result.success) {
        setSelectedSquare(null);
        setValidMoves([]);
        setNotification(
          `Move successful! ${currentTurn === 'WHITE' ? 'Black' : 'White'}'s turn.`
        );
      } else {
        setNotification(result.error || 'Move failed');
      }
    },
    [isGameOver, makeMove, currentTurn]
  );

  // Auto-dismiss notifications
  React.useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Get status message based on game state
  const getStatusMessage = () => {
    if (isGameOver) {
      switch (gameResult) {
        case 'WHITE_WINS':
          return {
            text: 'White wins by checkmate!',
            icon: <EmojiEvents />,
            severity: 'success' as const,
          };
        case 'BLACK_WINS':
          return {
            text: 'Black wins by checkmate!',
            icon: <EmojiEvents />,
            severity: 'success' as const,
          };
        case 'DRAW':
          return {
            text: 'Game drawn by stalemate!',
            icon: <Handshake />,
            severity: 'info' as const,
          };
      }
    }
    return null;
  };

  const statusMessage = getStatusMessage();
  const moveCount = Math.ceil(moveHistory.length / 2);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        width: '100%',
      }}
    >
      {/* Game Status Alert */}
      {showGameStatus && statusMessage && (
        <Alert
          severity={statusMessage.severity}
          icon={statusMessage.icon}
          sx={{ width: '100%', maxWidth: 600 }}
        >
          <Typography variant="h6">{statusMessage.text}</Typography>
        </Alert>
      )}

      {/* Turn and Move Info */}
      {(showTurnIndicator || showMoveCounter) && !isGameOver && (
        <Card sx={{ width: '100%', maxWidth: 600 }}>
          <CardContent sx={{ py: 1.5 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              {showTurnIndicator && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <SportsMartialArts
                    sx={{
                      color: currentTurn === 'WHITE' ? 'grey.100' : 'grey.800',
                      bgcolor:
                        currentTurn === 'WHITE' ? 'grey.800' : 'grey.100',
                      borderRadius: '50%',
                      p: 0.5,
                    }}
                  />
                  <Typography variant="body1" fontWeight={600}>
                    {currentTurn === 'WHITE' ? 'White' : 'Black'} to move
                  </Typography>
                </Stack>
              )}

              {showMoveCounter && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Schedule fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    Move {moveCount}
                  </Typography>
                </Stack>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* The Diamond Chess Board */}
      <Box sx={{ position: 'relative' }}>
        <DiamondBoard
          boardState={boardState}
          currentTurn={currentTurn}
          onSquareClick={handleSquareClick}
          onPieceMove={handlePieceMove}
          selectedSquare={selectedSquare}
          validMoves={validMoves}
          readOnly={isGameOver}
          // Demo mode: pass custom player components if provided
          player1={undefined} // We'll handle this via custom components
          player2={undefined}
          currentUserId={undefined}
          matchStatus="IN_PROGRESS"
        />

        {/* Custom Player Components */}
        {/* The custom player components are now passed as props to the DiamondBoard component */}
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
            maxWidth: 400,
          }}
        >
          {notification}
        </Alert>
      )}
    </Box>
  );
}
