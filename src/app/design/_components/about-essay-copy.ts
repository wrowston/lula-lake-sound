/**
 * Shared placeholder copy for the About page across design variants.
 *
 * Final content will be CMS / markdown in production (INF-46+). Structure
 * here is intentionally essay-like: lede, two founder portraits, a brief
 * history section, and a why-we-built-it section.
 */

export const ABOUT_ESSAY = {
  lede:
    "Lula Lake Sound is run by two founders who built the studio on Lookout Mountain, just outside Chattanooga. What follows is a short history of the room—and why they chose to build it here instead of in the city.",

  history: {
    title: "A brief history",
    paragraphs: [
      "The property started as a cabin and a ridge. Over several seasons they added a live room and control room, tied to the land with cedar from the site and a floated floor so the room could track a band without fighting the building. A residential cabin sits on the same property so artists can stay through the week.",
      "The studio grew in stages: power and isolation first, then rooms sized for real sessions, then the quiet booking model—one project at a time, same engineers from setup to mix. The history is not a press release; it is the order in which the room stopped settling.",
    ],
  },

  why: {
    title: "Why we built it",
    paragraphs: [
      "They built here because the argument for the studio was never only about gear. It was about focus: sleep on the property, walk the trail between takes, and let the room and the weather do part of the work that city logistics usually eat. The lake and the elevation are part of the pitch, not background.",
      "That is the reason the building exists in this form— a destination room with limited capacity, built for artists who want immersion over a daily rate. Final names, dates, and photography will be edited in the production About page.",
    ],
  },

  founders: [
    {
      id: "1",
      caption: "Founder — [name]",
      captionDetail: "Portrait placeholder — replace with final photo.",
      texture: "sagebrush" as const,
    },
    {
      id: "2",
      caption: "Founder — [name]",
      captionDetail: "Portrait placeholder — replace with final photo.",
      texture: "goldenhour" as const,
    },
  ],
} as const;
