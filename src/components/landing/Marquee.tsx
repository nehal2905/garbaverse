const words = ["Garba", "Dandiya", "Dhol", "Aarti", "Chaniya Choli", "Raas", "Sanedo", "Dholida"];

export function Marquee() {
  const row = [...words, ...words];
  return (
    <div className="mask-fade-x relative overflow-hidden border-y border-brand-500/20 py-4" aria-hidden="true">
      <div className="flex w-max gap-10 motion-safe:animate-[marquee_40s_linear_infinite]">
        {row.map((w, i) => (
          <span key={i} className="flex items-center gap-10 font-display text-lg tracking-[0.25em] text-brand-600/80">
            {w.toUpperCase()}
            <span className="text-saffron">✦</span>
          </span>
        ))}
      </div>
      <style>{`@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
    </div>
  );
}
