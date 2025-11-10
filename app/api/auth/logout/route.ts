import { deleteSession } from "@/lib/db/services/session.service"
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

/**
 * POST /api/auth/logout
 *
 * Logout user by deleting their session
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

    // Delete the session
    await deleteSession(sessionToken)

    return NextResponse.json(
      {
        success: true,
        message: "Logged out successfully",
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 })
  }
}
