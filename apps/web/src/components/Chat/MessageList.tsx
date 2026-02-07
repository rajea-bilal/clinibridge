import type { UIMessage } from "ai";
import type { TrialSummary } from "@/lib/types";
import { TrialCardsFromChat } from "./TrialCardsFromChat";
import {
  Message,
  MessageAvatar,
  MessageContent,
} from "@/components/prompt-kit/message";
import { Loader } from "@/components/prompt-kit/loader";
import { PromptSuggestion } from "@/components/prompt-kit/prompt-suggestion";
import { Bot } from "lucide-react";

interface MessageListProps {
  messages: UIMessage[];
  status: string;
  onSuggestionClick: (suggestion: string) => void;
}

export function MessageList({
  messages,
  status,
  onSuggestionClick,
}: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center">
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
            <PromptSuggestion
              key={suggestion}
              onClick={() => onSuggestionClick(suggestion)}
            >
              {suggestion}
            </PromptSuggestion>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}

      {/* Loader: show while waiting for AI response after submit */}
      {status === "submitted" && (
        <Message>
          <MessageAvatar fallback="CB" className="bg-muted/30 text-xs" />
          <div className="flex items-center gap-2 rounded-lg bg-muted/20 px-3 py-2">
            <Loader variant="typing" size="sm" />
            <span className="text-xs text-muted-foreground">Thinking...</span>
          </div>
        </Message>
      )}
    </div>
  );
}

function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <Message className="justify-end">
        <div className="max-w-[85%]">
          {message.parts.map((part, i) => {
            const key = `${message.id}-${i}`;
            if (part.type === "text") {
              return (
                <MessageContent
                  key={key}
                  className="ml-auto bg-primary text-primary-foreground"
                >
                  <p className="whitespace-pre-wrap text-sm">{part.text}</p>
                </MessageContent>
              );
            }
            return null;
          })}
        </div>
        <MessageAvatar
          fallback="U"
          className="bg-primary/20 text-xs text-primary"
        />
      </Message>
    );
  }

  // Assistant message
  return (
    <Message>
      <MessageAvatar
        fallback="CB"
        className="bg-muted/30 text-xs"
      />
      <div className="max-w-[85%] space-y-2">
        {message.parts.map((part, i) => {
          const key = `${message.id}-${i}`;

          switch (part.type) {
            case "text":
              return (
                <MessageContent
                  key={key}
                  markdown
                  id={`${message.id}-${i}`}
                  className="bg-muted/40 text-sm"
                >
                  {part.text}
                </MessageContent>
              );

            case "tool-searchTrials":
              if (part.state === "output-available") {
                return (
                  <TrialCardsFromChat
                    key={key}
                    data={
                      part.output as {
                        trials: TrialSummary[];
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
    </Message>
  );
}
