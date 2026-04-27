"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { cn } from "@/lib/utils";

interface HeaderProps {
  readonly scrollY: number;
  readonly showPricing?: boolean;
  /**
   * INF-46 — hides the primary-nav "About" link (desktop + mobile) when the
   * CMS-controlled About page is disabled. Defaults to `false` so deploys
   * that forget to plumb the flag keep the new About page hidden rather
   * than quietly shipping a broken link.
   */
  readonly showAbout?: boolean;
  /**
   * Public marketing About URL, or `/preview/about` when the shell is mounted
   * under owner preview so draft visibility does not send users to a gated
   * `/about` 404 before publish.
   */
  readonly aboutHref?: string;
  /**
   * INF-48 — shows the primary-nav "Recordings" link (desktop + mobile) when
   * the public `/recordings` page is available. Defaults to `false` so
   * callers that haven't opted in yet keep the link out of the nav.
   */
  readonly showRecordings?: boolean;
  /**
   * Base path for in-page section links (`#the-space`, etc.). Use `"/preview"`
   * when the header is shown under owner preview so nav stays on draft routes.
   * Defaults to `"/"` — links become `"/#id"`.
   */
  readonly homeSectionBase?: string;
  /**
   * Recordings nav href — `"/preview/recordings"` in preview, otherwise
   * `"/recordings"`.
   */
  readonly recordingsHref?: string;
}

/**
 * Marketing-site header.
 *
 * Editorial rule line under a minimal mark-and-nav bar. No pill morph, no
 * backdrop-blur glassmorphism — the background fades from transparent to a
 * near-opaque washed-black wash once the user has committed to scrolling so
 * the nav text stays legible against hero imagery.
 */
export function Header({
  scrollY,
  showPricing = false,
  showAbout = false,
  aboutHref = "/about",
  showRecordings = false,
  homeSectionBase = "/",
  recordingsHref = "/recordings",
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const progress = Math.min(scrollY / 140, 1);
  const baseBg = `rgba(31, 30, 28, ${Math.min(0.9, progress * 0.9)})`;

  function handleNavigation() {
    setIsMobileMenuOpen(false);
  }

  function handleLogoClick() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  type NavItem =
    | { kind: "route"; key: string; href: string; label: string }
    | { kind: "hash"; id: string; label: string };

  const navigationItems: NavItem[] = [
    ...(showAbout
      ? [
          {
            kind: "route" as const,
            key: "about",
            href: aboutHref,
            label: "About",
          },
        ]
      : []),
    { kind: "hash", id: "the-space", label: "The Studio" },
    {
      kind: "route",
      key: "gallery",
      // `homeSectionBase` is `"/preview"` when the header is mounted under
      // owner preview, otherwise `"/"`. Mirror that for the Gallery route.
      href:
        homeSectionBase === "/preview" ? "/preview/gallery" : "/gallery",
      label: "Gallery",
    },
    { kind: "hash", id: "equipment-specs", label: "Gear" },
    ...(showRecordings
      ? [
          {
            kind: "route" as const,
            key: "recordings",
            href: recordingsHref,
            label: "Recordings",
          },
        ]
      : []),
    ...(showPricing
      ? [{ kind: "hash" as const, id: "services-pricing", label: "Pricing" }]
      : []),
    { kind: "hash", id: "local-favorites", label: "Nearby" },
    { kind: "hash", id: "faq", label: "FAQ" },
    { kind: "hash", id: "artist-inquiries", label: "Contact" },
  ];

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-colors duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ backgroundColor: baseBg }}
      >
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5 md:px-12 md:py-6">
          <button
            onClick={handleLogoClick}
            aria-label="Lula Lake Sound — back to top"
            className="flex items-center text-sand transition-opacity duration-500 hover:opacity-80"
          >
            <Image
              src="/Logos/Wordmark/LLS_Logo_Text_Sand.png"
              alt=""
              width={1024}
              height={135}
              className="h-8 w-auto max-w-[min(100%,260px)] object-contain object-left md:h-9 md:max-w-[min(100%,300px)]"
              priority
            />
          </button>

          <nav
            aria-label="Primary"
            className="hidden items-center gap-8 lg:flex"
          >
            {navigationItems.map((item) =>
              item.kind === "route" ? (
                <Link
                  key={item.key}
                  href={item.href}
                  className="label-text group relative text-[10.5px] text-ivory/55 transition-colors duration-500 hover:text-sand"
                >
                  {item.label}
                  <span className="absolute -bottom-1 left-0 h-px w-0 bg-sand transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-full" />
                </Link>
              ) : (
                <a
                  key={item.id}
                  href={`${homeSectionBase}#${item.id}`}
                  className="label-text group relative text-[10.5px] text-ivory/55 transition-colors duration-500 hover:text-sand"
                >
                  {item.label}
                  <span className="absolute -bottom-1 left-0 h-px w-0 bg-sand transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-full" />
                </a>
              ),
            )}
          </nav>

          <button
            className="lg:hidden text-ivory/70 transition-colors hover:text-sand"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen((v) => !v)}
          >
            <svg
              className="size-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.25}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.25}
                  d="M4 7h16M4 12h16M4 17h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Editorial rule — fades in as the header becomes opaque. */}
        <div
          className="mx-auto h-px max-w-7xl px-6 transition-opacity duration-700 md:px-12"
          style={{ opacity: progress }}
        >
          <div className="h-px w-full bg-sand/15" />
        </div>
      </header>

      {/* Mobile menu — full-bleed editorial overlay, no glassmorphism. */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-washed-black/95"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div
            className={cn(
              "absolute inset-x-0 top-[68px] border-t border-sand/12 bg-washed-black",
              "px-6 pb-10 pt-10",
            )}
          >
            <p className="eyebrow mb-8 text-sand/50">Menu</p>
            <nav className="flex flex-col divide-y divide-sand/10">
              {navigationItems.map((item) =>
                item.kind === "route" ? (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={handleNavigation}
                    className="headline-secondary py-5 text-2xl text-ivory/85 transition-colors duration-500 hover:text-sand"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    key={item.id}
                    href={`${homeSectionBase}#${item.id}`}
                    onClick={handleNavigation}
                    className="headline-secondary py-5 text-2xl text-ivory/85 transition-colors duration-500 hover:text-sand"
                  >
                    {item.label}
                  </a>
                ),
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
