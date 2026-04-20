import Image from "next/image";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { getStudioImages, type StudioImage } from "@/lib/storage";

/**
 * The Space — editorial studio gallery.
 *
 * Full-bleed image with thin sand index rule instead of rounded/glass chrome.
 * Arrows are plain text glyphs, not blurred pills. No drop shadows.
 */
function StudioGallery() {
  const [isHovered, setIsHovered] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [images, setImages] = useState<StudioImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadImages() {
      try {
        const studioImages = await getStudioImages();
        setImages(studioImages);
      } catch (error) {
        console.error("Failed to load studio images:", error);
      } finally {
        setLoading(false);
      }
    }
    loadImages();
  }, []);

  useEffect(() => {
    if (isHovered || images.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [isHovered, images.length]);

  const goToImage = (index: number) => setCurrentIndex(index);
  const goToPrevious = () =>
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  const goToNext = () =>
    setCurrentIndex((prev) => (prev + 1) % images.length);

  return (
    <div className="reveal reveal-delay-2">
      <div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative mx-auto w-full max-w-5xl">
          <div className="relative">
            <div className="relative flex h-[60vh] w-full items-center justify-center overflow-hidden md:h-[72vh]">
              {loading ? (
                <div className="body-text-small text-ivory/35">
                  Loading gallery…
                </div>
              ) : images.length > 0 ? (
                <Image
                  src={images[currentIndex]?.url}
                  alt={`Studio, frame ${currentIndex + 1}`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
                  className="object-contain transition-opacity duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  priority={currentIndex === 0}
                  quality={82}
                />
              ) : (
                <div className="body-text-small text-ivory/35">
                  No images available
                </div>
              )}
            </div>
          </div>
        </div>

        {!loading && images.length > 0 && (
          <div className="mt-8 flex items-center justify-between px-2">
            <div className="label-text text-[10px] text-ivory/35">
              <span className="text-sand">
                {String(currentIndex + 1).padStart(2, "0")}
              </span>
              <span className="mx-2 text-ivory/25">/</span>
              <span>{String(images.length).padStart(2, "0")}</span>
            </div>

            <div className="flex items-center gap-1.5">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToImage(index)}
                  aria-label={`View image ${index + 1}`}
                  className={`h-px transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    index === currentIndex
                      ? "w-8 bg-sand"
                      : "w-4 bg-ivory/15 hover:bg-ivory/30"
                  }`}
                />
              ))}
            </div>

            {images.length > 1 ? (
              <div className="flex items-center gap-4 text-ivory/40">
                <button
                  onClick={goToPrevious}
                  aria-label="Previous image"
                  className="label-text transition-colors duration-500 hover:text-sand"
                >
                  ← Prev
                </button>
                <button
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
        )}
      </div>

      <div className="mt-10 flex w-full flex-col items-center text-center">
        <p className="body-text-small w-full max-w-xl text-ivory/50">
          Carefully designed and acoustically treated to capture the perfect
          sound for your musical vision.
        </p>
      </div>
    </div>
  );
}

export function TheSpace() {
  return (
    <section
      id="the-space"
      className="relative overflow-hidden bg-washed-black px-6 py-28 md:py-40"
    >
      <div className="absolute inset-0 bg-texture-stone opacity-40" />
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
          <p className="eyebrow mb-6 text-sand/60">Explore</p>
          <h2 className="headline-primary mb-8 text-[2.25rem] text-warm-white md:text-[3rem] lg:text-[3.5rem]">
            The Space
          </h2>
          <div className="section-rule mb-10 w-full max-w-[9rem]" />
          <p className="editorial-lede w-full max-w-2xl">
            Step inside our carefully designed recording facility where
            world-class equipment meets natural inspiration. Every room is
            optimized for capturing the perfect sound while maintaining the
            comfort that fuels creativity.
          </p>
        </div>

        <StudioGallery />

        <div className="reveal reveal-delay-3 mt-24 flex w-full flex-col items-center border-y border-sand/10 py-16 text-center">
          <p className="eyebrow mb-5 text-sand/55">Visit</p>
          <h3 className="headline-secondary mb-6 text-2xl text-sand md:text-[1.75rem]">
            Experience the Studio
          </h3>
          <p className="body-text mx-auto mb-10 w-full max-w-xl text-ivory/55">
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
