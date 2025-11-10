"use client"

import { Button } from "@/components/ui/button"
import {
  AlertCircle,
  CheckCircle2,
  Coins,
  Loader2,
  XCircle,
} from "lucide-react"
import type { PaymentToken } from "./payment-token-selector"

interface PaymentConfirmationMessageProps {
  paymentToken: PaymentToken
  onConfirm: () => void
  onCancel: () => void
  status: "pending" | "processing" | "success" | "error"
  errorMessage?: string
}

const TOKEN_AMOUNTS = {
  USDC: "0.01",
  SOL: "0.0001",
}

export function PaymentConfirmationMessage({
  paymentToken,
  onConfirm,
  onCancel,
  status,
  errorMessage,
}: PaymentConfirmationMessageProps) {
  const amount = TOKEN_AMOUNTS[paymentToken]

  return (
    <div className="flex items-start gap-3 p-4 mb-4 border rounded-lg bg-muted/50 border-border">
      {/* Icon based on status */}
      <div className="flex-shrink-0 mt-0.5">
        {status === "pending" && (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100">
            <Coins className="w-4 h-4 text-blue-600" />
          </div>
        )}
        {status === "processing" && (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100">
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
          </div>
        )}
        {status === "success" && (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
        )}
        {status === "error" && (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100">
            <XCircle className="w-4 h-4 text-red-600" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Status-based title */}
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-sm">
            {status === "pending" && "Payment Required"}
            {status === "processing" && "Processing Payment..."}
            {status === "success" && "Payment Successful!"}
            {status === "error" && "Payment Failed"}
          </h4>
        </div>

        {/* Status-based message */}
        <p className="text-sm text-muted-foreground mb-3">
          {status === "pending" &&
            `This message requires ${amount} ${paymentToken}. Click "Pay & Send" to continue.`}
          {status === "processing" &&
            "Please confirm the transaction in your wallet..."}
          {status === "success" && "Your message is being processed!"}
          {status === "error" &&
            (errorMessage || "Transaction failed. Please try again.")}
        </p>

        {/* Payment details for pending status */}
        {status === "pending" && (
          <div className="flex items-center gap-4 mb-3 p-2 bg-background rounded text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-mono font-semibold">
                {amount} {paymentToken}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Network:</span>
              <span className="font-medium">Solana Devnet</span>
            </div>
          </div>
        )}

        {/* Info banner for pending */}
        {status === "pending" && (
          <div className="flex items-start gap-2 p-2 mb-3 bg-amber-50 border border-amber-200 rounded">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-800">
              You'll sign a transaction with your wallet to complete this
              payment.
            </p>
          </div>
        )}

        {/* Action buttons for pending status */}
        {status === "pending" && (
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={onConfirm}
              className="min-w-[100px]"
            >
              Pay & Send
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
          </div>
        )}

        {/* Retry button for error status */}
        {status === "error" && (
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={onConfirm}
              className="min-w-[100px]"
            >
              Try Again
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
