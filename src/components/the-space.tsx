import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useEffect, useState } from "react";
import { getStudioImages, type StudioImage } from "@/lib/storage";

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
    }, 4000);
    return () => clearInterval(interval);
  }, [isHovered, images.length]);

  const goToImage = (index: number) => setCurrentIndex(index);
  const goToPrevious = () =>
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  const goToNext = () =>
    setCurrentIndex((prev) => (prev + 1) % images.length);

  return (
    <div className="reveal reveal-delay-2">
      {/* Gallery container */}
      <div
        className="relative group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative w-full max-w-5xl mx-auto">
          <div className="relative overflow-hidden bg-washed-black border border-sand/10">
            <div className="relative w-full h-[55vh] md:h-[65vh] flex items-center justify-center">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="body-text-small text-ivory/40">Loading gallery...</div>
                </div>
              ) : images.length > 0 ? (
                <Image
                  src={images[currentIndex]?.url}
                  alt={`Studio image ${currentIndex + 1}`}
                  fill
                  className="object-contain transition-opacity duration-700"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
                  priority={currentIndex === 0}
                  quality={80}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="body-text-small text-ivory/40">No images available</div>
                </div>
              )}
            </div>

            {/* Image counter */}
            {!loading && images.length > 0 && (
              <div className="absolute bottom-4 right-4 label-text text-ivory/40 text-[10px] bg-washed-black/60 backdrop-blur-sm px-3 py-1.5">
                {currentIndex + 1} / {images.length}
              </div>
            )}
          </div>
        </div>

        {/* Navigation dots */}
        {!loading && images.length > 0 && (
          <div className="flex justify-center mt-6 gap-1.5">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => goToImage(index)}
                className={`h-1 rounded-full transition-all duration-500 ${
                  index === currentIndex
                    ? "bg-sand w-6"
                    : "bg-ivory/15 w-1 hover:bg-ivory/30"
                }`}
              />
            ))}
          </div>
        )}

        {/* Navigation arrows */}
        {!loading && images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-washed-black/60 backdrop-blur-sm hover:bg-washed-black/80 text-ivory/60 hover:text-sand p-2.5 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 border border-sand/10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-washed-black/60 backdrop-blur-sm hover:bg-washed-black/80 text-ivory/60 hover:text-sand p-2.5 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 border border-sand/10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Gallery description */}
      <div className="text-center mt-8 max-w-xl mx-auto">
        <p className="body-text-small text-ivory/50">
          Carefully designed and acoustically treated to capture the perfect sound for your musical vision.
        </p>
      </div>
    </div>
  );
}

export function TheSpace() {
  return (
    <section id="the-space" className="py-24 md:py-32 px-6 bg-washed-black relative overflow-hidden">
      <div className="absolute inset-0 opacity-30 bg-texture-stone" />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16 reveal">
          <p className="label-text text-sand/60 mb-4">Explore</p>
          <h2 className="headline-primary text-3xl md:text-4xl lg:text-5xl text-warm-white mb-6">
            The Space
          </h2>
          <div className="section-rule max-w-xs mx-auto mb-8" />
          <p className="body-text text-lg text-ivory/60 max-w-2xl mx-auto">
            Step inside our carefully designed recording facility where world-class equipment
            meets natural inspiration. Every room is optimized for capturing the perfect
            sound while maintaining the comfort that fuels creativity.
          </p>
        </div>

        {/* Studio Gallery */}
        <StudioGallery />

        {/* CTA */}
        <div className="text-center mt-16 reveal reveal-delay-3 py-12 border-t border-b border-sand/10">
          <h3 className="headline-secondary text-2xl text-sand mb-4">
            Experience the Studio
          </h3>
          <p className="body-text text-ivory/50 mb-8 max-w-xl mx-auto">
            Schedule a studio tour or start planning your recording session.
            We&apos;d love to show you around and discuss how our space can serve your vision.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="primary"
              size="md"
              onClick={() =>
                document.getElementById("artist-inquiries")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Book Your Session
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() =>
                document.getElementById("equipment-specs")?.scrollIntoView({ behavior: "smooth" })
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
