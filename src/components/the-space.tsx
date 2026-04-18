"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { studioImages } from "@/lib/storage";

function StudioGallery() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const images = studioImages;

  const goToImage = (index: number) => setCurrentIndex(index);
  const goToPrevious = () =>
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  const goToNext = () =>
    setCurrentIndex((prev) => (prev + 1) % images.length);

  if (images.length === 0) {
    return null;
  }

  const activeImage = images[currentIndex];

  return (
    <div className="reveal reveal-delay-2">
      <div className="group relative mx-auto w-full max-w-5xl">
        {/* Frame — no rounded corners, a single hairline rule that
         * whispers around the photograph rather than shouting. */}
        <div className="relative overflow-hidden bg-deep-forest">
          <div className="absolute inset-0 border border-sand/10" />

          <div className="relative flex h-[58vh] w-full items-center justify-center md:h-[72vh]">
            <Image
              key={activeImage.id}
              src={activeImage.url}
              alt={`Lula Lake Sound studio — frame ${currentIndex + 1}`}
              fill
              className="object-cover transition-opacity duration-700 ease-out"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
              priority={currentIndex === 0}
              quality={80}
            />

            {/* Subtle cinematic vignette so the gallery feels
             * photographic rather than like a stock frame. */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-washed-black/70 via-transparent to-washed-black/10" />
          </div>

          {/* Image counter */}
          <div className="absolute bottom-5 right-6 flex items-center gap-3">
            <span className="label-text text-sand/70">
              {String(currentIndex + 1).padStart(2, "0")}
            </span>
            <span className="h-px w-6 bg-sand/40" />
            <span className="label-text text-ivory/45">
              {String(images.length).padStart(2, "0")}
            </span>
          </div>
        </div>

        {/* Navigation dots */}
        <div className="mt-10 flex justify-center gap-3">
          {images.map((img, index) => (
            <button
              key={img.id}
              onClick={() => goToImage(index)}
              aria-label={`Show image ${index + 1}`}
              className={
                "h-px transition-all duration-500 " +
                (index === currentIndex
                  ? "w-10 bg-sand"
                  : "w-5 bg-ivory/20 hover:bg-ivory/40")
              }
            />
          ))}
        </div>

        {/* Navigation arrows */}
        {images.length > 1 ? (
          <>
            <button
              onClick={goToPrevious}
              aria-label="Previous image"
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-ivory/55 opacity-0 transition-all duration-500 hover:text-sand group-hover:opacity-100"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={goToNext}
              aria-label="Next image"
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-ivory/55 opacity-0 transition-all duration-500 hover:text-sand group-hover:opacity-100"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

export function TheSpace() {
  return (
    <section
      id="the-space"
      className="relative overflow-hidden bg-washed-black px-6 py-28 md:py-40 lg:py-48"
    >
      <div className="absolute inset-0 bg-texture-stone opacity-40" />

      <div className="relative z-10 mx-auto max-w-[88rem]">
        {/* Section header */}
        <header className="reveal mx-auto mb-20 flex w-full max-w-3xl flex-col items-center text-center md:mb-28">
          <p className="label-text mb-6 text-sand/65">
            01 &middot; The Studio
          </p>
          <h2 className="headline-primary mb-8 text-[2.25rem] text-warm-white md:text-[3rem] lg:text-[3.5rem]">
            Rooms built for listening
          </h2>
          <div className="section-rule mb-10 w-24" />
          <p className="body-text max-w-2xl text-lg text-ivory/70">
            A main live room, an iso booth, a vocal booth, a dead room, and a
            control room that feels like a library — tuned to let performances
            breathe instead of hiding behind processing.
          </p>
        </header>

        <StudioGallery />

        {/* CTA — framed between two hairlines, editorial rather than card-y */}
        <div className="reveal reveal-delay-3 mt-24 flex w-full flex-col items-center border-y border-sand/10 py-16 text-center md:mt-32">
          <p className="label-text mb-4 text-sand/65">Visit</p>
          <h3 className="headline-secondary mb-5 text-2xl text-warm-white md:text-3xl">
            Come spend a day in the room
          </h3>
          <p className="body-text mb-10 max-w-xl text-ivory/60">
            We keep the calendar small on purpose. Reach out and we&rsquo;ll
            show you around, play you what&rsquo;s been tracked recently, and
            figure out whether it&rsquo;s a fit.
          </p>
          <div className="flex w-full flex-col items-center gap-4 sm:w-auto sm:flex-row sm:justify-center">
            <Button
              variant="default"
              size="lg"
              className="h-11 px-7"
              onClick={() =>
                document
                  .getElementById("artist-inquiries")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Plan a visit
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-11 px-7"
              onClick={() =>
                document
                  .getElementById("equipment-specs")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              See the gear
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
