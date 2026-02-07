import { HeartPulse } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function Navbar() {
  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 md:px-6 animate-[slideUpFade_1s_ease-out_forwards] [animation-delay:0.2s] opacity-0">
      <nav className="flex w-full max-w-4xl items-center justify-between transition-all duration-300 bg-neutral-900/60 border border-white/10 rounded-full p-2 pl-4 md:pr-6 md:pl-6 shadow-2xl backdrop-blur-xl">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black shrink-0">
            <HeartPulse className="size-[18px]" />
          </div>
          <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-lg tracking-tight font-medium uppercase hidden sm:block">
            CliniBridge
          </span>
          <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-lg tracking-tight font-medium uppercase sm:hidden block">
            CB
          </span>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-8 text-sm font-medium text-white/60">
          <Link
            to="/chat"
            className="hover:text-white transition-colors"
          >
            Search
          </Link>
          <a
            href="/#trials"
            className="hover:text-white transition-colors"
          >
            Trials
          </a>
          <Link
            to="/about"
            className="hover:text-white transition-colors"
          >
            About
          </Link>
        </div>
      </nav>
    </div>
  );
}
