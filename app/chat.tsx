"use client"

import { TEST_PROMPTS } from "@/ai/constants"
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation"
import { Message } from "@/components/chat/message"
import { PaymentConfirmationMessage } from "@/components/chat/payment-confirmation-message"
import { type PaymentToken } from "@/components/chat/payment-token-selector"
import type { ChatUIMessage } from "@/components/chat/types"
import { Panel, PanelHeader } from "@/components/panels/panels"
import { ModelSelector } from "@/components/settings/model-selector"
import { Settings } from "@/components/settings/settings"
import { useSettings } from "@/components/settings/use-settings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { type WalletBalanceRef } from "@/components/wallet/wallet-balance"
import { useFreeMessageStatus } from "@/hooks/use-free-message-status"
import { useWallet } from "@/hooks/use-wallet"
import { useX402Client } from "@/hooks/use-x402-client"
import { useSharedChatContext } from "@/lib/chat-context"
import { recordMessageUsage } from "@/lib/free-message-storage"
import { useLocalStorageValue } from "@/lib/use-local-storage-value"
import { useChat } from "@ai-sdk/react"
import { MessageCircleIcon, SendIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { useSandboxStore } from "./state"

interface Props {
  className: string
  modelId?: string
  chatId?: string // Optional: load existing chat
}

export function Chat({ className, chatId }: Props) {
  const [input, setInput] = useLocalStorageValue("prompt-input")
  const { chat, setOnFinishCallback } = useSharedChatContext()
  const { modelId, reasoningEffort } = useSettings()
  const router = useRouter()
  const [currentChatId, setCurrentChatId] = useState<string | undefined>(chatId)

  useEffect(() => {
    setOnFinishCallback((props) => {
      console.log("🎯 onFinish called with props:", props)
      const { message } = props
      if (!currentChatId) {
        const metadata = (message as any).metadata
        if (metadata?.chatId) {
          setCurrentChatId(metadata.chatId)
          // window.history.pushState(null, "", `/c/${metadata.chatId}`)

          router.push(`/c/${metadata.chatId}`)
        }
      }
    })
  }, [currentChatId, setOnFinishCallback, router])

  const {
    messages,
    sendMessage: originalSendMessage,
    status,
    setMessages,
  } = useChat<ChatUIMessage>({
    ...chat,
    id: currentChatId ?? undefined,
  })
  const { setChatStatus } = useSandboxStore()
  const { authenticated, wallet } = useWallet()
  const x402Client = useX402Client()
  const [selectedPaymentToken, setSelectedPaymentToken] =
    useState<PaymentToken>("USDC")
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  const [paymentState, setPaymentState] = useState<{
    status: "idle" | "pending" | "processing" | "success" | "error"
    message: string
    errorMessage?: string
  }>({
    status: "idle",
    message: "",
  })

  const walletBalanceRef = useRef<WalletBalanceRef>(null)

  const {
    hasFreeMessage,
    refetch: refetchFreeStatus,
    loading: freeMessageLoading,
  } = useFreeMessageStatus(wallet?.address)

  const [freeMessageUsedInSession, setFreeMessageUsedInSession] =
    useState(false)

  useEffect(() => {
    setFreeMessageUsedInSession(false)
  }, [wallet?.address])

  // Load chat history when chatId is provided
  useEffect(() => {
    if (!chatId || !authenticated) return

    const loadChatHistory = async () => {
      try {
        setIsLoadingHistory(true)
        console.log("📥 Loading chat history for:", chatId)

        // Get session token from localStorage
        const sessionToken = localStorage.getItem("session_token")
        if (!sessionToken) {
          console.warn("No session token found")
          return
        }

        const response = await fetch(`/api/chats/${chatId}`, {
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        })

        if (!response.ok) {
          console.error("Failed to load chat history:", await response.text())
          return
        }

        const data = await response.json()
        console.log("✅ Loaded chat history:", data)

        // Convert DB messages to ChatUIMessage format
        const loadedMessages: ChatUIMessage[] = data.messages.map(
          (msg: any) => ({
            id: msg.id,
            role: msg.role,
            parts: msg.parts,
            createdAt: new Date(msg.createdAt),
          })
        )

        // Set messages in the chat
        setMessages(loadedMessages)
        setCurrentChatId(chatId)
      } catch (error) {
        console.error("Error loading chat history:", error)
        toast.error("Failed to load chat history")
      } finally {
        setIsLoadingHistory(false)
      }
    }

    loadChatHistory()
  }, [chatId, authenticated, setMessages])

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

        // Record usage in localStorage
        recordMessageUsage(wallet.address)

        // Clear input field
        setInput("")

        originalSendMessage(
          { text },
          {
            body: {
              modelId,
              reasoningEffort,
              walletAddress: wallet.address,
              isFreeMessage: true, // FLAG: Bypass payment verification on API
              chatId: currentChatId, // Include current chatId if exists
            },
          }
        )

        // Refresh free message status to show it's been used (after a short delay)
        setTimeout(() => {
          refetchFreeStatus()
        }, 500)

        return
      }

      // Priority 3: Paid message - show payment confirmation inline
      if (!authenticated) {
        toast.error("Please connect your wallet first to send messages")
        return
      }

      if (!x402Client) {
        toast.error(
          "Please connect a standard Solana wallet (Phantom, Solflare, etc.) for payments",
          { duration: 5000 }
        )
        return
      }
      console.log("💰 Prompting payment confirmation for message:", text)
      // Show payment confirmation inline
      setPaymentState({
        status: "pending",
        message: text,
      })
    },
    [
      hasFreeMessage,
      freeMessageUsedInSession,
      refetchFreeStatus,
      x402Client,
      authenticated,
      wallet?.address,
      modelId,
      reasoningEffort,
      originalSendMessage,
      setInput,
      freeMessageLoading,
    ]
  )

  // Handle confirmed payment
  const handlePaymentConfirm = useCallback(async () => {
    if (!paymentState.message || !wallet?.address) return

    try {
      // Set to processing state
      setPaymentState((prev) => ({
        ...prev,
        status: "processing",
      }))

      // Gửi request với x402 payment interceptor
      const response = await x402Client!.fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Payment-Token": selectedPaymentToken,
        },
        body: JSON.stringify({
          messages: [
            ...messages,
            {
              id: Date.now().toString(),
              role: "user",
              content: paymentState.message,
            },
          ],
          modelId,
          reasoningEffort,
          paymentToken: selectedPaymentToken,
        }),
      })

      if (response.ok) {
        // Set to success state
        setPaymentState({
          status: "success",
          message: paymentState.message,
        })

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
          { text: paymentState.message },
          {
            body: {
              modelId,
              reasoningEffort,
              paymentBypass: true,
              walletAddress: wallet.address,
              chatId: currentChatId, // Include current chatId if exists
            },
          }
        )

        // Reset payment state after a short delay
        setTimeout(() => {
          setPaymentState({
            status: "idle",
            message: "",
          })
        }, 2000)
      } else {
        const error = await response.json()
        setPaymentState({
          status: "error",
          message: paymentState.message,
          errorMessage: error.reason || error.error || "Payment failed",
        })
      }
    } catch (error: any) {
      console.error("Payment error:", error)

      let errorMessage = error.message

      if (error.message?.includes("Associated Token Account")) {
        if (selectedPaymentToken === "SOL") {
          errorMessage =
            "You need a Wrapped SOL account for payments. Click 'Setup SOL Payments' first!"
        } else {
          errorMessage = `You need ${selectedPaymentToken} Devnet in your wallet. Get test tokens from the faucet!`
        }
      } else if (error.message?.includes("insufficient funds")) {
        errorMessage = `Insufficient ${selectedPaymentToken} balance. Get more test tokens!`
      }

      setPaymentState({
        status: "error",
        message: paymentState.message,
        errorMessage,
      })
    }
  }, [
    paymentState.message,
    wallet?.address,
    x402Client,
    selectedPaymentToken,
    messages,
    modelId,
    reasoningEffort,
    originalSendMessage,
    setInput,
  ])

  // Handle payment cancellation
  const handlePaymentCancel = useCallback(() => {
    setPaymentState({
      status: "idle",
      message: "",
    })
    toast.info("Payment cancelled")
  }, [])

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
          <div className="font-mono text-xs opacity-50">[{status}]</div>
        </div>
      </PanelHeader>

      {/* Messages Area */}
      {messages.length === 0 ? (
        <div className="flex-1 min-h-0">
          <div className="flex flex-col justify-center items-center h-full font-mono text-sm text-muted-foreground">
            <p className="flex items-center font-semibold">
              What will you build today?
            </p>
            <ul className="p-4 space-y-3 text-center">
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

      {paymentState.status !== "idle" && (
        <Conversation>
          <ConversationContent>
            <PaymentConfirmationMessage
              paymentToken={selectedPaymentToken}
              onConfirm={handlePaymentConfirm}
              onCancel={handlePaymentCancel}
              status={paymentState.status}
              errorMessage={paymentState.errorMessage}
            />
          </ConversationContent>
        </Conversation>
      )}

      <form
        className="flex items-center p-2 space-x-1 border-t border-primary/18 bbg-background"
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
            paymentState.status === "processing" ||
            !authenticated
          }
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            !authenticated
              ? "Connect wallet to send messages..."
              : paymentState.status === "pending"
                ? "Waiting for payment confirmation..."
                : "Type your message..."
          }
          value={input}
        />
        <Button
          type="submit"
          disabled={
            status !== "ready" ||
            !input.trim() ||
            paymentState.status !== "idle" ||
            !authenticated
          }
        >
          <SendIcon className="w-4 h-4" />
        </Button>
      </form>
    </Panel>
  )
}
