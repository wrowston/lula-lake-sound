"use client";

import Image from "next/image";
import { useMemo } from "react";

import { MotionReveal, MotionRevealGroup } from "@/components/motion-reveal";
import { StickySection } from "@/components/sticky-section";
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

function StickyAside() {
  return (
    <div className="space-y-8">
      <MotionReveal variant="fade" duration={0.7}>
        <Image
          src="/Logos/Graphic/LLS_Logo_Graphic_Sand.png"
          alt=""
          width={200}
          height={200}
          aria-hidden
          className="h-12 w-auto opacity-80 md:h-14"
        />
      </MotionReveal>
      <MotionReveal variant="rise" delay={0.05}>
        <p className="eyebrow text-sand/82">Equipment</p>
      </MotionReveal>
      <MotionReveal variant="rise-blur" duration={1.1} delay={0.12}>
        <h2 className="headline-primary text-[2.25rem] text-warm-white md:text-[3rem] lg:text-[3.5rem]">
          Studio
          <br />
          Specifications
        </h2>
      </MotionReveal>
      <MotionReveal variant="rule" duration={1.1} delay={0.32}>
        <span className="block h-px w-24 bg-sand/45" />
      </MotionReveal>
      <MotionReveal variant="rise" duration={0.95} delay={0.42}>
        <p className="editorial-lede max-w-md text-ivory/86">
          World-class equipment and acoustically designed spaces ensure your
          recordings capture every nuance with pristine clarity and
          character.
        </p>
      </MotionReveal>
    </div>
  );
}

function StudioSpecsList() {
  return (
    <MotionRevealGroup
      as="ul"
      stagger={0.12}
      delay={0.05}
      className="divide-y divide-sand/14 border-y border-sand/14"
    >
      {STUDIO_SPECS.map((spec) => (
        <MotionReveal
          key={spec.label}
          inheritFromParent
          as="li"
          variant="rise-blur"
          duration={0.95}
          className="flex flex-col gap-2 px-2 py-8 md:flex-row md:items-baseline md:justify-between md:gap-10"
        >
          <span className="eyebrow text-sand md:w-44 md:shrink-0">
            {spec.label}
          </span>
          <span className="body-text text-ivory/86 md:flex-1 md:text-right">
            {spec.value}
          </span>
        </MotionReveal>
      ))}
    </MotionRevealGroup>
  );
}

function SectionShell({ children }: { children: React.ReactNode }) {
  return (
    <StickySection
      id="equipment-specs"
      sectionClassName="bg-forest"
      background={
        <>
          <div className="absolute inset-0 bg-texture-canvas opacity-12" />
          <div aria-hidden className="section-fade-bottom" />
        </>
      }
      aside={<StickyAside />}
    >
      <div className="space-y-16">
        <StudioSpecsList />
        {children}
      </div>
    </StickySection>
  );
}

export function EquipmentSpecsSkeleton() {
  return (
    <SectionShell>
      <div className="space-y-0" aria-hidden>
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
    <MotionReveal
      variant="rise"
      className="border-y border-sand/10 px-6 py-16 text-center"
    >
      <p className="body-text text-ivory/82">
        Equipment list coming soon. Check back shortly — our gear inventory is
        being updated.
      </p>
    </MotionReveal>
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
        <MotionReveal variant="rise">
          <PublicSectionNotice title="Unable to load equipment list">
            We couldn&rsquo;t load the detailed gear list. Studio specifications
            above are still accurate; try again shortly for the full inventory.
          </PublicSectionNotice>
        </MotionReveal>
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
    <MotionRevealGroup stagger={0.08} className="border-b border-sand/14">
      <Accordion multiple defaultValue={initialExpanded}>
        {categories.map((category) => (
          <MotionReveal
            key={category.stableId}
            inheritFromParent
            variant="rise-blur"
            duration={0.9}
          >
            <AccordionItem value={category.stableId}>
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
          </MotionReveal>
        ))}
      </Accordion>
    </MotionRevealGroup>
  );
}
