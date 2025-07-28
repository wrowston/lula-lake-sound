// Artist testimonials data
const TESTIMONIALS = [
  {
    id: 1,
    name: "Sarah Mitchell",
    artist: "Whisper Valley",
    genre: "Folk",
    quote: "Lula Lake Sound provided the perfect atmosphere for our album. The natural setting inspired creativity while the professional equipment captured every subtle detail of our acoustic arrangements.",
    project: "Full Album Recording",
    image: "/placeholder-artist-1.jpg"
  },
  {
    id: 2,
    name: "Marcus Rodriguez",
    artist: "Electric Haze",
    genre: "Rock",
    quote: "The vintage gear and modern digital tools created the perfect hybrid sound we were looking for. The engineers understood our vision and helped us achieve something truly special.",
    project: "EP Production",
    image: "/placeholder-artist-2.jpg"
  },
  {
    id: 3,
    name: "Emma Chen",
    artist: "Solo Artist",
    genre: "Singer-Songwriter",
    quote: "Working at Lula Lake felt like creating music with old friends. The comfortable environment allowed me to be vulnerable in my performance, which you can hear in the final recordings.",
    project: "Single Recording & Mixing",
    image: "/placeholder-artist-3.jpg"
  },
  {
    id: 4,
    name: "David Thompson",
    artist: "Mountain Collective",
    genre: "Bluegrass",
    quote: "The live room's acoustics are incredible for our string ensemble. We could all play together and still hear every instrument clearly in the final mix.",
    project: "Live Session Recording",
    image: "/placeholder-artist-4.jpg"
  }
] as const;

const SUCCESS_STATS = [
  { number: "50+", label: "Albums Recorded" },
  { number: "200+", label: "Artists Served" },
  { number: "15+", label: "Chart Placements" },
  { number: "5", label: "Grammy Nominations" }
] as const;

export function ArtistTestimonials() {
  return (
    <section id="artist-testimonials" className="py-20 px-4 bg-sand relative">
      <div className="absolute inset-0 opacity-10 bg-texture-stone"></div>
      
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-washed-black mb-6 tracking-wide font-acumin">
            ARTIST TESTIMONIALS
          </h2>
          <p className="text-lg text-washed-black/80 font-titillium max-w-3xl mx-auto leading-relaxed">
            Hear from the artists who've trusted Lula Lake Sound with their most important musical projects.
          </p>
        </div>

        {/* Success Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {SUCCESS_STATS.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-forest mb-2 font-acumin">{stat.number}</div>
              <div className="text-washed-black/70 font-titillium text-sm uppercase tracking-wide">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {TESTIMONIALS.map((testimonial) => (
            <div key={testimonial.id} className="bg-white/90 border border-forest/20 rounded-sm p-8 hover:shadow-lg transition-all">
              {/* Quote */}
              <div className="mb-6">
                <svg className="w-8 h-8 text-forest/40 mb-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
                </svg>
                <p className="text-washed-black/80 font-titillium text-lg leading-relaxed italic">
                  "{testimonial.quote}"
                </p>
              </div>
              
              {/* Artist Info */}
              <div className="flex items-center space-x-4">
                {/* Artist Photo Placeholder */}
                <div className="w-12 h-12 bg-forest/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-forest/60" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
                
                <div>
                  <div className="text-washed-black font-acumin font-bold">{testimonial.name}</div>
                  <div className="text-forest font-titillium text-sm">{testimonial.artist}</div>
                  <div className="text-washed-black/60 font-titillium text-xs">{testimonial.project} • {testimonial.genre}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Featured Achievement */}
        <div className="bg-forest/10 border-2 border-forest/30 rounded-sm p-8 text-center">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold text-washed-black mb-4 font-acumin">
              FEATURED SUCCESS STORY
            </h3>
            <p className="text-washed-black/80 font-titillium text-lg mb-4 leading-relaxed">
              "Mountain Echo's album recorded at Lula Lake Sound debuted at #3 on the Billboard Independent Charts and was nominated for a Grammy Award for Best Americana Album."
            </p>
            <div className="text-forest font-acumin font-bold">
              - Nashville Scene, Music Industry Review
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 