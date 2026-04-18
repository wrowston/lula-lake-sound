import { Button } from "@/components/ui/button";
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
    <header className="reveal mx-auto mb-20 flex w-full max-w-3xl flex-col items-center text-center md:mb-28">
      <p className="label-text mb-6 text-sand/65">05 · Rates</p>
      <h2 className="headline-primary mb-8 text-[2.25rem] text-warm-white md:text-[3rem] lg:text-[3.5rem]">
        Honest, transparent pricing
      </h2>
      <div className="section-rule mb-10 w-24" />
      <p className="body-text max-w-2xl text-lg text-ivory/70">
        We keep the pricing simple and let the work speak for itself. Every
        day includes full use of the facility, our engineering attention, and
        the time needed to do things right.
      </p>
    </header>
  );
}

function sectionClassName() {
  return "relative overflow-hidden bg-washed-black px-6 py-28 md:py-40 lg:py-48";
}

export function ServicesAndPricingSkeleton() {
  return (
    <section id="services-pricing" className={sectionClassName()}>
      <div className="absolute inset-0 bg-texture-stone opacity-30" />

      <div className="relative z-10 mx-auto max-w-[72rem]">
        <SectionHeader />

        <div className="grid animate-pulse grid-cols-1 gap-px bg-sand/10 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex flex-col gap-6 bg-washed-black px-6 py-12 md:px-10 md:py-16"
            >
              <div className="h-6 w-1/2 bg-sand/10" />
              <div className="h-3 w-4/5 bg-sand/10" />
              <div className="mt-6 space-y-3">
                {[0, 1, 2].map((j) => (
                  <div key={j} className="h-3 bg-sand/10" />
                ))}
              </div>
              <div className="mt-auto h-9 bg-sand/10" />
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
    <section id="services-pricing" className={sectionClassName()}>
      <div className="absolute inset-0 bg-texture-stone opacity-30" />

      <div className="relative z-10 mx-auto max-w-[72rem]">
        <SectionHeader />

        {rows.length === 0 ? (
          <p className="body-text mx-auto max-w-md text-center text-ivory/60">
            Rates are being refreshed — please reach out for a current quote.
          </p>
        ) : (
          <div
            className={
              "reveal reveal-delay-2 grid gap-px bg-sand/10 " +
              (rows.length >= 3
                ? "grid-cols-1 md:grid-cols-3"
                : rows.length === 2
                  ? "grid-cols-1 md:grid-cols-2"
                  : "mx-auto max-w-xl grid-cols-1")
            }
          >
            {rows.map((pkg, index) => {
              const unit =
                pkg.unitLabel ?? billingCadenceLabel(pkg.billingCadence);
              const cardIndex = String(index + 1).padStart(2, "0");
              return (
                <article
                  key={pkg.id}
                  className={
                    "relative flex h-full flex-col gap-8 px-6 py-12 transition-colors duration-500 md:px-10 md:py-16 " +
                    (pkg.highlight
                      ? "bg-washed-black/90"
                      : "bg-washed-black")
                  }
                >
                  {pkg.highlight ? (
                    <span className="label-text absolute left-6 top-6 text-gold md:left-10 md:top-10">
                      Recommended
                    </span>
                  ) : (
                    <span className="label-text absolute left-6 top-6 text-sand/45 md:left-10 md:top-10">
                      {cardIndex}
                    </span>
                  )}

                  <div className="pt-12">
                    <h3 className="headline-secondary mb-5 text-2xl text-ivory/95 md:text-[1.75rem]">
                      {pkg.name}
                    </h3>
                    {pkg.description ? (
                      <p className="body-text-small max-w-xs text-ivory/60">
                        {pkg.description}
                      </p>
                    ) : null}
                  </div>

                  {pkg.features && pkg.features.length > 0 ? (
                    <ul className="space-y-3 border-t border-sand/10 pt-6">
                      {pkg.features.map((feature, featureIndex) => (
                        <li
                          key={`${pkg.id}-f-${featureIndex}`}
                          className="flex items-start gap-3"
                        >
                          <span className="mt-[0.55rem] h-px w-4 flex-shrink-0 bg-sand/40" />
                          <span className="body-text-small text-ivory/70">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  <div className="mt-auto flex items-baseline justify-between gap-4 border-t border-sand/10 pt-6">
                    <span className="label-text text-ivory/45">{unit}</span>
                    <span className="headline-secondary text-3xl text-sand">
                      {formatPrice(pkg.priceCents, pkg.currency)}
                    </span>
                  </div>

                  <Button
                    variant={pkg.highlight ? "default" : "outline"}
                    className="h-11 w-full"
                    onClick={() =>
                      document
                        .getElementById("artist-inquiries")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                  >
                    Book this
                  </Button>
                </article>
              );
            })}
          </div>
        )}

        <div className="reveal reveal-delay-3 mt-24 border-t border-sand/10 pt-16 text-center">
          <h3 className="headline-secondary mb-4 text-2xl text-warm-white md:text-3xl">
            Something else in mind?
          </h3>
          <p className="body-text mx-auto mb-10 max-w-xl text-ivory/60">
            Longer runs, mixing on a retainer, a writing week — we quote
            custom projects every month. Tell us what you&rsquo;re thinking
            about and we&rsquo;ll put something together.
          </p>
          <Button
            variant="outline"
            size="lg"
            className="h-11 px-7"
            onClick={() =>
              document
                .getElementById("artist-inquiries")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Request a custom quote
          </Button>
        </div>
      </div>
    </section>
  );
}
