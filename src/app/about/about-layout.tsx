"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import type {
  PublicAboutSnapshot,
  PublicAboutTeamMember,
} from "../../../convex/cmsShared";
import { Header } from "@/components/header";
import { SiteFooter } from "@/components/site-footer";
import { AboutBodyContent } from "./about-body-content";
import { cn } from "@/lib/utils";

/**
 * Shared presentational layer for the public About page and the owner-only
 * preview. Takes plain data (already materialized by whichever query the
 * caller used) so we can mount the same markup behind either
 * `api.public.getPublishedAbout` or `api.aboutPreviewDraft.getPreviewAbout`.
 *
 * Per the client direction (2026-04-21, INF-46):
 *  - Variant A "Cinematic Editorial" hero + two-column narrative.
 *  - Owner / studio-designer circular headshots.
 *  - **Pull quote placement: below the About body copy** (left column), not under headshots.
 *  - **No milestones / timeline section** is rendered.
 */

/**
 * Fallback cinematic hero image when the CMS has no `heroImageStorageId`
 * set (or the blob has been deleted → `storage.getUrl` → `null`). This URL
 * is already listed under `images.remotePatterns` in `next.config.ts`, so
 * `next/image` can optimize it without changes.
 *
 * The owner-facing flow is: pick from existing gallery photos in the
 * About admin — `data.heroImageUrl` is the resolved signed URL when set.
 */
const HERO_IMAGE_FALLBACK_SRC =
  "https://g3ik3pexma.ufs.sh/f/Ans4G8qtRkcnAhUWTJqtRkcnhBTMlYH2mZ96dp7NjQyvSeA8";

/**
 * Reuses the site-wide `.reveal` + `.reveal-delay-N` CSS (see
 * `src/app/globals.css`). A container-level IntersectionObserver toggles
 * `.in-view` on each observed element when it scrolls into view.
 */
const MAX_REVEAL_DELAY = 6;
function aboutRevealDelay(step: number): string {
  if (step <= 0) return "reveal";
  const clamped = Math.min(step, MAX_REVEAL_DELAY);
  return `reveal reveal-delay-${clamped}`;
}

function BodyCopy({ data }: { readonly data: PublicAboutSnapshot }) {
  const html = data.bodyHtml?.trim();
  if (html && html.length > 0) {
    return (
      <div className="max-w-2xl">
        <AboutBodyContent key={html} html={html} />
      </div>
    );
  }
  return (
    <div className="max-w-2xl space-y-6">
      {data.body.map((block, i) =>
        block.type === "heading" ? (
          <h2
            key={i}
            className="headline-secondary text-sand text-2xl md:text-3xl"
          >
            {block.text}
          </h2>
        ) : (
          <p
            key={i}
            className="body-text text-ivory/70 text-lg leading-[1.8]"
          >
            {block.text}
          </p>
        ),
      )}
    </div>
  );
}

interface HeadshotProps {
  readonly member?: PublicAboutTeamMember;
  readonly fallbackRole: string;
}

function Headshot({ member, fallbackRole }: HeadshotProps) {
  const role = member?.title ?? fallbackRole;
  return (
    <div className="flex flex-col items-center">
      <div className="relative aspect-square w-full max-w-[220px] overflow-hidden rounded-full border border-sand/10 bg-charcoal/40">
        {member?.imageUrl ? (
          <Image
            src={member.imageUrl}
            alt={member.name ? `Portrait of ${member.name}` : ""}
            fill
            sizes="(min-width: 1024px) 220px, (min-width: 640px) 40vw, 70vw"
            className="object-cover"
          />
        ) : (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-4 text-center"
            aria-hidden
          >
            <span className="label-text text-ivory/30 text-[10px] tracking-[0.2em] leading-snug">
              Portrait
            </span>
            <span className="body-text-small text-ivory/35 text-[11px] leading-snug">
              Coming soon
            </span>
          </div>
        )}
      </div>
      <div className="mt-5 text-center">
        {member?.name ? (
          <p className="headline-secondary text-ivory text-lg">{member.name}</p>
        ) : null}
        <p className="label-text text-sand/60 text-[10px] tracking-[0.2em] mt-1">
          {role}
        </p>
      </div>
    </div>
  );
}

interface AboutLayoutProps {
  readonly data: PublicAboutSnapshot;
  readonly showPricing: boolean;
  /**
   * Optional banner slot above the header (used by the preview route to show
   * "Draft" / "No unpublished changes" state).
   */
  readonly banner?: React.ReactNode;
}

