/**
 * Simple in-memory store để track free message usage per wallet
 * Trong production nên dùng database hoặc Redis
 */

// 🔧 CONFIGURATION: Easily change free message limit
const FREE_MESSAGE_LIMIT = parseInt(process.env.FREE_MESSAGE_LIMIT || "1")

interface WalletUsage {
  walletAddress: string
  messageCount: number
  firstMessageAt: Date
}

class FreeMessageTracker {
  private usageMap = new Map<string, WalletUsage>()

  /**
   * Check xem wallet có được free message không
   */
  isEligibleForFreeMessage(walletAddress: string): boolean {
    const usage = this.usageMap.get(walletAddress)

    console.log(`🔍 Checking eligibility for wallet: ${walletAddress}`)
    console.log(`📊 Current usage:`, usage)
    console.log(`⚙️ Free message limit: ${FREE_MESSAGE_LIMIT}`)

    // Nếu chưa có record hoặc messageCount < limit → eligible for free
    if (!usage || usage.messageCount < FREE_MESSAGE_LIMIT) {
      console.log(`✅ Eligible for free message`)
      return true
    }

    console.log(`❌ Not eligible - already used ${usage.messageCount} messages`)
    return false
  }

  /**
   * Mark wallet đã sử dụng 1 message
   */
  recordMessageUsage(walletAddress: string): void {
    const existing = this.usageMap.get(walletAddress)

    if (existing) {
      existing.messageCount += 1
      console.log(
        `📈 Updated usage for ${walletAddress}: ${existing.messageCount} messages`
      )
    } else {
      this.usageMap.set(walletAddress, {
        walletAddress,
        messageCount: 1,
        firstMessageAt: new Date(),
      })
      console.log(`🆕 New wallet tracked: ${walletAddress} - first message`)
    }
  }

  /**
   * Get usage stats for wallet
   */
  getUsageStats(walletAddress: string): WalletUsage | null {
    return this.usageMap.get(walletAddress) || null
  }

  /**
   * Reset usage for wallet (for testing)
   */
  resetWallet(walletAddress: string): void {
    this.usageMap.delete(walletAddress)
  }

  /**
   * Get all usage stats (for admin/debugging)
   */
  getAllUsage(): WalletUsage[] {
    return Array.from(this.usageMap.values())
  }

  /**
   * Clear all cached data (for development/testing)
   */
  clearAllCache(): void {
    const count = this.usageMap.size
    this.usageMap.clear()
    console.log(`🗑️ Cleared ${count} wallet records from cache`)
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return {
      freeMessageLimit: FREE_MESSAGE_LIMIT,
      totalWalletsTracked: this.usageMap.size,
      totalMessagesProcessed: Array.from(this.usageMap.values()).reduce(
        (sum, usage) => sum + usage.messageCount,
        0
      ),
    }
  }
}

// Global singleton instance
export const freeMessageTracker = new FreeMessageTracker()

/**
 * Helper function để extract wallet address từ request headers
 * x402 payment header contains wallet info
 */
export function extractWalletFromRequest(req: Request): string | null {
  // Từ URL params nếu có
  const url = new URL(req.url)
  const walletParam = url.searchParams.get("wallet")
  if (walletParam) return walletParam

  // Từ headers nếu có
  const walletHeader = req.headers.get("X-Wallet-Address")
  if (walletHeader) return walletHeader

  // Từ body nếu có
  // Note: Cần parse body trước khi gọi function này

  return null
}
