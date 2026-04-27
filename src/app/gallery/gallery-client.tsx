"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";

import { Header } from "@/components/header";
import { PageHeader } from "@/components/page-header";
import { SiteFooter } from "@/components/site-footer";
import type { GalleryPhoto } from "@/components/the-space";
import { useScrollAndReveal } from "@/hooks/use-scroll-and-reveal";
import { revealDelay } from "@/lib/reveal-delay";
import {
  isGalleryPageEnabled,
  isHomepagePricingSectionEnabled,
  type MarketingFeatureFlags,
} from "@/lib/site-settings";
import { cn } from "@/lib/utils";

/**
 * Public Gallery page (INF-47).
 *
 * Variant A "Cinematic Editorial" masonry grid + lightbox combined with the
 * Variant C header pattern (eyebrow + title + category filter pills).
 *
 * Background normalization: Variant A's gallery sits on `bg-deep-forest`
 * while the Variant C header bar uses `bg-charcoal`. We pick a single
 * coherent treatment — `bg-deep-forest` for the section, with the filter
 * pills sitting in a `bg-charcoal/60` capsule so the segmented control
 * still reads cleanly against the forest ground.
 *
 * Media: the data model and lightbox both anticipate video items
 * (`item.kind === "video"`) so a future admin upload tray for video files
 * (HTML5 `<video>` with poster + controls) drops in without changing this
 * component. Today only images are uploaded from `/admin/photos`.
 */

const FILTER_PILLS = [
  { id: "all", label: "All" },
  { id: "rooms", label: "Rooms" },
  { id: "gear", label: "Gear" },
  { id: "grounds", label: "Grounds" },
] as const;

type FilterId = (typeof FILTER_PILLS)[number]["id"];

type GalleryItem = {
  readonly id: string;
  readonly kind: "image" | "video";
  /** Resolved HTTPS URL for the asset (`null` when storage blob is missing). */
  readonly src: string | null;
  /** Optional poster URL for `kind === "video"`. */
  readonly poster: string | null;
  readonly alt: string;
  readonly caption: string | null;
  readonly width: number | null;
  readonly height: number | null;
  /** Lower-case category slugs the photo opted into; empty = uncategorized. */
  readonly categories: readonly string[];
  readonly contentType: string;
};

/**
 * Variant A masonry grid spans. Repeats every 9 cells so a long gallery
 * still varies in rhythm without authoring a per-image span. The first
 * slot is the largest (LCP candidate); columns fall back to 1×1 on small
 * viewports.
 */
const GRID_PATTERN: ReadonlyArray<{ span: string }> = [
  { span: "md:col-span-2 md:row-span-2" },
  { span: "md:col-span-1 md:row-span-1" },
  { span: "md:col-span-1 md:row-span-1" },
  { span: "md:col-span-1 md:row-span-2" },
  { span: "md:col-span-2 md:row-span-1" },
  { span: "md:col-span-1 md:row-span-1" },
  { span: "md:col-span-2 md:row-span-1" },
  { span: "md:col-span-1 md:row-span-1" },
  { span: "md:col-span-1 md:row-span-1" },
];

function classifyKind(contentType: string): "image" | "video" {
  return contentType.startsWith("video/") ? "video" : "image";
}

function toGalleryItems(photos: readonly GalleryPhoto[]): GalleryItem[] {
  return photos.map((photo) => ({
    id: photo.stableId,
    kind: classifyKind(photo.contentType),
    src: photo.url,
    poster: null,
    alt: photo.alt,
    caption: photo.caption,
    width: photo.width,
    height: photo.height,
    categories: photo.categories ?? [],
    contentType: photo.contentType,
  }));
}

function filterItems(
  items: readonly GalleryItem[],
  filter: FilterId,
): GalleryItem[] {
  if (filter === "all") return [...items];
  return items.filter((item) => item.categories.includes(filter));
}

interface GalleryClientProps {
  readonly photos: readonly GalleryPhoto[];
  readonly marketing: MarketingFeatureFlags;
  /** Optional banner slot (preview routes), aligned with `HomepageShell`. */
  readonly banner?: React.ReactNode;
}

