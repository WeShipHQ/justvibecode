export enum Models {
  GoogleGeminiFlash = "google/gemini-2.5-flash",
  Gemini20FlashExp = "gemini-2.0-flash-exp",
  Gemini15Pro = "gemini-1.5-pro",
  Gemini15Flash = "gemini-1.5-flash",
}

export const DEFAULT_MODEL = Models.GoogleGeminiFlash

export const SUPPORTED_MODELS: string[] = [
  Models.GoogleGeminiFlash,
  Models.Gemini20FlashExp,
  Models.Gemini15Pro,
  Models.Gemini15Flash,
]

export const TEST_PROMPTS = [
  "Generate a Next.js app that allows to list and search Pokemons",
  'Create a `golang` server that responds with "Hello World" to any request',
]
