import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "expire rooms past their TTL",
  { minutes: 1 },
  internal.rooms.expireRooms,
);

export default crons;
