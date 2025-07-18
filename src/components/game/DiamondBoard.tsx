'use client';

import { useState, useMemo, useCallback } from 'react';
import { Box, Typography, useTheme, useMediaQuery } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { CHESS_ICONS } from '@/lib/fontawesome';
import type {
  BoardState,
  DiamondPosition,
  Piece,
  PieceColor,
} from '@/types/game';
import { diamondCoords } from '@/lib/game/coordinates';
import { pieceMovement } from '@/lib/game/pieceMovement';

interface DiamondBoardProps {
  boardState: BoardState;
  currentTurn: PieceColor;
  onSquareClick?: (position: DiamondPosition) => void;
  onPieceMove?: (from: DiamondPosition, to: DiamondPosition) => void;
  highlightedSquares?: DiamondPosition[];
  selectedSquare?: DiamondPosition | null;
  validMoves?: DiamondPosition[];
  readOnly?: boolean;
}

interface SquareProps {
  position: DiamondPosition;
  piece?: Piece;
  isLight: boolean;
  isSelected: boolean;
  isValidMove: boolean;
  isHighlighted: boolean;
  isDragOver: boolean;
  onClick: () => void;
  onDragStart: (position: DiamondPosition) => void;
  onDragEnd: () => void;
  onDragOver: (position: DiamondPosition) => void;
  onDrop: (position: DiamondPosition) => void;
  size: number;
  left: number;
  top: number;
  readOnly: boolean;
  currentTurn: PieceColor;
}

function ChessSquare({
  position,
  piece,
  isLight,
  isSelected,
  isValidMove,
  isHighlighted,
  isDragOver,
  onClick,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  size,
  left,
  top,
  readOnly,
  currentTurn,
}: SquareProps) {
  const theme = useTheme();

  const getSquareColor = () => {
    if (isSelected) return theme.palette.warning.main;
    if (isDragOver && isValidMove) return theme.palette.success.main;
    if (isValidMove) return theme.palette.success.light;
    if (isHighlighted) return theme.palette.info.light;
    return isLight ? theme.palette.primary.main : theme.palette.primary.dark;
  };

  const canDragPiece = piece && piece.color === currentTurn && !readOnly;

  const handleDragStart = (e: React.DragEvent) => {
    if (!canDragPiece) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', diamondCoords.positionToKey(position));
    onDragStart(position);
  };

  const handleDragEnd = () => {
    onDragEnd();
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (isValidMove) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      onDragOver(position);
    }
  };

  const handleDragLeave = () => {
    // Reset drag over state when leaving
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (isValidMove) {
      onDrop(position);
    }
  };

  const getPieceIcon = () => {
    if (!piece) return null;
    const key = `${piece.color}_${piece.type}` as keyof typeof CHESS_ICONS;
    return CHESS_ICONS[key];
  };

  return (
    <Box
      onClick={onClick}
      draggable={canDragPiece}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      sx={{
        position: 'absolute',
        left,
        top,
        width: size,
        height: size,
        backgroundColor: getSquareColor(),
        border: '1px solid',
        borderColor: 'rgba(0, 0, 0, 0.2)',
        cursor: canDragPiece ? 'grab' : isValidMove ? 'pointer' : 'default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease-in-out',
        transform: 'rotate(45deg)',
        transformOrigin: 'center',
        '&:hover': {
          opacity: 0.8,
          transform: 'rotate(45deg) scale(1.05)',
        },
        '&:active': canDragPiece
          ? {
              cursor: 'grabbing',
            }
          : {},
        ...(isValidMove && {
          '&::after': {
            content: '""',
            position: 'absolute',
            width: '50%',
            height: '50%',
            backgroundColor: theme.palette.success.main,
            borderRadius: '50%',
            opacity: 0.7,
            pointerEvents: 'none',
          },
        }),
      }}
    >
      {piece && (
        <Box
          sx={{
            transform: 'rotate(-45deg)', // Counter-rotate the piece
            fontSize: size * 0.6,
            color: piece.color === 'WHITE' ? '#ffffff' : '#1a1a1a',
            filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.8))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FontAwesomeIcon icon={getPieceIcon()!} />
        </Box>
      )}
    </Box>
  );
}

