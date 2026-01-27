"use client";

import { useState } from "react";

type EquipmentItem = {
  name: string;
  specs?: string;
};

type EquipmentCategory = {
  category: string;
  items: EquipmentItem[];
};

const EQUIPMENT_CATEGORIES: EquipmentCategory[] = [
  {
    category: "Interfaces & Console",
    items: [
      { name: "API 2448 Console", specs: "With 16x API 560 EQs and 8x API 550B EQs" },
      { name: "2x Universal Audio Apollo x16 Interfaces" },
      { name: "Pro Tools Ultimate" },
    ],
  },
  {
    category: "Preamps & Channel Strips",
    items: [
      { name: "Neve 1073OPX" },
      { name: "AEA RPQ3" },
      { name: "Tree Audio Branch" },
      { name: "2x Avalon Channel Strips" },
      { name: '2x Sunset Sound "Tutti" Mic/Instrument Pre' },
    ],
  },
  {
    category: "Compressors & Dynamics",
    items: [
      { name: "2x Empirical Labs Distressor" },
      { name: "2x Urei 1176LN" },
      { name: "2x Purple Audio MC77" },
      { name: "2x DBX 165" },
      { name: "Retro STA-Level Compressor" },
      { name: "Manley Vari-Mu Stereo Compressor/Limiter" },
      { name: "Unfairchild 670 Stereo Compressor" },
      { name: "Grandchild 670 Stereo Compressor" },
      { name: "SSL G-Bus Stereo Compressor" },
      { name: "Custom SSL Talkback-Style Limiter" },
      { name: "2x LevelOr Limiter/DI/Distortion Units" },
    ],
  },
  {
    category: "EQs",
    items: [
      { name: "2x Heritage Audio 1073 EQ" },
      { name: "2x Helios 5011 EQ" },
      { name: "Chandler Limited Curve Bender" },
    ],
  },
  {
    category: "Tape & Saturation",
    items: [
      { name: "2x Neve Portico 542 Tape Emulators" },
      { name: "Thermionic Culture Vulture" },
    ],
  },
  {
    category: "Reverb & Effects",
    items: [
      { name: "AMS RMX16 Digital Reverb" },
      { name: "Bricasti M7 Digital Reverb" },
    ],
  },
  {
    category: "Plugins",
    items: [
      { name: "Universal Audio Suite" },
      { name: "FabFilter Suite" },
      { name: "Eventide Suite" },
      { name: "Waves Suite" },
      { name: "SSL Suite" },
      { name: "Soundtoys Suite" },
      { name: "Valhalla Collection" },
      { name: "Additional Plugins" },
    ],
  },
  {
    category: "Dynamic Microphones",
    items: [
      { name: "3x Shure SM57" },
      { name: "4x Shure SM58" },
      { name: "Shure Beta52A" },
      { name: "Shure SM7B" },
      { name: "AKG D112" },
      { name: "Audix D6" },
      { name: "4x Sennheiser e906" },
      { name: "4x Sennheiser MD421" },
      { name: "Electro-Voice 635A" },
      { name: "2x Electro-Voice RE16" },
      { name: "Dr. Alien Smith DirtMic01" },
      { name: "Dr. Alien Smith Alien8" },
    ],
  },
  {
    category: "Condenser Microphones",
    items: [
      { name: "2x Shure SM81" },
      { name: "2x Audio-Technica AT4060A" },
      { name: "4x Audio-Technica AT4021" },
      { name: "2x Audio-Technica AT4047" },
      { name: "4x Audio-Technica ATM450" },
      { name: "2x Neumann U67" },
      { name: "Neumann M49" },
      { name: "Neumann U47" },
      { name: "Neumann KM86" },
      { name: "Soyuz 017 FET" },
      { name: "2x Soyuz 013 FET" },
      { name: "Dachmann Audio 47 FET" },
    ],
  },
  {
    category: "Ribbon Microphones",
    items: [
      { name: "2x Audio-Technica AT4081" },
      { name: "2x Audio-Technica AT4080" },
      { name: "2x AEA R84" },
      { name: "AEA R88" },
      { name: "AEA R44" },
      { name: "3x AEA KU5A" },
      { name: "2x Coles 4038" },
      { name: "3x Royer R-10" },
      { name: "Royer R-121" },
    ],
  },
  {
    category: "Drum Kits & Percussion",
    items: [
      { name: "DW Drum Kit" },
      { name: "Vintage 1960s Rogers Jazz Kit" },
      { name: "1920s Ludwig Steel Snare" },
      { name: "2x DW Snares" },
    ],
  },
  {
    category: "Guitars & Basses",
    items: [
      { name: "1990s Fender Stratocaster" },
      { name: "Custom Hamer Partscaster Tele" },
      { name: "1978 Gibson 335 with Bigsby" },
      { name: "2013 '57 Reissue Gibson Les Paul Goldtopp" },
      { name: "1958 Gibson J-50 Acoustic" },
      { name: "1971 Martin D-28" },
      { name: "2005 Martin HD-28" },
      { name: "1970s Gibson LG-1" },
      { name: "Ernie Ball Music Man Bass" },
    ],
  },
  {
    category: "Amplifiers",
    items: [
      { name: "Vox AC15" },
      { name: "Vox AC4" },
      { name: "Fender Princeton 15w" },
      { name: "Fender Princeton 10w" },
      { name: "Fender Blues Jr. Tweed 15w" },
      { name: "Fender Champ" },
      { name: "Mesa/Boogie Mark IV Combo" },
      { name: "Swart 5w Boutique Tube Amp" },
      { name: "Bitar Boutique Amplifier", specs: "25-watt boutique tube amp" },
      { name: "Ampeg Micro SVT", specs: "With matching cabinet for bass" },
    ],
  },
] as const;

