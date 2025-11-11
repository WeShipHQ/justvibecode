"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertCircle, Coins } from "lucide-react"
import type { PaymentToken } from "./payment-token-selector"

interface PaymentConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  onCancel: () => void
  paymentToken: PaymentToken
  isProcessing?: boolean
}

const TOKEN_AMOUNTS = {
  USDC: "0.01",
  SOL: "0.0001",
}

export function PaymentConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  paymentToken,
  isProcessing = false,
}: PaymentConfirmationDialogProps) {
  const amount = TOKEN_AMOUNTS[paymentToken]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-blue-100">
            <Coins className="w-6 h-6 text-blue-600" />
          </div>
          <DialogTitle className="text-center">Confirm Payment</DialogTitle>
          <DialogDescription className="text-center">
            This message requires a payment to process
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Amount:</span>
              <span className="font-mono font-semibold">
                {amount} {paymentToken}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Network:</span>
              <span className="text-sm font-medium">Solana Devnet</span>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-800">
              You'll be asked to sign a transaction with your wallet to complete
              this payment.
            </p>
          </div>
        </div>

        <DialogFooter className="sm:justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className="min-w-[120px]"
          >
            {isProcessing ? (
              <>
                <span className="animate-pulse">Processing...</span>
              </>
            ) : (
              <>Pay & Send</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
