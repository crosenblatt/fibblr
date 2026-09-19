import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const MAX_MESSAGE_LENGTH = 240;
const MAX_MESSAGES = 80;

export const listMessages = query({
  args: { code: v.string(), guestId: v.string() },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();
    if (!room || Date.now() > room.expiresAt) return [];
    if (!room.players.some((p) => p.guestId === args.guestId)) return [];

    const rows = await ctx.db
      .query("messages")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .order("desc")
      .take(MAX_MESSAGES);
    return rows.reverse().map((row) => ({
      _id: row._id,
      guestId: row.guestId,
      name: row.name,
      text: row.text,
      createdAt: row._creationTime,
    }));
  },
});

export const sendMessage = mutation({
  args: { code: v.string(), guestId: v.string(), text: v.string() },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();
    if (!room) throw new Error("Room not found.");
    if (Date.now() > room.expiresAt) throw new Error("This room has expired.");
    const player = room.players.find((p) => p.guestId === args.guestId);
    if (!player) throw new Error("Join the game to chat.");

    const text = args.text.trim().slice(0, MAX_MESSAGE_LENGTH);
    if (!text) throw new Error("Enter a message.");

    await ctx.db.insert("messages", {
      code: args.code,
      guestId: args.guestId,
      name: player.name,
      text,
    });
  },
});
