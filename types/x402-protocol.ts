import { z } from "zod"

/**
 * Solana-specific x402 Protocol Types
 * These are Solana-only variants of x402 protocol types
 */

// Solana-only network enum
export const SolanaNetworkSchema = z.enum(["solana-devnet", "solana"])

export type SolanaNetwork = z.infer<typeof SolanaNetworkSchema>

// SVM (Solana Virtual Machine) Payload Schema
export const ExactSvmPayloadSchema = z.object({
  transaction: z.string(), // Base64 encoded serialized transaction
})

export type ExactSvmPayload = z.infer<typeof ExactSvmPayloadSchema>

// Solana-specific payment payload schema
export const SolanaPaymentPayloadSchema = z.object({
  x402Version: z.literal(1),
  scheme: z.literal("exact"),
  network: SolanaNetworkSchema,
  payload: ExactSvmPayloadSchema,
})

export type SolanaPaymentPayload = z.infer<typeof SolanaPaymentPayloadSchema>
