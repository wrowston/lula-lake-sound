interface AmenityCardProps {
  readonly name: string;
  readonly type: string;
  readonly description: string;
  readonly website: string;
}

export function AmenityCard({ name, type, description, website }: AmenityCardProps) {
  return (
    <a
      href={website}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-washed-black/40 border border-sand/8 p-6 md:p-8 hover:border-sand/20 transition-all duration-500"
    >
      {/* Header */}
      <div className="mb-4">
        <p className="label-text text-ivory/30 mb-3">{type}</p>
        <h3 className="headline-secondary text-sand text-lg group-hover:text-warm-white transition-colors duration-300">
          {name}
        </h3>
      </div>

      {/* Description */}
      <p className="body-text-small text-ivory/50 mb-6 leading-relaxed">
        {description}
      </p>

      {/* Link indicator */}
      <span className="inline-flex items-center gap-2 label-text text-sand/50 group-hover:text-sand transition-colors duration-300 text-[10px]">
        Visit
        <svg
          className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </span>
    </a>
  );
}
