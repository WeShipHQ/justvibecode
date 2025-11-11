interface SolanaX402MiddlewareConfig {
  price: string
  network: string
  treasuryAddress: string
  protectedPaths: string[]
  description?: string
  appName?: string
}

export function getSolanaX402MiddlewareTemplate(
  config: SolanaX402MiddlewareConfig
): string {
  const {
    price,
    network,
    treasuryAddress,
    protectedPaths,
    description = "Access to application",
  } = config

  // Generate routes configuration
  const routesConfig = protectedPaths
    .map((path) => {
      return `    '${path}': {
      price: '${price}',
      network: '${network}' as Network,
      config: {
        description: '${description}',
        maxTimeoutSeconds: 120
      }
    }`
    })
    .join(",\n")

  return `import { paymentMiddleware, Network } from 'x402-next';

export const middleware = paymentMiddleware(
  '${treasuryAddress}',
  {
${routesConfig}
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
`
}
