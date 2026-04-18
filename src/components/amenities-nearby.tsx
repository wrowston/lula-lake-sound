import { AmenityCard } from "./ui/amenity-card";

const AMENITIES_DATA = [
  {
    name: "Massey's Kitchen",
    type: "Mediterranean",
    description:
      "A made-from-scratch kitchen working from recipes and techniques brought back from years travelling the Mediterranean. Quiet room, short menu, long lunches.",
    website: "https://www.masseyskitchen.com",
  },
  {
    name: "Canopy Coffee & Wine Bar",
    type: "Coffee · Wine · Beer",
    description:
      "Community gathering place on top of Lookout Mountain. Good coffee in the morning, a thoughtful wine list and local beer after dark.",
    website: "http://www.canopylkt.com",
  },
  {
    name: "Canyon Grill",
    type: "Fine Dining · Seafood",
    description:
      "Unfussy fine dining built around sustainably-sourced seafood and hickory-grilled specialities. Everything kept on ice, cooked simply, served honestly.",
    website: "https://www.canyongrill.com",
  },
  {
    name: "Mountain Escape Spa",
    type: "Spa · Wellness",
    description:
      "A quiet full-service spa minutes from the studio — massages, facials, body treatments. A good place to end a long tracking day.",
    website: "https://www.mountainescapespa.com/",
  },
] as const;

export function AmenitiesNearby() {
  return (
    <section
      id="local-favorites"
      className="relative overflow-hidden bg-washed-black px-6 py-28 md:py-40 lg:py-48"
    >
      <div className="absolute inset-0 bg-texture-paper opacity-40" />

      <div className="relative z-10 mx-auto max-w-[80rem]">
        {/* Section header */}
        <header className="reveal mx-auto mb-20 flex w-full max-w-3xl flex-col items-center text-center md:mb-28">
          <p className="label-text mb-6 text-sand/65">03 &middot; Nearby</p>
          <h2 className="headline-primary mb-8 text-[2.25rem] text-warm-white md:text-[3rem] lg:text-[3.5rem]">
            A quiet corner of Chattanooga
          </h2>
          <div className="section-rule mb-10 w-24" />
          <p className="body-text max-w-2xl text-lg text-ivory/70">
            A short list of places we send artists to when sessions break.
            Unhurried food, good coffee, and somewhere to put your shoulders
            down.
          </p>
        </header>

        <div className="reveal reveal-delay-2 grid grid-cols-1 gap-px bg-sand/10 md:grid-cols-2">
          {AMENITIES_DATA.map((amenity, index) => (
            <div key={amenity.name} className="bg-washed-black">
              <AmenityCard
                index={index}
                name={amenity.name}
                type={amenity.type}
                description={amenity.description}
                website={amenity.website}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
