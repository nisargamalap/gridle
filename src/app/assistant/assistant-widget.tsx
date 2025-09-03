"use client"

import { useState, useMemo } from "react"
import { useSpeechRecognition } from "./use-speech"

type Mode = "chat" | "spellcheck" | "format" | "summary-translate"

type Message = {
  role: "user" | "assistant"
  content: string
}

async function callAssistantAPI(params: {
  mode: Mode
  text: string
  language?: string
  style?: string
  extra?: Record<string, unknown>
}) {
  const res = await fetch("/api/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  })
  const ctype = res.headers.get("content-type") || ""
  if (!res.ok || !ctype.includes("application/json")) {
    throw new Error(`Assistant API error: ${res.status}`)
  }
  return (await res.json()) as any
}

export default function AssistantWidget({ position = "fixed" }: { position?: "fixed" | "inline" }) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>("chat")
  const [input, setInput] = useState("")
  const [language, setLanguage] = useState("en")
  const [style, setStyle] = useState("concise professional")
  const [busy, setBusy] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])

  const { supported, listening, transcript, error, start, stop, reset } = useSpeechRecognition()

  const micLabel = useMemo(() => {
    if (!supported) return "Mic unsupported"
    return listening ? "Stop" : "Speak"
  }, [supported, listening])

  const handleSubmit = async () => {
    if (!input.trim() && !transcript.trim()) return
    const text = (input || transcript).trim()
    setMessages((m) => [...m, { role: "user", content: text }])
    setBusy(true)
    try {
      const { data } = await callAssistantAPI({ mode, text, language, style })
      let content = ""
      if (mode === "chat") {
        content = String(data)
      } else if (mode === "summary-translate") {
        content = [
          "Summary:",
          ...(Array.isArray((data as any).bullets) ? (data as any).bullets.map((b: string) => `• ${b}`) : []),
          "",
          `Translation (${(data as any).lang || language}):`,
          String((data as any).translation ?? (data as any).raw ?? ""),
        ].join("\n")
      } else if (mode === "spellcheck") {
        content = `Corrected:\n${(data as any).correctedText ?? (data as any).raw ?? ""}\n\nChanges:\n${(data as any).changesSummary ?? ""}`
      } else if (mode === "format") {
        content = `Rewritten (${(data as any).style || style}):\n${(data as any).rewrittenText ?? (data as any).raw ?? ""}\n\nTips:\n${(data as any).tips ?? ""}`
      }
      setMessages((m) => [...m, { role: "assistant", content }])
      reset()
      setInput("")
    } catch (e: any) {
      setMessages((m) => [...m, { role: "assistant", content: `Error: ${e.message}` }])
    } finally {
      setBusy(false)
    }
  }

  const isInline = position === "inline"

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        aria-label="Open Assistant"
        onClick={() => setOpen((v) => !v)}
        className={
          isInline
            ? "relative z-40 rounded-md bg-blue-600 text-white shadow hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-600 h-8 w-8 flex items-center justify-center"
            : "fixed bottom-4 right-4 z-50 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-600 h-12 w-12 flex items-center justify-center"
        }
      >
        {/* Simple chat icon */}
        <svg
          viewBox="0 0 24 24"
          className={isInline ? "h-4 w-4" : "h-6 w-6"}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
        </svg>
      </button>

      {/* Panel */}
      {open && (
        <div
          className={
            isInline
              ? "absolute right-0 top-10 z-50 w-[22rem] max-w-[calc(100vw-2rem)] rounded-lg border bg-background shadow-xl"
              : "fixed bottom-20 right-4 z-50 w-[22rem] max-w-[calc(100vw-2rem)] rounded-lg border bg-background shadow-xl"
          }
        >
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <div className="text-sm font-medium">Assistant</div>
            <div className="flex items-center gap-2">
              <select
                aria-label="Mode"
                value={mode}
                onChange={(e) => setMode(e.target.value as Mode)}
                className="rounded border bg-background px-2 py-1 text-xs"
              >
                <option value="chat">Chat</option>
                <option value="spellcheck">Autocorrect</option>
                <option value="format">Autoformat Style</option>
                <option value="summary-translate">Summarize + Translate</option>
              </select>
              {mode === "summary-translate" && (
                <select
                  aria-label="Language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="rounded border bg-background px-2 py-1 text-xs"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="ar">Arabic</option>
                  <option value="hi">Hindi</option>
                  <option value="zh">Chinese</option>
                </select>
              )}
              {mode === "format" && (
                <select
                  aria-label="Style"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="rounded border bg-background px-2 py-1 text-xs"
                >
                  <option value="concise professional">Concise professional</option>
                  <option value="friendly casual">Friendly casual</option>
                  <option value="formal business">Formal business</option>
                  <option value="bullet points">Bullet points</option>
                </select>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto p-3 space-y-2">
            {messages.length === 0 && (
              <div className="text-xs text-muted-foreground">Ask something or use a mode to transform your text.</div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`text-sm whitespace-pre-wrap ${m.role === "assistant" ? "text-foreground" : "text-foreground"}`}
              >
                <span className="mr-1 text-xs text-muted-foreground">{m.role === "assistant" ? "AI" : "You"}:</span>
                {m.content}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 p-3 border-t">
            <textarea
              value={input || transcript}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type or use the mic..."
              className="flex-1 resize-none rounded border px-2 py-2 text-sm leading-5"
              rows={2}
            />
            <div className="flex flex-col items-stretch gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={handleSubmit}
                className="rounded bg-blue-600 text-white px-3 py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {busy ? "Working..." : "Send"}
              </button>
              <button
                type="button"
                disabled={!supported}
                onClick={listening ? stop : start}
                className="rounded border px-3 py-1.5 text-xs hover:bg-accent"
                aria-label={micLabel}
                title={supported ? micLabel : "Speech recognition not supported in this browser"}
              >
                {supported ? (listening ? "Stop" : "Mic") : "No Mic"}
              </button>
              {error && <span className="text-[10px] text-red-600">{error}</span>}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
