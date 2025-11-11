import { eq } from "drizzle-orm"
import { db } from "../drizzle"
import { freeMessage, type FreeMessage } from "../schema"

/**
 * Free Message Service - Track free message usage per wallet
 */

export type CreateFreeMessageInput = {
  walletAddress: string
  limit?: string
}

/**
 * Get free message record by wallet address
 */
export async function getFreeMessageByWallet(
  walletAddress: string
): Promise<FreeMessage | undefined> {
  const result = await db
    .select()
    .from(freeMessage)
    .where(eq(freeMessage.walletAddress, walletAddress))
    .limit(1)

  return result[0]
}

/**
 * Create free message record
 */
export async function createFreeMessage(
  input: CreateFreeMessageInput
): Promise<FreeMessage> {
  const result = await db
    .insert(freeMessage)
    .values({
      walletAddress: input.walletAddress,
      messageCount: "0",
      limit: input.limit || "1",
    })
    .returning()

  return result[0]
}

/**
 * Increment free message count
 */
export async function incrementFreeMessageCount(
  walletAddress: string
): Promise<FreeMessage | undefined> {
  const existing = await getFreeMessageByWallet(walletAddress)

  if (!existing) {
    // Create new record with count = 1
    const result = await db
      .insert(freeMessage)
      .values({
        walletAddress,
        messageCount: "1",
        limit: "1",
        lastMessageAt: new Date(),
      })
      .returning()

    return result[0]
  }

  // Increment existing count
  const newCount = (BigInt(existing.messageCount) + BigInt(1)).toString()

  const result = await db
    .update(freeMessage)
    .set({
      messageCount: newCount,
      lastMessageAt: new Date(),
    })
    .where(eq(freeMessage.walletAddress, walletAddress))
    .returning()

  return result[0]
}

/**
 * Check if wallet has free messages remaining
 */
export async function hasFreeMessagesRemaining(
  walletAddress: string
): Promise<boolean> {
  const record = await getFreeMessageByWallet(walletAddress)

  if (!record) {
    // No record means they haven't used any free messages yet
    return true
  }

  const messageCount = BigInt(record.messageCount)
  const limit = BigInt(record.limit)

  return messageCount < limit
}

/**
 * Get remaining free messages
 */
export async function getRemainingFreeMessages(
  walletAddress: string
): Promise<string> {
  const record = await getFreeMessageByWallet(walletAddress)

  if (!record) {
    return "1" // Default limit
  }

  const messageCount = BigInt(record.messageCount)
  const limit = BigInt(record.limit)
  const remaining = limit - messageCount

  return remaining > BigInt(0) ? remaining.toString() : "0"
}

/**
 * Reset free message count for a wallet
 */
export async function resetFreeMessageCount(
  walletAddress: string
): Promise<FreeMessage | undefined> {
  const result = await db
    .update(freeMessage)
    .set({
      messageCount: "0",
      resetAt: new Date(),
    })
    .where(eq(freeMessage.walletAddress, walletAddress))
    .returning()

  return result[0]
}

/**
 * Update free message limit
 */
export async function updateFreeMessageLimit(
  walletAddress: string,
  newLimit: string
): Promise<FreeMessage | undefined> {
  const existing = await getFreeMessageByWallet(walletAddress)

  if (!existing) {
    // Create new record with custom limit
    return createFreeMessage({ walletAddress, limit: newLimit })
  }

  const result = await db
    .update(freeMessage)
    .set({
      limit: newLimit,
    })
    .where(eq(freeMessage.walletAddress, walletAddress))
    .returning()

  return result[0]
}

/**
 * Delete free message record
 */
export async function deleteFreeMessage(walletAddress: string): Promise<void> {
  await db
    .delete(freeMessage)
    .where(eq(freeMessage.walletAddress, walletAddress))
}

/**
 * Get all free message records (admin only)
 */
export async function getAllFreeMessages(
  limit: number = 100,
  offset: number = 0
): Promise<FreeMessage[]> {
  return db.select().from(freeMessage).limit(limit).offset(offset)
}

/**
 * Get free message statistics
 */
export async function getFreeMessageStats() {
  const allRecords = await db.select().from(freeMessage)

  const stats = {
    totalWallets: allRecords.length,
    walletsWithMessages: 0,
    walletsExhaustedLimit: 0,
    totalMessagesUsed: "0",
  }

  for (const record of allRecords) {
    const messageCount = BigInt(record.messageCount)
    const limit = BigInt(record.limit)

    if (messageCount > BigInt(0)) {
      stats.walletsWithMessages++
    }

    if (messageCount >= limit) {
      stats.walletsExhaustedLimit++
    }

    stats.totalMessagesUsed = (
      BigInt(stats.totalMessagesUsed) + messageCount
    ).toString()
  }

  return stats
}

/**
 * Find or create free message record
 */
export async function findOrCreateFreeMessage(
  walletAddress: string
): Promise<FreeMessage> {
  const existing = await getFreeMessageByWallet(walletAddress)

  if (existing) {
    return existing
  }

  return createFreeMessage({ walletAddress })
}
