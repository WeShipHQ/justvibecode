"use client"

import { TEST_PROMPTS } from "@/ai/constants"
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation"
import { ChatFeeIndicator } from "@/components/chat/chat-fee-indicator"
import { FreeMessageIndicator } from "@/components/chat/free-message-indicator"
import { GetTokenGuide } from "@/components/chat/get-token-guide"
import { Message } from "@/components/chat/message"
import {
  PaymentTokenSelector,
  type PaymentToken,
} from "@/components/chat/payment-token-selector"
import type { ChatUIMessage } from "@/components/chat/types"
import { Panel, PanelHeader } from "@/components/panels/panels"
import { ModelSelector } from "@/components/settings/model-selector"
import { Settings } from "@/components/settings/settings"
import { useSettings } from "@/components/settings/use-settings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SetupWrapperSOL } from "@/components/wallet/setup-wrapped-sol"
import {
  WalletBalance,
  type WalletBalanceRef,
} from "@/components/wallet/wallet-balance"
import { useFreeMessageStatus } from "@/hooks/use-free-message-status"
import { useWallet } from "@/hooks/use-wallet"
import { useX402Client } from "@/hooks/use-x402-client"
import { useSharedChatContext } from "@/lib/chat-context"
import { useLocalStorageValue } from "@/lib/use-local-storage-value"
import { useChat } from "@ai-sdk/react"
import { MessageCircleIcon, SendIcon } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { useSandboxStore } from "./state"

interface Props {
  className: string
  modelId?: string
}

