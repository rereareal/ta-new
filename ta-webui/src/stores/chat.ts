import { computed, ref } from "vue";
import { defineStore } from "pinia";

import { createSession, listMessages, sendMessage } from "@/api/agent.ts";
import type { ChatMessage } from "@/types/index.ts";
import { errorMessage } from "@/utils/errors.ts";

const VOICE_KEY = "ta.voice";

function loadVoiceEnabled(): boolean {
  const stored = localStorage.getItem(VOICE_KEY);
  return stored === null ? true : stored === "true";
}

export const useChatStore = defineStore("chat", () => {
  const messages = ref<ChatMessage[]>([]);
  const sessionId = ref<string | null>(null);
  const sending = ref(false);
  const initialized = ref(false);
  const error = ref<string | null>(null);
  const courseId = ref<string | null>(null);
  const unitId = ref<string | null>(null);
  const voiceEnabled = ref(loadVoiceEnabled());

  const lastAssistantMessage = computed(() =>
    [...messages.value].reverse().find((message) => message.role === "assistant"),
  );

  async function init(nextCourseId: string | null, nextUnitId: string | null): Promise<void> {
    setContext(nextCourseId, nextUnitId);

    if (initialized.value) {
      return;
    }

    initialized.value = true;
    error.value = null;

    try {
      const created = await createSession(nextCourseId);
      sessionId.value = created.id;
      messages.value = await listMessages(created.id, {
        courseId: nextCourseId,
        unitId: nextUnitId,
      });
    } catch (cause) {
      error.value = errorMessage(cause);
    }
  }

  function setContext(nextCourseId: string | null, nextUnitId: string | null): void {
    courseId.value = nextCourseId;
    unitId.value = nextUnitId;
  }

  function setVoiceEnabled(enabled: boolean): void {
    voiceEnabled.value = enabled;
    localStorage.setItem(VOICE_KEY, String(enabled));
  }

  async function send(text: string): Promise<ChatMessage | null> {
    const content = text.trim();
    if (content.length === 0 || sending.value) {
      return null;
    }

    let currentSessionId = sessionId.value;

    if (currentSessionId === null) {
      try {
        const created = await createSession(courseId.value);
        currentSessionId = created.id;
        sessionId.value = currentSessionId;
      } catch (cause) {
        error.value = errorMessage(cause);
        return null;
      }
    }

    messages.value.push({
      id: crypto.randomUUID(),
      role: "user",
      content,
      created_at: new Date().toISOString(),
    });

    sending.value = true;
    error.value = null;

    try {
      const reply = await sendMessage(currentSessionId, content, {
        courseId: courseId.value,
        unitId: unitId.value,
      });
      messages.value.push(reply.message);
      return reply.message;
    } catch (cause) {
      error.value = errorMessage(cause);
      return null;
    } finally {
      sending.value = false;
    }
  }

  async function reset(): Promise<void> {
    messages.value = [];
    sessionId.value = null;
    error.value = null;
    initialized.value = false;
    await init(courseId.value, unitId.value);
  }

  function clear(): void {
    messages.value = [];
    sessionId.value = null;
    sending.value = false;
    initialized.value = false;
    error.value = null;
    courseId.value = null;
    unitId.value = null;
  }

  return {
    messages,
    sessionId,
    sending,
    error,
    courseId,
    unitId,
    voiceEnabled,
    lastAssistantMessage,
    init,
    setContext,
    setVoiceEnabled,
    send,
    reset,
    clear,
  };
});
