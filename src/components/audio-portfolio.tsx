"use client";

import { Button } from "@/components/ui/button";

export type PublishedAudioTrack = {
  readonly stableId: string;
  readonly title: string;
  readonly url: string;
};

type AudioPortfolioProps = {
  /** Published or preview tracks with signed URLs. Empty array shows a quiet empty state. */
  readonly tracks: PublishedAudioTrack[] | null | undefined;
};

export function AudioPortfolio({ tracks }: AudioPortfolioProps) {
  const list = tracks ?? [];

  return (
    <section id="audio-portfolio" className="relative bg-forest px-4 py-20">
      <div className="absolute inset-0 bg-texture-stone opacity-20" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="mb-6 font-acumin text-3xl font-bold text-sand md:text-4xl">
            STUDIO PORTFOLIO
          </h2>
          <p className="mx-auto max-w-3xl font-titillium text-lg leading-relaxed text-ivory/80">
            Listen to the quality and character that artists achieve at Lula Lake
            Sound. From intimate acoustic sessions to full band recordings, hear how
            our space and expertise bring out the best in every project.
          </p>
        </div>

        {list.length === 0 ? (
          <div className="mx-auto mb-12 max-w-xl rounded-sm border border-sage/30 bg-washed-black/40 px-6 py-10 text-center">
            <p className="font-titillium text-sm text-ivory/60">
              Audio samples will appear here once they are published from the studio
              CMS.
            </p>
          </div>
        ) : (
          <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {list.map((track) => (
              <div
                key={track.stableId}
                className="rounded-sm border border-sage/30 bg-washed-black/60 p-6 transition-colors hover:border-sand/50"
              >
                <h3 className="mb-4 font-acumin text-lg font-bold text-sand">
                  {track.title}
                </h3>
                <audio
                  controls
                  preload="metadata"
                  src={track.url}
                  className="h-10 w-full max-w-full"
                />
              </div>
            ))}
          </div>
        )}

        <div className="text-center">
          <p className="mb-6 font-titillium text-ivory/70">
            Ready to create something extraordinary?
          </p>
          <Button
            variant="outline"
            size="lg"
            className="h-10 px-6"
            type="button"
            onClick={() =>
              document
                .getElementById("artist-inquiries")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            START YOUR PROJECT
          </Button>
        </div>
      </div>
    </section>
  );
}