export function AboutLayout({ data, showPricing, banner }: AboutLayoutProps) {
  const [scrollY, setScrollY] = useState(0);
  const pathname = usePathname();
  const aboutHref =
    pathname === "/preview" || pathname.startsWith("/preview/")
      ? "/preview/about"
      : "/about";

  // Ref callback owns the scroll listener + reveal observer lifecycle so we
  // can follow the project's "no effect hook" convention (see AGENTS.md). React
  // 19 runs the cleanup returned here when the node detaches, matching the
  // pattern in `src/components/homepage-shell.tsx`.
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;

    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrollY(window.scrollY);
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    setScrollY(window.scrollY);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" },
    );
    const reveals = node.querySelectorAll(".reveal");
    reveals.forEach((el) => observer.observe(el));

    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  const team = data.teamMembers ?? [];
  // Variant A composition features exactly two circular headshots — owner +
  // studio designer. Additional team members on the same CMS snapshot are
  // reserved for a future grid section.
  const [owner, designer] = [team[0], team[1]];
  const pullQuote = data.pullQuote?.trim();
  // `heroImageUrl` may be `null` if the stored blob was deleted from the
  // gallery; fall back to the baked-in image so the page always has a hero.
  const heroImageSrc =
    data.heroImageUrl && data.heroImageUrl.length > 0
      ? data.heroImageUrl
      : HERO_IMAGE_FALLBACK_SRC;

  return (
    <div
      ref={containerRef}
      className="dark min-h-screen bg-deep-forest text-ivory relative grain-overlay"
    >
      {banner}
      {/* About page only mounts when `published === true` for the public
          route, and owners viewing draft see their latest toggle value
          anyway — always showing the About link here keeps the header
          self-consistent with the current page. */}
      <Header
        scrollY={scrollY}
        showPricing={showPricing}
        showAbout
        aboutHref={aboutHref}
      />

      <main>
        <section className="relative" aria-labelledby="about-hero-title">
          <div className="relative h-[70vh] md:h-[85vh] overflow-hidden">
            <Image
              src={heroImageSrc}
              alt=""
              role="presentation"
              fill
              className="object-cover"
              quality={85}
              priority
              sizes="100vw"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-b from-deep-forest/60 via-deep-forest/30 to-deep-forest"
            />
            <div className="absolute inset-0 flex items-end">
              <div className="mx-auto w-full max-w-7xl px-6 pb-16 md:px-16 md:pb-24">
                <nav aria-label="Breadcrumb" className={aboutRevealDelay(0)}>
                  <Link
                    href="/"
                    className="label-text text-sand/60 hover:text-sand transition-colors text-[11px] tracking-[0.2em]"
                  >
                    ← Lula Lake Sound
                  </Link>
                </nav>
                <h1
                  id="about-hero-title"
                  className={cn(
                    aboutRevealDelay(2),
                    "headline-primary text-warm-white leading-[1.05] mt-6 text-balance",
                  )}
                  style={{ fontSize: "clamp(2.5rem, 6vw, 5.5rem)" }}
                >
                  {data.heroTitle}
                </h1>
                {data.heroSubtitle ? (
                  <p
                    className={cn(
                      aboutRevealDelay(3),
                      "body-text text-ivory/75 mt-6 max-w-2xl text-lg md:text-xl leading-[1.6]",
                    )}
                  >
                    {data.heroSubtitle}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section
          className="relative bg-deep-forest px-6 py-24 md:px-16 md:py-36"
          aria-label="About Lula Lake Sound"
        >
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-24">
            <div className={cn(aboutRevealDelay(0), "lg:col-span-7")}>
              <BodyCopy data={data} />
              {pullQuote ? (
                <blockquote
                  className={cn(
                    aboutRevealDelay(1),
                    "mt-10 lg:mt-12 border-l-2 border-gold/50 pl-8 py-2",
                  )}
                >
                  <p
                    className="headline-secondary italic leading-[1.4] text-sand/90"
                    style={{ fontSize: "clamp(1.375rem, 2.2vw, 1.875rem)" }}
                  >
                    &ldquo;{pullQuote}&rdquo;
                  </p>
                </blockquote>
              ) : null}
            </div>

            <div className="flex flex-col gap-12 lg:col-span-5">
              <div
                className={cn(
                  aboutRevealDelay(2),
                  "grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-8",
                )}
              >
                <Headshot member={owner} fallbackRole="Owner" />
                <Headshot member={designer} fallbackRole="Studio designer" />
              </div>
            </div>
          </div>
        </section>

        {data.highlights && data.highlights.length > 0 ? (
          <section
            className="bg-washed-black border-t border-sand/10 px-6 py-20 md:px-16"
            aria-label="Studio highlights"
          >
            <div className="mx-auto max-w-7xl">
              <p
                className={cn(
                  aboutRevealDelay(0),
                  "label-text mb-10 tracking-[0.2em] text-sand/50 text-[11px]",
                )}
              >
                At a glance
              </p>
              <ul className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {data.highlights.map((highlight, i) => (
                  <li
                    key={`${i}-${highlight.slice(0, 12)}`}
                    className={cn(
                      aboutRevealDelay(Math.min(i + 1, MAX_REVEAL_DELAY)),
                      "body-text text-ivory/75 text-lg leading-[1.6] border-l border-sand/10 pl-5",
                    )}
                  >
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        <section
          className="bg-deep-forest px-6 py-24 md:px-16 md:py-32"
          aria-label="Get in touch"
        >
          <div className="mx-auto max-w-3xl text-center">
            <p
              className={cn(
                aboutRevealDelay(0),
                "label-text mb-4 tracking-[0.2em] text-sand/60 text-[11px]",
              )}
            >
              Come visit
            </p>
            <h2
              className={cn(
                aboutRevealDelay(1),
                "headline-primary text-warm-white leading-[1.1] text-balance text-3xl md:text-5xl",
              )}
            >
              Ready to make something with us?
            </h2>
            <p
              className={cn(
                aboutRevealDelay(2),
                "body-text text-ivory/70 mt-6 text-lg leading-[1.7]",
              )}
            >
              Whether you&rsquo;re planning a tracking day or an immersive
              residency, we&rsquo;d love to hear about the project.
            </p>
            <div
              className={cn(
                aboutRevealDelay(3),
                "mt-10 flex flex-wrap items-center justify-center gap-6",
              )}
            >
              <Link
                href="/#artist-inquiries"
                className="label-text tracking-[0.2em] text-[11px] text-sand border-b border-sand/60 pb-1 transition-colors hover:text-warm-white hover:border-warm-white"
              >
                Start a conversation
              </Link>
              <Link
                href="/#the-space"
                className="label-text tracking-[0.2em] text-[11px] text-ivory/60 border-b border-ivory/20 pb-1 transition-colors hover:text-sand hover:border-sand/50"
              >
                Tour the studio
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
