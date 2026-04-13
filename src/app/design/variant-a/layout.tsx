import Link from "next/link";
import { VariantSectionNav } from "../components/VariantSectionNav";

export default function VariantALayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-deep-forest text-ivory relative grain-overlay">
      <Link
        href="/"
        className="fixed top-6 left-6 z-50 label-text text-ivory/40 hover:text-sand transition-colors text-[11px] flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
        </svg>
        Back to site
      </Link>

      <div className="fixed top-6 right-6 z-50 label-text text-gold/60 text-[11px] bg-deep-forest/80 backdrop-blur-sm px-4 py-2 border border-gold/15 rounded-full">
        Variant A — Cinematic Editorial
      </div>

      <div className="fixed top-[3.35rem] left-0 right-0 z-40 flex justify-center px-4 md:top-[3.5rem] pointer-events-none">
        <VariantSectionNav variant="a" />
      </div>

      {children}

      <footer className="bg-deep-forest border-t border-sand/8 py-16 px-6 md:px-16">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <p className="headline-secondary text-sand text-xl">Lula Lake Sound</p>
            <p className="body-text-small text-ivory/40 mt-1">Lookout Mountain — Chattanooga, TN</p>
          </div>
          <div className="flex gap-8">
            <Link href="/#artist-inquiries" className="label-text text-ivory/40 hover:text-sand transition-colors text-[11px]">Book</Link>
            <Link href="mailto:hello@lulalakesound.com" className="label-text text-ivory/40 hover:text-sand transition-colors text-[11px]">Contact</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
