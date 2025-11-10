import { DEFAULT_MODEL } from "@/ai/constants"
import { getAvailableModels, getModelOptions } from "@/ai/gateway"
import { tools } from "@/ai/tools"
import { type ChatUIMessage } from "@/components/chat/types"
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
} from "ai"
import { checkBotId } from "botid/server"
import { NextResponse } from "next/server"
import prompt from "./prompt.md"
import { createChatRouteConfig, type PaymentToken } from "./x402-config"
import { x402Handler } from "./x402-handler"

/**
 * Helper to persist chat and messages to database
 * Called after user sends a message (before AI response)
 */
async function persistUserMessage(
  userId: string,
  chatId: string | undefined,
  messages: ChatUIMessage[],
  modelId: string,
  paymentId?: string
): Promise<string> {
  try {
    const { findOrCreateChat, saveMessage } = await import(
      "@/lib/db/services/chat.service"
    )

    // Get or create chat
    const chat = await findOrCreateChat({
      chatId,
      userId,
      title: "New Chat", // Will be updated with first message content
      modelId,
    })

    if (!chat) {
      console.error("Failed to create chat")
      return chatId || ""
    }

    // Save the last user message (most recent in the array)
    const lastMessage = messages[messages.length - 1]
    if (lastMessage && lastMessage.role === "user") {
      await saveMessage({
        chatId: chat.id,
        role: lastMessage.role,
        parts: lastMessage.parts,
        // @ts-expect-error
        attachments: lastMessage?.attachments || [],
        paymentId,
      })

      // Auto-generate title from first message if it's "New Chat"
      if (chat.title === "New Chat" && messages.length === 1) {
        const { updateChatTitle } = await import(
          "@/lib/db/services/chat.service"
        )
        const textPart = lastMessage.parts.find((p: any) => p.type === "text")
        const firstText = (textPart as any)?.text || ""
        const title =
          firstText.slice(0, 50) + (firstText.length > 50 ? "..." : "")
        await updateChatTitle(chat.id, title || "New Chat")
      }
    }

    return chat.id
  } catch (error) {
    console.error("Failed to persist user message:", error)
    return chatId || ""
  }
}

/**
 * Helper to persist assistant message after streaming completes
 */
async function persistAssistantMessage(
  chatId: string,
  text: string,
  model: { id: string; name: string },
  reasoningEffort?: "low" | "medium" | "high",
  usage?: any,
  finishReason?: string
): Promise<void> {
  try {
    const { saveMessage } = await import("@/lib/db/services/chat.service")

    await saveMessage({
      chatId,
      role: "assistant",
      parts: [{ type: "text", text }],
      attachments: [],
      metadata: {
        modelId: model.id,
        reasoningEffort,
        tokens: {
          input: usage?.inputTokens,
          output: usage?.outputTokens,
          total: usage?.totalTokens,
        },
        finishReason,
      },
    })
    console.log("💾 Assistant message persisted to chat:", chatId)
  } catch (error) {
    console.error("Failed to persist assistant message:", error)
  }
}

/**
 * Create streaming response with message persistence
 */
function createStreamingResponse(
  messages: ChatUIMessage[],
  modelId: string,
  model: { id: string; name: string },
  reasoningEffort: "low" | "medium" | undefined,
  chatId: string | undefined,
  writer: any
) {
  const result = streamText({
    ...getModelOptions(modelId, { reasoningEffort }),
    system: prompt,
    messages: convertToModelMessages(
      messages.map((message: ChatUIMessage) => {
        message.parts = message.parts.map((part: any) => {
          if (part.type === "data-report-errors") {
            return {
              type: "text",
              text:
                `There are errors in the generated code. This is the summary of the errors we have:\n` +
                `\`\`\`${part.data.summary}\`\`\`\n` +
                (part.data.paths?.length
                  ? `The following files may contain errors:\n` +
                    `\`\`\`${part.data.paths?.join("\n")}\`\`\`\n`
                  : "") +
                `Fix the errors reported.`,
            }
          }
          return part
        })
        return message
      })
    ),
    stopWhen: stepCountIs(20),
    tools: tools({ modelId, writer }),
    onError: (error) => {
      console.error("Error communicating with AI")
      console.error(JSON.stringify(error, null, 2))
    },
    onFinish: async ({ text, usage, finishReason }) => {
      // Save assistant message to database after stream completes
      if (chatId) {
        await persistAssistantMessage(
          chatId,
          text,
          model,
          reasoningEffort,
          usage,
          finishReason
        )
      }
    },
  })

  result.consumeStream()
  writer.merge(
    result.toUIMessageStream({
      sendReasoning: true,
      sendStart: false,
      messageMetadata: () => ({
        model: model.name,
        chatId,
      }),
    })
  )
}

