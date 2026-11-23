import { onBeforeUnmount, ref } from "vue";

import { speechProvider, transcribe } from "@/api/speech.ts";
import { errorMessage } from "@/utils/errors.ts";

const MAX_SECONDS = 120;

export type RecorderState = "idle" | "recording" | "processing";

interface RecognitionResultLike {
  readonly 0: { readonly transcript: string };
  readonly isFinal: boolean;
}

interface RecognitionEventLike {
  readonly results: {
    readonly length: number;
    readonly [index: number]: RecognitionResultLike;
  };
}

interface RecognitionErrorLike {
  readonly error: string;
}

interface RecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: RecognitionEventLike) => void) | null;
  onerror: ((event: RecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type RecognitionConstructor = new () => RecognitionLike;

interface SpeechWindow {
  SpeechRecognition?: RecognitionConstructor;
  webkitSpeechRecognition?: RecognitionConstructor;
}

function recognitionError(code: string): string {
  if (code === "not-allowed" || code === "service-not-allowed") {
    return "麦克风权限被拒绝，请在浏览器设置里允许";
  }
  if (code === "no-speech") {
    return "没有听到声音，再试一次";
  }
  if (code === "network") {
    return "语音识别服务不可用";
  }
  return `语音识别失败：${code}`;
}

export function useRecorder(onResult: (text: string) => void) {
  const state = ref<RecorderState>("idle");
  const seconds = ref(0);
  const error = ref<string | null>(null);

  let mediaRecorder: MediaRecorder | null = null;
  let stream: MediaStream | null = null;
  let chunks: BlobPart[] = [];
  let recognition: RecognitionLike | null = null;
  let timer: number | null = null;
  let startedAt = 0;

  const speechWindow = window as unknown as SpeechWindow;
  const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
  const useBrowserRecognition = speechProvider() === "browser";
  const supported = useBrowserRecognition
    ? Recognition !== undefined
    : typeof navigator.mediaDevices?.getUserMedia === "function" &&
      typeof MediaRecorder !== "undefined";

  function clearTimer(): void {
    if (timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  function startTimer(): void {
    startedAt = Date.now();
    seconds.value = 0;
    timer = window.setInterval(() => {
      seconds.value = Math.floor((Date.now() - startedAt) / 1000);
      if (seconds.value >= MAX_SECONDS) {
        void stop();
      }
    }, 250);
  }

  function stopTracks(): void {
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
  }

  async function startMediaRecorder(): Promise<void> {
    if (typeof navigator.mediaDevices?.getUserMedia !== "function") {
      throw new Error("当前浏览器不支持录音");
    }
    if (typeof MediaRecorder === "undefined") {
      throw new Error("当前浏览器不支持 MediaRecorder");
    }

    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
    });

    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "";
    mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    chunks = [];
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    mediaRecorder.start();
    state.value = "recording";
    startTimer();
  }

  function stopMediaRecorder(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!mediaRecorder || mediaRecorder.state === "inactive") {
        resolve(new Blob(chunks, { type: "audio/webm" }));
        return;
      }

      mediaRecorder.onstop = () => {
        resolve(new Blob(chunks, { type: mediaRecorder?.mimeType || "audio/webm" }));
      };
      mediaRecorder.stop();
    });
  }

  function startRecognition(): void {
    if (!Recognition) {
      throw new Error("当前浏览器不支持语音识别，请直接输入文字");
    }

    recognition = new Recognition();
    recognition.lang = "zh-CN";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const text = event.results[0]?.[0]?.transcript?.trim() ?? "";
      if (text.length > 0) {
        onResult(text);
      }
    };
    recognition.onerror = (event) => {
      error.value = recognitionError(event.error);
    };
    recognition.onend = () => {
      recognition = null;
      clearTimer();
      seconds.value = 0;
      state.value = "idle";
    };
    recognition.start();
    state.value = "recording";
    startTimer();
  }

  async function stop(): Promise<void> {
    if (state.value === "processing") {
      return;
    }

    if (state.value === "idle") {
      return;
    }

    if (useBrowserRecognition) {
      recognition?.stop();
      return;
    }

    if (!mediaRecorder) {
      return;
    }

    state.value = "processing";
    clearTimer();

    const blob = await stopMediaRecorder();
    stopTracks();

    try {
      const text = await transcribe(blob);
      if (text.trim().length > 0) {
        onResult(text.trim());
      }
    } catch (cause) {
      error.value = errorMessage(cause, "录音失败");
    } finally {
      mediaRecorder = null;
      chunks = [];
      seconds.value = 0;
      state.value = "idle";
    }
  }

  async function toggle(): Promise<void> {
    if (state.value === "processing") {
      return;
    }

    error.value = null;

    if (state.value === "recording") {
      await stop();
      return;
    }

    try {
      if (useBrowserRecognition) {
        startRecognition();
      } else {
        await startMediaRecorder();
      }
    } catch (cause) {
      error.value = errorMessage(cause, "录音失败");
      stopTracks();
      state.value = "idle";
    }
  }

  onBeforeUnmount(() => {
    clearTimer();
    recognition?.abort();
    recognition = null;
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
    mediaRecorder = null;
    stopTracks();
  });

  return { state, seconds, error, supported, toggle };
}