export function GalleryClient({
  photos,
  marketing,
  banner,
}: GalleryClientProps) {
  const { scrollY, containerRef } = useScrollAndReveal();
  const pathname = usePathname();
  const isPreview =
    pathname === "/preview" || pathname.startsWith("/preview/");
  const aboutHref = isPreview ? "/preview/about" : "/about";
  const homeSectionBase = isPreview ? "/preview" : "/";
  const recordingsNavHref = isPreview ? "/preview/recordings" : "/recordings";
  const showPricing = isHomepagePricingSectionEnabled(marketing);
  const showAbout = marketing.aboutPage === true;
  const showRecordings = marketing.recordingsPage === true;
  const showGallery = isGalleryPageEnabled(marketing);

  const items = useMemo(() => toGalleryItems(photos), [photos]);
  const [filter, setFilter] = useState<FilterId>("all");
  const visibleItems = useMemo(() => filterItems(items, filter), [items, filter]);

  // Lightbox state — `activeIndex` indexes into `visibleItems` so prev/next
  // honors the current filter.
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  /** Scroll Y captured when the lightbox opens; ref avoids ref-callback ↔ state loops. */
  const lockedScrollYRef = useRef(0);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const isOpen = activeIndex !== null;
  const activeItem =
    activeIndex !== null ? (visibleItems[activeIndex] ?? null) : null;

  const closeLightbox = useCallback(() => {
    setActiveIndex(null);
  }, []);

  const showPrev = useCallback(() => {
    setActiveIndex((current) => {
      if (current === null) return current;
      return current > 0 ? current - 1 : visibleItems.length - 1;
    });
  }, [visibleItems.length]);

  const showNext = useCallback(() => {
    setActiveIndex((current) => {
      if (current === null) return current;
      return (current + 1) % visibleItems.length;
    });
  }, [visibleItems.length]);

  // Ref-callback for the overlay handles three concerns without `useEffect`:
  //   1. lock body scroll while the lightbox is open (and pin the page so
  //      iOS doesn't bounce-scroll behind the overlay),
  //   2. move focus into the overlay so screen readers + keyboard users
  //      land in the dialog,
  //   3. restore focus + scroll position on close.
  const overlayRefCallback = useCallback(
    (node: HTMLDivElement | null) => {
      overlayRef.current = node;
      if (typeof document === "undefined") return;
      if (node) {
        previousFocusRef.current =
          (document.activeElement as HTMLElement | null) ?? null;
        const offsetY = window.scrollY;
        lockedScrollYRef.current = offsetY;
        document.body.style.position = "fixed";
        document.body.style.top = `-${offsetY}px`;
        document.body.style.left = "0";
        document.body.style.right = "0";
        document.body.style.width = "100%";
        node.focus({ preventScroll: true });
      } else {
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.left = "";
        document.body.style.right = "";
        document.body.style.width = "";
        window.scrollTo(0, lockedScrollYRef.current);
        if (previousFocusRef.current) {
          previousFocusRef.current.focus({ preventScroll: true });
        }
      }
    },
    [],
  );

  const handleOverlayKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!isOpen) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeLightbox();
        return;
      }
      if (visibleItems.length <= 1) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        showNext();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        showPrev();
      }
    },
    [closeLightbox, isOpen, showNext, showPrev, visibleItems.length],
  );

  const handleSelectFilter = useCallback((next: FilterId) => {
    setFilter(next);
    // Filter changes invalidate the active index — close the lightbox so we
    // never end up displaying an item that's no longer visible.
    setActiveIndex(null);
  }, []);

  const handleOpenAt = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  return (
    <div
      ref={containerRef}
      className="dark relative min-h-screen bg-deep-forest text-ivory grain-overlay"
    >
      {banner}
      <Header
        scrollY={scrollY}
        showPricing={showPricing}
        showAbout={showAbout}
        aboutHref={aboutHref}
        showRecordings={showRecordings}
        showGallery={showGallery}
        homeSectionBase={homeSectionBase}
        recordingsHref={recordingsNavHref}
      />

      <main>
        <PageHeader
          eyebrow="Gallery"
          title="The Facility"
          meta="Rooms · Gear · Grounds"
          backHref={isPreview ? "/preview" : "/"}
          titleId="gallery-title"
          aside={
            <CategoryFilter filter={filter} onChange={handleSelectFilter} />
          }
        />

        <section
          className="relative bg-deep-forest px-6 pb-20 pt-10 md:px-16 md:pb-32 md:pt-12"
          aria-label="Gallery grid"
        >
          <div className="mx-auto max-w-7xl">
            <GalleryCount count={visibleItems.length} />
            {visibleItems.length === 0 ? (
              <EmptyState
                hasAnyPhotos={items.length > 0}
                filterLabel={
                  FILTER_PILLS.find((pill) => pill.id === filter)?.label ?? null
                }
                onClearFilter={() => handleSelectFilter("all")}
              />
            ) : (
              <MasonryGrid items={visibleItems} onOpenAt={handleOpenAt} />
            )}
          </div>
        </section>

        <section
          className="bg-deep-forest px-6 py-24 md:px-16 md:py-32"
          aria-label="Visit the studio"
        >
          <div className="mx-auto max-w-3xl border-t border-sand/10 pt-16 text-center">
            <p
              className={cn(
                revealDelay(0),
                "label-text mb-4 text-[11px] tracking-[0.2em] text-sand/60",
              )}
            >
              Come visit
            </p>
            <h2
              className={cn(
                revealDelay(1),
                "headline-primary text-balance text-3xl leading-[1.1] text-warm-white md:text-5xl",
              )}
            >
              See it in person
            </h2>
            <p
              className={cn(
                revealDelay(2),
                "body-text mt-6 text-lg leading-[1.7] text-ivory/70",
              )}
            >
              Photographs only go so far. Schedule a tour or book a tracking
              day and let the room speak for itself.
            </p>
            <div
              className={cn(
                revealDelay(3),
                "mt-10 flex flex-wrap items-center justify-center gap-6",
              )}
            >
              <Link
                href={`${isPreview ? "/preview" : "/"}#artist-inquiries`}
                className="label-text border-b border-sand/60 pb-1 text-[11px] tracking-[0.2em] text-sand transition-colors hover:border-warm-white hover:text-warm-white"
              >
                Start a conversation
              </Link>
              <Link
                href={`${isPreview ? "/preview" : "/"}#equipment-specs`}
                className="label-text border-b border-ivory/20 pb-1 text-[11px] tracking-[0.2em] text-ivory/60 transition-colors hover:border-sand/50 hover:text-sand"
              >
                View gear list
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />

      {isOpen && activeItem ? (
        <div
          ref={overlayRefCallback}
          role="dialog"
          aria-modal="true"
          aria-label={activeItem.alt || "Gallery image"}
          tabIndex={-1}
          onClick={closeLightbox}
          onKeyDown={handleOverlayKeyDown}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-deep-forest/95 p-4 outline-none backdrop-blur-xl md:p-12"
        >
          <button
            type="button"
            aria-label="Close gallery"
            onClick={(event) => {
              event.stopPropagation();
              closeLightbox();
            }}
            className="absolute right-4 top-4 text-ivory/55 transition-colors hover:text-warm-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sand/60 md:right-6 md:top-6"
          >
            <svg
              className="size-7 md:size-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.25}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div
            className="relative flex w-full items-center justify-center gap-2 md:gap-6"
            onClick={(event) => event.stopPropagation()}
          >
            {visibleItems.length > 1 ? (
              <button
                type="button"
                aria-label="Previous gallery item"
                onClick={(event) => {
                  event.stopPropagation();
                  showPrev();
                }}
                className="flex-shrink-0 text-ivory/45 transition-colors hover:text-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sand/60"
              >
                <svg
                  className="size-9 md:size-10"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            ) : null}

            <div className="flex min-w-0 max-w-5xl flex-1 items-center justify-center">
              <LightboxMedia item={activeItem} />
            </div>

            {visibleItems.length > 1 ? (
              <button
                type="button"
                aria-label="Next gallery item"
                onClick={(event) => {
                  event.stopPropagation();
                  showNext();
                }}
                className="flex-shrink-0 text-ivory/45 transition-colors hover:text-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sand/60"
              >
                <svg
                  className="size-9 md:size-10"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            ) : null}
          </div>

          <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-2 px-6 text-center">
            {activeItem.caption ? (
              <p className="body-text-small max-w-xl text-ivory/70">
                {activeItem.caption}
              </p>
            ) : null}
            <p className="label-text text-[10px] tracking-[0.2em] text-ivory/35">
              {(activeIndex ?? 0) + 1} / {visibleItems.length}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

interface CategoryFilterProps {
  readonly filter: FilterId;
  readonly onChange: (next: FilterId) => void;
}

function CategoryFilter({ filter, onChange }: CategoryFilterProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Filter gallery by category"
      className={cn(
        revealDelay(2),
        "inline-flex flex-wrap items-center gap-1 rounded-sm bg-charcoal/60 p-1",
      )}
    >
      {FILTER_PILLS.map((pill) => {
        const isActive = pill.id === filter;
        return (
          <button
            key={pill.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(pill.id)}
            className={cn(
              "label-text rounded-sm px-3 py-2 text-[10px] tracking-[0.2em] transition-colors duration-300",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sand/60",
              isActive
                ? "bg-sand/15 text-sand"
                : "text-ivory/45 hover:text-ivory/75",
            )}
          >
            {pill.label}
          </button>
        );
      })}
    </div>
  );
}

interface GalleryCountProps {
  readonly count: number;
}

/**
 * Live status line announcing how many gallery items match the current
 * filter. Rendered as an editorial footnote above the grid (right-aligned
 * on desktop) so it sits near the filter pills it relates to without
 * forcing the `PageHeader` aside slot to a multi-row layout.
 */
function GalleryCount({ count }: GalleryCountProps) {
  return (
    <p
      aria-live="polite"
      className="label-text text-[10px] tracking-[0.15em] text-ivory/35 md:text-right"
    >
      {count} {count === 1 ? "item" : "items"}
    </p>
  );
}

interface MasonryGridProps {
  readonly items: readonly GalleryItem[];
  readonly onOpenAt: (index: number) => void;
}

function MasonryGrid({ items, onOpenAt }: MasonryGridProps) {
  return (
    // No `.reveal` on the grid container or its tiles. The page-level
    // `IntersectionObserver` in `useScrollAndReveal` only observes nodes
    // that exist at first mount, so any `.reveal` ancestor we add here
    // stays at `opacity: 0` forever after the user toggles a filter that
    // unmounts the grid (e.g. a category with zero results) and toggles
    // back. Page chrome above already provides the editorial fade-in.
    //
    // `grid-flow-row-dense` lets the browser back-fill gaps left by wide
    // / tall tiles. Without it, a `col-span-2` item that lands when only
    // one column is free skips that slot, producing a visible blank cell
    // on the right edge.
    <ul
      className={cn(
        "mt-12 grid list-none auto-rows-[200px] grid-cols-1 gap-2 md:mt-16 md:auto-rows-[220px] md:grid-cols-4 md:grid-flow-row-dense",
      )}
    >
      {items.map((item, index) => {
        const span = GRID_PATTERN[index % GRID_PATTERN.length]?.span ?? "";
        // Per-tile `.reveal` is intentionally omitted: the parent container
        // already fades the whole grid in once via `revealDelay(3)`, and
        // the page-level `IntersectionObserver` only observes nodes that
        // exist at mount. If we re-applied `.reveal` here, switching
        // filters would mount fresh `<li>` nodes the observer never sees,
        // leaving them stuck at `opacity: 0` until a hard refresh.
        return (
          <li
            key={item.id}
            className={cn("group relative overflow-hidden", span)}
          >
            <GridTile item={item} index={index} onOpen={onOpenAt} />
          </li>
        );
      })}
    </ul>
  );
}

interface GridTileProps {
  readonly item: GalleryItem;
  readonly index: number;
  readonly onOpen: (index: number) => void;
}

function GridTile({ item, index, onOpen }: GridTileProps) {
  const sharedClasses =
    "relative block h-full w-full overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sand/60";

  // First tile is the LCP candidate at desktop spans 2×2 — prioritise it.
  const priority = index === 0;

  return (
    <button
      type="button"
      onClick={() => onOpen(index)}
      aria-label={
        item.kind === "video"
          ? `Open video: ${item.alt}`
          : `Open image: ${item.alt}`
      }
      className={sharedClasses}
    >
      {item.kind === "video" ? (
        <VideoTile item={item} priority={priority} />
      ) : (
        <ImageTile item={item} priority={priority} />
      )}
      <span className="pointer-events-none absolute inset-0 bg-deep-forest/0 transition-colors duration-500 group-hover:bg-deep-forest/40" />
      <span className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full p-3 text-left transition-transform duration-500 group-hover:translate-y-0">
        <span className="body-text-small block text-xs text-warm-white/90">
          {item.caption ?? item.alt}
        </span>
      </span>
      {item.kind === "video" ? (
        <span
          aria-hidden
          className="pointer-events-none absolute right-2 top-2 rounded-sm bg-washed-black/70 px-2 py-1 text-[9px] uppercase tracking-[0.2em] text-warm-white/85"
        >
          Video
        </span>
      ) : null}
    </button>
  );
}

function ImageTile({
  item,
  priority,
}: {
  readonly item: GalleryItem;
  readonly priority: boolean;
}) {
  if (!item.src) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-charcoal/60 text-ivory/45">
        <span className="body-text-small text-xs">Image unavailable</span>
      </div>
    );
  }
  return (
    <Image
      src={item.src}
      alt={item.alt}
      fill
      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
      className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
      quality={75}
      priority={priority}
      loading={priority ? "eager" : "lazy"}
    />
  );
}

