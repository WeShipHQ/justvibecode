import { requireAuth } from "@/lib/auth/middleware"
import {
  getUserPayments,
  getUserPaymentStats,
} from "@/lib/db/services/payment.service"
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

/**
 * GET /api/payments/history
 *
 * Get payment history for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const { user } = auth

    //Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    // Get payments and stats
    const [payments, stats] = await Promise.all([
      getUserPayments(user.id, limit, offset),
      getUserPaymentStats(user.id),
    ])

    return NextResponse.json(
      {
        success: true,
        payments,
        stats,
        pagination: {
          limit,
          offset,
          total: stats.totalPayments,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Get payment history error:", error)
    return NextResponse.json(
      { error: "Failed to get payment history" },
      { status: 500 }
    )
  }
}
