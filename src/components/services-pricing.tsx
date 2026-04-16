import { BrandButton as Button } from "@/components/ui/brand-button";
import {
  billingCadenceLabel,
  formatPrice,
  type PricingPackage,
} from "@/lib/site-settings";

interface ServicesAndPricingProps {
  readonly packages?: PricingPackage[];
}

function sortedActivePackages(
  packages: readonly PricingPackage[] | undefined,
): PricingPackage[] {
  if (!packages || packages.length === 0) return [];
  return [...packages]
    .filter((p) => p.isActive)
    .sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.name.localeCompare(b.name);
    });
}

export function ServicesAndPricing({ packages }: ServicesAndPricingProps) {
  const rows = sortedActivePackages(packages);

  return (
    <section id="services-pricing" className="py-20 px-4 bg-sage relative">
      <div className="absolute inset-0 opacity-10 bg-texture-stone"></div>

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-washed-black mb-6 tracking-wide font-acumin">
            SERVICES &amp; RATES
          </h2>
          <p className="text-lg text-washed-black/80 font-titillium max-w-3xl mx-auto leading-relaxed">
            Transparent pricing for professional recording services. Every
            package includes our full attention to your artistic vision and
            access to our complete facility.
          </p>
        </div>

        {rows.length === 0 ? (
          <p className="text-center text-washed-black/70 font-titillium">
            Pricing is being updated — please reach out for a custom quote.
          </p>
        ) : (
          <div
            className={
              rows.length >= 3
                ? "grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
                : rows.length === 2
                  ? "grid grid-cols-1 md:grid-cols-2 gap-8 mb-16"
                  : "grid grid-cols-1 gap-8 mb-16 max-w-xl mx-auto"
            }
          >
            {rows.map((pkg) => {
              const unit = pkg.unitLabel ?? billingCadenceLabel(pkg.billingCadence);
              return (
                <div
                  key={pkg.id}
                  className={`relative bg-white/90 border-2 rounded-sm p-8 hover:shadow-lg transition-all ${
                    pkg.highlight
                      ? "border-forest scale-105 shadow-xl"
                      : "border-forest/30"
                  }`}
                >
                  {pkg.highlight && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-forest text-sand px-4 py-1 rounded-full text-sm font-acumin font-bold tracking-wide">
                        RECOMMENDED
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-washed-black mb-3 font-acumin">
                      {pkg.name}
                    </h3>
                    {pkg.description ? (
                      <p className="text-washed-black/70 font-titillium text-sm leading-relaxed">
                        {pkg.description}
                      </p>
                    ) : null}
                  </div>

                  {pkg.features && pkg.features.length > 0 ? (
                    <ul className="space-y-3 mb-8">
                      {pkg.features.map((feature, index) => (
                        <li
                          key={index}
                          className="flex items-start space-x-3"
                        >
                          <svg
                            className="w-5 h-5 text-forest mt-0.5 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-washed-black/80 font-titillium text-sm">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  <div className="border-t border-forest/20 pt-6 mb-6">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-washed-black/70 font-titillium text-sm">
                        {unit}
                      </span>
                      <span className="text-forest font-acumin font-bold text-2xl">
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
                    BOOK NOW
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <div className="text-center mt-12">
          <p className="text-washed-black/70 font-titillium mb-4">
            Need a custom package or have questions about pricing?
          </p>
          <Button
            variant="secondary"
            size="lg"
            onClick={() =>
              document
                .getElementById("artist-inquiries")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            GET CUSTOM QUOTE
          </Button>
        </div>
      </div>
    </section>
  );
}
