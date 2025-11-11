"use client"

import { createX402Client } from "@/components/x402"
import envConfig from "@/configs/env"
import { useWallet } from "@/hooks/use-wallet"
import { useConnectedStandardWallets } from "@privy-io/react-auth/solana"
import { VersionedTransaction } from "@solana/web3.js"
import { useMemo } from "react"

/**
 * Custom hook để tạo x402-enabled fetch client cho chat
 *
 * Hook này wrap wallet của user với x402 payment interceptor,
 * tự động xử lý 402 responses và sign/send payment transactions
 */
export function useX402Client() {
  const { wallet, authenticated, ready } = useWallet()
  const { wallets: connectedWallets } = useConnectedStandardWallets()

  const x402Client = useMemo(() => {
    // Wait for Privy to be ready
    if (!ready) {
      console.log("⏳ Privy is loading...")
      return null
    }

    // Check if we have any wallet (embedded or connected)
    const hasWallet = wallet || connectedWallets?.length > 0

    if (!hasWallet) {
      console.log("❌ No wallet available")
      console.log("authenticated:", authenticated)
      console.log("wallet:", wallet)
      console.log("connectedWallets:", connectedWallets)
      return null
    }

    // Try to get connected standard wallet (Phantom, Solflare, etc.)
    const standardWallet = connectedWallets?.[0]

    // Prefer connected standard wallet if available
    if (
      standardWallet &&
      typeof standardWallet.signTransaction === "function"
    ) {
      console.log("✅ Using connected standard wallet")
      console.log("Wallet address:", standardWallet.address)

      const walletAdapter = {
        publicKey: {
          toString: () => standardWallet.address,
        },
        address: standardWallet.address,
        signTransaction: async (tx: VersionedTransaction) => {
          try {
            // Privy standard wallets expect serialized transaction
            const serialized = tx.serialize()
            const result = await standardWallet.signTransaction({
              transaction: serialized,
            })
            // Reconstruct VersionedTransaction from signed bytes
            return VersionedTransaction.deserialize(result.signedTransaction)
          } catch (error) {
            console.error("Error signing transaction:", error)
            throw error
          }
        },
      }

      return createX402Client({
        wallet: walletAdapter,
        network: "solana-devnet",
        rpcUrl: envConfig.NEXT_PUBLIC_DEVNET_RPC_URL,
        maxPaymentAmount: BigInt(100_000), // Max 0.1 USDC
      })
    }

    // Fallback: Use Privy embedded wallet
    if (wallet && wallet.address) {
      console.log("✅ Using Privy embedded wallet")
      console.log("Wallet address:", wallet.address)
      console.log("Wallet keys:", Object.keys(wallet))

      // Check if wallet has sendTransaction or signTransaction
      const hasSignMethod =
        typeof (wallet as any).signTransaction === "function" ||
        typeof (wallet as any).sendTransaction === "function"

      if (!hasSignMethod) {
        console.error("❌ Wallet does not support transaction signing")
        console.error("Available wallet methods:", Object.keys(wallet))
        return null
      }

      // Privy embedded wallet adapter
      const walletAdapter = {
        publicKey: {
          toString: () => wallet.address,
        },
        address: wallet.address,
        signTransaction: async (tx: VersionedTransaction) => {
          try {
            const walletAny = wallet as any

            // Try signTransaction if available
            if (typeof walletAny.signTransaction === "function") {
              console.log("📝 Signing with signTransaction method")
              const result = await walletAny.signTransaction(tx)
              return result
            }

            // Try with serialized transaction
            if (typeof walletAny.signTransaction === "function") {
              console.log("📝 Signing with serialized transaction")
              const serialized = tx.serialize()
              const signed = await walletAny.signTransaction(serialized)

              if (signed instanceof Uint8Array) {
                return VersionedTransaction.deserialize(signed)
              }
              return signed
            }

            throw new Error("No signing method available on wallet")
          } catch (error) {
            console.error(
              "Error signing transaction with embedded wallet:",
              error
            )
            throw error
          }
        },
      }

      return createX402Client({
        wallet: walletAdapter,
        network: "solana-devnet",
        rpcUrl: envConfig.NEXT_PUBLIC_DEVNET_RPC_URL,
        maxPaymentAmount: BigInt(100_000),
      })
    }

    // No compatible wallet found
    console.warn("⚠️ No compatible wallet found for x402 payments")
    console.warn(
      "Please connect a standard Solana wallet (Phantom, Solflare, etc.)"
    )
    return null
  }, [wallet, authenticated, connectedWallets, ready])

  return x402Client
}
