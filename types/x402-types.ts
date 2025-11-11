import { z } from "zod"
import { ExactSvmPayloadSchema, SolanaNetworkSchema } from "./x402-protocol"

/**
 * x402 Protocol Core Types and Schemas
 * Self-contained type definitions (không phụ thuộc external packages)
 */

// ============================================
// Error Reasons
// ============================================
export type ErrorReasons =
  | "insufficient_funds"
  | "invalid_signature"
  | "expired_transaction"
  | "invalid_amount"
  | "network_mismatch"
  | "unexpected_verify_error"
  | "unexpected_settle_error"

// ============================================
// SPL Token Amount
// ============================================
export const SPLTokenAmountSchema = z.object({
  kind: z.literal("exact"),
  asset: z.object({
    address: z.string(), // Token mint address
    decimals: z.number(), // Token decimals
  }),
  amount: z.string(), // Amount in atomic units (as string for bigint compatibility)
})

export type SPLTokenAmount = z.infer<typeof SPLTokenAmountSchema>

// ============================================
// Payment Requirements
// ============================================
export const PaymentRequirementsSchema = z.object({
  scheme: z.literal("exact"),
  network: z.string(), // "solana", "solana-devnet", etc.
  maxAmountRequired: z.string(), // Amount in atomic units
  resource: z.string(), // API endpoint URL
  description: z.string(),
  mimeType: z.string(),
  payTo: z.string(), // Recipient address
  maxTimeoutSeconds: z.number(),
  asset: z.string(), // Token mint address
  outputSchema: z.record(z.any()), // JSON schema for response
  extra: z
    .object({
      feePayer: z.string().optional(), // Facilitator's fee payer address
    })
    .optional(),
})

export type PaymentRequirements = z.infer<typeof PaymentRequirementsSchema>

// ============================================
// Middleware Config
// ============================================
export interface PaymentMiddlewareConfig {
  resource?: string
  description?: string
  mimeType?: string
  maxTimeoutSeconds?: number
  discoverable?: boolean // Makes endpoint discoverable in x402 ecosystem
  inputSchema?: Record<string, any> // API input schema for documentation
  outputSchema?: Record<string, any> // API output schema for documentation
}

// ============================================
// Route Config (x402 standard)
// ============================================
export interface RouteConfig {
  network: "solana" | "solana-devnet"
  price: SPLTokenAmount
  config: PaymentMiddlewareConfig
}

// ============================================
// x402 Response (402 Payment Required)
// ============================================
export const x402ResponseSchema = z.object({
  x402Version: z.number(),
  accepts: z.array(PaymentRequirementsSchema),
  error: z.string().optional(),
})

export type x402Response = z.infer<typeof x402ResponseSchema>

// ============================================
// Verify Response
// ============================================
export const VerifyResponseSchema = z.object({
  isValid: z.boolean(),
  invalidReason: z.string().optional(),
})

export type VerifyResponse = z.infer<typeof VerifyResponseSchema>

// ============================================
// Settle Response
// ============================================
export const SettleResponseSchema = z.object({
  success: z.boolean(),
  transaction: z.string(), // Transaction signature
  network: z.string(),
  errorReason: z.string().optional(),
})

export type SettleResponse = z.infer<typeof SettleResponseSchema>

// ============================================
// Supported Payment Kind
// ============================================
export const SupportedPaymentKindSchema = z.object({
  scheme: z.literal("exact"),
  network: z.string(),
  extra: z
    .object({
      feePayer: z.string().optional(),
    })
    .optional(),
})

export type SupportedPaymentKind = z.infer<typeof SupportedPaymentKindSchema>

// ============================================
// Supported Payment Kinds Response
// ============================================
export const SupportedPaymentKindsResponseSchema = z.object({
  kinds: z.array(SupportedPaymentKindSchema).optional(),
})

export type SupportedPaymentKindsResponse = z.infer<
  typeof SupportedPaymentKindsResponseSchema
>

// ============================================
// Constants
// ============================================
export const SupportedSVMNetworks = ["solana", "solana-devnet"] as const

export const SvmNetworkToChainId: Record<string, string> = {
  solana: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp", // Mainnet
  "solana-devnet": "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1", // Devnet
}

// Re-export from x402-protocol for convenience
export type { ExactSvmPayload } from "./x402-protocol"
export { ExactSvmPayloadSchema, SolanaNetworkSchema }
