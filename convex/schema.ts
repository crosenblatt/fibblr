import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const playerValidator = v.object({
  guestId: v.string(),
  name: v.string(),
  score: v.number(),
  rack: v.array(v.number()),
});

export const placementValidator = v.object({
  row: v.number(),
  col: v.number(),
  digit: v.number(),
});

export const lastMoveValidator = v.object({
  guestId: v.string(),
  kind: v.union(v.literal("play"), v.literal("pass"), v.literal("swap")),
  placements: v.array(placementValidator),
  score: v.number(),
});

export default defineSchema({
  rooms: defineTable({
    code: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
    status: v.union(
      v.literal("lobby"),
      v.literal("active"),
      v.literal("finished"),
      v.literal("expired"),
    ),
    board: v.array(v.union(v.number(), v.null())),
    bag: v.array(v.number()),
    players: v.array(playerValidator),
    turnGuestId: v.union(v.string(), v.null()),
    consecutivePasses: v.number(),
    winnerGuestId: v.union(v.string(), v.null()),
    lastMove: v.union(lastMoveValidator, v.null()),
  })
    .index("by_code", ["code"])
    .index("by_expiresAt", ["expiresAt"]),
});
