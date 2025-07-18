'use client';

import { useState, useMemo } from 'react';
import { Container, Typography, Button, Stack, Box } from '@mui/material';
import { MainLayout } from '@/components/layout';
import { DiamondBoard } from '@/components/game';
import { BoardSetup } from '@/lib/game/boardSetup';
import type { DiamondPosition, PieceColor } from '@/types/game';

export default function BoardTestPage() {
  const [selectedSquare, setSelectedSquare] = useState<DiamondPosition | null>(
    null
  );
  const [currentTurn, setCurrentTurn] = useState<PieceColor>('WHITE');

  // Create initial board state
  const boardState = useMemo(() => {
    const setup = new BoardSetup();
    return setup.createInitialBoard();
  }, []);

  const handleSquareClick = (position: DiamondPosition) => {
    console.log('Square clicked:', position);
    setSelectedSquare(position);
  };

  const switchTurn = () => {
    setCurrentTurn(prev => (prev === 'WHITE' ? 'BLACK' : 'WHITE'));
  };

  const resetSelection = () => {
    setSelectedSquare(null);
  };

  // Analyze board layout for debugging
  const boardAnalysis = useMemo(() => {
    const setup = new BoardSetup();
    const pieces = Array.from(boardState.entries()).map(([key, piece]) => {
      const [x, y] = key.split(',').map(Number);
      return { position: { x, y }, piece, key };
    });

    // Sort by Y coordinate (top to bottom of diamond)
    pieces.sort((a, b) => b.position.y - a.position.y);

    const whitePieces = pieces.filter(p => p.piece.color === 'WHITE');
    const blackPieces = pieces.filter(p => p.piece.color === 'BLACK');

    return {
      allPieces: pieces,
      whitePieces: whitePieces.sort((a, b) => a.position.x - b.position.x),
      blackPieces: blackPieces.sort((a, b) => a.position.x - b.position.x),
    };
  }, [boardState]);

  return (
    <MainLayout title="Diamond Chess Board Test">
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            🔬 Testing the Diamond Chess Board
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            This page shows the DiamondBoard component with the initial piece
            setup. Click on squares to test piece selection!
          </Typography>

          <Stack
            direction="row"
            spacing={2}
            justifyContent="center"
            sx={{ mt: 3 }}
          >
            <Button
              variant="outlined"
              onClick={switchTurn}
              color={currentTurn === 'WHITE' ? 'primary' : 'secondary'}
            >
              Switch Turn: {currentTurn}
            </Button>
            <Button variant="outlined" onClick={resetSelection}>
              Clear Selection
            </Button>
          </Stack>
        </Box>

        {/* The Diamond Board Component */}
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <DiamondBoard
            boardState={boardState}
            currentTurn={currentTurn}
            onSquareClick={handleSquareClick}
            selectedSquare={selectedSquare}
            validMoves={[]} // No move validation for this test
            highlightedSquares={[]}
            readOnly={false}
          />
        </Box>

        {/* Debug Information */}
        <Box sx={{ mt: 4, p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Debug Information
          </Typography>
          <Typography variant="body2">
            <strong>Total Pieces:</strong>{' '}
            {Array.from(boardState.values()).length}
          </Typography>
          <Typography variant="body2">
            <strong>White Pieces:</strong>{' '}
            {
              Array.from(boardState.values()).filter(p => p.color === 'WHITE')
                .length
            }
          </Typography>
          <Typography variant="body2">
            <strong>Black Pieces:</strong>{' '}
            {
              Array.from(boardState.values()).filter(p => p.color === 'BLACK')
                .length
            }
          </Typography>
          {selectedSquare && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>Selected Square:</strong> ({selectedSquare.x},{' '}
              {selectedSquare.y})
            </Typography>
          )}
        </Box>

        {/* Layout Analysis */}
        <Box sx={{ mt: 3, p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Board Layout Analysis
          </Typography>

          <Typography variant="subtitle2" color="primary" sx={{ mt: 2 }}>
            🖤 Black Pieces (Top of Diamond):
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 1,
              fontSize: '0.875rem',
            }}
          >
            {boardAnalysis.blackPieces.map(({ position, piece, key }) => (
              <Typography key={key} variant="caption">
                ({position.x},{position.y}): {piece.type}
              </Typography>
            ))}
          </Box>

          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
            🤍 White Pieces (Bottom of Diamond):
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 1,
              fontSize: '0.875rem',
            }}
          >
            {boardAnalysis.whitePieces.map(({ position, piece, key }) => (
              <Typography key={key} variant="caption">
                ({position.x},{position.y}): {piece.type}
              </Typography>
            ))}
          </Box>

          <Typography variant="subtitle2" sx={{ mt: 2 }}>
            Expected Layout (per screenshot):
          </Typography>
          <Typography variant="caption" display="block">
            • Black pieces should be at top of diamond (negative Y values)
          </Typography>
          <Typography variant="caption" display="block">
            • White pieces should be at bottom of diamond (positive Y values)
          </Typography>
          <Typography variant="caption" display="block">
            • Black back rank: rook, knight, bishop, queen, king, bishop,
            knight, rook
          </Typography>
          <Typography variant="caption" display="block">
            • White back rank: rook, knight, bishop, queen, king, bishop,
            knight, rook
          </Typography>
        </Box>

        {/* Piece List */}
        <Box sx={{ mt: 3, p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            All Pieces on Board
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 1,
              fontSize: '0.875rem',
            }}
          >
            {Array.from(boardState.entries()).map(([key, piece]) => (
              <Typography key={key} variant="caption">
                {key}: {piece.color[0]}
                {piece.type[0].toUpperCase()}
              </Typography>
            ))}
          </Box>
        </Box>
      </Container>
    </MainLayout>
  );
}
