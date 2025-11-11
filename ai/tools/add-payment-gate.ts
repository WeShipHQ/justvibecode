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

        const fileList = generatedFiles.map((f, i) => `${i + 1}. ${f}`).join("\n")

        return `✅ Successfully added Solana payment gate with x402-next!

📦 Generated ${generatedFiles.length} files:
${fileList}

⚙️ Configuration:
- Blockchain: Solana
- Network: ${network}
- Price: ${price}
- Treasury: ${treasuryAddress}
- Protected paths: ${protectedPaths.join(", ")}

🔧 What was added:
• x402-next middleware (payment verification)
• Solana wallet adapter (wallet connection)
• WalletButton component
• SolanaProvider wrapper
• Environment configuration

📝 Next steps (AI will do automatically):
1. Run: pnpm install (to install x402-next ^0.7.1 and Solana packages)
2. Run: pnpm run dev (to start the dev server)

🧪 How to test:
1. Open preview URL in browser
2. Connect Solana wallet (Phantom/Solflare)
3. Ensure wallet is on ${network}
4. Make payment transaction
5. Access granted!

⚠️ Note: Using ${network}. For production, switch to 'mainnet-beta'.`
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
