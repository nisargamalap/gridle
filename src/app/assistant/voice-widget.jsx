"use client"

import { useState, useRef } from "react"

export default function VoiceWidget({ position, onResult }) {
  const [isRecording, setIsRecording] = useState(false)
  const [result, setResult] = useState("")
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: "audio/webm" })
    chunksRef.current = []

    mediaRecorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" })
      const formData = new FormData()
      formData.append("audio", blob, "input.webm")

      const res = await fetch("/api/translate", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      const text = data.translation || data.text || "No result"

      setResult(text)          // local display
      onResult?.(text)         // 🔹 notify parent (page.jsx)
    }

    mediaRecorderRef.current.start()
    setIsRecording(true)
  }

  const stopRecording = () => {
    mediaRecorderRef.current.stop()
    setIsRecording(false)
  }

  return (
    <div className={`flex flex-col items-${position} gap-2`}>
      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`px-3 py-2 rounded-lg text-sm font-medium ${
          isRecording ? "bg-red-500 text-white" : "bg-primary text-primary-foreground"
        }`}
      >
        {isRecording ? "Stop" : "Speak"}
      </button>

      {result && (
        <p className="text-xs text-muted-foreground max-w-[200px] truncate">
          {result}
        </p>
      )}
    </div>
  )
}
