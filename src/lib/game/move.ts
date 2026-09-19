import {
  boardHasTiles,
  cloneBoard,
  emptyBoard,
  emptyBlanks,
  getDigit,
  idx,
  inBounds,
  premiumAt,
} from "./board";
import { isDigit, isValidSequence } from "./fib";
import { createBag, fillRack, rackSum, removeFromRack, shuffle, type Rng } from "./tiles";
import {
  BINGO_BONUS,
  BLANK,
  CENTER,
  RACK_SIZE,
  type EngineResult,
  type GameState,
  type LastMove,
  type Line,
  type Placement,
  type PlayResult,
  type PlayerState,
} from "./types";

export type { Rng } from "./tiles";

type Cell = { row: number; col: number; digit: number };

function uniquePlacements(placements: Placement[]): string | null {
  if (placements.length === 0) return "Place at least one tile.";
  const seen = new Set<string>();
  for (const p of placements) {
    if (!inBounds(p.row, p.col)) return "Placement is off the board.";
    if (!isDigit(p.digit)) return "Tiles must be digits 0–9.";
    const k = `${p.row},${p.col}`;
    if (seen.has(k)) return "Cannot place two tiles on the same square.";
    seen.add(k);
  }
  return null;
}

function sameLine(placements: Placement[]): "row" | "col" | null {
  if (placements.length === 1) return "row";
  const sameRow = placements.every((p) => p.row === placements[0]!.row);
  const sameCol = placements.every((p) => p.col === placements[0]!.col);
  if (sameRow) return "row";
  if (sameCol) return "col";
  return null;
}

function applyPlacements(
  board: (number | null)[],
  placements: Placement[],
): EngineResult<{ board: (number | null)[] }> {
  const next = cloneBoard(board);
  for (const p of placements) {
    if (getDigit(next, p.row, p.col) !== null) {
      return { ok: false, error: "That square is already occupied." };
    }
    next[idx(p.row, p.col)] = p.digit;
  }
  return { ok: true, board: next };
}

function walkLine(
  board: (number | null)[],
  row: number,
  col: number,
  dRow: number,
  dCol: number,
): Cell[] {
  let r = row;
  let c = col;
  while (inBounds(r - dRow, c - dCol) && getDigit(board, r - dRow, c - dCol) !== null) {
    r -= dRow;
    c -= dCol;
  }
  const cells: Cell[] = [];
  while (inBounds(r, c)) {
    const digit = getDigit(board, r, c);
    if (digit === null) break;
    cells.push({ row: r, col: c, digit });
    r += dRow;
    c += dCol;
  }
  return cells;
}

function lineKey(cells: Cell[]): string {
  const first = cells[0]!;
  const last = cells[cells.length - 1]!;
  return `${first.row},${first.col}-${last.row},${last.col}`;
}

function coversCenter(placements: Placement[]): boolean {
  return placements.some((p) => p.row === CENTER && p.col === CENTER);
}

function isAdjacentToExisting(
  board: (number | null)[],
  placements: Placement[],
): boolean {
  const placed = new Set(placements.map((p) => `${p.row},${p.col}`));
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  for (const p of placements) {
    for (const [dr, dc] of dirs) {
      const r = p.row + dr;
      const c = p.col + dc;
      if (!inBounds(r, c)) continue;
      if (placed.has(`${r},${c}`)) continue;
      if (getDigit(board, r, c) !== null) return true;
    }
  }
  return false;
}

function scoreLine(
  cells: Cell[],
  newKeys: Set<string>,
  blanks: boolean[],
  newBlanks: Set<string>,
): number {
  let sum = 0;
  let wordMult = 1;
  for (const cell of cells) {
    const key = `${cell.row},${cell.col}`;
    const blank = newBlanks.has(key) || blanks[idx(cell.row, cell.col)] === true;
    let value = blank ? 0 : cell.digit;
    // Premiums apply only for tiles placed on this turn (first use of the square).
    if (newKeys.has(key)) {
      const premium = premiumAt(cell.row, cell.col);
      if (premium === "dl") value *= 2;
      if (premium === "tl") value *= 3;
      if (premium === "dw" || premium === "center") wordMult *= 2;
      if (premium === "tw") wordMult *= 3;
    }
    sum += value;
  }
  return sum * wordMult;
}

