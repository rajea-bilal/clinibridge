import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { useEffect } from "react";
import { useScrollAnimation } from "@/lib/useScrollAnimation";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  useScrollAnimation();

  // Force html/body bg to match — global CSS sets bg-white which bleeds below content
  useEffect(() => {
    const bg = "#0a0a0a";
    document.documentElement.style.backgroundColor = bg;
    document.body.style.backgroundColor = bg;
    return () => {
      document.documentElement.style.backgroundColor = "";
      document.body.style.backgroundColor = "";
    };
  }, []);

  return (
    <div
      style={{ fontFamily: "'Inter', sans-serif" }}
      className="flex flex-col min-h-dvh bg-neutral-950 text-neutral-50 w-full overflow-x-hidden selection:bg-emerald-500/30 selection:text-white relative antialiased"
    >
      {/* Grain Overlay */}
      <div className="bg-grain" />

      {/* Ambient glows — matching chat UI */}
      <div className="fixed top-[-20%] right-[-10%] w-[800px] h-[800px] bg-emerald-900/[0.03] rounded-full blur-[200px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] left-[-8%] w-[500px] h-[500px] bg-neutral-800/[0.05] rounded-full blur-[160px] pointer-events-none z-0" />

      <Navbar />

      {/* Main content — flex-1 pushes footer down */}
      <main className="flex-1 relative z-10">
        <div className="max-w-[880px] mx-auto px-6 pt-32 pb-24 md:pt-40 md:pb-32">
          {/* Back link */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white/20 text-xs font-mono uppercase tracking-[0.1em] mb-16 hover:text-emerald-400/70 transition-colors duration-300"
          >
            <ArrowLeft className="size-3.5" />
            Back
          </Link>

          {/* ── Hero ── */}
          <div className="mb-24 animate-[slideUpFade_0.8s_ease-out_forwards_0.1s] opacity-0">
            <div className="flex items-center gap-3 mb-8">
              <span className="h-[1px] w-10 bg-emerald-500/40" />
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-400/60">
                The Problem
              </span>
            </div>
            <h1
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
              className="text-4xl sm:text-5xl md:text-[3.5rem] font-semibold leading-[1.08] tracking-tight mb-8"
            >
              300 million people.
              <br />
              Almost zero tools{" "}
              <span className="text-white/20 font-normal">built for them.</span>
            </h1>
            <p className="text-[17px] text-white/50 max-w-[560px] leading-[1.8]">
              For most rare disease patients, clinical trials are the only hope
              for treatment. But the systems designed to find those trials were
              built for hospitals, not families. CliniBridge changes that.
            </p>
          </div>

          {/* ── Stats ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-24 animate-[slideUpFade_0.8s_ease-out_forwards_0.3s] opacity-0">
            {[
              { value: "95%", label: "of rare diseases have no approved treatment" },
              { value: "80%", label: "of trials fail to recruit enough patients" },
              { value: "4–6", label: "doctors seen before a diagnosis" },
            ].map((s) => (
              <div
                key={s.value}
                className="group relative p-6 rounded-xl border border-white/[0.04] bg-white/[0.015] hover:bg-white/[0.025] transition-all duration-500"
              >
                {/* Subtle top accent line */}
                <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
                <div
                  style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                  className="text-3xl font-semibold text-white/80 mb-2 tracking-tight"
                >
                  {s.value}
                </div>
                <div className="text-[13px] text-white/25 leading-relaxed">
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* ── The Gap ── */}
          <Section label="The Gap" title="Every matching tool requires hospital data. Nothing exists for patients directly." delay="0.4s">
            <p className="text-white/45 text-[15px] leading-[1.85] max-w-[640px]">
              AI-powered trial matching already exists — tools like Deep 6 AI
              and Tempus do it for hospitals by reading electronic health
              records. But patients and caregivers have no equivalent. The only
              free option is ClinicalTrials.gov, which is written in medical
              jargon and offers search, not matching.
            </p>
            <div className="mt-8 relative pl-6 border-l border-emerald-500/15">
              <p className="text-white/40 text-[15px] leading-[1.85]">
                A worried parent searching for trials for their child shouldn't
                need a medical degree to understand eligibility criteria.{" "}
                <span className="text-white/80">
                  They need someone to read it for them and say: "Your child
                  might qualify for this, and here's why."
                </span>
              </p>
            </div>
          </Section>

          <Divider />

          {/* ── The Solution ── */}
          <Section label="The Solution" title="Describe the condition. Get matched trials. In plain English." delay="0.45s">
            <p className="text-white/45 text-[15px] leading-[1.85] max-w-[640px] mb-10">
              CliniBridge turns a conversation into a shortlist. You don't need
              a formal diagnosis. You don't need to understand medical
              terminology. You describe what's happening, and the AI does the
              rest.
            </p>

            {/* Steps — timeline style */}
            <div className="relative pl-8">
              {/* Vertical connector line */}
              <div className="absolute left-[11px] top-3 bottom-3 w-[1px] bg-gradient-to-b from-emerald-500/20 via-emerald-500/10 to-transparent" />

              <div className="flex flex-col gap-8">
                {[
                  {
                    num: "1",
                    title: "You describe the condition",
                    desc: "In your own words — symptoms, diagnosis if you have one, medications, age, location. The AI asks follow-ups if it needs more.",
                  },
                  {
                    num: "2",
                    title: "We search thousands of recruiting trials",
                    desc: "CliniBridge queries ClinicalTrials.gov in real time, expanding your words into medical terms to find trials you'd never discover on your own.",
                  },
                  {
                    num: "3",
                    title: "AI reads the eligibility criteria",
                    desc: "Each trial's inclusion and exclusion criteria are checked against your profile — age range, condition, medications, prior treatments.",
                  },
                  {
                    num: "4",
                    title: "You get a scored shortlist",
                    desc: "Strong match, possible match, or unlikely — with a plain-English explanation of why. No jargon. No guesswork.",
                  },
                ].map((step) => (
                  <div key={step.num} className="relative flex gap-5 group">
                    {/* Dot on the timeline */}
                    <div className="absolute -left-8 top-1 w-[23px] h-[23px] rounded-full border border-emerald-500/20 bg-neutral-950 flex items-center justify-center z-10 group-hover:border-emerald-500/40 transition-colors duration-500">
                      <div className="w-[7px] h-[7px] rounded-full bg-emerald-500/40 group-hover:bg-emerald-400/60 transition-colors duration-500" />
                    </div>
                    <div>
                      <div
                        style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                        className="font-medium text-[15px] text-white/80 mb-1.5 group-hover:text-white transition-colors duration-300"
                      >
                        {step.title}
                      </div>
                      <div className="text-[13px] text-white/25 leading-[1.75] max-w-[520px]">
                        {step.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          <Divider />

          {/* ── Under the Hood ── */}
          <Section label="Under the Hood" title="AI that reads eligibility criteria so you don't have to." delay="0.5s">
            <p className="text-white/45 text-[15px] leading-[1.85] max-w-[640px]">
              This isn't a search engine with a chatbot on top. The AI does four
              distinct jobs: it understands casual language, expands your words
              into medical terminology, scores each trial against your specific
              profile, and rewrites everything in language a non-medical person
              can actually understand.
            </p>
            <p className="text-white/45 text-[15px] leading-[1.85] max-w-[640px] mt-5">
              The matching that takes a research coordinator an hour per patient
              happens in under a minute.
            </p>
          </Section>

          <Divider />

          {/* ── What's Next — Roadmap ── */}
          <Section label="What's Next" title="Where CliniBridge goes from here." delay="0.55s">
            <p className="text-white/45 text-[15px] leading-[1.85] max-w-[640px] mb-10">
              This is a working prototype — built to prove the concept. Here's
              what a full version would look like.
            </p>

            {/* Roadmap — timeline with phase tags */}
            <div className="relative pl-8">
              {/* Vertical connector */}
              <div className="absolute left-[11px] top-3 bottom-3 w-[1px] bg-gradient-to-b from-emerald-500/15 via-white/[0.04] to-transparent" />

              <div className="flex flex-col gap-7">
                {[
                  {
                    tag: "Now",
                    dotColor: "bg-emerald-400/50",
                    borderColor: "border-emerald-500/25",
                    tagColor: "text-emerald-400/70",
                    title: "Smarter matching with medical records",
                    desc: "Let patients upload a doctor's letter or test results. The AI reads the document and builds a richer profile — catching details a patient might forget to mention.",
                  },
                  {
                    tag: "Soon",
                    dotColor: "bg-amber-400/40",
                    borderColor: "border-amber-400/20",
                    tagColor: "text-amber-400/60",
                    title: "Trial alerts",
                    desc: "New trials open every week. Patients save their profile and get notified when a new trial matches — no more repeated searching.",
                  },
                  {
                    tag: "Soon",
                    dotColor: "bg-amber-400/40",
                    borderColor: "border-amber-400/20",
                    tagColor: "text-amber-400/60",
                    title: "Multi-language support",
                    desc: "Rare diseases don't stop at borders. Supporting Arabic, Spanish, French, and other languages opens this up to families worldwide.",
                  },
                  {
                    tag: "Later",
                    dotColor: "bg-white/15",
                    borderColor: "border-white/10",
                    tagColor: "text-white/25",
                    title: "Share with your doctor",
                    desc: "Generate a one-page summary of matched trials that a patient can print or email to their doctor — making that conversation easier.",
                  },
                  {
                    tag: "Later",
                    dotColor: "bg-white/15",
                    borderColor: "border-white/10",
                    tagColor: "text-white/25",
                    title: "Connect with advocacy groups",
                    desc: "Partner with rare disease organisations so patients who get zero results aren't left with nothing — they're pointed to communities and support.",
                  },
                  {
                    tag: "Later",
                    dotColor: "bg-white/15",
                    borderColor: "border-white/10",
                    tagColor: "text-white/25",
                    title: "Hospital partnerships",
                    desc: "Work with trial sites to let patients express interest directly through CliniBridge — closing the gap between finding a trial and actually enrolling.",
                  },
                ].map((item) => (
                  <div key={item.title} className="relative flex gap-5 group">
                    {/* Dot */}
                    <div className={`absolute -left-8 top-1 w-[23px] h-[23px] rounded-full border ${item.borderColor} bg-neutral-950 flex items-center justify-center z-10 transition-colors duration-500`}>
                      <div className={`w-[7px] h-[7px] rounded-full ${item.dotColor} transition-colors duration-500`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1.5">
                        <div
                          style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                          className="font-medium text-[15px] text-white/70 group-hover:text-white/90 transition-colors duration-300"
                        >
                          {item.title}
                        </div>
                        <span className={`text-[9px] font-medium tracking-[0.15em] uppercase ${item.tagColor}`}>
                          {item.tag}
                        </span>
                      </div>
                      <div className="text-[13px] text-white/25 leading-[1.75] max-w-[520px]">
                        {item.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          <Divider />

          {/* ── CTA ── */}
          <div className="text-center py-16 px-8 rounded-2xl border border-white/[0.04] bg-white/[0.015] relative overflow-hidden animate-[slideUpFade_0.8s_ease-out_forwards_0.65s] opacity-0">
            {/* Subtle top glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[1px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
            <h2
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
              className="text-2xl md:text-[1.7rem] font-semibold mb-3 tracking-tight"
            >
              Find trials that might be right for you.
            </h2>
            <p className="text-white/30 text-[14px] max-w-[380px] mx-auto mb-10 leading-relaxed">
              No account needed. No data stored. Just answers.
            </p>
            <Link
              to="/chat"
              className="group inline-flex items-center gap-2 px-8 py-3 bg-white text-black rounded-full font-medium hover:bg-neutral-200 transition-colors"
            >
              Start Matching
              <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer — always at bottom */}
      <div className="relative z-10 mt-auto">
        <Footer />
      </div>
    </div>
  );
}

/* ── Section ──────────────────────────────────────────────────── */

function Section({
  label,
  title,
  delay = "0.5s",
  children,
}: {
  label: string;
  title: string;
  delay?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="mb-20 opacity-0"
      style={{ animation: `slideUpFade 0.8s ease-out forwards ${delay}` }}
    >
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/50">
          {label}
        </span>
      </div>
      <h2
        style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
        className="text-[1.65rem] md:text-[1.85rem] font-semibold leading-snug tracking-tight mb-6 text-white/80"
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

/* ── Divider ──────────────────────────────────────────────────── */

function Divider() {
  return (
    <div className="relative mb-20">
      <div className="h-[1px] bg-white/[0.04]" />
      {/* Subtle center accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-[1px] bg-emerald-500/10" />
    </div>
  );
}
