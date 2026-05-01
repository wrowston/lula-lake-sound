/**
 * Format `createdAt` (epoch ms) for admin inquiry lists in the browser's local
 * timezone. Tests pass an explicit `timeZone` for stable assertions.
 */
export function formatInquiryTimestamp(
  createdAtMs: number,
  timeZone?: string,
): string {
  return new Intl.DateTimeFormat("en-US", {
    ...(timeZone !== undefined ? { timeZone } : {}),
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(createdAtMs));
}
