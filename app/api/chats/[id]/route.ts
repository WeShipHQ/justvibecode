/**
 * Individual Chat API
 * GET /api/chats/[id] - Get chat with messages
 * PATCH /api/chats/[id] - Update chat details
 * DELETE /api/chats/[id] - Soft delete chat
 */

import { requireAuth } from "@/lib/auth/middleware"
import {
  deleteChat,
  getChatById,
  getChatWithMessages,
  updateChat,
} from "@/lib/db/services/chat.service"
import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/chats/[id]
 * Get a specific chat with its messages
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Require authentication
  const auth = await requireAuth(request)
  if (auth instanceof NextResponse) return auth
  const { user } = auth

  try {
    const chatId = params.id

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const messageLimit = parseInt(searchParams.get("messageLimit") || "100")
    const messageOffset = parseInt(searchParams.get("messageOffset") || "0")
    const order = (searchParams.get("order") || "asc") as "asc" | "desc"

    // Get chat with messages
    const result = await getChatWithMessages(chatId, {
      limit: messageLimit,
      offset: messageOffset,
      order,
    })

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error: "Chat not found",
        },
        { status: 404 }
      )
    }

    // Verify ownership
    if (result.chat.userId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized access to chat",
        },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      chat: result.chat,
      messages: result.messages,
      pagination: {
        limit: messageLimit,
        offset: messageOffset,
        total: result.messages.length,
      },
    })
  } catch (error) {
    console.error("Error fetching chat:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch chat",
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/chats/[id]
 * Update chat details (title, model, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Require authentication
  const auth = await requireAuth(request)
  if (auth instanceof NextResponse) return auth
  const { user } = auth

  try {
    const chatId = params.id
    const body = await request.json()

    // Verify chat exists and user owns it
    const existingChat = await getChatById(chatId)
    if (!existingChat) {
      return NextResponse.json(
        {
          success: false,
          error: "Chat not found",
        },
        { status: 404 }
      )
    }

    if (existingChat.userId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized access to chat",
        },
        { status: 403 }
      )
    }

    // Update chat
    const updatedChat = await updateChat(chatId, {
      title: body.title,
      modelId: body.modelId,
      sandboxId: body.sandboxId,
      lastContext: body.lastContext,
    })

    if (!updatedChat) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update chat",
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      chat: updatedChat,
    })
  } catch (error) {
    console.error("Error updating chat:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update chat",
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/chats/[id]
 * Soft delete a chat (marks as deleted, doesn't remove from DB)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Require authentication
  const auth = await requireAuth(request)
  if (auth instanceof NextResponse) return auth
  const { user } = auth

  try {
    const chatId = params.id

    // Verify chat exists and user owns it
    const existingChat = await getChatById(chatId)
    if (!existingChat) {
      return NextResponse.json(
        {
          success: false,
          error: "Chat not found",
        },
        { status: 404 }
      )
    }

    if (existingChat.userId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized access to chat",
        },
        { status: 403 }
      )
    }

    // Soft delete chat
    const success = await deleteChat(chatId)

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to delete chat",
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Chat deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting chat:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete chat",
      },
      { status: 500 }
    )
  }
}
