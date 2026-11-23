<script setup lang="ts">
import { computed } from "vue";

import AppIcon from "@/components/ui/AppIcon.vue";
import MarkdownContent from "@/components/ui/MarkdownContent.vue";
import type { ChatMessage } from "@/types/index.ts";

const props = defineProps<{
  message: ChatMessage;
  playing: boolean;
  loading: boolean;
}>();

const emit = defineEmits<{ speak: [message: ChatMessage] }>();

const isAssistant = computed(() => props.message.role === "assistant");
const time = computed(() => {
  if (!props.message.created_at) {
    return "刚刚";
  }
  return new Date(props.message.created_at).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
});
</script>

<template>
  <article v-if="isAssistant" class="flex items-start gap-4">
    <div
      class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-700"
    >
      <AppIcon name="psychology" class="text-[17px]" />
    </div>

    <div class="min-w-0 max-w-[760px] flex-1">
      <div class="flex items-center gap-2 text-[12px] text-slate-400">
        <span class="font-medium text-slate-700">EduTutor</span>
        <span
          class="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500"
        >
          <span class="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          知识验证已校对
        </span>
        <span>{{ time }}</span>
      </div>

      <div
        class="mt-2 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
      >
        <div
          class="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
        >
          <button
            type="button"
            class="flex items-center gap-2 text-xs text-slate-600 transition hover:text-slate-900 disabled:cursor-progress disabled:opacity-60"
            :disabled="loading"
            @click="emit('speak', message)"
          >
            <AppIcon :name="playing ? 'pause' : 'play_arrow'" class="text-[18px]" />
            <span>{{ playing ? "停止朗读" : loading ? "合成中…" : "朗读解析" }}</span>
          </button>
          <span class="text-[11px] text-slate-400">1.0x · 清雅音色</span>
        </div>

        <MarkdownContent :content="message.content" />
      </div>
    </div>
  </article>

  <article v-else class="flex items-start justify-end gap-4">
    <div class="flex max-w-[620px] flex-col items-end">
      <div class="flex items-center gap-2 text-[12px] text-slate-400">
        <span>{{ time }}</span>
        <span class="font-medium text-slate-700">我</span>
      </div>
      <div
        class="mt-2 whitespace-pre-wrap rounded-2xl rounded-tr-sm border border-slate-200/70 bg-slate-100 px-4 py-3 text-[13.5px] leading-relaxed text-slate-700"
      >
        {{ message.content }}
      </div>
    </div>
  </article>
</template>
