import type { UIMessage } from "ai";
import { TrialCardsFromChat } from "./TrialCardsFromChat";
import { Bot, User } from "lucide-react";

interface MessageListProps {
  messages: UIMessage[];
}

export function MessageList({ messages }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-full border border-border/60 bg-muted/30">
          <Bot className="size-6 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium text-foreground text-sm">
            Welcome to CliniBridge
          </p>
          <p className="mx-auto mt-1 max-w-xs text-muted-foreground text-xs">
            Tell me about a medical condition, and I'll help you find
            recruiting clinical trials.
          </p>
        </div>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {[
            "Find lung cancer trials near Boston",
            "Type 2 diabetes trials for a 55 year old",
            "Alzheimer's trials in California",
          ].map((suggestion) => (
            <span
              key={suggestion}
              className="cursor-default rounded-md border border-border/40 bg-muted/20 px-3 py-1.5 text-muted-foreground text-xs"
            >
              {suggestion}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </div>
  );
}

function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border/60 bg-muted/30">
          <Bot className="size-4 text-muted-foreground" />
        </div>
      )}

      <div
        className={`max-w-[85%] space-y-2 ${
          isUser ? "text-right" : "text-left"
        }`}
      >
        {message.parts.map((part, i) => {
          const key = `${message.id}-${i}`;

          switch (part.type) {
            case "text":
              return (
                <div
                  key={key}
                  className={`inline-block rounded-lg px-3 py-2 text-sm ${
                    isUser
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/40 text-foreground"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{part.text}</p>
                </div>
              );

            case "tool-searchTrials":
              if (part.state === "output-available") {
                return (
                  <TrialCardsFromChat
                    key={key}
                    data={
                      part.output as {
                        trials: Array<{
                          nctId: string;
                          title: string;
                          summary: string;
                          status: string;
                          phase: string;
                          conditions: string[];
                          eligibility: string;
                          eligibilityFull?: string;
                          ageRange: string;
                          locations: string[];
                          interventions: string[];
                          sponsor: string;
                          matchScore: number;
                          matchLabel?: string;
                          matchReason?: string;
                          url: string;
                        }>;
                        error?: string;
                        count?: number;
                      }
                    }
                  />
                );
              }

              if (part.state === "output-error") {
                return (
                  <div
                    key={key}
                    className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive"
                  >
                    Search failed. Please try again.
                  </div>
                );
              }

              // input-streaming or input-available (loading)
              return (
                <div
                  key={key}
                  className="flex items-center gap-2 rounded-lg bg-muted/20 px-3 py-2 text-xs text-muted-foreground"
                >
                  <span className="inline-block size-2 animate-pulse rounded-full bg-emerald-400" />
                  Searching ClinicalTrials.gov...
                </div>
              );

            default:
              return null;
          }
        })}
      </div>

      {isUser && (
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border/60 bg-primary/20">
          <User className="size-4 text-primary" />
        </div>
      )}
    </div>
  );
}
