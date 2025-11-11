/**
 * Sandbox Service
 *
 * Manages sandbox lifecycle, file storage, command execution, and log persistence.
 * Part of Phase 4: Sandbox & Project Persistence
 */

import crypto from "crypto"
import { and, asc, desc, eq, gte, sql } from "drizzle-orm"
import { db } from "../drizzle"
import {
  command,
  commandLog,
  sandbox,
  sandboxFile,
  type Command,
  type CommandLog,
  type Sandbox,
  type SandboxFile,
} from "../schema"

// ============================================
// Sandbox Management
// ============================================

/**
 * Create a new sandbox record
 */
export async function createSandbox(data: {
  sandboxId: string
  userId: string
  chatId?: string
  url?: string
  metadata?: Sandbox["metadata"]
}): Promise<Sandbox> {
  const [newSandbox] = await db
    .insert(sandbox)
    .values({
      sandboxId: data.sandboxId,
      userId: data.userId,
      chatId: data.chatId || null,
      url: data.url || null,
      metadata: data.metadata || null,
      status: "running",
    })
    .returning()

  return newSandbox
}

/**
 * Get sandbox by ID
 */
export async function getSandboxById(id: string): Promise<Sandbox | null> {
  const result = await db
    .select()
    .from(sandbox)
    .where(eq(sandbox.id, id))
    .limit(1)

  return result[0] || null
}

/**
 * Get sandbox by external sandbox ID
 */
export async function getSandboxBySandboxId(
  sandboxId: string
): Promise<Sandbox | null> {
  const result = await db
    .select()
    .from(sandbox)
    .where(eq(sandbox.sandboxId, sandboxId))
    .limit(1)

  return result[0] || null
}

/**
 * Get all sandboxes for a user
 */
export async function getUserSandboxes(
  userId: string,
  options: {
    limit?: number
    offset?: number
    status?: Sandbox["status"]
  } = {}
): Promise<Sandbox[]> {
  const { limit = 50, offset = 0, status } = options

  let query = db
    .select()
    .from(sandbox)
    .where(eq(sandbox.userId, userId))
    .orderBy(desc(sandbox.createdAt))
    .limit(limit)
    .offset(offset)

  if (status) {
    query = db
      .select()
      .from(sandbox)
      .where(and(eq(sandbox.userId, userId), eq(sandbox.status, status)))
      .orderBy(desc(sandbox.createdAt))
      .limit(limit)
      .offset(offset)
  }

  return await query
}

/**
 * Get sandboxes for a chat
 */
export async function getChatSandboxes(chatId: string): Promise<Sandbox[]> {
  return await db
    .select()
    .from(sandbox)
    .where(eq(sandbox.chatId, chatId))
    .orderBy(desc(sandbox.createdAt))
}

/**
 * Get active (running) sandboxes
 */
export async function getActiveSandboxes(userId?: string): Promise<Sandbox[]> {
  if (userId) {
    return await db
      .select()
      .from(sandbox)
      .where(and(eq(sandbox.userId, userId), eq(sandbox.status, "running")))
      .orderBy(desc(sandbox.lastActiveAt))
  }

  return await db
    .select()
    .from(sandbox)
    .where(eq(sandbox.status, "running"))
    .orderBy(desc(sandbox.lastActiveAt))
}

/**
 * Update sandbox status
 */
export async function updateSandboxStatus(
  sandboxId: string,
  status: Sandbox["status"],
  errorMessage?: string
): Promise<Sandbox | null> {
  const updates: Partial<Sandbox> = {
    status,
    lastActiveAt: new Date(),
  }

  if (status === "stopped" || status === "terminated") {
    updates.stoppedAt = new Date()
  }

  if (errorMessage) {
    updates.errorMessage = errorMessage
  }

  const [updated] = await db
    .update(sandbox)
    .set(updates)
    .where(eq(sandbox.sandboxId, sandboxId))
    .returning()

  return updated || null
}

