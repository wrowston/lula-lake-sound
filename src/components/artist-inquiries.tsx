import Image from "next/image";

import { ContactInquiryForm } from "@/components/contact-inquiry-form";

export function ArtistInquiries() {
  return (
    <section id="artist-inquiries" className="relative bg-charcoal py-24 md:py-32 px-6">
      <div className="absolute inset-0 opacity-20 bg-texture-ink-wash" />

      <div className="relative z-10 mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-16 text-center reveal">
          <div className="mb-6">
            <Image
              src="/LLS_Logo_Full_Tar.png"
              alt="Lula Lake Sound Symbol"
              width={48}
              height={48}
              className="mx-auto opacity-40 filter invert"
            />
          </div>

          <p className="label-text mb-4 text-sand/60">Contact</p>
          <h2 className="headline-primary mb-6 text-3xl text-warm-white md:text-4xl lg:text-5xl">
            Artist Inquiries
          </h2>
          <div className="section-rule mx-auto mb-8 max-w-xs" />
          <p className="body-text mx-auto max-w-xl text-lg text-ivory/50">
            Ready to create something meaningful? Share your project details below
            and we&apos;ll get back to you to discuss how we can serve your artistic
            vision.
          </p>
        </div>

        <div className="mx-auto max-w-xl reveal reveal-delay-2">
          <ContactInquiryForm />

          <div className="mt-16 border-t border-sand/10 pt-8 text-center">
            <p className="body-text-small mb-3 text-ivory/30">
              Prefer to reach out directly?
            </p>
            <a
              href="mailto:info@lulalakesound.com"
              className="headline-secondary text-sand transition-colors duration-300 hover:text-warm-white"
            >
              info@lulalakesound.com
            </a>
            <p className="body-text-small mt-3 text-ivory/30">Chattanooga, Tennessee</p>
          </div>
        </div>
      </div>
    </section>
  );
}
