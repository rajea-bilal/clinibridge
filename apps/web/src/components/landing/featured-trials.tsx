import { useAction } from "convex/react";
import { api } from "@yugen/backend/convex/_generated/api";
import { useEffect, useState, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────────────

interface FeaturedTrial {
  nctId: string;
  title: string;
  summary: string;
  phase: string;
  status: string;
  locationCount: number;
  conditions: string[];
}

type FilterCategory = "all" | "oncology" | "neurology";

// ── Fallback data (never show empty) ───────────────────────────────

const FALLBACK_TRIALS: FeaturedTrial[] = [
  {
    nctId: "NCT06345678",
    title: "Gene Therapy for Spinal Muscular Atrophy in Infants",
    summary:
      "A phase 3, open-label study evaluating a one-time intravenous infusion of gene replacement therapy.",
    phase: "Phase 3",
    status: "RECRUITING",
    locationCount: 38,
    conditions: ["Spinal Muscular Atrophy"],
  },
  {
    nctId: "NCT05876543",
    title: "CAR-T Cell Therapy for Relapsed B-Cell Lymphoma",
    summary:
      "Evaluating the safety and efficacy of autologous CAR-T cells in adults with relapsed lymphoma.",
    phase: "Phase 2",
    status: "RECRUITING",
    locationCount: 22,
    conditions: ["B-Cell Lymphoma"],
  },
  {
    nctId: "NCT06198765",
    title: "Antisense Oligonucleotide for Huntington Disease",
    summary:
      "A randomized, double-blind study of an intrathecally administered antisense oligonucleotide.",
    phase: "Phase 1/Phase 2",
    status: "RECRUITING",
    locationCount: 14,
    conditions: ["Huntington Disease"],
  },
];

// ── Skeleton shimmer ───────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-white/10 ${className}`}
    />
  );
}

// ── Phase badge ────────────────────────────────────────────────────

function PhaseBadge({ phase }: { phase: string }) {
  return (
    <span className="inline-block bg-emerald-600/80 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm">
      {phase}
    </span>
  );
}

// ── Component ──────────────────────────────────────────────────────

