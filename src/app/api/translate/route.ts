import { pipeline } from "@xenova/transformers"
import decodeAudio from "audio-decode"
import webmToWav from "webm-to-wav-converter"  // ✅ add this

let translator: any

async function getTranslator() {
  if (!translator) {
    translator = await pipeline(
      "automatic-speech-recognition",
      "Xenova/s2t-medium-mustc-multilingual-st"
    )
  }
  return translator
}

export async function POST(req: Request) {
  const data = await req.formData()
  const file = data.get("audio") as File | null

  if (!file) {
    return new Response(JSON.stringify({ error: "No audio uploaded" }), { status: 400 })
  }

  // 🔹 Read WebM audio
  const arrayBuffer = await file.arrayBuffer()
  const webmBuffer = Buffer.from(arrayBuffer)

  // 🔹 Convert WebM → WAV
  const wavBuffer = await webmToWav(webmBuffer)

  // 🔹 Decode WAV into PCM
  const audioBuffer = await decodeAudio(wavBuffer)
  const pcm = audioBuffer.getChannelData(0)

  // 🔹 Run ASR
  const transcriber = await getTranslator()
  const output = await transcriber(pcm, {
    generation_kwargs: { forced_bos_token_id: 1 }, // French
  })

  return new Response(JSON.stringify({ text: output.text }), { status: 200 })
}
