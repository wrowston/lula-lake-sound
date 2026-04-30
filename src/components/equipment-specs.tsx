"use client";

import Image from "next/image";
import { useMemo } from "react";

import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PublicSectionNotice } from "@/components/public-section-notice";
import { PUBLIC_CONVEX_QUERY_FAILED } from "@/lib/use-public-convex-query";

/**
 * Published (or preview) gear payload surfaced to the marketing site.
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
    <div className="reveal mb-20 flex w-full flex-col items-center text-center">
      <Image
        src="/Logos/Graphic/LLS_Logo_Graphic_Sand.png"
        alt=""
        width={200}
        height={200}
        aria-hidden
        className="mb-10 h-12 w-auto opacity-80 md:h-14"
      />
      <p className="eyebrow mb-6 text-sand/82">Equipment</p>
      <h2 className="headline-primary mb-8 text-[2.25rem] text-warm-white md:text-[3rem] lg:text-[3.5rem]">
        Studio Specifications
      </h2>
      <div className="section-rule mx-auto mb-10 max-w-[9rem]" />
      <p className="editorial-lede mx-auto max-w-2xl font-normal text-ivory/92">
        World-class equipment and acoustically designed spaces ensure your
        recordings capture every nuance with pristine clarity and character.
      </p>
    </div>
  );
}

function StudioSpecsGrid() {
  return (
    <div className="reveal reveal-delay-1 mb-20 grid grid-cols-1 divide-y divide-sand/14 border-y border-sand/14 md:grid-cols-3 md:divide-x md:divide-y-0">
      {STUDIO_SPECS.map((spec) => (
        <div key={spec.label} className="px-6 py-10 text-center md:px-10">
          <div className="eyebrow mb-4 text-sand">{spec.label}</div>
          <div className="body-text-small text-ivory/86">{spec.value}</div>
        </div>
      ))}
    </div>
  );
}

function SectionShell({ children }: { children: React.ReactNode }) {
  return (
    <section
      id="equipment-specs"
      className="relative overflow-hidden bg-forest px-6 py-28 md:py-40"
    >
      <div className="absolute inset-0 bg-texture-canvas opacity-12" />
      <div className="relative z-10 mx-auto max-w-6xl">
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
      <div className="reveal reveal-delay-2 space-y-0" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex animate-pulse items-center justify-between border-b border-sand/10 px-0 py-6 last:border-b-0"
          >
            <div className="h-4 w-48 bg-sand/10" />
            <div className="h-3 w-6 bg-sand/10" />
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

function EquipmentSpecsEmpty() {
  return (
    <div className="reveal reveal-delay-2 border-y border-sand/10 px-6 py-16 text-center">
      <p className="body-text text-ivory/82">
        Equipment list coming soon. Check back shortly — our gear inventory is
        being updated.
      </p>
    </div>
  );
}

interface EquipmentSpecsProps {
  /**
   * `undefined` → still loading (render skeleton).
   * {@link PUBLIC_CONVEX_QUERY_FAILED} → subscription failed (friendly notice).
   * `null` → no published gear payload (empty / coming soon).
   * Empty categories → published empty state ("coming soon").
   */
  readonly gear:
    | GearPayload
    | null
    | undefined
    | typeof PUBLIC_CONVEX_QUERY_FAILED;
}

export function EquipmentSpecs({ gear }: EquipmentSpecsProps) {
  if (gear === undefined) {
    return <EquipmentSpecsSkeleton />;
  }

  if (gear === PUBLIC_CONVEX_QUERY_FAILED) {
    return (
      <SectionShell>
        <div className="reveal reveal-delay-2">
          <PublicSectionNotice title="Unable to load equipment list">
            We couldn&rsquo;t load the detailed gear list. Studio specifications
            above are still accurate; try again shortly for the full inventory.
          </PublicSectionNotice>
        </div>
      </SectionShell>
    );
  }

  if (gear === null) {
    return (
      <SectionShell>
        <EquipmentSpecsEmpty />
      </SectionShell>
    );
  }

  const categories = gear.categories ?? [];

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
    () => categories.slice(0, DEFAULT_EXPANDED_COUNT).map((c) => c.stableId),
    [categories],
  );

  return (
    <div className="reveal reveal-delay-2 mx-auto max-w-4xl border-b border-sand/14">
      <Accordion multiple defaultValue={initialExpanded}>
        {categories.map((category) => (
          <AccordionItem key={category.stableId} value={category.stableId}>
            <AccordionTrigger>
              <span className="headline-secondary text-lg text-warm-white md:text-xl">
                {category.name}
              </span>
              <span className="label-text ml-auto mr-4 text-[10px] text-ivory/48">
                {String(category.items.length).padStart(2, "0")}
              </span>
            </AccordionTrigger>
            <AccordionPanel>
              <div className="grid grid-cols-1 gap-x-10 gap-y-0 md:grid-cols-2">
                {category.items.map((item) => {
                  const specsLabel = formatSpecs(item.specs);
                  return (
                    <div
                      key={item.stableId}
                      className="flex items-baseline justify-between gap-4 border-b border-sand/12 py-3 last:border-0"
                    >
                      <span className="body-text text-sm text-ivory/90">
                        {item.url ? (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline-offset-[5px] hover:text-sand hover:underline"
                          >
                            {item.name}
                          </a>
                        ) : (
                          item.name
                        )}
                      </span>
                      {specsLabel.length > 0 && (
                        <span className="body-text-small whitespace-nowrap text-xs text-ivory/68">
                          {specsLabel}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
