"use client"

import { ConnectWalletButton } from "@/components/connect-wallet-button"
import { JustVibeCode } from "@/components/icons/just-vibe-code"
import { cn } from "@/lib/utils"

interface Props {
  className?: string
}

export function Header({ className }: Props) {
  return (
    <header className={cn("flex items-center justify-between", className)}>
      <div className="flex items-center">
        <JustVibeCode className="ml-1 md:ml-2.5 mr-1.5" />
        <span className="hidden md:inline text-sm uppercase font-mono font-bold tracking-tight">
          JustVibeCode
        </span>
      </div>
      <div className="flex items-center ml-auto space-x-1.5 md:space-x-2">
        <ConnectWalletButton />
        {/* <ToggleWelcome /> */}
      </div>
    </header>
  )
}
