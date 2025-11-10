import type { DataPart } from "@/ai/messages/data-parts"
import { Button } from "@/components/ui/button"
import { CheckIcon, ChevronRightIcon, FileCodeIcon, XIcon } from "lucide-react"
import { useState } from "react"
import { Spinner } from "./spinner"

export function GenerateFiles(props: {
  className?: string
  message: DataPart["generating-files"]
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  const lastInProgress = ["error", "uploading", "generating"].includes(
    props.message.status
  )

  const generated = lastInProgress
    ? props.message.paths.slice(0, props.message.paths.length - 1)
    : props.message.paths

  const generating = lastInProgress
    ? (props.message.paths[props.message.paths.length - 1] ?? "")
    : null

  const isDone = props.message.status === "done"
  const addedCount = generated.length
  const removedCount = 0 // You can calculate this if needed

  return (
    <div className="w-full max-w-full">
      <div className="w-full px-4">
        <Button
          variant="ghost"
          className="group text-muted-foreground hover:text-foreground/80 flex w-fit cursor-pointer flex-row items-center gap-2 rounded-full py-1 text-xs transition-colors outline-none select-none focus:underline disabled:cursor-default h-auto px-0"
          onClick={() => setIsExpanded(!isExpanded)}
          disabled={!isDone}
        >
          <div className="relative size-3">
            <ChevronRightIcon
              className="absolute inset-0 size-3 transition-[transform] duration-100"
              style={{
                transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                opacity: isExpanded ? 1 : 0,
              }}
            />
            <FileCodeIcon
              className="absolute inset-0 size-3 text-zinc-400 dark:text-zinc-600"
              style={{ opacity: isExpanded ? 0 : 1 }}
            />
          </div>
          <div className="flex flex-row gap-1">
            <span className="font-medium">
              {isDone ? "Edited file" : "Editing file"}
            </span>
            {isDone && (
              <div className="flex flex-row gap-1 truncate">
                <span className="truncate tracking-tight text-zinc-500 group-hover:text-zinc-600 group-hover:dark:text-zinc-400">
                  {generated[0]?.split("/").pop() || "Files"}
                </span>
                {addedCount > 0 && (
                  <div className="ml-auto flex items-center gap-1">
                    <span className="font-mono text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                      +{addedCount}
                    </span>
                    {removedCount > 0 && (
                      <>
                        <span
                          className="font-mono text-[10px] text-zinc-300 dark:text-zinc-600"
                          aria-hidden="true"
                        >
                          /
                        </span>
                        <span className="font-mono text-[10px] font-medium text-rose-600 dark:text-rose-400">
                          -{removedCount}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </Button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 py-2 text-sm">
          {generated.map((path) => (
            <div
              className="flex items-center text-zinc-600 dark:text-zinc-400"
              key={"gen" + path}
            >
              <CheckIcon className="w-3 h-3 mr-2 text-emerald-600" />
              <span className="whitespace-pre-wrap">{path}</span>
            </div>
          ))}
          {typeof generating === "string" && (
            <div className="flex items-center">
              <Spinner
                className="mr-2"
                loading={props.message.status !== "error"}
              >
                {props.message.status === "error" ? (
                  <XIcon className="w-3 h-3 text-red-700" />
                ) : (
                  <CheckIcon className="w-3 h-3" />
                )}
              </Spinner>
              <span>{generating}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
