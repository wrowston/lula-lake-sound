// Equipment categories and specifications
const EQUIPMENT_CATEGORIES = [
  {
    category: "Interfaces & Console",
    items: [
      { name: "2x Universal Audio Apollo x16 Interfaces", specs: "32 channels of I/O" },
      { name: "API 2448 Console", specs: "With 16x API 560 EQs and 8x API 550B EQs" }
    ]
  },
  {
    category: "Preamps & Channel Strips",
    items: [
      { name: "Neve 1073OPX", specs: "8-Channel Mic Preamp" },
      { name: "AEA RPQ3", specs: "2-Channel Low Noise Preamp with EQ (great for ribbons)" },
      { name: "Tree Audio Branch", specs: "All-Tube Channel Strip (Preamp, EQ, Limiter)" },
      { name: "2x Avalon Channel Strips", specs: "Tube Preamp, Compressor & EQ" }
    ]
  },
  {
    category: "Compressors & Dynamics",
    items: [
      { name: "2x Empirical Labs Distressor", specs: "Versatile dynamic processor" },
      { name: "2x Urei 1176LN", specs: "Classic FET limiting amplifiers" },
      { name: "2x Purple Audio MC77", specs: "1176-style compressors" },
      { name: "2x DBX 165", specs: "Over-easy compressor/limiter" },
      { name: "Retro STA-Level Compressor", specs: "Vintage-style optical compressor" },
      { name: "Manley Vari-Mu Stereo Compressor/Limiter", specs: "Tube-based stereo dynamics" },
      { name: "Unfairchild 670 Stereo Compressor", specs: "Fairchild 670 recreation" },
      { name: "Grandchild 670 Stereo Compressor", specs: "Another Fairchild 670 variant" },
      { name: "SSL G-Bus Stereo Compressor", specs: "SSL console-style bus compressor" },
      { name: "Custom SSL Talkback-Style Limiter", specs: "Custom SSL-inspired limiter" },
      { name: "2x LevelOr Limiter/DI/Distortion Units", specs: "Multi-function dynamic processors" }
    ]
  },
  {
    category: "EQs",
    items: [
      { name: "2x Heritage Audio 1073 EQ", specs: "Neve 1073-style equalizers" },
      { name: "2x Helios 5011 EQ", specs: "Vintage console-style EQs" },
      { name: "Chandler Limited Curve Bender", specs: "Stereo Mastering EQ" }
    ]
  },
  {
    category: "Tape & Saturation",
    items: [
      { name: "2x Neve Portico 542 Tape Emulators", specs: "Analog tape machine emulation" },
      { name: "Thermionic Culture Vulture", specs: "All-Valve Distortion/Saturation Unit" }
    ]
  },
  {
    category: "Reverb & Effects",
    items: [
      { name: "AMS RMX16 Digital Reverb", specs: "Classic 80s digital reverb" },
      { name: "Bricasti M7 Digital Reverb", specs: "High-end convolution reverb" }
    ]
  },
  {
    category: "Plugins",
    items: [
      { name: "Universal Audio Suite", specs: "Complete UAD plugin collection" },
      { name: "FabFilter Suite", specs: "Professional mixing and mastering plugins" },
      { name: "Eventide Suite", specs: "Classic effects and processors" },
      { name: "Waves Suite", specs: "Industry-standard plugin collection" },
      { name: "SSL Suite", specs: "SSL console emulations" },
      { name: "Soundtoys Suite", specs: "Creative effects and processors" },
      { name: "Valhalla Collection", specs: "Plate, Vintage Verb, Delay" },
      { name: "Additional Plugins", specs: "PSP Vintage Warmer, Sonnox Oxford Limiter, and many more" }
    ]
  },
  {
    category: "Dynamic Microphones",
    items: [
      { name: "3x Shure SM57", specs: "Industry-standard dynamic microphones" },
      { name: "4x Shure SM58", specs: "Classic vocal dynamic microphones" },
      { name: "Shure Beta52A", specs: "Kick drum dynamic microphone" },
      { name: "Shure SM7B", specs: "Broadcast-quality dynamic microphone" },
      { name: "AKG D112", specs: "Large-diaphragm dynamic for bass" },
      { name: "Audix D6", specs: "Modern kick drum microphone" },
      { name: "4x Sennheiser e906", specs: "Guitar amp dynamic microphones" },
      { name: "4x Sennheiser MD421", specs: "Versatile dynamic microphones" },
      { name: "Electro-Voice 635A", specs: "Classic broadcast dynamic" },
      { name: "2x Electro-Voice RE16", specs: "Variable-D dynamic microphones" },
      { name: "Dr. Alien Smith DirtMic01", specs: "Specialty dynamic microphone" },
      { name: "Dr. Alien Smith Alien8", specs: "Unique character dynamic mic" }
    ]
  },
  {
    category: "Condenser Microphones",
    items: [
      { name: "2x Shure SM81", specs: "Small-diaphragm condenser" },
      { name: "2x Audio-Technica AT4060A", specs: "Large-diaphragm tube condenser" },
      { name: "4x Audio-Technica AT4021", specs: "Small-diaphragm condenser" },
      { name: "2x Audio-Technica AT4047", specs: "Multi-pattern tube condenser" },
      { name: "4x Audio-Technica ATM450", specs: "Side-address condenser" },
      { name: "2x Neumann U67", specs: "Classic large-diaphragm tube condenser" },
      { name: "Neumann M49", specs: "Vintage large-diaphragm tube condenser" },
      { name: "Neumann U47", specs: "Legendary large-diaphragm tube condenser" },
      { name: "Neumann KM86", specs: "Small-diaphragm tube condenser" },
      { name: "Soyuz 017 FET", specs: "Modern large-diaphragm FET condenser" },
      { name: "2x Soyuz 013 FET", specs: "Small-diaphragm FET condenser" },
      { name: "Dachmann Audio 47 FET", specs: "U47-inspired FET condenser" }
    ]
  },
  {
    category: "Ribbon Microphones",
    items: [
      { name: "2x Audio-Technica AT4081", specs: "Active ribbon microphone" },
      { name: "2x Audio-Technica AT4080", specs: "Passive ribbon microphone" },
      { name: "2x AEA R84", specs: "Classic ribbon microphone" },
      { name: "AEA R88", specs: "Stereo ribbon microphone" },
      { name: "AEA R44", specs: "Large vintage-style ribbon" },
      { name: "3x AEA KU5A", specs: "Active ribbon microphone" },
      { name: "2x Coles 4038", specs: "BBC-style ribbon microphone" },
      { name: "3x Royer R-10", specs: "Compact ribbon microphone" },
      { name: "Royer R-121", specs: "Premium ribbon microphone" }
    ]
  },
  {
    category: "Drum Kits & Percussion",
    items: [
      { name: "DW Drum Kit", specs: "2x Floor Toms, 1x Rack Tom, Crash & Ride Cymbals" },
      { name: "Vintage 1960s Rogers Jazz Kit", specs: "Classic vintage drum kit" },
      { name: "1920s Ludwig Steel Snare", specs: "Vintage steel snare drum" },
      { name: "2x DW Snares", specs: "Professional snare drums" }
    ]
  },
  {
    category: "Guitars & Basses",
    items: [
      { name: "1990s Fender Stratocaster", specs: "Pro Series electric guitar" },
      { name: "Custom Hamer Partscaster Tele", specs: "Custom Telecaster-style guitar" },
      { name: "1978 Gibson 335 with Bigsby", specs: "Semi-hollow electric guitar" },
      { name: "2013 Gibson Les Paul Goldtop", specs: "'57 Reissue electric guitar" },
      { name: "1958 Gibson J-50 Acoustic", specs: "Vintage acoustic guitar" },
      { name: "1971 Martin D-28", specs: "Classic dreadnought acoustic" },
      { name: "2005 Martin HD-28", specs: "Herringbone dreadnought acoustic" },
      { name: "1970s Gibson LG-1", specs: "Small-body acoustic guitar" },
      { name: "Ernie Ball Music Man Bass", specs: "Electric bass guitar" }
    ]
  },
  {
    category: "Amplifiers",
    items: [
      { name: "Vox AC15", specs: "15-watt tube amplifier" },
      { name: "Vox AC4", specs: "4-watt tube amplifier" },
      { name: "Fender Princeton 15w", specs: "15-watt tube amplifier" },
      { name: "Fender Princeton 10w", specs: "10-watt tube amplifier" },
      { name: "Fender Blues Jr. Tweed 15w", specs: "15-watt tube amplifier" },
      { name: "Fender Champ", specs: "'57 Reissue, 5-watt tube amp" },
      { name: "Mesa/Boogie Mark IV Combo", specs: "High-gain tube amplifier" },
      { name: "Swart 5w Boutique Tube Amp", specs: "Boutique 5-watt tube amplifier" },
      { name: "Bitar Boutique Amplifier", specs: "25-watt boutique tube amp" },
      { name: "Ampeg Micro SVT", specs: "With matching cabinet for bass" }
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