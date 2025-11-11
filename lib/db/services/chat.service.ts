/**
 * Chat Service Layer
 * Handles all chat and message persistence operations for Phase 3
 */

import { and, desc, eq, sql } from "drizzle-orm"
import { db } from "../drizzle"
import { chat, message, type Chat, type DBMessage } from "../schema"

export interface CreateChatInput {
  userId: string
  title: string
  visibility?: "public" | "private"
  modelId?: string
  sandboxId?: string
}

export interface UpdateChatInput {
  title?: string
  modelId?: string
  sandboxId?: string
  lastContext?: any
}

export interface CreateMessageInput {
  chatId: string
  role: string
  parts: any
  attachments: any
  paymentId?: string
  metadata?: {
    modelId?: string
    reasoningEffort?: "low" | "medium" | "high"
    tokens?: {
      input?: number
      output?: number
      total?: number
    }
    finishReason?: string
    streamDuration?: number
  }
}

export interface GetChatsOptions {
  limit?: number
  offset?: number
  includeDeleted?: boolean
}

export interface GetMessagesOptions {
  limit?: number
  offset?: number
  order?: "asc" | "desc"
}

/**
 * Create a new chat
 */
export async function createChat(input: CreateChatInput): Promise<Chat | null> {
  try {
    const [newChat] = await db
      .insert(chat)
      .values({
        userId: input.userId,
        title: input.title,
        visibility: input.visibility || "private",
        modelId: input.modelId,
        sandboxId: input.sandboxId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    return newChat
  } catch (error) {
    console.error("Error creating chat:", error)
    return null
  }
}

/**
 * Get chat by ID
 */
export async function getChatById(chatId: string): Promise<Chat | null> {
  try {
    const [result] = await db
      .select()
      .from(chat)
      .where(and(eq(chat.id, chatId), eq(chat.isDeleted, false)))
      .limit(1)

    return result || null
  } catch (error) {
    console.error("Error getting chat by ID:", error)
    return null
  }
}

/**
 * Get all chats for a user
 */
export async function getChatsByUser(
  userId: string,
  options: GetChatsOptions = {}
): Promise<Chat[]> {
  try {
    const { limit = 50, offset = 0, includeDeleted = false } = options

    const conditions = [eq(chat.userId, userId)]
    if (!includeDeleted) {
      conditions.push(eq(chat.isDeleted, false))
    }

    const chats = await db
      .select()
      .from(chat)
      .where(and(...conditions))
      .orderBy(desc(chat.updatedAt))
      .limit(limit)
      .offset(offset)

    return chats
  } catch (error) {
    console.error("Error getting chats by user:", error)
    return []
  }
}

/**
 * Update chat details
 */
export async function updateChat(
  chatId: string,
  input: UpdateChatInput
): Promise<Chat | null> {
  try {
    const [updatedChat] = await db
      .update(chat)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(chat.id, chatId))
      .returning()

    return updatedChat || null
  } catch (error) {
    console.error("Error updating chat:", error)
    return null
  }
}

/**
 * Update chat title (commonly used for auto-generated titles)
 */
export async function updateChatTitle(
  chatId: string,
  title: string
): Promise<Chat | null> {
  return updateChat(chatId, { title })
}

/**
 * Touch chat (update updatedAt timestamp)
 */
export async function touchChat(chatId: string): Promise<void> {
  try {
    await db
      .update(chat)
      .set({ updatedAt: new Date() })
      .where(eq(chat.id, chatId))
  } catch (error) {
    console.error("Error touching chat:", error)
  }
}

/**
 * Soft delete a chat
 */
export async function deleteChat(chatId: string): Promise<boolean> {
  try {
    await db
      .update(chat)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(chat.id, chatId))

    return true
  } catch (error) {
    console.error("Error deleting chat:", error)
    return false
  }
}

/**
 * Permanently delete a chat (hard delete)
 */
export async function permanentlyDeleteChat(chatId: string): Promise<boolean> {
  try {
    await db.delete(chat).where(eq(chat.id, chatId))
    return true
  } catch (error) {
    console.error("Error permanently deleting chat:", error)
    return false
  }
}

/**
 * Restore a soft-deleted chat
 */
