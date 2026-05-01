import Image from "next/image";

import { ContactInquiryForm } from "@/components/contact-inquiry-form";

export function ArtistInquiries() {
  return (
    <section
      id="artist-inquiries"
      className="relative overflow-hidden bg-charcoal px-6 py-28 md:py-40"
    >
      <div className="parallax-soft absolute inset-0 bg-texture-ink-wash opacity-25" />

      <div className="relative z-10 mx-auto max-w-3xl">
        <div className="mb-20 text-center">
          <div className="reveal mb-12 flex justify-center">
            {/* Stacked lockup — brand guide §2.3 recommends the vertical
             * composition for portrait moments like contact/inquiry where
             * the mark wants to hold space with quiet symmetry. */}
            <Image
              src="/Logos/STACK/LLS_Logo_Stack_Gold.png"
              alt="Lula Lake Sound"
              width={600}
              height={720}
              className="mx-auto h-32 w-auto object-contain opacity-90 md:h-40"
            />
          </div>

          <p className="eyebrow reveal reveal-delay-1 mb-6 justify-center text-sand/60">
            Contact
          </p>
          <h2 className="headline-primary reveal-axis reveal-delay-2 mb-8 text-[2.25rem] text-warm-white md:text-[3rem] lg:text-[3.5rem]">
            Artist Inquiries
          </h2>
          <div className="section-rule reveal-rule reveal-delay-3 mx-auto mb-10 max-w-[9rem]" />
          <p className="editorial-lede reveal reveal-delay-4 mx-auto max-w-xl">
            Ready to create something meaningful? Share your project details
            below and we&apos;ll get back to you to discuss how we can serve
            your artistic vision.
          </p>
        </div>

        <div className="reveal reveal-delay-5 mx-auto max-w-xl">
          <ContactInquiryForm />

          <div className="mt-20 border-t border-sand/10 pt-10 text-center">
            <p className="eyebrow mb-4 text-ivory/35">Direct</p>
            <a
              href="mailto:info@lulalakesound.com"
              className="headline-secondary text-lg text-sand transition-colors duration-500 hover:text-warm-white md:text-xl"
            >
              info@lulalakesound.com
            </a>
            <p className="body-text-small mt-3 text-ivory/30">
              Chattanooga, Tennessee
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
