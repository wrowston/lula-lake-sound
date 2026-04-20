import Image from "next/image";

import { PlaceholderFrame } from "../../_components/placeholder-frame";
import { VariantNav } from "../../_components/variant-nav";

/**
 * Variant B · About — "Resonance".
 *
 * Three full-bleed, sticky panels. Each panel pairs a large textured
 * image with an editorial column; Chladni plates anchor the transitions.
 * A persistent right-edge sand hairline with chapter indices carries the
 * reader through the scroll — no jumpy micro-interactions, just slow
 * resolution between panels.
 */
export default function VariantBAbout() {
  return (
    <>
      <VariantNav variant="b" active="about" />
      <main className="relative isolate">
        {/* Hero */}
        <section className="relative flex min-h-[88vh] flex-col items-center justify-center overflow-hidden px-6 py-24 md:min-h-screen md:px-10">
          <div className="absolute inset-0 z-0">
            <Image
              src="/Textured Backgrounds/LLS_Texture_Emerald.jpg"
              alt=""
              fill
              className="object-cover object-center"
              priority
              quality={82}
            />
            <div className="absolute inset-0 bg-washed-black/60" />
            <div aria-hidden className="absolute inset-0 bg-chladni-2 opacity-60" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-washed-black" />
          </div>
          <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-start gap-10">
            <p className="eyebrow text-gold/85">Resonance · About</p>
            <h1 className="headline-primary text-[2.75rem] leading-[1.03] text-warm-white md:text-[4.25rem]">
              A room built for the
              <br />
              <span className="text-gold">slow take.</span>
            </h1>
            <div className="section-rule max-w-[10rem]" />
            <p className="editorial-lede max-w-2xl text-warm-white/80">
              Thirty minutes outside Chattanooga. One session at a time.
              The building was pulled out of a hunting cabin; the room was
              pulled out of the ridge. Everything else we make here follows
              from those two decisions.
            </p>
          </div>
        </section>

        {/* Panel 1 — Place */}
        <Panel
          tag="I · Place"
          kicker="Coordinates"
          eyebrow="Lookout Mountain · TN"
          title="A ridge, a cabin, and the short walk to the lake."
          body="The property is cedar, loblolly, and weather. The studio is a 1940s hunting cabin that we stripped to the studs, floated on isolation pucks, and wrapped with a modern live and control pair. The residential cabin sits fifty feet away. We record, we sleep, we walk the trail to the water between takes."
          texture="sagebrush"
          imageSide="left"
          stat="Elevation · 1,750 ft"
          subject="the walk back up from the lake, low cloud"
        />

        <Panel
          tag="II · Room"
          kicker="The build"
          eyebrow="Control · Live · Isolation"
          title="Tracking room first. Gear second."
          body="We built the rooms before we bought the rack. The live room is sized for a quartet; the control room was laid out for long days, not short meetings. Isolation is handled in three boxes — amp closet, vocal booth, dead room — so overdubs and live tracking happen without moving the band."
          texture="seafoam"
          imageSide="right"
          stat="Live room · 640 sq ft"
          subject="live room from the control glass, mics set for strings"
        />

        <Panel
          tag="III · Work"
          kicker="How we book"
          eyebrow="One session, start to finish"
          title="Same pair of ears from setup to mix."
          body="We book in week-long blocks, one project at a time. That single decision drives everything else on the site: the quiet, the residency, the fact that we know where your guitar is before you do. There is no rush between takes."
          texture="goldenhour"
          imageSide="left"
          stat="Capacity · one"
          subject="late-night control room, lamps only, moving faders"
        />

        {/* Closing wash */}
        <section className="relative overflow-hidden px-6 py-28 md:px-10 md:py-36">
          <div className="absolute inset-0 z-0">
            <Image
              src="/Textured Backgrounds/LLS_Texture_Starburst.jpg"
              alt=""
              fill
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-washed-black/75" />
            <div aria-hidden className="absolute inset-0 bg-chladni-3 opacity-65" />
          </div>
          <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center text-center">
            <Image
              src="/Logos/Graphic/LLS_Logo_Graphic_Sage.png"
              alt=""
              width={90}
              height={90}
              aria-hidden
              className="mb-8 h-12 w-auto opacity-80"
            />
            <p className="eyebrow mb-5 text-gold/80">Hold a session</p>
            <h2 className="headline-secondary mb-6 text-[1.75rem] text-warm-white md:text-[2.25rem]">
              If it sounds like the room
              <br />
              you&apos;ve been looking for.
            </h2>
            <p className="body-text mb-10 text-ivory/65">
              Dates, a short project description, any reference tracks. We
              read every inquiry in the morning.
            </p>
            <a
              href="mailto:info@lulalakesound.com"
              className="inline-flex items-center gap-3 border border-transparent bg-sand px-10 py-3 text-[12px] font-semibold uppercase tracking-[0.22em] text-washed-black transition-colors duration-500 hover:bg-warm-white"
            >
              Hold a session
            </a>
          </div>
        </section>
      </main>
    </>
  );
}

function Panel({
  tag,
  kicker,
  eyebrow,
  title,
  body,
  texture,
  imageSide,
  stat,
  subject,
}: {
  readonly tag: string;
  readonly kicker: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly body: string;
  readonly texture:
    | "emerald"
    | "sagebrush"
    | "seafoam"
    | "sunset"
    | "goldenhour"
    | "starburst"
    | "coral";
  readonly imageSide: "left" | "right";
  readonly stat: string;
  readonly subject: string;
}) {
  const imageFirst = imageSide === "left";
  return (
    <section className="relative border-t border-sand/10 px-6 py-20 md:px-10 md:py-32">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-chladni-1 opacity-25" />
      <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 md:grid-cols-12 md:gap-16">
        <div
          className={`${
            imageFirst ? "md:col-start-1" : "md:col-start-6"
          } md:col-span-7`}
        >
          <div className="border border-sand/15 bg-washed-black/60 p-4 md:p-5">
            <PlaceholderFrame
              texture={texture}
              ratio="16/11"
              subject={subject}
              index={tag.split(" ")[0]}
            />
          </div>
        </div>

        <div
          className={`${
            imageFirst ? "md:col-start-8" : "md:col-start-1 md:row-start-1"
          } md:col-span-5`}
        >
          <div className="flex items-center gap-3 text-gold/75">
            <span className="size-1.5 bg-gold" aria-hidden />
            <span className="label-text text-[10px]">{tag}</span>
          </div>
          <p className="eyebrow mt-5 mb-4 text-sand/55">{eyebrow}</p>
          <h2 className="headline-secondary mb-6 text-[1.75rem] leading-[1.1] text-warm-white md:text-[2.25rem]">
            {title}
          </h2>
          <p className="body-text mb-8 text-ivory/70">{body}</p>
          <div className="flex items-center gap-4 border-t border-sand/15 pt-5">
            <span className="label-text text-[10px] text-ivory/40">
              {kicker}
            </span>
            <span className="h-3 w-px bg-sand/25" aria-hidden />
            <span className="body-text-small text-gold">{stat}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
