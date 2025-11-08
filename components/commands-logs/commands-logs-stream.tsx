"use client"

import { useSandboxStore } from "@/app/state"
import { getCommand, getCommandLogs } from "@/lib/command-logs-utils"
import { useEffect, useRef } from "react"

type StreamingCommandLogs = Record<
  string,
  Awaited<ReturnType<typeof getCommandLogs>>
>

export function CommandLogsStream() {
  const { sandboxId, commands, addLog, upsertCommand } = useSandboxStore()
  const ref = useRef<StreamingCommandLogs>({})

  useEffect(() => {
    if (sandboxId) {
      for (const command of commands.filter(
        (command) => typeof command.exitCode === "undefined"
      )) {
        if (!ref.current[command.cmdId]) {
          const iterator = getCommandLogs(sandboxId, command.cmdId, {
            stripAnsi: true,
          })
          ref.current[command.cmdId] = iterator
          ;(async () => {
            for await (const log of iterator) {
              addLog({
                sandboxId: sandboxId,
                cmdId: command.cmdId,
                log: log,
              })
            }

            const log = await getCommand(sandboxId, command.cmdId)
            upsertCommand({
              sandboxId: log.sandboxId,
              cmdId: log.cmdId,
              exitCode: log.exitCode ?? 0,
              command: command.command,
              args: command.args,
            })
          })()
        }
      }
    }
  }, [sandboxId, commands, addLog, upsertCommand])

  return null
}
