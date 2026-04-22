/**
 * Shape + static fixtures for the public Recordings page (INF-48).
 *
 * Fields are a superset of the four primary columns the client approved
 * (`title`, `artist`, `genre`, `year`) plus metadata we want to keep
 * available when the list is wired up to Convex (`id`, `order`, `role`,
 * `audioUrl`). Extended fields stay optional so the table layout continues
 * to work if CMS entries omit them.
 *
 * `audioUrl` currently points at the public SoundHelix sample catalogue so
 * playback and duration UI can be exercised end-to-end before uploaded
 * audio lands (INF-50). When the media pipeline is ready, swap these URLs
 * for Convex storage URLs (or storage ids resolved server-side) without
 * changing any call-sites.
 */
export interface Recording {
  readonly id: string;
  readonly title: string;
  readonly artist: string;
  readonly genre: string;
  readonly year: number;
  readonly audioUrl: string;
  readonly order?: number;
  /** Optional engineering credit — kept as secondary metadata per client direction. */
  readonly role?: string;
}

export const RECORDINGS: readonly Recording[] = [
  {
    id: "hollow-bones",
    title: "Hollow Bones",
    artist: "The Paper Kites",
    genre: "Indie Folk",
    year: 2024,
    role: "Recorded & Mixed",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    order: 1,
  },
  {
    id: "river-hymn",
    title: "River Hymn",
    artist: "Julien Baker",
    genre: "Alt Rock",
    year: 2024,
    role: "Tracked",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    order: 2,
  },
  {
    id: "still-life",
    title: "Still Life",
    artist: "Iron & Wine",
    genre: "Chamber Folk",
    year: 2023,
    role: "Mixed & Mastered",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    order: 3,
  },
  {
    id: "burning-daylight",
    title: "Burning Daylight",
    artist: "Strand of Oaks",
    genre: "Indie Rock",
    year: 2023,
    role: "Recorded",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    order: 4,
  },
  {
    id: "good-grief",
    title: "Good Grief",
    artist: "Lucius",
    genre: "Synth Pop",
    year: 2023,
    role: "Recorded & Mixed",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    order: 5,
  },
  {
    id: "lookout-sessions",
    title: "Lookout Sessions (Acoustic)",
    artist: "S. Carey",
    genre: "Chamber Folk",
    year: 2022,
    role: "Tracked & Mixed",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
    order: 6,
  },
  {
    id: "canopy-lights",
    title: "Canopy Lights",
    artist: "Hovvdy",
    genre: "Dream Pop",
    year: 2022,
    role: "Mixed",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
    order: 7,
  },
  {
    id: "stonefield-reverie",
    title: "Stonefield Reverie",
    artist: "Kevin Morby",
    genre: "Folk Rock",
    year: 2021,
    role: "Recorded",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    order: 8,
  },
];
