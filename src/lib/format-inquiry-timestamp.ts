/**
 * Format `createdAt` (epoch ms) for admin inquiry lists. Uses a fixed calendar
 * so snapshots/tests stay stable across environments.
 */
export function formatInquiryTimestamp(
  createdAtMs: number,
  timeZone = "America/New_York",
): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(createdAtMs));
}
