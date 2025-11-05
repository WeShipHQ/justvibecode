import { createGoogleGenerativeAI } from "@ai-sdk/google"
import type { LanguageModel } from "ai"
import { Models } from "./constants"

const google = createGoogleGenerativeAI({
  apiKey:
    process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY,
})

export async function getAvailableModels() {
  // Return Gemini models directly
  return [
    // { id: Models.GoogleGeminiFlash, name: "Gemini 2.5 Flash" },
    { id: "gemini-2.0-flash-exp", name: "Gemini 2.0 Flash Experimental" },
    // { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro" },
    // { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash" },
  ]
}

export interface ModelOptions {
  model: LanguageModel
}

export function getModelOptions(
  modelId: string,
  options?: { reasoningEffort?: "low" | "medium" }
): ModelOptions {
  // Default to Gemini Flash if model not found
  const geminiModelId =
    modelId === Models.GoogleGeminiFlash ? "gemini-2.0-flash-exp" : modelId

  return {
    model: google(geminiModelId),
  }
}