/**
 * Update sandbox URL
 */
export async function updateSandboxUrl(
  sandboxId: string,
  url: string
): Promise<Sandbox | null> {
  const [updated] = await db
    .update(sandbox)
    .set({
      url,
      lastActiveAt: new Date(),
    })
    .where(eq(sandbox.sandboxId, sandboxId))
    .returning()

  return updated || null
}

/**
 * Update sandbox metadata
 */
export async function updateSandboxMetadata(
  sandboxId: string,
  metadata: Sandbox["metadata"]
): Promise<Sandbox | null> {
  const [updated] = await db
    .update(sandbox)
    .set({
      metadata,
      lastActiveAt: new Date(),
    })
    .where(eq(sandbox.sandboxId, sandboxId))
    .returning()

  return updated || null
}

/**
 * Touch sandbox (update lastActiveAt)
 */
export async function touchSandbox(sandboxId: string): Promise<void> {
  await db
    .update(sandbox)
    .set({ lastActiveAt: new Date() })
    .where(eq(sandbox.sandboxId, sandboxId))
}

/**
 * Delete sandbox (hard delete with cascade)
 */
export async function deleteSandbox(sandboxId: string): Promise<boolean> {
  const result = await db
    .delete(sandbox)
    .where(eq(sandbox.sandboxId, sandboxId))
    .returning()

  return result.length > 0
}

/**
 * Count user sandboxes
 */
export async function countUserSandboxes(userId: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(sandbox)
    .where(eq(sandbox.userId, userId))

  return Number(result[0]?.count || 0)
}

/**
 * Get user sandbox statistics
 */
export async function getUserSandboxStats(userId: string): Promise<{
  totalSandboxes: number
  runningSandboxes: number
  stoppedSandboxes: number
  errorSandboxes: number
}> {
  const result = await db
    .select({
      status: sandbox.status,
      count: sql<number>`count(*)`,
    })
    .from(sandbox)
    .where(eq(sandbox.userId, userId))
    .groupBy(sandbox.status)

  const stats = {
    totalSandboxes: 0,
    runningSandboxes: 0,
    stoppedSandboxes: 0,
    errorSandboxes: 0,
  }

  result.forEach((row) => {
    const count = Number(row.count)
    stats.totalSandboxes += count

    if (row.status === "running") {
      stats.runningSandboxes = count
    } else if (row.status === "stopped" || row.status === "terminated") {
      stats.stoppedSandboxes += count
    } else if (row.status === "error") {
      stats.errorSandboxes = count
    }
  })

  return stats
}

/**
 * Find or create sandbox (idempotent)
 */
export async function findOrCreateSandbox(data: {
  sandboxId: string
  userId: string
  chatId?: string
  url?: string
  metadata?: Sandbox["metadata"]
}): Promise<Sandbox> {
  const existing = await getSandboxBySandboxId(data.sandboxId)
  if (existing) {
    return existing
  }

  return await createSandbox(data)
}

// ============================================
// Sandbox File Management
// ============================================

/**
 * Save a file to a sandbox
 */
export async function saveSandboxFile(data: {
  sandboxId: string
  path: string
  content: string
  isGenerated?: boolean
  metadata?: SandboxFile["metadata"]
}): Promise<SandboxFile> {
  // Get internal sandbox ID from external sandbox ID
  const sb = await getSandboxBySandboxId(data.sandboxId)
  if (!sb) {
    throw new Error(`Sandbox not found: ${data.sandboxId}`)
  }

  // Generate content hash for deduplication
  const contentHash = crypto
    .createHash("sha256")
    .update(data.content)
    .digest("hex")

  // Check if file already exists
  const existing = await getSandboxFileByPath(data.sandboxId, data.path)

  if (existing) {
    // Update existing file
    const [updated] = await db
      .update(sandboxFile)
      .set({
        content: data.content,
        contentHash,
        isGenerated: data.isGenerated ?? existing.isGenerated,
        metadata: data.metadata || existing.metadata,
        updatedAt: new Date(),
      })
      .where(eq(sandboxFile.id, existing.id))
      .returning()

    return updated
  }

  // Create new file
  const [newFile] = await db
    .insert(sandboxFile)
    .values({
      sandboxId: sb.id,
      path: data.path,
      content: data.content,
      contentHash,
      isGenerated: data.isGenerated || false,
      metadata: data.metadata || null,
    })
    .returning()

  return newFile
}

