import { demoMode } from "@/config.ts";
import type { Transcript } from "@/types/index.ts";
import { requestBlob, requestForm } from "./client.ts";

export type SpeechProvider = "backend" | "browser";

export function speechProvider(): SpeechProvider {
  return demoMode ? "browser" : "backend";
}

export async function transcribe(audio: Blob): Promise<string> {
  const form = new FormData();
  form.append("audio", audio, "recording.webm");
  const result = await requestForm<Transcript>("/speech/stt", form);
  return result.text;
}

export function synthesize(text: string): Promise<Blob> {
  return requestBlob("/speech/tts", { method: "POST", body: { text } });
}
