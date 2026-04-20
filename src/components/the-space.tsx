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

function StudioGallery({
  photos,
}: {
  photos: GalleryPhoto[] | null | undefined;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (photos === undefined) {
    return (
      <div className="relative overflow-hidden border border-sand/10 bg-washed-black">
        <div className="flex h-[55vh] items-center justify-center md:h-[65vh]">
          <div className="body-text-small text-ivory/40">Loading gallery...</div>
        </div>
      </div>
    );
  }

  const availablePhotos = photos ?? [];
  if (availablePhotos.length === 0) {
    return (
      <div className="relative overflow-hidden border border-sand/10 bg-washed-black">
        <div className="flex h-[55vh] items-center justify-center md:h-[65vh]">
          <div className="body-text-small text-ivory/40">No images available</div>
        </div>
      </div>
    );
  }

  const safeIndex = Math.min(currentIndex, availablePhotos.length - 1);
  const currentPhoto = availablePhotos[safeIndex];

  const goToPrevious = () =>
    setCurrentIndex((prev) =>
      prev === 0 ? availablePhotos.length - 1 : prev - 1,
    );
  const goToNext = () =>
    setCurrentIndex((prev) => (prev + 1) % availablePhotos.length);

  return (
    <div className="reveal reveal-delay-2">
      <div className="group relative">
        <div className="relative mx-auto w-full max-w-5xl">
          <div className="relative overflow-hidden border border-sand/10 bg-washed-black">
            <div className="relative flex h-[55vh] w-full items-center justify-center md:h-[65vh]">
              {currentPhoto.url ? (
                <Image
                  src={currentPhoto.url}
                  alt={currentPhoto.alt}
                  fill
                  unoptimized
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 1200px"
                />
              ) : (
                <div className="body-text-small text-ivory/40">
                  Image unavailable
                </div>
              )}
            </div>

            <div className="label-text absolute right-4 bottom-4 bg-washed-black/60 px-3 py-1.5 text-[10px] text-ivory/40 backdrop-blur-sm">
              {safeIndex + 1} / {availablePhotos.length}
            </div>
          </div>
        </div>

        {availablePhotos.length > 1 ? (
          <>
            <button
              onClick={goToPrevious}
              className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full border border-sand/10 bg-washed-black/60 p-2.5 text-ivory/60 opacity-0 transition-all duration-300 group-hover:opacity-100 hover:bg-washed-black/80 hover:text-sand"
              aria-label="Previous photo"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={goToNext}
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full border border-sand/10 bg-washed-black/60 p-2.5 text-ivory/60 opacity-0 transition-all duration-300 group-hover:opacity-100 hover:bg-washed-black/80 hover:text-sand"
              aria-label="Next photo"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        ) : null}
      </div>

      <div className="mt-6 flex justify-center gap-1.5">
        {availablePhotos.map((photo, index) => (
          <button
            key={photo.stableId}
            onClick={() => setCurrentIndex(index)}
            className={`h-1 rounded-full transition-all duration-500 ${
              index === safeIndex
                ? "w-6 bg-sand"
                : "w-1 bg-ivory/15 hover:bg-ivory/30"
            }`}
            aria-label={`Show photo ${index + 1}`}
          />
        ))}
      </div>

      <div className="mt-8 flex w-full flex-col items-center text-center">
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

        <StudioGallery photos={photos} />

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
