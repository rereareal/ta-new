<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import ChatComposer from "@/components/chat/ChatComposer.vue";
import ChatMessage from "@/components/chat/ChatMessage.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import ErrorBanner from "@/components/ui/ErrorBanner.vue";
import { useRecorder } from "@/composables/useRecorder.ts";
import { useTts } from "@/composables/useTts.ts";
import { demoMode } from "@/config.ts";
import { useChatStore } from "@/stores/chat.ts";
import { useCoursesStore } from "@/stores/courses.ts";
import { useToastStore } from "@/stores/toast.ts";
import type { ChatMessage as ChatMessageType } from "@/types/index.ts";

const route = useRoute();
const router = useRouter();
const chat = useChatStore();
const courses = useCoursesStore();
const toast = useToastStore();

const draft = ref("");
const messageList = ref<HTMLElement | null>(null);

const { playingId, loadingId, error: ttsError, speak, stop: stopTts } = useTts();

const {
  state: recorderState,
  seconds: recordSeconds,
  error: recorderError,
  supported: recorderSupported,
  toggle: toggleRecording,
} = useRecorder(handleTranscript);

const suggestions = computed(() => [
  `继续学习「${courses.currentUnit?.title ?? "当前单元"}」`,
  "给我一道练习题",
  "先给我一个提示",
  "这部分最关键的考点是什么？",
]);

function handleTranscript(text: string): void {
  draft.value = text;
  if (chat.voiceEnabled) {
    void sendText(text);
  }
}

async function sendText(text: string): Promise<void> {
  const content = text.trim();
  if (content.length === 0) {
    return;
  }

  draft.value = "";
  const before = chat.messages.length;
  const reply = await chat.send(content);

  if (reply === null && chat.error !== null) {
    toast.show(chat.error);
    if (chat.messages.length === before) {
      draft.value = content;
    }
  }

  await scrollToBottom();
}

function send(): void {
  void sendText(draft.value);
}

function onSpeak(message: ChatMessageType): void {
  void speak(message.id, message.content);
}

async function onCourseChange(event: Event): Promise<void> {
  const courseId = (event.target as HTMLSelectElement).value;
  await courses.loadCourse(courseId);
  chat.setContext(courseId, courses.currentUnitId ?? chat.unitId);
}

async function onUnitChange(event: Event): Promise<void> {
  const unitId = (event.target as HTMLSelectElement).value;
  await courses.selectUnit(unitId);
  chat.setContext(chat.courseId, unitId);
}

async function newSession(): Promise<void> {
  stopTts();
  await chat.reset();
  await scrollToBottom();
  toast.show("已开始新会话");
}

function openCourse(): void {
  if (!chat.courseId) {
    return;
  }
  void router.push({
    path: `/knowledge/${chat.courseId}`,
    query: chat.unitId ? { unit: chat.unitId } : undefined,
  });
}

async function scrollToBottom(): Promise<void> {
  await nextTick();
  const element = messageList.value;
  if (element) {
    element.scrollTop = element.scrollHeight;
  }
}

watch(() => [chat.messages.length, chat.sending], scrollToBottom);
watch(recorderError, (value) => {
  if (value) {
    toast.show(value);
  }
});
watch(ttsError, (value) => {
  if (value) {
    toast.show(value);
  }
});

onMounted(async () => {
  await courses.loadCourses();

  const queryCourse = typeof route.query.course === "string" ? route.query.course : undefined;
  const queryUnit = typeof route.query.unit === "string" ? route.query.unit : undefined;
  const initialCourseId =
    courses.courses.find((course) => course.id === queryCourse)?.id ??
    courses.courses[0]?.id ??
    null;

  if (initialCourseId !== null) {
    await courses.loadCourse(initialCourseId, queryUnit);
  }

  await chat.init(initialCourseId, courses.currentUnitId ?? queryUnit ?? null);
  await scrollToBottom();
});
</script>

