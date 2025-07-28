import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

// Studio spaces data with detailed descriptions
const STUDIO_SPACES = [
  {
    id: 1,
    name: "Live Room",
    description: "20' x 24' main recording space with 12-foot ceilings and custom acoustic treatment",
    features: ["Natural wood acoustics", "DW & vintage Rogers drum kits", "Multiple instrument stations", "Vintage guitar & bass collection"],
    image: "/studio-live-room.jpg"
  },
  {
    id: 2,
    name: "Control Room",
    description: "Professional mixing environment with API console and pristine monitoring",
    features: ["API 2448 Console with 24 EQs", "Genelec 1032A monitors", "Universal Audio Apollo x16 interfaces", "Extensive outboard collection"],
    image: "/studio-control-room.jpg"
  },
  {
    id: 3,
    name: "Isolation Booth A",
    description: "Intimate vocal recording space with exceptional sound isolation",
    features: ["Vocal-optimized acoustics", "Premium microphone selection", "Real-time monitoring", "Comfortable environment"],
    image: "/studio-vocal-booth.jpg"
  },
  {
    id: 4,
    name: "Isolation Booth B",
    description: "Versatile instrumental recording booth for guitars, bass, and more",
    features: ["Amp cabinet isolation", "Guitar and bass setups", "Direct recording options", "Quick setup changes"],
    image: "/studio-instrument-booth.jpg"
  },
  {
    id: 5,
    name: "Lounge Area",
    description: "Comfortable relaxation space for breaks and creative discussions",
    features: ["Mountain views", "Kitchen facilities", "Comfortable seating", "Inspiring atmosphere"],
    image: "/studio-lounge.jpg"
  },
  {
    id: 6,
    name: "Equipment Room",
    description: "Climate-controlled storage for our extensive gear collection",
    features: ["Boutique tube amplifiers", "Premium microphone collection", "Vintage compressors & EQs", "Guitar & bass selection"],
    image: "/studio-equipment.jpg"
  }
] as const;

const STUDIO_HIGHLIGHTS = [
  {
    icon: "🎸",
    title: "Vintage Instruments",
    description: "1978 Gibson 335, vintage Martin & Gibson acoustics, boutique amplifiers"
  },
  {
    icon: "🎛️",
    title: "API 2448 Console",
    description: "Professional mixing console with 24 API EQs and analog signal path"
  },
  {
    icon: "🎤",
    title: "Microphone Collection",
    description: "Neumann U47/U67/M49, AEA ribbons, and extensive dynamic selection"
  },
  {
    icon: "⚡",
    title: "Boutique Outboard",
    description: "Fairchild 670s, Neve 1073s, Distressors, and vintage compressors"
  }
] as const;

// Studio gallery images
const STUDIO_IMAGES = [
  "/studio-images/IMG_4034.jpg",
  "/studio-images/JFD04656.jpg", 
  "/studio-images/JFD04782.jpg",
  "/studio-images/JFD04580.jpg",
  "/studio-images/IMG_4038.jpg",
  "/studio-images/JFD04785.jpg",
  "/studio-images/JFD04775.jpg"
] as const;

function StudioGallery() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-scroll functionality
  useEffect(() => {
    if (isHovered) return;
    
    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        const maxScroll = scrollWidth - clientWidth;
        
        if (scrollLeft >= maxScroll) {
          // Reset to beginning
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
          setCurrentIndex(0);
        } else {
          // Scroll to next image
          const imageWidth = clientWidth * 0.8; // Approximate image width
          const nextScrollPosition = scrollLeft + imageWidth;
          scrollRef.current.scrollTo({ left: nextScrollPosition, behavior: 'smooth' });
          setCurrentIndex(prev => (prev + 1) % STUDIO_IMAGES.length);
        }
      }
    }, 4000); // Change image every 4 seconds

    return () => clearInterval(interval);
  }, [isHovered]);

  const scrollToImage = (index: number) => {
    if (scrollRef.current) {
      const imageWidth = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollTo({ 
        left: index * imageWidth, 
        behavior: 'smooth' 
      });
      setCurrentIndex(index);
    }
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
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto scrollbar-hide pb-4"
          style={{
            scrollSnapType: 'x mandatory',
            scrollBehavior: 'smooth'
          }}
        >
          {STUDIO_IMAGES.map((image, index) => (
            <div
              key={index}
              className="flex-shrink-0 relative group cursor-pointer"
              style={{
                scrollSnapAlign: 'start',
                width: '80vw',
                maxWidth: '600px',
                minWidth: '300px'
              }}
              onClick={() => scrollToImage(index)}
            >
              <div className="aspect-[16/10] relative overflow-hidden rounded-sm bg-sage/20">
                <Image
                  src={image}
                  alt={`Studio image ${index + 1}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 80vw, (max-width: 1200px) 60vw, 600px"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-washed-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Image Counter */}
                <div className="absolute bottom-4 right-4 bg-washed-black/80 text-sand px-3 py-1 rounded-sm text-sm">
                  {index + 1} / {STUDIO_IMAGES.length}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Dots */}
        <div className="flex justify-center mt-6 gap-2">
          {STUDIO_IMAGES.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToImage(index)}
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
          onClick={() => scrollToImage(Math.max(0, currentIndex - 1))}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-washed-black/80 hover:bg-washed-black text-sand p-2 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
          disabled={currentIndex === 0}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <button
          onClick={() => scrollToImage(Math.min(STUDIO_IMAGES.length - 1, currentIndex + 1))}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-washed-black/80 hover:bg-washed-black text-sand p-2 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
          disabled={currentIndex === STUDIO_IMAGES.length - 1}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Gallery Description */}
      <div className="text-center mt-8 max-w-2xl mx-auto">
        <p className="body-text text-ivory/70">
          Take a visual tour through our recording spaces. Each room is carefully designed and acoustically treated to capture the perfect sound for your musical vision.
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

        {/* Studio Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {STUDIO_HIGHLIGHTS.map((highlight, index) => (
            <div key={index} className="text-center bg-forest/20 border border-sage/30 rounded-sm p-6">
              <div className="text-4xl mb-4">{highlight.icon}</div>
              <h3 className="headline-secondary text-sand text-lg mb-3">{highlight.title}</h3>
              <p className="body-text-small text-ivory/70">{highlight.description}</p>
            </div>
          ))}
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
            We&apos;d love to show you around and discuss how our space can serve your musical vision.
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