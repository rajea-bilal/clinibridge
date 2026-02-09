import type { UIMessage } from "ai";
import type { TrialSummary } from "@/lib/types";
import { TrialCardsFromChat } from "./TrialCardsFromChat";
import { MessageContent } from "@/components/prompt-kit/message";
import { Loader } from "@/components/prompt-kit/loader";
import { Icon } from "@iconify/react";

interface MessageListProps {
  messages: UIMessage[];
  status: string;
  onSuggestionClick: (suggestion: string) => void;
}

const SUGGESTIONS = [
  "Find lung cancer trials near Boston",
  "Type 2 diabetes trials for a 55 year old",
  "Alzheimer's trials in California",
];

export function MessageList({
  messages,
  status,
  onSuggestionClick,
}: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 min-h-[50vh] text-center space-y-6 animate-fade-in opacity-0">
        {/* Thin vertical emerald accent line */}
        <div className="w-[1px] h-16 bg-gradient-to-b from-transparent via-emerald-500/40 to-transparent" />

        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center relative">
          <div className="absolute inset-0 bg-emerald-500/[0.04] rounded-2xl blur-xl" />
          <Icon
            icon="solar:health-bold-duotone"
            width={28}
            className="relative z-10 text-emerald-400/80"
          />
        </div>

        {/* Mono label — matching landing page pattern */}
        <div className="flex items-center gap-3">
          <span className="h-[1px] w-6 bg-emerald-500/40" />
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-400/60">
            AI-Powered Search
          </span>
          <span className="h-[1px] w-6 bg-emerald-500/40" />
        </div>

        {/* Greeting */}
        <div className="max-w-lg space-y-3">
          <h1 className="font-bricolage text-3xl md:text-4xl font-medium tracking-tighter text-white">
            Welcome to CliniBridge
          </h1>
          <p className="text-white/40 font-light text-base leading-relaxed max-w-sm mx-auto">
            Tell me about a medical condition, and I&apos;ll help you find
            recruiting clinical trials.
          </p>
        </div>

        {/* Horizontal divider with centered dot */}
        <div className="flex items-center w-full max-w-xs">
          <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-emerald-500/20" />
          <div className="w-2 h-2 rounded-full bg-emerald-500/30 ring-1 ring-emerald-500/10 mx-3" />
          <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent to-emerald-500/20" />
        </div>

        {/* Suggestion cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 w-full max-w-md pt-2">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => onSuggestionClick(suggestion)}
              className="text-left px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] hover:border-white/[0.08] transition-all duration-300 group cursor-pointer"
            >
              <span className="block text-[13px] font-light text-white/60 group-hover:text-white/80 transition-colors">
                {suggestion}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}

      {/* Loader: show while waiting for AI response after submit */}
      {status === "submitted" && (
        <div className="message-enter flex items-start gap-3 py-1">
          <div className="size-8 shrink-0 rounded-full bg-white/[0.05] border border-white/[0.05] flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.06)]">
            <Icon icon="solar:health-bold-duotone" width={16} className="text-emerald-400/60" />
          </div>
          <div className="flex items-center gap-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.04] px-4 py-2.5">
            <Loader variant="typing" size="sm" />
            <span className="text-xs text-white/30 font-light tracking-wide">Thinking...</span>
          </div>
        </div>
      )}
    </div>
  );
}

function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="message-enter flex items-end gap-3 justify-end py-0.5">
        <div className="max-w-[75%]">
          {message.parts.map((part, i) => {
            const key = `${message.id}-${i}`;
            if (part.type === "text") {
              return (
                <div
                  key={key}
                  className="chat-bubble-user bg-white/[0.07] border border-white/[0.05] text-white/95 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:bg-white/[0.09] transition-colors duration-300"
                >
                  <p className="whitespace-pre-wrap text-[15px] font-light leading-relaxed">{part.text}</p>
                </div>
              );
            }
            return null;
          })}
        </div>
        <div className="size-8 shrink-0 rounded-full bg-white/[0.06] border border-white/[0.05] flex items-center justify-center text-[11px] font-medium text-white/50 mb-0.5">
          U
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="message-enter flex items-start gap-3 py-0.5">
      <div className="size-8 shrink-0 rounded-full bg-white/[0.05] border border-white/[0.05] flex items-center justify-center mt-0.5 shadow-[0_0_12px_rgba(16,185,129,0.06)]">
        <Icon icon="solar:health-bold-duotone" width={16} className="text-emerald-400/60" />
      </div>
      <div className="max-w-[80%] space-y-2.5">
        {message.parts.map((part, i) => {
          const key = `${message.id}-${i}`;

          switch (part.type) {
            case "text":
              return (
                <MessageContent
                  key={key}
                  markdown
                  id={`${message.id}-${i}`}
                  className="chat-bubble-assistant bg-white/[0.025] border border-white/[0.04] text-[15px] text-white/85 leading-relaxed font-light shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur-sm prose-p:leading-[1.75] prose-p:text-white/85 prose-strong:text-white/95 prose-strong:font-medium prose-headings:text-white/90 prose-headings:font-medium prose-li:text-white/80 prose-code:text-emerald-300/80 prose-code:bg-white/[0.05] prose-code:rounded-md prose-code:px-1.5 prose-code:py-0.5 prose-a:text-emerald-400/80 prose-a:underline-offset-2 prose-a:decoration-emerald-500/30 hover:prose-a:text-emerald-300"
                >
                  {part.text}
                </MessageContent>
              );

            case "tool-searchTrials":
              if (part.state === "output-available") {
                const toolOutput = part.output as {
                  trials: TrialSummary[];
                  error?: string;
                  count?: number;
                  patientProfile?: {
                    age: number;
                    condition: string;
                    location: string;
                    medications?: string[];
                    additionalInfo?: string;
                  };
                };
                return (
                  <TrialCardsFromChat
                    key={key}
                    data={toolOutput}
                  />
                );
              }

              if (part.state === "output-error") {
                return (
                  <div
                    key={key}
                    className="rounded-2xl border border-red-500/15 bg-red-500/[0.04] px-4 py-2.5 text-xs text-red-400/80 font-light"
                  >
                    Search failed. Please try again.
                  </div>
                );
              }

              return (
                <div
                  key={key}
                  className="flex items-center gap-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.04] px-4 py-2.5 text-xs text-white/35 font-light tracking-wide"
                >
                  <span className="inline-block size-1.5 animate-pulse rounded-full bg-emerald-400/50" />
                  Searching ClinicalTrials.gov...
                </div>
              );

            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}
