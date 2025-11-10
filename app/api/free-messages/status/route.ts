import {
  hasFreeMessagesRemaining,
  getRemainingFreeMessages,
  getFreeMessageByWallet,
} from "@/lib/db/services/free-message.service"
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

/**
 * GET /api/free-messages/status?walletAddress=xxx
 *
 * Check free message status for a wallet address
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get("walletAddress")

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      )
    }

    const normalizedAddress = walletAddress.toLowerCase()

    // Get free message status
    const [hasRemaining, remaining, record] = await Promise.all([
      hasFreeMessagesRemaining(normalizedAddress),
      getRemainingFreeMessages(normalizedAddress),
      getFreeMessageByWallet(normalizedAddress),
    ])

    return NextResponse.json(
      {
        success: true,
        hasFreeMessagesRemaining: hasRemaining,
        remainingMessages: remaining,
        record: record
          ? {
              messageCount: record.messageCount,
              limit: record.limit,
              firstMessageAt: record.firstMessageAt,
              lastMessageAt: record.lastMessageAt,
            }
          : null,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Get free message status error:", error)
    return NextResponse.json(
      { error: "Failed to get free message status" },
      { status: 500 }
    )
  }
}
