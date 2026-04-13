"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { segment: "" as const, label: "Overview" },
  { segment: "about" as const, label: "About" },
  { segment: "gallery" as const, label: "Gallery" },
  { segment: "recordings" as const, label: "Recordings" },
];

type VariantKey = "a" | "b" | "c";

const shell: Record<
  VariantKey,
  { base: string; active: string; ring: string; panel: string }
> = {
  a: {
    base: "/design/variant-a",
    active: "text-gold border-gold/40 bg-gold/[0.07]",
    ring: "border-gold/15",
    panel: "bg-deep-forest/90",
  },
  b: {
    base: "/design/variant-b",
    active: "text-gold border-gold/40 bg-gold/[0.07]",
    ring: "border-gold/15",
    panel: "bg-washed-black/75",
  },
  c: {
    base: "/design/variant-c",
    active: "text-sage border-sage/40 bg-sage/[0.08]",
    ring: "border-sage/20",
    panel: "bg-washed-black/75",
  },
};

export function VariantSectionNav({ variant }: { variant: VariantKey }) {
  const pathname = usePathname();
  const { base, active, ring, panel } = shell[variant];

  return (
    <nav
      className={`
        pointer-events-auto flex flex-wrap items-center justify-center gap-1.5
        rounded-full border px-1.5 py-1.5 backdrop-blur-md
        ${panel} ${ring}
      `}
      aria-label="Design variant pages"
    >
      {items.map(({ segment, label }) => {
        const href = segment ? `${base}/${segment}` : base;
        const isActive =
          segment === ""
            ? pathname === base || pathname === `${base}/`
            : pathname === href;

        return (
          <Link
            key={segment || "overview"}
            href={href}
            className={`
              label-text rounded-full px-3 py-1.5 text-[10px] tracking-[0.12em]
              border transition-colors duration-200
              ${
                isActive
                  ? active
                  : "border-transparent text-ivory/45 hover:text-ivory/70 hover:border-sand/20"
              }
            `}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
