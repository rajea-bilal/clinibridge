"use client";

import { config } from "@root/config";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    setIsLoading(true);
    router.push("/docs/setup/1-ramp-up");
  };

  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center bg-black px-4 text-center text-white">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="mb-4 inline-block rounded-full border border-neutral-700 bg-neutral-900/50 px-4 py-1.5 text-neutral-300 text-sm">
          Documentation Hub
        </div>

        <h1 className="mb-6 font-bold text-5xl md:text-6xl lg:text-7xl">
          {config.metadata.siteName}
        </h1>

        <p className="mx-auto mb-8 max-w-xl text-lg text-neutral-400 md:text-xl">
          {config.metadata.siteDescription}
        </p>

        <button
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 font-medium text-black transition-colors hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
          disabled={isLoading}
          onClick={handleClick}
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          Open documentation
        </button>
      </div>
    </div>
  );
}
