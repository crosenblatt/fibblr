import { BOARD_SIZE, CENTER, type Premium } from "./types";

function key(row: number, col: number): string {
  return `${row},${col}`;
}

const TW = new Set([
  key(0, 0),
  key(0, 7),
  key(0, 14),
  key(7, 0),
  key(7, 14),
  key(14, 0),
  key(14, 7),
  key(14, 14),
]);

const DW = new Set([
  key(1, 1),
  key(2, 2),
  key(3, 3),
  key(4, 4),
  key(1, 13),
  key(2, 12),
  key(3, 11),
  key(4, 10),
  key(10, 4),
  key(11, 3),
  key(12, 2),
  key(13, 1),
  key(10, 10),
  key(11, 11),
  key(12, 12),
  key(13, 13),
]);

const DL = new Set([
  key(0, 3),
  key(0, 11),
  key(2, 6),
  key(2, 8),
  key(3, 0),
  key(3, 7),
  key(3, 14),
  key(6, 2),
  key(6, 6),
  key(6, 8),
  key(6, 12),
  key(7, 3),
  key(7, 11),
  key(8, 2),
  key(8, 6),
  key(8, 8),
  key(8, 12),
  key(11, 0),
  key(11, 7),
  key(11, 14),
  key(12, 6),
  key(12, 8),
  key(14, 3),
  key(14, 11),
]);

const TL = new Set([
  key(1, 5),
  key(1, 9),
  key(5, 1),
  key(5, 5),
  key(5, 9),
  key(5, 13),
  key(9, 1),
  key(9, 5),
  key(9, 9),
  key(9, 13),
  key(13, 5),
  key(13, 9),
]);

export function premiumAt(row: number, col: number): Premium {
  if (row === CENTER && col === CENTER) return "center";
  const k = key(row, col);
  if (TW.has(k)) return "tw";
  if (DW.has(k)) return "dw";
  if (TL.has(k)) return "tl";
  if (DL.has(k)) return "dl";
  return "none";
}

export function emptyBoard(): (number | null)[] {
  return Array.from({ length: BOARD_SIZE * BOARD_SIZE }, () => null);
}

export function idx(row: number, col: number): number {
  return row * BOARD_SIZE + col;
}

export function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

export function getDigit(
  board: (number | null)[],
  row: number,
  col: number,
): number | null {
  if (!inBounds(row, col)) return null;
  return board[idx(row, col)] ?? null;
}

export function boardHasTiles(board: (number | null)[]): boolean {
  return board.some((cell) => cell !== null);
}

export function cloneBoard(board: (number | null)[]): (number | null)[] {
  return board.slice();
}
