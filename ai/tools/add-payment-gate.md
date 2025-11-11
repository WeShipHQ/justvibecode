Use this tool to add Solana payment functionality to a generated application using x402-next middleware and Solana wallet adapter. This tool injects payment middleware, wallet integration, and UI components into an existing sandbox application.

## When to Use This Tool

Use Add Payment Gate when:

1. The user explicitly requests payment functionality (e.g., "make users pay to use this app")
2. The user wants to monetize their generated application
3. The user mentions paywalls, payment gates, or charging users
4. The user specifies a price for accessing features or the entire app

## Architecture

This implementation combines:

- **x402-next (^0.7.1)**: Payment middleware that handles 402 responses, payment verification, and blockchain validation
- **Solana Wallet Adapter**: Handles wallet connection UI (Phantom, Solflare, Backpack, etc.)

The flow:

1. User visits app → x402-next middleware intercepts request
2. No payment detected → Return 402 Payment Required
3. User connects wallet via Solana wallet adapter
4. User signs payment transaction
5. x402-next verifies transaction on Solana blockchain
6. Payment validated → Access granted

## Required Parameters

- `sandboxId`: The ID of the existing sandbox
- `price`: Payment amount (e.g., "$0.01", "0.001 USDC", "0.0001 SOL")
- `network`: Solana network ("devnet", "testnet", or "mainnet-beta")
- `treasuryAddress`: Solana wallet address (base58 format) where payments will be sent
- `protectedPaths`: Array of paths to protect (default: `["/"]` for entire app)
- `description`: What the payment is for (e.g., "Access to Todo App")

## Optional Parameters

- `appName`: Display name for wallet selection modal (default: "My App")

## What This Tool Does

1. **Adds x402-next dependency** to package.json (version ^0.7.1)
2. **Generates middleware.ts** with x402-next payment configuration for Solana
3. **Generates Solana wallet adapter files**:
   - `providers/solana-provider.tsx` - Wallet context provider
   - `components/wallet-button.tsx` - Wallet connection button
4. **Updates app/layout.tsx** to wrap app with SolanaProvider
5. **Sets environment variables** (treasury address, RPC URL, network)
6. **Adds wallet adapter dependencies** to package.json

## Generated Files

```
middleware.ts                       # x402-next payment middleware
providers/solana-provider.tsx       # Solana wallet context
components/wallet-button.tsx        # WalletMultiButton component
app/layout.tsx                      # Updated with SolanaProvider
.env.local                          # Treasury, RPC, network config
package.json                        # Updated dependencies
```

## Examples

<example>
User: "Build a todo app where users pay 0.01 SOL to use it"
Assistant: I'll create a todo app with Solana payment functionality.
*Uses Generate Files to create the todo app*
*Uses Add Payment Gate with:*
- sandboxId: "sbx_xyz123"
- price: "0.01 SOL"
- network: "devnet"
- treasuryAddress: "7xKXt...9YrK3"
- protectedPaths: ["/"]
- description: "Access to Todo App"
</example>

<example>
User: "Create a calculator that costs $0.05 on Solana devnet"
Assistant: I'll create a calculator with Solana payment integration.
*Uses Generate Files to create the calculator app*
*Uses Add Payment Gate with:*
- sandboxId: "sbx_abc456"
- price: "$0.05"
- network: "devnet"
- treasuryAddress: (asks user if not provided)
- protectedPaths: ["/"]
- description: "Access to Calculator"
</example>

<example>
User: "Make a notes app with 0.001 USDC payment on Solana"
Assistant: I'll create a notes app with USDC payment.
*Uses Generate Files to create notes app*
*Uses Add Payment Gate with:*
- price: "0.001 USDC"
- network: "devnet"
- (x402-next handles USDC SPL token automatically)
</example>

## Important Notes

- **Always call this tool AFTER generating the main application files**
- **Validate treasury address format** (base58 for Solana)
- **Default to "devnet"** for testing unless user specifies production
- **x402-next handles payment verification** - no custom payment logic needed
- **Wallet adapter only handles wallet connection** - not payment logic
- **Payments go directly to the specified treasury address**

## Supported Payment Tokens

x402-next on Solana supports:

- SOL (native token)
- USDC (SPL token)
- Other SPL tokens configured in middleware

## User Communication

After adding payment functionality, inform the user:

1. **What was generated:**
   - x402-next middleware for payment verification
   - Solana wallet adapter for wallet connection
   - All necessary components and configuration

2. **How to test:**
   - Connect wallet (Phantom, Solflare, etc.)
   - Ensure wallet is on correct network (devnet/mainnet)
   - Make test payment
   - Access granted automatically

3. **Network information:**
   - Current network (devnet/mainnet-beta)
   - How to get test funds for devnet
   - Treasury address receiving payments

4. **Next steps:**
   - Install dependencies (pnpm install)
   - Start dev server (pnpm run dev)
   - Test payment flow
   - For production: switch to mainnet-beta

## Security Considerations

- **x402-next verifies all payments** on Solana blockchain
- **No client-side bypass possible** - middleware enforces payment
- **Treasury address stored in environment variables** (not hardcoded)
- **Start with devnet** before using mainnet
- **Validate wallet signatures** automatically via x402-next
- **Transaction replay prevention** built into x402-next

## Output Behavior

The tool returns a summary including:

- List of generated files
- Configuration details (network, price, treasury)
- How the payment system works
- Next steps for testing
- Production deployment guidance
