/**
 * Returns the current time as a proper ISO 8601 string in the app's
 * configured timezone (TIMEZONE in .env), e.g. "2026-06-07T16:00:00.000+03:00"
 */
export const localTimestamp = () => {
  const tz  = process.env.TIMEZONE || "UTC";
  const now = new Date();

  // ── 1. Calculate the offset between UTC and the target timezone ────────────
  const utcDate   = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }));
  const localDate = new Date(now.toLocaleString("en-US", { timeZone: tz  }));
  const offsetMs  = localDate - utcDate;           // milliseconds
  const offsetMin = offsetMs / 60_000;             // minutes

  // ── 2. Build the "+HH:MM" / "-HH:MM" offset string ────────────────────────
  const sign = offsetMin >= 0 ? "+" : "-";
  const hh   = String(Math.floor(Math.abs(offsetMin) / 60)).padStart(2, "0");
  const mm   = String(Math.abs(offsetMin) % 60).padStart(2, "0");
  const offsetStr = `${sign}${hh}:${mm}`;          // e.g. "+03:00"

  // ── 3. Shift the UTC instant by the offset, then replace the trailing Z ───
  const shifted = new Date(now.getTime() + offsetMs);
  return shifted.toISOString().replace("Z", offsetStr);
  // result looks like: "2026-06-07T16:00:00.000+03:00"
};