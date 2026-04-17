import { BrandButton as Button } from "@/components/ui/brand-button";
import {
  billingCadenceLabel,
  formatPrice,
  type PricingPackage,
} from "@/lib/site-settings";

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
    <div className="text-center mb-16 reveal">
      <p className="label-text text-sand/60 mb-4">Rates</p>
      <h2 className="headline-primary text-3xl md:text-4xl lg:text-5xl text-warm-white mb-6">
        Services &amp; Pricing
      </h2>
      <div className="section-rule max-w-xs mx-auto mb-8" />
      <p className="body-text text-lg text-ivory/60 max-w-2xl mx-auto">
        Transparent pricing for professional recording services. Every package
        includes our full attention to your artistic vision and access to our
        complete facility.
      </p>
    </div>
  );
}

export function ServicesAndPricingSkeleton() {
  return (
    <section
      id="services-pricing"
      className="py-24 md:py-32 px-6 bg-washed-black relative"
    >
      <div className="absolute inset-0 opacity-20 bg-texture-stone" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <SectionHeader />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="relative flex flex-col p-8 border border-sand/8 bg-washed-black/40 animate-pulse"
            >
              <div className="mb-6">
                <div className="h-6 w-1/2 bg-sand/10 mb-3" />
                <div className="h-4 bg-sand/10 mb-2" />
                <div className="h-4 w-4/5 bg-sand/10" />
              </div>
              <div className="space-y-3 mb-8">
                {[0, 1, 2].map((j) => (
                  <div key={j} className="h-3 bg-sand/10" />
                ))}
              </div>
              <div className="mt-auto border-t border-sand/10 pt-6 mb-6">
                <div className="h-8 bg-sand/10" />
              </div>
              <div className="h-11 bg-sand/10" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ServicesAndPricing({ packages }: ServicesAndPricingProps) {
  const rows = sortedActivePackages(packages);

  return (
    <section
      id="services-pricing"
      className="py-24 md:py-32 px-6 bg-washed-black relative"
    >
      <div className="absolute inset-0 opacity-20 bg-texture-stone" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <SectionHeader />

        {rows.length === 0 ? (
          <p className="text-center body-text text-ivory/50">
            Pricing is being updated &mdash; please reach out for a custom
            quote.
          </p>
        ) : (
          <div
            className={
              rows.length >= 3
                ? "grid grid-cols-1 md:grid-cols-3 gap-6 reveal reveal-delay-2"
                : rows.length === 2
                  ? "grid grid-cols-1 md:grid-cols-2 gap-6 reveal reveal-delay-2"
                  : "grid grid-cols-1 gap-6 max-w-xl mx-auto reveal reveal-delay-2"
            }
          >
            {rows.map((pkg) => {
              const unit =
                pkg.unitLabel ?? billingCadenceLabel(pkg.billingCadence);
              return (
                <div
                  key={pkg.id}
                  className={`relative flex flex-col p-8 border transition-all duration-500 ${
                    pkg.highlight
                      ? "bg-washed-black/60 border-sand/30 hover:border-sand/50"
                      : "bg-washed-black/40 border-sand/8 hover:border-sand/20"
                  }`}
                >
                  {pkg.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="label-text bg-sand text-washed-black px-3 py-1 text-[10px]">
                        Recommended
                      </span>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="headline-secondary text-sand text-xl mb-3">
                      {pkg.name}
                    </h3>
                    {pkg.description ? (
                      <p className="body-text-small text-ivory/50 leading-relaxed">
                        {pkg.description}
                      </p>
                    ) : null}
                  </div>

                  {pkg.features && pkg.features.length > 0 ? (
                    <ul className="space-y-3 mb-8">
                      {pkg.features.map((feature, index) => (
                        <li
                          key={`${pkg.id}-f-${index}`}
                          className="flex items-start gap-3"
                        >
                          <svg
                            className="w-4 h-4 text-sand/60 mt-0.5 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span className="body-text-small text-ivory/70">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  <div className="mt-auto border-t border-sand/10 pt-6 mb-6">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="label-text text-ivory/40">{unit}</span>
                      <span className="headline-secondary text-sand text-2xl">
                        {formatPrice(pkg.priceCents, pkg.currency)}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant={pkg.highlight ? "primary" : "outline"}
                    className="w-full"
                    onClick={() =>
                      document
                        .getElementById("artist-inquiries")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                  >
                    Book Your Session
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <div className="text-center mt-16 reveal reveal-delay-3 pt-12 border-t border-sand/10">
          <h3 className="headline-secondary text-2xl text-sand mb-4">
            Need Something Different?
          </h3>
          <p className="body-text text-ivory/50 mb-8 max-w-xl mx-auto">
            Have questions about pricing or need a custom package tailored to
            your project? We&apos;re happy to design something that fits your
            vision and timeline.
          </p>
          <Button
            variant="outline"
            size="lg"
            onClick={() =>
              document
                .getElementById("artist-inquiries")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Get Custom Quote
          </Button>
        </div>
      </div>
    </section>
  );
}
