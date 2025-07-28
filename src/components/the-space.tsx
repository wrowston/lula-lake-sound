export function TheSpace() {
  return (
    <section id="the-space" className="py-20 px-4 bg-washed-black relative">
      <div className="absolute inset-0 opacity-40 bg-texture-stone"></div>
      
      <div className="relative z-10 max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-ivory mb-16 text-center tracking-wide font-acumin">
          THE SPACE
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index + 1} className="aspect-[4/3] bg-sage/20 border-2 border-rust/60 rounded-sm flex flex-col items-center justify-center p-8">
              <div className="w-16 h-16 bg-sage/40 rounded-sm flex items-center justify-center mb-4">
                <span className="text-sage text-xs">LLS</span>
              </div>
              <p className="text-ivory/70 text-sm font-titillium text-center">
                Photo {index + 1} - Studio Space
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}