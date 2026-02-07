import { HeartPulse, Search, Menu } from "lucide-react";

export function Navbar() {
  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 md:px-6 animate-[slideUpFade_1s_ease-out_forwards] [animation-delay:0.2s] opacity-0">
      <nav className="flex w-full max-w-4xl items-center justify-between transition-all duration-300 bg-neutral-900/60 border border-white/10 rounded-full p-2 pl-4 md:pr-6 md:pl-6 shadow-2xl backdrop-blur-xl">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black shrink-0">
            <HeartPulse className="size-[18px]" />
          </div>
          <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-lg tracking-tight font-medium uppercase hidden sm:block">
            CliniBridge
          </span>
          <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-lg tracking-tight font-medium uppercase sm:hidden block">
            CB
          </span>
        </div>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
          <a href="#" className="text-white hover:text-white transition-colors">
            Search
          </a>
          <a
            href="#projects"
            className="hover:text-white transition-colors"
          >
            Trials
          </a>
          <a
            href="#process"
            className="hover:text-white transition-colors"
          >
            AI
          </a>
          <a
            href="#careers"
            className="hover:text-white transition-colors"
          >
            Stories
          </a>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="w-10 h-10 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Search className="size-5" />
          </button>
          <button
            type="button"
            className="relative w-10 h-10 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors group"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </nav>
    </div>
  );
}
