/**
 * Normalize user-entered URLs for amenities (editor + Convex save path).
 * Returns `null` when the value should be treated as "no link" (empty / invalid).
 */
export function normalizeAmenitiesWebsiteInput(raw: string): string | null {
  const t = raw.trim();
  if (t.length === 0) return null;

  let candidate = t;
  if (!/^[a-zA-Z][a-zA-Z+.-]*:/.test(candidate)) {
    candidate = `https://${candidate.replace(/^\/+/, "")}`;
  }

  try {
    const u = new URL(candidate);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return null;
    }
    if (u.username || u.password) {
      return null;
    }
    const host = u.hostname;
    if (!host || host === "localhost") {
      return null;
    }
    const out = u.toString();
    return out.length > 2048 ? null : out;
  } catch {
    return null;
  }
}

/** Prefer https for storage when the URL parses as http. */
export function websiteForStorage(normalized: string): string {
  try {
    const u = new URL(normalized);
    if (u.protocol === "http:") {
      u.protocol = "https:";
      return u.toString();
    }
    return normalized;
  } catch {
    return normalized;
  }
}
