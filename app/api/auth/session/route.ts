import { validateAndRefreshSession } from "@/lib/db/services/session.service"
import { getUserById } from "@/lib/db/services/user.service"
import { getActiveWallet } from "@/lib/db/services/wallet.service"
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

/**
 * POST /api/auth/session
 *
 * Validate and refresh session, return user data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionToken } = body

    if (!sessionToken) {
      return NextResponse.json(
        { error: "Session token is required" },
        { status: 400 }
      )
    }

    // Validate session
    const session = await validateAndRefreshSession(sessionToken)

    if (!session) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      )
    }

    // Get user data
    const user = await getUserById(session.userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get active wallet
    const wallet = await getActiveWallet(user.id)

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          walletAddress: user.walletAddress,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          email: user.email,
          settings: user.settings,
          createdAt: user.createdAt,
          lastActiveAt: user.lastActiveAt,
        },
        wallet: wallet
          ? {
              id: wallet.id,
              address: wallet.address,
              walletType: wallet.walletType,
              balance: wallet.balance,
            }
          : null,
        session: {
          expiresAt: session.expiresAt,
          lastActiveAt: session.lastActiveAt,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Session validation error:", error)
    return NextResponse.json(
      { error: "Failed to validate session" },
      { status: 500 }
    )
  }
}
