import Link from "next/link";
import { VariantSectionNav } from "../components/VariantSectionNav";

export default function VariantCLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-washed-black text-ivory relative grain-overlay">
      <Link
        href="/"
        className="fixed top-6 left-6 z-50 label-text text-ivory/40 hover:text-sand transition-colors text-[11px] flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
        </svg>
        Back to site
      </Link>

      <div className="fixed top-6 right-6 z-50 label-text text-sage text-[11px] bg-washed-black/80 backdrop-blur-sm px-4 py-2 border border-sage/20 rounded-full">
        Variant C — Alpine Minimal
      </div>

      <div className="fixed top-[3.35rem] left-0 right-0 z-40 flex justify-center px-4 md:top-[3.5rem] pointer-events-none">
        <VariantSectionNav variant="c" />
      </div>

      {children}

      <footer className="bg-charcoal border-t border-sand/8 py-16 px-6 md:px-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          <div>
            <p className="headline-secondary text-warm-white text-lg">Lula Lake Sound</p>
          </div>
          <div className="text-center">
            <p className="body-text-small text-ivory/30 text-sm">Lookout Mountain — Chattanooga, TN</p>
          </div>
          <div className="md:text-right flex gap-6 md:justify-end">
            <Link href="/#artist-inquiries" className="label-text text-ivory/35 hover:text-sand transition-colors text-[11px]">Book</Link>
            <Link href="mailto:hello@lulalakesound.com" className="label-text text-ivory/35 hover:text-sand transition-colors text-[11px]">Email</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
