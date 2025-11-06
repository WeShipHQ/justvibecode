import { z } from "zod"

const configSchema = z.object({
  NEXT_PUBLIC_PRIVY_APP_ID: z.string(),

  NEXT_PUBLIC_MAINNET_RPC_URL: z.string(),
  NEXT_PUBLIC_DEVNET_RPC_URL: z.string(),

  NEXT_PUBLIC_RPC_URL: z.string(),
  NEXT_PUBLIC_RPC_SUBSCRIPTIONS_URL: z.string(),
})

const configProject = configSchema.safeParse({
  NEXT_PUBLIC_PRIVY_APP_ID: process.env.NEXT_PUBLIC_PRIVY_APP_ID,

  NEXT_PUBLIC_MAINNET_RPC_URL: process.env.NEXT_PUBLIC_MAINNET_RPC_URL,
  NEXT_PUBLIC_DEVNET_RPC_URL: process.env.NEXT_PUBLIC_DEVNET_RPC_URL,

  NEXT_PUBLIC_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL,
  NEXT_PUBLIC_RPC_SUBSCRIPTIONS_URL:
    process.env.NEXT_PUBLIC_RPC_SUBSCRIPTIONS_URL,
})

if (!configProject.success) {
  console.error(configProject.error.issues)
  throw new Error("Invalid environment variables")
}

const envConfig = configProject.data

export default envConfig
