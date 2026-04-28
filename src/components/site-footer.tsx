import Image from "next/image";

/**
 * Minimal editorial footer for the marketing site. Sits below the contact
 * section as a quiet sign-off — a primary row of identity + contact,
 * followed by a hairline sand rule and a quiet credits line.
 */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative bg-washed-black border-t border-sand/10">
      <div className="mx-auto max-w-6xl px-6 py-20 md:px-12">
        {/* Primary row: wordmark / tagline / contact — vertically centered
         * so the three blocks read at a single editorial baseline regardless
         * of the wordmark's larger optical weight. */}
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[auto_1fr_auto] md:items-center md:gap-16">
          <div className="flex items-center">
            <Image
              src="/Logos/Wordmark/LLS_Logo_Text_Sand.png"
              alt="Lula Lake Sound"
              width={1024}
              height={135}
              className="h-10 w-auto max-w-[min(100%,320px)] object-contain object-left opacity-90"
            />
          </div>

          <div className="md:px-10 md:text-center">
            <p className="body-text-small text-ivory/55">
              A natural creative refuge on Lookout Mountain.
            </p>
            <p className="body-text-small mt-2 text-ivory/40">
              Chattanooga, Tennessee
            </p>
          </div>

          {/* Email paired with the Sage graphic mark — the pairing gives the
           * right column the same visual weight as the wordmark on the left,
           * so the row balances symmetrically around the centered tagline. */}
          <div className="flex items-center gap-5">
            <a
              href="mailto:info@lulalakesound.com"
              className="body-text-small text-sand transition-colors duration-500 hover:text-warm-white"
            >
              info@lulalakesound.com
            </a>
            {/* Graphic LLS mark in Sage — quiet secondary identity per the
             * brand guide's §2.2 guidance for repeated brand moments. Sage
             * holds its form on the Washed Black footer ground where Pond
             * disappears. */}
            <Image
              src="/Logos/Graphic/LLS_Logo_Graphic_Sage.png"
              alt=""
              width={200}
              height={200}
              aria-hidden
              className="h-8 w-auto opacity-75"
            />
          </div>
        </div>

        {/* Credits sub-row — copyright on the left, partner credit on the
         * right, divided from the primary row by a hairline sand rule. */}
        <div className="mt-14 flex flex-col items-start gap-2 border-t border-sand/10 pt-6 md:mt-16 md:flex-row md:items-center md:justify-between md:pt-6">
          <p className="label-text text-[10px] text-ivory/30">
            &copy; {year} Lula Lake Sound
          </p>
          <p className="label-text text-[10px] text-ivory/30">
            Powered by{" "}
            <a
              href="https://www.inferencepartners.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ivory/50 transition-colors duration-500 hover:text-sand"
            >
              Inference Partners
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