<template>
  <div class="flex h-[calc(100vh-3.5rem)] flex-col bg-[#fafbfd]">
    <div class="border-b border-slate-200/60">
      <div
        class="mx-auto flex w-full max-w-[880px] flex-wrap items-center justify-between gap-3 px-5 py-2.5 sm:px-8"
      >
        <div class="flex min-w-0 flex-wrap items-center gap-2 text-xs text-slate-500">
          <span class="font-medium text-slate-700">当前主题</span>
          <span class="text-slate-300">/</span>

          <select
            :value="chat.courseId ?? ''"
            class="max-w-[150px] rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none transition focus:border-slate-400"
            :disabled="courses.courses.length === 0"
            @change="onCourseChange"
          >
            <option v-for="course in courses.courses" :key="course.id" :value="course.id">
              {{ course.title }}
            </option>
          </select>

          <span class="text-slate-300">/</span>

          <select
            :value="courses.currentUnitId ?? chat.unitId ?? ''"
            class="max-w-[170px] rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none transition focus:border-slate-400"
            :disabled="courses.units.length === 0"
            @change="onUnitChange"
          >
            <option v-for="unit in courses.units" :key="unit.id" :value="unit.id">
              {{ unit.title }}
            </option>
          </select>

          <span
            class="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600"
          >
            进阶答疑
          </span>
          <span
            v-if="demoMode"
            class="inline-flex items-center rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700"
          >
            演示
          </span>
        </div>

        <div class="flex items-center gap-1">
          <button
            type="button"
            class="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            title="打开课程页"
            :disabled="!chat.courseId"
            @click="openCourse"
          >
            <AppIcon name="account_tree" class="text-[15px]" />
            知识库
          </button>
          <button
            type="button"
            class="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            title="开始新会话"
            @click="newSession"
          >
            <AppIcon name="history" class="text-[15px]" />
            新会话
          </button>
        </div>
      </div>
    </div>

    <div ref="messageList" class="min-h-0 flex-1 overflow-y-auto">
      <div class="mx-auto flex w-full max-w-[880px] flex-col gap-8 px-5 py-8 sm:px-8">
        <section
          v-if="chat.messages.length === 0 && !chat.sending"
          class="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
        >
          <p class="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
            Private Tutor
          </p>
          <h1 class="mt-2 text-xl font-semibold tracking-tight text-slate-900">今天想学什么？</h1>
          <p class="mt-2 max-w-xl text-sm leading-6 text-slate-500">
            我在《{{ courses.currentCourse?.title ?? "课程" }}》的「{{
              courses.currentUnit?.title ?? "当前单元"
            }}」。可以直接问我概念，也可以让我出题或给提示。
          </p>
          <div class="mt-4 flex flex-wrap gap-2">
            <button
              v-for="suggestion in suggestions"
              :key="suggestion"
              type="button"
              class="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
              @click="sendText(suggestion)"
            >
              {{ suggestion }}
            </button>
          </div>
        </section>

        <ChatMessage
          v-for="message in chat.messages"
          :key="message.id"
          :message="message"
          :playing="playingId === message.id"
          :loading="loadingId === message.id"
          @speak="onSpeak"
        />

        <div v-if="chat.sending" class="flex items-start gap-4">
          <div
            class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-700"
          >
            <AppIcon name="psychology" class="text-[17px]" />
          </div>
          <div
            class="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm text-slate-500 shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
          >
            <span class="inline-flex items-center gap-1">
              正在组织语言
              <span class="flex gap-1">
                <span class="tu-loading-dot h-1 w-1 rounded-full bg-slate-400" />
                <span class="tu-loading-dot h-1 w-1 rounded-full bg-slate-400" />
                <span class="tu-loading-dot h-1 w-1 rounded-full bg-slate-400" />
              </span>
            </span>
          </div>
        </div>

        <ErrorBanner v-if="chat.error" tone="warning">{{ chat.error }}</ErrorBanner>
      </div>
    </div>

    <div class="shrink-0 pb-5 pt-2">
      <div class="mx-auto w-full max-w-[760px] px-4">
        <ChatComposer
          v-model="draft"
          :sending="chat.sending"
          :recorder-state="recorderState"
          :seconds="recordSeconds"
          :supported="recorderSupported"
          @send="send"
          @toggle-recording="toggleRecording"
        />
      </div>
    </div>
  </div>
</template>
