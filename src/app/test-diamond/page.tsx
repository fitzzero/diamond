'use client';

import { useState } from 'react';
import { Box, Typography, Button, Paper, Stack } from '@mui/material';
import { MainLayout } from '@/components/layout';
import { DiamondBoard } from '@/components/game';
import { testDiamondSystem } from '@/lib/game/test-diamond-system';
import { boardSetup } from '@/lib/game/boardSetup';
import { moveValidator } from '@/lib/game/moveValidation';
import { diamondCoords } from '@/lib/game/coordinates';
import type {
  BoardState,
  PieceColor,
  DiamondPosition,
  Move,
} from '@/types/game';
import { pieceMovement } from '@/lib/game/pieceMovement';

export default function TestDiamondPage() {
  const [board, setBoard] = useState<BoardState>(
    boardSetup.createInitialBoard()
  );
  const [currentTurn, setCurrentTurn] = useState<PieceColor>('WHITE');
  const [testResults, setTestResults] = useState<string>('');
  const [selectedSquare, setSelectedSquare] = useState<DiamondPosition | null>(
    null
  );
  const [validMoves, setValidMoves] = useState<DiamondPosition[]>([]);

  const showBoardContents = () => {
    console.log('\n📋 Current Board Contents:');
    console.log('White pieces:');
    for (const [key, piece] of board.entries()) {
      if (piece.color === 'WHITE') {
        const pos = diamondCoords.keyToPosition(key);
        console.log(`  ${piece.type} at (${pos.x}, ${pos.y})`);
      }
    }
    console.log('Black pieces:');
    for (const [key, piece] of board.entries()) {
      if (piece.color === 'BLACK') {
        const pos = diamondCoords.keyToPosition(key);
        console.log(`  ${piece.type} at (${pos.x}, ${pos.y})`);
      }
    }
  };

  const testKingAndCheckDetection = () => {
    console.log('\n👑 Testing King Finding and Check Detection:');

    // Test if we can find the kings
    const whiteKing = boardSetup.findKing(board, 'WHITE');
    const blackKing = boardSetup.findKing(board, 'BLACK');

    console.log(
      `White king position: ${whiteKing ? `(${whiteKing.x}, ${whiteKing.y})` : 'NOT FOUND'}`
    );
    console.log(
      `Black king position: ${blackKing ? `(${blackKing.x}, ${blackKing.y})` : 'NOT FOUND'}`
    );

    // Test check detection on initial board
    const whiteInCheck = moveValidator.isInCheck(board, 'WHITE');
    const blackInCheck = moveValidator.isInCheck(board, 'BLACK');

    console.log(`White in check: ${whiteInCheck}`);
    console.log(`Black in check: ${blackInCheck}`);

    // Test a simple move that shouldn't cause check
    const pawnPos = { x: -2, y: 3 };
    const pawnPiece = board.get(diamondCoords.positionToKey(pawnPos));

    if (pawnPiece && pawnPiece.type === 'pawn') {
      console.log(`\n🧪 Testing pawn move validation:`);
      const pawnMoves = pieceMovement.getPossibleMoves(
        pawnPiece,
        pawnPos,
        board
      );
      console.log(`Pawn possible moves: ${pawnMoves.length}`);

      if (pawnMoves.length > 0) {
        const testMove = pawnMoves[0];
        const testBoard = new Map(board);
        const fromKey = diamondCoords.positionToKey(pawnPos);
        const toKey = diamondCoords.positionToKey(testMove);
        testBoard.delete(fromKey);
        testBoard.set(toKey, pawnPiece);

        const wouldCauseCheck = moveValidator.isInCheck(testBoard, 'WHITE');
        console.log(
          `Pawn move to (${testMove.x}, ${testMove.y}) would cause check: ${wouldCauseCheck}`
        );
      }
    }
  };

  const runTests = () => {
    // Capture console output
    const originalLog = console.log;
    let output = '';

    console.log = (...args) => {
      output += args.join(' ') + '\n';
      originalLog(...args);
    };

    try {
      testDiamondSystem();
      showBoardContents();
      testKingAndCheckDetection();
      testMoveHighlighting();
    } catch (error) {
      output += `Error: ${error}\n`;
    }

    console.log = originalLog;
    setTestResults(output);
  };

  const testMoveHighlighting = () => {
    console.log('\n🎯 Testing Move Highlighting Logic:');

    // Test various pieces and their move calculations
    const testPieces = [
      { pos: { x: -2, y: 3 }, name: 'pawn', color: 'WHITE' },
      { pos: { x: -1, y: 4 }, name: 'knight', color: 'WHITE' },
      { pos: { x: 1, y: 4 }, name: 'bishop', color: 'WHITE' },
      { pos: { x: -7, y: 0 }, name: 'rook', color: 'WHITE' },
    ];

    for (const test of testPieces) {
      const piece = board.get(diamondCoords.positionToKey(test.pos));

      if (piece && piece.type === test.name && piece.color === test.color) {
        console.log(
          `\n🔍 Testing ${test.name} at (${test.pos.x}, ${test.pos.y}):`
        );

        // Test direct piece movement first
        const directMoves = pieceMovement.getPossibleMoves(
          piece,
          test.pos,
          board
        );
        console.log(`  Direct moves from pieceMovement: ${directMoves.length}`);
        console.log(
          `  Direct moves: ${directMoves
            .slice(0, 5)
            .map(m => `(${m.x}, ${m.y})`)
            .join(', ')}`
        );

        // Test move validator
        const allLegalMoves = moveValidator.getAllLegalMoves(board, test.color);
        const pieceLegalMoves = allLegalMoves.filter(
          (move: Move) =>
            move.from.x === test.pos.x && move.from.y === test.pos.y
        );
        console.log(`  Legal moves from validator: ${pieceLegalMoves.length}`);
        console.log(
          `  Legal moves: ${pieceLegalMoves
            .slice(0, 5)
            .map(m => `(${m.to.x}, ${m.to.y})`)
            .join(', ')}`
        );

        // Check if moves are being filtered out by check detection
        if (directMoves.length > 0 && pieceLegalMoves.length === 0) {
          console.log(`  ❌ All moves filtered out by check detection!`);

          // Test first few moves specifically
          for (let i = 0; i < Math.min(3, directMoves.length); i++) {
            const testMove = directMoves[i];
            const testBoard = new Map(board);
            const fromKey = diamondCoords.positionToKey(test.pos);
            const toKey = diamondCoords.positionToKey(testMove);
            testBoard.delete(fromKey);
            testBoard.set(toKey, piece);

            const wouldCauseCheck = moveValidator.isInCheck(
              testBoard,
              test.color
            );
            console.log(
              `    Move ${i + 1} to (${testMove.x}, ${testMove.y}): would cause check = ${wouldCauseCheck}`
            );

            // If this move would cause check, let's see which piece is attacking the king
            if (wouldCauseCheck) {
              const kingPos = boardSetup.findKing(testBoard, test.color);
              if (kingPos) {
                console.log(
                  `    King at (${kingPos.x}, ${kingPos.y}) would be in check after this move`
                );

                // Find which enemy piece can attack the king
                const opponentColor =
                  test.color === 'WHITE' ? 'BLACK' : 'WHITE';
                for (const [enemyKey, enemyPiece] of testBoard.entries()) {
                  if (enemyPiece.color === opponentColor) {
                    const enemyPos = diamondCoords.keyToPosition(enemyKey);
                    const enemyMoves = pieceMovement.getPossibleMoves(
                      enemyPiece,
                      enemyPos,
                      testBoard
                    );

                    const canAttackKing = enemyMoves.some(
                      move => move.x === kingPos.x && move.y === kingPos.y
                    );

                    if (canAttackKing) {
                      console.log(
                        `      ${enemyPiece.color} ${enemyPiece.type} at (${enemyPos.x}, ${enemyPos.y}) can attack king`
                      );
                    }
                  }
                }
              }
            }
          }
        } else if (directMoves.length === 0) {
          console.log(
            `  ⚠️ No direct moves available from pieceMovement.getPossibleMoves()`
          );
        }
      } else {
        console.log(
          `❌ No ${test.name} found at (${test.pos.x}, ${test.pos.y})`
        );
        if (piece) {
          console.log(`  Found: ${piece.color} ${piece.type}`);
        }
      }
    }
  };

  const handleSquareClick = (position: DiamondPosition) => {
    const pieceKey = diamondCoords.positionToKey(position);
    const clickedPiece = board.get(pieceKey);

    // If no piece is selected
    if (!selectedSquare) {
      // Can only select own pieces
      if (clickedPiece && clickedPiece.color === currentTurn) {
        setSelectedSquare(position);

        // Calculate valid moves for this piece using proper move validation
        try {
          const allLegalMoves = moveValidator.getAllLegalMoves(
            board,
            currentTurn
          );
          const pieceMoves = allLegalMoves.filter(
            (move: Move) =>
              move.from.x === position.x && move.from.y === position.y
          );
          setValidMoves(pieceMoves.map((move: Move) => move.to));

          // Log for debugging
          console.log(
            `Selected ${clickedPiece.type} at (${position.x}, ${position.y})`
          );
          console.log(`Valid moves: ${pieceMoves.length}`);
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
        const allLegalMoves = moveValidator.getAllLegalMoves(
          board,
          currentTurn
        );
        const pieceMoves = allLegalMoves.filter(
          (move: Move) =>
            move.from.x === position.x && move.from.y === position.y
        );
        setValidMoves(pieceMoves.map((move: Move) => move.to));

        // Log for debugging
        console.log(
          `Selected ${clickedPiece.type} at (${position.x}, ${position.y})`
        );
        console.log(`Valid moves: ${pieceMoves.length}`);
      } catch (error) {
        console.error('Error calculating moves:', error);
        setValidMoves([]);
      }
      return;
    }

    // Clear selection if clicking on empty square or enemy piece
    setSelectedSquare(null);
    setValidMoves([]);
  };

  const resetBoard = () => {
    setBoard(boardSetup.createInitialBoard());
    setCurrentTurn('WHITE');
    setSelectedSquare(null);
    setValidMoves([]);
  };

  return (
    <MainLayout>
      <Stack spacing={3} sx={{ p: 2 }}>
        <Typography variant="h4" gutterBottom>
          Diamond Chess Movement Test
        </Typography>

        <Stack direction="row" spacing={2}>
          <Button variant="contained" onClick={runTests}>
            Run Movement Tests
          </Button>
          <Button variant="outlined" onClick={resetBoard}>
            Reset Board
          </Button>
        </Stack>

        <Typography variant="body1">
          <strong>Test Instructions:</strong>
          <br />
          1. Click on pieces to see highlighted valid moves
          <br />
          2. Bishop should show diagonal moves only
          <br />
          3. Rook should show straight (horizontal/vertical) moves only
          <br />
          4. Run tests to verify move calculation logic
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <DiamondBoard
            boardState={board}
            currentTurn={currentTurn}
            onSquareClick={handleSquareClick}
            selectedSquare={selectedSquare}
            validMoves={validMoves}
            readOnly={false}
          />
        </Box>

        {testResults && (
          <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
            <Typography variant="h6" gutterBottom>
              Test Results:
            </Typography>
            <Typography
              component="pre"
              sx={{
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                whiteSpace: 'pre-wrap',
                maxHeight: '400px',
                overflow: 'auto',
              }}
            >
              {testResults}
            </Typography>
          </Paper>
        )}
      </Stack>
    </MainLayout>
  );
}
