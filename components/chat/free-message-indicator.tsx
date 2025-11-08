"use client"

import { Badge } from "@/components/ui/badge"
import { Gift } from "lucide-react"

interface FreeMessageIndicatorProps {
  hasFreeMessage: boolean
  walletAddress?: string
}

export function FreeMessageIndicator({
  hasFreeMessage,
  walletAddress,
}: FreeMessageIndicatorProps) {
  if (!walletAddress) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      {hasFreeMessage ? (
        <Badge
          variant="secondary"
          className="bg-green-100 text-green-800 border-green-300"
        >
          <Gift className="w-3 h-3 mr-1" />
          First message FREE!
        </Badge>
      ) : (
        <></>
      )}
    </div>
  )
}
