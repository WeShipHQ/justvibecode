export enum Models {
  GoogleGeminiFlash = "google/gemini-2.5-flash",
  Gemini20FlashExp = "gemini-2.0-flash-exp",
  Gemini15Pro = "google/gemini-2.5-pro",
  Gemini15Flash = "gemini-1.5-flash",
  // GPT4oMini = "openai/gpt-4o-mini",
  GPT4oMini = "openai/gpt-4o-mini",
}

export const DEFAULT_MODEL = Models.Gemini15Pro

export const SUPPORTED_MODELS: string[] = [
  Models.GoogleGeminiFlash,
  Models.Gemini20FlashExp,
  Models.Gemini15Pro,
  Models.Gemini15Flash,
  Models.GPT4oMini,
]

export const TEST_PROMPTS = [
  "Generate a Next.js app that allows to list and search Pokemons",
  'Create a `golang` server that responds with "Hello World" to any request',
]
