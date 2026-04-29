"use client";

import Image from "next/image";
import { useState } from "react";

import { Button } from "@/components/ui/button";

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
    <div className="reveal reveal-delay-2">
      <div className="relative">
        <div className="relative mx-auto w-full max-w-5xl">
          <div className="relative">
            <div className="relative flex h-[60vh] w-full items-center justify-center overflow-hidden md:h-[72vh]">
              <div className="body-text-small text-ivory/50">Loading gallery...</div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-10 flex w-full flex-col items-center text-center" aria-hidden>
        <div className="h-3.5 w-full max-w-xl animate-pulse rounded bg-ivory/[0.06]" />
      </div>
    </div>
  );
}

function StudioGallery({
  photos,
}: {
  photos: GalleryPhoto[] | null | undefined;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const isLoading = photos === undefined;
  const availablePhotos = photos ?? [];

  if (isLoading) {
    return <GallerySkeleton />;
  }

  if (availablePhotos.length === 0) {
    return (
      <div className="reveal reveal-delay-2">
        <div className="relative mx-auto w-full max-w-5xl">
          <div className="relative flex h-[60vh] w-full items-center justify-center overflow-hidden border border-sand/10 bg-washed-black md:h-[72vh]">
            <div className="body-text-small text-ivory/50">No images available</div>
          </div>
        </div>
      </div>
    );
  }

  const safeIndex = Math.min(currentIndex, availablePhotos.length - 1);
  const currentPhoto = availablePhotos[safeIndex];

  const goToImage = (index: number) => setCurrentIndex(index);
  const goToPrevious = () =>
    setCurrentIndex((prev) =>
      prev === 0 ? availablePhotos.length - 1 : prev - 1,
    );
  const goToNext = () =>
    setCurrentIndex((prev) => (prev + 1) % availablePhotos.length);

  return (
    <div className="reveal reveal-delay-2">
      <div className="relative">
        <div className="relative mx-auto w-full max-w-5xl">
          <div className="relative">
            <div className="relative flex h-[60vh] w-full items-center justify-center overflow-hidden md:h-[72vh]">
              {availablePhotos.map((photo, index) =>
                photo.url ? (
                  <Image
                    key={photo.stableId}
                    src={photo.url}
                    alt={galleryImageAlt(photo.alt)}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
                    className={`absolute inset-0 object-contain transition-opacity duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      index === safeIndex
                        ? "z-[2] opacity-100"
                        : "pointer-events-none z-[1] opacity-0"
                    }`}
                    priority={index === 0}
                    loading={index === 0 ? undefined : "lazy"}
                    quality={82}
                    aria-hidden={index !== safeIndex}
                  />
                ) : null,
              )}
              {!currentPhoto.url ? (
                <div className="absolute inset-0 z-[3] flex items-center justify-center bg-washed-black">
                  <div className="body-text-small text-ivory/50">Image unavailable</div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-5 px-2 md:flex-row md:items-center md:justify-between md:gap-0">
          <div className="flex items-center justify-between gap-3 md:contents">
            <div className="label-text text-[10px] text-ivory/55">
              <span className="text-sand">
                {String(safeIndex + 1).padStart(2, "0")}
              </span>
              <span className="mx-2 text-ivory/45">/</span>
              <span>{String(availablePhotos.length).padStart(2, "0")}</span>
            </div>

            <div className="flex items-center gap-1.5">
              {availablePhotos.map((photo, index) => (
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

          {availablePhotos.length > 1 ? (
            <div className="flex items-center justify-between gap-4 text-ivory/62 md:justify-end">
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
          ) : (
            <span className="hidden w-20 md:block" aria-hidden />
          )}
        </div>
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

export function TheSpace({
  photos,
}: {
  photos: GalleryPhoto[] | null | undefined;
}) {
  return (
    <section
      id="the-space"
      className="relative overflow-hidden bg-washed-black px-6 py-28 md:py-40"
    >
      <div className="absolute inset-0 bg-texture-canvas opacity-14" />
      {/* Chladni 1.2 resonance plate anchored to the bottom-right. Brand
       * guide pg 26: "Chladni 1.2 Overlayed on Washed Black Canvas." */}
      <div aria-hidden className="absolute inset-0 bg-chladni-1-2" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="reveal mb-20 flex w-full flex-col items-center text-center">
          <Image
            src="/Logos/Graphic/LLS_Logo_Graphic_Sand.png"
            alt=""
            width={200}
            height={200}
            aria-hidden
            className="mb-10 h-12 w-auto opacity-80 md:h-14"
          />
          <p className="eyebrow mb-6 text-sand/82">Explore</p>
          <h2 className="headline-primary mb-8 text-[2.25rem] text-warm-white md:text-[3rem] lg:text-[3.5rem]">
            The Space
          </h2>
          <div className="section-rule mb-10 w-full max-w-[9rem]" />
          <p className="editorial-lede w-full max-w-2xl font-normal text-ivory/92">
            Step inside our carefully designed recording facility where
            world-class equipment meets natural inspiration. Every room is
            optimized for capturing the perfect sound while maintaining the
            comfort that fuels creativity.
          </p>
        </div>

        <StudioGallery
          key={
            photos === undefined
              ? "__pending__"
              : (photos ?? []).map((photo) => photo.stableId).join("|")
          }
          photos={photos}
        />

        <div className="reveal reveal-delay-3 mt-24 flex w-full flex-col items-center border-y border-sand/15 py-16 text-center">
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
              onClick={() =>
                document
                  .getElementById("artist-inquiries")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
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
        </div>
      </div>
    </section>
  );
}
