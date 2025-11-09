"use client"

import { TEST_PROMPTS } from "@/ai/constants"
import { Message } from "@/components/chat/message"
import type { ChatUIMessage } from "@/components/chat/types"
import { useSettings } from "@/components/settings/use-settings"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useSharedChatContext } from "@/lib/chat-context"
import { useLocalStorageValue } from "@/lib/use-local-storage-value"
import { useChat } from "@ai-sdk/react"
import {
  HammerIcon,
  HistoryIcon,
  InfoIcon,
  MicIcon,
  PaperclipIcon,
  PlusIcon,
  SquareIcon,
} from "lucide-react"
import { useCallback, useEffect } from "react"
import { useSandboxStore } from "./state"

interface Props {
  className: string
  modelId?: string
}

export function Chat({ className }: Props) {
  const [input, setInput] = useLocalStorageValue("prompt-input")
  const { chat } = useSharedChatContext()
  const { modelId, reasoningEffort } = useSettings()
  const { messages, sendMessage, status } = useChat<ChatUIMessage>({ chat })
  const { setChatStatus } = useSandboxStore()

  const validateAndSubmitMessage = useCallback(
    (text: string) => {
      if (text.trim()) {
        sendMessage({ text }, { body: { modelId, reasoningEffort } })
        setInput("")
      }
    },
    [sendMessage, modelId, setInput, reasoningEffort]
  )

  useEffect(() => {
    setChatStatus(status)
  }, [status, setChatStatus])

  return (
    <div
      className={`@container flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800 bg-background ${className}`}
    >
      {/* Chat Header */}
      <div className="flex h-11 items-center justify-between px-2 pt-1">
        <div className="bg-muted/60 text-muted-foreground relative min-w-0 rounded-md px-2 py-1 text-sm font-semibold">
          <span className="block truncate whitespace-nowrap">
            Single-letter Message
          </span>
        </div>
        <div className="flex flex-row items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 opacity-85 hover:opacity-100 rounded-md"
            aria-label="Chats"
          >
            <HistoryIcon className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 opacity-85 hover:opacity-100 rounded-md"
            aria-label="New chat"
          >
            <PlusIcon className="size-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="relative isolate h-full min-h-0 flex-1">
        {messages.length === 0 ? (
          <div className="scrollbar-thin scrollbar-thumb-zinc-300/50 dark:scrollbar-thumb-zinc-700/50 scrollbar-track-transparent h-full min-h-0 w-full min-w-0 flex-1 space-y-4 overflow-y-auto py-4">
            <div className="flex flex-col justify-center items-center h-full text-sm text-muted-foreground px-4">
              <p className="flex items-center font-semibold mb-4">
                Click and try one of these prompts:
              </p>
              <ul className="w-full space-y-2">
                {TEST_PROMPTS.map((prompt, idx) => (
                  <li
                    key={idx}
                    className="px-4 py-2 rounded-xl border border-dashed shadow-sm cursor-pointer border-border hover:bg-secondary/50 hover:text-primary"
                    onClick={() => validateAndSubmitMessage(prompt)}
                  >
                    {prompt}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="scrollbar-thin scrollbar-thumb-zinc-300/50 dark:scrollbar-thumb-zinc-700/50 scrollbar-track-transparent h-full min-h-0 w-full min-w-0 flex-1 space-y-4 overflow-y-auto py-4">
            {messages.map((message) => (
              <Message key={message.id} message={message} />
            ))}
          </div>
        )}

        {/* Gradient overlays */}
        <div className="from-background pointer-events-none absolute top-0 right-0 left-0 z-10 h-8 bg-gradient-to-b to-transparent transition-opacity duration-200 opacity-0" />
        <div className="from-background pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-8 bg-gradient-to-t to-transparent transition-opacity duration-200 opacity-0" />
      </div>

      {/* Input Area */}
      <div className="@container relative p-2 pt-0">
        <form
          onSubmit={async (event) => {
            event.preventDefault()
            validateAndSubmitMessage(input)
          }}
        >
          <div className="focus-within:border-primary/30 relative z-30 flex flex-col rounded-md border border-zinc-200 dark:border-zinc-800 p-1.5 transition-all bg-popover text-popover-foreground">
            <Textarea
              rows={2}
              placeholder="Type your message..."
              className="border-input ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-600 hover:scrollbar-thumb-zinc-500 flex resize-none text-base disabled:cursor-not-allowed disabled:opacity-50 w-full rounded-none border-0 px-3 py-2 focus-visible:border-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none bg-popover text-popover-foreground"
              disabled={status === "streaming" || status === "submitted"}
              onChange={(e) => setInput(e.target.value)}
              value={input}
            />

            <div className="flex justify-between sm:gap-1">
              {/* Left side buttons */}
              <div className="flex items-center gap-px">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 sm:size-9 rounded-full text-muted-foreground"
                  aria-label="Attach file"
                >
                  <PaperclipIcon className="size-3.5" />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 px-3 gap-1 rounded-full text-muted-foreground hover:bg-muted"
                  aria-label="Build mode"
                >
                  <HammerIcon className="size-4" />
                  <span className="text-xs">Build mode</span>
                </Button>
              </div>

              {/* Right side buttons */}
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-full text-muted-foreground"
                  aria-label="Start voice input"
                >
                  <MicIcon className="size-4" />
                </Button>

                <div className="relative rounded-full p-0.5">
                  <div className="bg-background/50 absolute inset-0 rounded-full" />
                  <Button
                    type="submit"
                    size="icon"
                    className="relative size-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={status !== "ready" || !input.trim()}
                    aria-label={status === "streaming" ? "Stop" : "Send"}
                  >
                    <SquareIcon className="size-4 fill-current" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>

        <p className="text-muted-foreground/50 relative m-1 flex cursor-pointer items-center justify-center gap-1 px-4 text-[11px] font-medium hover:underline">
          <span>... may make mistakes</span>
          <InfoIcon className="size-3" />
        </p>
      </div>
    </div>
  )
}