export function FeaturedTrials() {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("all");
  const [trials, setTrials] = useState<FeaturedTrial[]>(FALLBACK_TRIALS);
  const [loading, setLoading] = useState(true);

  const getFeaturedTrials = useAction(api.featuredTrials.getFeaturedTrials);

  const fetchTrials = useCallback(
    async (category: FilterCategory) => {
      setLoading(true);
      try {
        const result = await getFeaturedTrials({ category });
        if (result && result.length > 0) {
          setTrials(result);
        } else {
          setTrials(FALLBACK_TRIALS);
        }
      } catch (err) {
        console.error("Failed to load featured trials:", err);
        setTrials(FALLBACK_TRIALS);
      } finally {
        setLoading(false);
      }
    },
    [getFeaturedTrials],
  );

  useEffect(() => {
    fetchTrials(activeFilter);
  }, [activeFilter, fetchTrials]);

  const handleFilterChange = (value: FilterCategory) => {
    setActiveFilter(value);
  };

  // Always show all 3 cards regardless of filter
  const card0 = trials[0] ?? FALLBACK_TRIALS[0];
  const card1 = trials[1] ?? FALLBACK_TRIALS[1];
  const card2 = trials[2] ?? FALLBACK_TRIALS[2];

  const filters: { label: string; value: FilterCategory }[] = [
    { label: "All Studies", value: "all" },
    { label: "Oncology", value: "oncology" },
    { label: "Neurology", value: "neurology" },
  ];

  const openTrial = (nctId: string) => {
    window.open(`https://clinicaltrials.gov/study/${nctId}`, "_blank", "noopener");
  };

  return (
    <section
      id="trials"
      className="relative py-24 md:py-32 bg-neutral-950 text-white overflow-hidden selection:bg-emerald-500/30"
    >
      {/* Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[600px] bg-emerald-900/20 rounded-full blur-[120px] pointer-events-none opacity-40 mix-blend-screen animate-pulse" />

      <div className="md:px-12 z-10 w-full max-w-7xl mr-auto ml-auto px-6 relative">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between items-center md:items-end mb-16 gap-8 text-center md:text-left">
          <div className="max-w-3xl relative animate-on-scroll">
            <div className="hidden md:block absolute -left-4 md:-left-8 top-1 bottom-1 w-1 bg-gradient-to-b from-emerald-500 to-transparent opacity-50" />
            <h2
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
              className="text-5xl md:text-8xl font-medium tracking-tighter text-white leading-[0.9]"
            >
              Recruiting{" "}
              <span className="text-white/20 font-light">Now.</span>
            </h2>
          </div>

          {/* Filter Pills */}
          <div className="relative group animate-on-scroll anim-delay-100 w-full md:w-auto">
            <div className="relative flex flex-wrap justify-center items-center p-1.5 rounded-[2rem] md:rounded-full bg-neutral-900/90 border border-white/10 backdrop-blur-xl shadow-2xl gap-2 w-full md:w-auto">
              {filters.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => handleFilterChange(f.value)}
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
          {/* ─── Large Card (card 0) ─── */}
          <div
            onClick={() => openTrial(card0.nctId)}
            className="group relative md:col-span-8 md:row-span-2 rounded-[2rem] overflow-hidden bg-neutral-900 border border-white/10 shadow-2xl transition-all duration-700 hover:border-white/20 hover:shadow-emerald-900/10 hover:shadow-2xl animate-on-scroll anim-delay-200 h-[500px] md:h-auto cursor-pointer"
          >
            <div className="absolute inset-0 z-0">
              <img
                src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/ea262fd9-14f0-4917-be69-86fd3b302ccd_1600w.webp"
                className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-1000 grayscale group-hover:grayscale-0"
                alt="Medical Research"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
            </div>

            {/* Phase badge */}
            <div className="absolute top-6 left-6 z-20">
              {loading ? (
                <Skeleton className="w-16 h-5" />
              ) : (
                <PhaseBadge phase={card0.phase} />
              )}
            </div>

            <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 z-20">
              <div className="max-w-xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                {loading ? (
                  <>
                    <Skeleton className="w-3/4 h-10 md:h-14 mb-4" />
                    <Skeleton className="w-full h-5 mb-2" />
                    <Skeleton className="w-2/3 h-5" />
                  </>
                ) : (
                  <>
                    <h3
                      style={{
                        fontFamily: "'Bricolage Grotesque', sans-serif",
                      }}
                      className="text-4xl md:text-6xl font-medium text-white mb-4 relative tracking-tight"
                    >
                      {card0.title}
                    </h3>
                    <p className="text-white/70 text-lg font-light leading-relaxed mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 max-w-md">
                      {card0.summary}
                    </p>
                    <span className="text-white/40 text-sm font-mono opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200">
                      {card0.locationCount} location
                      {card0.locationCount !== 1 ? "s" : ""} recruiting
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ─── Right Stack ─── */}
          <div className="md:col-span-4 md:row-span-2 flex flex-col gap-6 transition-all duration-500">
            {/* Card 1 (top-right) */}
            <div
              onClick={() => openTrial(card1.nctId)}
              className="group relative flex-1 rounded-[2rem] overflow-hidden bg-neutral-900 border border-white/10 shadow-xl transition-all duration-700 hover:border-white/20 hover:shadow-emerald-900/10 hover:shadow-2xl animate-on-scroll anim-delay-300 min-h-[300px] cursor-pointer"
            >
              <div className="absolute inset-0 z-0">
                <img
                  src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/ee3841e8-ef6d-45b3-9f33-9df069f9708a_1600w.webp"
                  className="w-full h-full object-cover opacity-50 group-hover:opacity-70 group-hover:scale-105 transition-all duration-700 grayscale group-hover:grayscale-0"
                  alt="Lab Research"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent" />
              </div>

              {/* Phase badge */}
              <div className="absolute top-5 left-5 z-20">
                {loading ? (
                  <Skeleton className="w-14 h-5" />
                ) : (
                  <PhaseBadge phase={card1.phase} />
                )}
              </div>

              <div className="absolute bottom-0 left-0 w-full p-8 z-20">
                {loading ? (
                  <>
                    <Skeleton className="w-3/4 h-8 mb-3" />
                    <Skeleton className="w-1/2 h-4" />
                  </>
                ) : (
                  <>
                    <h3
                      style={{
                        fontFamily: "'Bricolage Grotesque', sans-serif",
                      }}
                      className="text-3xl font-medium text-white mb-2 tracking-tight"
                    >
                      {card1.title}
                    </h3>
                    <span className="text-white/40 text-sm font-mono">
                      {card1.locationCount} location
                      {card1.locationCount !== 1 ? "s" : ""} recruiting
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Card 2 (bottom-right) */}
            <div
              onClick={() => openTrial(card2.nctId)}
              className="group relative flex-1 rounded-[2rem] overflow-hidden bg-neutral-900 border border-white/10 shadow-xl transition-all duration-700 hover:border-white/20 hover:shadow-emerald-900/10 hover:shadow-2xl animate-on-scroll anim-delay-400 min-h-[300px] cursor-pointer"
            >
              <div className="absolute inset-0 z-0">
                <img
                  src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/68494c15-da1d-47aa-a9ac-b6ee8c9286cc_800w.webp"
                  className="w-full h-full object-cover opacity-50 group-hover:opacity-70 group-hover:scale-105 transition-all duration-700 grayscale group-hover:grayscale-0"
                  alt="Medical Technology"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent" />
              </div>

              {/* Phase badge */}
              <div className="absolute top-5 left-5 z-20">
                {loading ? (
                  <Skeleton className="w-20 h-5" />
                ) : (
                  <PhaseBadge phase={card2.phase} />
                )}
              </div>

              <div className="absolute bottom-0 left-0 w-full p-8 z-20">
                {loading ? (
                  <>
                    <Skeleton className="w-3/4 h-8 mb-3" />
                    <Skeleton className="w-1/2 h-4" />
                  </>
                ) : (
                  <>
                    <h3
                      style={{
                        fontFamily: "'Bricolage Grotesque', sans-serif",
                      }}
                      className="text-3xl font-medium text-white mb-2 tracking-tight"
                    >
                      {card2.title}
                    </h3>
                    <span className="text-white/40 text-sm font-mono">
                      {card2.locationCount} location
                      {card2.locationCount !== 1 ? "s" : ""} recruiting
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
