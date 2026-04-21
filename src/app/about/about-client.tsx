"use client";

import { usePreloadedQuery, type Preloaded } from "convex/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { PublicAboutSnapshot } from "../../../convex/cmsShared";
import { Header } from "@/components/header";

type PreloadedAbout = Preloaded<typeof api.public.getPublishedAbout>;
type PreloadedPricing = Preloaded<typeof api.public.getPublishedPricingFlags>;

function AboutBody({ data }: { readonly data: PublicAboutSnapshot }) {
  const html = data.bodyHtml?.trim();
  if (html && html.length > 0) {
    return (
      <div
        className="prose-editor max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <div className="prose-editor max-w-none space-y-4">
      {data.body.map((block, i) =>
        block.type === "heading" ? (
          <h2 key={i} className="text-sand">
            {block.text}
          </h2>
        ) : (
          <p key={i}>{block.text}</p>
        ),
      )}
    </div>
  );
}

export function AboutClient({
  aboutPreloaded,
  pricingPreloaded,
}: {
  readonly aboutPreloaded: PreloadedAbout;
  readonly pricingPreloaded: PreloadedPricing;
}) {
  const data = usePreloadedQuery(aboutPreloaded);
  const pricingData = usePreloadedQuery(pricingPreloaded);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const showPricing = pricingData.flags.priceTabEnabled;

  return (
    <div className="dark min-h-screen bg-washed-black relative grain-overlay">
      <Header scrollY={scrollY} showPricing={showPricing} />

      <main className="mx-auto max-w-3xl px-4 pb-24 pt-28 md:pt-32">
        <p className="label-text text-sand/70 mb-2">
          <Link href="/" className="hover:text-sand transition-colors">
            Home
          </Link>
          <span className="mx-2 text-sand/40">/</span>
          About
        </p>

        <h1 className="headline-primary text-ivory mb-3 text-balance">
          {data.heroTitle}
        </h1>
        {data.heroSubtitle ? (
          <p className="body-text text-ivory/75 mb-10 max-w-2xl">
            {data.heroSubtitle}
          </p>
        ) : (
          <div className="mb-10" />
        )}

        <AboutBody data={data} />

        {data.teamMembers && data.teamMembers.length > 0 ? (
          <section className="mt-24 border-t border-sand/10 pt-16">
            <h2 className="headline-secondary text-sand mb-10 text-center">
              Team
            </h2>
            <ul className="grid gap-10 sm:grid-cols-2">
              {data.teamMembers.map((m) => (
                <li
                  key={m.id}
                  className="flex flex-col items-center text-center space-y-3"
                >
                  {m.imageUrl ? (
                    <div className="relative size-40 overflow-hidden rounded-full border border-sand/15 bg-charcoal/50">
                      <Image
                        src={m.imageUrl}
                        alt={m.name}
                        fill
                        sizes="160px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      className="flex size-40 items-center justify-center rounded-full border border-dashed border-sand/20 bg-charcoal/30 text-xs text-ivory/40"
                      aria-hidden
                    >
                      No photo
                    </div>
                  )}
                  <div>
                    <p className="headline-secondary text-ivory">{m.name}</p>
                    <p className="body-text-small text-ivory/65">{m.title}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
    </div>
  );
}
