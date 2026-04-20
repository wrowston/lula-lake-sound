import Image from "next/image";

import { PlaceholderFrame } from "../../_components/placeholder-frame";
import { VariantNav } from "../../_components/variant-nav";

/**
 * Variant A · About — "Field Notes".
 *
 * Printed-journal feel: eyebrow masthead, drop-cap essay in a single
 * narrow measure, an asymmetric inset portrait polaroid, margin
 * annotations that glance at specifics in the image, and a three-beat
 * founders' timeline rendered as a newsprint rule.
 */
export default function VariantAAbout() {
  return (
    <>
      <VariantNav variant="a" active="about" />
      <main className="relative isolate overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-texture-stone opacity-55" />

        {/* Masthead */}
        <header className="relative px-6 pt-16 pb-10 md:px-10 md:pt-24 md:pb-16">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 border-b border-sand/15 pb-10">
            <div className="flex items-center justify-between">
              <p className="label-text text-[10px] text-sand/70">
                Chapter 01 · About
              </p>
              <p className="label-text text-[10px] text-ivory/40">
                Lula Lake Sound · Field Notes
              </p>
            </div>
            <h1 className="headline-primary text-[2.5rem] leading-[1.05] text-warm-white md:text-[3.5rem]">
              A studio kept by the lake,
              <br />
              <span className="text-sand">and the people who keep it.</span>
            </h1>
            <p className="editorial-lede max-w-3xl">
              How a custom-built control room, a residential cabin, and a
              short walk through loblolly pines became one of the quieter
              rooms in the southeast — written by the people who built it.
            </p>
          </div>
        </header>

        {/* Essay + margin notes */}
        <section className="relative px-6 py-16 md:px-10 md:py-24">
          <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-12 md:grid-cols-[12rem_minmax(0,640px)_12rem] md:gap-10 lg:gap-16">
            {/* Left margin — date stamp + pull line */}
            <aside className="order-2 md:order-1 md:pt-6 md:text-right">
              <p className="eyebrow mb-3 text-sand/55">Date of writing</p>
              <p className="body-text-small text-ivory/55">
                Third week of October, in the year the studio finally stopped
                settling.
              </p>
              <div className="section-rule-solid my-8 max-w-[5rem] md:ml-auto" />
              <p className="body-text-small italic text-ivory/50">
                &ldquo;We wanted a room where the trees did half the
                mixing.&rdquo;
              </p>
              <p className="label-text mt-3 text-[10px] text-sand/50">
                — L. Bauer, founder
              </p>
            </aside>

            {/* Body */}
            <article className="order-1 md:order-2">
              <p className="body-text relative text-ivory/85 first-letter:mr-2 first-letter:float-left first-letter:font-acumin first-letter:text-[5rem] first-letter:leading-[0.9] first-letter:text-sand">
                The cabin was already there when we arrived. What we added,
                over the course of four seasons, was the rest of it — a
                live room sized for a quartet, a control room laid out for
                long days rather than short ones, and a porch wide enough
                to double as a green room. Most of the cedar came from the
                ridge behind the house. Most of the problems came from the
                weather.
              </p>
              <p className="body-text mt-6 text-ivory/75">
                Lula Lake Sound is a recording studio at the foot of
                Lookout Mountain, thirty minutes outside Chattanooga. We
                record bands and we record bands&apos; quieter cousins —
                singer-songwriters, chamber folk, film composers, the
                occasional gospel choir. We do it well because the room is
                built for it, because we&apos;re the ones running the room,
                and because there is no rush between takes.
              </p>
              <p className="body-text mt-6 text-ivory/75">
                The argument for recording here is not an argument about
                gear. It&apos;s an argument about focus. You sleep on the
                property. You eat on the porch. You walk to the lake at
                sunset and come back thinking about the bridge differently.
                That is the whole pitch, and after five years of it, we
                haven&apos;t found a reason to change it.
              </p>

              <blockquote className="my-12 border-l-2 border-sand/40 pl-6 italic">
                <p className="body-text text-[1.125rem] text-warm-white/85">
                  No rush between takes. The walk to the lake is part of
                  the session plan.
                </p>
              </blockquote>

              <p className="body-text text-ivory/75">
                We keep our capacity small on purpose. One session at a
                time, start to finish, with the same pair of ears from
                setup to mix. It&apos;s the arrangement that makes
                everything else on this page possible — the quiet, the
                light, the fact that we know where your guitar is before
                you do.
              </p>
            </article>

            {/* Right margin — polaroid portrait + note */}
            <aside className="order-3 md:order-3">
              <div className="relative">
                <div className="rotate-[-2deg] border border-sand/20 bg-washed-black p-3 shadow-[0_1px_0_rgba(198,189,160,0.08)_inset]">
                  <PlaceholderFrame
                    texture="sagebrush"
                    ratio="1/1"
                    index="P-01"
                    subject="founders, porch, morning light"
                  />
                  <p className="mt-3 text-center text-[11px] italic text-ivory/65">
                    First coffee, control room day one.
                  </p>
                </div>
              </div>
              <div className="mt-10 md:pl-4">
                <p className="eyebrow mb-3 text-sand/55">Margin note</p>
                <p className="body-text-small text-ivory/60">
                  Two engineers, one assistant, one studio dog. Sessions are
                  booked in week-long blocks so the room stays settled.
                </p>
              </div>
            </aside>
          </div>
        </section>

        {/* Timeline — newsprint rule */}
        <section className="relative px-6 py-16 md:px-10 md:py-24">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 flex items-baseline justify-between border-b border-sand/15 pb-6">
              <h2 className="headline-secondary text-2xl text-warm-white md:text-[1.875rem]">
                A short chronology
              </h2>
              <p className="label-text text-[10px] text-ivory/45">§ II</p>
            </div>

            <ol className="relative grid grid-cols-1 gap-10 md:grid-cols-3">
              {[
                {
                  year: "Year 1",
                  title: "Cabin + land",
                  body:
                    "A 1940s hunting cabin with good bones and terrible windows. Insulation, power, and a road that stays open in February.",
                },
                {
                  year: "Year 2",
                  title: "Live + control",
                  body:
                    "Live room framed around the stone fireplace. Control room floated on isolation pucks. First microphones through the walls.",
                },
                {
                  year: "Year 3+",
                  title: "The quiet version",
                  body:
                    "Residential cabin added. One-session-at-a-time booking. Most of the time the loudest thing outside is weather.",
                },
              ].map((stop, i) => (
                <li key={stop.year} className="relative">
                  <p className="label-text mb-4 text-[10px] text-sand/65">
                    {String(i + 1).padStart(2, "0")} · {stop.year}
                  </p>
                  <h3 className="headline-secondary mb-3 text-xl text-warm-white">
                    {stop.title}
                  </h3>
                  <p className="body-text-small text-ivory/60">{stop.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Closing */}
        <section className="relative px-6 py-20 md:px-10 md:py-28">
          <div className="mx-auto flex max-w-3xl flex-col items-center border-y border-sand/10 py-14 text-center">
            <Image
              src="/Logos/Graphic/LLS_Logo_Graphic_Sand.png"
              alt=""
              width={80}
              height={80}
              aria-hidden
              className="mb-8 h-10 w-auto opacity-75"
            />
            <p className="eyebrow mb-5 text-sand/55">Correspondence</p>
            <h2 className="headline-secondary mb-6 text-2xl text-sand md:text-[1.75rem]">
              Write us a letter, or a one-liner.
            </h2>
            <p className="body-text max-w-xl text-ivory/60">
              If the room sounds like the one you&apos;ve been looking for,
              we&apos;d love to read the pitch. Send us dates, a rough
              project description, and any reference tracks you want the
              session to point toward.
            </p>
            <p className="mt-8 text-[12px] text-ivory/40">
              <span className="text-sand underline underline-offset-[6px]">
                Write us
              </span>{" "}
              — info@lulalakesound.com
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
