import { Button } from "@/components/ui/button";

// Audio portfolio data - in a real implementation, this would come from a CMS or database
const AUDIO_SAMPLES = [
  {
    id: 1,
    title: "Indie Rock Album",
    artist: "Mountain Echo",
    genre: "Indie Rock",
    description: "Full album recording featuring dynamic drums and atmospheric guitars",
    audioSrc: "/audio/sample-1.mp3", // Placeholder - would be real audio files
    coverImage: "/placeholder-album-1.jpg"
  },
  {
    id: 2,
    title: "Folk EP",
    artist: "River Stones",
    genre: "Folk",
    description: "Intimate acoustic recording with natural room ambience",
    audioSrc: "/audio/sample-2.mp3",
    coverImage: "/placeholder-album-2.jpg"
  },
  {
    id: 3,
    title: "Electronic Single",
    artist: "Digital Forest",
    genre: "Electronic",
    description: "Hybrid recording blending organic and electronic elements",
    audioSrc: "/audio/sample-3.mp3",
    coverImage: "/placeholder-album-3.jpg"
  }
] as const;

export function AudioPortfolio() {
  return (
    <section id="audio-portfolio" className="py-20 px-4 bg-forest relative">
      <div className="absolute inset-0 opacity-20 bg-texture-stone"></div>
      
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-sand mb-6 tracking-wide font-acumin">
            STUDIO PORTFOLIO
          </h2>
          <p className="text-lg text-ivory/80 font-titillium max-w-3xl mx-auto leading-relaxed">
            Listen to the quality and character that artists achieve at Lula Lake Sound. 
            From intimate acoustic sessions to full band recordings, hear how our space and expertise bring out the best in every project.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {AUDIO_SAMPLES.map((sample) => (
            <div key={sample.id} className="bg-washed-black/60 border border-sage/30 rounded-sm p-6 hover:border-sand/50 transition-colors">
              {/* Album Art Placeholder */}
              <div className="aspect-square bg-sage/20 rounded-sm mb-4 flex items-center justify-center">
                <div className="text-sage/60 text-sm font-titillium text-center">
                  <div className="w-12 h-12 bg-sage/40 rounded-sm mx-auto mb-2"></div>
                  Album Art
                </div>
              </div>
              
              {/* Track Info */}
              <div className="mb-4">
                <h3 className="text-sand font-acumin font-bold text-lg mb-1">{sample.title}</h3>
                <p className="text-ivory/70 font-titillium text-sm mb-1">{sample.artist}</p>
                <span className="text-sage/80 font-titillium text-xs uppercase tracking-wide">{sample.genre}</span>
              </div>
              
              <p className="text-ivory/60 font-titillium text-sm mb-4 leading-relaxed">
                {sample.description}
              </p>
              
              {/* Audio Player Placeholder */}
              <div className="bg-sage/10 border border-sage/30 rounded-sm p-3 mb-4">
                <div className="flex items-center space-x-3">
                  <button className="w-8 h-8 bg-sand rounded-full flex items-center justify-center hover:bg-sand/80 transition-colors">
                    <svg className="w-4 h-4 text-washed-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </button>
                  <div className="flex-1 h-2 bg-sage/30 rounded-full">
                    <div className="h-full bg-sand rounded-full" style={{ width: '0%' }}></div>
                  </div>
                  <span className="text-ivory/50 font-titillium text-xs">0:00</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <p className="text-ivory/70 font-titillium mb-6">
            Ready to create something extraordinary?
          </p>
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => document.getElementById('artist-inquiries')?.scrollIntoView({ behavior: 'smooth' })}
          >
            START YOUR PROJECT
          </Button>
        </div>
      </div>
    </section>
  );
} 