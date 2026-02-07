export function EmeraldDivider() {
  return (
    <div className="w-full bg-neutral-950 py-12 flex items-center justify-center relative z-20 overflow-hidden">
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-white/10" />
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent w-3/4 mx-auto" />
      <div className="relative bg-neutral-950 p-3 border border-white/10 rounded-full flex items-center justify-center shadow-2xl">
        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.6)] animate-pulse" />
      </div>
    </div>
  );
}
