import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "expire rooms older than 3 hours",
  { minutes: 15 },
  internal.rooms.expireRooms,
);

export default crons;