const STUDIO_SPECS = [
  {
    label: "Isolation Booths",
    value: "1 isolated amp closet, 1 isolated vocal booth, 1 isolated dead room",
  },
  { label: "Monitoring", value: "Focal Solo6, ATC SCM45" },
  { label: "Cue System", value: "16-channel Hear Technology Cue System" },
] as const;

export function EquipmentSpecs() {
  const [expandedCategories, setExpandedCategories] = useState<number[]>([0, 1, 2]);

  const toggleCategory = (index: number) => {
    setExpandedCategories((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <section id="equipment-specs" className="py-24 md:py-32 px-6 bg-charcoal relative">
      <div className="absolute inset-0 opacity-20 bg-texture-stone" />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16 reveal">
          <p className="label-text text-sand/60 mb-4">Equipment</p>
          <h2 className="headline-primary text-3xl md:text-4xl lg:text-5xl text-warm-white mb-6">
            Studio Specifications
          </h2>
          <div className="section-rule max-w-xs mx-auto mb-8" />
          <p className="body-text text-lg text-ivory/60 max-w-2xl mx-auto">
            World-class equipment and acoustically designed spaces ensure your recordings
            capture every nuance with pristine clarity and character.
          </p>
        </div>

        {/* Studio Room Specs */}
        <div className="reveal reveal-delay-1 mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-sand/10 border border-sand/10">
            {STUDIO_SPECS.map((spec, index) => (
              <div key={index} className="bg-washed-black p-6 md:p-8 text-center">
                <div className="label-text text-sand mb-3">{spec.label}</div>
                <div className="body-text-small text-ivory/60">{spec.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Equipment Categories — accordion style */}
        <div className="reveal reveal-delay-2 space-y-px">
          {EQUIPMENT_CATEGORIES.map((category, categoryIndex) => {
            const isExpanded = expandedCategories.includes(categoryIndex);
            return (
              <div key={categoryIndex} className="border border-sand/8 bg-washed-black/60">
                <button
                  onClick={() => toggleCategory(categoryIndex)}
                  className="w-full px-6 py-5 flex items-center justify-between hover:bg-sand/5 transition-colors"
                >
                  <span className="headline-secondary text-lg text-sand">
                    {category.category}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="label-text text-ivory/30 text-[10px]">
                      {category.items.length}
                    </span>
                    <svg
                      className={`w-4 h-4 text-ivory/30 transition-transform duration-300 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                    {category.items.map((item, itemIndex) => (
                      <div
                        key={itemIndex}
                        className="py-2 border-b border-sand/5 last:border-0 flex items-baseline justify-between gap-4"
                      >
                        <span className="body-text text-ivory/70 text-sm">{item.name}</span>
                        {item.specs && (
                          <span className="body-text-small text-ivory/35 text-xs whitespace-nowrap">
                            {item.specs}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
