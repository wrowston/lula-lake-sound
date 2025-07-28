// Equipment categories and specifications
const EQUIPMENT_CATEGORIES = [
  {
    category: "Recording & Mixing Console",
    items: [
      { name: "SSL 4000 Series Console", specs: "32-channel analog mixing desk" },
      { name: "Pro Tools HDX System", specs: "Industry-standard DAW with high-end converters" },
      { name: "Universal Audio Apollo", specs: "Premium audio interface and processing" }
    ]
  },
  {
    category: "Microphones",
    items: [
      { name: "Neumann U87", specs: "Classic large-diaphragm condenser" },
      { name: "AKG C414", specs: "Versatile multi-pattern condenser" },
      { name: "Shure SM57 & SM58", specs: "Industry-standard dynamic mics" },
      { name: "Royer R-121", specs: "Premium ribbon microphone" }
    ]
  },
  {
    category: "Outboard Gear",
    items: [
      { name: "1176 Compressors", specs: "Classic FET limiting amplifiers" },
      { name: "LA-2A Leveling Amplifier", specs: "Vintage tube/optical compressor" },
      { name: "Pultec EQP-1A", specs: "Legendary tube equalizer" },
      { name: "Lexicon 224 Digital Reverb", specs: "Classic digital reverb unit" }
    ]
  },
  {
    category: "Instruments & Amplifiers",
    items: [
      { name: "Steinway Model B Grand Piano", specs: "7-foot concert grand piano" },
      { name: "Vintage Fender Amplifiers", specs: "Twin Reverb, Deluxe Reverb, Bassman" },
      { name: "Marshall Plexi Stack", specs: "Classic rock amplification" },
      { name: "Hammond B3 Organ", specs: "With Leslie 122 rotating speaker" }
    ]
  }
] as const;

const STUDIO_SPECS = [
  { label: "Live Room Size", value: "20' x 24' x 12' ceiling" },
  { label: "Control Room", value: "16' x 20' with custom monitoring" },
  { label: "Isolation Booths", value: "2 separate vocal/instrument booths" },
  { label: "Acoustic Treatment", value: "Custom-designed for optimal sound" },
  { label: "Monitoring", value: "Genelec 1032A main monitors" },
  { label: "Headphone System", value: "16-channel Aviom personal mixing" }
] as const;

export function EquipmentSpecs() {
  return (
    <section id="equipment-specs" className="py-20 px-4 bg-washed-black relative">
      <div className="absolute inset-0 opacity-20 bg-texture-stone"></div>
      
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="headline-primary text-3xl md:text-4xl text-sand mb-6">
            Studio Specifications
          </h2>
          <p className="body-text text-lg text-ivory/80 max-w-3xl mx-auto">
            World-class equipment and acoustically designed spaces ensure your recordings capture every nuance of your performance with pristine clarity and character.
          </p>
        </div>

        {/* Studio Room Specifications */}
        <div className="bg-forest/20 border border-sage/30 rounded-sm p-8 mb-12">
          <h3 className="headline-secondary text-2xl text-sand mb-8 text-center">Studio Rooms & Acoustics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {STUDIO_SPECS.map((spec, index) => (
              <div key={index} className="text-center p-4 bg-washed-black/40 border border-sage/20 rounded-sm">
                <div className="headline-secondary text-sand text-lg mb-2">{spec.label}</div>
                <div className="body-text-small text-ivory/70">{spec.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Equipment Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {EQUIPMENT_CATEGORIES.map((category, categoryIndex) => (
            <div key={categoryIndex} className="bg-forest/20 border border-sage/30 rounded-sm p-6">
              <h3 className="headline-secondary text-xl text-sand mb-6 border-b border-sage/30 pb-3">
                {category.category}
              </h3>
              <div className="space-y-4">
                {category.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="border-l-2 border-sand/40 pl-4">
                    <div className="body-text text-ivory mb-1">{item.name}</div>
                    <div className="body-text-small text-ivory/60">{item.specs}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Technical Highlights */}
        <div className="mt-12 text-center">
          <div className="bg-sage/10 border border-sage/30 rounded-sm p-8">
            <h3 className="headline-secondary text-2xl text-sand mb-6">Technical Highlights</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-sand/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-sand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <h4 className="headline-secondary text-sand mb-2">Analog Warmth</h4>
                <p className="body-text-small text-ivory/70">Classic analog signal path with vintage outboard gear for that unmistakable warmth</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-sand/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-sand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <h4 className="headline-secondary text-sand mb-2">Pristine Acoustics</h4>
                <p className="body-text-small text-ivory/70">Custom-designed rooms with optimal reflection and absorption characteristics</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-sand/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-sand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="headline-secondary text-sand mb-2">Digital Precision</h4>
                <p className="body-text-small text-ivory/70">State-of-the-art digital conversion and processing for maximum flexibility</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 