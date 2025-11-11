import type { Sandbox } from "@vercel/sandbox"
import { getSolanaX402MiddlewareTemplate } from "./templates/solana-x402-middleware"
import { getSolanaProviderTemplate } from "./templates/solana-provider"
import { getSolanaWalletButtonTemplate } from "./templates/solana-wallet-button"

interface SolanaPaymentConfig {
  sandbox: Sandbox
  price: string
  network: string
  treasuryAddress: string
  protectedPaths: string[]
  description?: string
  appName?: string
}

export async function generateSolanaPaymentFiles(
  config: SolanaPaymentConfig
): Promise<string[]> {
  const {
    sandbox,
    price,
    network,
    treasuryAddress,
    protectedPaths,
    description,
    appName,
  } = config

  const files: Array<{ path: string; content: string }> = []

  // 1. Generate x402-next middleware for Solana
  const middlewareContent = getSolanaX402MiddlewareTemplate({
    price,
    network,
    treasuryAddress,
    protectedPaths,
    description,
    appName,
  })

  files.push({
    path: "middleware.ts",
    content: middlewareContent,
  })

  // 2. Generate Solana wallet provider
  const providerContent = getSolanaProviderTemplate({ network })
  files.push({
    path: "providers/solana-provider.tsx",
    content: providerContent,
  })

  // 3. Generate wallet button
  const walletButtonContent = getSolanaWalletButtonTemplate({ network })
  files.push({
    path: "components/wallet-button.tsx",
    content: walletButtonContent,
  })

  // 4. Generate .env.local
  const envContent = `NEXT_PUBLIC_TREASURY_ADDRESS=${treasuryAddress}
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.${network}.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=${network}
`

  files.push({
    path: ".env.local",
    content: envContent,
  })

  // 5. Read existing package.json using runCommand
  let packageJsonContent = "{}"
  try {
    const cmd = await sandbox.runCommand({
      detached: true,
      cmd: "cat",
      args: ["package.json"],
    })
    const done = await cmd.wait()
    packageJsonContent = await done.stdout()
  } catch (error) {
    console.error("Error reading package.json:", error)
  }

  // 6. Update package.json with dependencies
  const packageJson = JSON.parse(packageJsonContent)
  if (!packageJson.dependencies) {
    packageJson.dependencies = {}
  }

  // Add x402-next for payment middleware
  packageJson.dependencies["x402-next"] = "^0.7.1"

  // Add Solana wallet adapter dependencies
  packageJson.dependencies["@solana/wallet-adapter-base"] = "^0.9.23"
  packageJson.dependencies["@solana/wallet-adapter-react"] = "^0.15.35"
  packageJson.dependencies["@solana/wallet-adapter-react-ui"] = "^0.9.35"
  packageJson.dependencies["@solana/web3.js"] = "^1.95.8"

  files.push({
    path: "package.json",
    content: JSON.stringify(packageJson, null, 2),
  })

  // 7. Read existing layout.tsx to update it with SolanaProvider
  let layoutUpdated = false
  try {
    const cmd = await sandbox.runCommand({
      detached: true,
      cmd: "cat",
      args: ["app/layout.tsx"],
    })
    const done = await cmd.wait()
    let layoutContent = await done.stdout()

    // Check if SolanaProvider is already imported
    if (!layoutContent.includes("SolanaProvider")) {
      // Add imports at the top
      const importStatement =
        'import { SolanaProvider } from "@/providers/solana-provider"\nimport "@solana/wallet-adapter-react-ui/styles.css"\n'

      // Find where to insert imports
      const firstImportIndex = layoutContent.indexOf("import")
      if (firstImportIndex !== -1) {
        // Find the position after the last import
        const lines = layoutContent.split("\n")
        let lastImportLine = 0
        for (let i = 0; i < lines.length; i++) {
          if (
            lines[i].trim().startsWith("import ") ||
            lines[i].trim().startsWith('import"') ||
            lines[i].trim().startsWith("import'")
          ) {
            lastImportLine = i
          }
        }

        // Insert after the last import
        lines.splice(lastImportLine + 1, 0, importStatement.trim())
        layoutContent = lines.join("\n")
      } else {
        // No imports found, add at the beginning
        layoutContent = importStatement + layoutContent
      }

      // Wrap children with SolanaProvider
      // Look for {children} and wrap it
      layoutContent = layoutContent.replace(
        /(<body[^>]*>)([\s\S]*?)({children})([\s\S]*?)(<\/body>)/,
        "$1$2<SolanaProvider>$3</SolanaProvider>$4$5"
      )

      files.push({
        path: "app/layout.tsx",
        content: layoutContent,
      })
      layoutUpdated = true
    }
  } catch (error) {
    console.error("Error reading/updating layout.tsx:", error)
  }

  // 8. Write all files to sandbox using writeFiles
  await sandbox.writeFiles(
    files.map((file) => ({
      path: file.path,
      content: Buffer.from(file.content, "utf8"),
    }))
  )

  return files.map((f) => f.path)
}
