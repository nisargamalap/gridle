import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(req: Request) {
  const started = Date.now()
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.log("[v0][assistant] Missing GEMINI_API_KEY")
      return NextResponse.json(
        { error: "Server not configured: GEMINI_API_KEY is missing" },
        { status: 500, headers: { "Cache-Control": "no-store" } },
      )
    }

    // Parse request
    const { message, history } = await req.json().catch(() => ({}))
    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Invalid payload. Expected { message: string }" },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      )
    }

    // Basic logging for debugging in v0
    console.log("[v0][assistant] Incoming:", {
      message: message.slice(0, 200),
      hasHistory: Array.isArray(history) && history.length > 0,
    })

    const modelId = process.env.GEMINI_MODEL_ID || "gemini-1.5-flash"
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: modelId })

    // Simple prompt composition; if you later want history, you can stitch it in
    const result = await model.generateContent(message)
    const text = result.response.text()

    console.log("[v0][assistant] Response(ms, model):", {
      ms: Date.now() - started,
      model: modelId,
      preview: text.slice(0, 200),
    })

    return NextResponse.json({ text }, { status: 200, headers: { "Cache-Control": "no-store" } })
  } catch (err: any) {
    console.log("[v0][assistant] ERROR:", {
      ms: Date.now() - started,
      message: err?.message,
    })
    return NextResponse.json(
      { error: `Assistant API error: ${err?.message || "unknown"}` },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    )
  }
}