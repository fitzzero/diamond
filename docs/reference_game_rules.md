# Diamond Chess - Game System Architecture & Rules

## Overview

Diamond Chess is standard chess played on a board rotated 45° into a diamond shape. The game maintains the strategic depth of chess while introducing unique visual presentation and modified pawn mechanics.

## Core Architecture Principles

### 1. Dual Coordinate System

**Primary System: Standard Chess Coordinates**

- All game logic operates on standard 8x8 chess coordinates
- `file`: 0-7 (left to right, a-h columns)
- `rank`: 0-7 (bottom to top, 1-8 rows)
- Bottom-left corner [0,0] = a1, top-right corner [7,7] = h8

**Display System: Diamond Visual Transformation**

- Only used for UI rendering and visual positioning
- Standard board rotated 45° to create diamond appearance
- Coordinate mapping: [0,0] (a1) = center-left, [7,7] (h8) = center-right

### 2. Key Design Decision

**Why Standard Coordinates?**

- Chess rules are designed for rectangular grids
- Piece movement logic remains simple and correct
- Easy validation and familiar notation
- Diamond view is purely cosmetic transformation

## File Architecture

### Core Game Logic (`src/lib/game/`)

#### `coordinates.ts` - Coordinate System Management

```typescript
export const chessCoords = new ChessCoordinateSystem();
```

**Key Functions:**

- `chessToDisplayDiamond()` - Convert chess position to diamond display coordinates
- `displayDiamondToChess()` - Convert diamond display back to chess position
- `positionToKey()` / `keyToPosition()` - String serialization for Map storage
- `notationToPosition()` / `positionToNotation()` - Algebraic notation conversion

**Transformation Formula:**

```
Diamond Display Position:
x = 0.5 * (file + rank) - 3.5
y = 0.5 * (rank - file)

Chess Position Mapping:
[0,0] a1 = center-left    (-3.5, 0)
[0,7] a8 = top-center     (0, 3.5)
[7,0] h1 = bottom-center  (0, -3.5)
[7,7] h8 = center-right   (3.5, 0)
```

#### `pieceMovement.ts` - Piece Movement Rules

```typescript
export const pieceMovement = new StandardPieceMovement();
```

**Standard Chess Pieces:**

- King: One square in any direction
- Queen: Unlimited diagonal + orthogonal
- Rook: Unlimited orthogonal
- Bishop: Unlimited diagonal
- Knight: L-shaped moves (2+1 squares)

**Diamond Chess Pawn Rules:**

- **White Pawns**:
  - Move: Left (`file-1`) OR Up (`rank+1`) - separate moves
  - Capture: Only diagonally Top-Left (`file-1, rank+1`)
- **Black Pawns**:
  - Move: Right (`file+1`) OR Down (`rank-1`) - separate moves
  - Capture: Only diagonally Bottom-Right (`file+1, rank-1`)

#### `moveValidation.ts` - Game State Validation

```typescript
export const moveValidator = new StandardMoveValidator();
```

**Key Methods:**

- `validateMove()` - Check if move is legal for piece and doesn't expose king
- `getAllLegalMoves()` - Get all valid moves for current player
- `isInCheck()` - Determine if king is under attack
- `isCheckmate()` - Check if player is in check with no legal moves
- `isStalemate()` - Check if player has no legal moves but not in check

#### `boardSetup.ts` - Initial Piece Placement

```typescript
export const boardSetup = new DiamondBoardSetup();
```

**Diamond Formation (24 pieces total):**

**White Pieces (Bottom Formation):**

- King: [7,0] (bottom-center)
- Queen: [6,1]
- Rooks: [5,1], [6,2]
- Bishops: [5,0], [7,1]
- Knights: [6,0], [7,2]
- Pawns: [3,0], [4,0], [4,1], [5,2], [6,3], [7,4], [7,3]

**Black Pieces (Top Formation - Mirrored):**

- King: [0,7] (top-center)
- Queen: [1,6]
- Rooks: [2,6], [1,5]
- Bishops: [2,7], [0,6]
- Knights: [1,7], [0,5]
- Pawns: [4,7], [3,7], [3,6], [2,5], [1,4], [0,3], [0,4]

### Server Actions (`src/lib/actions/gameActions.ts`)

**Core Functions:**

- `createMatch()` - Create new match waiting for player 2
- `joinMatch()` - Join existing match and start game
- `makeMove()` - Validate and execute player moves
- `getMatchSession()` - Get unified match + game state for polling

