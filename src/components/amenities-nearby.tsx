import { AmenityCard } from "./ui/amenity-card";

// Static content - amenities data
const AMENITIES_DATA = [
  {
    name: "Massey's Kitchen",
    type: "MEDITERRANEAN CUISINE",
    description: "Elevated dining experience featuring made-from-scratch Mediterranean dishes. Authentic flavors crafted with imported ingredients and techniques learned from travels across the Mediterranean region.",
    website: "https://www.masseyskitchen.com"
  },
  {
    name: "Canopy Coffee & Wine Bar",
    type: "COFFEE • WINE • CRAFT BEER",
    description: "Authentic Lookout Mountain experience in a casual, cozy atmosphere. Perfect community gathering spot with excellent coffee, local beer selections, and wine in a trendy yet laid-back setting.",
    website: "http://www.canopylkt.com"
  },
  {
    name: "Canyon Grill",
    type: "FINE DINING • FRESH SEAFOOD",
    description: "Relaxed fine dining featuring sustainably sourced seafood and hickory wood-grilled specialties. Simple, careful preparation highlights natural flavors with ingredients stored on ice for optimal freshness.",
    website: "https://www.canyongrill.com"
  },
  {
    name: "Mountain Escape Spa",
    type: "SPA • WELLNESS • RELAXATION",
    description: "Mountain Escape Spa is a full-service spa offering a range of treatments designed to rejuvenate and restore balance. Their services include massages, facials, body treatments, and more, all designed to help guests feel relaxed and refreshed.",
    website: "https://www.mountainescapespa.com/"
  }
] as const;

export function AmenitiesNearby() {
  return (
    <section id="local-favorites" className="py-20 px-4 bg-forest relative">
      <div className="absolute inset-0 opacity-20 bg-texture-stone"></div>
      
      <div className="relative z-10 max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-sand mb-16 text-center tracking-wide font-acumin">
          AMENITIES NEARBY
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
