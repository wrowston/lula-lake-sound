/**
 * Legacy equipment list mirrored from `src/components/equipment-specs.tsx` (INF-86).
 * Used by `internal.seed.seedGearFromEquipmentSpecs` for one-time Convex import.
 * When the homepage reads `api.public.getPublishedGear` only, update the TSX
 * fallback in sync or remove the duplicate.
 */
export const LEGACY_EQUIPMENT_SEED: ReadonlyArray<{
  readonly category: string;
  readonly items: ReadonlyArray<{ readonly name: string; readonly specs?: string }>;
}> = [
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
];
