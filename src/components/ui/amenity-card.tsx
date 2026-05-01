import { cn } from "@/lib/utils";

interface AmenityCardProps {
  readonly name: string;
  readonly type: string;
  readonly description: string;
  /** When empty, the card renders as static content (no outer link). */
  readonly website: string;
  /** Optional extra classes (used by callers for reveal stagger, etc). */
  readonly className?: string;
}

const cardClassName =
  "group flex h-full flex-col justify-between gap-8 p-8 transition-colors duration-500 md:p-10";

/**
 * Editorial amenity entry.
 *
 * Intentionally un-carded — reads like a magazine directory listing. Hover
 * warms the sand rule rather than introducing a box shadow.
 */
export function AmenityCard({
  name,
  type,
  description,
  website,
  className,
}: AmenityCardProps) {
  const href = website.trim();
  const body = (
    <>
      <div>
        <p className="eyebrow mb-4 text-ivory/68 transition-colors duration-500 group-hover:text-sand/90">
          {type}
        </p>
        <h3 className="headline-secondary text-xl text-warm-white transition-colors duration-500 group-hover:text-ivory md:text-[1.375rem]">
          {name}
        </h3>
        <div className="mt-5 h-px w-10 bg-sand/48 transition-[width,background-color] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-20 group-hover:bg-sand" />
      </div>

      <p className="body-text-small leading-relaxed text-ivory/84">
        {description}
      </p>

      {href.length > 0 ? (
        <span className="label-text inline-flex items-center gap-2 text-[10px] text-sand/75 transition-colors duration-500 group-hover:text-sand">
          Visit
          <svg
            className="size-3 transition-transform duration-500 group-hover:translate-x-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.25}
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </span>
      ) : null}
    </>
  );

  if (href.length === 0) {
    return <div className={cn(cardClassName, className)}>{body}</div>;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(cardClassName, className)}
    >
      {body}
    </a>
  );
}