/**
 * Save multiple files to a sandbox
 */
export async function saveSandboxFiles(
  sandboxId: string,
  files: Array<{
    path: string
    content: string
    isGenerated?: boolean
    metadata?: SandboxFile["metadata"]
  }>
): Promise<SandboxFile[]> {
  const results: SandboxFile[] = []

  for (const file of files) {
    const saved = await saveSandboxFile({
      sandboxId,
      ...file,
    })
    results.push(saved)
  }

  return results
}

/**
 * Get file by path
 */
export async function getSandboxFileByPath(
  sandboxId: string,
  path: string
): Promise<SandboxFile | null> {
  const sb = await getSandboxBySandboxId(sandboxId)
  if (!sb) return null

  const result = await db
    .select()
    .from(sandboxFile)
    .where(and(eq(sandboxFile.sandboxId, sb.id), eq(sandboxFile.path, path)))
    .limit(1)

  return result[0] || null
}

/**
 * Get all files for a sandbox
 */
export async function getSandboxFiles(
  sandboxId: string,
  options: {
    isGenerated?: boolean
  } = {}
): Promise<SandboxFile[]> {
  const sb = await getSandboxBySandboxId(sandboxId)
  if (!sb) return []

  if (options.isGenerated !== undefined) {
    return await db
      .select()
      .from(sandboxFile)
      .where(
        and(
          eq(sandboxFile.sandboxId, sb.id),
          eq(sandboxFile.isGenerated, options.isGenerated)
        )
      )
      .orderBy(asc(sandboxFile.path))
  }

  return await db
    .select()
    .from(sandboxFile)
    .where(eq(sandboxFile.sandboxId, sb.id))
    .orderBy(asc(sandboxFile.path))
}

/**
 * Get generated files only
 */
export async function getSandboxGeneratedFiles(
  sandboxId: string
): Promise<SandboxFile[]> {
  return await getSandboxFiles(sandboxId, { isGenerated: true })
}

/**
 * Delete file
 */
export async function deleteSandboxFile(
  sandboxId: string,
  path: string
): Promise<boolean> {
  const sb = await getSandboxBySandboxId(sandboxId)
  if (!sb) return false

  const result = await db
    .delete(sandboxFile)
    .where(and(eq(sandboxFile.sandboxId, sb.id), eq(sandboxFile.path, path)))
    .returning()

  return result.length > 0
}

/**
 * Count sandbox files
 */
export async function countSandboxFiles(sandboxId: string): Promise<number> {
  const sb = await getSandboxBySandboxId(sandboxId)
  if (!sb) return 0

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(sandboxFile)
    .where(eq(sandboxFile.sandboxId, sb.id))

  return Number(result[0]?.count || 0)
}

// ============================================
// Command Management
// ============================================

/**
 * Create a new command record
 */
export async function createCommand(data: {
  sandboxId: string
  cmdId?: string
  command: string
  args?: string[]
  background?: boolean
  metadata?: Command["metadata"]
}): Promise<Command> {
  const sb = await getSandboxBySandboxId(data.sandboxId)
  if (!sb) {
    throw new Error(`Sandbox not found: ${data.sandboxId}`)
  }

  const [newCommand] = await db
    .insert(command)
    .values({
      sandboxId: sb.id,
      cmdId: data.cmdId || null,
      command: data.command,
      args: data.args || null,
      background: data.background || false,
      metadata: data.metadata || null,
      status: "pending",
    })
    .returning()

  return newCommand
}

