"use client"

import {
  getUsageStats,
  isEligibleForFreeMessage,
} from "@/lib/free-message-storage"
import { useCallback, useEffect, useState } from "react"

interface FreeMessageStatus {
  walletAddress: string
  isEligibleForFreeMessage: boolean
  usageStats: {
    messageCount: number
    firstMessageAt: string
  } | null
}

export function useFreeMessageStatus(walletAddress?: string) {
  const [status, setStatus] = useState<FreeMessageStatus | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchStatus = useCallback(() => {
    console.log(
      "🔍 Checking free message status (localStorage) for wallet:",
      walletAddress
    )

    if (!walletAddress) {
      console.log("❌ No wallet address provided")
      setStatus(null)
      return
    }

    setLoading(true)

    try {
      const isEligible = isEligibleForFreeMessage(walletAddress)
      const usageStats = getUsageStats(walletAddress)

      const statusData: FreeMessageStatus = {
        walletAddress,
        isEligibleForFreeMessage: isEligible,
        usageStats,
      }

      console.log("✅ localStorage status:", statusData)
      setStatus(statusData)
    } catch (err: any) {
      console.error("Failed to check free message status:", err)
    } finally {
      setLoading(false)
    }
  }, [walletAddress])

  useEffect(() => {
    if (walletAddress) {
      fetchStatus()
    } else {
      setStatus(null)
    }
  }, [walletAddress, fetchStatus])

  return {
    status,
    loading,
    error: null, // No more API errors
    refetch: fetchStatus,
    hasFreeMessage: status?.isEligibleForFreeMessage ?? false,
    messageCount: status?.usageStats?.messageCount ?? 0,
  }
}
