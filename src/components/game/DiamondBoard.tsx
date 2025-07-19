'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Box, useTheme } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { CHESS_ICONS } from '@/lib/fontawesome';
import { useBreakpoints } from '@/hooks';
import { usePathname } from 'next/navigation';
import type {
  BoardState,
  ChessPosition,
  DiamondPosition,
  Piece,
  PieceColor,
} from '@/types/game';
import { chessCoords } from '@/lib/game/coordinates';
import PlayerCard from './PlayerCard';
import { moveValidator } from '@/lib/game/moveValidation';
import type { Move } from '@/types/game';

type AnimationPhase = 'traditional' | 'animating' | 'diamond';

interface DiamondBoardProps {
  boardState: BoardState;
  currentTurn: PieceColor;
  onSquareClick?: (position: ChessPosition) => void;
  onPieceMove?: (from: ChessPosition, to: ChessPosition) => void;
  highlightedSquares?: ChessPosition[];
  selectedSquare?: ChessPosition | null;
  validMoves?: ChessPosition[];
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
  // Match and game data for win/loss status
  match?: {
    winnerId?: string | null;
    status: string;
  };
  game?: {
    status: string;
    result?: string | null;
    whitePlayerId: string;
    blackPlayerId: string;
  };
  // Animation control
  skipAnimation?: boolean;
}

interface SquareProps {
  chessPosition: ChessPosition;
  piece?: Piece;
  isLight: boolean;
  isSelected: boolean;
  isValidMove: boolean;
  isHighlighted: boolean;
  isDragOver: boolean;
  onClick: () => void;
  onDragStart: (chessPos: ChessPosition) => void;
  onDragEnd: () => void;
  onDragOver: (chessPos: ChessPosition) => void;
  onDrop: (chessPos: ChessPosition) => void;
  onTouchStart?: (chessPos: ChessPosition) => void;
  onTouchMove?: (chessPos: ChessPosition, touch: React.Touch) => void;
  onTouchEnd?: (chessPos: ChessPosition) => void;
  size: number;
  traditionalPosition: { left: number; top: number };
  diamondScreenPosition: { left: number; top: number };
  animationPhase: AnimationPhase;
  readOnly: boolean;
  currentTurn: PieceColor;
  isMobile: boolean;
}