/**
 * Get command by ID
 */
export async function getCommandById(id: string): Promise<Command | null> {
  const result = await db
    .select()
    .from(command)
    .where(eq(command.id, id))
    .limit(1)

  return result[0] || null
}

/**
 * Get command by external command ID
 */
export async function getCommandByCmdId(
  cmdId: string
): Promise<Command | null> {
  const result = await db
    .select()
    .from(command)
    .where(eq(command.cmdId, cmdId))
    .limit(1)

  return result[0] || null
}

/**
 * Get all commands for a sandbox
 */
export async function getSandboxCommands(
  sandboxId: string,
  options: {
    limit?: number
    offset?: number
  } = {}
): Promise<Command[]> {
  const { limit = 100, offset = 0 } = options
  const sb = await getSandboxBySandboxId(sandboxId)
  if (!sb) return []

  return await db
    .select()
    .from(command)
    .where(eq(command.sandboxId, sb.id))
    .orderBy(desc(command.createdAt))
    .limit(limit)
    .offset(offset)
}

/**
 * Update command status
 */
export async function updateCommandStatus(
  commandId: string,
  status: Command["status"],
  exitCode?: string
): Promise<Command | null> {
  const updates: Partial<Command> = { status }

  if (status === "running" && !updates.startedAt) {
    updates.startedAt = new Date()
  }

  if (
    status === "completed" ||
    status === "failed" ||
    status === "terminated"
  ) {
    updates.finishedAt = new Date()
  }

  if (exitCode !== undefined) {
    updates.exitCode = exitCode
  }

  const [updated] = await db
    .update(command)
    .set(updates)
    .where(eq(command.id, commandId))
    .returning()

  return updated || null
}

/**
 * Mark command as started
 */
export async function markCommandStarted(
  commandId: string
): Promise<Command | null> {
  return await updateCommandStatus(commandId, "running")
}

/**
 * Mark command as completed
 */
export async function markCommandCompleted(
  commandId: string,
  exitCode: string
): Promise<Command | null> {
  return await updateCommandStatus(commandId, "completed", exitCode)
}

/**
 * Mark command as failed
 */
export async function markCommandFailed(
  commandId: string,
  exitCode?: string
): Promise<Command | null> {
  return await updateCommandStatus(commandId, "failed", exitCode)
}

/**
 * Count sandbox commands
 */
export async function countSandboxCommands(sandboxId: string): Promise<number> {
  const sb = await getSandboxBySandboxId(sandboxId)
  if (!sb) return 0

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(command)
    .where(eq(command.sandboxId, sb.id))

  return Number(result[0]?.count || 0)
}

// ============================================
// Command Log Management
// ============================================

/**
 * Append a log entry to a command
 */
export async function appendCommandLog(data: {
  commandId: string
  stream: "stdout" | "stderr"
  data: string
  sequence?: string
}): Promise<CommandLog> {
  const [log] = await db
    .insert(commandLog)
    .values({
      commandId: data.commandId,
      stream: data.stream,
      data: data.data,
      sequence: data.sequence || "0",
    })
    .returning()

  return log
}

/**
 * Append multiple log entries
 */
export async function appendCommandLogs(
  commandId: string,
  logs: Array<{
    stream: "stdout" | "stderr"
    data: string
    sequence?: string
  }>
): Promise<CommandLog[]> {
  if (logs.length === 0) return []

  const values = logs.map((log) => ({
    commandId,
    stream: log.stream,
    data: log.data,
    sequence: log.sequence || "0",
  }))

  return await db.insert(commandLog).values(values).returning()
}

/**
 * Get logs for a command
 */
