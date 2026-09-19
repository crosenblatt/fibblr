import { describe, expect, it } from "vitest";
import { emptyBoard, idx } from "./board";
import { playMove, previewPlay, startGame, passMove, swapMove } from "./move";
import type { GameState, Placement, PlayerState } from "./types";

function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function players(): PlayerState[] {
  return [
    { guestId: "a", name: "Ada", score: 0, rack: [] },
    { guestId: "b", name: "Bob", score: 0, rack: [] },
  ];
}

function place(digits: number[], startCol: number, row = 7): Placement[] {
  return digits.map((digit, i) => ({ row, col: startCol + i, digit }));
}

function withRack(state: GameState, guestId: string, rack: number[]): GameState {
  return {
    ...state,
    players: state.players.map((p) => (p.guestId === guestId ? { ...p, rack } : p)),
  };
}

describe("previewPlay", () => {
  it("requires the opening play to cover center and be 3+ tiles", () => {
    const board = emptyBoard();
    expect(previewPlay(board, place([1, 1], 7)).ok).toBe(false);
    expect(previewPlay(board, place([1, 1, 2], 8)).ok).toBe(false);
    expect(previewPlay(board, place([1, 1, 2], 6)).ok).toBe(true);
  });

  it("accepts 1-1-2-3-5-8-3 through the center", () => {
    const result = previewPlay(emptyBoard(), place([1, 1, 2, 3, 5, 8, 3], 4));
    expect(result.ok).toBe(true);
  });

  it("accepts wraparound 8-3-1", () => {
    const result = previewPlay(emptyBoard(), place([8, 3, 1], 6));
    expect(result.ok).toBe(true);
  });

  it("rejects a non-fib opening", () => {
    const result = previewPlay(emptyBoard(), place([1, 1, 3], 6));
    expect(result.ok).toBe(false);
  });

  it("doubles the word on the center star", () => {
    const result = previewPlay(emptyBoard(), place([1, 1, 2], 6));
    expect(result.ok).toBe(true);
    if (result.ok) {
      // 1+1+2 = 4, center is DW on the middle 1
      expect(result.score).toBe(8);
    }
  });

  it("adds bingo bonus for a 7-tile play", () => {
    const result = previewPlay(emptyBoard(), place([1, 1, 2, 3, 5, 8, 3], 4));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.score).toBeGreaterThanOrEqual(50);
    }
  });

  it("requires later plays to connect", () => {
    const first = previewPlay(emptyBoard(), place([1, 1, 2], 6));
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const disconnected = previewPlay(first.board, [
      { row: 0, col: 0, digit: 4 },
      { row: 0, col: 1, digit: 4 },
      { row: 0, col: 2, digit: 8 },
    ]);
    expect(disconnected.ok).toBe(false);
  });

  it("allows a 1–2 tile connector and does not score it", () => {
    const first = previewPlay(emptyBoard(), place([1, 1, 2], 6));
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const hook = previewPlay(first.board, [{ row: 8, col: 8, digit: 9 }]);
    expect(hook.ok).toBe(true);
    if (hook.ok) expect(hook.score).toBe(0);
  });

  it("scores an extension that forms a longer fib line", () => {
    const first = previewPlay(emptyBoard(), place([1, 1, 2], 6));
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const extend = previewPlay(first.board, [{ row: 7, col: 9, digit: 3 }]);
    expect(extend.ok).toBe(true);
    if (extend.ok) expect(extend.score).toBeGreaterThan(0);
  });
});

describe("playMove", () => {
  it("consumes rack tiles, scores, and passes the turn", () => {
    let state = startGame(players(), seeded());
    state = withRack(state, "a", [1, 1, 2, 4, 5, 6, 7]);
    const result = playMove(state, "a", place([1, 1, 2], 6), seeded(2));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.turnGuestId).toBe("b");
    expect(result.state.players[0]!.score).toBe(8);
    expect(result.state.board[idx(7, 7)]).toBe(1);
    expect(result.state.players[0]!.rack).toHaveLength(7);
  });

  it("rejects playing tiles that are not on the rack", () => {
    const state = withRack(startGame(players(), seeded()), "a", [9, 9, 9, 9, 9, 9, 9]);
    const result = playMove(state, "a", place([1, 1, 2], 6), seeded());
    expect(result.ok).toBe(false);
  });
});

describe("pass and swap", () => {
  it("ends the game after two consecutive passes", () => {
    let state = withRack(startGame(players(), seeded()), "a", [5]);
    state = withRack(state, "b", [3]);
    const p1 = passMove(state, "a");
    expect(p1.ok).toBe(true);
    if (!p1.ok) return;
    const p2 = passMove(p1.state, "b");
    expect(p2.ok).toBe(true);
    if (!p2.ok) return;
    expect(p2.state.status).toBe("finished");
    expect(p2.state.players[0]!.score).toBe(-5);
    expect(p2.state.players[1]!.score).toBe(-3);
  });

  it("swaps selected tiles when the bag has enough", () => {
    let state = startGame(players(), seeded());
    state = withRack(state, "a", [0, 1, 2, 3, 4, 5, 6]);
    const result = swapMove(state, "a", [0, 1], seeded(3));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.players[0]!.rack).toHaveLength(7);
    expect(result.state.turnGuestId).toBe("b");
  });
});
