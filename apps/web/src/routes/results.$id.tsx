import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@yugen/backend/convex/_generated/api";
import { TrialResultsList } from "@/components/Trials/TrialResultsList";
import { ArrowLeft, FileText } from "lucide-react";

// @ts-expect-error — route path not in generated tree until `bun run dev` regenerates it
export const Route = createFileRoute("/results/$id")({
  component: ResultsPage,
});

function ResultsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { id } = (Route as any).useParams();

  // Convex api types won't include searchTrials until `bunx convex dev` regenerates codegen
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const searchTrialsApi = (api as any).searchTrialsQueries;
  const search = useQuery(
    searchTrialsApi?.getSearch ?? null,
    id ? { id } : "skip"
  );

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/40 px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <a
            href="/"
            className="flex items-center gap-1 text-muted-foreground text-xs hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Back
          </a>
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-muted-foreground" />
            <h1 className="font-medium text-sm">Saved Search Results</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        {search === undefined ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="h-48 animate-pulse rounded-xl border border-border/40 bg-muted/30"
              />
            ))}
          </div>
        ) : search === null ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-muted-foreground text-sm">Search not found.</p>
            <a
              href="/"
              className="text-primary text-sm underline underline-offset-4"
            >
              Go home
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h2 className="font-semibold text-lg">
                Results for "{search.condition}"
              </h2>
              <p className="text-muted-foreground text-xs">
                Age: {search.age} | Location: {search.location || "Any"} |
                Mode: {search.mode}
              </p>
            </div>
            <TrialResultsList trials={search.results} />
          </div>
        )}
      </main>
    </div>
  );
}
