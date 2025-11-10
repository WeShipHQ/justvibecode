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

interface BodyData {
  messages: ChatUIMessage[]
  modelId?: string
  reasoningEffort?: "low" | "medium"
  paymentToken?: PaymentToken
  walletAddress?: string // Add wallet address to body for free message tracking
  isFreeMessage?: boolean // Flag to bypass payment for free messages
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
          })
          result.consumeStream()
          writer.merge(
            result.toUIMessageStream({
              sendReasoning: true,
              sendStart: false,
              messageMetadata: () => ({
                model: model.name,
              }),
            })
          )
        },
      }),
    })
  }

  // ===== FREE MESSAGE CHECK =====
  // Check if this is a free message (client-side determined via localStorage)
  if (body.isFreeMessage === true) {
    console.log("🆓 Processing free message (bypassing payment)")

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
          })
          result.consumeStream()
          writer.merge(
            result.toUIMessageStream({
              sendReasoning: true,
              sendStart: false,
              messageMetadata: () => ({
                model: model.name,
              }),
            })
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
        })
        result.consumeStream()
        writer.merge(
          result.toUIMessageStream({
            sendReasoning: true,
            sendStart: false,
            messageMetadata: () => ({
              model: model.name,
            }),
          })
        )
      },
    }),
  })
}
