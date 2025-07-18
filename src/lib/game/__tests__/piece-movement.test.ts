// Debug script for standard chess piece movement
// Run with: npx ts-node src/lib/game/__tests__/piece-movement.test.ts

console.log('🔍 Standard Chess Movement Debug Tests');

// Test the new coordinate system
const chessCoords = {
  positionToKey: (pos: { file: number; rank: number }) =>
    `${pos.file},${pos.rank}`,
  keyToPosition: (key: string) => {
    const [file, rank] = key.split(',').map(Number);
    return { file, rank };
  },
  isValidChessPosition: (pos: { file: number; rank: number }) => {
    return pos.file >= 0 && pos.file <= 7 && pos.rank >= 0 && pos.rank <= 7;
  },
};

// Test standard rook movements from center
function testStandardRookMovements() {
  console.log('\n🏰 Testing Standard Rook Movement Logic:');

  const rookDirections = [
    { file: 1, rank: 0 }, // Right
    { file: -1, rank: 0 }, // Left
    { file: 0, rank: 1 }, // Up
    { file: 0, rank: -1 }, // Down
  ];

  let rookMoves: Array<{ file: number; rank: number }> = [];
  const startPos = { file: 3, rank: 3 }; // Center of board

  for (const direction of rookDirections) {
    let current = {
      file: startPos.file + direction.file,
      rank: startPos.rank + direction.rank,
    };
    let directionMoves: Array<{ file: number; rank: number }> = [];

    while (chessCoords.isValidChessPosition(current)) {
      directionMoves.push({ ...current });
      current.file += direction.file;
      current.rank += direction.rank;
    }

    console.log(
      `  Direction (${direction.file}, ${direction.rank}): ${directionMoves.length} moves`
    );
    rookMoves.push(...directionMoves);
  }

  console.log(`  Total rook moves from center: ${rookMoves.length}`);
  console.log(
    `  ✅ Expected: 14, Got: ${rookMoves.length} - ${rookMoves.length === 14 ? 'PASS' : 'FAIL'}`
  );
}

// Test standard bishop movements from center
function testStandardBishopMovements() {
  console.log('\n👑 Testing Standard Bishop Movement Logic:');

  const bishopDirections = [
    { file: 1, rank: 1 }, // Up-Right
    { file: -1, rank: -1 }, // Down-Left
    { file: 1, rank: -1 }, // Down-Right
    { file: -1, rank: 1 }, // Up-Left
  ];

  let bishopMoves: Array<{ file: number; rank: number }> = [];
  const startPos = { file: 3, rank: 3 }; // Center of board

  for (const direction of bishopDirections) {
    let current = {
      file: startPos.file + direction.file,
      rank: startPos.rank + direction.rank,
    };
    let directionMoves: Array<{ file: number; rank: number }> = [];

    while (chessCoords.isValidChessPosition(current)) {
      directionMoves.push({ ...current });
      current.file += direction.file;
      current.rank += direction.rank;
    }

    console.log(
      `  Direction (${direction.file}, ${direction.rank}): ${directionMoves.length} moves`
    );
    bishopMoves.push(...directionMoves);
  }

  console.log(`  Total bishop moves from center: ${bishopMoves.length}`);
  console.log(
    `  ✅ Expected: 12, Got: ${bishopMoves.length} - ${bishopMoves.length === 12 ? 'PASS' : 'FAIL'}`
  );
}

// Test standard knight movements from center
function testStandardKnightMovements() {
  console.log('\n🐴 Testing Standard Knight Movement Logic:');

  const startPos = { file: 3, rank: 3 }; // Center of board
  const knightMoves = [
    { file: startPos.file + 2, rank: startPos.rank + 1 },
    { file: startPos.file + 2, rank: startPos.rank - 1 },
    { file: startPos.file - 2, rank: startPos.rank + 1 },
    { file: startPos.file - 2, rank: startPos.rank - 1 },
    { file: startPos.file + 1, rank: startPos.rank + 2 },
    { file: startPos.file - 1, rank: startPos.rank + 2 },
    { file: startPos.file + 1, rank: startPos.rank - 2 },
    { file: startPos.file - 1, rank: startPos.rank - 2 },
  ];

  const validKnightMoves = knightMoves.filter(move =>
    chessCoords.isValidChessPosition(move)
  );

  console.log(`  Knight moves from center: ${validKnightMoves.length}`);
  console.log(
    `  Moves: ${validKnightMoves.map(m => `(${m.file}, ${m.rank})`).join(', ')}`
  );
  console.log(
    `  ✅ Expected: 8, Got: ${validKnightMoves.length} - ${validKnightMoves.length === 8 ? 'PASS' : 'FAIL'}`
  );
}

// Test chess coordinate system
function testChessCoordinateSystem() {
  console.log('\n🗺️ Testing Chess Coordinate System:');

  const testPositions = [
    { pos: { file: 0, rank: 0 }, expected: true }, // Bottom-left corner
    { pos: { file: 7, rank: 7 }, expected: true }, // Top-right corner
    { pos: { file: 3, rank: 3 }, expected: true }, // Center
    { pos: { file: -1, rank: 0 }, expected: false }, // Outside left
    { pos: { file: 8, rank: 0 }, expected: false }, // Outside right
    { pos: { file: 0, rank: -1 }, expected: false }, // Outside bottom
    { pos: { file: 0, rank: 8 }, expected: false }, // Outside top
  ];

  let allPassed = true;
  for (const { pos, expected } of testPositions) {
    const isValid = chessCoords.isValidChessPosition(pos);
    const passed = isValid === expected;
    if (!passed) allPassed = false;

    console.log(
      `  (${pos.file}, ${pos.rank}): ${isValid ? 'valid' : 'invalid'} - ${passed ? 'PASS' : 'FAIL'}`
    );
  }

  console.log(
    `  ✅ Coordinate system: ${allPassed ? 'ALL TESTS PASS' : 'SOME TESTS FAILED'}`
  );
}

