/**
 * Canonical homepage FAQ seed (INF-121). Imported by seed/migration and the
 * Next.js FAQ component fallback.
 */

export type FaqQuestionSeed = {
  stableId: string;
  question: string;
  answer: string;
};

export type FaqCategorySeed = {
  stableId: string;
  title: string;
  questions: FaqQuestionSeed[];
};

export const DEFAULT_FAQ_CATEGORIES: readonly FaqCategorySeed[] = [
  {
    stableId: "cat_studio_sessions",
    title: "Studio Sessions & Recording",
    questions: [
      {
        stableId: "q_1",
        question: "What should I bring to my recording session?",
        answer:
          "Bring your instruments, any specific pedals or equipment you want to use, backup cables, and your music (charts, lyrics, demo recordings). We provide all basic cables, microphones, and recording equipment. If you have specific instruments you prefer (like your own snare drum or guitar), feel free to bring them!",
      },
      {
        stableId: "q_2",
        question: "Do you provide instruments and amplifiers?",
        answer:
          "Yes! Please see our gear list for a list of our available instruments and amplifiers.",
      },
      {
        stableId: "q_3",
        question: "Can I bring my own engineer or producer?",
        answer:
          "Absolutely! We welcome outside engineers and producers. Our studio engineer will assist with setup and technical support. If you prefer to work solo or with your team, that's perfectly fine too. We're here to support your creative process however works best for you.",
      },
      {
        stableId: "q_4",
        question: "How far in advance should I book?",
        answer:
          "We recommend booking 2-4 weeks in advance, especially during busy seasons (spring and fall). However, we often have last-minute availability. Contact us to check our current schedule - sometimes we can accommodate short-notice bookings.",
      },
    ],
  },
  {
    stableId: "cat_studio_logistics",
    title: "Studio Logistics",
    questions: [
      {
        stableId: "q_9",
        question: "Is there accommodation nearby?",
        answer:
          "Yes! We can help arrange lodging for out-of-town artists. Many artists love staying nearby to maintain the creative flow between sessions.",
      },
    ],
  },
];
