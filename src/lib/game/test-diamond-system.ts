/**
 * Test Diamond Chess System
 * Quick verification that coordinate system and board setup work correctly
 */

import { diamondCoords } from './coordinates';
import { boardSetup } from './boardSetup';
import { pieceMovement } from './pieceMovement';

export function testDiamondSystem(): void {
  console.log('🔍 Testing Diamond Chess System...\n');

  // Test 1: Coordinate Conversion
  console.log('1. Testing Coordinate Conversion:');

  // Test some key positions
  const testPositions = [
    { file: 0, rank: 0 }, // a1 -> bottom-left corner
    { file: 4, rank: 0 }, // e1 -> white king start
    { file: 3, rank: 0 }, // d1 -> white queen start
    { file: 7, rank: 7 }, // h8 -> top-right corner
    { file: 4, rank: 7 }, // e8 -> black king start
  ];

  for (const stdPos of testPositions) {
    const diamondPos = diamondCoords.standardToDiamond(stdPos);
    const backToStd = diamondCoords.diamondToStandard(diamondPos);
    const algebraic = diamondCoords.toAlgebraic(diamondPos);

    console.log(
      `  ${algebraic}: std(${stdPos.file},${stdPos.rank}) <-> diamond(${diamondPos.x},${diamondPos.y}) -> ✓`
    );

    // Verify round-trip conversion
    if (
      !backToStd ||
      backToStd.file !== stdPos.file ||
      backToStd.rank !== stdPos.rank
    ) {
      console.error(`  ❌ Round-trip conversion failed for ${algebraic}`);
    }
  }

  // Test 2: Board Setup
  console.log('\n2. Testing Board Setup:');
  const initialBoard = boardSetup.createInitialBoard();

  console.log(`  Total pieces on board: ${initialBoard.size}`);
  console.log(`  Expected: 32 pieces`);

  if (initialBoard.size === 32) {
    console.log('  ✅ Correct number of pieces');
  } else {
    console.log('  ❌ Wrong number of pieces');
  }

  // Verify king positions
  const whiteKing = boardSetup.findKing(initialBoard, 'WHITE');
  const blackKing = boardSetup.findKing(initialBoard, 'BLACK');

  if (whiteKing && blackKing) {
    const whiteKingAlgebraic = diamondCoords.toAlgebraic(whiteKing);
    const blackKingAlgebraic = diamondCoords.toAlgebraic(blackKing);
    console.log(`  White king at: ${whiteKingAlgebraic} (should be e1)`);
    console.log(`  Black king at: ${blackKingAlgebraic} (should be e8)`);
  }

  // Test 3: Pawn Movement
  console.log('\n3. Testing Pawn Movement:');

  // Test white pawn moves
  const whitePawnPos = diamondCoords.fromAlgebraic('e2'); // White pawn starting position
  if (whitePawnPos) {
    console.log(
      `  Testing white pawn at e2: diamond(${whitePawnPos.x}, ${whitePawnPos.y})`
    );
    const whitePawn = boardSetup.getPieceAt(initialBoard, whitePawnPos);
    if (whitePawn) {
      console.log(`  Found piece: ${whitePawn.color} ${whitePawn.type}`);

      // Debug: Check expected move positions
      console.log('  Expected move positions (NW/NE):');
      const expectedMoves = [
        { x: whitePawnPos.x - 1, y: whitePawnPos.y - 1 }, // NW
        { x: whitePawnPos.x + 1, y: whitePawnPos.y - 1 }, // NE
      ];

      for (const move of expectedMoves) {
        const algebraic = diamondCoords.toAlgebraic(move);
        const occupied = boardSetup.getPieceAt(initialBoard, move);
        console.log(
          `    -> ${algebraic} (${move.x},${move.y}): ${occupied ? `occupied by ${occupied.color} ${occupied.type}` : 'empty'}`
        );
      }

      // Test capture position (straight forward)
      const capturePos = { x: whitePawnPos.x, y: whitePawnPos.y - 1 };
      const captureAlgebraic = diamondCoords.toAlgebraic(capturePos);
      const captureOccupied = boardSetup.getPieceAt(initialBoard, capturePos);
      console.log(
        `  Expected capture position (N): ${captureAlgebraic} (${capturePos.x},${capturePos.y}): ${captureOccupied ? `occupied by ${captureOccupied.color} ${captureOccupied.type}` : 'empty'}`
      );

      const moves = pieceMovement.getPossibleMoves(
        whitePawn,
        whitePawnPos,
        initialBoard
      );
      console.log(`  White pawn at e2 can move to ${moves.length} positions`);
      for (const move of moves) {
        const moveAlgebraic = diamondCoords.toAlgebraic(move);
        console.log(`    -> ${moveAlgebraic} (${move.x},${move.y})`);
      }
    } else {
      console.log('  ❌ No piece found at e2');
    }
  } else {
    console.log('  ❌ Could not convert e2 to diamond coordinates');
  }

  // Test 4: Visual Board Display
  console.log('\n4. Diamond Board Layout:');
  console.log(boardSetup.boardToString(initialBoard));

  console.log('\n🎉 Diamond Chess System Test Complete!');
}

// Function to test individual coordinate conversions
export function testCoordinateExamples(): void {
  console.log('📐 Coordinate System Examples:\n');

  // Show how standard chess board maps to diamond
  console.log('Standard -> Diamond Coordinate Mapping:');
  console.log('(Note: Diamond Y-axis is flipped for intuitive display)\n');

  for (let rank = 7; rank >= 0; rank--) {
    const line: string[] = [];
    for (let file = 0; file < 8; file++) {
      const stdPos = { file, rank };
      const diamondPos = diamondCoords.standardToDiamond(stdPos);
      const algebraic = diamondCoords.toAlgebraic(diamondPos);
      line.push(
        `${algebraic}(${diamondPos.x.toString().padStart(2)},${diamondPos.y.toString().padStart(2)})`
      );
    }
    console.log(`Rank ${rank + 1}: ${line.join(' ')}`);
  }
}

// Export for easy testing
export { diamondCoords, boardSetup, pieceMovement };
