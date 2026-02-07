"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type PromptSuggestionProps = {
  children: React.ReactNode
  className?: string
} & React.ButtonHTMLAttributes<HTMLButtonElement>

function PromptSuggestion({
  children,
  className,
  ...props
}: PromptSuggestionProps) {
  return (
    <Button
      variant="outline"
      size="lg"
      className={cn(
        "h-auto cursor-pointer rounded-full border-border/40 bg-muted/20 px-4 py-2 text-xs font-normal text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  )
}

export { PromptSuggestion }
