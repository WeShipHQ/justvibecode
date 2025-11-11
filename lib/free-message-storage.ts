/**
 * Client-side localStorage-based free message tracking
 * Replaces server-side in-memory tracking
 */

const STORAGE_KEY = "vibe_free_messages"
const FREE_MESSAGE_LIMIT = 1 // Each wallet gets 1 free message

interface WalletUsage {
  messageCount: number
  firstMessageAt: string
}

interface FreeMessageStorage {
  [walletAddress: string]: WalletUsage
}

/**
 * Check if wallet is eligible for free message
 */
export function isEligibleForFreeMessage(walletAddress: string): boolean {
  if (typeof window === "undefined") return false

  try {
    const storage = getStorage()
    const usage = storage[walletAddress]

    if (!usage) {
      return true // New wallet - eligible
    }

    return usage.messageCount < FREE_MESSAGE_LIMIT
  } catch (error) {
    console.error("Error checking free message eligibility:", error)
    return false
  }
}

/**
 * Record message usage for wallet
 */
export function recordMessageUsage(walletAddress: string): void {
  if (typeof window === "undefined") return

  try {
    const storage = getStorage()
    const existing = storage[walletAddress]

    if (!existing) {
      // First message
      storage[walletAddress] = {
        messageCount: 1,
        firstMessageAt: new Date().toISOString(),
      }
    } else {
      // Increment count
      storage[walletAddress].messageCount += 1
    }

    saveStorage(storage)
  } catch (error) {
    console.error("Error recording message usage:", error)
  }
}

/**
 * Get usage stats for wallet
 */
export function getUsageStats(walletAddress: string): WalletUsage | null {
  if (typeof window === "undefined") return null

  try {
    const storage = getStorage()
    return storage[walletAddress] || null
  } catch (error) {
    console.error("Error getting usage stats:", error)
    return null
  }
}

/**
 * Clear all tracking data (for testing/dev)
 */
export function clearAllTracking(): void {
  if (typeof window === "undefined") return

  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error("Error clearing tracking:", error)
  }
}

/**
 * Get all tracked wallets (for debugging)
 */
export function getAllTracking(): FreeMessageStorage {
  if (typeof window === "undefined") return {}

  return getStorage()
}

// Internal helpers
function getStorage(): FreeMessageStorage {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : {}
  } catch (error) {
    console.error("Error reading localStorage:", error)
    return {}
  }
}

function saveStorage(storage: FreeMessageStorage): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage))
  } catch (error) {
    console.error("Error saving to localStorage:", error)
  }
}