function ChessSquare({
  chessPosition,
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
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  size,
  traditionalPosition,
  diamondScreenPosition,
  animationPhase,
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

  // Calculate current position and rotation based on animation phase
  const isTraditional = animationPhase === 'traditional';
  const isAnimating = animationPhase === 'animating';
  const currentPosition = isTraditional
    ? traditionalPosition
    : diamondScreenPosition;
  const squareRotation = isTraditional ? 0 : 45;
  const pieceRotation = isTraditional ? 0 : -45;

  const handleDragStart = (e: React.DragEvent) => {
    if (!canDragPiece || isAnimating) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData(
      'text/plain',
      chessCoords.positionToKey(chessPosition)
    );
    onDragStart(chessPosition);
  };

  const handleDragEnd = () => {
    onDragEnd();
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (isValidMove && !isAnimating) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      onDragOver(chessPosition);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isAnimating) {
      onDrop(chessPosition);
    }
  };

  // Touch event handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!canDragPiece || !onTouchStart || isAnimating) return;
    e.preventDefault(); // Prevent scrolling
    onTouchStart(chessPosition);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!onTouchMove || isAnimating) return;
    e.preventDefault(); // Prevent scrolling
    const touch = e.touches[0];
    if (touch) {
      onTouchMove(chessPosition, touch);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!onTouchEnd || isAnimating) return;
    e.preventDefault(); // Prevent default behavior
    onTouchEnd(chessPosition);
  };

  const handleClick = () => {
    if (!isAnimating) {
      onClick();
    }
  };

  return (
    <Box
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      sx={{
        position: 'absolute',
        left: currentPosition.left,
        top: currentPosition.top,
        width: size,
        height: size,
        backgroundColor: getSquareColor(),
        border: '1px solid rgba(0,0,0,0.1)',
        cursor: readOnly || isAnimating ? 'default' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `rotate(${squareRotation}deg)`,
        transformOrigin: 'center',
        transition: isAnimating
          ? 'all 1.8s cubic-bezier(0.4, 0, 0.2, 1)'
          : 'background-color 0.2s ease',
        // Improve mobile touch interaction
        touchAction: piece && !readOnly && !isAnimating ? 'none' : 'auto',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        '&:hover':
          !readOnly && !isAnimating
            ? {
                backgroundColor: theme.palette.action.hover,
              }
            : {},
      }}
    >
      {piece && (
        <Box
          draggable={canDragPiece && !isMobile && !isAnimating}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          sx={{
            transform: `rotate(${pieceRotation}deg)`,
            fontSize: isMobile ? '1.6rem' : '1.8rem',
            color: piece.color === 'WHITE' ? 'white' : 'black',
            textShadow:
              piece.color === 'WHITE'
                ? '1px 1px 2px rgba(0,0,0,0.7)'
                : '1px 1px 2px rgba(255,255,255,0.5)',
            cursor:
              canDragPiece && !isAnimating
                ? isMobile
                  ? 'pointer'
                  : 'grab'
                : 'default',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            touchAction: 'none',
            transition: isAnimating
              ? 'transform 1.8s cubic-bezier(0.4, 0, 0.2, 1)'
              : 'transform 0.1s ease',
            minWidth: isMobile ? '44px' : 'auto',
            minHeight: isMobile ? '44px' : 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            // Initial fade-in for pieces (after board appears)
            opacity: isTraditional ? 0 : 1,
            animation: isTraditional
              ? 'piecesFadeIn 0.8s ease-in-out 0.4s forwards'
              : 'none',
            '@keyframes piecesFadeIn': {
              from: { opacity: 0 },
              to: { opacity: 1 },
            },
            '&:hover':
              canDragPiece && !isMobile && !isAnimating
                ? {
                    transform: `rotate(${pieceRotation}deg) scale(1.1)`,
                  }
                : {},
            '&:active':
              canDragPiece && !isAnimating
                ? {
                    cursor: isMobile ? 'pointer' : 'grabbing',
                    transform: `rotate(${pieceRotation}deg) scale(0.95)`,
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
  match,
  game,
  skipAnimation = false,
}: DiamondBoardProps) {
  const { isMobile } = useBreakpoints();
  const pathname = usePathname();

  // Animation state management
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>(
    skipAnimation ? 'diamond' : 'traditional'
  );
  const [hasAnimated, setHasAnimated] = useState(skipAnimation);

  // Coordinate conversion helpers
  const chessToDisplay = useCallback(
    (chess: ChessPosition): DiamondPosition => {
      const display = chessCoords.chessToDisplayDiamond(chess);
      return { x: display.x, y: display.y };
    },
    []
  );

  const displayToChess = useCallback(
    (diamond: DiamondPosition): ChessPosition | null => {
      return chessCoords.displayDiamondToChess({ x: diamond.x, y: diamond.y });
    },
    []
  );

  // Drag state management
  const [draggedPiece, setDraggedPiece] = useState<{
    piece: Piece;
    from: ChessPosition;
  } | null>(null);
  const [dragOverPosition, setDragOverPosition] =
    useState<ChessPosition | null>(null);
  const [localValidMoves, setLocalValidMoves] =
    useState<ChessPosition[]>(validMoves);

  // Touch state management for mobile
  const [touchState, setTouchState] = useState<{
    piece: Piece;
    from: ChessPosition;
    startTime: number;
  } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  // Animation trigger logic
  useEffect(() => {
    if (!hasAnimated && !skipAnimation && animationPhase === 'traditional') {
      const timer = setTimeout(() => {
        setAnimationPhase('animating');

        // Complete animation after transition duration
        setTimeout(() => {
          setAnimationPhase('diamond');
          setHasAnimated(true);
        }, 1800); // Match CSS transition duration
      }, 1400); // Wait for board entrance + pieces fade-in to complete

      return () => clearTimeout(timer);
    }
  }, [hasAnimated, skipAnimation, animationPhase]);

  // Generate all valid chess positions for rendering
  const allChessPositions = useMemo(() => {
    const positions: ChessPosition[] = [];
    for (let file = 0; file < 8; file++) {
      for (let rank = 0; rank < 8; rank++) {
        positions.push({ file, rank });
      }
    }
    return positions;
  }, []);

  // Calculate board dimensions with better mobile sizing
  const squareSize = isMobile ? 36 : 60; // Larger mobile squares for better touch targets
  const boardSize = squareSize * 15; // Enough space for the diamond
  const pieceSize = isMobile ? 32 : 36; // Optimized piece sizing

  // Helper function to check if a square is light or dark
  const isLightSquare = (pos: ChessPosition): boolean => {
    return (pos.file + pos.rank) % 2 === 0;
  };

  // Traditional chess board positioning (8x8 grid)
  const getTraditionalScreenPosition = useCallback(
    (chessPos: ChessPosition) => {
      const centerX = boardSize / 2;
      const centerY = boardSize / 2;

      // Standard grid layout - files left to right, ranks bottom to top
      const screenX = centerX + (chessPos.file - 3.5) * squareSize;
      const screenY = centerY + (3.5 - chessPos.rank) * squareSize; // Flip Y for chess board orientation

      return {
        left: screenX - squareSize / 2,
        top: screenY - squareSize / 2,
      };
    },
    [boardSize, squareSize]
  );

  // Diamond positioning (existing logic)
  const getDiamondScreenPosition = useCallback(
    (chessPos: ChessPosition) => {
      const diamondPos = chessToDisplay(chessPos);

      // Center the board and position squares
      const centerX = boardSize / 2;
      const centerY = boardSize / 2;

      // For rotated squares (45°), use √2 * squareSize spacing to prevent overlap
      const diamondSpacing = squareSize * Math.sqrt(2);
      const screenX = centerX + diamondPos.x * diamondSpacing;
      // Flip y-coordinate so positive y goes up (white bottom, black top)
      const screenY = centerY - diamondPos.y * diamondSpacing;

      return {
        left: screenX - squareSize / 2,
        top: screenY - squareSize / 2,
      };
    },
    [chessToDisplay, boardSize, squareSize]
  );

  // Use diamond positioning for current logic (backward compatibility)
  const getScreenPosition = getDiamondScreenPosition;

  // Helper function to check if position is in array
  const isChessPositionInArray = (
    pos: ChessPosition,
    array: ChessPosition[]
  ): boolean => {
    return array.some(p => p.file === pos.file && p.rank === pos.rank);
  };

  // Event handlers
  const handleSquareClick = useCallback(
    (chessPos: ChessPosition) => {
      if (readOnly || !onSquareClick) return;
      onSquareClick(chessPos);
    },
    [readOnly, onSquareClick]
  );

  // Drag event handlers
  const handleDragStart = useCallback(
    (chessPos: ChessPosition) => {
      const piece = boardState.get(chessCoords.positionToKey(chessPos));
      if (piece && piece.color === currentTurn && !readOnly) {
        setDraggedPiece({ piece, from: chessPos });

        // Calculate valid moves for this piece using proper move validation
        try {
          const allLegalMoves = moveValidator.getAllLegalMoves(
            boardState,
            currentTurn
          );
          const pieceMoves = allLegalMoves.filter(
            (move: Move) =>
              move.from.file === chessPos.file &&
              move.from.rank === chessPos.rank
          );
          setLocalValidMoves(pieceMoves.map((move: Move) => move.to));
        } catch (error) {
          console.error('Error calculating drag moves:', error);
          setLocalValidMoves([]);
        }
      }
    },
    [boardState, currentTurn, readOnly]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedPiece(null);
    setDragOverPosition(null);
    setLocalValidMoves(validMoves);
  }, [validMoves]);

  const handleDragOver = useCallback((chessPos: ChessPosition) => {
    setDragOverPosition(chessPos);
  }, []);

  const handleDrop = useCallback(
    (chessPos: ChessPosition) => {
      if (draggedPiece && onPieceMove) {
        onPieceMove(draggedPiece.from, chessPos);
      }
      setDraggedPiece(null);
      setDragOverPosition(null);
      setLocalValidMoves(validMoves);
    },
    [draggedPiece, onPieceMove, validMoves]
  );

  // Touch event handlers for mobile
  const handleTouchStart = useCallback(
    (chessPos: ChessPosition) => {
      const piece = boardState.get(chessCoords.positionToKey(chessPos));
      if (piece && piece.color === currentTurn && !readOnly) {
        setTouchState({ piece, from: chessPos, startTime: Date.now() });

        // Calculate valid moves for this piece
        try {
          const allLegalMoves = moveValidator.getAllLegalMoves(
            boardState,
            currentTurn
          );
          const pieceMoves = allLegalMoves.filter(
            (move: Move) =>
              move.from.file === chessPos.file &&
              move.from.rank === chessPos.rank
          );
          setLocalValidMoves(pieceMoves.map((move: Move) => move.to));
        } catch (error) {
          console.error('Error calculating touch moves:', error);
          setLocalValidMoves([]);
        }
      }
    },
    [boardState, currentTurn, readOnly]
  );

  const handleTouchMove = useCallback(
    (chessPos: ChessPosition, touch: React.Touch) => {
      if (!touchState || !boardRef.current) return;

      // Find the square under the touch point
      const boardRect = boardRef.current.getBoundingClientRect();
      const touchX = touch.clientX - boardRect.left;
      const touchY = touch.clientY - boardRect.top;

      // Find closest square to touch point
      let closestSquare: ChessPosition | null = null;
      let closestDistance = Infinity;

      allChessPositions.forEach(pos => {
        const screenPos = getScreenPosition(pos);
        const squareCenterX = screenPos.left + squareSize / 2;
        const squareCenterY = screenPos.top + squareSize / 2;
        const distance = Math.sqrt(
          Math.pow(touchX - squareCenterX, 2) +
            Math.pow(touchY - squareCenterY, 2)
        );

        if (distance < closestDistance) {
          closestDistance = distance;
          closestSquare = pos;
        }
      });

      if (closestSquare && closestDistance < squareSize * 0.8) {
        setDragOverPosition(closestSquare);
      }
    },
    [touchState, allChessPositions, squareSize, getScreenPosition]
  );

  const handleTouchEnd = useCallback(
    (chessPos: ChessPosition) => {
      if (!touchState) return;

      const touchDuration = Date.now() - touchState.startTime;

      // If it's a quick tap (< 200ms), treat as click
      if (touchDuration < 200) {
        handleSquareClick(touchState.from);
      } else if (dragOverPosition && onPieceMove) {
        // If dragged to a different square, attempt move
        const isValidMove = localValidMoves.some(
          move =>
            move.file === dragOverPosition.file &&
            move.rank === dragOverPosition.rank
        );
        if (isValidMove) {
          onPieceMove(touchState.from, dragOverPosition);
        }
      }

      // Reset touch state
      setTouchState(null);
      setDragOverPosition(null);
      setLocalValidMoves(validMoves);
    },
    [
      touchState,
      dragOverPosition,
      onPieceMove,
      localValidMoves,
      validMoves,
      handleSquareClick,
    ]
  );

  // Calculate player turn states
  const whitePlayerTurn = currentTurn === 'WHITE';
  const blackPlayerTurn = currentTurn === 'BLACK';
  const isPlayer1 = currentUserId === player1?.id;
  const isPlayer2 = currentUserId === player2?.id;

  // Calculate win/loss status for completed matches
  const getPlayerWinStatus = (
    playerId: string | undefined,
    playerColor: PieceColor
  ): 'winner' | 'loser' | null => {
    if (!match || !game || !playerId || match.status !== 'COMPLETED') {
      return null;
    }

    // Check if this player won
    if (match.winnerId === playerId) {
      return 'winner';
    }

    // Check if this is a draw
    if (game.result === 'DRAW') {
      return null; // No winner/loser in a draw
    }

    // Check if this player lost
    if (match.winnerId && match.winnerId !== playerId) {
      return 'loser';
    }

    return null;
  };

  const player1WinStatus = getPlayerWinStatus(player1?.id, 'WHITE');
  const player2WinStatus = getPlayerWinStatus(player2?.id, 'BLACK');

  const highlightSquares = highlightedSquares || [];
  const validMoveSquares = validMoves || [];
  const selected = selectedSquare;

  return (
    <Box
      ref={boardRef}
      sx={{
        position: 'relative',
        marginTop: isMobile ? '-80px' : `-${boardSize - 800}px`,
        marginBottom: isMobile ? '-40px' : `-${boardSize - 800}px`,
        width: `calc(${boardSize}px)`,
        height: boardSize,
        overflow: 'visible', // Allow player cards to extend outside
        // Prevent mobile scroll interference
        touchAction: 'pan-x pan-y', // Allow scrolling but prevent other gestures
        // Board container entrance animation
        opacity: animationPhase === 'traditional' && !hasAnimated ? 0 : 1,
        transform:
          animationPhase === 'traditional' && !hasAnimated
            ? 'scale(0.8) translateY(20px)'
            : 'scale(1) translateY(0px)',
        animation:
          animationPhase === 'traditional' && !hasAnimated
            ? 'boardEnter 0.6s ease-out 0.1s forwards'
            : 'none',
        '@keyframes boardEnter': {
          from: {
            opacity: 0,
            transform: 'scale(0.8) translateY(20px)',
          },
          to: {
            opacity: 1,
            transform: 'scale(1) translateY(0px)',
          },
        },
      }}
    >
      {/* Player Cards - Only show after animation completes */}
      {animationPhase === 'diamond' && (
        <>
          {/* Black Player - Top Left relative to board */}
          <Box
            sx={{
              opacity: 0,
              animation: 'fadeIn 0.8s ease-in-out 0.4s forwards',
              '@keyframes fadeIn': {
                from: { opacity: 0 },
                to: { opacity: 1 },
              },
            }}
          >
            <PlayerCard
              player={player2 || null}
              color="BLACK"
              isMyTurn={blackPlayerTurn && !!isPlayer2}
              isCurrentUser={!!isPlayer2}
              position="top-left"
              boardSize={boardSize}
              winStatus={player2WinStatus}
            />
          </Box>

          {/* White Player - Bottom Right relative to board */}
          <Box
            sx={{
              opacity: 0,
              animation: 'fadeIn 0.8s ease-in-out 0.5s forwards',
              '@keyframes fadeIn': {
                from: { opacity: 0 },
                to: { opacity: 1 },
              },
            }}
          >
            <PlayerCard
              player={player1 || null}
              color="WHITE"
              isMyTurn={whitePlayerTurn && !!isPlayer1}
              isCurrentUser={!!isPlayer1}
              position="bottom-right"
              boardSize={boardSize}
              winStatus={player1WinStatus}
            />
          </Box>
        </>
      )}

      {/* Coordinate Labels - Only show after animation completes */}
      {animationPhase === 'diamond' && (
        <>
          {/* Bottom-left edge: File letters (a-h) */}
          {[0, 1, 2, 3, 4, 5, 6, 7].map(file => {
            const rank = 0; // Bottom rank
            const chessPos = { file, rank };
            const screenPos = getScreenPosition(chessPos);
            return (
              <Box
                key={`file-${file}`}
                sx={{
                  position: 'absolute',
                  left: screenPos.left - squareSize / 4 + 8,
                  top: screenPos.top + squareSize - 8,
                  fontSize: '14px',
                  color: 'text.secondary',
                  fontWeight: 600,
                  userSelect: 'none',
                  textAlign: 'center',
                  transform: 'translate(-50%, 0)',
                  opacity: 0,
                  animation: 'fadeIn 0.8s ease-in-out 0.3s forwards', // Fade in with delay
                  '@keyframes fadeIn': {
                    from: { opacity: 0 },
                    to: { opacity: 1 },
                  },
                }}
              >
                {String.fromCharCode(97 + file)}
              </Box>
            );
          })}

          {/* Top-left edge: Rank numbers (1-8) */}
          {[0, 1, 2, 3, 4, 5, 6, 7].map(rank => {
            const file = 0; // Leftmost file
            const chessPos = { file, rank };
            const screenPos = getScreenPosition(chessPos);
            return (
              <Box
                key={`rank-${rank}`}
                sx={{
                  position: 'absolute',
                  left: screenPos.left + squareSize / 2 - 32,
                  top: screenPos.top - 4,
                  fontSize: '14px',
                  color: 'text.secondary',
                  fontWeight: 600,
                  userSelect: 'none',
                  textAlign: 'center',
                  transform: 'translate(-50%, -50%)',
                  opacity: 0,
                  animation: 'fadeIn 0.8s ease-in-out 0.3s forwards', // Fade in with delay
                  '@keyframes fadeIn': {
                    from: { opacity: 0 },
                    to: { opacity: 1 },
                  },
                }}
              >
                {rank + 1}
              </Box>
            );
          })}
        </>
      )}

      {/* Render all squares */}
      {allChessPositions.map(chessPosition => {
        const traditionalPosition = getTraditionalScreenPosition(chessPosition);
        const diamondPosition = getDiamondScreenPosition(chessPosition);

        const isSelected = selectedSquare
          ? selectedSquare.file === chessPosition.file &&
            selectedSquare.rank === chessPosition.rank
          : false;
        const isValidMove = isChessPositionInArray(
          chessPosition,
          localValidMoves
        );
        const isHighlighted = isChessPositionInArray(
          chessPosition,
          highlightedSquares
        );
        const isDragOver = dragOverPosition
          ? dragOverPosition.file === chessPosition.file &&
            dragOverPosition.rank === chessPosition.rank
          : false;

        return (
          <ChessSquare
            key={chessCoords.positionToKey(chessPosition)}
            chessPosition={chessPosition}
            piece={boardState.get(chessCoords.positionToKey(chessPosition))}
            isLight={isLightSquare(chessPosition)}
            isSelected={isSelected}
            isValidMove={isValidMove}
            isHighlighted={isHighlighted}
            isDragOver={isDragOver}
            onClick={() => handleSquareClick(chessPosition)}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            size={squareSize}
            traditionalPosition={traditionalPosition}
            diamondScreenPosition={diamondPosition}
            animationPhase={animationPhase}
            readOnly={readOnly}
            currentTurn={currentTurn}
            isMobile={isMobile}
          />
        );
      })}
    </Box>
  );
}