function collectLines(
  board: (number | null)[],
  placements: Placement[],
  blanks: boolean[],
): Line[] {
  const newKeys = new Set(placements.map((p) => `${p.row},${p.col}`));
  const newBlanks = new Set(
    placements.filter((p) => p.blank).map((p) => `${p.row},${p.col}`),
  );
  const lines = new Map<string, Line>();
  for (const p of placements) {
    const horiz = walkLine(board, p.row, p.col, 0, 1);
    const vert = walkLine(board, p.row, p.col, 1, 0);
    for (const cells of [horiz, vert]) {
      if (cells.length === 0) continue;
      const k = lineKey(cells);
      if (lines.has(k)) continue;
      lines.set(k, { cells, score: scoreLine(cells, newKeys, blanks, newBlanks) });
    }
  }
  return [...lines.values()];
}

function mainLine(
  board: (number | null)[],
  placements: Placement[],
  axis: "row" | "col",
): Cell[] {
  const origin = placements[0]!;
  return axis === "row"
    ? walkLine(board, origin.row, origin.col, 0, 1)
    : walkLine(board, origin.row, origin.col, 1, 0);
}

function placementsOnLine(placements: Placement[], line: Cell[]): boolean {
  const keys = new Set(line.map((c) => `${c.row},${c.col}`));
  return placements.every((p) => keys.has(`${p.row},${p.col}`));
}

function otherPlayer(state: GameState, guestId: string): PlayerState | undefined {
  return state.players.find((p) => p.guestId !== guestId);
}

function requireTurn(state: GameState, guestId: string): EngineResult<{ player: PlayerState }> {
  if (state.status !== "active") {
    return { ok: false, error: "This game is not in progress." };
  }
  if (state.turnGuestId !== guestId) {
    return { ok: false, error: "It is not your turn." };
  }
  const player = state.players.find((p) => p.guestId === guestId);
  if (!player) return { ok: false, error: "You are not in this game." };
  return { ok: true, player };
}

function finishIfNeeded(
  state: GameState,
  player: PlayerState,
): GameState {
  const emptied = player.rack.length === 0 && state.bag.length === 0;
  const passedOut = state.consecutivePasses >= 2;
  if (!emptied && !passedOut) return state;
  const players = state.players.map((p) => ({
    ...p,
    score: p.score - rackSum(p.rack),
  }));
  const [a, b] = players;
  let winnerGuestId: string | null = null;
  if (a && b) {
    if (a.score > b.score) winnerGuestId = a.guestId;
    else if (b.score > a.score) winnerGuestId = b.guestId;
  } else if (a) {
    winnerGuestId = a.guestId;
  }
  return {
    ...state,
    players,
    status: "finished",
    turnGuestId: null,
    winnerGuestId,
  };
}

function advanceTurn(state: GameState, guestId: string): string {
  const other = otherPlayer(state, guestId);
  return other?.guestId ?? guestId;
}

export function previewPlay(
  board: (number | null)[],
  placements: Placement[],
  blanks: boolean[] = emptyBlanks(),
): EngineResult<{
  score: number;
  lines: Line[];
  board: (number | null)[];
  blanks: boolean[];
}> {
  const uniqueError = uniquePlacements(placements);
  if (uniqueError) return { ok: false, error: uniqueError };

  const applied = applyPlacements(board, placements);
  if (!applied.ok) return applied;

  const firstMove = !boardHasTiles(board);
  if (firstMove && !coversCenter(placements)) {
    return { ok: false, error: "The first play must cover the center star." };
  }
  if (firstMove && placements.length < 3) {
    return { ok: false, error: "The first play must be at least 3 tiles." };
  }
  if (!firstMove && !isAdjacentToExisting(board, placements)) {
    return { ok: false, error: "New tiles must connect to the existing board." };
  }

  const axis = sameLine(placements);
  if (!axis) {
    return { ok: false, error: "Tiles must be in a single row or column." };
  }

  const main = mainLine(applied.board, placements, axis);
  if (!placementsOnLine(placements, main)) {
    return { ok: false, error: "Tiles must form one contiguous line." };
  }

  const lines = collectLines(applied.board, placements, blanks);
  for (const line of lines) {
    const digits = line.cells.map((c) => c.digit);
    if (digits.length >= 2 && !isValidSequence(digits)) {
      return {
        ok: false,
        error:
          digits.length === 2
            ? `Two-tile plays must differ by 0 or 1: ${digits.join("-")}.`
            : `Not a Fibonacci sequence: ${digits.join("-")}.`,
      };
    }
  }

  let score = 0;
  for (const line of lines) {
    if (line.cells.length >= 2) {
      score += line.score;
    }
  }
  if (placements.length === RACK_SIZE) score += BINGO_BONUS;

  const nextBlanks = (blanks.length === applied.board.length
    ? blanks
    : emptyBlanks()
  ).slice();
  for (const p of placements) {
    nextBlanks[idx(p.row, p.col)] = Boolean(p.blank);
  }

  return { ok: true, score, lines, board: applied.board, blanks: nextBlanks };
}

