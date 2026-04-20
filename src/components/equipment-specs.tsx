"use client";

import { useMemo, useState } from "react";

/**
 * Published (or preview) gear payload surfaced to the marketing site.
 * Matches the return shape of `api.public.getPublishedGear` and the
 * `categories` portion of `api.gearPreviewDraft.getPreviewGear`.
 */
export type GearSpecs =
  | { kind: "markdown"; text: string }
  | { kind: "kv"; pairs: { key: string; value: string }[] };

export type GearItem = {
  stableId: string;
  name: string;
  sort: number;
  specs: GearSpecs;
  url?: string;
};

export type GearCategory = {
  stableId: string;
  name: string;
  sort: number;
  items: GearItem[];
};

export type GearPayload = {
  categories: GearCategory[];
};

const STUDIO_SPECS = [
  {
    label: "Isolation Booths",
    value: "1 isolated amp closet, 1 isolated vocal booth, 1 isolated dead room",
  },
  { label: "Monitoring", value: "Focal Solo6, ATC SCM45" },
  { label: "Cue System", value: "16-channel Hear Technology Cue System" },
] as const;

const DEFAULT_EXPANDED_COUNT = 3;

function formatSpecs(specs: GearSpecs): string {
  if (specs.kind === "markdown") {
    return specs.text.trim();
  }
  return specs.pairs
    .map(({ key, value }) => `${key.trim()}: ${value.trim()}`)
    .filter((line) => line.length > 2)
    .join(", ");
}

function SectionHeader() {
  return (
    <div className="text-center mb-16 reveal">
      <p className="label-text text-sand/60 mb-4">Equipment</p>
      <h2 className="headline-primary text-3xl md:text-4xl lg:text-5xl text-warm-white mb-6">
        Studio Specifications
      </h2>
      <div className="section-rule max-w-xs mx-auto mb-8" />
      <p className="body-text text-lg text-ivory/60 max-w-2xl mx-auto">
        World-class equipment and acoustically designed spaces ensure your recordings
        capture every nuance with pristine clarity and character.
      </p>
    </div>
  );
}

function StudioSpecsGrid() {
  return (
    <div className="reveal reveal-delay-1 mb-16">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-sand/10 border border-sand/10">
        {STUDIO_SPECS.map((spec) => (
          <div key={spec.label} className="bg-washed-black p-6 md:p-8 text-center">
            <div className="label-text text-sand mb-3">{spec.label}</div>
            <div className="body-text-small text-ivory/60">{spec.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionShell({ children }: { children: React.ReactNode }) {
  return (
    <section id="equipment-specs" className="py-24 md:py-32 px-6 bg-charcoal relative">
      <div className="absolute inset-0 opacity-20 bg-texture-stone" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <SectionHeader />
        <StudioSpecsGrid />
        {children}
      </div>
    </section>
  );
}

export function EquipmentSpecsSkeleton() {
  return (
    <SectionShell>
      <div className="reveal reveal-delay-2 space-y-px" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="border border-sand/8 bg-washed-black/60 px-6 py-5 flex items-center justify-between animate-pulse"
          >
            <div className="h-4 w-48 bg-sand/10" />
            <div className="h-3 w-8 bg-sand/10" />
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

function EquipmentSpecsEmpty() {
  return (
    <div className="reveal reveal-delay-2 border border-sand/8 bg-washed-black/60 p-10 text-center">
      <p className="body-text text-ivory/60">
        Equipment list coming soon. Check back shortly — our gear inventory is being
        updated.
      </p>
    </div>
  );
}

interface EquipmentSpecsProps {
  /**
   * `undefined` → still loading (render skeleton).
   * `null` → query unavailable or caller not permitted (render empty state).
   * Payload → render accordion.
   */
  readonly gear: GearPayload | null | undefined;
}

export function EquipmentSpecs({ gear }: EquipmentSpecsProps) {
  if (gear === undefined) {
    return <EquipmentSpecsSkeleton />;
  }

  const categories = gear?.categories ?? [];

  if (categories.length === 0) {
    return (
      <SectionShell>
        <EquipmentSpecsEmpty />
      </SectionShell>
    );
  }

  return (
    <SectionShell>
      <EquipmentCategoriesAccordion categories={categories} />
    </SectionShell>
  );
}

function EquipmentCategoriesAccordion({
  categories,
}: {
  readonly categories: readonly GearCategory[];
}) {
  const initialExpanded = useMemo(
    () =>
      categories
        .slice(0, DEFAULT_EXPANDED_COUNT)
        .map((c) => c.stableId),
    [categories],
  );
  const [expanded, setExpanded] = useState<readonly string[]>(initialExpanded);

  const toggle = (stableId: string) => {
    setExpanded((prev) =>
      prev.includes(stableId)
        ? prev.filter((id) => id !== stableId)
        : [...prev, stableId],
    );
  };

  return (
    <div className="reveal reveal-delay-2 space-y-px">
      {categories.map((category) => {
        const isExpanded = expanded.includes(category.stableId);
        return (
          <div
            key={category.stableId}
            className="border border-sand/8 bg-washed-black/60"
          >
            <button
              type="button"
              onClick={() => toggle(category.stableId)}
              aria-expanded={isExpanded}
              aria-controls={`equipment-panel-${category.stableId}`}
              className="w-full px-6 py-5 flex items-center justify-between hover:bg-sand/5 transition-colors"
            >
              <span className="headline-secondary text-lg text-sand">
                {category.name}
              </span>
              <div className="flex items-center gap-3">
                <span className="label-text text-ivory/30 text-[10px]">
                  {category.items.length}
                </span>
                <svg
                  className={`w-4 h-4 text-ivory/30 transition-transform duration-300 ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </button>

            {isExpanded && (
              <div
                id={`equipment-panel-${category.stableId}`}
                className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1"
              >
                {category.items.map((item) => {
                  const specsLabel = formatSpecs(item.specs);
                  return (
                    <div
                      key={item.stableId}
                      className="py-2 border-b border-sand/5 last:border-0 flex items-baseline justify-between gap-4"
                    >
                      <span className="body-text text-ivory/70 text-sm">
                        {item.url ? (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-sand underline-offset-4 hover:underline"
                          >
                            {item.name}
                          </a>
                        ) : (
                          item.name
                        )}
                      </span>
                      {specsLabel.length > 0 && (
                        <span className="body-text-small text-ivory/35 text-xs whitespace-nowrap">
                          {specsLabel}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
