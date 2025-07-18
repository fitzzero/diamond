'use client';

import { useState, useMemo, useCallback } from 'react';
import { Box, useTheme } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { CHESS_ICONS } from '@/lib/fontawesome';
import { useBreakpoints } from '@/hooks';
import type {
  BoardState,
  DiamondPosition,
  Piece,
  PieceColor,
} from '@/types/game';
import { diamondCoords } from '@/lib/game/coordinates';
import { pieceMovement } from '@/lib/game/pieceMovement';
import PlayerCard from './PlayerCard';

interface DiamondBoardProps {
  boardState: BoardState;
  currentTurn: PieceColor;
  onSquareClick?: (position: DiamondPosition) => void;
  onPieceMove?: (from: DiamondPosition, to: DiamondPosition) => void;
  highlightedSquares?: DiamondPosition[];
  selectedSquare?: DiamondPosition | null;
  validMoves?: DiamondPosition[];
  readOnly?: boolean;
  // Player data for the cards
  player1?: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
  player2?: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
  currentUserId?: string;
  matchStatus?: string;
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
  isMobile: boolean;
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
  isMobile,
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDrop(position);
  };

  return (
    <Box
      onClick={onClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      sx={{
        position: 'absolute',
        left: left,
        top: top,
        width: size,
        height: size,
        backgroundColor: getSquareColor(),
        border: '1px solid rgba(0,0,0,0.1)',
        cursor: readOnly ? 'default' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.2s ease',
        transform: 'rotate(45deg)', // Diamond rotation
        transformOrigin: 'center',
        '&:hover': !readOnly
          ? {
              backgroundColor: theme.palette.action.hover,
            }
          : {},
      }}
    >
      {piece && (
        <Box
          draggable={canDragPiece}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          sx={{
            transform: 'rotate(-45deg)', // Counter-rotate the piece to appear upright
            fontSize: isMobile ? '1.5rem' : '1.8rem',
            color: piece.color === 'WHITE' ? 'white' : 'black',
            textShadow:
              piece.color === 'WHITE'
                ? '1px 1px 2px rgba(0,0,0,0.7)'
                : '1px 1px 2px rgba(255,255,255,0.5)',
            cursor: canDragPiece ? 'grab' : 'default',
            userSelect: 'none',
            transition: 'transform 0.1s ease',
            '&:hover': canDragPiece
              ? {
                  transform: 'rotate(-45deg) scale(1.1)',
                }
              : {},
            '&:active': canDragPiece
              ? {
                  cursor: 'grabbing',
                  transform: 'rotate(-45deg) scale(0.95)',
                }
              : {},
          }}
        >
          <FontAwesomeIcon
            icon={
              CHESS_ICONS[
                `${piece.color}_${piece.type}` as keyof typeof CHESS_ICONS
              ]
            }
          />
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
  selectedSquare,
  validMoves = [],
  readOnly = false,
  player1,
  player2,
  currentUserId,
  matchStatus,
}: DiamondBoardProps) {
  const { isMobile } = useBreakpoints();

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

  // Calculate board dimensions with better mobile sizing
  const squareSize = isMobile ? 36 : 60; // Slightly larger for better touch targets
  const boardSize = squareSize * 15; // Enough space for the diamond
  const pieceSize = isMobile ? 28 : 36; // Optimized piece sizing

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

  // Calculate player turn states
  const isPlayer1 = player1 && currentUserId === player1.id;
  const isPlayer2 = player2 && currentUserId === player2.id;
  const whitePlayerTurn = currentTurn === 'WHITE';
  const blackPlayerTurn = currentTurn === 'BLACK';

  return (
    <Box
      sx={{
        position: 'relative',
        marginLeft: `calc(-1 * (${boardSize}px + 32px - ${isMobile ? '100vw' : '850px'}) / 2)`,
        marginTop: isMobile ? '-80px' : `-${boardSize - 800}px`,
        marginBottom: isMobile ? '-80px' : `-${boardSize - 800}px`,
        width: `calc(${boardSize}px)`,
        height: boardSize,
        overflow: 'visible', // Allow player cards to extend outside
      }}
    >
      {/* Player Cards positioned relative to exact board dimensions */}
      {matchStatus === 'IN_PROGRESS' && (
        <>
          {/* Black Player - Top Left relative to board */}
          <PlayerCard
            player={player2 || null}
            color="BLACK"
            isMyTurn={blackPlayerTurn && !!isPlayer2}
            isCurrentUser={!!isPlayer2}
            position="top-left"
            boardSize={boardSize}
          />

          {/* White Player - Bottom Right relative to board */}
          <PlayerCard
            player={player1 || null}
            color="WHITE"
            isMyTurn={whitePlayerTurn && !!isPlayer1}
            isCurrentUser={!!isPlayer1}
            position="bottom-right"
            boardSize={boardSize}
          />
        </>
      )}

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
            isMobile={isMobile}
          />
        );
      })}
    </Box>
  );
}
