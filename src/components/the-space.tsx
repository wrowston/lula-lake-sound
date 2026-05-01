"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import posthog from "posthog-js";

import { MotionReveal } from "@/components/motion-reveal";
import { StickySection } from "@/components/sticky-section";
import { Button } from "@/components/ui/button";
import { POSTHOG_EVENTS } from "@/lib/analytics-events";
import { PUBLIC_CONVEX_QUERY_FAILED } from "@/lib/use-public-convex-query";

export type GalleryPhoto = {
  stableId: string;
  url: string | null;
  alt: string;
  caption?: string | null;
  width: number | null;
  height: number | null;
  sortOrder: number;
  contentType?: string;
  sizeBytes?: number;
  originalFileName?: string | null;
  /**
   * INF-47 — controlled-vocabulary tags from `GALLERY_CATEGORY_SLUGS`
   * (`rooms` / `gear` / `grounds`). Drives the public `/gallery` page
   * filter pills. Empty when the photo is uncategorized; the homepage
   * carousel ignores this field.
   */
  categories?: readonly string[];
  /** Omitted in older payloads; treat as `true` when undefined. */
  showInCarousel?: boolean;
  showInGallery?: boolean;
};

function galleryImageAlt(alt: string): string {
  const trimmed = alt.trim();
  return trimmed.length > 0 ? trimmed : "Lula Lake Sound studio gallery photo";
}

function GallerySkeleton() {
  return (
    <div className="space-y-12">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="relative h-[60vh] w-full animate-pulse bg-ivory/[0.04] md:h-[70vh]"
          aria-hidden
        />
      ))}
    </div>
  );
}

/**
 * Mobile-only carousel: single image with thumbnail dots and prev/next.
 * Used below `lg` where there is not enough vertical space for the
 * sticky-stack layout to feel right.
 */
