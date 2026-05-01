/**
 * Editorial scroll-progress hairline.
 *
 * Pure-CSS — driven by `animation-timeline: scroll(root)` from
 * `src/app/globals.css` (`.scroll-progress-bar`). No state, no JS, no
 * `useEffect`. Browsers without scroll-driven animation support render an
 * invisible track (transform stays at scaleX(0)), so the page degrades to
 * the existing hairline rule under the nav without regression.
 *
 * Mounted inside `<Header>` so it appears on every public marketing page
 * automatically.
 */
export function ScrollProgress() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 h-px overflow-hidden"
    >
      <div
        className="scroll-progress-bar h-full w-full origin-left bg-sand/45"
        style={{ transformOrigin: "left center" }}
      />
    </div>
  );
}
