import { NextResponse } from "next/server"
import { freeMessageTracker } from "../chat/free-message-tracker"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const walletAddress = url.searchParams.get("wallet")

  if (!walletAddress) {
    return NextResponse.json(
      { error: "Wallet address required" },
      { status: 400 }
    )
  }

  const isEligible = freeMessageTracker.isEligibleForFreeMessage(walletAddress)
  const usageStats = freeMessageTracker.getUsageStats(walletAddress)

  return NextResponse.json({
    walletAddress,
    isEligibleForFreeMessage: isEligible,
    usageStats,
  })
}
