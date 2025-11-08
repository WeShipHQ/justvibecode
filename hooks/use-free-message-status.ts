"use client"

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
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = useCallback(async () => {
    console.log("🔍 Fetching free message status for wallet:", walletAddress)

    if (!walletAddress) {
      console.log("❌ No wallet address provided")
      setStatus(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const url = `/api/free-message-status?wallet=${walletAddress}`
      console.log("📡 Calling API:", url)

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log("✅ API response:", data)
      setStatus(data)
    } catch (err: any) {
      console.error("Failed to fetch free message status:", err)
      setError(err.message)
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
  }, [walletAddress]) // Remove fetchStatus from dependencies to prevent infinite loop

  return {
    status,
    loading,
    error,
    refetch: fetchStatus,
    hasFreeMessage: status?.isEligibleForFreeMessage ?? false,
    messageCount: status?.usageStats?.messageCount ?? 0,
  }
}
