"use client"

import React from "react"

function cx(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ")
}

export default function VoiceWidget({
  buttonLabel = "Voice to Text",
  position = "inline", // "inline" | "floating"
  language, // optional BCP-47 tag e.g. "en", "hi", "es"
}: {
  buttonLabel?: string
  position?: "inline" | "floating"
  language?: string
}) {
  const [recording, setRecording] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string>("")
  const [transcript, setTranscript] = React.useState<string>("")

  const mediaRef = React.useRef<MediaRecorder | null>(null)
  const chunksRef = React.useRef<BlobPart[]>([])
  const streamRef = React.useRef<MediaStream | null>(null)

  React.useEffect(() => {
    return () => {
      if (mediaRef.current && mediaRef.current.state !== "inactive") mediaRef.current.stop()
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
    }
  }, [])

  async function start() {
    setError("")
    setTranscript("")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : ""
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      chunksRef.current = []
      mr.ondataavailable = (e) => e.data && e.data.size > 0 && chunksRef.current.push(e.data)
      mr.onstop = async () => {
        try {
          setBusy(true)
          const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" })
          const file = new File([blob], "recording.webm", { type: blob.type })
          const form = new FormData()
          form.append("file", file)
          if (language) form.append("language", language)

          const res = await fetch("/api/transcribe", { method: "POST", body: form })
          if (!res.ok) {
            const data = await res.json().catch(() => ({}))
            throw new Error(data?.error || `HTTP ${res.status}`)
          }
          const data = await res.json()
          setTranscript(data?.text || "")
        } catch (e: any) {
          setError(e?.message || "Transcription error")
        } finally {
          setBusy(false)
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop())
            streamRef.current = null
          }
        }
      }
      mediaRef.current = mr
      mr.start()
      setRecording(true)
    } catch (e: any) {
      setError(e?.message || "Microphone permission denied")
    }
  }

  function stop() {
    if (mediaRef.current && mediaRef.current.state !== "inactive") mediaRef.current.stop()
    setRecording(false)
  }

  return (
    <div className={cx(position === "floating" ? "fixed bottom-5 right-5 z-50" : "inline-flex flex-col gap-2")}>
      <div className={cx("flex items-center gap-2 rounded-lg border bg-background/70 backdrop-blur px-3 py-2 shadow")}>
        <button
          type="button"
          onClick={recording ? stop : start}
          disabled={busy}
          className={cx(
            "rounded-md px-3 py-1.5 text-sm font-medium text-white transition-colors",
            recording ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700",
            busy && "opacity-70 cursor-not-allowed",
          )}
          aria-pressed={recording}
        >
          {recording ? "Stop" : buttonLabel}
        </button>
        <span className="text-xs text-muted-foreground">
          {busy ? "Transcribing…" : recording ? "Recording…" : "Ready"}
        </span>
      </div>

      {error && <div className="text-xs text-red-600">{error}</div>}

      {transcript && (
        <div className="max-w-[32rem] whitespace-pre-wrap rounded-md border bg-card p-3 text-sm text-foreground shadow-sm">
          {transcript}
        </div>
      )}
    </div>
  )
}
