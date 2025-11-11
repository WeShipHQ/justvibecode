import { Sandbox } from "@vercel/sandbox"
import type { UIMessage, UIMessageStreamWriter } from "ai"
import { tool } from "ai"
import z from "zod/v3"
import type { DataPart } from "../messages/data-parts"
import description from "./add-payment-gate.md"
import { generateSolanaPaymentFiles } from "./add-payment-gate/generators"
import { getRichError } from "./get-rich-error"

interface Params {
  writer: UIMessageStreamWriter<UIMessage<never, DataPart>>
}

export const addPaymentGate = ({ writer }: Params) =>
  tool({
    description,
    inputSchema: z.object({
      sandboxId: z.string().describe("The ID of the existing sandbox"),
      price: z
        .string()
        .describe('Payment amount (e.g., "$0.01", "0.001 USDC", "0.0001 SOL")'),
      network: z
        .string()
        .describe(
          'Solana network to use: "devnet", "testnet", or "mainnet-beta"'
        ),
      treasuryAddress: z
        .string()
        .describe(
          "Solana wallet address where payments will be sent (base58 format)"
        ),
      protectedPaths: z
        .array(z.string())
        .optional()
        .describe('Paths to protect (default: ["/"] for entire app)'),
      description: z
        .string()
        .optional()
        .describe("What the payment is for (e.g., 'Access to Todo App')"),
      appName: z
        .string()
        .optional()
        .describe("Display name for wallet selection modal"),
    }),
    execute: async (
      {
        sandboxId,
        price,
        network,
        treasuryAddress,
        protectedPaths = ["/"],
        description: paymentDescription,
        appName,
      },
      { toolCallId }
    ) => {
      writer.write({
        id: toolCallId,
        type: "data-add-payment-gate",
        data: { status: "generating" },
      })

      let sandbox: Sandbox | null = null

      try {
        sandbox = await Sandbox.get({ sandboxId })
      } catch (error) {
        const richError = getRichError({
          action: "get sandbox by id",
          args: { sandboxId },
          error,
        })

        writer.write({
          id: toolCallId,
          type: "data-add-payment-gate",
          data: { error: richError.error, status: "error" },
        })

        return richError.message
      }

      try {
        const generatedFiles = await generateSolanaPaymentFiles({
          sandbox,
          price,
          network,
          treasuryAddress,
          protectedPaths,
          description: paymentDescription,
          appName,
        })

        writer.write({
          id: toolCallId,
          type: "data-add-payment-gate",
          data: {
            status: "done",
            files: generatedFiles,
          },
        })

        return `Successfully added Solana payment gate with x402-next. Generated files: ${generatedFiles.join(", ")}.

Configuration:
- Blockchain: Solana
- Network: ${network}
- Price: ${price}
- Treasury: ${treasuryAddress}
- Protected paths: ${protectedPaths.join(", ")}

Components Generated:
1. middleware.ts - x402-next payment middleware (handles 402 responses & verification)
2. providers/solana-provider.tsx - Solana wallet context (WalletProvider, ConnectionProvider)
3. components/wallet-button.tsx - Wallet connection button (WalletMultiButton)
4. app/layout.tsx - Updated with SolanaProvider wrapper
5. .env.local - Environment variables (treasury, RPC, network)
6. package.json - Updated with x402-next ^0.7.1 and wallet adapter dependencies

How it works:
- x402-next middleware intercepts requests and checks for payment
- Users connect wallet via Solana wallet adapter (Phantom, Solflare, etc.)
- Middleware returns 402 Payment Required if not paid
- After payment, x402-next verifies transaction on Solana blockchain
- Access granted automatically

Next steps:
1. Install dependencies: pnpm install
2. Start dev server: pnpm run dev
3. Test payment flow:
   - Open app in browser
   - Connect Solana wallet (ensure you're on ${network})
   - Complete payment transaction
   - Access granted!

Note: Currently using ${network}. For production, switch to 'mainnet-beta' and update treasury address.`
      } catch (error) {
        const richError = getRichError({
          action: "add payment gate",
          args: { price, network },
          error,
        })

        writer.write({
          id: toolCallId,
          type: "data-add-payment-gate",
          data: {
            error: richError.error,
            status: "error",
          },
        })

        return richError.message
      }
    },
  })
