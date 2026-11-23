import { onBeforeUnmount, ref } from "vue";

import { speechProvider, synthesize } from "@/api/speech.ts";
import { errorMessage } from "@/utils/errors.ts";

const MAX_SPEAK_LENGTH = 1_500;

function plainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`|~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_SPEAK_LENGTH);
}

export function useTts() {
  const playingId = ref<string | null>(null);
  const loadingId = ref<string | null>(null);
  const error = ref<string | null>(null);

  let audio: HTMLAudioElement | null = null;
  let objectUrl: string | null = null;

  function cleanupAudio(): void {
    if (audio) {
      audio.pause();
      audio.src = "";
      audio = null;
    }
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = null;
    }
  }

  function stop(): void {
    cleanupAudio();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    playingId.value = null;
    loadingId.value = null;
  }

  function speakInBrowser(id: string, text: string): void {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      error.value = "当前浏览器不支持语音合成";
      return;
    }

    stop();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = 1;
    utterance.onend = () => {
      if (playingId.value === id) {
        playingId.value = null;
      }
    };
    utterance.onerror = () => {
      error.value = "语音合成失败";
      playingId.value = null;
    };

    playingId.value = id;
    window.speechSynthesis.speak(utterance);
  }

  async function speak(id: string, markdown: string): Promise<void> {
    if (playingId.value === id) {
      stop();
      return;
    }

    const text = plainText(markdown);
    if (text.length === 0) {
      return;
    }

    stop();
    error.value = null;

    if (speechProvider() === "browser") {
      speakInBrowser(id, text);
      return;
    }

    loadingId.value = id;

    try {
      const blob = await synthesize(text);
      objectUrl = URL.createObjectURL(blob);
      audio = new Audio(objectUrl);
      audio.onended = () => {
        playingId.value = null;
        cleanupAudio();
      };
      audio.onerror = () => {
        error.value = "音频播放失败";
        stop();
      };
      await audio.play();
      playingId.value = id;
    } catch (cause) {
      error.value = errorMessage(cause, "语音合成失败");
      playingId.value = null;
      cleanupAudio();
    } finally {
      loadingId.value = null;
    }
  }

  onBeforeUnmount(stop);

  return { playingId, loadingId, error, speak, stop };
}
