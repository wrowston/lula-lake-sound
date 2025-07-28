interface AmenityCardProps {
  readonly name: string;
  readonly type: string;
  readonly description: string;
  readonly website: string;
}

export function AmenityCard({ name, type, description, website }: AmenityCardProps) {
  return (
    <div className="bg-washed-black/60 border-2 border-sage/30 rounded-sm p-6 hover:border-sand/50 transition-all duration-300 group">
      {/* Header */}
      <div className="mb-4">
        <h3 className="headline-secondary text-sand text-lg mb-2 group-hover:text-ivory transition-colors">
          {name}
        </h3>
        <p className="body-text-small text-sage uppercase tracking-wide">
          {type}
        </p>
      </div>
      
      {/* Description */}
      <p className="body-text text-ivory/80 mb-6 leading-relaxed">
        {description}
      </p>
      
      {/* Website Link */}
      <a 
        href={website}
        target="_blank"
        rel="noopener noreferrer"
        className="body-text text-sand hover:text-ivory transition-colors inline-flex items-center gap-2 group-hover:gap-3 transition-all"
      >
        Visit Website
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  );
} 