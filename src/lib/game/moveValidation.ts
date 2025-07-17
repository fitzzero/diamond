import {
  BoardState,
  Move,
  PieceColor,
  GameState,
  Piece,
  StandardPosition,
  DiamondPosition,
} from '@/types/game';
import { diamondCoords } from './coordinates';
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

class DiamondMoveValidator implements MoveValidator {
  validateMove(gameState: GameState, move: Move): MoveValidationResult {
    const { board, currentTurn } = gameState;

    // Check if it's the correct player's turn
    const fromKey = diamondCoords.positionToKey(move.from);
    const piece = board.get(fromKey);

    if (!piece) {
      return { isValid: false, error: 'No piece at source position' };
    }

    if (piece.color !== currentTurn) {
      return { isValid: false, error: 'Not your turn' };
    }

    // Check if the move is legal for this piece type
    const fromDiamond = move.from;
    const toDiamond = move.to;

    const legalMoves = pieceMovement.getPossibleMoves(
      piece,
      fromDiamond,
      board
    );

    const isLegalMove = legalMoves.some(
      (legalMove: DiamondPosition) =>
        legalMove.x === toDiamond.x && legalMove.y === toDiamond.y
    );

    if (!isLegalMove) {
      return { isValid: false, error: 'Illegal move for this piece' };
    }

    // Create a copy of the board with the move executed
    const newBoard = new Map(board);
    const toKey = diamondCoords.positionToKey(toDiamond);
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
        const piecePosition = diamondCoords.keyToPosition(positionKey);

        const legalMoves = pieceMovement.getPossibleMoves(
          piece,
          piecePosition,
          board
        );

        if (
          legalMoves.some(
            (move: DiamondPosition) =>
              move.x === kingPosition.x && move.y === kingPosition.y
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
        const fromDiamond = diamondCoords.keyToPosition(positionKey);

        const possibleMoves = pieceMovement.getPossibleMoves(
          piece,
          fromDiamond,
          board
        );

        for (const toDiamond of possibleMoves) {
          const move: Move = {
            from: fromDiamond,
            to: toDiamond,
            piece: piece,
          };

          // Test if this move would put the king in check
          const testBoard = new Map(board);
          const fromKey = diamondCoords.positionToKey(fromDiamond);
          const toKey = diamondCoords.positionToKey(toDiamond);
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

export const moveValidator = new DiamondMoveValidator();
