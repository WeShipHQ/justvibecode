"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import envConfig from "@/configs/env"
import { useWallet } from "@/hooks/use-wallet"
import { useConnectedStandardWallets } from "@privy-io/react-auth/solana"
import {
  createAssociatedTokenAccountInstruction,
  createSyncNativeInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token"
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js"
import { ExternalLinkIcon, Wallet, Zap } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

/**
 * Component để setup Wrapped SOL account cho payments
 */
export function SetupWrapperSOL() {
  const { wallet } = useWallet()
  const { wallets: connectedWallets } = useConnectedStandardWallets()
  const [isCreating, setIsCreating] = useState(false)

  const walletToUse = connectedWallets?.[0] || wallet
  const walletAddress = walletToUse?.address

  const createWrapperSOLAccount = async () => {
    if (!walletAddress || !walletToUse) {
      toast.error("Please connect your wallet first")
      return
    }

    setIsCreating(true)
    try {
      const connection = new Connection(envConfig.NEXT_PUBLIC_DEVNET_RPC_URL)
      const userPubkey = new PublicKey(walletAddress)
      const wsolMint = new PublicKey(
        "So11111111111111111111111111111111111111112"
      )

      // Get wSOL ATA address
      const wsolAta = await getAssociatedTokenAddress(
        wsolMint,
        userPubkey,
        false,
        TOKEN_PROGRAM_ID
      )

      // Check if ATA already exists
      const ataInfo = await connection.getAccountInfo(wsolAta)
      if (ataInfo) {
        toast.success("Wrapped SOL account already exists!")
        return
      }

      // Create transaction
      const transaction = new Transaction()

      // Add create ATA instruction
      transaction.add(
        createAssociatedTokenAccountInstruction(
          userPubkey, // payer
          wsolAta, // ata
          userPubkey, // owner
          wsolMint, // mint
          TOKEN_PROGRAM_ID
        )
      )

      // Add minimal SOL transfer to ATA (for rent + small amount)
      const rentExempt = await connection.getMinimumBalanceForRentExemption(165)
      const amount = rentExempt + 100000 // rent + 0.0001 SOL

      transaction.add(
        SystemProgram.transfer({
          fromPubkey: userPubkey,
          toPubkey: wsolAta,
          lamports: amount,
        })
      )

      // Add sync native instruction
      transaction.add(createSyncNativeInstruction(wsolAta, TOKEN_PROGRAM_ID))

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = userPubkey

      // Sign and send transaction
      let signature
      if (typeof walletToUse.signTransaction === "function") {
        // For Privy wallets, need to serialize first
        const serialized = transaction.serialize({
          requireAllSignatures: false,
        })
        const signed = await walletToUse.signTransaction({
          transaction: serialized,
        })
        signature = await connection.sendRawTransaction(
          signed.signedTransaction
        )
      } else {
        throw new Error("Wallet does not support transaction signing")
      }
      await connection.confirmTransaction(signature)

      toast.success("Wrapped SOL account created successfully!", {
        description: `Transaction: ${signature.slice(0, 8)}...`,
        action: {
          label: "View",
          onClick: () =>
            window.open(
              `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
              "_blank"
            ),
        },
      })
    } catch (error: any) {
      console.error("Error creating wSOL account:", error)
      toast.error(`Failed to create wSOL account: ${error.message}`)
    } finally {
      setIsCreating(false)
    }
  }

  if (!walletAddress) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Wallet className="h-4 w-4 mr-2" />
        Connect Wallet First
      </Button>
    )
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Zap className="h-4 w-4 mr-2" />
          Setup SOL Payments
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Setup Wrapped SOL for Payments</DialogTitle>
          <DialogDescription>
            Create a Wrapped SOL account to enable SOL payments. This is a
            one-time setup.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">What this does:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Creates a Wrapped SOL token account</li>
              <li>• Converts ~0.002 SOL to Wrapped SOL</li>
              <li>• Enables SOL payments in the app</li>
              <li>• One-time setup only</li>
            </ul>
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg">
            <h4 className="font-semibold text-sm mb-2 text-amber-800 dark:text-amber-200">
              Cost Breakdown:
            </h4>
            <ul className="text-sm space-y-1 text-amber-700 dark:text-amber-300">
              <li>• Account creation: ~0.002 SOL</li>
              <li>• Transaction fee: ~0.00001 SOL</li>
              <li>• Total: ~0.00201 SOL</li>
            </ul>
          </div>

          <Button
            onClick={createWrapperSOLAccount}
            disabled={isCreating}
            className="w-full"
          >
            {isCreating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Creating Account...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Create Wrapped SOL Account
              </>
            )}
          </Button>

          <div className="text-center">
            <Button
              variant="link"
              size="sm"
              onClick={() =>
                window.open(
                  "https://spl.solana.com/token#wrapping-sol",
                  "_blank"
                )
              }
            >
              Learn about Wrapped SOL{" "}
              <ExternalLinkIcon className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