function VideoTile({
  item,
  priority,
}: {
  readonly item: GalleryItem;
  readonly priority: boolean;
}) {
  if (!item.src) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-charcoal/60 text-ivory/45">
        <span className="body-text-small text-xs">Video unavailable</span>
      </div>
    );
  }
  return item.poster ? (
    <Image
      src={item.poster}
      alt={item.alt}
      fill
      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
      className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
      quality={75}
      priority={priority}
      loading={priority ? "eager" : "lazy"}
    />
  ) : (
    // Browsers won't autoplay a video without a poster on mobile; rendering
    // a non-autoplaying `<video preload="metadata">` is sufficient as a
    // thumbnail and complies with the "no annoying autoplay audio" rule.
    <video
      src={item.src}
      muted
      playsInline
      preload="metadata"
      aria-label={item.alt}
      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
    />
  );
}

function LightboxMedia({ item }: { readonly item: GalleryItem }) {
  if (!item.src) {
    return (
      <div className="flex aspect-[16/10] w-full items-center justify-center bg-charcoal/60 text-ivory/55">
        <span className="body-text-small">Media unavailable</span>
      </div>
    );
  }

  if (item.kind === "video") {
    return (
      <video
        src={item.src}
        controls
        playsInline
        preload="metadata"
        poster={item.poster ?? undefined}
        className="max-h-[80vh] w-full max-w-5xl bg-washed-black"
        aria-label={item.alt}
      />
    );
  }

  return (
    <div className="relative aspect-[16/10] w-full">
      <Image
        src={item.src}
        alt={item.alt}
        fill
        className="object-contain"
        quality={90}
        sizes="(max-width: 768px) 100vw, 90vw"
        priority
      />
    </div>
  );
}

