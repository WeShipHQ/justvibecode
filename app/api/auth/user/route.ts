import { validateAndRefreshSession } from "@/lib/db/services/session.service"
import { getUserById, updateUser } from "@/lib/db/services/user.service"
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

/**
 * GET /api/auth/user
 *
 * Get current user data
 */
export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.headers
      .get("authorization")
      ?.replace("Bearer ", "")

    if (!sessionToken) {
      return NextResponse.json(
        { error: "No session token provided" },
        { status: 401 }
      )
    }

    const session = await validateAndRefreshSession(sessionToken)
    if (!session) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      )
    }

    const user = await getUserById(session.userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

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
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Get user error:", error)
    return NextResponse.json({ error: "Failed to get user" }, { status: 500 })
  }
}

/**
 * PATCH /api/auth/user
 *
 * Update user profile
 */
export async function PATCH(request: NextRequest) {
  try {
    const sessionToken = request.headers
      .get("authorization")
      ?.replace("Bearer ", "")

    if (!sessionToken) {
      return NextResponse.json(
        { error: "No session token provided" },
        { status: 401 }
      )
    }

    const session = await validateAndRefreshSession(sessionToken)
    if (!session) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { displayName, avatarUrl, email, settings } = body

    const updatedUser = await updateUser(session.userId, {
      displayName,
      avatarUrl,
      email,
      settings,
    })

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: updatedUser.id,
          walletAddress: updatedUser.walletAddress,
          displayName: updatedUser.displayName,
          avatarUrl: updatedUser.avatarUrl,
          email: updatedUser.email,
          settings: updatedUser.settings,
          lastActiveAt: updatedUser.lastActiveAt,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Update user error:", error)
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    )
  }
}
