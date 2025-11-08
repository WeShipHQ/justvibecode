import { NextResponse } from "next/server"
import { freeMessageTracker } from "../chat/free-message-tracker"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const action = url.searchParams.get("action")
  const walletAddress = url.searchParams.get("wallet")

  switch (action) {
    case "config":
      // Get current configuration
      return NextResponse.json(freeMessageTracker.getConfig())

    case "all-usage":
      // Get all usage stats
      return NextResponse.json({
        usage: freeMessageTracker.getAllUsage(),
      })

    case "clear-cache":
      // Clear all cache (development only)
      freeMessageTracker.clearAllCache()
      return NextResponse.json({
        message: "Cache cleared successfully",
      })

    case "reset-wallet":
      // Reset specific wallet
      if (!walletAddress) {
        return NextResponse.json(
          { error: "Wallet address required for reset" },
          { status: 400 }
        )
      }
      freeMessageTracker.resetWallet(walletAddress)
      return NextResponse.json({
        message: `Wallet ${walletAddress} reset successfully`,
      })

    default:
      return NextResponse.json({
        availableActions: [
          "config - Get current configuration",
          "all-usage - Get all usage statistics",
          "clear-cache - Clear all cached data",
          "reset-wallet - Reset specific wallet (requires wallet param)",
        ],
      })
  }
}

export async function POST(req: Request) {
  const body = await req.json()
  const { action, walletAddress } = body

  if (action === "clear-cache") {
    freeMessageTracker.clearAllCache()
    return NextResponse.json({
      message: "Cache cleared successfully",
    })
  }

  if (action === "reset-wallet" && walletAddress) {
    freeMessageTracker.resetWallet(walletAddress)
    return NextResponse.json({
      message: `Wallet ${walletAddress} reset successfully`,
    })
  }

  return NextResponse.json(
    { error: "Invalid action or missing parameters" },
    { status: 400 }
  )
}
