import Image from "next/image";

import { ContactInquiryForm } from "@/components/contact-inquiry-form";

export function ArtistInquiries() {
  return (
    <section
      id="artist-inquiries"
      className="relative overflow-hidden bg-washed-black px-6 py-28 md:py-40 lg:py-48"
    >
      <div className="absolute inset-0 bg-texture-ink-wash opacity-30" />

      <div className="relative z-10 mx-auto max-w-3xl">
        <header className="reveal mx-auto mb-20 flex w-full flex-col items-center text-center md:mb-28">
          <Image
            src="/LLS_Logo_Text_White.png"
            alt=""
            width={72}
            height={36}
            className="mb-10 h-8 w-auto opacity-60"
          />

          <p className="label-text mb-6 text-sand/65">06 &middot; Write to us</p>
          <h2 className="headline-primary mb-8 text-[2.25rem] text-warm-white md:text-[3rem] lg:text-[3.5rem]">
            Tell us about your project
          </h2>
          <div className="section-rule mb-10 w-24" />
          <p className="body-text max-w-xl text-lg text-ivory/70">
            A short paragraph goes a long way — the record you want to make,
            who&rsquo;s playing on it, roughly when, and what kind of sound
            you&rsquo;re chasing. We read every inquiry and reply personally.
          </p>
        </header>

        <div className="reveal reveal-delay-2 mx-auto max-w-xl">
          <ContactInquiryForm />

          <div className="mt-20 border-t border-sand/10 pt-10 text-center">
            <p className="body-text-small mb-3 text-ivory/40">
              Or reach out directly
            </p>
            <a
              href="mailto:info@lulalakesound.com"
              className="headline-secondary text-xl text-sand transition-colors duration-500 hover:text-warm-white md:text-2xl"
            >
              info@lulalakesound.com
            </a>
            <p className="body-text-small mt-4 text-ivory/40">
              Chattanooga, Tennessee
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
