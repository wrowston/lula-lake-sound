import Image from "next/image";

/**
 * Minimal editorial footer for the marketing site. Sits below the contact
 * section as a quiet sign-off — thin sand rule, a small logo, and a
 * carefully-set address.
 */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative bg-washed-black border-t border-sand/10">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 py-20 md:grid-cols-[auto_1fr_auto] md:items-end md:gap-16 md:px-12">
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

        <div className="flex flex-col items-start gap-3 md:items-end">
          <a
            href="mailto:info@lulalakesound.com"
            className="body-text-small text-sand transition-colors duration-500 hover:text-warm-white"
          >
            info@lulalakesound.com
          </a>
          <p className="label-text text-[10px] text-ivory/30">
            &copy; {year} Lula Lake Sound
          </p>
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
            className="mt-3 h-8 w-auto opacity-75"
          />
        </div>
      </div>
    </footer>
  );
}
