import { MarkdownRenderer } from "@/components/markdown-renderer/markdown-renderer"
import { Button } from "@/components/ui/button"
import type { ReasoningUIPart } from "ai"
import { BrainIcon, ChevronRightIcon } from "lucide-react"
import { useReasoningContext } from "../message"
import { MessageSpinner } from "../message-spinner"

export function Reasoning({
  part,
  partIndex,
}: {
  part: ReasoningUIPart
  partIndex: number
}) {
  const context = useReasoningContext()
  const isExpanded = context?.expandedReasoningIndex === partIndex

  if (part.state === "done" && !part.text) {
    return null
  }

  const text = part.text || "_Thinking_"
  const isStreaming = part.state === "streaming"

  const handleClick = () => {
    if (context) {
      const newIndex = isExpanded ? null : partIndex
      context.setExpandedReasoningIndex(newIndex)
    }
  }

  return (
    <div className="w-full">
      {/* Thought Button */}
      <div className="w-full px-4">
        <Button
          variant="ghost"
          className="text-muted-foreground hover:text-foreground/80 flex w-fit cursor-pointer flex-row items-center gap-2 rounded-full py-1 text-xs transition-colors outline-none select-none focus:underline h-auto px-0"
          onClick={handleClick}
        >
          <div className="relative size-3">
            <ChevronRightIcon
              className="absolute inset-0 size-3 transition-[transform] duration-100"
              style={{
                transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                opacity: isExpanded ? 1 : 0,
              }}
            />
            <BrainIcon
              className="absolute inset-0 size-3 text-zinc-400 dark:text-zinc-600"
              style={{ opacity: isExpanded ? 0 : 1 }}
            />
          </div>
          <span className="font-medium">Thought</span>
        </Button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="space-y-4 text-(--tw-prose-body) prose-zinc dark:prose-invert w-full max-w-full px-4 text-sm break-words">
          <MarkdownRenderer content={text} />
          {isStreaming && <MessageSpinner />}
        </div>
      )}
    </div>
  )
}
