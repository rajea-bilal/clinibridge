import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { Markdown } from "./markdown"

export type MessageProps = {
  children: React.ReactNode
  className?: string
} & React.HTMLProps<HTMLDivElement>

const Message = ({ children, className, ...props }: MessageProps) => (
  <div className={cn("flex gap-3 py-2", className)} {...props}>
    {children}
  </div>
)

export type MessageAvatarProps = {
  src?: string
  alt?: string
  fallback?: string
  delayMs?: number
  className?: string
}

const MessageAvatar = ({
  src,
  alt,
  fallback,
  delayMs,
  className,
}: MessageAvatarProps) => {
  return (
    <Avatar className={cn("size-8 shrink-0", className)}>
      {src && <AvatarImage src={src} alt={alt} />}
      {fallback && (
        <AvatarFallback delayMs={delayMs}>{fallback}</AvatarFallback>
      )}
    </Avatar>
  )
}

export type MessageContentProps = {
  children: React.ReactNode
  markdown?: boolean
  id?: string
  className?: string
} & React.HTMLProps<HTMLDivElement>

const MessageContent = ({
  children,
  markdown = false,
  id,
  className,
  ...props
}: MessageContentProps) => {
  const classNames = cn(
    "rounded-lg p-2 text-foreground bg-secondary prose break-words whitespace-normal",
    className
  )

  return markdown ? (
    <div className={classNames} {...props}>
      <Markdown id={id}>{children as string}</Markdown>
    </div>
  ) : (
    <div className={classNames} {...props}>
      {children}
    </div>
  )
}

export type MessageActionsProps = {
  children: React.ReactNode
  className?: string
} & React.HTMLProps<HTMLDivElement>

const MessageActions = ({
  children,
  className,
  ...props
}: MessageActionsProps) => (
  <div
    className={cn(
      "flex items-center gap-1 opacity-0 transition-opacity group-hover/message:opacity-100",
      className
    )}
    {...props}
  >
    {children}
  </div>
)

export type MessageActionProps = {
  className?: string
  tooltip: React.ReactNode
  children: React.ReactNode
  side?: "top" | "bottom" | "left" | "right"
} & React.ComponentProps<typeof Tooltip>

const MessageAction = ({
  tooltip,
  children,
  className,
  side = "top",
  ...props
}: MessageActionProps) => {
  return (
    <TooltipProvider>
      <Tooltip {...props}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} className={className}>
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export { Message, MessageAvatar, MessageContent, MessageActions, MessageAction }
