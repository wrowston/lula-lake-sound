import { Button } from "@/components/ui/button";

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

        {/* Studio Spaces Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {STUDIO_SPACES.map((space) => (
            <div key={space.id} className="bg-forest/20 border border-sage/30 rounded-sm overflow-hidden hover:border-sand/50 transition-all duration-300 group">
              {/* Image Placeholder */}
              <div className="aspect-[4/3] bg-sage/20 flex flex-col items-center justify-center p-8 group-hover:bg-sage/30 transition-colors">
                <div className="w-16 h-16 bg-sand/20 rounded-sm flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-sand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="body-text-small text-sage/60 text-center">
                  {space.name} Photo
                </p>
              </div>
              
              {/* Content */}
              <div className="p-6">
                <h3 className="headline-secondary text-sand text-xl mb-3">{space.name}</h3>
                <p className="body-text text-ivory/80 mb-4">
                  {space.description}
                </p>
                
                {/* Features List */}
                <ul className="space-y-2">
                  {space.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start space-x-2">
                      <span className="text-sand text-xs mt-1">•</span>
                      <span className="body-text-small text-ivory/70">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

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

        {/* Studio Stats */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="headline-secondary text-3xl text-sand mb-2">6</div>
            <div className="body-text-small text-ivory/70 uppercase tracking-wide">Recording Spaces</div>
          </div>
          <div>
            <div className="headline-secondary text-3xl text-sand mb-2">24&apos;</div>
            <div className="body-text-small text-ivory/70 uppercase tracking-wide">Live Room Length</div>
          </div>
          <div>
            <div className="headline-secondary text-3xl text-sand mb-2">12&apos;</div>
            <div className="body-text-small text-ivory/70 uppercase tracking-wide">Ceiling Height</div>
          </div>
          <div>
            <div className="headline-secondary text-3xl text-sand mb-2">API</div>
            <div className="body-text-small text-ivory/70 uppercase tracking-wide">Mixing Console</div>
          </div>
        </div>
      </div>
    </section>
  );
}