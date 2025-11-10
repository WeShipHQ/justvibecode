"use client"

import { Panel, PanelHeader } from "@/components/panels/panels"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { SquareChevronRight } from "lucide-react"
import { useEffect, useRef } from "react"
import type { Command } from "./types"

interface Props {
  className?: string
  commands: Command[]
}

export function CommandsLogs(props: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [props.commands])

  return (
    <Panel className={cn(props.className, "bg-card dark:bg-[#0a0a0a]")}>
      <PanelHeader className="bg-muted/50 dark:bg-[#171717] border-b">
        <SquareChevronRight className="mr-2 w-4" />
        <span className="font-mono text-xs font-medium uppercase tracking-wide">
          Output
        </span>
      </PanelHeader>
      <div className="h-[calc(100%-2rem)] bg-card dark:bg-[#0a0a0a]">
        <ScrollArea className="h-full">
          <div className="p-3 space-y-2 font-mono">
            {props.commands.map((command) => {
              const date = new Date(command.startedAt).toLocaleTimeString(
                "en-US",
                {
                  hour12: false,
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                }
              )

              const line = `${command.command} ${command.args.join(" ")}`
              const body = command.logs?.map((log) => log.data).join("") || ""
              return (
                <pre
                  key={command.cmdId}
                  className="whitespace-pre-wrap text-xs leading-relaxed"
                >
                  <span className="text-cyan-500 dark:text-cyan-400">
                    [{date}]
                  </span>{" "}
                  <span className="text-yellow-600 dark:text-yellow-400 font-semibold">
                    {line}
                  </span>
                  {body && (
                    <>
                      {"\n"}
                      <span className="text-foreground/80 dark:text-gray-300">
                        {body}
                      </span>
                    </>
                  )}
                </pre>
              )
            })}
          </div>
          <div ref={bottomRef} />
        </ScrollArea>
      </div>
    </Panel>
  )
}
