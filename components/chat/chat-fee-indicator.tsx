"use client"

import { getChatFeeInfo, type PaymentToken } from "@/app/api/chat/x402-config"
import { Badge } from "@/components/ui/badge"
import { InfoIcon } from "lucide-react"

interface ChatFeeIndicatorProps {
  token?: PaymentToken
}

/**
 * Component hiển thị thông tin phí chat cho người dùng
 */
export function ChatFeeIndicator({ token = "USDC" }: ChatFeeIndicatorProps) {
  const feeInfo = getChatFeeInfo(token)

  return (
    <Badge
      variant="outline"
      className="font-mono text-xs flex items-center gap-1"
      title={`Each message costs ${feeInfo.amount} ${feeInfo.token} on ${feeInfo.network}`}
    >
      <InfoIcon className="w-3 h-3" />
      {feeInfo.amount} {feeInfo.token}/msg
    </Badge>
  )
}