export default function DiamondBoard({
  boardState,
  currentTurn,
  onSquareClick,
  onPieceMove,
  highlightedSquares = [],
  selectedSquare = null,
  validMoves = [],
  readOnly = false,
}: DiamondBoardProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Drag state management
  const [draggedPiece, setDraggedPiece] = useState<{
    piece: Piece;
    from: DiamondPosition;
  } | null>(null);
  const [dragOverPosition, setDragOverPosition] =
    useState<DiamondPosition | null>(null);
  const [localValidMoves, setLocalValidMoves] =
    useState<DiamondPosition[]>(validMoves);

  // Get all valid positions for the diamond board
  const allPositions = useMemo(() => {
    return diamondCoords.getAllValidPositions();
  }, []);

  // Calculate board dimensions
  const squareSize = isMobile ? 32 : 48;
  const boardSize = squareSize * 15; // Enough space for the diamond

  // Helper function to check if a square is light or dark
  const isLightSquare = (pos: DiamondPosition): boolean => {
    const standard = diamondCoords.diamondToStandard(pos);
    if (!standard) return false;
    return (standard.file + standard.rank) % 2 === 0;
  };

  // Helper function to convert diamond coordinates to screen position
  const getScreenPosition = (pos: DiamondPosition) => {
    // Center the board and position squares
    const centerX = boardSize / 2;
    const centerY = boardSize / 2;

    // Convert diamond coordinates to screen offset
    // In diamond coordinates: x ranges from -7 to 7, y ranges from -7 to 7
    const screenX = centerX + pos.x * squareSize * 0.7; // 0.7 for diamond spacing
    const screenY = centerY + pos.y * squareSize * 0.7;

    return {
      left: screenX - squareSize / 2,
      top: screenY - squareSize / 2,
    };
  };

  // Helper function to check if position is in array
  const isPositionInArray = (
    pos: DiamondPosition,
    array: DiamondPosition[]
  ): boolean => {
    return array.some(p => p.x === pos.x && p.y === pos.y);
  };

  const handleSquareClick = (position: DiamondPosition) => {
    if (readOnly) return;
    onSquareClick?.(position);
  };

  // Drag event handlers
  const handleDragStart = useCallback(
    (position: DiamondPosition) => {
      const piece = boardState.get(diamondCoords.positionToKey(position));
      if (piece && piece.color === currentTurn && !readOnly) {
        setDraggedPiece({ piece, from: position });

        // Calculate valid moves for this piece
        const moves = pieceMovement.getPossibleMoves(
          piece,
          position,
          boardState
        );
        setLocalValidMoves(moves);
      }
    },
    [boardState, currentTurn, readOnly]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedPiece(null);
    setDragOverPosition(null);
    setLocalValidMoves(validMoves);
  }, [validMoves]);

  const handleDragOver = useCallback((position: DiamondPosition) => {
    setDragOverPosition(position);
  }, []);

  const handleDrop = useCallback(
    (position: DiamondPosition) => {
      if (draggedPiece && onPieceMove) {
        onPieceMove(draggedPiece.from, position);
      }
      setDraggedPiece(null);
      setDragOverPosition(null);
      setLocalValidMoves(validMoves);
    },
    [draggedPiece, onPieceMove, validMoves]
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
      }}
    >
      {/* Turn Indicator */}
      <Typography
        variant="h6"
        sx={{
          color:
            currentTurn === 'WHITE'
              ? theme.palette.primary.main
              : theme.palette.text.secondary,
          fontWeight: 700,
        }}
      >
        {currentTurn === 'WHITE' ? '⚪ White to Move' : '⚫ Black to Move'}
      </Typography>

      {/* Board Container */}
      <Box
        sx={{
          position: 'relative',
          width: boardSize,
          height: boardSize,
          border: '2px solid',
          borderColor: 'primary.main',
          borderRadius: 2,
          background: 'linear-gradient(45deg, #2d2d2d 0%, #1a1a1a 100%)',
          overflow: 'hidden',
        }}
      >
        {/* Render all squares */}
        {allPositions.map(position => {
          const screenPos = getScreenPosition(position);
          const piece = boardState.get(diamondCoords.positionToKey(position));
          const isSelected = selectedSquare
            ? selectedSquare.x === position.x && selectedSquare.y === position.y
            : false;
          const isValidMove = isPositionInArray(position, localValidMoves);
          const isHighlighted = isPositionInArray(position, highlightedSquares);
          const isDragOver = dragOverPosition
            ? dragOverPosition.x === position.x &&
              dragOverPosition.y === position.y
            : false;

          return (
            <ChessSquare
              key={diamondCoords.positionToKey(position)}
              position={position}
              piece={piece}
              isLight={isLightSquare(position)}
              isSelected={isSelected}
              isValidMove={isValidMove}
              isHighlighted={isHighlighted}
              isDragOver={isDragOver}
              onClick={() => handleSquareClick(position)}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              size={squareSize}
              left={screenPos.left}
              top={screenPos.top}
              readOnly={readOnly}
              currentTurn={currentTurn}
            />
          );
        })}

        {/* Coordinate Labels (Optional - can be toggled) */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            color: 'text.secondary',
            fontSize: '0.75rem',
            opacity: 0.6,
          }}
        >
          Diamond Chess
        </Box>
      </Box>

      {/* Game Status */}
      {selectedSquare && (
        <Typography variant="body2" color="text.secondary">
          Selected: ({selectedSquare.x}, {selectedSquare.y})
          {validMoves.length > 0 && ` • ${validMoves.length} valid moves`}
        </Typography>
      )}
    </Box>
  );
}
