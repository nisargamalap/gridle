"use client"

import { useEffect, useRef, useState } from "react"

const VoiceWidget = ({ position = "inline", onResult }) => {
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      console.warn("Web Speech API is not supported in this browser.")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = "en-US" // 👈 change this to "hi-IN", "fr-FR", etc. for multilingual
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      if (onResult) onResult(transcript)
      setIsListening(false)
    }

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
  }, [onResult])

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition not supported in this browser.")
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  return (
    <button
      onClick={toggleListening}
      className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
        isListening ? "bg-red-500 text-white" : "bg-secondary text-secondary-foreground"
      }`}
    >
      {isListening ? "Listening..." : "🎤 Speak"}
    </button>
  )
}

export default VoiceWidget
