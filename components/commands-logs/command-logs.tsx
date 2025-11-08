import {
  getCommand,
  getCommandLogs,
  type Command,
  type CommandLog,
} from "@/lib/command-logs-utils"
import { cn } from "@/lib/utils"
import { useEffect, useRef } from "react"

interface Props {
  command: Command
  onLog: (data: { sandboxId: string; cmdId: string; log: CommandLog }) => void
  onCompleted: (data: Command) => void
}

export function CommandLogs({ command, onLog, onCompleted }: Props) {
  const ref = useRef<Awaited<ReturnType<typeof getCommandLogs>>>(null)

  useEffect(() => {
    if (!ref.current) {
      const iterator = getCommandLogs(command.sandboxId, command.cmdId)
      ref.current = iterator
      ;(async () => {
        for await (const log of iterator) {
          onLog({
            sandboxId: command.sandboxId,
            cmdId: command.cmdId,
            log,
          })
        }

        const log = await getCommand(command.sandboxId, command.cmdId)
        onCompleted({
          sandboxId: log.sandboxId,
          cmdId: log.cmdId,
          startedAt: log.startedAt,
          exitCode: log.exitCode ?? 0,
          command: command.command,
          args: command.args,
        })
      })()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <pre className={cn("whitespace-pre-wrap font-mono text-sm", {})}>
      {logContent(command)}
    </pre>
  )
}

function logContent(command: Command) {
  const date = new Date(command.startedAt).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })

  const line = `${command.command} ${command.args.join(" ")}`
  const body = command.logs?.map((log) => log.data).join("") || ""
  return `[${date}] ${line}\n${body}`
}
