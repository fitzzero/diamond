'use client';

import { useState, useMemo } from 'react';
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
  onClick: () => void;
  size: number;
  left: number;
  top: number;
}

function ChessSquare({
  position,
  piece,
  isLight,
  isSelected,
  isValidMove,
  isHighlighted,
  onClick,
  size,
  left,
  top,
}: SquareProps) {
  const theme = useTheme();

  const getSquareColor = () => {
    if (isSelected) return theme.palette.warning.main;
    if (isValidMove) return theme.palette.success.light;
    if (isHighlighted) return theme.palette.info.light;
    return isLight ? theme.palette.primary.main : theme.palette.primary.dark;
  };

  const getPieceIcon = () => {
    if (!piece) return null;
    const key = `${piece.color}_${piece.type}` as keyof typeof CHESS_ICONS;
    return CHESS_ICONS[key];
  };

  return (
    <Box
      onClick={onClick}
      sx={{
        position: 'absolute',
        left,
        top,
        width: size,
        height: size,
        backgroundColor: getSquareColor(),
        border: '1px solid',
        borderColor: 'rgba(0, 0, 0, 0.2)',
        cursor: 'pointer',
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
          const isValidMove = isPositionInArray(position, validMoves);
          const isHighlighted = isPositionInArray(position, highlightedSquares);

          return (
            <ChessSquare
              key={diamondCoords.positionToKey(position)}
              position={position}
              piece={piece}
              isLight={isLightSquare(position)}
              isSelected={isSelected}
              isValidMove={isValidMove}
              isHighlighted={isHighlighted}
              onClick={() => handleSquareClick(position)}
              size={squareSize}
              left={screenPos.left}
              top={screenPos.top}
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
