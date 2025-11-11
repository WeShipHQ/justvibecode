import { toAtomicUnits } from "@/lib/helpers"
import { RouteConfig } from "@/types"

/**
 * x402 Payment Configuration for Chat API
 *
 * Cấu hình phí cho mỗi chat request
 * - Devnet: 0.01 USDC hoặc 0.0001 SOL
 * - Có thể thay đổi giá trị để điều chỉnh phí
 */

export type PaymentToken = "USDC" | "SOL"

// Phí cho mỗi loại token (human-readable)
const PAYMENT_AMOUNTS = {
  USDC: 0.01, // 0.01 USDC
  SOL: 0.0001, // 0.0001 SOL
}

// Token configs trên devnet
const TOKEN_CONFIGS = {
  USDC: {
    address: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    decimals: 6,
  },
  SOL: {
    address: "So11111111111111111111111111111111111111112",
    decimals: 9,
  },
}

/**
 * Tạo RouteConfig dựa trên token đã chọn
 */
export function createChatRouteConfig(
  token: PaymentToken = "USDC"
): RouteConfig {
  const tokenConfig = TOKEN_CONFIGS[token]
  const amount = PAYMENT_AMOUNTS[token]

  return {
    network: "solana-devnet",
    price: {
      kind: "exact",
      asset: tokenConfig,
      amount: toAtomicUnits(amount, tokenConfig.decimals).toString(),
    },
    config: {
      resource: "/api/chat", // Will be set to full URL in payment requirements
      description: `AI Chat Request - Pay per message (${amount} ${token})`,
      mimeType: "application/json",
      maxTimeoutSeconds: 300,

      // Optional: Set discoverable: true to list in x402 Bazaar, x402scan
      // discoverable: true,

      // Optional: Input schema for API documentation
      inputSchema: {
        body: {
          messages: {
            type: "array",
            description: "Chat messages array",
            required: true,
          },
          modelId: {
            type: "string",
            description: "AI model identifier",
            required: false,
          },
        },
      },

      // Output schema for API documentation
      outputSchema: {
        type: "object",
        description: "Streaming chat response",
        properties: {
          content: {
            type: "string",
            description: "AI response content",
          },
        },
      },
    },
  }
}

// Default config (USDC)
export const chatRouteConfig: RouteConfig = createChatRouteConfig("USDC")

// Export thông tin phí để hiển thị trên UI
export function getChatFeeInfo(token: PaymentToken = "USDC") {
  return {
    amount: PAYMENT_AMOUNTS[token],
    token,
    network: "Solana Devnet",
  }
}

export const CHAT_FEE_INFO = getChatFeeInfo("USDC")
