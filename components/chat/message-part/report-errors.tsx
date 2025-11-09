import type { DataPart } from "@/ai/messages/data-parts"
import { Button } from "@/components/ui/button"
import { BugIcon, ChevronRightIcon } from "lucide-react"
import { useState } from "react"
import Markdown from "react-markdown"

export function ReportErrors({
  message,
}: {
  message: DataPart["report-errors"]
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="w-full">
      <div className="w-full px-4">
        <Button
          variant="ghost"
          className="text-muted-foreground hover:text-foreground/80 flex w-fit cursor-pointer flex-row items-center gap-2 rounded-full py-1 text-xs transition-colors outline-none select-none focus:underline disabled:cursor-default h-auto px-0"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="relative size-3">
            <ChevronRightIcon
              className="absolute inset-0 size-3 transition-[transform] duration-100"
              style={{
                transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                opacity: isExpanded ? 1 : 0,
              }}
            />
            <BugIcon
              className="absolute inset-0 size-3 text-zinc-400 dark:text-zinc-600"
              style={{ opacity: isExpanded ? 0 : 1 }}
            />
          </div>
          <span className="font-medium">Auto-detected errors</span>
        </Button>
      </div>

      {isExpanded && (
        <div className="space-y-4 text-(--tw-prose-body) prose-zinc dark:prose-invert w-full max-w-full px-4 text-sm break-words">
          <Markdown>{message.summary}</Markdown>
        </div>
      )}
    </div>
  )
}
