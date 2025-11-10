import { randomBytes } from "crypto"
import { and, eq, gt } from "drizzle-orm"
import { db } from "../drizzle"
import { session, type Session } from "../schema"

/**
 * Session Service - Manage user authentication sessions
 */

export type CreateSessionInput = {
  userId: string
  walletAddress: string
  expiresInDays?: number
  userAgent?: string
  ipAddress?: string
}

/**
 * Generate a secure random session token
 */
export function generateSessionToken(): string {
  return randomBytes(32).toString("hex")
}

/**
 * Create a new session
 */
export async function createSession(
  input: CreateSessionInput
): Promise<Session> {
  const sessionToken = generateSessionToken()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + (input.expiresInDays ?? 30)) // Default 30 days

  const result = await db
    .insert(session)
    .values({
      userId: input.userId,
      walletAddress: input.walletAddress,
      sessionToken,
      expiresAt,
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
    })
    .returning()

  return result[0]
}

/**
 * Get session by token
 */
export async function getSessionByToken(
  sessionToken: string
): Promise<Session | undefined> {
  const result = await db
    .select()
    .from(session)
    .where(eq(session.sessionToken, sessionToken))
    .limit(1)

  return result[0]
}

/**
 * Get valid (non-expired) session by token
 */
export async function getValidSession(
  sessionToken: string
): Promise<Session | undefined> {
  const result = await db
    .select()
    .from(session)
    .where(
      and(
        eq(session.sessionToken, sessionToken),
        gt(session.expiresAt, new Date())
      )
    )
    .limit(1)

  return result[0]
}

/**
 * Get all sessions for a user
 */
export async function getUserSessions(userId: string): Promise<Session[]> {
  return db
    .select()
    .from(session)
    .where(and(eq(session.userId, userId), gt(session.expiresAt, new Date())))
}

/**
 * Update session last active timestamp
 */
export async function updateSessionActivity(
  sessionToken: string
): Promise<Session | undefined> {
  const result = await db
    .update(session)
    .set({
      lastActiveAt: new Date(),
    })
    .where(eq(session.sessionToken, sessionToken))
    .returning()

  return result[0]
}

/**
 * Extend session expiration
 */
export async function extendSession(
  sessionToken: string,
  additionalDays: number = 30
): Promise<Session | undefined> {
  const existingSession = await getSessionByToken(sessionToken)
  if (!existingSession) return undefined

  const newExpiresAt = new Date(existingSession.expiresAt)
  newExpiresAt.setDate(newExpiresAt.getDate() + additionalDays)

  const result = await db
    .update(session)
    .set({
      expiresAt: newExpiresAt,
      lastActiveAt: new Date(),
    })
    .where(eq(session.sessionToken, sessionToken))
    .returning()

  return result[0]
}

/**
 * Delete a specific session (logout)
 */
export async function deleteSession(sessionToken: string): Promise<void> {
  await db.delete(session).where(eq(session.sessionToken, sessionToken))
}

/**
 * Delete all sessions for a user (logout from all devices)
 */
export async function deleteUserSessions(userId: string): Promise<void> {
  await db.delete(session).where(eq(session.userId, userId))
}

/**
 * Delete expired sessions (cleanup task)
 */
export async function deleteExpiredSessions(): Promise<number> {
  const result = await db
    .delete(session)
    .where(gt(new Date(), session.expiresAt))
    .returning()

  return result.length
}

/**
 * Validate session and update activity
 */
export async function validateAndRefreshSession(
  sessionToken: string
): Promise<Session | null> {
  const validSession = await getValidSession(sessionToken)

  if (!validSession) {
    return null
  }

  // Update last active timestamp
  await updateSessionActivity(sessionToken)

  return validSession
}

/**
 * Get session with user data
 */
export async function getSessionWithUser(sessionToken: string) {
  const result = await db.query.session.findFirst({
    where: eq(session.sessionToken, sessionToken),
    with: {
      user: true,
    },
  })

  return result
}
