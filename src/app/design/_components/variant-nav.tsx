import Link from "next/link";

type Section = "about" | "gallery" | "recordings";
type Variant = "a" | "b" | "c";

const VARIANT_LABEL: Record<Variant, string> = {
  a: "Field Notes",
  b: "Resonance",
  c: "Archive",
};

const SECTIONS: { id: Section; label: string }[] = [
  { id: "about", label: "About" },
  { id: "gallery", label: "Gallery" },
  { id: "recordings", label: "Recordings" },
];

/**
 * Shared variant navigator.
 *
 * Pins a contextual strip under the design shell header so reviewers can
 * jump between the three section pages of a variant without leaving it.
 * The active page is marked with a thin sand underline and a filled
 * bracket on the left, echoing the editorial rule motif from the brand.
 */
export function VariantNav({
  variant,
  active,
}: {
  readonly variant: Variant;
  readonly active: Section | "index";
}) {
  const label = VARIANT_LABEL[variant];
  return (
    <div className="sticky top-[53px] z-40 border-b border-sand/10 bg-washed-black/94 backdrop-blur-[2px]">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-5 overflow-x-auto px-5 py-3 md:px-8">
        <span className="label-text shrink-0 text-[10px] text-sand">
          Variant {variant.toUpperCase()}
          <span className="ml-2 text-ivory/35">· {label}</span>
        </span>
        <span className="h-3 w-px shrink-0 bg-sand/15" />
        <nav className="flex min-w-0 items-center gap-4 md:gap-6">
          <Link
            href={`/design/variant-${variant}`}
            className={`label-text shrink-0 text-[10px] transition-colors duration-500 ${
              active === "index"
                ? "text-sand"
                : "text-ivory/50 hover:text-sand"
            }`}
          >
            Summary
          </Link>
          {SECTIONS.map((s) => (
            <Link
              key={s.id}
              href={`/design/variant-${variant}/${s.id}`}
              className={`label-text shrink-0 text-[10px] transition-colors duration-500 ${
                active === s.id
                  ? "text-sand"
                  : "text-ivory/50 hover:text-sand"
              }`}
            >
              {s.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
