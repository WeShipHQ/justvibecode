import { MarkdownRenderer } from "@/components/markdown-renderer/markdown-renderer"
import type { TextUIPart } from "ai"

export function Text({ part }: { part: TextUIPart }) {
  return (
    <div className="space-y-4 text-(--tw-prose-body) prose-zinc dark:prose-invert w-full max-w-full px-4 text-sm break-words">
      <MarkdownRenderer content={part.text} />
    </div>
  )
}
