"use client";

import posthog from "posthog-js";
import { Button } from "@/components/ui/button";
import { POSTHOG_EVENTS } from "@/lib/analytics-events";
import {
  billingCadenceLabel,
  formatPrice,
  type PricingPackage,
} from "@/lib/site-settings";
import { cn } from "@/lib/utils";

interface ServicesAndPricingProps {
  readonly packages: readonly PricingPackage[];
}

function sortedActivePackages(
  packages: readonly PricingPackage[],
): PricingPackage[] {
  if (packages.length === 0) return [];
  return [...packages]
    .filter((p) => p.isActive)
    .sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.name.localeCompare(b.name);
    });
}

function SectionHeader() {
  return (
    <div className="reveal mb-20 text-center">
      <p className="eyebrow mb-6 text-sand/60">Rates</p>
      <h2 className="headline-primary mb-8 text-[2.25rem] text-warm-white md:text-[3rem] lg:text-[3.5rem]">
        Services &amp; Pricing
      </h2>
      <div className="section-rule mx-auto mb-10 max-w-[9rem]" />
      <p className="editorial-lede mx-auto max-w-2xl">
        Transparent pricing for professional recording services. Every package
        includes our full attention to your artistic vision and access to our
        complete facility.
      </p>
    </div>
  );
}

function SectionShell({ children }: { children: React.ReactNode }) {
  return (
    <section
      id="services-pricing"
      className="relative overflow-hidden bg-washed-black px-6 py-28 md:py-40"
    >
      {/* News-pulp ink-wash ground — echoes the brand guide's "Sunset Ink
       * Wash" treatment (§5.1) without competing with the pricing table. */}
      <div className="absolute inset-0 bg-texture-ink-wash opacity-55" />
      <div className="absolute inset-0 bg-texture-stone opacity-20" />
      <div className="relative z-10 mx-auto max-w-6xl">
        <SectionHeader />
        {children}
      </div>
    </section>
  );
}

export function ServicesAndPricingSkeleton() {
  return (
    <SectionShell>
      <div className="grid grid-cols-1 border-y border-sand/10 md:grid-cols-3 md:divide-x md:divide-sand/10">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex animate-pulse flex-col gap-6 p-10"
          >
            <div className="h-6 w-1/2 bg-sand/10" />
            <div className="h-4 bg-sand/10" />
            <div className="h-4 w-4/5 bg-sand/10" />
            <div className="h-px w-full bg-sand/10" />
            <div className="h-8 w-3/4 bg-sand/10" />
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

export function ServicesAndPricing({ packages }: ServicesAndPricingProps) {
  const rows = sortedActivePackages(packages);

  return (
    <SectionShell>
      {rows.length === 0 ? (
        <p className="body-text text-center text-ivory/55">
          Pricing is being updated &mdash; please reach out for a custom quote.
        </p>
      ) : (
        <div
          className={cn(
            "reveal reveal-delay-2 grid grid-cols-1 border-y border-sand/10",
            rows.length >= 3
              ? "md:grid-cols-3 md:divide-x md:divide-sand/10"
              : rows.length === 2
                ? "mx-auto max-w-4xl md:grid-cols-2 md:divide-x md:divide-sand/10"
                : "mx-auto max-w-xl",
          )}
        >
          {rows.map((pkg) => {
            const unit =
              pkg.unitLabel ?? billingCadenceLabel(pkg.billingCadence);
            return (
              <div
                key={pkg.id}
                className={cn(
                  "relative flex flex-col gap-8 p-10 md:p-12",
                  pkg.highlight && "bg-sand/[0.025]",
                )}
              >
                {pkg.highlight && (
                  <span className="eyebrow absolute left-10 top-10 text-gold">
                    · Recommended
                  </span>
                )}

                <div className={pkg.highlight ? "pt-6" : ""}>
                  <h3 className="headline-secondary mb-4 text-[1.375rem] text-sand">
                    {pkg.name}
                  </h3>
                  <div className="h-px w-10 bg-sand/40" />
                  {pkg.description ? (
                    <p className="body-text-small mt-5 leading-relaxed text-ivory/55">
                      {pkg.description}
                    </p>
                  ) : null}
                </div>

                {pkg.features && pkg.features.length > 0 ? (
                  <ul className="space-y-3">
                    {pkg.features.map((feature, index) => (
                      <li
                        key={`${pkg.id}-f-${index}`}
                        className="flex items-baseline gap-3"
                      >
                        <span
                          aria-hidden
                          className="mt-2 size-1 shrink-0 bg-sand/70"
                        />
                        <span className="body-text-small text-ivory/70">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                <div className="mt-auto space-y-6">
                  <div className="flex items-baseline justify-between gap-2 border-t border-sand/12 pt-6">
                    <span className="label-text text-ivory/40">{unit}</span>
                    <span className="headline-secondary text-2xl text-sand md:text-[1.625rem]">
                      {formatPrice(pkg.priceCents, pkg.currency)}
                    </span>
                  </div>

                  <Button
                    variant={pkg.highlight ? "accent-gold" : "outline"}
                    size="lg"
                    className="w-full"
                    onClick={() => {
                      posthog.capture(
                        POSTHOG_EVENTS.PRICING_BOOK_SESSION_CLICK,
                        {
                          location: "services-pricing",
                          package_name: pkg.name,
                          price_cents: pkg.priceCents,
                          highlighted: pkg.highlight,
                        },
                      );
                      document
                        .getElementById("artist-inquiries")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    Book Your Session
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="reveal reveal-delay-3 mt-24 border-t border-sand/10 pt-16 text-center">
        <p className="eyebrow mb-5 text-sand/55">Custom</p>
        <h3 className="headline-secondary mb-6 text-2xl text-sand md:text-[1.75rem]">
          Need Something Different?
        </h3>
        <p className="body-text mx-auto mb-10 max-w-xl text-ivory/55">
          Have questions about pricing or need a custom package tailored to
          your project? We&apos;re happy to design something that fits your
          vision and timeline.
        </p>
        <Button
          variant="ghost"
          size="lg"
          onClick={() => {
            posthog.capture("pricing_custom_quote_clicked");
            document
              .getElementById("artist-inquiries")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          Get Custom Quote
        </Button>
      </div>
    </SectionShell>
  );
}
