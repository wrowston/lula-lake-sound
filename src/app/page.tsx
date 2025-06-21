import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-sand">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20 bg-gradient-to-b from-sand to-ivory">
        {/* Subtle texture overlay */}
        <div className="absolute inset-0 opacity-20 bg-texture-ink-wash"></div>
        
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          {/* Primary Logo Placeholder */}
          <div className="mb-12">
            <div className="w-48 h-16 mx-auto bg-forest/20 rounded-sm flex items-center justify-center border border-forest/30">
              <span className="text-forest font-medium text-sm">LULA LAKE SOUND LOGO</span>
            </div>
          </div>
          
          {/* Hero Text */}
          <div className="space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold text-forest leading-tight tracking-wide font-acumin">
              LULA LAKE SOUND
            </h1>
            
            <div className="text-lg md:text-xl text-washed-black leading-relaxed space-y-6 font-titillium max-w-3xl mx-auto">
              <p>
                Nestled in serene mountains just outside of Chattanooga, TN- Lula Lake Sound offers artists a natural creative refuge. The studio is designed to inspire creativity and relaxation, providing the perfect environment for your sonic adventures.
              </p>
              
              <p>
                With state-of-the-art equipment, comfortable accommodations, and breathtaking surroundings, Lula Lake Sound is a space where artists can fully immerse themselves in their both nature and music.
              </p>
            </div>
            
            <p className="text-base text-rust font-medium tracking-wider font-titillium">
              LOOKOUT MOUNTAIN, CHATTANOOGA, TN
            </p>
          </div>
        </div>
        
        {/* Subtle Chladni pattern overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-32 opacity-10 bg-chladni-pattern"></div>
      </section>

      {/* Studio Description Section */}
      <section className="py-20 px-4 bg-ivory relative">
        <div className="absolute inset-0 opacity-30 bg-texture-canvas"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-forest mb-12 tracking-wide font-acumin">
            THE EXPERIENCE
          </h2>
          
          <div className="space-y-8 text-lg text-washed-black leading-relaxed font-titillium">
            <p>
              The environment reflects a deep respect for the natural world and the creative process alike. Clean lines, raw textures, and quiet hospitality offer a rare kind of clarity. An adjoining organic farm carries that ethos even further, grounding the space in rhythm, restoration, and care.
            </p>
            
            <p>
              There's no hard sell here—just a studio with nothing to prove and everything to offer. Its presence spreads quietly, from artist to artist, rooted in experience rather than exposure.
            </p>
            
            <p className="text-sage font-medium italic">
              A place where music breathes a little deeper.
            </p>
          </div>
        </div>
      </section>

      {/* Photo Gallery Placeholder Section */}
      <section className="py-20 px-4 bg-washed-black relative">
        <div className="absolute inset-0 opacity-40 bg-texture-stone"></div>
        
        <div className="relative z-10 max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-ivory mb-16 text-center tracking-wide font-acumin">
            THE SPACE
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="aspect-[4/3] bg-sage/20 border-2 border-rust/60 rounded-sm flex flex-col items-center justify-center p-8">
                <div className="w-16 h-16 bg-sage/40 rounded-sm flex items-center justify-center mb-4">
                  <span className="text-sage text-xs">LLS</span>
                </div>
                <p className="text-ivory/70 text-sm font-titillium text-center">
                  Photo {item} - Studio Space
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-20 px-4 bg-sage relative">
        <div className="absolute inset-0 opacity-30 bg-texture-stone"></div>
        <div className="absolute top-0 right-0 w-64 h-64 opacity-20 bg-chladni-accent"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-ivory mb-12 tracking-wide font-acumin">
            OUR APPROACH
          </h2>
          
          <div className="space-y-8 text-lg text-ivory leading-relaxed font-titillium">
            <p className="text-xl font-medium">
              "Think Wilco, Father John Misty, and the thoughtful textures of Big Thief or Fleet Foxes. Not inspirations to replicate, but signals that this is a place where music breathes a little deeper."
            </p>
            
            <p>
              Every element here is designed to support the creative process: calm, grounded, and thoughtfully made. This isn't a marketing tool—it's a space built for artists who need room to slow down and create.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-4 bg-sand relative">
        <div className="absolute inset-0 opacity-20 bg-texture-canvas"></div>
        
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          {/* Stacked Logo Placeholder */}
          <div className="mb-12">
            <div className="w-32 h-24 mx-auto bg-forest/20 rounded-sm flex flex-col items-center justify-center border border-forest/30">
              <div className="text-forest font-bold text-xs space-y-1">
                <div>LULA</div>
                <div>LAKE</div>
                <div>SOUND</div>
              </div>
            </div>
          </div>
          
          <h2 className="text-2xl md:text-3xl font-bold text-forest mb-8 tracking-wide font-acumin">
            ARTIST INQUIRIES
          </h2>
          
          <div className="space-y-6 text-lg text-washed-black font-titillium">
            <p>
              Ready to create something meaningful? Reach out to discuss your project and discover how Lula Lake Sound can serve your artistic vision.
            </p>
            
            <div className="space-y-2">
              <p className="font-medium text-rust">
                hello@lulalakesound.com
              </p>
              <p className="text-base">
                Lookout Mountain, Chattanooga, Tennessee
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
