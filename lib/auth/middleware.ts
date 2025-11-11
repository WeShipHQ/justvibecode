import type { User } from "@/lib/db/schema"
import { validateAndRefreshSession } from "@/lib/db/services/session.service"
import { getUserById } from "@/lib/db/services/user.service"
import { NextRequest, NextResponse } from "next/server"

/**
 * Authentication middleware for API routes
 */

export interface AuthenticatedRequest extends NextRequest {
  user?: User
  sessionToken?: string
}

/**
 * Extract session token from request
 */
export function extractSessionToken(request: NextRequest): string | null {
  // Check Authorization header
  const authHeader = request.headers.get("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7)
  }

  // Check cookie
  const cookies = request.cookies
  const sessionCookie = cookies.get("session_token")
  if (sessionCookie) {
    return sessionCookie.value
  }

  return null
}

/**
 * Require authentication middleware
 * Returns 401 if user is not authenticated
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ user: User; sessionToken: string } | NextResponse> {
  const sessionToken = extractSessionToken(request)

  if (!sessionToken) {
    return NextResponse.json(
      { error: "Authentication required" },
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

  return { user, sessionToken }
}

/**
 * Optional authentication middleware
 * Returns user if authenticated, undefined otherwise
 */
export async function optionalAuth(
  request: NextRequest
): Promise<{ user?: User; sessionToken?: string }> {
  const sessionToken = extractSessionToken(request)

  if (!sessionToken) {
    return {}
  }

  try {
    const session = await validateAndRefreshSession(sessionToken)

    if (!session) {
      return {}
    }

    const user = await getUserById(session.userId)

    if (!user) {
      return {}
    }

    return { user, sessionToken }
  } catch (error) {
    console.error("Optional auth error:", error)
    return {}
  }
}

/**
 * Wallet ownership verification
 * Ensures the authenticated user owns the specified wallet
 */
export async function verifyWalletOwnership(
  user: User,
  walletAddress: string
): Promise<boolean> {
  // Normalize addresses for comparison
  const normalizedUserWallet = user.walletAddress.toLowerCase()
  const normalizedProvidedWallet = walletAddress.toLowerCase()

  return normalizedUserWallet === normalizedProvidedWallet
}

/**
 * Create authenticated response with session cookie
 */
export function createAuthenticatedResponse(
  data: any,
  sessionToken: string,
  options?: { status?: number }
) {
  const response = NextResponse.json(data, { status: options?.status || 200 })

  // Set session cookie
  response.cookies.set("session_token", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: "/",
  })

  return response
}

/**
 * Clear authentication cookies
 */
export function clearAuthCookies(response: NextResponse) {
  response.cookies.delete("session_token")
  return response
}
