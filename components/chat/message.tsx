import { Button } from "@/components/ui/button"
import { CopyIcon, LinkIcon, MoreVerticalIcon } from "lucide-react"
import { createContext, memo, useContext, useEffect, useState } from "react"
import { MessagePart } from "./message-part"
import type { ChatUIMessage } from "./types"

interface Props {
  message: ChatUIMessage
}

interface ReasoningContextType {
  expandedReasoningIndex: number | null
  setExpandedReasoningIndex: (index: number | null) => void
}

const ReasoningContext = createContext<ReasoningContextType | null>(null)

export const useReasoningContext = () => {
  const context = useContext(ReasoningContext)
  return context
}

export const Message = memo(function Message({ message }: Props) {
  const [expandedReasoningIndex, setExpandedReasoningIndex] = useState<
    number | null
  >(null)

  const reasoningParts = message.parts
    .map((part, index) => ({ part, index }))
    .filter(({ part }) => part.type === "reasoning")

  useEffect(() => {
    if (reasoningParts.length > 0) {
      const latestReasoningIndex =
        reasoningParts[reasoningParts.length - 1].index
      setExpandedReasoningIndex(latestReasoningIndex)
    }
  }, [reasoningParts])

  return (
    <ReasoningContext.Provider
      value={{ expandedReasoningIndex, setExpandedReasoningIndex }}
    >
      <div className="flex w-full min-w-0 flex-col" id={message.id}>
        <div className="w-full min-w-0 space-y-2">
          {/* User Message */}
          {message.role === "user" && (
            <div className="px-4">
              <div className="bg-muted ml-auto w-fit max-w-full rounded-xl px-4 py-2 text-sm break-words whitespace-pre-wrap">
                {message.parts
                  .filter((part) => part.type === "text")
                  .map((part) => {
                    if (part.type === "text") {
                      return part.text
                    }
                    return null
                  })
                  .join("")}
              </div>
            </div>
          )}

          {/* Assistant Message */}
          {message.role === "assistant" && (
            <>
              {/* Message Content */}
              {message.parts.map((part, index) => (
                <MessagePart key={index} part={part} partIndex={index} />
              ))}

              {/* Message Actions */}
              <div className="flex flex-row items-center gap-2 px-3 pt-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="group size-6 rounded-md"
                  aria-label="Copy link to message"
                >
                  <LinkIcon className="size-3 text-zinc-400 dark:text-zinc-600 group-hover:text-foreground dark:group-hover:text-foreground transition-colors" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="group size-6 rounded-md"
                  aria-label="Copy"
                >
                  <CopyIcon className="size-3 text-zinc-400 dark:text-zinc-600 group-hover:text-foreground dark:group-hover:text-foreground transition-colors" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="group size-6 rounded-md"
                  aria-label="More Actions"
                >
                  <MoreVerticalIcon className="size-3 text-zinc-400 dark:text-zinc-600 group-hover:text-foreground dark:group-hover:text-foreground transition-colors" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </ReasoningContext.Provider>
  )
})
