export function SectionDivider() {
  return (
    <div className="relative w-full py-8 sm:py-12 md:py-16">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-px w-full max-w-4xl bg-gradient-to-r from-transparent via-white/5 to-transparent backdrop-blur-sm" />
      </div>
    </div>
  );
}
