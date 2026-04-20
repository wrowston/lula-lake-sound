/**
 * Lula Lake Sound — centralized brand theme tokens.
 *
 * Source of truth for every palette, typography, spacing, and texture value on
 * the marketing site. CSS custom properties in `src/app/globals.css` mirror
 * these values; when changing a brand token, update both in tandem so the
 * JavaScript and CSS worlds stay in sync.
 *
 * Design direction (per the Lula Lake Sound brand guide): quiet luxury
 * recording studio in nature — understated, grounded, textural, editorial.
 */

/** Primary earthen brand palette from the Lula Lake Sound guide. */
export const brandPalette = {
  /** Dominant near-black ground color (final brand guide palette: RGB 30,30,28). */
  washedBlack: "#1f1e1c",
  /** Deep saddle brown — used for primary ink / accents. */
  rust: "#54340d",
  /** Warm off-white — body copy / secondary surfaces (final brand guide palette: RGB 191,187,181). */
  ivory: "#bfbbb5",
  /** Near-black forest green — used sparingly for background shifts. */
  forest: "#1c1e15",
  /** Burnished gold — emphasis & selection only. */
  gold: "#a3822e",
  /** Warm sand — primary foreground, nav, quiet emphasis. */
  sand: "#c6bda0",
  /** High-saturation signal red — rare emphasis / error. */
  fire: "#ef3c23",
  /** Muted sage gray-green — utility surfaces, dividers. */
  sage: "#55656a",
  /** Deep olive — ambient textures / secondary surfaces. */
  pond: "#5a4c1b",
  /** Dark maroon — rare accent only. */
  maroon: "#3d1516",
} as const;

/** Extended neutrals blended from the brand palette for real-world UI work. */
export const brandNeutrals = {
  /** Slightly brighter ivory for highlighted text. */
  warmWhite: "#e8e4dc",
  /** One step off washed-black for card surfaces. */
  charcoal: "#2a2725",
  /** Deepest recessive background. */
  deepForest: "#141610",
} as const;

/** Usage guidance: which tokens should dominate vs. support vs. accent. */
export const brandUsage = {
  dominant: ["washedBlack", "sand", "rust", "ivory"] as const,
  support: ["sage", "forest", "maroon"] as const,
  accent: ["gold", "pond", "fire"] as const,
} as const;

/** Font families — files live in `src/fonts/` and load via `src/app/layout.tsx`. */
export const brandTypography = {
  /**
   * Headline family. Brand guide: Acumin Variable Concept Wide Semibold — the
   * repo ships `AcuminVariableConcept.otf` with `font-variation-settings: "wght" 600, "wdth" 115`
   * on `.headline-*` utilities (matches InDesign axes 600 / 115 / 0). `Arial-Bold.ttf` follows as licensed kit fallback.
   */
  headline:
    '"Acumin Variable Concept", "Arial Bold", Arial, system-ui, sans-serif',
  /**
   * Body / supporting copy: Titillium Web from local OTFs in `src/fonts/` with
   * `Verdana.ttf` in the stack per the brand kit.
   */
  body: '"Titillium Web", Verdana, system-ui, -apple-system, sans-serif',
} as const;

/**
 * Fluid type scale. Headlines compress gracefully on small viewports to keep
 * the editorial rhythm intact on phones.
 */
export const typeScale = {
  display: "clamp(2.75rem, 5vw, 4.5rem)",
  h1: "clamp(2.25rem, 4vw, 3.75rem)",
  h2: "clamp(1.875rem, 3vw, 2.75rem)",
  h3: "clamp(1.375rem, 2.25vw, 1.875rem)",
  body: "1rem",
  small: "0.875rem",
  caption: "0.75rem",
} as const;

/** Letter-spacing and line-height tokens for editorial restraint. */
export const typeRhythm = {
  /** Hero / primary H1 — positive tracking balances Acumin Wide Semibold. */
  trackDisplay: "0.045em",
  trackHeadline: "0.04em",
  trackLabel: "0.18em",
  trackWide: "0.32em",
  leadingHeadline: 1.08,
  leadingRelaxed: 1.6,
  leadingLoose: 1.8,
} as const;

/**
 * Section-level spacing. We intentionally err on the generous side so the
 * landing page reads like a print spread rather than a dense SaaS dashboard.
 */
export const spacing = {
  sectionY: "clamp(6rem, 10vw, 10rem)",
  sectionX: "clamp(1.5rem, 4vw, 3rem)",
  gutter: "clamp(1.5rem, 3vw, 2.5rem)",
  stack: "clamp(1rem, 2vw, 2rem)",
} as const;

/**
 * Motion tokens. Everything is slow and cinematic — no bouncy easings.
 */
export const motion = {
  easeEditorial: "cubic-bezier(0.16, 1, 0.3, 1)",
  durationSlow: "0.9s",
  durationMedium: "0.6s",
  durationFast: "0.35s",
} as const;

/** Texture / pattern overlays used on backgrounds. */
export const textures = {
  grainOpacity: 0.04,
  chladniOpacity: 0.06,
  stoneOpacity: 0.25,
} as const;

export type BrandColorToken = keyof typeof brandPalette;
export type BrandNeutralToken = keyof typeof brandNeutrals;
