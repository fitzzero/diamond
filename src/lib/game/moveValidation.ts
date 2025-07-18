import {
  BoardState,
  Move,
  PieceColor,
  GameState,
  Piece,
  ChessPosition,
} from '@/types/game';
import { chessCoords } from './coordinates';
import { pieceMovement } from './pieceMovement';
import { boardSetup } from './boardSetup';

export interface MoveValidationResult {
  isValid: boolean;
  error?: string;
  resultingBoard?: BoardState;
}

export interface MoveValidator {
  validateMove(gameState: GameState, move: Move): MoveValidationResult;
  isInCheck(board: BoardState, color: PieceColor): boolean;
  getAllLegalMoves(board: BoardState, color: PieceColor): Move[];
  isCheckmate(gameState: GameState): boolean;
  isStalemate(gameState: GameState): boolean;
}

class StandardMoveValidator implements MoveValidator {
  validateMove(gameState: GameState, move: Move): MoveValidationResult {
    const { board, currentTurn } = gameState;

    // Check if it's the correct player's turn
    const fromKey = chessCoords.positionToKey(move.from);
    const piece = board.get(fromKey);

    if (!piece) {
      return { isValid: false, error: 'No piece at source position' };
    }

    if (piece.color !== currentTurn) {
      return { isValid: false, error: 'Not your turn' };
    }

    // Check if the move is legal for this piece type
    const possibleMoves = pieceMovement.getPossibleMoves(
      piece,
      move.from,
      board
    );

    const isLegalMove = possibleMoves.some(
      (legalMove: ChessPosition) =>
        legalMove.file === move.to.file && legalMove.rank === move.to.rank
    );

    if (!isLegalMove) {
      return { isValid: false, error: 'Illegal move for this piece' };
    }

    // Create a copy of the board with the move executed
    const newBoard = new Map(board);
    const toKey = chessCoords.positionToKey(move.to);
    newBoard.delete(fromKey);
    newBoard.set(toKey, piece);

    // Check if this move would put the current player in check
    if (this.isInCheck(newBoard, currentTurn)) {
      return { isValid: false, error: 'Move would put your king in check' };
    }

    return {
      isValid: true,
      resultingBoard: newBoard,
    };
  }

  isInCheck(board: BoardState, color: PieceColor): boolean {
    const kingPosition = boardSetup.findKing(board, color);
    if (!kingPosition) return false; // Should never happen in a valid game

    const opponentColor: PieceColor = color === 'WHITE' ? 'BLACK' : 'WHITE';

    // Check if any opponent piece can attack the king
    for (const [positionKey, piece] of board.entries()) {
      if (piece.color === opponentColor) {
        const piecePosition = chessCoords.keyToPosition(positionKey);

        const possibleMoves = pieceMovement.getPossibleMoves(
          piece,
          piecePosition,
          board
        );

        if (
          possibleMoves.some(
            (move: ChessPosition) =>
              move.file === kingPosition.file && move.rank === kingPosition.rank
          )
        ) {
          return true;
        }
      }
    }

    return false;
  }

  getAllLegalMoves(board: BoardState, color: PieceColor): Move[] {
    const legalMoves: Move[] = [];

    for (const [positionKey, piece] of board.entries()) {
      if (piece.color === color) {
        const fromPosition = chessCoords.keyToPosition(positionKey);

        const possibleMoves = pieceMovement.getPossibleMoves(
          piece,
          fromPosition,
          board
        );

        for (const toPosition of possibleMoves) {
          const move: Move = {
            from: fromPosition,
            to: toPosition,
            piece: piece,
          };

          // Test if this move would put the king in check
          const testBoard = new Map(board);
          const fromKey = chessCoords.positionToKey(fromPosition);
          const toKey = chessCoords.positionToKey(toPosition);
          testBoard.delete(fromKey);
          testBoard.set(toKey, piece);

          if (!this.isInCheck(testBoard, color)) {
            legalMoves.push(move);
          }
        }
      }
    }

    return legalMoves;
  }

  isCheckmate(gameState: GameState): boolean {
    const { board, currentTurn } = gameState;

    // If not in check, it's not checkmate
    if (!this.isInCheck(board, currentTurn)) {
      return false;
    }

    // If in check but has legal moves, it's not checkmate
    const legalMoves = this.getAllLegalMoves(board, currentTurn);
    return legalMoves.length === 0;
  }

  isStalemate(gameState: GameState): boolean {
    const { board, currentTurn } = gameState;

    // If in check, it's not stalemate
    if (this.isInCheck(board, currentTurn)) {
      return false;
    }

    // If not in check but has no legal moves, it's stalemate
    const legalMoves = this.getAllLegalMoves(board, currentTurn);
    return legalMoves.length === 0;
  }
}

export const moveValidator = new StandardMoveValidator();
