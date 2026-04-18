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
    label: "Isolation",
    value: "1 iso amp closet · 1 vocal booth · 1 dead room",
  },
  { label: "Monitoring", value: "Focal Solo6 · ATC SCM45" },
  { label: "Cue System", value: "16-channel Hear Technology" },
] as const;

export function EquipmentSpecs() {
  const [expandedCategories, setExpandedCategories] = useState<number[]>([0, 1, 2]);

  const toggleCategory = (index: number) => {
    setExpandedCategories((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  return (
    <section
      id="equipment-specs"
      className="relative overflow-hidden bg-deep-forest px-6 py-28 md:py-40 lg:py-48"
    >
      <div className="absolute inset-0 bg-texture-ink-wash opacity-30" />

      <div className="relative z-10 mx-auto max-w-[72rem]">
        {/* Section header */}
        <header className="reveal mx-auto mb-20 flex w-full max-w-3xl flex-col items-center text-center md:mb-28">
          <p className="label-text mb-6 text-sand/65">02 &middot; The Gear</p>
          <h2 className="headline-primary mb-8 text-[2.25rem] text-warm-white md:text-[3rem] lg:text-[3.5rem]">
            An honest list of instruments
          </h2>
          <div className="section-rule mb-10 w-24" />
          <p className="body-text max-w-2xl text-lg text-ivory/70">
            The rack, the mic locker, the drum room. Gathered slowly over
            years of recording, chosen because they sound like themselves.
          </p>
        </header>

        {/* Room specs — three quiet callouts, separated by hairlines */}
        <div className="reveal reveal-delay-1 mb-24 grid grid-cols-1 gap-px overflow-hidden bg-sand/10 md:grid-cols-3">
          {STUDIO_SPECS.map((spec, index) => (
            <div
              key={index}
              className="bg-deep-forest px-6 py-10 text-center md:py-14"
            >
              <div className="label-text mb-4 text-sand/70">{spec.label}</div>
              <div className="body-text text-ivory/75">{spec.value}</div>
            </div>
          ))}
        </div>

        {/* Equipment categories — accordion on an editorial list */}
        <div className="reveal reveal-delay-2 border-t border-sand/10">
          {EQUIPMENT_CATEGORIES.map((category, categoryIndex) => {
            const isExpanded = expandedCategories.includes(categoryIndex);
            const categoryLabel = String(categoryIndex + 1).padStart(2, "0");
            return (
              <div
                key={categoryIndex}
                className="border-b border-sand/10"
              >
                <button
                  onClick={() => toggleCategory(categoryIndex)}
                  className="flex w-full items-baseline justify-between gap-6 px-2 py-6 text-left transition-colors duration-300 hover:text-sand md:px-4 md:py-8"
                >
                  <span className="flex items-baseline gap-6 md:gap-10">
                    <span className="label-text text-sand/50">
                      {categoryLabel}
                    </span>
                    <span className="headline-secondary text-xl text-ivory/90 md:text-2xl">
                      {category.category}
                    </span>
                  </span>
                  <span className="flex items-center gap-5">
                    <span className="label-text text-ivory/35">
                      {String(category.items.length).padStart(2, "0")}
                    </span>
                    <svg
                      className={`h-3 w-3 text-sand/60 transition-transform duration-500 ${
                        isExpanded ? "rotate-45" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.25}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </span>
                </button>

                <div
                  className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    isExpanded
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="min-h-0">
                    <div className="grid grid-cols-1 gap-x-16 gap-y-1 px-2 pb-10 pt-2 md:grid-cols-2 md:px-16">
                      {category.items.map((item, itemIndex) => (
                        <div
                          key={itemIndex}
                          className="flex items-baseline justify-between gap-6 border-b border-sand/5 py-3 last:border-0"
                        >
                          <span className="body-text-small text-ivory/75">
                            {item.name}
                          </span>
                          {item.specs ? (
                            <span className="body-text-small whitespace-normal text-right text-ivory/40 md:whitespace-nowrap">
                              {item.specs}
                            </span>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
