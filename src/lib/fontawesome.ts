import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faChessKing,
  faChessQueen,
  faChessRook,
  faChessBishop,
  faChessKnight,
  faChessPawn,
} from '@fortawesome/free-solid-svg-icons';

// Add chess pieces to FontAwesome library
library.add(
  faChessKing,
  faChessQueen,
  faChessRook,
  faChessBishop,
  faChessKnight,
  faChessPawn
);

// Export icon mappings for chess pieces
export const CHESS_ICONS = {
  WHITE_king: faChessKing,
  WHITE_queen: faChessQueen,
  WHITE_rook: faChessRook,
  WHITE_bishop: faChessBishop,
  WHITE_knight: faChessKnight,
  WHITE_pawn: faChessPawn,
  BLACK_king: faChessKing,
  BLACK_queen: faChessQueen,
  BLACK_rook: faChessRook,
  BLACK_bishop: faChessBishop,
  BLACK_knight: faChessKnight,
  BLACK_pawn: faChessPawn,
} as const;
