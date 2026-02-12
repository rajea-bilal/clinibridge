import { config } from "@root/config";

export function Footer() {
  return (
    <footer className="text-white bg-neutral-950 z-10 border-white/[0.06] border-t pt-16 px-6 pb-16 relative">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 animate-on-scroll">
        {/* Brand */}
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <img
              src={config.metadata.logo}
              alt="CliniBridge"
              className="w-10 h-10 shrink-0 object-contain"
            />
            <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-2xl font-semibold uppercase">
              CliniBridge
            </h2>
          </div>
          <p className="text-white/50 max-w-xs mb-8">
            Navigating clinical trials shouldn't feel overwhelming. We use AI to
            match you with hope.
          </p>
        </div>

        {/* Platform */}
        <div className="flex flex-col gap-4">
          <h4 className="font-medium text-lg mb-2">Platform</h4>
          <a
            href="/chat"
            className="text-white/60 hover:text-white transition-colors"
          >
            Search Trials
          </a>
          <a
            href="/#trials"
            className="text-white/60 hover:text-white transition-colors"
          >
            Recruiting Now
          </a>
        </div>

        {/* Company */}
        <div className="flex flex-col gap-4">
          <h4 className="font-medium text-lg mb-2">Company</h4>
          <a
            href="/about"
            className="text-white/60 hover:text-white transition-colors"
          >
            About
          </a>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/10 flex flex-col items-center text-center gap-5 text-sm animate-on-scroll anim-delay-100">
        <p className="text-white/20 text-[13px] max-w-md leading-relaxed">
          Built by{" "}
          <a
            href="https://www.linkedin.com/in/rajea-bilal/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400/50 hover:text-emerald-400/70 transition-colors"
          >
            Rajea Bilal
          </a>{" "}
          — exploring how AI and thoughtful design can make clinical research
          accessible to the people who need it most.
        </p>
        <p className="text-white/20 text-[12px]">&copy; {new Date().getFullYear()} CliniBridge</p>
      </div>
    </footer>
  );
}
