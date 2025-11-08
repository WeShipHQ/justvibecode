"use client"

import { Button } from "@/components/ui/button"
import { useTokenBalances } from "@/hooks/use-token-balances"
import { formatNumber } from "@/lib/utils"
import { useState } from "react"
import { DepositDialog } from "./deposit-dialog"
import { WalletIcon } from "./ui/icons"

interface BalanceButtonProps {
  walletAddress: string
  className?: string
}

export function BalanceButton({
  walletAddress,
  className,
}: BalanceButtonProps) {
  const { balances, loading, error } = useTokenBalances()
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false)

  if (loading) {
    return (
      <Button variant="neutral" size="default" className={className} disabled>
        <WalletIcon className="w-4 h-4 mr-2" />
        Loading...
      </Button>
    )
  }

  if (error) {
    return (
      <Button variant="neutral" size="default" className={className} disabled>
        <WalletIcon className="w-4 h-4 mr-2" />
        Error
      </Button>
    )
  }

  return (
    <>
      <Button
        variant="neutral"
        size="default"
        className={className}
        onClick={() => setIsDepositDialogOpen(true)}
      >
        <WalletIcon className="w-4 h-4 mr-2" />
        {formatNumber(balances.sol)} SOL
      </Button>

      <DepositDialog
        isOpen={isDepositDialogOpen}
        onClose={() => setIsDepositDialogOpen(false)}
        walletAddress={walletAddress}
      />
    </>
  )
}
