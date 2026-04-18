import Image from "next/image";
import Link from "next/link";

/**
 * Minimal editorial footer.
 *
 * Just a mark, a return address, a couple of quiet links. No social
 * icons, no mailing-list CTA, no repeated primary action. Everything
 * is hairline-separated so it feels like the closing page of a
 * book rather than a conversion bar.
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-deep-forest px-6 py-20 md:py-24">
      <div className="absolute inset-0 bg-texture-paper opacity-30" />

      <div className="relative z-10 mx-auto max-w-[80rem]">
        <div className="section-rule mb-14" />

        <div className="grid grid-cols-1 items-start gap-12 md:grid-cols-[auto_1fr_auto]">
          {/* Mark */}
          <div className="flex items-center gap-5">
            <Image
              src="/LLS_Logo_Full_Tar.png"
              alt="Lula Lake Sound"
              width={72}
              height={72}
              className="h-12 w-auto brightness-0 invert opacity-85"
            />
            <div>
              <p className="headline-secondary text-lg text-ivory/90">
                Lula Lake Sound
              </p>
              <p className="body-text-small text-ivory/45">
                Recording studio · Chattanooga, TN
              </p>
            </div>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-3 md:items-center md:text-center">
            <p className="label-text text-sand/65">Get in touch</p>
            <a
              href="mailto:info@lulalakesound.com"
              className="body-text text-ivory/85 transition-colors duration-500 hover:text-sand"
            >
              info@lulalakesound.com
            </a>
          </div>

          {/* Small nav */}
          <nav className="flex flex-col gap-3 md:items-end md:text-right">
            <p className="label-text text-sand/65">Explore</p>
            <Link
              href="#the-space"
              className="body-text-small text-ivory/70 transition-colors duration-500 hover:text-sand"
            >
              The Studio
            </Link>
            <Link
              href="#equipment-specs"
              className="body-text-small text-ivory/70 transition-colors duration-500 hover:text-sand"
            >
              The Gear
            </Link>
            <Link
              href="#artist-inquiries"
              className="body-text-small text-ivory/70 transition-colors duration-500 hover:text-sand"
            >
              Inquire
            </Link>
          </nav>
        </div>

        <div className="section-rule mt-14 mb-8" />

        <div className="flex flex-col items-center justify-between gap-3 md:flex-row">
          <p className="body-text-small text-ivory/35">
            © {year} Lula Lake Sound. All rights reserved.
          </p>
          <p className="label-text text-sand/45">
            Built quietly, in the mountains.
          </p>
        </div>
      </div>
    </footer>
  );
}