**Endgame Detection:**

```typescript
// Automatic winner declaration
if (moveValidator.isCheckmate(gameState)) {
  gameStatus = 'CHECKMATE';
  gameResult = nextTurn === 'WHITE' ? 'BLACK_WINS' : 'WHITE_WINS';
  matchWinnerId = winner's userId;
}
```

### Data Types (`src/types/game.ts`)

**Core Position Types:**

```typescript
interface ChessPosition {
  file: number; // 0-7 (a-h)
  rank: number; // 0-7 (1-8)
}

interface DiamondDisplayPosition {
  x: number; // Diamond x-coordinate for visual display
  y: number; // Diamond y-coordinate for visual display
}

interface Move {
  from: ChessPosition;
  to: ChessPosition;
  piece: Piece;
  capturedPiece?: Piece;
}
```

**Game State:**

```typescript
type BoardState = Map<string, Piece>; // key: "file,rank"

interface EnhancedGameState {
  boardState: BoardState;
  currentTurn: PieceColor;
  status: GameStatus;
  moveHistory: Move[];
  // ... match and player data
}
```

## UI Components (`src/components/game/`)

### `DiamondBoard.tsx` - Main Board Component

**Key Features:**

- Renders 64 squares in diamond formation
- Handles click-based piece movement
- Shows move highlights and valid move indicators
- Displays coordinate labels (a-h files, 1-8 ranks)

**Coordinate Transformation:**

```typescript
// Convert chess position to screen coordinates
const diamondPos = chessCoords.chessToDisplayDiamond(chessPosition);
const screenX = centerX + diamondPos.x * squareSize;
const screenY = centerY - diamondPos.y * squareSize; // Y-axis flipped
```

### `PlayerCard.tsx` - Player Information

**Features:**

- Turn indicator ("Your Turn!" / "Waiting...")
- Winner/loser visual feedback (neon glow animations)
- Player color and piece counts
- Game completion status

### `MoveHistory.tsx` - Move Tracking

**Features:**

- Displays moves in algebraic notation (e.g., "Pawn a1-a2")
- Real-time updates as moves are made
- Scrollable history list

## Real-time System

### SWR Integration (`src/hooks/useGame.ts`)

**`useMatchSession()` Hook:**

- Unified polling for match + game state
- 2-second refresh interval
- Optimistic updates for smooth UX
- Automatic error handling and retries

**Data Flow:**

1. Client calls `makeMove()` server action
2. Optimistic update applied immediately
3. Server validates move and updates database
4. SWR polling picks up changes within 2 seconds
5. All clients receive synchronized state

## Game Rules Summary

### Diamond Chess Differences from Standard Chess

1. **Board Orientation**: 45° rotated diamond shape (visual only)

2. **Starting Formation**: Custom 24-piece symmetric layout around diamond points

3. **Pawn Movement** (Major Rule Change):
   - **White**: Move Left OR Up, capture diagonally Top-Left only
   - **Black**: Move Right OR Down, capture diagonally Bottom-Right only
   - No initial 2-square moves
   - No en passant

4. **All Other Pieces**: Follow standard chess movement rules

### Win Conditions

- **Checkmate**: King in check with no legal moves → Opponent wins
- **Stalemate**: No legal moves but not in check → Draw
- **Draw**: Agreed draw (future feature)
- **Resignation**: Player surrenders (future feature)

## Development Patterns

### Adding New Piece Types

1. Add piece type to `PieceType` enum in `types/game.ts`
2. Implement movement logic in `pieceMovement.ts`
3. Add piece to initial setup in `boardSetup.ts`
4. Update UI piece rendering in `DiamondBoard.tsx`

### Modifying Game Rules

1. Update movement logic in `pieceMovement.ts`
2. Adjust validation in `moveValidation.ts` if needed
3. Test with `/test-diamond` page
4. Update this documentation

### Performance Considerations

- BoardState uses Map for O(1) piece lookups
- Move validation caches legal moves per turn
- SWR deduplicates simultaneous requests
- Optimistic updates minimize perceived latency

## Testing & Debugging

### Test Page: `/test-diamond`

- Visual board state debugging
- Move calculation testing
- Coordinate transformation validation
- Piece placement verification

### Development Tools

- Console logging for move validation
- Real-time state inspection
- Move history tracking
- Error boundary handling

This architecture provides a solid foundation for the Diamond Chess game while maintaining clear separation of concerns between game logic, visual presentation, and real-time synchronization.
