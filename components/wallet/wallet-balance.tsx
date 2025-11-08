"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useTokenBalances } from "@/hooks/use-token-balances"
import { ExternalLink, RefreshCw, Wallet } from "lucide-react"
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react"

interface WalletBalanceProps {
  className?: string
  compact?: boolean
}

export interface WalletBalanceRef {
  refreshBalances: () => Promise<void>
}

/**
 * Component hiển thị SOL và USDC balance của wallet
 */
export const WalletBalance = forwardRef<WalletBalanceRef, WalletBalanceProps>(
  ({ className, compact = false }, ref) => {
    const { balances, loading, error, refetch, walletAddress } =
      useTokenBalances()

    // Store the latest refetch function in a ref to avoid infinite loops
    const refetchRef = useRef(refetch)
    useEffect(() => {
      refetchRef.current = refetch
    }, [refetch])

    // Expose refetch function via ref - stable reference
    useImperativeHandle(
      ref,
      () => ({
        refreshBalances: async () => {
          await refetchRef.current()
        },
      }),
      [] // No dependencies to prevent infinite loop
    )

    if (!walletAddress) {
      return (
        <Card className={className}>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center text-muted-foreground">
              <Wallet className="h-4 w-4 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No wallet connected</p>
            </div>
          </CardContent>
        </Card>
      )
    }

    if (compact) {
      return (
        <div className={`flex items-center gap-2 ${className}`}>
          <Badge variant="outline" className="font-mono text-xs">
            💰 {balances.sol.toFixed(4)} SOL
          </Badge>
          <Badge variant="outline" className="font-mono text-xs">
            💵 {balances.usdc.toFixed(2)} USDC
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={refetch}
            disabled={loading}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      )
    }

    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">
                Wallet Balance
              </CardTitle>
              <CardDescription className="text-xs font-mono">
                {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={refetch}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {error && (
            <div className="text-xs text-red-500 bg-red-50 dark:bg-red-950 p-2 rounded">
              {error}
            </div>
          )}

          {/* SOL Balance */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">S</span>
              </div>
              <div>
                <p className="text-sm font-medium">SOL</p>
                <p className="text-xs text-muted-foreground">Solana</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono text-sm font-semibold">
                {loading ? "..." : balances.sol.toFixed(4)}
              </p>
              <p className="text-xs text-muted-foreground">SOL</p>
            </div>
          </div>

          {/* USDC Balance */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">$</span>
              </div>
              <div>
                <p className="text-sm font-medium">USDC</p>
                <p className="text-xs text-muted-foreground">USD Coin</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono text-sm font-semibold">
                {loading ? "..." : balances.usdc.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">USDC</p>
            </div>
          </div>

          {/* Low balance warnings */}
          {!loading && (
            <div className="space-y-1">
              {balances.sol < 0.01 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-amber-600">⚠️ Low SOL balance</span>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={() =>
                      window.open("https://faucet.solana.com/", "_blank")
                    }
                  >
                    Get SOL <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              )}
              {balances.usdc < 0.01 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-amber-600">⚠️ Low USDC balance</span>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={() =>
                      window.open("https://faucet.circle.com/", "_blank")
                    }
                  >
                    Get USDC <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Network indicator */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Network</span>
              <Badge variant="secondary" className="text-xs">
                Solana Devnet
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }
)

WalletBalance.displayName = "WalletBalance"
