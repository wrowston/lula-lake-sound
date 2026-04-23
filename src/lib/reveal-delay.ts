/**
 * Site-wide `.reveal` + `.reveal-delay-N` classes (`src/app/globals.css`).
 * A container-level `IntersectionObserver` toggles `.in-view` on each
 * observed element when it scrolls into view.
 */
export const MAX_REVEAL_DELAY = 6;

export function revealDelay(step: number): string {
  if (step <= 0) return "reveal";
  const clamped = Math.min(step, MAX_REVEAL_DELAY);
  return `reveal reveal-delay-${clamped}`;
}
