import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

/**
 * Weekly cleanup of draft-only audio uploads abandoned for 7+ days (INF-95).
 * See `admin/audio.garbageCollectAbandonedDraftAudio`.
 */
const crons = cronJobs();

crons.weekly(
  "gc abandoned draft audio",
  {
    dayOfWeek: "sunday",
    hourUTC: 5,
    minuteUTC: 30,
  },
  internal.admin.audio.garbageCollectAbandonedDraftAudio,
);

export default crons;
