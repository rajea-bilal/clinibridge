import { useState } from "react";

type FilterCategory = "all" | "oncology" | "neurology";

export function FeaturedTrials() {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("all");

  const showAres = activeFilter === "all" || activeFilter === "oncology";
  const showGateway = activeFilter === "all" || activeFilter === "neurology";
  const showTitan = activeFilter === "all" || activeFilter === "oncology";

  const filters: { label: string; value: FilterCategory }[] = [
    { label: "All Studies", value: "all" },
    { label: "Oncology", value: "oncology" },
    { label: "Neurology", value: "neurology" },
  ];

  return (
    <section
      id="projects"
      className="relative py-24 md:py-32 bg-neutral-950 text-white overflow-hidden selection:bg-emerald-500/30"
    >
      {/* Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[600px] bg-emerald-900/20 rounded-full blur-[120px] pointer-events-none opacity-40 mix-blend-screen animate-pulse" />

      <div className="md:px-12 z-10 w-full max-w-7xl mr-auto ml-auto px-6 relative">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between items-center md:items-end mb-16 gap-8 text-center md:text-left">
          <div className="max-w-3xl relative animate-on-scroll">
            <div className="hidden md:block absolute -left-4 md:-left-8 top-1 bottom-1 w-1 bg-gradient-to-b from-emerald-500 to-transparent opacity-50" />
            <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-5xl md:text-8xl font-medium tracking-tighter text-white leading-[0.9]">
              Featured{" "}
              <span className="text-white/20 font-light">Trials.</span>
            </h2>
          </div>

          {/* Filter Pills */}
          <div className="relative group animate-on-scroll anim-delay-100 w-full md:w-auto">
            <div className="relative flex flex-wrap justify-center items-center p-1.5 rounded-[2rem] md:rounded-full bg-neutral-900/90 border border-white/10 backdrop-blur-xl shadow-2xl gap-2 w-full md:w-auto">
              {filters.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setActiveFilter(f.value)}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${
                    activeFilter === f.value
                      ? "bg-white text-neutral-950 shadow-lg shadow-white/5 scale-105"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto md:h-[800px] transition-all duration-500">
          {/* Large Card — Gene Therapy A */}
          {showAres && (
            <div className="group relative md:col-span-8 md:row-span-2 rounded-[2rem] overflow-hidden bg-neutral-900 border border-white/10 shadow-2xl transition-all duration-700 hover:border-white/20 animate-on-scroll anim-delay-200 h-[500px] md:h-auto">
              <div className="absolute inset-0 z-0">
                <img
                  src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/ea262fd9-14f0-4917-be69-86fd3b302ccd_1600w.webp"
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-1000 grayscale group-hover:grayscale-0"
                  alt="Medical Research"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
              </div>
              <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 z-20">
                <div className="max-w-xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-4xl md:text-6xl font-medium text-white mb-4 relative tracking-tight">
                    Gene Therapy A
                  </h3>
                  <p className="text-white/70 text-lg font-light leading-relaxed mb-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 max-w-md">
                    Targeted RNA intervention for rare metabolic disorders.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Right Stack */}
          <div
            className={`${
              showAres ? "md:col-span-4" : "md:col-span-12"
            } md:row-span-2 flex flex-col gap-6 transition-all duration-500`}
          >
            {/* CAR-T Study */}
            {showGateway && (
              <div className="group relative flex-1 rounded-[2rem] overflow-hidden bg-neutral-900 border border-white/10 shadow-xl transition-all duration-700 hover:border-white/20 animate-on-scroll anim-delay-300 min-h-[300px]">
                <div className="absolute inset-0 z-0">
                  <img
                    src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/ee3841e8-ef6d-45b3-9f33-9df069f9708a_1600w.webp"
                    className="w-full h-full object-cover opacity-50 group-hover:opacity-70 group-hover:scale-105 transition-all duration-700 grayscale group-hover:grayscale-0"
                    alt="Lab Research"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 w-full p-8 z-20">
                  <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-3xl font-medium text-white mb-2 tracking-tight">
                    CAR-T Study
                  </h3>
                </div>
              </div>
            )}

            {/* BCI Interface */}
            {showTitan && (
              <div className="group relative flex-1 rounded-[2rem] overflow-hidden bg-neutral-900 border border-white/10 shadow-xl transition-all duration-700 hover:border-white/20 animate-on-scroll anim-delay-400 min-h-[300px]">
                <div className="absolute inset-0 z-0">
                  <img
                    src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/68494c15-da1d-47aa-a9ac-b6ee8c9286cc_800w.webp"
                    className="w-full h-full object-cover opacity-50 group-hover:opacity-70 group-hover:scale-105 transition-all duration-700 grayscale group-hover:grayscale-0"
                    alt="Medical Technology"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 w-full p-8 z-20">
                  <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-3xl font-medium text-white mb-2 tracking-tight">
                    BCI Interface
                  </h3>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
