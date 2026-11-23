<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";

import AppIcon, { type IconName } from "@/components/ui/AppIcon.vue";
import type { RecorderState } from "@/composables/useRecorder.ts";

const props = defineProps<{
  modelValue: string;
  sending: boolean;
  recorderState: RecorderState;
  seconds: number;
  supported: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
  send: [];
  toggleRecording: [];
}>();

const textarea = ref<HTMLTextAreaElement | null>(null);

function resize(): void {
  const element = textarea.value;
  if (!element) {
    return;
  }
  element.style.height = "auto";
  element.style.height = `${Math.min(element.scrollHeight, 120)}px`;
}

function onInput(event: Event): void {
  const target = event.target as HTMLTextAreaElement;
  emit("update:modelValue", target.value);
  resize();
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    emit("send");
  }
}

const micLabel = computed(() =>
  props.recorderState === "recording"
    ? "停止"
    : props.recorderState === "processing"
      ? "转写中"
      : "语音",
);

const micIcon = computed<IconName>(() =>
  props.recorderState === "recording"
    ? "stop_circle"
    : props.recorderState === "processing"
      ? "hourglass_top"
      : "mic",
);

watch(
  () => props.modelValue,
  () => {
    void nextTick(resize);
  },
);
</script>

<template>
  <div
    class="rounded-2xl border border-slate-200/90 bg-white p-2 pl-4 shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition focus-within:border-slate-400 focus-within:shadow-[0_4px_24px_rgba(0,0,0,0.08)]"
  >
    <div
      v-if="recorderState !== 'idle'"
      class="flex items-center gap-2 border-b border-slate-100 pb-2 text-[11px] text-slate-500"
    >
      <span
        class="h-1.5 w-1.5 rounded-full"
        :class="recorderState === 'recording' ? 'bg-red-500 animate-pulse' : 'bg-slate-400'"
      />
      {{ recorderState === "recording" ? `正在听… ${seconds} 秒` : "正在转写，请稍候…" }}
    </div>

    <div class="flex items-end gap-2">
      <textarea
        ref="textarea"
        :value="props.modelValue"
        rows="1"
        class="max-h-[120px] min-h-10 flex-1 resize-none border-0 bg-transparent px-0 py-2 text-[14px] text-slate-800 outline-none placeholder:text-slate-400 focus:ring-0"
        placeholder="向私人家教提问，或按住右侧麦克风说话..."
        @input="onInput"
        @keydown="onKeydown"
      />

      <div class="flex items-center gap-2 pb-1">
        <button
          type="button"
          class="flex h-10 items-center gap-1.5 rounded-xl px-3.5 text-slate-700 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          :class="
            recorderState === 'recording'
              ? 'bg-red-50 text-red-700 hover:bg-red-100'
              : 'bg-slate-100 hover:bg-slate-200'
          "
          :disabled="!supported || sending"
          :title="supported ? '开始 / 停止录音' : '当前浏览器不支持录音'"
          @click="emit('toggleRecording')"
        >
          <AppIcon :name="micIcon" class="text-[19px]" />
          <span class="hidden text-xs font-medium sm:inline">{{ micLabel }}</span>
        </button>

        <button
          type="button"
          class="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="props.modelValue.trim().length === 0 || sending"
          aria-label="发送消息"
          @click="emit('send')"
        >
          <AppIcon v-if="!sending" name="arrow_upward" class="text-[19px]" />
          <span v-else class="text-xs">…</span>
        </button>
      </div>
    </div>

    <div
      class="flex items-center justify-between border-t border-slate-100 px-0.5 pt-1 text-[11px] text-slate-400"
    >
      <span>点击麦克风开始语音对话</span>
      <span>Enter 发送 · Shift + Enter 换行</span>
    </div>
  </div>
</template>
