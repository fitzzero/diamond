'use client';

import { useState, useCallback } from 'react';
import { boardSetup } from '@/lib/game/boardSetup';
import { moveValidator } from '@/lib/game/moveValidation';
import { chessCoords } from '@/lib/game/coordinates';
import type {
  BoardState,
  PieceColor,
  ChessPosition,
  Move,
  Piece,
  GameState,
} from '@/types/game';

interface LocalGameState {
  boardState: BoardState;
  currentTurn: PieceColor;
  moveHistory: Move[];
  isGameOver: boolean;
  gameResult?: 'WHITE_WINS' | 'BLACK_WINS' | 'DRAW';
}

interface UseLocalGameReturn extends LocalGameState {
  makeMove: (
    from: ChessPosition,
    to: ChessPosition
  ) => {
    success: boolean;
    error?: string;
  };
  getAllLegalMoves: (color: PieceColor) => Move[];
  getPossibleMoves: (position: ChessPosition) => ChessPosition[];
  isValidMove: (from: ChessPosition, to: ChessPosition) => boolean;
  resetGame: () => void;
}

/**
 * Local game hook for homepage demo
 * Manages game state in memory without persistence
 * Allows players to move pieces for both sides
 */
export function useLocalGame(): UseLocalGameReturn {
  // Initialize with fresh board state
  const [gameState, setGameState] = useState<LocalGameState>(() => ({
    boardState: boardSetup.createInitialBoard(),
    currentTurn: 'WHITE',
    moveHistory: [],
    isGameOver: false,
  }));

  // Reset game to initial state
  const resetGame = useCallback(() => {
    setGameState({
      boardState: boardSetup.createInitialBoard(),
      currentTurn: 'WHITE',
      moveHistory: [],
      isGameOver: false,
    });
  }, []);

  // Get all legal moves for a color
  const getAllLegalMoves = useCallback(
    (color: PieceColor): Move[] => {
      if (gameState.isGameOver) return [];
      return moveValidator.getAllLegalMoves(gameState.boardState, color);
    },
    [gameState.boardState, gameState.isGameOver]
  );

  // Get possible moves for a piece at a position
  const getPossibleMoves = useCallback(
    (position: ChessPosition): ChessPosition[] => {
      if (gameState.isGameOver) return [];

      const pieceKey = chessCoords.positionToKey(position);
      const piece = gameState.boardState.get(pieceKey);

      if (!piece || piece.color !== gameState.currentTurn) {
        return [];
      }

      // Get all legal moves for current player and filter by piece position
      const allLegalMoves = moveValidator.getAllLegalMoves(
        gameState.boardState,
        gameState.currentTurn
      );

      return allLegalMoves
        .filter(
          (move: Move) =>
            move.from.file === position.file && move.from.rank === position.rank
        )
        .map((move: Move) => move.to);
    },
    [gameState.boardState, gameState.currentTurn, gameState.isGameOver]
  );

  // Check if a move is valid
  const isValidMove = useCallback(
    (from: ChessPosition, to: ChessPosition): boolean => {
      if (gameState.isGameOver) return false;

      const pieceKey = chessCoords.positionToKey(from);
      const piece = gameState.boardState.get(pieceKey);

      if (!piece || piece.color !== gameState.currentTurn) {
        return false;
      }

      const move: Move = { from, to, piece };
      const currentGameState: GameState = {
        id: 'local-demo',
        board: gameState.boardState,
        currentTurn: gameState.currentTurn,
        status: 'active',
        moves: gameState.moveHistory,
      };

      const validation = moveValidator.validateMove(currentGameState, move);
      return validation.isValid;
    },
    [gameState]
  );

  // Execute a move
  const makeMove = useCallback(
    (
      from: ChessPosition,
      to: ChessPosition
    ): { success: boolean; error?: string } => {
      if (gameState.isGameOver) {
        return { success: false, error: 'Game is over' };
      }

      const pieceKey = chessCoords.positionToKey(from);
      const piece = gameState.boardState.get(pieceKey);

      if (!piece) {
        return { success: false, error: 'No piece at source position' };
      }

      if (piece.color !== gameState.currentTurn) {
        return { success: false, error: 'Not your turn' };
      }

      const move: Move = { from, to, piece };
      const currentGameState: GameState = {
        id: 'local-demo',
        board: gameState.boardState,
        currentTurn: gameState.currentTurn,
        status: 'active',
        moves: gameState.moveHistory,
      };

      const validation = moveValidator.validateMove(currentGameState, move);

      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      // Execute the move
      const newBoard = new Map(gameState.boardState);
      const fromKey = chessCoords.positionToKey(from);
      const toKey = chessCoords.positionToKey(to);

      // Check for capture
      const capturedPiece = newBoard.get(toKey);
      if (capturedPiece) {
        move.capturedPiece = capturedPiece;
      }

      // Move the piece
      newBoard.delete(fromKey);
      newBoard.set(toKey, piece);

      // Create enhanced move for history
      const enhancedMove: Move = {
        ...move,
        moveNotation: `${piece.type}${fromKey}-${toKey}`,
      };

      const newMoveHistory = [...gameState.moveHistory, enhancedMove];
      const nextTurn: PieceColor =
        gameState.currentTurn === 'WHITE' ? 'BLACK' : 'WHITE';

      // Check for endgame conditions
      const newGameState: GameState = {
        id: 'local-demo',
        board: newBoard,
        currentTurn: nextTurn,
        status: 'active',
        moves: newMoveHistory,
      };

      let isGameOver = false;
      let gameResult: 'WHITE_WINS' | 'BLACK_WINS' | 'DRAW' | undefined;

      if (moveValidator.isCheckmate(newGameState)) {
        isGameOver = true;
        gameResult =
          gameState.currentTurn === 'WHITE' ? 'WHITE_WINS' : 'BLACK_WINS';
      } else if (moveValidator.isStalemate(newGameState)) {
        isGameOver = true;
        gameResult = 'DRAW';
      }

      // Update state
      setGameState({
        boardState: newBoard,
        currentTurn: nextTurn,
        moveHistory: newMoveHistory,
        isGameOver,
        gameResult,
      });

      return { success: true };
    },
    [gameState]
  );

  return {
    ...gameState,
    makeMove,
    getAllLegalMoves,
    getPossibleMoves,
    isValidMove,
    resetGame,
  };
}
