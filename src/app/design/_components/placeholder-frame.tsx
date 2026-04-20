import Image from "next/image";

type Texture =
  | "emerald"
  | "sagebrush"
  | "seafoam"
  | "sunset"
  | "goldenhour"
  | "starburst"
  | "coral";

const TEXTURE_SRC: Record<Texture, string> = {
  emerald: "/Textured Backgrounds/LLS_Texture_Emerald.jpg",
  sagebrush: "/Textured Backgrounds/LLS_Texture_Sagebrush.jpg",
  seafoam: "/Textured Backgrounds/LLS_Texture_Seafoam.jpg",
  sunset: "/Textured Backgrounds/LLS_Texture_Sunset.jpg",
  goldenhour: "/Textured Backgrounds/LLS_Texture_GoldenHour.jpg",
  starburst: "/Textured Backgrounds/LLS_Texture_Starburst.jpg",
  coral: "/Textured Backgrounds/LLS_Texture_Coral.jpg",
};

/**
 * Placeholder image frame.
 *
 * Uses the LLS textured background kit plus a corner index stamp and an
 * optional caption, so reviewers can read the intent of each slot
 * ("wide shot: live room — drum kit during tracking") without us having
 * to source real photography for the exploration.
 */
export function PlaceholderFrame({
  texture,
  index,
  caption,
  subject,
  ratio = "4/3",
  className = "",
}: {
  readonly texture: Texture;
  /** 2-digit index stamped in the top-left, e.g. "07". */
  readonly index?: string;
  /** Short italicised caption rendered at the bottom of the frame. */
  readonly caption?: string;
  /** Italicised subject line stamped in the center — describes the shot. */
  readonly subject: string;
  /** CSS aspect-ratio, e.g. "3/4", "16/9". Defaults to `4/3`. */
  readonly ratio?: string;
  readonly className?: string;
}) {
  return (
    <figure
      className={`relative isolate overflow-hidden bg-washed-black ${className}`}
      style={{ aspectRatio: ratio }}
    >
      <Image
        src={TEXTURE_SRC[texture]}
        alt=""
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover opacity-[0.85]"
      />
      <div className="absolute inset-0 bg-washed-black/45" />
      <div aria-hidden className="absolute inset-0 bg-chladni-1 opacity-25" />
      <div className="absolute inset-0 flex flex-col justify-between p-4 md:p-5">
        <div className="flex items-start justify-between gap-3">
          {index ? (
            <span className="label-text text-[9px] text-sand/85">{index}</span>
          ) : (
            <span />
          )}
          <span className="label-text text-[9px] text-ivory/45">LLS · Film</span>
        </div>
        <div className="flex flex-col items-center gap-2 pb-2 text-center">
          <span className="h-px w-8 bg-sand/45" aria-hidden />
          <p
            className="max-w-[80%] text-[11px] italic leading-snug text-warm-white/85"
            style={{ fontFamily: "var(--font-family-titillium)" }}
          >
            {subject}
          </p>
        </div>
      </div>
      {caption ? (
        <figcaption className="absolute inset-x-4 bottom-4 border-t border-sand/15 pt-2 text-left">
          <span className="body-text-small text-[11px] italic text-ivory/60">
            {caption}
          </span>
        </figcaption>
      ) : null}
    </figure>
  );
}
