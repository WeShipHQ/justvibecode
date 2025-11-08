import z from "zod/v3"

// Re-export existing types from components for consistency
export type { Command, CommandLog } from "@/components/commands-logs/types"

// Additional types for API responses
export type CommandApiResponse = z.infer<typeof cmdApiResponseSchema>

export const logSchema = z.object({
  data: z.string(),
  stream: z.enum(["stdout", "stderr"]),
  timestamp: z.number(),
})

// Full command schema (for complete Command objects)
export const cmdSchema = z.object({
  background: z.boolean().optional(),
  sandboxId: z.string(),
  cmdId: z.string(),
  startedAt: z.number(),
  command: z.string(),
  args: z.array(z.string()),
  exitCode: z.number().optional(),
  logs: z.array(logSchema).optional(),
})

// API response schema (for command metadata from API)
export const cmdApiResponseSchema = z.object({
  sandboxId: z.string(),
  cmdId: z.string(),
  startedAt: z.number(),
  exitCode: z.number().optional(),
})

/**
 * Shared utility to stream command logs from API
 */
export async function* getCommandLogs(
  sandboxId: string,
  cmdId: string,
  options?: { stripAnsi?: boolean }
) {
  const response = await fetch(
    `/api/sandboxes/${sandboxId}/cmds/${cmdId}/logs`,
    { headers: { "Content-Type": "application/json" } }
  )

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let line = ""
  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    line += decoder.decode(value, { stream: true })
    const lines = line.split("\n")
    for (let i = 0; i < lines.length - 1; i++) {
      if (lines[i]) {
        const logEntry = JSON.parse(lines[i])
        const parsed = logSchema.parse(logEntry)

        if (options?.stripAnsi) {
          // Lazy import stripAnsi only when needed
          const stripAnsi = (await import("strip-ansi")).default
          yield {
            ...parsed,
            data: stripAnsi(parsed.data),
          }
        } else {
          yield parsed
        }
      }
    }
    line = lines[lines.length - 1]
  }
}

/**
 * Get command metadata from API (only basic fields)
 */
export async function getCommand(sandboxId: string, cmdId: string) {
  const response = await fetch(`/api/sandboxes/${sandboxId}/cmds/${cmdId}`)
  const json = await response.json()
  return cmdApiResponseSchema.parse(json)
}
