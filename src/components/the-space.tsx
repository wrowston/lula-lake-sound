"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export type GalleryPhoto = {
  stableId: string;
  url: string | null;
  alt: string;
  caption: string | null;
  width: number | null;
  height: number | null;
  sortOrder: number;
  contentType: string;
  sizeBytes: number;
  originalFileName: string | null;
};

function galleryImageAlt(alt: string): string {
  const t = alt.trim();
  return t.length > 0 ? t : "Lula Lake Sound studio gallery photo";
}

function GallerySkeleton() {
  return (
    <div className="reveal reveal-delay-2">
      <div className="relative">
        <div className="relative mx-auto w-full max-w-5xl">
          <div className="relative">
            <div className="relative flex h-[60vh] w-full items-center justify-center overflow-hidden md:h-[72vh]">
              <div className="body-text-small text-ivory/35">Loading gallery…</div>
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
          <div className="relative flex h-[60vh] w-full items-center justify-center overflow-hidden md:h-[72vh]">
            <div className="body-text-small text-ivory/35">No images available</div>
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
              {currentPhoto.url ? (
                <Image
                  key={currentPhoto.stableId}
                  src={currentPhoto.url}
                  alt={galleryImageAlt(currentPhoto.alt)}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
                  className="object-contain transition-opacity duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  priority={safeIndex === 0}
                  quality={82}
                />
              ) : (
                <div className="body-text-small text-ivory/35">Image unavailable</div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between px-2">
          <div className="label-text text-[10px] text-ivory/35">
            <span className="text-sand">
              {String(safeIndex + 1).padStart(2, "0")}
            </span>
            <span className="mx-2 text-ivory/25">/</span>
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
                    : "w-4 bg-ivory/15 hover:bg-ivory/30"
                }`}
              />
            ))}
          </div>

          {availablePhotos.length > 1 ? (
            <div className="flex items-center gap-4 text-ivory/40">
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
            <span className="w-20" aria-hidden />
          )}
        </div>
      </div>

      <div className="mt-10 flex w-full flex-col items-center text-center">
        <p className="body-text-small w-full max-w-xl text-ivory/50">
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
      className="relative overflow-hidden bg-washed-black px-6 py-24 md:py-32"
    >
      <div className="absolute inset-0 bg-texture-stone opacity-30" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="reveal mb-16 flex w-full flex-col items-center text-center">
          <p className="label-text mb-4 text-sand/60">Explore</p>
          <h2 className="headline-primary mb-6 text-3xl text-warm-white md:text-4xl lg:text-5xl">
            The Space
          </h2>
          <div className="section-rule mb-8 w-full max-w-xs" />
          <p className="body-text w-full max-w-2xl text-lg text-ivory/60">
            Step inside our carefully designed recording facility where world-class
            equipment meets natural inspiration. Every room is optimized for
            capturing the perfect sound while maintaining the comfort that fuels
            creativity.
          </p>
        </div>

        <StudioGallery
          key={
            photos === undefined
              ? "__pending__"
              : (photos ?? []).map((p) => p.stableId).join("|")
          }
          photos={photos}
        />

        <div className="reveal reveal-delay-3 mt-16 flex w-full flex-col items-center border-t border-b border-sand/10 py-12 text-center">
          <h3 className="headline-secondary mb-4 text-2xl text-sand">
            Experience the Studio
          </h3>
          <p className="body-text mb-8 w-full max-w-xl text-ivory/50">
            Schedule a studio tour or start planning your recording session.
            We&apos;d love to show you around and discuss how our space can serve your
            vision.
          </p>
          <div className="flex w-full flex-col items-center gap-4 sm:w-auto sm:flex-row sm:justify-center">
            <Button
              variant="default"
              size="lg"
              className="h-10 px-6"
              onClick={() =>
                document
                  .getElementById("artist-inquiries")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Book Your Session
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-10 px-6"
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
