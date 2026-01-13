export function HomeTitle() {
  return (
    <div className="text-center mb-8 relative">
      <h1
        className="text-7xl lg:text-9xl text-green-500 drop-shadow-[4px_4px_0_rgba(0,0,0,1)] stroke-black"
        style={{ WebkitTextStroke: '2px black', textShadow: '0 0 20px rgba(34,197,94,0.8)' }}
      >
        DOSED
      </h1>
      {/* Dripping effect SVG could go here */}
      <h2 className="text-3xl lg:text-4xl text-white tracking-[0.2em] -mt-2 lg:-mt-4 relative inline-block">
        <span className="text-red-500 absolute -left-1 -top-0.5 opacity-50 blur-[1px]">PILL ROULETTE</span>
        <span className="relative z-10 drop-shadow-md">PILL ROULETTE</span>
      </h2>
    </div>
  );
}
