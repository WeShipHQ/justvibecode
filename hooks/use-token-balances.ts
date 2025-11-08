"use client"

import envConfig from "@/configs/env"
import { useWallet } from "@/hooks/use-wallet"
import { useConnectedStandardWallets } from "@privy-io/react-auth/solana"
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js"
import { useCallback, useEffect, useState } from "react"

interface TokenBalance {
  sol: number
  usdc: number
}

/**
 * Hook để fetch SOL và USDC balance của user wallet
 */
export function useTokenBalances() {
  const { wallet, ready } = useWallet()
  const { wallets: connectedWallets } = useConnectedStandardWallets()
  const [balances, setBalances] = useState<TokenBalance>({ sol: 0, usdc: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get wallet address
  const walletAddress = wallet?.address || connectedWallets?.[0]?.address

  const fetchBalances = useCallback(async () => {
    if (!ready || !walletAddress) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const connection = new Connection(envConfig.NEXT_PUBLIC_DEVNET_RPC_URL)
      const publicKey = new PublicKey(walletAddress)

      // Fetch SOL balance
      const solBalance = await connection.getBalance(publicKey)
      const solAmount = solBalance / LAMPORTS_PER_SOL

      // Fetch USDC balance
      const usdcMint = new PublicKey(
        "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
      ) // USDC Devnet
      const usdcAta = await getAssociatedTokenAddress(
        usdcMint,
        publicKey,
        false,
        TOKEN_PROGRAM_ID
      )

      let usdcAmount = 0
      try {
        const usdcAccount = await connection.getTokenAccountBalance(usdcAta)
        if (usdcAccount.value) {
          usdcAmount = parseFloat(usdcAccount.value.uiAmount?.toString() || "0")
        }
      } catch (error) {
        // ATA doesn't exist, balance is 0
        console.log("USDC ATA not found, balance = 0")
      }

      setBalances({
        sol: solAmount,
        usdc: usdcAmount,
      })
    } catch (err: any) {
      console.error("Error fetching balances:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [ready, walletAddress])

  // Fetch balances on mount and when wallet changes
  useEffect(() => {
    if (ready && walletAddress) {
      fetchBalances()
    }
  }, [ready, walletAddress]) // Remove fetchBalances from dependencies to prevent infinite loop

  return {
    balances,
    loading,
    error,
    refetch: fetchBalances,
    walletAddress,
  }
}
