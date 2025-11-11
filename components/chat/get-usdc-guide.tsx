"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ExternalLinkIcon, InfoIcon } from "lucide-react"

/**
 * Component hướng dẫn lấy USDC Devnet test tokens
 */
export function GetUSDCGuide() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Badge
          variant="outline"
          className="cursor-pointer hover:bg-secondary font-mono text-xs flex items-center gap-1"
        >
          <InfoIcon className="w-3 h-3" />
          Need USDC?
        </Badge>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Get USDC Devnet Test Tokens</DialogTitle>
          <DialogDescription>
            You need USDC Devnet tokens to send messages (0.01 USDC per message)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step 1 */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">
                1
              </span>
              Get Devnet SOL (for fees)
            </h4>
            <p className="text-sm text-muted-foreground ml-8">
              First, you need some SOL for transaction fees
            </p>
            <Button
              variant="outline"
              size="sm"
              className="ml-8 w-full"
              onClick={() =>
                window.open("https://faucet.solana.com/", "_blank")
              }
            >
              <ExternalLinkIcon className="w-4 h-4 mr-2" />
              Solana Devnet Faucet
            </Button>
          </div>

          {/* Step 2 */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">
                2
              </span>
              Get USDC Devnet
            </h4>
            <p className="text-sm text-muted-foreground ml-8">
              Then get USDC test tokens from Circle faucet
            </p>
            <Button
              variant="outline"
              size="sm"
              className="ml-8 w-full"
              onClick={() =>
                window.open("https://faucet.circle.com/", "_blank")
              }
            >
              <ExternalLinkIcon className="w-4 h-4 mr-2" />
              Circle USDC Faucet
            </Button>
          </div>

          {/* Token Info */}
          <div className="p-3 bg-muted rounded-lg space-y-1">
            <p className="text-xs font-semibold">USDC Devnet Token Address:</p>
            <code className="text-xs font-mono break-all">
              4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
            </code>
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">How to use:</h4>
            <ol className="text-sm text-muted-foreground space-y-1 ml-5 list-decimal">
              <li>Click "Solana Devnet Faucet" above</li>
              <li>Paste your wallet address and get SOL</li>
              <li>Click "Circle USDC Faucet" above</li>
              <li>Connect wallet and request USDC</li>
              <li>Wait a few seconds for tokens to arrive</li>
              <li>Come back and try sending a message!</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
