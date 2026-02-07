"use client"

import { cn } from "@/lib/utils"

export interface LoaderProps {
  variant?:
    | "circular"
    | "classic"
    | "pulse"
    | "pulse-dot"
    | "dots"
    | "typing"
    | "wave"
    | "bars"
    | "terminal"
    | "text-blink"
    | "text-shimmer"
    | "loading-dots"
  size?: "sm" | "md" | "lg"
  text?: string
  className?: string
}

function TypingLoader({
  className,
  size = "md",
}: {
  className?: string
  size?: "sm" | "md" | "lg"
}) {
  const dotSizes = {
    sm: "h-1 w-1",
    md: "h-1.5 w-1.5",
    lg: "h-2 w-2",
  }

  const containerSizes = {
    sm: "h-4",
    md: "h-5",
    lg: "h-6",
  }

  return (
    <span
      className={cn(
        "flex items-center gap-1",
        containerSizes[size],
        className
      )}
      role="status"
    >
      {[...Array(3)].map((_, i) => (
        <span
          key={i}
          className={cn(
            "animate-bounce rounded-full bg-current opacity-60",
            dotSizes[size]
          )}
          style={{
            animationDelay: `${i * 0.15}s`,
            animationDuration: "0.6s",
          }}
        />
      ))}
      <span className="sr-only">Loading</span>
    </span>
  )
}

function DotsLoader({
  className,
  size = "md",
}: {
  className?: string
  size?: "sm" | "md" | "lg"
}) {
  const dotSizes = {
    sm: "h-1.5 w-1.5",
    md: "h-2 w-2",
    lg: "h-2.5 w-2.5",
  }

  const containerSizes = {
    sm: "h-4",
    md: "h-5",
    lg: "h-6",
  }

  return (
    <span
      className={cn(
        "flex items-center gap-1",
        containerSizes[size],
        className
      )}
      role="status"
    >
      {[...Array(3)].map((_, i) => (
        <span
          key={i}
          className={cn(
            "animate-pulse rounded-full bg-current",
            dotSizes[size]
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
      <span className="sr-only">Loading</span>
    </span>
  )
}

function TextShimmerLoader({
  text = "Thinking",
  className,
  size = "md",
}: {
  text?: string
  className?: string
  size?: "sm" | "md" | "lg"
}) {
  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }

  return (
    <span
      className={cn(
        "animate-pulse text-muted-foreground",
        textSizes[size],
        className
      )}
      role="status"
    >
      {text}
    </span>
  )
}

function TextDotsLoader({
  className,
  text = "Thinking",
  size = "md",
}: {
  className?: string
  text?: string
  size?: "sm" | "md" | "lg"
}) {
  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }

  return (
    <span
      className={cn(
        "inline-flex items-baseline text-muted-foreground",
        textSizes[size],
        className
      )}
      role="status"
    >
      <span>{text}</span>
      <span className="inline-flex w-6">
        <span className="animate-bounce" style={{ animationDelay: "0s" }}>
          .
        </span>
        <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>
          .
        </span>
        <span className="animate-bounce" style={{ animationDelay: "0.4s" }}>
          .
        </span>
      </span>
    </span>
  )
}

function Loader({
  variant = "typing",
  size = "md",
  text,
  className,
}: LoaderProps) {
  switch (variant) {
    case "dots":
      return <DotsLoader className={className} size={size} />
    case "typing":
      return <TypingLoader className={className} size={size} />
    case "text-shimmer":
      return (
        <TextShimmerLoader text={text} className={className} size={size} />
      )
    case "loading-dots":
      return <TextDotsLoader text={text} className={className} size={size} />
    default:
      return <TypingLoader className={className} size={size} />
  }
}

export { Loader }
