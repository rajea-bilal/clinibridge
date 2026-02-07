import { Dna, Search, ArrowRight, ArrowUpRight } from "lucide-react";

export function HeroSection() {
  return (
    <header className="relative w-full overflow-hidden flex flex-col justify-end pb-12 md:pb-24 min-h-screen pt-32">
      {/* Background Image Layer */}
      <div className="absolute inset-0 z-0 bg-black">
        <img
          src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/25904405-aa15-491b-9a03-de5fc75f18b3_3840w.webp"
          className="w-full h-full object-cover animate-cinematic opacity-0"
          alt="Abstract clinical research background"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent opacity-80" />
        <div className="bg-black/10 mix-blend-overlay absolute inset-0" />
      </div>

      <div className="relative z-10 w-full max-w-[90rem] mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
        {/* Left Column: Primary Headline */}
        <div className="md:col-span-7 relative pb-8 md:pb-0">
          <div className="flex items-center gap-3 mb-6 animate-[slideUpFade_1s_ease-out_forwards] [animation-delay:0.5s] opacity-0">
            <span className="h-[1px] w-8 bg-emerald-500" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-400">
              Real Options, No Guesswork
            </span>
          </div>

          <h1 className="text-white tracking-tight font-semibold font-bricolage">
            <span className="block text-hero mix-blend-normal uppercase animate-[slideUpFade_1s_ease-out_forwards] [animation-delay:0.7s] opacity-0 text-white drop-shadow-2xl">
              Clinical trials
            </span>
            <span className="block text-4xl md:text-6xl lg:text-7xl leading-[0.85] text-white/60 animate-[slideUpFade_1s_ease-out_forwards] [animation-delay:0.9s] opacity-0">
            that make sense.
            </span>
          </h1>

          <div className="mt-8 max-w-xl animate-[slideUpFade_1s_ease-out_forwards] [animation-delay:1.1s] opacity-0">
            <p className="text-lg text-white/80 font-light border-l-2 border-emerald-500 pl-6">
            CliniBridge turns symptoms into a patient profile, searches thousands of recruiting trials, and scores fit against eligibility criteria—so you get a shortlist worth acting on
            </p>
          </div>
        </div>

        {/* Right Column: Glassmorphism Card */}
        <div className="md:col-span-5 md:col-start-8 flex flex-col justify-end items-end w-full relative z-20">
          <div className="overflow-hidden animate-[slideUpFade_1s_ease-out_forwards] [animation-delay:0.8s] bg-neutral-950/60 opacity-0 border-white/10 border rounded-2xl ring-white/5 ring-1 p-5 md:p-8 relative shadow-2xl backdrop-blur-2xl w-full max-w-md">
            {/* Shimmer Overlay */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent z-0 pointer-events-none animate-shimmer-effect" />

            <div className="relative z-10">
              <p className="text-sm md:text-base text-white font-light leading-relaxed mb-6 md:mb-8 antialiased drop-shadow-md">
                Stop endless searching. Our AI analyzes exclusion criteria
                against your specific profile.
              </p>

              {/* Buttons */}
              <div className="flex flex-col gap-3">
                {/* Match Button → /chat */}
                <a
                  href="/chat"
                  className="group relative w-full overflow-hidden rounded-xl p-[1px] transition-all hover:scale-[1.01] active:scale-[0.99] block"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/40 via-teal-500/40 to-emerald-500/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-spin-slow-reverse" />
                  <div className="relative h-full w-full bg-neutral-900/90 backdrop-blur-xl rounded-xl border border-emerald-500/20 group-hover:border-transparent transition-colors px-5 py-4 flex items-center justify-between shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                    <div className="flex items-center gap-4 w-full">
                      <div className="w-10 h-10 shrink-0 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:text-emerald-300 transition-all">
                        <Dna className="size-[22px]" />
                      </div>
                      <span className="font-mono text-[13px] font-medium uppercase tracking-widest text-white group-hover:text-emerald-100 transition-colors truncate">
                        Get matches
                      </span>
                    </div>
                    <div className="text-white/20 group-hover:text-emerald-400 transition-colors transform group-hover:translate-x-1 duration-300 shrink-0">
                      <ArrowRight className="size-5" />
                    </div>
                  </div>
                </a>

                {/* Diagnosis Button → /find */}
                <a
                  href="/find"
                  className="group relative w-full overflow-hidden rounded-xl p-[1px] transition-all hover:scale-[1.01] active:scale-[0.99] block"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/20 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-spin-slow-reverse" />
                  <div className="relative h-full w-full bg-neutral-900/90 backdrop-blur-xl rounded-xl border border-white/10 group-hover:border-transparent transition-colors px-5 py-4 flex items-center justify-between shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                    <div className="flex items-center gap-4 w-full">
                      <div className="w-10 h-10 shrink-0 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 group-hover:text-white transition-all">
                        <Search className="size-5" />
                      </div>
                      <span className="font-mono text-[13px] font-medium uppercase tracking-widest text-white group-hover:text-white transition-colors truncate">
                        I know the diagnosis
                      </span>
                    </div>
                    <div className="text-white/20 group-hover:text-white transition-colors transform group-hover:translate-x-1 duration-300 shrink-0">
                      <ArrowRight className="size-5" />
                    </div>
                  </div>
                </a>
              </div>

              <p className="mt-6 text-[10px] text-center text-white/40 uppercase tracking-wider">
                No account needed. Privacy first.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-[slideUpFade_1s_ease-out_forwards] [animation-delay:1.5s] opacity-0 pointer-events-none">
        <span className="text-[10px] uppercase tracking-widest text-white/40">
          Scroll
        </span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-white to-transparent" />
      </div>
    </header>
  );
}