export function Chat({ className }: Props) {
  const [input, setInput] = useLocalStorageValue("prompt-input")
  const { chat } = useSharedChatContext()
  const { modelId, reasoningEffort } = useSettings()
  const {
    messages,
    sendMessage: originalSendMessage,
    status,
  } = useChat<ChatUIMessage>({ chat })
  const { setChatStatus } = useSandboxStore()
  const { authenticated, wallet } = useWallet()

  // Wrapper để always include wallet address - simplified to prevent infinite loops
  const sendMessage = useCallback(
    (text: any, options?: any) => {
      const enhancedOptions = {
        ...options,
        body: {
          ...options?.body,
          modelId,
          reasoningEffort,
          walletAddress: wallet?.address,
        },
      }
      return originalSendMessage(text, enhancedOptions)
    },
    [originalSendMessage, modelId, reasoningEffort, wallet?.address]
  )
  const x402Client = useX402Client()
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false)
  const [selectedPaymentToken, setSelectedPaymentToken] =
    useState<PaymentToken>("USDC")

  // Ref để trigger balance refresh từ WalletBalance component
  const walletBalanceRef = useRef<WalletBalanceRef>(null)

  // Check free message status
  const {
    hasFreeMessage,
    refetch: refetchFreeStatus,
    loading: freeMessageLoading,
  } = useFreeMessageStatus(wallet?.address)

  // Track if we've used the free message in this session to prevent double usage
  const [freeMessageUsedInSession, setFreeMessageUsedInSession] =
    useState(false)

  // Reset session flag when wallet changes
  useEffect(() => {
    setFreeMessageUsedInSession(false)
  }, [wallet?.address])

  // Debug logging - simplified to prevent infinite loops
  useEffect(() => {
    if (wallet?.address) {
      console.log("🔍 Free message status debug:", {
        walletAddress: wallet.address,
        hasFreeMessage,
        freeMessageLoading,
        freeMessageUsedInSession,
      })
    }
  }, [wallet?.address, hasFreeMessage, freeMessageUsedInSession])

  const validateAndSubmitMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return

      // Debug: Complete state check
      console.log("🎯 Complete validation state:", {
        hasFreeMessage,
        walletAddress: wallet?.address,
        freeMessageLoading,
        authenticated,
        walletExists: !!wallet,
        x402ClientExists: !!x402Client,
      })

      // Priority 1: Check wallet connection first
      if (!wallet?.address) {
        console.log("❌ No wallet address - skipping free message check")
        toast.error("Please connect your wallet first!")
        return
      }

      // Priority 2: Check if user has free message (and hasn't used it in this session)
      if (hasFreeMessage && !freeMessageUsedInSession) {
        // Send free message directly with wallet address
        console.log("🆓 Sending free message for wallet:", wallet.address)
        toast.success("✨ Using your free message!", { id: "free-message" })

        // Mark as used immediately to prevent double usage
        setFreeMessageUsedInSession(true)

        // Clear input field
        setInput("")

        originalSendMessage(
          { text },
          {
            body: {
              modelId,
              reasoningEffort,
              walletAddress: wallet.address, // Explicitly include wallet address
            },
          }
        )

        // Refresh free message status to show it's been used (after a short delay)
        setTimeout(async () => {
          await refetchFreeStatus()
        }, 500)

        return
      }

      // Kiểm tra nếu có x402 client (wallet đã kết nối) - for paid messages
      if (x402Client) {
        try {
          setIsPaymentProcessing(true)
          toast.loading(`Processing payment with ${selectedPaymentToken}...`, {
            id: "payment",
          })

          // Gửi request với x402 payment interceptor
          const response = await x402Client.fetch("/api/chat", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Payment-Token": selectedPaymentToken, // Pass selected token to backend
            },
            body: JSON.stringify({
              messages: [
                ...messages,
                { id: Date.now().toString(), role: "user", content: text },
              ],
              modelId,
              reasoningEffort,
              paymentToken: selectedPaymentToken, // Include in body as well
            }),
          })

          if (response.ok) {
            toast.success("Payment verified! Message sent.", { id: "payment" })

            // Clear input
            setInput("")

            // Refresh wallet balance immediately after payment
            try {
              await walletBalanceRef.current?.refreshBalances()
            } catch (error) {
              console.log("Failed to refresh balance:", error)
            }

            // Now use originalSendMessage with bypass header to skip payment gate
            originalSendMessage(
              { text },
              {
                body: {
                  modelId,
                  reasoningEffort,
                  paymentBypass: true, // This will add bypass header
                  walletAddress: wallet?.address, // For tracking purposes
                },
              }
            )
          } else {
            const error = await response.json()
            toast.error(`Payment failed: ${error.reason || error.error}`, {
              id: "payment",
            })
          }
        } catch (error: any) {
          console.error("Payment error:", error)

          if (error.message?.includes("Associated Token Account")) {
            if (selectedPaymentToken === "SOL") {
              toast.error(
                "You need a Wrapped SOL account for payments. Click 'Setup SOL Payments' first!",
                {
                  id: "payment",
                  duration: 10000,
                  description: "One-time setup required for SOL payments",
                }
              )
            } else {
              toast.error(
                `You need ${selectedPaymentToken} Devnet in your wallet. Click here to get test tokens!`,
                {
                  id: "payment",
                  duration: 10000,
                  action: {
                    label: `Get ${selectedPaymentToken}`,
                    onClick: () => {
                      window.open("https://faucet.circle.com/", "_blank")
                    },
                  },
                }
              )
            }
          } else if (error.message?.includes("insufficient funds")) {
            const faucetUrl =
              selectedPaymentToken === "USDC"
                ? "https://faucet.circle.com/"
                : "https://faucet.solana.com/"

            toast.error(
              `Insufficient ${selectedPaymentToken} balance. Get more test tokens!`,
              {
                id: "payment",
                duration: 8000,
                action: {
                  label: `Get ${selectedPaymentToken}`,
                  onClick: () => {
                    window.open(faucetUrl, "_blank")
                  },
                },
              }
            )
          } else {
            toast.error(`Payment error: ${error.message}`, { id: "payment" })
          }
        } finally {
          setIsPaymentProcessing(false)
        }
      } else {
        // Nếu chưa có x402Client
        if (!authenticated) {
          toast.error("Please connect your wallet first to send messages")
          return
        }
        // Wallet connected nhưng không compatible với x402
        toast.error(
          "Please connect a standard Solana wallet (Phantom, Solflare, etc.) for payments",
          { duration: 5000 }
        )
      }
    },
    [
      hasFreeMessage,
      freeMessageUsedInSession,
      refetchFreeStatus,
      x402Client,
      authenticated,
      messages,
      modelId,
      reasoningEffort,
      originalSendMessage,
      setInput,
      selectedPaymentToken,
    ]
  )

  useEffect(() => {
    setChatStatus(status)
  }, [status, setChatStatus])

  return (
    <Panel className={className}>
      <PanelHeader>
        <div className="flex items-center font-mono font-semibold uppercase">
          <MessageCircleIcon className="mr-2 w-4" />
          Chat
        </div>
        <div className="ml-auto flex items-center gap-2">
          <WalletBalance ref={walletBalanceRef} compact />
          {selectedPaymentToken === "SOL" && <SetupWrapperSOL />}
          <PaymentTokenSelector
            selectedToken={selectedPaymentToken}
            onTokenChange={setSelectedPaymentToken}
          />
          <GetTokenGuide token={selectedPaymentToken} />
          <FreeMessageIndicator
            hasFreeMessage={hasFreeMessage && !freeMessageUsedInSession}
            walletAddress={wallet?.address}
          />
          {!(hasFreeMessage && !freeMessageUsedInSession) && (
            <ChatFeeIndicator token={selectedPaymentToken} />
          )}
          <div className="font-mono text-xs opacity-50">[{status}]</div>
        </div>
      </PanelHeader>

      {/* Messages Area */}
      {messages.length === 0 ? (
        <div className="flex-1 min-h-0">
          <div className="flex flex-col justify-center items-center h-full font-mono text-sm text-muted-foreground">
            <p className="flex items-center font-semibold">
              Click and try one of these prompts:
            </p>
            <ul className="p-4 space-y-1 text-center">
              {TEST_PROMPTS.map((prompt, idx) => (
                <li
                  key={idx}
                  className="px-4 py-2 rounded-sm border border-dashed shadow-sm cursor-pointer border-border hover:bg-secondary/50 hover:text-primary"
                  onClick={() => validateAndSubmitMessage(prompt)}
                >
                  {prompt}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <Conversation className="relative w-full">
          <ConversationContent className="space-y-4">
            {messages.map((message) => (
              <Message key={message.id} message={message} />
            ))}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      )}

      <form
        className="flex items-center p-2 space-x-1 border-t border-primary/18 bg-background"
        onSubmit={async (event) => {
          event.preventDefault()
          validateAndSubmitMessage(input)
        }}
      >
        <Settings />
        <ModelSelector />
        <Input
          className="w-full font-mono text-sm rounded-sm border-0 bg-background"
          disabled={
            status === "streaming" ||
            status === "submitted" ||
            isPaymentProcessing ||
            !authenticated
          }
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            !authenticated
              ? "Connect wallet to send messages..."
              : "Type your message..."
          }
          value={input}
        />
        <Button
          type="submit"
          disabled={
            status !== "ready" ||
            !input.trim() ||
            isPaymentProcessing ||
            !authenticated
          }
        >
          <SendIcon className="w-4 h-4" />
        </Button>
      </form>
    </Panel>
  )
}
