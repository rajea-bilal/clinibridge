import { SearchX } from "lucide-react";

export function NoResults() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-border/40 bg-muted/10 py-12 text-center">
      <SearchX className="size-10 text-muted-foreground/50" />
      <div>
        <p className="font-medium text-foreground text-sm">
          No matching trials found
        </p>
        <p className="mx-auto mt-1 max-w-sm text-muted-foreground text-xs">
          Try broadening your search criteria, using different terms, or
          checking back later as new trials are posted regularly.
        </p>
      </div>
    </div>
  );
}
