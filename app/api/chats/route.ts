/**
 * Chat List API
 * GET /api/chats - List user's chats
 */

import { requireAuth } from "@/lib/auth/middleware"
import {
  getChatsByUser,
  getUserChatStats,
  searchChatsByTitle,
} from "@/lib/db/services/chat.service"
import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/chats
 * List all chats for the authenticated user
 */
export async function GET(request: NextRequest) {
  // Require authentication
  const auth = await requireAuth(request)
  if (auth instanceof NextResponse) return auth
  const { user } = auth

  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")
    const search = searchParams.get("search") || ""
    const includeStats = searchParams.get("includeStats") === "true"

    // Search or list chats
    const chats = search
      ? await searchChatsByTitle(user.id, search)
      : await getChatsByUser(user.id, { limit, offset })

    // Optionally include user statistics
    let stats = null
    if (includeStats) {
      stats = await getUserChatStats(user.id)
    }

    return NextResponse.json({
      success: true,
      chats,
      stats,
      pagination: {
        limit,
        offset,
        total: chats.length,
      },
    })
  } catch (error) {
    console.error("Error fetching chats:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch chats",
      },
      { status: 500 }
    )
  }
}
