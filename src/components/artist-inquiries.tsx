"use client";

import Image from "next/image";

import { ContactInquiryForm } from "@/components/contact-inquiry-form";
import { MotionReveal } from "@/components/motion-reveal";

export function ArtistInquiries() {
  return (
    <section
      id="artist-inquiries"
      className="relative overflow-hidden bg-charcoal px-6 py-28 md:py-40"
    >
      <div className="parallax-soft absolute inset-0 bg-texture-ink-wash opacity-25" />

      <div className="relative z-10 mx-auto max-w-3xl">
        <div className="mb-20 text-center">
          <MotionReveal variant="fade" duration={0.7}>
            <div className="mb-12 flex justify-center">
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
          </MotionReveal>

          <MotionReveal variant="rise" delay={0.05}>
            <p className="eyebrow mb-6 justify-center text-sand/60">Contact</p>
          </MotionReveal>
          <MotionReveal variant="rise-blur" duration={1.1} delay={0.12}>
            <h2 className="headline-primary mb-8 text-[2.25rem] text-warm-white md:text-[3rem] lg:text-[3.5rem]">
              Artist Inquiries
            </h2>
          </MotionReveal>
          <MotionReveal variant="rule" duration={1} delay={0.32}>
            <span className="section-rule mx-auto mb-10 block max-w-[9rem]" />
          </MotionReveal>
          <MotionReveal variant="rise" duration={0.95} delay={0.42}>
            <p className="editorial-lede mx-auto max-w-xl">
              Ready to create something meaningful? Share your project details
              below and we&apos;ll get back to you to discuss how we can serve
              your artistic vision.
            </p>
          </MotionReveal>
        </div>

        <MotionReveal
          variant="rise-blur"
          duration={1.05}
          delay={0.1}
          className="mx-auto max-w-xl"
        >
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
        </MotionReveal>
      </div>
    </section>
  );
}