interface EmptyStateProps {
  readonly hasAnyPhotos: boolean;
  readonly filterLabel: string | null;
  readonly onClearFilter: () => void;
}

function EmptyState({
  hasAnyPhotos,
  filterLabel,
  onClearFilter,
}: EmptyStateProps) {
  if (!hasAnyPhotos) {
    return (
      <div className="mt-16 border border-dashed border-sand/15 px-8 py-20 text-center">
        <p className="label-text text-[11px] tracking-[0.2em] text-sand/50">
          Gallery coming soon
        </p>
        <p className="body-text-small mx-auto mt-4 max-w-md text-ivory/55">
          We&rsquo;re finalising the first round of room, gear, and grounds
          photography. Check back shortly.
        </p>
      </div>
    );
  }
  return (
    <div className="mt-16 border border-dashed border-sand/15 px-8 py-16 text-center">
      <p className="label-text text-[11px] tracking-[0.2em] text-sand/50">
        Nothing tagged {filterLabel?.toLowerCase()} yet
      </p>
      <p className="body-text-small mx-auto mt-4 max-w-md text-ivory/55">
        Try another filter, or view every photo at once.
      </p>
      <button
        type="button"
        onClick={onClearFilter}
        className="label-text mt-6 border-b border-sand/60 pb-1 text-[11px] tracking-[0.2em] text-sand transition-colors hover:border-warm-white hover:text-warm-white"
      >
        Show all
      </button>
    </div>
  );
}
