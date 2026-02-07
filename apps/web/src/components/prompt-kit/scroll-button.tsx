"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"
import { useStickToBottomContext } from "use-stick-to-bottom"

export type ScrollButtonProps = {
  className?: string
} & React.ButtonHTMLAttributes<HTMLButtonElement>

function ScrollButton({ className, ...props }: ScrollButtonProps) {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext()

  return (
    <Button
      variant="outline"
      size="sm"
      className={cn(
        "size-8 rounded-full p-0 shadow-sm transition-opacity",
        isAtBottom ? "pointer-events-none opacity-0" : "opacity-100",
        className
      )}
      onClick={() => scrollToBottom()}
      {...props}
    >
      <ChevronDown className="size-4" />
    </Button>
  )
}

export { ScrollButton }
