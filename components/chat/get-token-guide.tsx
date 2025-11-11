"use client"

import type { PaymentToken } from "@/app/api/chat/x402-config"
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

interface GetTokenGuideProps {
  token?: PaymentToken
}

const TOKEN_INFO = {
  USDC: {
    name: "USDC",
    address: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    faucetUrl: "https://faucet.circle.com/",
    faucetName: "Circle USDC Faucet",
    amount: "0.01 USDC",
    instructions: [
      "Click 'Solana Devnet Faucet' to get SOL for fees",
      "Click 'Circle USDC Faucet' to get USDC tokens",
      "Wait ~30 seconds for tokens to arrive",
      "Refresh your wallet to see the balance",
      "Try sending a message!",
    ],
  },
  SOL: {
    name: "SOL",
    address: "So11111111111111111111111111111111111111112", // Wrapped SOL
    faucetUrl: "https://faucet.solana.com/",
    faucetName: "Solana Devnet Faucet",
    amount: "0.0001 SOL",
    instructions: [
      "Click 'Solana Devnet Faucet' below",
      "Paste your wallet address",
      "Click 'Confirm Airdrop' to get test SOL",
      "Wait ~30 seconds for tokens to arrive",
      "SOL will auto-convert to Wrapped SOL for payment",
      "Try sending a message!",
    ],
  },
}

/**
 * Component hướng dẫn lấy token test (USDC hoặc SOL)
 */
export function GetTokenGuide({ token = "USDC" }: GetTokenGuideProps) {
  const info = TOKEN_INFO[token]

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Badge
          variant="outline"
          className="cursor-pointer hover:bg-secondary font-mono text-xs flex items-center gap-1"
        >
          <InfoIcon className="w-3 h-3" />
          Need {token}?
        </Badge>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Get {info.name} Devnet Test Tokens</DialogTitle>
          <DialogDescription>
            You need {info.name} Devnet tokens to send messages ({info.amount}{" "}
            per message)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step 1: SOL for fees (only show for USDC) */}
          {token === "USDC" && (
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
          )}

          {/* Step 2: Token faucet */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">
                {token === "USDC" ? "2" : "1"}
              </span>
              Get {info.name} Devnet
            </h4>
            <p className="text-sm text-muted-foreground ml-8">
              {token === "USDC"
                ? "Then get USDC test tokens from Circle faucet"
                : "Get test SOL from Solana faucet"}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="ml-8 w-full"
              onClick={() => window.open(info.faucetUrl, "_blank")}
            >
              <ExternalLinkIcon className="w-4 h-4 mr-2" />
              {info.faucetName}
            </Button>
          </div>

          {/* Token Info */}
          <div className="p-3 bg-muted rounded-lg space-y-1">
            <p className="text-xs font-semibold">
              {info.name} Devnet Token Address:
            </p>
            <code className="text-xs font-mono break-all">{info.address}</code>
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">How to use:</h4>
            <ol className="text-sm text-muted-foreground space-y-1 ml-5 list-decimal">
              {info.instructions.map((instruction, idx) => (
                <li key={idx}>{instruction}</li>
              ))}
            </ol>
          </div>

          {/* Important Note */}
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-xs font-semibold text-yellow-600 dark:text-yellow-500">
              ⚠️ Important
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Make sure your wallet is set to <strong>Devnet</strong>, not
              Mainnet. Check wallet settings/network selector.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
