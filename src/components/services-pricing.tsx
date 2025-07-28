import { Button } from "@/components/ui/button";

// Service packages data
const SERVICE_PACKAGES = [
  {
    id: "recording",
    name: "Recording Sessions",
    description: "Professional recording in our acoustically designed studio",
    features: [
      "Full day (8-hour) session",
      "Experienced engineer included",
      "All analog and digital equipment",
      "Comfortable lounge area",
      "Kitchen and refreshments"
    ],
    pricing: {
      daily: "$400",
      hourly: "$60"
    },
    popular: false
  },
  {
    id: "mixing",
    name: "Mixing & Mastering",
    description: "Transform your recordings into polished, professional tracks",
    features: [
      "Professional mixing per song",
      "Mastering included",
      "Unlimited revisions",
      "Stems provided",
      "Fast turnaround (3-5 days)"
    ],
    pricing: {
      perSong: "$150",
      album: "$1,200"
    },
    popular: true
  },
  {
    id: "production",
    name: "Full Production",
    description: "Complete album production from concept to final master",
    features: [
      "Pre-production consultation",
      "Recording sessions (up to 5 days)",
      "Mixing and mastering",
      "Arrangement and composition help",
      "Instrument and amp rentals included"
    ],
    pricing: {
      album: "$3,500",
      ep: "$1,800"
    },
    popular: false
  }
] as const;

const ADDITIONAL_SERVICES = [
  { name: "Additional engineer/producer", price: "$200/day" },
  { name: "Instrument rental (guitars, amps, keys)", price: "$50/day" },
  { name: "Accommodation (nearby partner locations)", price: "$80-120/night" },
  { name: "Rehearsal/pre-production time", price: "$30/hour" }
] as const;

export function ServicesAndPricing() {
  return (
    <section id="services-pricing" className="py-20 px-4 bg-sage relative">
      <div className="absolute inset-0 opacity-10 bg-texture-stone"></div>
      
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-washed-black mb-6 tracking-wide font-acumin">
            SERVICES & RATES
          </h2>
          <p className="text-lg text-washed-black/80 font-titillium max-w-3xl mx-auto leading-relaxed">
            Transparent pricing for professional recording services. Every package includes our full attention to your artistic vision and access to our complete facility.
          </p>
        </div>

        {/* Service Packages */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {SERVICE_PACKAGES.map((service) => (
            <div 
              key={service.id} 
              className={`relative bg-white/90 border-2 rounded-sm p-8 hover:shadow-lg transition-all ${
                service.popular ? 'border-forest scale-105' : 'border-forest/30'
              }`}
            >
              {service.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-forest text-sand px-4 py-1 rounded-full text-sm font-acumin font-bold tracking-wide">
                    MOST POPULAR
                  </span>
                </div>
              )}
              
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-washed-black mb-3 font-acumin">{service.name}</h3>
                <p className="text-washed-black/70 font-titillium text-sm leading-relaxed">{service.description}</p>
              </div>
              
              <ul className="space-y-3 mb-8">
                {service.features.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-forest mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-washed-black/80 font-titillium text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <div className="border-t border-forest/20 pt-6 mb-6">
                {Object.entries(service.pricing).map(([type, price]) => (
                  <div key={type} className="flex justify-between items-center mb-2">
                    <span className="text-washed-black/70 font-titillium text-sm capitalize">{type.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="text-forest font-acumin font-bold text-lg">{price}</span>
                  </div>
                ))}
              </div>
              
              <Button 
                variant={service.popular ? "primary" : "outline"}
                className="w-full"
                onClick={() => document.getElementById('artist-inquiries')?.scrollIntoView({ behavior: 'smooth' })}
              >
                BOOK NOW
              </Button>
            </div>
          ))}
        </div>

        {/* Additional Services */}
        <div className="bg-white/80 border border-forest/30 rounded-sm p-8">
          <h3 className="text-2xl font-bold text-washed-black mb-6 text-center font-acumin">ADDITIONAL SERVICES</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ADDITIONAL_SERVICES.map((service, index) => (
              <div key={index} className="flex justify-between items-center py-3 border-b border-forest/20 last:border-b-0">
                <span className="text-washed-black/80 font-titillium">{service.name}</span>
                <span className="text-forest font-acumin font-bold">{service.price}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Contact CTA */}
        <div className="text-center mt-12">
          <p className="text-washed-black/70 font-titillium mb-4">
            Need a custom package or have questions about pricing?
          </p>
          <Button 
            variant="secondary"
            size="lg"
            onClick={() => document.getElementById('artist-inquiries')?.scrollIntoView({ behavior: 'smooth' })}
          >
            GET CUSTOM QUOTE
          </Button>
        </div>
      </div>
    </section>
  );
} 