export function playMove(
  state: GameState,
  guestId: string,
  placements: Placement[],
  rng: Rng = Math.random,
): EngineResult<PlayResult> {
  const turn = requireTurn(state, guestId);
  if (!turn.ok) return turn;

  const preview = previewPlay(state.board, placements, state.blanks ?? emptyBlanks());
  if (!preview.ok) return preview;

  const used = removeFromRack(
    turn.player.rack,
    placements.map((p) => (p.blank ? BLANK : p.digit)),
  );
  if (!used) {
    return { ok: false, error: "Those tiles are not on your rack." };
  }

  const filled = fillRack(used, state.bag);
  const players = state.players.map((p) =>
    p.guestId === guestId
      ? { ...p, rack: filled.rack, score: p.score + preview.score }
      : p,
  );
  const lastMove: LastMove = {
    guestId,
    kind: "play",
    placements,
    score: preview.score,
  };
  let next: GameState = {
    ...state,
    board: preview.board,
    blanks: preview.blanks,
    bag: shuffle(filled.bag, rng),
    players,
    turnGuestId: advanceTurn(state, guestId),
    consecutivePasses: 0,
    lastMove,
  };
  const me = next.players.find((p) => p.guestId === guestId)!;
  next = finishIfNeeded(next, me);
  return { ok: true, state: next, score: preview.score, lines: preview.lines };
}

export function passMove(
  state: GameState,
  guestId: string,
): EngineResult<{ state: GameState }> {
  const turn = requireTurn(state, guestId);
  if (!turn.ok) return turn;
  const lastMove: LastMove = {
    guestId,
    kind: "pass",
    placements: [],
    score: 0,
  };
  let next: GameState = {
    ...state,
    turnGuestId: advanceTurn(state, guestId),
    consecutivePasses: state.consecutivePasses + 1,
    lastMove,
  };
  next = finishIfNeeded(next, turn.player);
  return { ok: true, state: next };
}

export function forfeitMove(
  state: GameState,
  guestId: string,
): EngineResult<{ state: GameState }> {
  if (state.status !== "active") {
    return { ok: false, error: "This game is not in progress." };
  }
  const player = state.players.find((p) => p.guestId === guestId);
  if (!player) return { ok: false, error: "You are not in this game." };
  const winner = otherPlayer(state, guestId);
  const lastMove: LastMove = {
    guestId,
    kind: "forfeit",
    placements: [],
    score: 0,
  };
  return {
    ok: true,
    state: {
      ...state,
      status: "finished",
      turnGuestId: null,
      winnerGuestId: winner?.guestId ?? null,
      lastMove,
    },
  };
}

export function swapMove(
  state: GameState,
  guestId: string,
  digits: number[],
  rng: Rng = Math.random,
): EngineResult<{ state: GameState }> {
  const turn = requireTurn(state, guestId);
  if (!turn.ok) return turn;
  if (digits.length === 0) {
    return { ok: false, error: "Select at least one tile to swap." };
  }
  if (state.bag.length < digits.length) {
    return { ok: false, error: "Not enough tiles in the bag to swap." };
  }
  const remaining = removeFromRack(turn.player.rack, digits);
  if (!remaining) {
    return { ok: false, error: "Those tiles are not on your rack." };
  }
  const { drawn, bag: afterDraw } = {
    drawn: state.bag.slice(0, digits.length),
    bag: state.bag.slice(digits.length),
  };
  const bag = shuffle([...afterDraw, ...digits], rng);
  const players = state.players.map((p) =>
    p.guestId === guestId ? { ...p, rack: [...remaining, ...drawn] } : p,
  );
  const lastMove: LastMove = {
    guestId,
    kind: "swap",
    placements: [],
    score: 0,
  };
  const next: GameState = {
    ...state,
    bag,
    players,
    turnGuestId: advanceTurn(state, guestId),
    consecutivePasses: 0,
    lastMove,
  };
  return { ok: true, state: next };
}

export function startGame(
  players: PlayerState[],
  rng: Rng = Math.random,
): GameState {
  let bag = createBag(rng);
  const dealt = players.map((p) => {
    const filled = fillRack([], bag);
    bag = filled.bag;
    return { ...p, rack: filled.rack, score: 0 };
  });
  return {
    board: emptyBoard(),
    blanks: emptyBlanks(),
    bag,
    players: dealt,
    turnGuestId: dealt[0]?.guestId ?? null,
    consecutivePasses: 0,
    status: "active",
    winnerGuestId: null,
    lastMove: null,
  };
}

export function newBag(rng: Rng = Math.random): number[] {
  return createBag(rng);
}
