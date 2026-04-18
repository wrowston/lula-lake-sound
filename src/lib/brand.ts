/**
 * Lula Lake Sound — brand tokens
 *
 * Canonical TypeScript source of truth for the brand palette, type scale
 * and spacing rhythm. Mirrors the CSS custom properties declared inside
 * `src/app/globals.css` so the same numeric values can be consumed from
 * component code (inline styles, Tailwind arbitrary values, etc.).
 *
 * Usage rules from the brand guide:
 *
 *   - Primary dominance:  washedBlack · sand · rust · ivory
 *   - Secondary support:  sage · forest · maroon
 *   - Accent (sparingly): gold · pond · fire
 *
 * Accents exist for contrast moments only. They must never dominate a
 * composition. Do not introduce hues outside this palette.
 */

export const brandColors = {
  washedBlack: "#1f1e1c",
  rust: "#54340d",
  ivory: "#bfbbb5",
  forest: "#1c1e15",
  gold: "#a3822e",
  sand: "#c6bda0",
  fire: "#ef3c23",
  sage: "#55656a",
  pond: "#5a4c1b",
  maroon: "#3d1516",

  warmWhite: "#e8e4dc",
  charcoal: "#2a2725",
  deepForest: "#141610",
} as const;

export type BrandColorName = keyof typeof brandColors;

export const brandFonts = {
  /**
   * Display / headline stack. Acumin Variable Concept Wide Semibold is
   * the licensed house font; it ships from Adobe Fonts and cannot be
   * delivered from this open repository without a project-scoped
   * Typekit id. Per the brand guide, Arial Bold is the sanctioned
   * fallback. We widen tracking in CSS to approximate the "wide
   * semibold" feel.
   */
  display: [
    '"Acumin Variable Concept"',
    '"Acumin Pro Wide"',
    '"Acumin Pro"',
    "Arial",
    "Helvetica",
    "system-ui",
    "sans-serif",
  ].join(", "),

  /**
   * Body / supporting stack. Titillium Web is loaded via `next/font` in
   * `src/app/layout.tsx`; Verdana is the sanctioned fallback.
   */
  body: [
    '"Titillium Web"',
    "Verdana",
    "system-ui",
    "-apple-system",
    "sans-serif",
  ].join(", "),
} as const;

/**
 * Vertical rhythm used across sections. Kept intentionally generous per
 * the brand guide's "let the layout breathe" directive.
 */
export const brandSpacing = {
  sectionY: "clamp(6rem, 12vw, 10rem)",
  sectionYTight: "clamp(4rem, 8vw, 7rem)",
  gutter: "clamp(1.5rem, 4vw, 3rem)",
  maxWidthNarrow: "48rem",
  maxWidthProse: "56rem",
  maxWidthStandard: "72rem",
  maxWidthWide: "80rem",
} as const;

export const brandMotion = {
  easeCalm: "cubic-bezier(0.22, 1, 0.36, 1)",
  durationSlow: "900ms",
  durationMedium: "500ms",
  durationShort: "300ms",
} as const;