export async function restoreChat(chatId: string): Promise<Chat | null> {
  try {
    const [restoredChat] = await db
      .update(chat)
      .set({
        isDeleted: false,
        deletedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(chat.id, chatId))
      .returning()

    return restoredChat || null
  } catch (error) {
    console.error("Error restoring chat:", error)
    return null
  }
}

/**
 * Save a message to a chat
 */
export async function saveMessage(
  input: CreateMessageInput
): Promise<DBMessage | null> {
  try {
    const [newMessage] = await db
      .insert(message)
      .values({
        chatId: input.chatId,
        role: input.role,
        parts: input.parts,
        attachments: input.attachments,
        paymentId: input.paymentId,
        metadata: input.metadata,
        createdAt: new Date(),
      })
      .returning()

    // Touch the chat to update its updatedAt timestamp
    await touchChat(input.chatId)

    return newMessage
  } catch (error) {
    console.error("Error saving message:", error)
    return null
  }
}

/**
 * Get messages for a chat
 */
export async function getChatMessages(
  chatId: string,
  options: GetMessagesOptions = {}
): Promise<DBMessage[]> {
  try {
    const { limit = 100, offset = 0, order = "asc" } = options

    const messages = await db
      .select()
      .from(message)
      .where(eq(message.chatId, chatId))
      .orderBy(order === "asc" ? message.createdAt : desc(message.createdAt))
      .limit(limit)
      .offset(offset)

    return messages
  } catch (error) {
    console.error("Error getting chat messages:", error)
    return []
  }
}

/**
 * Get message by ID
 */
export async function getMessageById(
  messageId: string
): Promise<DBMessage | null> {
  try {
    const [result] = await db
      .select()
      .from(message)
      .where(eq(message.id, messageId))
      .limit(1)

    return result || null
  } catch (error) {
    console.error("Error getting message by ID:", error)
    return null
  }
}

/**
 * Count messages in a chat
 */
export async function countChatMessages(chatId: string): Promise<number> {
  try {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(message)
      .where(eq(message.chatId, chatId))

    return result?.count || 0
  } catch (error) {
    console.error("Error counting chat messages:", error)
    return 0
  }
}

/**
 * Get chat with messages
 */
export async function getChatWithMessages(
  chatId: string,
  messageOptions: GetMessagesOptions = {}
): Promise<{ chat: Chat; messages: DBMessage[] } | null> {
  try {
    const chatData = await getChatById(chatId)
    if (!chatData) return null

    const messages = await getChatMessages(chatId, messageOptions)

    return {
      chat: chatData,
      messages,
    }
  } catch (error) {
    console.error("Error getting chat with messages:", error)
    return null
  }
}

/**
 * Get user's chat count
 */
export async function getUserChatCount(
  userId: string,
  includeDeleted = false
): Promise<number> {
  try {
    const conditions = [eq(chat.userId, userId)]
    if (!includeDeleted) {
      conditions.push(eq(chat.isDeleted, false))
    }

    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(chat)
      .where(and(...conditions))

    return result?.count || 0
  } catch (error) {
    console.error("Error counting user chats:", error)
    return 0
  }
}

/**
 * Find or create chat
 * Useful for ensuring a chat exists before saving messages
 */
export async function findOrCreateChat(input: {
  chatId?: string
  userId: string
  title?: string
  modelId?: string
  sandboxId?: string
}): Promise<Chat | null> {
  try {
    // If chatId provided, try to find it
    if (input.chatId) {
      const existingChat = await getChatById(input.chatId)
      if (existingChat) return existingChat
    }

    // Create new chat
    return await createChat({
      userId: input.userId,
      title: input.title || "New Chat",
      modelId: input.modelId,
      sandboxId: input.sandboxId,
    })
  } catch (error) {
    console.error("Error finding or creating chat:", error)
    return null
  }
}

/**
 * Get recent chats (last 24 hours)
 */
export async function getRecentChats(userId: string): Promise<Chat[]> {
  try {
    const yesterday = new Date()
    yesterday.setHours(yesterday.getHours() - 24)

    const chats = await db
      .select()
      .from(chat)
      .where(
        and(
          eq(chat.userId, userId),
          eq(chat.isDeleted, false),
          sql`${chat.updatedAt} > ${yesterday.toISOString()}`
        )
      )
      .orderBy(desc(chat.updatedAt))
      .limit(20)

    return chats
  } catch (error) {
    console.error("Error getting recent chats:", error)
    return []
  }
}

/**
 * Search chats by title
 */
export async function searchChatsByTitle(
  userId: string,
  searchTerm: string
): Promise<Chat[]> {
  try {
    const chats = await db
      .select()
      .from(chat)
      .where(
        and(
          eq(chat.userId, userId),
          eq(chat.isDeleted, false),
          sql`${chat.title} ILIKE ${`%${searchTerm}%`}`
        )
      )
      .orderBy(desc(chat.updatedAt))
      .limit(50)

    return chats
  } catch (error) {
    console.error("Error searching chats:", error)
    return []
  }
}

/**
 * Get deleted chats (for trash/recovery)
 */
export async function getDeletedChats(userId: string): Promise<Chat[]> {
  try {
    const chats = await db
      .select()
      .from(chat)
      .where(and(eq(chat.userId, userId), eq(chat.isDeleted, true)))
      .orderBy(desc(chat.deletedAt))
      .limit(50)

    return chats
  } catch (error) {
    console.error("Error getting deleted chats:", error)
    return []
  }
}

/**
 * Batch delete messages (for cleanup)
 */
export async function deleteChatMessages(chatId: string): Promise<boolean> {
  try {
    await db.delete(message).where(eq(message.chatId, chatId))
    return true
  } catch (error) {
    console.error("Error deleting chat messages:", error)
    return false
  }
}

/**
 * Get user chat statistics
 */
export async function getUserChatStats(userId: string): Promise<{
  totalChats: number
  activeChats: number
  deletedChats: number
  totalMessages: number
}> {
  try {
    const [totalChats] = await db
      .select({ count: sql<number>`count(*)` })
      .from(chat)
      .where(eq(chat.userId, userId))

    const [activeChats] = await db
      .select({ count: sql<number>`count(*)` })
      .from(chat)
      .where(and(eq(chat.userId, userId), eq(chat.isDeleted, false)))

    const [deletedChats] = await db
      .select({ count: sql<number>`count(*)` })
      .from(chat)
      .where(and(eq(chat.userId, userId), eq(chat.isDeleted, true)))

    // Count messages in user's chats
    const [totalMessages] = await db
      .select({ count: sql<number>`count(*)` })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(eq(chat.userId, userId))

    return {
      totalChats: totalChats?.count || 0,
      activeChats: activeChats?.count || 0,
      deletedChats: deletedChats?.count || 0,
      totalMessages: totalMessages?.count || 0,
    }
  } catch (error) {
    console.error("Error getting user chat stats:", error)
    return {
      totalChats: 0,
      activeChats: 0,
      deletedChats: 0,
      totalMessages: 0,
    }
  }
}
