import { X402PaymentHandler } from "@/app/api/x402"
import envConfig from "@/configs/env"

/**
 * x402 Server Configuration
 *
 * Cấu hình cho payment handler server-side
 * Environment variables cần thiết:
 * - TREASURY_ADDRESS: Địa chỉ ví nhận payment (ví Solana của bạn)
 * - FACILITATOR_URL: URL của x402 facilitator service (default: PayAI Network)
 */

const TREASURY_ADDRESS =
  process.env.NEXT_PUBLIC_WALLET_ADDRESS ||
  process.env.TREASURY_ADDRESS ||
  "9qZJYvQXEJPdWiHBq7xHWWTMUxX6XnqvjpSXHAzYVxYJ"

const FACILITATOR_URL =
  process.env.NEXT_PUBLIC_FACILITATOR_URL ||
  process.env.FACILITATOR_URL ||
  "https://facilitator.payai.network"

/**
 * Global x402 Payment Handler instance
 */
console.log("🔧 X402 Handler Configuration:", {
  treasuryAddress: TREASURY_ADDRESS,
  facilitatorUrl: FACILITATOR_URL,
  rpcUrl: envConfig.NEXT_PUBLIC_DEVNET_RPC_URL,
})

export const x402Handler = new X402PaymentHandler({
  network: "solana-devnet",
  treasuryAddress: TREASURY_ADDRESS,
  facilitatorUrl: FACILITATOR_URL,
  rpcUrl: envConfig.NEXT_PUBLIC_DEVNET_RPC_URL,
})