export async function getCommandLogs(
  commandId: string,
  options: {
    stream?: "stdout" | "stderr"
    limit?: number
    offset?: number
  } = {}
): Promise<CommandLog[]> {
  const { stream, limit = 1000, offset = 0 } = options

  let query = db
    .select()
    .from(commandLog)
    .where(eq(commandLog.commandId, commandId))
    .orderBy(asc(commandLog.sequence), asc(commandLog.timestamp))
    .limit(limit)
    .offset(offset)

  if (stream) {
    query = db
      .select()
      .from(commandLog)
      .where(
        and(eq(commandLog.commandId, commandId), eq(commandLog.stream, stream))
      )
      .orderBy(asc(commandLog.sequence), asc(commandLog.timestamp))
      .limit(limit)
      .offset(offset)
  }

  return await query
}

/**
 * Get stdout logs only
 */
export async function getCommandStdout(commandId: string): Promise<string> {
  const logs = await getCommandLogs(commandId, { stream: "stdout" })
  return logs.map((log) => log.data).join("")
}

/**
 * Get stderr logs only
 */
export async function getCommandStderr(commandId: string): Promise<string> {
  const logs = await getCommandLogs(commandId, { stream: "stderr" })
  return logs.map((log) => log.data).join("")
}

/**
 * Get all logs combined
 */
export async function getCommandAllLogs(commandId: string): Promise<string> {
  const logs = await getCommandLogs(commandId)
  return logs.map((log) => `[${log.stream}] ${log.data}`).join("\n")
}

/**
 * Count command logs
 */
export async function countCommandLogs(commandId: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(commandLog)
    .where(eq(commandLog.commandId, commandId))

  return Number(result[0]?.count || 0)
}

/**
 * Delete old command logs (cleanup)
 */
export async function deleteOldCommandLogs(daysOld: number): Promise<number> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysOld)

  const result = await db
    .delete(commandLog)
    .where(sql`${commandLog.timestamp} < ${cutoffDate}`)
    .returning()

  return result.length
}

// ============================================
// Comprehensive Queries
// ============================================

/**
 * Get complete sandbox with files and commands
 */
export async function getSandboxWithDetails(sandboxId: string): Promise<{
  sandbox: Sandbox | null
  files: SandboxFile[]
  commands: Command[]
}> {
  const sb = await getSandboxBySandboxId(sandboxId)
  if (!sb) {
    return { sandbox: null, files: [], commands: [] }
  }

  const [files, commands] = await Promise.all([
    getSandboxFiles(sandboxId),
    getSandboxCommands(sandboxId),
  ])

  return {
    sandbox: sb,
    files,
    commands,
  }
}

/**
 * Get command with logs
 */
export async function getCommandWithLogs(commandId: string): Promise<{
  command: Command | null
  logs: CommandLog[]
}> {
  const cmd = await getCommandById(commandId)
  if (!cmd) {
    return { command: null, logs: [] }
  }

  const logs = await getCommandLogs(commandId)

  return {
    command: cmd,
    logs,
  }
}

/**
 * Get recent sandbox activity
 */
export async function getRecentSandboxActivity(
  sandboxId: string,
  hours: number = 24
): Promise<{
  sandbox: Sandbox | null
  recentCommands: Command[]
  recentFiles: SandboxFile[]
}> {
  const sb = await getSandboxBySandboxId(sandboxId)
  if (!sb) {
    return { sandbox: null, recentCommands: [], recentFiles: [] }
  }

  const cutoffDate = new Date()
  cutoffDate.setHours(cutoffDate.getHours() - hours)

  const [recentCommands, recentFiles] = await Promise.all([
    db
      .select()
      .from(command)
      .where(
        and(eq(command.sandboxId, sb.id), gte(command.createdAt, cutoffDate))
      )
      .orderBy(desc(command.createdAt)),
    db
      .select()
      .from(sandboxFile)
      .where(
        and(
          eq(sandboxFile.sandboxId, sb.id),
          gte(sandboxFile.updatedAt, cutoffDate)
        )
      )
      .orderBy(desc(sandboxFile.updatedAt)),
  ])

  return {
    sandbox: sb,
    recentCommands,
    recentFiles,
  }
}