interface BodyData {
  messages: ChatUIMessage[]
  modelId?: string
  reasoningEffort?: "low" | "medium"
  paymentToken?: PaymentToken
  walletAddress?: string // Add wallet address to body for free message tracking
  isFreeMessage?: boolean // Flag to bypass payment for free messages
  chatId?: string // Optional chat ID to persist messages
}

export async function POST(req: Request) {
  const checkResult = await checkBotId()
  if (checkResult.isBot) {
    return NextResponse.json({ error: `Bot detected` }, { status: 403 })
  }

  const body = await req.json()

  // Check for payment bypass flag (after successful x402 payment)
  if (body.paymentBypass === true) {
    // Skip payment verification - this is a follow-up request after successful payment
    const { messages, modelId = DEFAULT_MODEL, reasoningEffort } = body

    // Get or create user for message persistence (bypass uses wallet address)
    let bypassUserId: string | undefined
    let bypassChatId = body.chatId
    try {
      const { findOrCreateUser } = await import(
        "@/lib/db/services/user.service"
      )
      const walletAddress = body.walletAddress?.toLowerCase()
      if (walletAddress) {
        const user = await findOrCreateUser({ walletAddress })
        bypassUserId = user.id

        // Persist user message (already persisted during paid flow, but ensure chatId is set)
        if (!bypassChatId) {
          bypassChatId = await persistUserMessage(
            user.id,
            body.chatId,
            body.messages,
            body.modelId || DEFAULT_MODEL
          )
          console.log("💾 Bypass message persisted to chat:", bypassChatId)
        }
      }
    } catch (dbError) {
      console.error("Failed to persist bypass message:", dbError)
    }

    // Get available models
    const [models] = await Promise.all([getAvailableModels()])
    const model = models.find((model) => model.id === modelId)
    if (!model) {
      return NextResponse.json(
        { error: `Model ${modelId} not found.` },
        { status: 400 }
      )
    }

    // Return the same response format as the paid flow
    return createUIMessageStreamResponse({
      stream: createUIMessageStream({
        originalMessages: messages,
        execute: ({ writer }) => {
          createStreamingResponse(
            messages,
            modelId,
            model,
            reasoningEffort,
            bypassChatId,
            writer
          )
        },
      }),
    })
  }

  // ===== FREE MESSAGE CHECK =====
  // Check if this is a free message (client-side determined via localStorage)
  if (body.isFreeMessage === true) {
    console.log("🆓 Processing free message (bypassing payment)")

    // Track free message in database and persist chat/message
    let userId: string | undefined
    try {
      const { incrementFreeMessageCount } = await import(
        "@/lib/db/services/free-message.service"
      )
      const { findOrCreateUser } = await import(
        "@/lib/db/services/user.service"
      )
      const walletAddress = body.walletAddress?.toLowerCase()
      if (walletAddress) {
        await incrementFreeMessageCount(walletAddress)
        console.log("💾 Free message tracked in database")

        // Get or create user for message persistence
        const user = await findOrCreateUser({ walletAddress })
        userId = user.id
      }
    } catch (dbError) {
      console.error("Failed to track free message in database:", dbError)
    }

    // Persist user message to database
    let freeMsgChatId = body.chatId
    if (userId) {
      try {
        freeMsgChatId = await persistUserMessage(
          userId,
          body.chatId,
          body.messages,
          body.modelId || DEFAULT_MODEL
        )
        console.log("💾 Free message persisted to chat:", freeMsgChatId)
      } catch (msgError) {
        console.error("Failed to persist user message:", msgError)
      }
    }

    const [models] = await Promise.all([getAvailableModels()])
    const {
      messages,
      modelId = DEFAULT_MODEL,
      reasoningEffort,
    } = body as BodyData

    const model = models.find((model) => model.id === modelId)
    if (!model) {
      return NextResponse.json(
        { error: `Model ${modelId} not found.` },
        { status: 400 }
      )
    }

    return createUIMessageStreamResponse({
      stream: createUIMessageStream({
        originalMessages: messages,
        execute: ({ writer }) => {
          createStreamingResponse(
            messages,
            modelId,
            model,
            reasoningEffort,
            freeMsgChatId,
            writer
          )
        },
      }),
    })
  }

  // ===== X402 PAYMENT VERIFICATION =====
  // Get selected payment token from header or body
  const paymentTokenHeader = req.headers.get("X-Payment-Token") as PaymentToken
  const paymentToken = paymentTokenHeader || body.paymentToken || "USDC"

  // Create route config based on selected token
  const chatRouteConfig = createChatRouteConfig(paymentToken)

  // Extract payment header from request
  const paymentHeader = x402Handler.extractPayment(req.headers)

  // Get full URL for resource field
  const url = new URL(req.url)
  const fullResourceUrl = `${url.origin}/api/chat`

  // Create payment requirements
  const paymentRequirements = await x402Handler.createPaymentRequirements(
    chatRouteConfig,
    fullResourceUrl
  )

  // If no payment header, return 402 Payment Required
  if (!paymentHeader) {
    const response402 = x402Handler.create402Response(paymentRequirements)
    return NextResponse.json(response402.body, { status: response402.status })
  }

  // Verify payment with facilitator
  const verifyResult = await x402Handler.verifyPayment(
    paymentHeader,
    paymentRequirements
  )

  if (!verifyResult.isValid) {
    return NextResponse.json(
      {
        error: "Payment verification failed",
        reason: verifyResult.invalidReason,
      },
      { status: 402 }
    )
  }

  // Settle payment (execute the transaction on blockchain)
  const settleResult = await x402Handler.settlePayment(
    paymentHeader,
    paymentRequirements
  )

  if (!settleResult.success) {
    return NextResponse.json(
      {
        error: "Payment settlement failed",
        reason: settleResult.errorReason,
      },
      { status: 402 }
    )
  }

  // Payment successful! Log transaction details
  console.log("✅ Payment verified and settled:", {
    transaction: settleResult.transaction,
    network: settleResult.network,
    token: paymentToken,
  })

  // ===== PERSIST PAYMENT TO DATABASE =====
  // Import payment service at the top of the file if not already imported
  // Store payment transaction in database
  let paymentId: string | undefined
  let userId: string | undefined
  try {
    const { findOrCreateUser } = await import("@/lib/db/services/user.service")
    const { findOrCreatePayment } = await import(
      "@/lib/db/services/payment.service"
    )

    // Get or create user (wallet address should be in body)
    const walletAddress = body.walletAddress?.toLowerCase()
    if (walletAddress) {
      const user = await findOrCreateUser({ walletAddress })
      userId = user.id

      // Create payment record
      const payment = await findOrCreatePayment({
        userId: user.id,
        walletAddress,
        transactionSignature: settleResult.transaction || "unknown",
        network: settleResult.network || paymentRequirements.network,
        token: paymentToken,
        amount:
          paymentRequirements.maxAmountRequired || chatRouteConfig.price.amount,
        resourceUrl: fullResourceUrl,
        facilitatorResponse: {
          verified: verifyResult,
          settled: settleResult,
        },
      })

      if (payment) {
        paymentId = payment.id
      }

      console.log("💾 Payment persisted to database")
    }
  } catch (dbError) {
    // Log error but don't fail the request - payment was successful
    console.error("Failed to persist payment to database:", dbError)
  }

  // ===== PERSIST USER MESSAGE TO DATABASE =====
  let persistedChatId = body.chatId
  if (userId) {
    try {
      persistedChatId = await persistUserMessage(
        userId,
        body.chatId,
        body.messages,
        body.modelId || DEFAULT_MODEL,
        paymentId
      )
      console.log("💾 User message persisted to chat:", persistedChatId)
    } catch (msgError) {
      console.error("Failed to persist user message:", msgError)
    }
  }
  // ===== END X402 PAYMENT VERIFICATION =====

  const [models] = await Promise.all([getAvailableModels()])
  const {
    messages,
    modelId = DEFAULT_MODEL,
    reasoningEffort,
  } = body as BodyData

  const model = models.find((model) => model.id === modelId)
  if (!model) {
    return NextResponse.json(
      { error: `Model ${modelId} not found.` },
      { status: 400 }
    )
  }

  return createUIMessageStreamResponse({
    stream: createUIMessageStream({
      originalMessages: messages,
      execute: ({ writer }) => {
        createStreamingResponse(
          messages,
          modelId,
          model,
          reasoningEffort,
          persistedChatId,
          writer
        )
      },
    }),
  })
}
