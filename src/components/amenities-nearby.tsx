import { AmenityCard } from "./ui/amenity-card";

const AMENITIES_DATA = [
  {
    name: "Massey's Kitchen",
    type: "Mediterranean Cuisine",
    description:
      "Elevated dining experience featuring made-from-scratch Mediterranean dishes. Authentic flavors crafted with imported ingredients and techniques learned from travels across the Mediterranean region.",
    website: "https://www.masseyskitchen.com",
  },
  {
    name: "Canopy Coffee & Wine Bar",
    type: "Coffee \u00B7 Wine \u00B7 Craft Beer",
    description:
      "Authentic Lookout Mountain experience in a casual, cozy atmosphere. Perfect community gathering spot with excellent coffee, local beer selections, and wine in a trendy yet laid-back setting.",
    website: "http://www.canopylkt.com",
  },
  {
    name: "Canyon Grill",
    type: "Fine Dining \u00B7 Fresh Seafood",
    description:
      "Relaxed fine dining featuring sustainably sourced seafood and hickory wood-grilled specialties. Simple, careful preparation highlights natural flavors with ingredients stored on ice for optimal freshness.",
    website: "https://www.canyongrill.com",
  },
  {
    name: "Mountain Escape Spa",
    type: "Spa \u00B7 Wellness \u00B7 Relaxation",
    description:
      "Full-service spa offering a range of treatments designed to rejuvenate and restore balance. Massages, facials, body treatments, and more, all designed to help guests feel relaxed and refreshed.",
    website: "https://www.mountainescapespa.com/",
  },
] as const;

export function AmenitiesNearby() {
  return (
    <section
      id="local-favorites"
      className="relative overflow-hidden bg-forest px-6 py-28 md:py-40"
    >
      <div className="absolute inset-0 bg-texture-canvas opacity-14" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="reveal mb-20 text-center">
          <p className="eyebrow mb-6 text-sand/82">Local Favorites</p>
          <h2 className="headline-primary mb-8 text-[2.25rem] text-warm-white md:text-[3rem] lg:text-[3.5rem]">
            Amenities Nearby
          </h2>
          <div className="section-rule mx-auto max-w-[9rem]" />
        </div>

        <div className="reveal reveal-delay-2 grid grid-cols-1 divide-y divide-sand/14 border-y border-sand/14 md:grid-cols-2 md:divide-x md:divide-y-0 lg:grid-cols-4 [&>*:nth-child(n+3)]:border-t [&>*:nth-child(n+3)]:border-sand/14 lg:[&>*:nth-child(n+3)]:border-t-0">
          {AMENITIES_DATA.map((amenity, index) => (
            <AmenityCard
              key={index}
              name={amenity.name}
              type={amenity.type}
              description={amenity.description}
              website={amenity.website}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