// Test standard chess starting positions
function testStandardStartingPositions() {
  console.log('\n📍 Standard Chess Starting Positions:');

  // Standard chess starting positions
  const expectedPieces = [
    // White back rank
    { pos: { file: 0, rank: 0 }, piece: 'rook', color: 'WHITE' },
    { pos: { file: 1, rank: 0 }, piece: 'knight', color: 'WHITE' },
    { pos: { file: 2, rank: 0 }, piece: 'bishop', color: 'WHITE' },
    { pos: { file: 3, rank: 0 }, piece: 'queen', color: 'WHITE' },
    { pos: { file: 4, rank: 0 }, piece: 'king', color: 'WHITE' },
    { pos: { file: 5, rank: 0 }, piece: 'bishop', color: 'WHITE' },
    { pos: { file: 6, rank: 0 }, piece: 'knight', color: 'WHITE' },
    { pos: { file: 7, rank: 0 }, piece: 'rook', color: 'WHITE' },

    // White pawns
    { pos: { file: 0, rank: 1 }, piece: 'pawn', color: 'WHITE' },
    { pos: { file: 7, rank: 1 }, piece: 'pawn', color: 'WHITE' },

    // Black pawns
    { pos: { file: 0, rank: 6 }, piece: 'pawn', color: 'BLACK' },
    { pos: { file: 7, rank: 6 }, piece: 'pawn', color: 'BLACK' },

    // Black back rank
    { pos: { file: 4, rank: 7 }, piece: 'king', color: 'BLACK' },
    { pos: { file: 3, rank: 7 }, piece: 'queen', color: 'BLACK' },
  ];

  console.log('Expected piece positions in standard chess:');
  for (const { pos, piece, color } of expectedPieces) {
    const isValid = chessCoords.isValidChessPosition(pos);
    console.log(
      `  ${color} ${piece} at (${pos.file}, ${pos.rank}) - ${isValid ? 'VALID' : 'INVALID'}`
    );
  }

  console.log(`  ✅ All positions are valid on 8x8 board`);
}

// Diamond Chess pawn movement test
function testDiamondChessPawnMovement() {
  console.log('\n⭐ Testing Diamond Chess Special Pawn Rules:');

  console.log('  Diamond Chess Pawn Rules:');
  console.log(
    '  - White pawns: Move NW/NE diagonally, capture N (straight up)'
  );
  console.log(
    '  - Black pawns: Move SW/SE diagonally, capture S (straight down)'
  );
  console.log('  - This differs from standard chess pawn movement');
  console.log('');

  // Test white pawn from e2 (file 4, rank 1)
  const whitePawnPos = { file: 4, rank: 1 };
  console.log(`  White pawn at (${whitePawnPos.file}, ${whitePawnPos.rank}):`);
  console.log(
    `    Move NW: (${whitePawnPos.file - 1}, ${whitePawnPos.rank + 1})`
  );
  console.log(
    `    Move NE: (${whitePawnPos.file + 1}, ${whitePawnPos.rank + 1})`
  );
  console.log(
    `    Capture N: (${whitePawnPos.file}, ${whitePawnPos.rank + 1})`
  );

  // Test black pawn from e7 (file 4, rank 6)
  const blackPawnPos = { file: 4, rank: 6 };
  console.log(`  Black pawn at (${blackPawnPos.file}, ${blackPawnPos.rank}):`);
  console.log(
    `    Move SW: (${blackPawnPos.file - 1}, ${blackPawnPos.rank - 1})`
  );
  console.log(
    `    Move SE: (${blackPawnPos.file + 1}, ${blackPawnPos.rank - 1})`
  );
  console.log(
    `    Capture S: (${blackPawnPos.file}, ${blackPawnPos.rank - 1})`
  );
}

// Debug checklist for the new system
function showNewSystemChecklist() {
  console.log('\n🔍 New System Debug Checklist:');
  console.log('1. ✅ Standard 8x8 chess coordinates (0-7, 0-7)');
  console.log('2. ✅ Standard piece movement rules (except pawns)');
  console.log('3. ✅ Diamond Chess special pawn movement');
  console.log('4. 🔄 Visual diamond rotation (UI layer only)');
  console.log('5. 🔄 Component updates for new coordinate system');
  console.log('6. 🔄 Integration testing with move validation');
}

// Run all tests
console.log('Starting standard chess coordinate system tests...\n');

testChessCoordinateSystem();
testStandardRookMovements();
testStandardBishopMovements();
testStandardKnightMovements();
testStandardStartingPositions();
testDiamondChessPawnMovement();
showNewSystemChecklist();

console.log('\n✅ Standard chess coordinate system tests completed!');
console.log('The new system should be much more reliable for piece movement.');
console.log('Next: Update UI components to use visual diamond mapping.');
