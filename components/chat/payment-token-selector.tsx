"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"

export type PaymentToken = "USDC" | "SOL"

interface PaymentTokenSelectorProps {
  selectedToken: PaymentToken
  onTokenChange: (token: PaymentToken) => void
}

export function PaymentTokenSelector({
  selectedToken,
  onTokenChange,
}: PaymentTokenSelectorProps) {
  const tokens: { value: PaymentToken; label: string; color: string }[] = [
    { value: "USDC", label: "USDC", color: "bg-blue-500" },
    { value: "SOL", label: "SOL", color: "bg-purple-500" },
  ]

  const currentToken = tokens.find((t) => t.value === selectedToken)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1 rounded-full px-3 text-xs"
        >
          <div className="flex items-center gap-1.5">
            <div className={`h-2 w-2 rounded-full ${currentToken?.color}`} />
            <span className="font-medium">Pay with {selectedToken}</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        {tokens.map((token) => (
          <DropdownMenuItem
            key={token.value}
            onClick={() => onTokenChange(token.value)}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${token.color}`} />
              <span className="font-medium">{token.label}</span>
              {token.value === selectedToken && (
                <Badge variant="secondary" className="ml-auto text-[10px]">
                  Selected
                </Badge>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
