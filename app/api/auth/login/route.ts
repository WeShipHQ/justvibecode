import { createSession } from "@/lib/db/services/session.service"
import { findOrCreateUser } from "@/lib/db/services/user.service"
import { findOrCreateWallet } from "@/lib/db/services/wallet.service"
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

/**
 * POST /api/auth/login
 *
 * Authenticate user with wallet address
 * Creates or retrieves user, wallet, and session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      walletAddress,
      walletType = "other",
      privyUserId,
      email,
      displayName,
      avatarUrl,
    } = body

    // Validate required fields
    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      )
    }

    // Normalize wallet address to lowercase
    const normalizedAddress = walletAddress.toLowerCase()

    // Find or create user
    const user = await findOrCreateUser({
      walletAddress: normalizedAddress,
      privyUserId,
      email,
      displayName,
      avatarUrl,
    })

    // Find or create wallet entry
    const wallet = await findOrCreateWallet({
      userId: user.id,
      address: normalizedAddress,
      walletType,
      isActive: true,
    })

    // Create session
    const userAgent = request.headers.get("user-agent") || undefined
    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      undefined

    const session = await createSession({
      userId: user.id,
      walletAddress: normalizedAddress,
      expiresInDays: 30,
      userAgent,
      ipAddress,
    })

    // Return user data and session token
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
        },
        wallet: {
          id: wallet.id,
          address: wallet.address,
          walletType: wallet.walletType,
          balance: wallet.balance,
        },
        sessionToken: session.sessionToken,
        expiresAt: session.expiresAt,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "Failed to authenticate user" },
      { status: 500 }
    )
  }
}
