interface AmenityCardProps {
  readonly index: number;
  readonly name: string;
  readonly type: string;
  readonly description: string;
  readonly website: string;
}

/**
 * Editorial amenity card. No rounded SaaS chrome — the card is a
 * quiet hairline frame with generous padding, a small index number,
 * and a calm hover state that only shifts colour, never scale.
 */
export function AmenityCard({
  index,
  name,
  type,
  description,
  website,
}: AmenityCardProps) {
  const indexLabel = String(index + 1).padStart(2, "0");

  return (
    <a
      href={website}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex h-full flex-col justify-between bg-transparent px-2 py-10 transition-colors duration-500 md:px-4 md:py-14"
    >
      <div>
        <div className="mb-8 flex items-baseline gap-6">
          <span className="label-text text-sand/55">{indexLabel}</span>
          <span className="label-text text-ivory/45">{type}</span>
        </div>

        <h3 className="headline-secondary mb-6 text-2xl text-ivory/90 transition-colors duration-500 group-hover:text-sand md:text-[1.75rem]">
          {name}
        </h3>

        <p className="body-text-small max-w-md text-ivory/60">{description}</p>
      </div>

      <span className="mt-10 inline-flex items-center gap-3 text-sand/60 transition-colors duration-500 group-hover:text-sand">
        <span className="label-text">Visit</span>
        <svg
          className="h-3 w-3 transition-transform duration-500 group-hover:translate-x-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.25}
            d="M17 8l4 4m0 0l-4 4m4-4H3"
          />
        </svg>
      </span>
    </a>
  );
}
