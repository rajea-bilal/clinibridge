import { Search, ShieldCheck, ArrowRight } from "lucide-react";

export function NetworkSection() {
  return (
    <section
      className="py-24 bg-neutral-900 text-white relative overflow-hidden"
      id="network"
    >
      {/* Dot grid background */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "radial-gradient(#fff 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Column — Copy */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="w-8 h-[1px] bg-emerald-500" />
              <span className="text-emerald-500 text-xs font-mono uppercase tracking-widest">
                Global Network
              </span>
            </div>

            <h2
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
              className="text-4xl md:text-6xl font-medium mb-6 leading-tighter animate-on-scroll"
            >
              Connecting Patients
              <br />
              <span className="text-white/40">to Clinical Trials</span>
            </h2>

            <p className="text-white/60 text-lg mb-8 leading-relaxed font-light animate-on-scroll anim-delay-100">
              CliniBridge bridges the gap between patients and recruiting
              studies worldwide. From oncology breakthroughs to rare-disease
              gene therapies, our AI scans thousands of active trials and
              matches you to the ones that fit.
            </p>

            <div className="space-y-6">
              {/* Feature 1 */}
              <div className="flex gap-4 group cursor-default animate-on-scroll anim-delay-200">
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-white/10 transition-colors">
                  <Search className="size-5 text-white" />
                </div>
                <div>
                  <h4
                    style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                    className="text-xl font-medium mb-1"
                  >
                    AI-Powered Matching
                  </h4>
                  <p className="text-sm text-white/50">
                    Symptoms and medical history are scored against complex
                    eligibility criteria in seconds.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex gap-4 group cursor-default animate-on-scroll anim-delay-300">
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-white/10 transition-colors">
                  <ShieldCheck className="size-5 text-white" />
                </div>
                <div>
                  <h4
                    style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                    className="text-xl font-medium mb-1"
                  >
                    Real-Time Eligibility
                  </h4>
                  <p className="text-sm text-white/50">
                    Live enrollment status and inclusion criteria verified
                    directly from ClinicalTrials.gov.
                  </p>
                </div>
              </div>
            </div>

            <a
              href="/chat"
              className="mt-10 px-8 py-3 bg-white text-black rounded-full font-medium hover:bg-neutral-200 transition-colors inline-flex items-center gap-2 group animate-on-scroll anim-delay-300"
            >
              Start Matching
              <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          {/* Right Column — Visual */}
          <div className="relative lg:h-[600px] w-full rounded-2xl overflow-hidden border border-white/10 group animate-on-scroll h-[300px] md:h-[500px]">
            <img
              src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/ee3841e8-ef6d-45b3-9f33-9df069f9708a_1600w.webp"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-60"
              alt="Global clinical trial network"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-neutral-900/20" />

            {/* Spot 1 — Active Trial */}
            <div className="absolute top-1/4 left-1/3 group/spot">
              <div className="w-4 h-4 bg-emerald-500 rounded-full animate-ping absolute inset-0" />
              <div className="w-4 h-4 bg-emerald-500 rounded-full relative z-10 cursor-pointer border-2 border-white shadow-[0_0_20px_rgba(16,185,129,0.5)]" />
              <div className="absolute left-6 top-0 bg-black/80 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 w-56 opacity-0 group-hover/spot:opacity-100 transition-all duration-300 translate-y-2 group-hover/spot:translate-y-0 pointer-events-none">
                <span className="text-xs font-mono text-emerald-400 block mb-1 uppercase tracking-wider">
                  Oncology — Phase III
                </span>
                <span className="text-[11px] text-white/70 block">
                  Sites: 42 recruiting
                </span>
                <span className="text-[10px] text-white/40 block mt-1">
                  Status: Actively Enrolling
                </span>
              </div>
            </div>

            {/* Spot 2 — Research Hub */}
            <div className="absolute bottom-1/3 right-1/4 group/spot">
              <div className="w-4 h-4 bg-blue-500 rounded-full animate-ping absolute inset-0 [animation-delay:0.5s]" />
              <div className="w-4 h-4 bg-blue-500 rounded-full relative z-10 cursor-pointer border-2 border-white shadow-[0_0_20px_rgba(59,130,246,0.5)]" />
              <div className="absolute right-6 top-0 bg-black/80 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 w-56 opacity-0 group-hover/spot:opacity-100 transition-all duration-300 translate-y-2 group-hover/spot:translate-y-0 pointer-events-none text-right">
                <span className="text-xs font-mono text-blue-400 block mb-1 uppercase tracking-wider">
                  Gene Therapy Hub
                </span>
                <span className="text-[11px] text-white/70 block">
                  Trials: 18 matched
                </span>
                <span className="text-[10px] text-white/40 block mt-1">
                  Speciality: Rare Disease
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
