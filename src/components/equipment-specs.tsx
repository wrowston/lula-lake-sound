// Type definition for equipment items
type EquipmentItem = {
  name: string;
  specs?: string;
};

type EquipmentCategory = {
  category: string;
  items: EquipmentItem[];
};

// Equipment categories and specifications
const EQUIPMENT_CATEGORIES: EquipmentCategory[] = [
  {
    category: "Interfaces & Console",
    items: [
      { name: "API 2448 Console", specs: "With 16x API 560 EQs and 8x API 550B EQs"},
      { name: "2x Universal Audio Apollo x16 Interfaces"},
      { name: "Pro Tools Ultimate"}
    ]
  },
  {
    category: "Preamps & Channel Strips",
    items: [
      { name: "Neve 1073OPX"},
      { name: "AEA RPQ3"},
      { name: "Tree Audio Branch"},
      { name: "2x Avalon Channel Strips"},
      { name: "2x Sunset Sound “Tutti” Mic/Instrument Pre" }
    ]
  },
  {
    category: "Compressors & Dynamics",
    items: [
      { name: "2x Empirical Labs Distressor"},
      { name: "2x Urei 1176LN"},
      { name: "2x Purple Audio MC77"},
      { name: "2x DBX 165"},
      { name: "Retro STA-Level Compressor"},
      { name: "Manley Vari-Mu Stereo Compressor/Limiter"},
      { name: "Unfairchild 670 Stereo Compressor"},
      { name: "Grandchild 670 Stereo Compressor"},
      { name: "SSL G-Bus Stereo Compressor"},
      { name: "Custom SSL Talkback-Style Limiter"},
      { name: "2x LevelOr Limiter/DI/Distortion Units"}
    ]
  },
  {
    category: "EQs",
    items: [
      { name: "2x Heritage Audio 1073 EQ"},
      { name: "2x Helios 5011 EQ"},
      { name: "Chandler Limited Curve Bender"}
    ]
  },
  {
    category: "Tape & Saturation",
    items: [
      { name: "2x Neve Portico 542 Tape Emulators"},
      { name: "Thermionic Culture Vulture"}
    ]
  },
  {
    category: "Reverb & Effects",
    items: [
      { name: "AMS RMX16 Digital Reverb"},
      { name: "Bricasti M7 Digital Reverb"}
    ]
  },
  {
    category: "Plugins",
    items: [
      { name: "Universal Audio Suite"},
      { name: "FabFilter Suite"},
      { name: "Eventide Suite"},
      { name: "Waves Suite"},
      { name: "SSL Suite"},
      { name: "Soundtoys Suite"},
      { name: "Valhalla Collection"},
      { name: "Additional Plugins"}
    ]
  },
  {
    category: "Dynamic Microphones",
    items: [
      { name: "3x Shure SM57"},
      { name: "4x Shure SM58"},
      { name: "Shure Beta52A"},
      { name: "Shure SM7B"},
      { name: "AKG D112"},
      { name: "Audix D6"},
      { name: "4x Sennheiser e906"},
      { name: "4x Sennheiser MD421"},
      { name: "Electro-Voice 635A"},
      { name: "2x Electro-Voice RE16"},
      { name: "Dr. Alien Smith DirtMic01"},
      { name: "Dr. Alien Smith Alien8"}
    ]
  },
  {
    category: "Condenser Microphones",
    items: [
      { name: "2x Shure SM81"},
      { name: "2x Audio-Technica AT4060A"},
      { name: "4x Audio-Technica AT4021"},
      { name: "2x Audio-Technica AT4047"},
      { name: "4x Audio-Technica ATM450"},
      { name: "2x Neumann U67"},
      { name: "Neumann M49"},
      { name: "Neumann U47"},
      { name: "Neumann KM86"},
      { name: "Soyuz 017 FET"},
      { name: "2x Soyuz 013 FET"},
      { name: "Dachmann Audio 47 FET"}
    ]
  },
  {
    category: "Ribbon Microphones",
    items: [
      { name: "2x Audio-Technica AT4081"},
      { name: "2x Audio-Technica AT4080"},
      { name: "2x AEA R84"},
      { name: "AEA R88"},
      { name: "AEA R44"},
      { name: "3x AEA KU5A"},
      { name: "2x Coles 4038"},
      { name: "3x Royer R-10"},
      { name: "Royer R-121"}
    ]
  },
  {
    category: "Drum Kits & Percussion", 
    items: [
      { name: "DW Drum Kit"},
      { name: "Vintage 1960s Rogers Jazz Kit"},
      { name: "1920s Ludwig Steel Snare"},
      { name: "2x DW Snares"}
    ]
  },
  {
    category: "Guitars & Basses",
    items: [
      { name: "1990s Fender Stratocaster"},
      { name: "Custom Hamer Partscaster Tele"},
      { name: "1978 Gibson 335 with Bigsby"},
      { name: "2013 ‘57 Reissue Gibson Les Paul Goldtopp"},
      { name: "1958 Gibson J-50 Acoustic"},
      { name: "1971 Martin D-28"},
      { name: "2005 Martin HD-28"},
      { name: "1970s Gibson LG-1"},
      { name: "Ernie Ball Music Man Bass"}
    ]
  },
  {
    category: "Amplifiers",
    items: [
      { name: "Vox AC15"},
      { name: "Vox AC4"},
      { name: "Fender Princeton 15w"},
      { name: "Fender Princeton 10w"},
      { name: "Fender Blues Jr. Tweed 15w"},
      { name: "Fender Champ"},
      { name: "Mesa/Boogie Mark IV Combo"},
      { name: "Swart 5w Boutique Tube Amp"},
      { name: "Bitar Boutique Amplifier", specs: "25-watt boutique tube amp" },
      { name: "Ampeg Micro SVT", specs: "With matching cabinet for bass" }
    ]
  }
] as const;

const STUDIO_SPECS = [
  { label: "Isolation Booths", value: "1 isolated amp closet, 1 isolated vocal booth, 1 isolated dead room" },
  { label: "Monitoring", value: "Focal Solo6, ATC SCM45" },
  { label: "Cue System", value: "16-channel Hear Technology Cue System" }
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
                    {item.specs && (
                      <div className="body-text-small text-ivory/60">{item.specs}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 