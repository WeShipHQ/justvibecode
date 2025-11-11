import type { InferUITools, UIMessage, UIMessageStreamWriter } from "ai"
import type { DataPart } from "../messages/data-parts"
import { addPaymentGate } from "./add-payment-gate"
import { createSandbox } from "./create-sandbox"
import { generateFiles } from "./generate-files"
import { getSandboxURL } from "./get-sandbox-url"
import { runCommand } from "./run-command"

interface Params {
  modelId: string
  writer: UIMessageStreamWriter<UIMessage<never, DataPart>>
  userId?: string
  chatId?: string
}

export function tools({ modelId, writer, userId, chatId }: Params) {
  return {
    createSandbox: createSandbox({ writer, userId, chatId }),
    generateFiles: generateFiles({ writer, modelId }),
    getSandboxURL: getSandboxURL({ writer }),
    runCommand: runCommand({ writer }),
    addPaymentGate: addPaymentGate({ writer }),
  }
}

export type ToolSet = InferUITools<ReturnType<typeof tools>>
