import type { DataPart } from "@/ai/messages/data-parts"
import { Button } from "@/components/ui/button"
import { CheckIcon, ChevronRightIcon, TerminalIcon, XIcon } from "lucide-react"
import { useState } from "react"
import Markdown from "react-markdown"
import { Spinner } from "./spinner"

export function RunCommand({ message }: { message: DataPart["run-command"] }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const isDone = message.status === "done"
  const hasError =
    (message.exitCode && message.exitCode > 0) || message.status === "error"

  return (
    <div className="w-full">
      <div className="w-full px-4">
        <Button
          variant="ghost"
          className="text-muted-foreground hover:text-foreground/80 flex w-fit cursor-pointer flex-row items-center gap-2 rounded-full py-1 text-xs transition-colors outline-none select-none focus:underline disabled:cursor-default h-auto px-0"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="relative size-3">
            {["executing", "waiting"].includes(message.status) ? (
              <Spinner className="size-3" loading={true}>
                <TerminalIcon className="size-3 text-zinc-400 dark:text-zinc-600" />
              </Spinner>
            ) : (
              <>
                <ChevronRightIcon
                  className="absolute inset-0 size-3 transition-[transform] duration-100"
                  style={{
                    transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                    opacity: isExpanded ? 1 : 0,
                  }}
                />
                <TerminalIcon
                  className="absolute inset-0 size-3 text-zinc-400 dark:text-zinc-600"
                  style={{ opacity: isExpanded ? 0 : 1 }}
                />
              </>
            )}
          </div>
          <span className="font-medium">
            {message.status === "executing" && "Executing command"}
            {message.status === "waiting" && "Waiting"}
            {message.status === "running" && "Running in background"}
            {message.status === "done" && !hasError && "Executed command"}
            {message.status === "done" && hasError && "Command errored"}
            {message.status === "error" && "Command errored"}
          </span>
        </Button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 py-2 space-y-2">
          <div className="flex items-start gap-2">
            {hasError ? (
              <XIcon className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5" />
            ) : (
              <CheckIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            )}
            <div className="text-sm break-words">
              <Markdown>{`\`${message.command} ${message.args.join(" ")}\``}</Markdown>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
