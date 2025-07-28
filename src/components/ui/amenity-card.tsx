interface AmenityCardProps {
  readonly name: string;
  readonly type: string;
  readonly description: string;
  readonly website: string;
}

export function AmenityCard({ name, type, description, website }: AmenityCardProps) {
  return (
    <div className="bg-sage/10 border-2 border-rust/60 rounded-sm p-6 hover:bg-sage/20 transition-all duration-300 group">
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-sand font-acumin group-hover:text-ivory transition-colors">
            {name}
          </h3>
          <p className="text-sand/90 text-sm font-medium font-titillium tracking-wide">
            {type}
          </p>
        </div>
        
        <p className="text-ivory/80 text-sm leading-relaxed font-titillium">
          {description}
        </p>
        
        <div className="pt-2">
          <a 
            href={website} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block text-sage hover:text-sand text-sm font-medium font-titillium tracking-wide transition-colors border-b border-sage/40 hover:border-sand/60"
          >
            Visit Website →
          </a>
        </div>
      </div>
    </div>
  );
} 