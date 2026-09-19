export const BOARD_SIZE = 15;
export const CENTER = 7;
export const RACK_SIZE = 7;
export const BAG_PER_DIGIT = 10;
export const BLANK = -1;
export const BLANK_COUNT = 2;
export const BINGO_BONUS = 50;
export const ROOM_TTL_MS = 3 * 60 * 60 * 1000;

export type Premium = "none" | "dl" | "tl" | "dw" | "tw" | "center";
export type RoomStatus = "lobby" | "active" | "finished" | "expired";

export type Placement = {
  row: number;
  col: number;
  digit: number;
  blank?: boolean;
};

export type PlayerState = {
  guestId: string;
  name: string;
  score: number;
  rack: number[];
};

export type LastMove = {
  guestId: string;
  kind: "play" | "pass" | "swap" | "forfeit";
  placements: Placement[];
  score: number;
};

export type GameState = {
  board: (number | null)[];
  blanks: boolean[];
  bag: number[];
  players: PlayerState[];
  turnGuestId: string | null;
  consecutivePasses: number;
  status: RoomStatus;
  winnerGuestId: string | null;
  lastMove: LastMove | null;
};

export type Line = {
  cells: { row: number; col: number; digit: number }[];
  score: number;
};

export type PlayResult = {
  state: GameState;
  score: number;
  lines: Line[];
};

export type EngineError = { ok: false; error: string };
export type EngineOk<T> = { ok: true } & T;
export type EngineResult<T> = EngineOk<T> | EngineError;
