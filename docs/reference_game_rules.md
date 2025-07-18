# Diamond Chess - Game Rules Reference

## Overview

Diamond Chess is standard chess rotated 45° into a diamond shape with custom piece placement and modified pawn movement rules.

## Board Layout (`boardSetup.ts`)

### Starting Formation

- **48 pieces total** (24 per side) in symmetric diamond formation
- **Kings in center positions**: Black at top (0,-7), White at bottom (0,7)
- **Formation flows top-to-bottom** through the diamond

### Black Pieces (Top of Diamond)

```
Row 1: King (center)
Row 2: Rook, Rook
Row 3: Knight, Knight, Queen, Bishop, Bishop
Row 4: Pawn, Pawn, Pawn, Bishop, Knight, Knight, Pawn, Pawn, Pawn
Row 5: Pawn, Pawn, Pawn, Pawn, Pawn, Pawn, Pawn (widest part)
```

### White Pieces (Bottom of Diamond)

Mirror of black formation with same piece arrangement.

## Coordinate System (`coordinates.ts`)

### Diamond Coordinate Transformation

- **Standard chess (8x8)** → **Diamond coordinates**
- `x_diamond = file - rank`
- `y_diamond = -(file + rank - 7)`
- Valid positions form diamond shape within bounds `[-7,7]` for both x,y

### Key Methods

- `standardToDiamond()` / `diamondToStandard()` - coordinate conversion
- `isValidDiamondPosition()` - validates position within diamond bounds
- `positionToKey()` - converts position to Map key string

## Movement Rules (`pieceMovement.ts`)

### Modified Pawn Movement (Key Difference!)

**White Pawns:**

- **Movement**: NW/NE (diagonally forward toward smaller Y)
- **Capture**: Straight forward (N = smaller Y)

**Black Pawns:**

- **Movement**: SW/SE (diagonally forward toward larger Y)
- **Capture**: Straight forward (S = larger Y)

### Standard Pieces

All other pieces (Rook, Bishop, Queen, King, Knight) follow standard chess rules adapted to the diamond grid:

- **Rook**: Horizontal/vertical lines
- **Bishop**: Diagonal lines
- **Queen**: Combination of rook + bishop
- **King**: One square in any direction
- **Knight**: L-shaped moves (2+1 squares)

## Game Engine Integration

### Core Components

- **BoardState**: `Map<string, Piece>` using diamond coordinate keys
- **Move Validation**: Combines piece movement rules with board state
- **Position Keys**: Format `"x,y"` for Map storage

### Implementation Notes

- Coordinate validation ensures moves stay within diamond bounds
- Piece movement respects blocking (pieces can't jump over others except knights)
- Capture detection distinguishes between empty squares and enemy pieces
- Move generation supports both normal moves and capture-only modes

## Key Differences from Standard Chess

1. **Board Shape**: Diamond instead of square
2. **Piece Count**: 48 instead of 32 pieces
3. **Starting Formation**: Symmetric diamond layout vs traditional ranks
4. **Pawn Movement**: Diagonal movement, straight capture (reversed from standard)
5. **Coordinate System**: Diamond coordinates with transformation logic

## Technical Architecture

- **Type Safety**: Full TypeScript with `DiamondPosition`, `Piece`, `BoardState` types
- **Immutable Operations**: Board state changes return new Map instances
- **Performance**: Efficient coordinate transformations and position validation
- **Extensibility**: Modular design allows easy rule modifications
