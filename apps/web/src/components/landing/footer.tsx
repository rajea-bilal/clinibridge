import { HeartPulse } from "lucide-react";

export function Footer() {
  return (
    <footer className="text-white bg-black z-10 border-white/10 border-t pt-16 px-6 pb-16 relative">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 animate-on-scroll">
        {/* Brand */}
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black">
              <HeartPulse className="size-[18px]" />
            </div>
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
            href="/find"
            className="text-white/60 hover:text-white transition-colors"
          >
            For Patients
          </a>
        </div>

        {/* Company */}
        <div className="flex flex-col gap-4">
          <h4 className="font-medium text-lg mb-2">Company</h4>
          <a
            href="#"
            className="text-white/60 hover:text-white transition-colors"
          >
            About Us
          </a>
          <a
            href="#"
            className="text-white/60 hover:text-white transition-colors"
          >
            Careers
          </a>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/10 flex flex-col items-center text-center gap-4 text-sm text-white/40 animate-on-scroll anim-delay-100">
        <p>&copy; {new Date().getFullYear()} CliniBridge. All rights reserved.</p>
      </div>
    </footer>
  );
}
