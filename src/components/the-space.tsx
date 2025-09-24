import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useEffect, useState } from "react";

// Studio gallery images
const STUDIO_IMAGES = [
  "/studio-images/recordingstudio-2.jpg",
  "/studio-images/recordingstudio-6.jpg", 
  "/studio-images/recordingstudio-9.jpg",
  "/studio-images/recordingstudio-10.jpg",
  "/studio-images/recordingstudio-11.jpg",
  "/studio-images/recordingstudio-14.jpg",
  "/studio-images/recordingstudio-12.jpg",
  "/studio-images/recordingstudio-15.jpg",
  "/studio-images/recordingstudio-26.jpg"
] as const;

function StudioGallery() {
  const [isHovered, setIsHovered] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-scroll functionality
  useEffect(() => {
    if (isHovered) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % STUDIO_IMAGES.length);
    }, 4000); // Change image every 4 seconds

    return () => clearInterval(interval);
  }, [isHovered]);

  const goToImage = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex(prev => prev === 0 ? STUDIO_IMAGES.length - 1 : prev - 1);
  };

  const goToNext = () => {
    setCurrentIndex(prev => (prev + 1) % STUDIO_IMAGES.length);
  };

  return (
    <div className="mb-12">
      <h3 className="headline-secondary text-2xl text-sand mb-8 text-center">Studio Gallery</h3>
      
      {/* Horizontal Scrolling Container */}
      <div 
        className="relative group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative w-full max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-sm bg-washed-black">
            <div className="relative w-full h-[60vh] flex items-center justify-center">
              <Image
                src={STUDIO_IMAGES[currentIndex]}
                alt={`Studio image ${currentIndex + 1}`}
                fill
                className="object-contain transition-opacity duration-500"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
                priority={currentIndex === 0}
              />
            </div>

            {/* Image Counter */}
            <div className="absolute bottom-4 right-4 bg-washed-black/90 text-sand px-3 py-1 rounded-sm text-sm backdrop-blur-sm">
              {currentIndex + 1} / {STUDIO_IMAGES.length}
            </div>
          </div>
        </div>

        {/* Navigation Dots */}
        <div className="flex justify-center mt-6 gap-2">
          {STUDIO_IMAGES.map((_, index) => (
            <button
              key={index}
              onClick={() => goToImage(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-sand w-8'
                  : 'bg-sage/40 hover:bg-sage/60'
              }`}
            />
          ))}
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-washed-black/80 hover:bg-washed-black text-sand p-3 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-washed-black/80 hover:bg-washed-black text-sand p-3 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Gallery Description */}
      <div className="text-center mt-8 max-w-2xl mx-auto">
        <p className="body-text text-ivory/70">
          Take a visual tour through our space. Lula Lake Sound is carefully designed and acoustically treated to capture the perfect sound for your musical vision.
        </p>
      </div>
    </div>
  );
}

export function TheSpace() {
  return (
    <section id="the-space" className="py-20 px-4 bg-washed-black relative">
      <div className="absolute inset-0 opacity-40 bg-texture-stone"></div>
      
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="headline-primary text-3xl md:text-4xl text-ivory mb-6">
            The Space
          </h2>
          <p className="body-text text-lg text-ivory/80 max-w-3xl mx-auto">
            Step inside our carefully designed recording facility where world-class equipment meets natural inspiration. 
            Every room is optimized for capturing the perfect sound while maintaining the comfort and atmosphere that fuels creativity.
          </p>
        </div>

        {/* Studio Gallery */}
        <StudioGallery />

        {/* Virtual Tour CTA */}
        <div className="text-center bg-sage/10 border border-sage/30 rounded-sm p-8">
          <h3 className="headline-secondary text-2xl text-sand mb-4">
            Experience the Studio
          </h3>
          <p className="body-text text-ivory/70 mb-6 max-w-2xl mx-auto">
            Want to see more? Schedule a studio tour or start planning your recording session. 
            We&apos;d love to show you around and discuss how our space can serve your recording and mixing needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="primary"
              size="lg"
              onClick={() => document.getElementById('artist-inquiries')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Book Your Session
            </Button>
            <Button 
              variant="outline"
              size="lg"
              onClick={() => document.getElementById('equipment-specs')?.scrollIntoView({ behavior: 'smooth' })}
            >
              View Equipment List
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}