function MobileCarousel({ photos }: { photos: GalleryPhoto[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const safeIndex = Math.min(currentIndex, photos.length - 1);
  const currentPhoto = photos[safeIndex];

  const goToImage = (index: number) => setCurrentIndex(index);
  const goToPrevious = () =>
    setCurrentIndex((prev) =>
      prev === 0 ? photos.length - 1 : prev - 1,
    );
  const goToNext = () =>
    setCurrentIndex((prev) => (prev + 1) % photos.length);

  return (
    <div>
      <div className="relative flex h-[60vh] w-full items-center justify-center overflow-hidden">
        {photos.map((photo, index) =>
          photo.url ? (
            <Image
              key={photo.stableId}
              src={photo.url}
              alt={galleryImageAlt(photo.alt)}
              fill
              sizes="100vw"
              className={`absolute inset-0 object-contain transition-opacity duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                index === safeIndex
                  ? "z-[2] opacity-100"
                  : "pointer-events-none z-[1] opacity-0"
              }`}
              loading={index === 0 ? "eager" : "lazy"}
              quality={82}
              aria-hidden={index !== safeIndex}
            />
          ) : null,
        )}
        {!currentPhoto.url ? (
          <div className="absolute inset-0 z-[3] flex items-center justify-center bg-washed-black">
            <div className="body-text-small text-ivory/50">
              Image unavailable
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-8 flex flex-col gap-5 px-2">
        <div className="flex items-center justify-between gap-3">
          <div className="label-text text-[10px] text-ivory/55">
            <span className="text-sand">
              {String(safeIndex + 1).padStart(2, "0")}
            </span>
            <span className="mx-2 text-ivory/45">/</span>
            <span>{String(photos.length).padStart(2, "0")}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {photos.map((photo, index) => (
              <button
                key={photo.stableId}
                type="button"
                onClick={() => goToImage(index)}
                aria-label={`View image ${index + 1}`}
                className={`h-px transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  index === safeIndex
                    ? "w-8 bg-sand"
                    : "w-4 bg-ivory/22 hover:bg-ivory/40"
                }`}
              />
            ))}
          </div>
        </div>

        {photos.length > 1 ? (
          <div className="flex items-center justify-between gap-4 text-ivory/62">
            <button
              type="button"
              onClick={goToPrevious}
              aria-label="Previous image"
              className="label-text transition-colors duration-500 hover:text-sand"
            >
              ← Prev
            </button>
            <button
              type="button"
              onClick={goToNext}
              aria-label="Next image"
              className="label-text transition-colors duration-500 hover:text-sand"
            >
              Next →
            </button>
          </div>
        ) : null}
      </div>

      <div className="mt-10 flex w-full flex-col items-center text-center">
        <p className="body-text-small w-full max-w-xl text-ivory/80">
          {currentPhoto.caption?.trim().length
            ? currentPhoto.caption
            : "Carefully designed and acoustically treated to capture the perfect sound for your musical vision."}
        </p>
      </div>
    </div>
  );
}

/**
 * Single photo card in the sticky-scroll stack. Each photo crossfades
 * + slides up via `whileInView`, and gets a small parallax scrub
 * driven by its own scroll position so the stack feels alive even
 * before it leaves the viewport.
 */
function StackPhoto({
  photo,
  index,
  total,
}: {
  photo: GalleryPhoto;
  index: number;
  total: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  return (
    <motion.figure
      ref={ref}
      initial={{ opacity: 0, y: 64, filter: "blur(10px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
      className="relative"
    >
      <div className="relative h-[68vh] w-full overflow-hidden bg-washed-black md:h-[78vh]">
        {photo.url ? (
          <motion.div className="absolute inset-0" style={{ y: imageY }}>
            <Image
              src={photo.url}
              alt={galleryImageAlt(photo.alt)}
              fill
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover"
              loading={index === 0 ? "eager" : "lazy"}
              quality={82}
            />
          </motion.div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-washed-black">
            <div className="body-text-small text-ivory/50">
              Image unavailable
            </div>
          </div>
        )}
      </div>
      <figcaption className="mt-5 flex items-baseline justify-between gap-6">
        <span className="label-text text-[10px] text-ivory/55">
          <span className="text-sand">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="mx-2 text-ivory/45">/</span>
          <span>{String(total).padStart(2, "0")}</span>
        </span>
        <p className="body-text-small max-w-md text-right text-ivory/72">
          {photo.caption?.trim().length
            ? photo.caption
            : "Carefully treated to capture every nuance."}
        </p>
      </figcaption>
    </motion.figure>
  );
}

function StickyAside() {
  return (
    <div className="space-y-8">
      <MotionReveal variant="fade" duration={0.7}>
        <Image
          src="/Logos/Graphic/LLS_Logo_Graphic_Sand.png"
          alt=""
          width={200}
          height={200}
          aria-hidden
          className="h-12 w-auto opacity-80 md:h-14"
        />
      </MotionReveal>
      <MotionReveal variant="rise" delay={0.05}>
        <p className="eyebrow text-sand/82">Explore</p>
      </MotionReveal>
      <MotionReveal variant="rise-blur" duration={1.1} delay={0.12}>
        <h2 className="headline-primary text-[2.25rem] text-warm-white md:text-[3rem] lg:text-[3.5rem]">
          The Space
        </h2>
      </MotionReveal>
      <MotionReveal variant="rule" duration={1.1} delay={0.32}>
        <span className="block h-px w-24 bg-sand/45" />
      </MotionReveal>
      <MotionReveal variant="rise" duration={0.95} delay={0.42}>
        <p className="editorial-lede max-w-md text-ivory/86">
          Step inside our carefully designed recording facility where
          world-class equipment meets natural inspiration. Every room is
          optimized for capturing the perfect sound while maintaining the
          comfort that fuels creativity.
        </p>
      </MotionReveal>
    </div>
  );
}

export function TheSpace({
  photos,
}: {
  photos:
    | GalleryPhoto[]
    | null
    | undefined
    | typeof PUBLIC_CONVEX_QUERY_FAILED;
}) {
  const isLoading = photos === undefined;
  const isError = photos === PUBLIC_CONVEX_QUERY_FAILED;
  const availablePhotos =
    photos === undefined ||
    photos === null ||
    photos === PUBLIC_CONVEX_QUERY_FAILED
      ? []
      : photos;

  const galleryContent = isLoading ? (
    <GallerySkeleton />
  ) : isError ? (
    <div className="flex min-h-[40vh] w-full items-center justify-center overflow-hidden border border-sand/10 bg-washed-black px-6 py-20 md:min-h-[50vh]">
      <div className="body-text-small max-w-md text-center text-ivory/78">
        We couldn&rsquo;t load the gallery preview. Your connection or our
        servers may be having a moment. Try refreshing the page in a little
        while.
      </div>
    </div>
  ) : availablePhotos.length === 0 ? (
    <div className="flex h-[60vh] w-full items-center justify-center overflow-hidden border border-sand/10 bg-washed-black md:h-[72vh]">
      <div className="body-text-small text-ivory/78 px-6 text-center max-w-md">
        Photo carousel is not published yet. New images will appear here when
        they go live.
      </div>
    </div>
  ) : (
    <>
      {/* Mobile: traditional carousel. */}
      <div className="lg:hidden">
        <MobileCarousel photos={availablePhotos} />
      </div>
      {/* lg+: vertical sticky-scroll stack with parallax photos. */}
      <div className="hidden space-y-24 lg:block">
        {availablePhotos.map((photo, index) => (
          <StackPhoto
            key={photo.stableId}
            photo={photo}
            index={index}
            total={availablePhotos.length}
          />
        ))}
      </div>
    </>
  );

  return (
    <StickySection
      id="the-space"
      sectionClassName="bg-washed-black"
      background={
        <>
          <div className="absolute inset-0 bg-texture-canvas opacity-14" />
          <div
            aria-hidden
            className="parallax-soft absolute inset-0 bg-chladni-1-2"
          />
          <div
            aria-hidden
            className="section-fade-bottom section-fade-bottom--forest"
          />
        </>
      }
      aside={<StickyAside />}
      footer={
        <MotionReveal
          variant="rise-blur"
          duration={1}
          className="mt-12 flex w-full flex-col items-center border-y border-sand/15 py-16 text-center"
        >
          <p className="eyebrow mb-5 text-sand/78">Visit</p>
          <h3 className="headline-secondary mb-6 text-2xl text-warm-white md:text-[1.75rem]">
            Experience the Studio
          </h3>
          <p className="body-text mx-auto mb-10 w-full max-w-xl text-ivory/84">
            Schedule a studio tour or start planning your recording session.
            We&apos;d love to show you around and discuss how our space can
            serve your vision.
          </p>
          <div className="flex w-full flex-col items-center gap-4 sm:w-auto sm:flex-row sm:justify-center">
            <Button
              variant="default"
              size="lg"
              onClick={() => {
                posthog.capture(POSTHOG_EVENTS.PRICING_BOOK_SESSION_CLICK, {
                  location: "the-space",
                });
                document
                  .getElementById("artist-inquiries")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Book Your Session
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={() =>
                document
                  .getElementById("equipment-specs")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              View Equipment
            </Button>
          </div>
        </MotionReveal>
      }
    >
      {galleryContent}
    </StickySection>
  );
}
