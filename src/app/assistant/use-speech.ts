"use client"

import { useCallback, useEffect, useRef, useState } from "react"

type SpeechHook = {
  supported: boolean
  listening: boolean
  transcript: string
  error: string | null
  start: () => void
  stop: () => void
  reset: () => void
}

export function useSpeechRecognition(lang = "en-US"): SpeechHook {
  const [supported, setSupported] = useState<boolean>(false)
  const [listening, setListening] = useState<boolean>(false)
  const [transcript, setTranscript] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    const SR =
      typeof window !== "undefined"
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null
    if (SR) {
      const recog = new SR()
      recog.lang = lang // initialize with provided language
      recog.continuous = true
      recog.interimResults = true
      recog.onresult = (e: any) => {
        let text = ""
        for (let i = e.resultIndex; i < e.results.length; i++) {
          text += e.results[i][0].transcript
        }
        setTranscript(text)
      }
      recog.onerror = (e: any) => {
        setError(e?.error ?? "speech error")
        setListening(false)
      }
      recog.onend = () => setListening(false)
      recognitionRef.current = recog
      setSupported(true)
    } else {
      setSupported(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // keep init once

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = lang
    }
  }, [lang])

  const start = useCallback(() => {
    if (!recognitionRef.current) return
    setError(null)
    setTranscript("")
    recognitionRef.current.start()
    setListening(true)
  }, [])

  const stop = useCallback(() => {
    if (!recognitionRef.current) return
    recognitionRef.current.stop()
    setListening(false)
  }, [])

  const reset = useCallback(() => setTranscript(""), [])

  return { supported, listening, transcript, error, start, stop, reset }
}
