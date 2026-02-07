import type { TrialSummary } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Users,
  ExternalLink,
  FlaskConical,
  Building2,
} from "lucide-react";

interface TrialCardProps {
  trial: TrialSummary;
}

export function TrialCard({ trial }: TrialCardProps) {
  return (
    <Card className="border-border/60 hover:border-border transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base leading-snug">
              {trial.title}
            </CardTitle>
            <CardDescription className="mt-1 font-mono text-xs">
              {trial.nctId}
            </CardDescription>
          </div>
          <StatusBadge status={trial.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {trial.matchLabel && (
          <div className="flex items-start gap-2">
            <MatchBadge label={trial.matchLabel} />
            {trial.matchReason && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {trial.matchReason}
              </p>
            )}
          </div>
        )}

        <p className="line-clamp-3 text-muted-foreground text-sm">
          {trial.summary}
        </p>

        <div className="grid grid-cols-1 gap-2 text-muted-foreground text-xs sm:grid-cols-2">
          {trial.phase !== "Not specified" && (
            <div className="flex items-center gap-1.5">
              <FlaskConical className="size-3.5 shrink-0" />
              <span>{trial.phase}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Users className="size-3.5 shrink-0" />
            <span>{trial.ageRange}</span>
          </div>
          {trial.locations.length > 0 && (
            <div className="flex items-center gap-1.5">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">{trial.locations[0]}</span>
              {trial.locations.length > 1 && (
                <span className="text-muted-foreground/60">
                  +{trial.locations.length - 1}
                </span>
              )}
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Building2 className="size-3.5 shrink-0" />
            <span className="truncate">{trial.sponsor}</span>
          </div>
        </div>

        {trial.interventions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {trial.interventions.slice(0, 3).map((intervention) => (
              <span
                key={intervention}
                className="rounded-sm border border-border/60 bg-muted px-1.5 py-0.5 text-muted-foreground text-xs"
              >
                {intervention}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-end pt-1">
          <Button variant="outline" size="sm" asChild>
            <a
              href={trial.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on ClinicalTrials.gov
              <ExternalLink className="ml-1 size-3" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isRecruiting = status.toUpperCase() === "RECRUITING";
  return (
    <span
      className={`shrink-0 rounded-sm px-2 py-0.5 text-xs font-medium ${
        isRecruiting
          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
          : "bg-muted text-muted-foreground border border-border/60"
      }`}
    >
      {status}
    </span>
  );
}

const matchBadgeStyles: Record<string, string> = {
  "Strong Match": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "Possible Match": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Worth Exploring": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Unlikely: "bg-red-500/10 text-red-400 border-red-500/20",
};

function MatchBadge({ label }: { label: string }) {
  const style =
    matchBadgeStyles[label] ?? matchBadgeStyles["Worth Exploring"];
  return (
    <span
      className={`shrink-0 whitespace-nowrap rounded-sm border px-2 py-0.5 text-xs font-medium ${style}`}
    >
      {label}
    </span>
  );
}
