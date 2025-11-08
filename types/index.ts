/**
 * x402 Solana - Types Package
 * All TypeScript types and Zod schemas for the x402 protocol
 */

// ============================================
// Import types and schemas from local definitions
// ============================================
export type {
  ErrorReasons,
  ExactSvmPayload,
  PaymentMiddlewareConfig,
  PaymentRequirements,
  RouteConfig,
  SPLTokenAmount,
  SettleResponse,
  SupportedPaymentKind,
  SupportedPaymentKindsResponse,
  VerifyResponse,
  x402Response,
} from "./x402-types"

export {
  // Schemas
  ExactSvmPayloadSchema,
  PaymentRequirementsSchema,
  SettleResponseSchema,
  SupportedPaymentKindSchema,
  SupportedPaymentKindsResponseSchema,

  // Constants
  SupportedSVMNetworks,
  SvmNetworkToChainId,
  VerifyResponseSchema,
  x402ResponseSchema,
} from "./x402-types"

// ============================================
// Solana-only variants (local)
// ============================================
export * from "./x402-protocol" // SolanaNetwork, SolanaPaymentPayload

// ============================================
// Custom Solana types
// ============================================
export * from "./solana-payment" // WalletAdapter, configs, etc.
