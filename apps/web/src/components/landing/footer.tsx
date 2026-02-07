import { config } from "@root/config";

export function Footer() {
  return (
    <footer className="bg-black py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="font-bold font-mono text-2xl text-white">
            {config.metadata.siteNameWithSubtitle.includes(" ") ? (
              <>
                {config.metadata.siteNameWithSubtitle.split(" ")[0]}{" "}
                <span className="text-white/60">
                  {config.metadata.siteNameWithSubtitle
                    .split(" ")
                    .slice(1)
                    .join(" ")}
                </span>
              </>
            ) : (
              config.metadata.siteNameWithSubtitle
            )}
          </div>
          <div className="h-px w-32 bg-white/20" />
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              className="font-mono text-sm text-white no-underline transition-all duration-300 hover:text-white/80"
              href="https://yugen.userjot.com/"
              rel="noopener noreferrer"
              target="_blank"
            >
              Share Feedback
            </a>
            <a
              className="font-mono text-sm text-white no-underline transition-all duration-300 hover:text-white/80"
              href="https://yugen.userjot.com/roadmap"
              rel="noopener noreferrer"
              target="_blank"
            >
              View Roadmap
            </a>
          </div>
          <p className="text-center font-mono text-sm text-white/50">
            © {new Date().getFullYear()}{" "}
            {config.metadata.siteNameWithSubtitle || config.metadata.siteName},
            All rights reserved
          </p>
          <p className="text-center font-mono text-sm text-white/50">
            Built with heavy doses of Creatine by{" "}
            <a
              className="relative inline-block border-white/30 border-b font-semibold text-white no-underline transition-all duration-300 hover:scale-105 hover:border-white/60 hover:text-white hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]"
              href="https://x.com/_7obaid_"
              rel="noopener noreferrer"
              target="_blank"
            >
              Obaid
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
