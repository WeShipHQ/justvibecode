import { DEFAULT_MODEL } from "@/ai/constants"
import { getModelOptions } from "@/ai/gateway"
import { linesSchema, resultSchema } from "@/components/error-monitor/schemas"
import { generateObject } from "ai"
import { checkBotId } from "botid/server"
import { NextResponse } from "next/server"
import prompt from "./prompt.md"

export async function POST(req: Request) {
  // const checkResult = await checkBotId()
  // if (checkResult.isBot) {
  //   return NextResponse.json({ error: `Bot detected` }, { status: 403 })
  // }

  const body = await req.json()
  const parsedBody = linesSchema.safeParse(body)
  if (!parsedBody.success) {
    return NextResponse.json({ error: `Invalid request` }, { status: 400 })
  }

  const result = await generateObject({
    ...getModelOptions(DEFAULT_MODEL),
    system: prompt,
    messages: [{ role: "user", content: JSON.stringify(parsedBody.data) }],
    schema: resultSchema,
  })

  return NextResponse.json(result.object, {
    status: 200,
  })
}
