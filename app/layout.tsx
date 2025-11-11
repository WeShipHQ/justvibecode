import { CommandLogsStream } from "@/components/commands-logs/commands-logs-stream"
import { ErrorMonitor } from "@/components/error-monitor/error-monitor"
import { SandboxState } from "@/components/modals/sandbox-state"
import { Toaster } from "@/components/ui/sonner"
import { ChatProvider } from "@/lib/chat-context"
import { PrivyWalletProvider } from "@/providers/privy-provider"
import { RpcProvider } from "@/providers/rpc-provider"
import type { Metadata } from "next"
import { Oxanium } from "next/font/google"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import type { ReactNode } from "react"
import { Suspense } from "react"
import "./globals.css"

const title = "JustVibeCode - AI-Powered Full Stack Coding Platform"
const description = `JustVibeCode is an AI-powered full stack coding platform that helps developers build, preview, and deploy applications faster than ever before. With intelligent code generation, real-time collaboration, and seamless integration with popular frameworks and services, JustVibeCode empowers developers to bring their ideas to life with ease and efficiency.`

const oxanium = Oxanium({
  subsets: ["latin"],
  variable: "--font-oxanium",
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    images: [
      {
        url: "https://assets.vercel.com/image/upload/v1754588799/OSSvibecodingplatform/OG.png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: [
      {
        url: "https://assets.vercel.com/image/upload/v1754588799/OSSvibecodingplatform/OG.png",
      },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={oxanium.variable}>
      <body className="antialiased">
        {/* <ThemeProvider> */}
        <Suspense fallback={null}>
          <NuqsAdapter>
            <PrivyWalletProvider>
              <RpcProvider>
                <ChatProvider>
                  <ErrorMonitor>{children}</ErrorMonitor>
                </ChatProvider>
              </RpcProvider>
            </PrivyWalletProvider>
          </NuqsAdapter>
        </Suspense>
        <Toaster />
        <CommandLogsStream />
        <SandboxState />
        {/* </ThemeProvider> */}
      </body>
    </html>
  )
}
