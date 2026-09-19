import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import {
  ROOM_TTL_MS,
  emptyBlanks,
  emptyBoard,
  passMove,
  playMove,
  startGame,
  swapMove,
  type GameState,
  type LastMove,
} from "../src/lib/game";
import { placementValidator } from "./schema";

function toState(room: Doc<"rooms">): GameState {
  return {
    board: room.board,
    blanks: room.blanks ?? emptyBlanks(),
    bag: room.bag,
    players: room.players,
    turnGuestId: room.turnGuestId,
    consecutivePasses: room.consecutivePasses,
    status: room.status,
    winnerGuestId: room.winnerGuestId,
    lastMove: room.lastMove,
  };
}

function fromState(state: GameState) {
  return {
    board: state.board,
    blanks: state.blanks,
    bag: state.bag,
    players: state.players,
    turnGuestId: state.turnGuestId,
    consecutivePasses: state.consecutivePasses,
    status: state.status,
    winnerGuestId: state.winnerGuestId,
    lastMove: state.lastMove,
  };
}

function redact(room: Doc<"rooms">, guestId: string) {
  return {
    code: room.code,
    createdAt: room.createdAt,
    expiresAt: room.expiresAt,
    status: room.status,
    board: room.board,
    blanks: room.blanks ?? emptyBlanks(),
    bagCount: room.bag.length,
    turnGuestId: room.turnGuestId,
    consecutivePasses: room.consecutivePasses,
    winnerGuestId: room.winnerGuestId,
    lastMove: room.lastMove,
    history: room.history ?? [],
    you: room.players.find((p) => p.guestId === guestId) ?? null,
    players: room.players.map((p) => ({
      guestId: p.guestId,
      name: p.name,
      score: p.score,
      rackCount: p.rack.length,
      rack: p.guestId === guestId ? p.rack : [],
      isYou: p.guestId === guestId,
    })),
  };
}

function appendHistory(room: Doc<"rooms">, move: LastMove | null) {
  if (!move) return room.history ?? [];
  const name = room.players.find((p) => p.guestId === move.guestId)?.name ?? "Player";
  return [...(room.history ?? []), { ...move, name, at: Date.now() }].slice(-80);
}

function trimName(name: string): string {
  const next = name.trim().slice(0, 24);
  if (!next) throw new Error("Enter a name.");
  return next;
}

export const getRoom = query({
  args: { code: v.string(), guestId: v.string() },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();
    if (!room) return null;
    if (Date.now() > room.expiresAt) {
      return { ...redact(room, args.guestId), status: "expired" as const };
    }
    return redact(room, args.guestId);
  },
});

export const createRoom = mutation({
  args: { guestId: v.string(), name: v.string() },
  handler: async (ctx, args) => {
    const name = trimName(args.name);
    const now = Date.now();
    const code = crypto.randomUUID();
    await ctx.db.insert("rooms", {
      code,
      createdAt: now,
      expiresAt: now + ROOM_TTL_MS,
      status: "lobby",
      board: emptyBoard(),
      blanks: emptyBlanks(),
      bag: [],
      players: [{ guestId: args.guestId, name, score: 0, rack: [] }],
      turnGuestId: args.guestId,
      consecutivePasses: 0,
      winnerGuestId: null,
      lastMove: null,
    });
    return { code };
  },
});

export const joinRoom = mutation({
  args: { code: v.string(), guestId: v.string(), name: v.string() },
  handler: async (ctx, args) => {
    const name = trimName(args.name);
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();
    if (!room) throw new Error("Room not found.");
    if (Date.now() > room.expiresAt) throw new Error("This room has expired.");
    if (room.status === "finished") throw new Error("This game is over.");

    const existing = room.players.find((p) => p.guestId === args.guestId);
    if (existing) {
      await ctx.db.patch(room._id, {
        players: room.players.map((p) =>
          p.guestId === args.guestId ? { ...p, name } : p,
        ),
      });
      return { ok: true as const };
    }
    if (room.players.length >= 2) {
      throw new Error("This room is full.");
    }
    if (room.status !== "lobby") {
      throw new Error("This room is full.");
    }

    const players = [
      ...room.players,
      { guestId: args.guestId, name, score: 0, rack: [] },
    ];
    const started = startGame(players);
    await ctx.db.patch(room._id, fromState(started));
    return { ok: true as const };
  },
});

export const submitMove = mutation({
  args: {
    code: v.string(),
    guestId: v.string(),
    placements: v.array(placementValidator),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();
    if (!room) throw new Error("Room not found.");
    if (Date.now() > room.expiresAt) throw new Error("This room has expired.");
    const result = playMove(toState(room), args.guestId, args.placements);
    if (!result.ok) throw new Error(result.error);
    await ctx.db.patch(room._id, {
      ...fromState(result.state),
      history: appendHistory(room, result.state.lastMove),
    });
    return { score: result.score };
  },
});

export const pass = mutation({
  args: { code: v.string(), guestId: v.string() },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();
    if (!room) throw new Error("Room not found.");
    if (Date.now() > room.expiresAt) throw new Error("This room has expired.");
    const result = passMove(toState(room), args.guestId);
    if (!result.ok) throw new Error(result.error);
    await ctx.db.patch(room._id, {
      ...fromState(result.state),
      history: appendHistory(room, result.state.lastMove),
    });
  },
});

export const swapTiles = mutation({
  args: {
    code: v.string(),
    guestId: v.string(),
    digits: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();
    if (!room) throw new Error("Room not found.");
    if (Date.now() > room.expiresAt) throw new Error("This room has expired.");
    const result = swapMove(toState(room), args.guestId, args.digits);
    if (!result.ok) throw new Error(result.error);
    await ctx.db.patch(room._id, {
      ...fromState(result.state),
      history: appendHistory(room, result.state.lastMove),
    });
  },
});

export const expireRooms = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expired = await ctx.db
      .query("rooms")
      .withIndex("by_expiresAt", (q) => q.lt("expiresAt", now))
      .take(50);
    for (const room of expired) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_code", (q) => q.eq("code", room.code))
        .take(200);
      for (const message of messages) {
        await ctx.db.delete(message._id);
      }
      await ctx.db.delete(room._id);
    }
  },
});

