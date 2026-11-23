<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";

import MasteryRadar from "@/components/progress/MasteryRadar.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import ErrorBanner from "@/components/ui/ErrorBanner.vue";
import PageHeader from "@/components/ui/PageHeader.vue";
import StatusBadge from "@/components/ui/StatusBadge.vue";
import { demoMode } from "@/config.ts";
import { useProgressStore } from "@/stores/progress.ts";
import { useSessionStore } from "@/stores/session.ts";
import type { CourseProgress } from "@/types/index.ts";
import { unitStatusBadge } from "@/utils/labels.ts";

const router = useRouter();
const session = useSessionStore();
const progress = useProgressStore();

const mastery = computed(() => progress.mastery);
const recent = computed(() => progress.recent);

const summary = computed(() => {
  const courseCount = progress.courses.length;
  const completed = progress.courses.reduce((total, item) => total + item.completed_units, 0);
  const units = progress.courses.reduce((total, item) => total + item.total_units, 0);
  const last = progress.courses
    .map((item) => item.last_activity_at)
    .filter((item): item is string => Boolean(item))
    .sort()
    .at(-1);

  return { courseCount, completed, units, last };
});

const diagnosis = computed(() => {
  const items: { course: CourseProgress; unitId: string; unitTitle: string }[] = [];

  for (const course of progress.courses) {
    const unit =
      course.units.find((item) => item.status === "in_progress") ??
      course.units.find((item) => item.status === "not_started");

    if (unit) {
      items.push({ course, unitId: unit.unit_id, unitTitle: unit.title });
    }

    if (items.length >= 3) {
      break;
    }
  }

  return items;
});

function lastActivity(value: string | null | undefined): string {
  if (!value) {
    return "暂无记录";
  }
  return new Date(value).toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
  });
}

function firstOpenUnit(course: CourseProgress): string | undefined {
  return (
    course.units.find((unit) => unit.status === "in_progress")?.unit_id ??
    course.units.find((unit) => unit.status === "not_started")?.unit_id ??
    course.units[0]?.unit_id
  );
}

function goChat(course: CourseProgress): void {
  void router.push({
    path: "/",
    query: { course: course.course_id, unit: firstOpenUnit(course) },
  });
}

function goChatUnit(courseId: string, unitId: string): void {
  void router.push({ path: "/", query: { course: courseId, unit: unitId } });
}

onMounted(() => {
  void progress.loadAll();
});
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      eyebrow="Learner"
      title="学情诊断"
      description="按课程查看进度、单元状态和下一步建议。"
    />

    <ErrorBanner v-if="progress.error">{{ progress.error }}</ErrorBanner>

    <section class="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div class="flex flex-wrap items-center justify-between gap-5">
        <div class="flex items-center gap-4">
          <div
            class="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-lg font-semibold text-white"
          >
            {{ session.initial }}
          </div>
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="text-base font-semibold text-slate-900">{{ session.userName }}</h2>
              <span
                class="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-500"
              >
                {{ session.isAdmin ? "管理员" : "学习者" }}
              </span>
              <span
                v-if="demoMode"
                class="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] text-amber-700"
              >
                演示数据
              </span>
            </div>
            <p class="mt-1 text-xs text-slate-400">{{ session.email ?? "未登录" }}</p>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-6 text-right">
          <div>
            <p class="text-[10px] uppercase tracking-wide text-slate-400">课程</p>
            <p class="mt-1 text-xl font-semibold tabular-nums text-slate-900">
              {{ summary.courseCount }}
            </p>
          </div>
          <div>
            <p class="text-[10px] uppercase tracking-wide text-slate-400">完成单元</p>
            <p class="mt-1 text-xl font-semibold tabular-nums text-slate-900">
              {{ summary.completed
              }}<span class="text-xs text-slate-400"> / {{ summary.units }}</span>
            </p>
          </div>
          <div>
            <p class="text-[10px] uppercase tracking-wide text-slate-400">最近活动</p>
            <p class="mt-1 text-sm font-medium text-slate-700">{{ lastActivity(summary.last) }}</p>
          </div>
        </div>
      </div>
    </section>

    <div v-if="progress.courses.length" class="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
      <section class="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 class="text-sm font-semibold text-slate-900">课程进度</h2>
          <span class="text-[11px] text-slate-400">{{ progress.courses.length }} 门课</span>
        </div>

        <div class="divide-y divide-slate-100">
          <article
            v-for="course in progress.courses"
            :key="course.course_id"
            class="py-4 first:pt-4 last:pb-0"
          >
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0">
                <h3 class="text-sm font-medium text-slate-900">{{ course.title }}</h3>
                <p class="mt-0.5 text-[11px] text-slate-400">
                  最近活动：{{ lastActivity(course.last_activity_at) }}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-600 transition hover:border-slate-300"
                  @click="router.push(`/knowledge/${course.course_id}`)"
                >
                  课程内容
                </button>
                <button
                  type="button"
                  class="rounded-md bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-white transition hover:bg-slate-800"
                  @click="goChat(course)"
                >
                  继续学习
                </button>
              </div>
            </div>

            <div class="mt-3 flex items-center gap-3">
              <div class="h-1 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  class="h-full rounded-full bg-slate-900"
                  :style="{ width: `${course.percent}%` }"
                />
              </div>
              <span class="w-10 text-right text-[11px] font-medium tabular-nums text-slate-600">
                {{ course.percent }}%
              </span>
            </div>

            <details class="mt-2">
              <summary
                class="cursor-pointer list-none text-[11px] text-slate-400 hover:text-slate-600"
              >
                查看 {{ course.units.length }} 个单元
              </summary>
              <ul class="mt-2 divide-y divide-slate-100">
                <li
                  v-for="unit in course.units"
                  :key="unit.unit_id"
                  class="flex items-center justify-between gap-3 py-2 text-xs"
                >
                  <span class="text-slate-600">{{ unit.title }}</span>
                  <StatusBadge :badge="unitStatusBadge(unit.status, 'progress')" />
                </li>
              </ul>
            </details>
          </article>
        </div>
      </section>

      <div class="space-y-4">
        <section class="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 class="text-sm font-semibold text-slate-900">知识掌握多维评估</h2>
            <span class="text-[10px] text-slate-400">{{ demoMode ? "演示评分" : "待接入" }}</span>
          </div>

          <template v-if="mastery">
            <div class="mt-4 flex flex-col items-center gap-4 sm:flex-row">
              <MasteryRadar :scores="mastery" />
              <div class="w-full space-y-2.5">
                <div v-for="item in mastery" :key="item.label">
                  <div class="flex items-center justify-between text-[10px] text-slate-500">
                    <span>{{ item.label }}</span>
                    <span class="tabular-nums">{{ item.score }}%</span>
                  </div>
                  <div class="mt-1 h-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      class="h-full rounded-full"
                      :class="item.score >= 70 ? 'bg-slate-900' : 'bg-red-400'"
                      :style="{ width: `${item.score}%` }"
                    />
                  </div>
                </div>
              </div>
            </div>
          </template>
          <p v-else class="py-8 text-center text-xs text-slate-400">后端尚未提供掌握维度评估。</p>
        </section>

        <section class="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 class="text-sm font-semibold text-slate-900">AI 家教专项诊断</h2>
            <span class="text-[10px] text-slate-400">实时生成</span>
          </div>

          <div v-if="diagnosis.length" class="mt-3 space-y-2">
            <div
              v-for="item in diagnosis"
              :key="`${item.course.course_id}-${item.unitId}`"
              class="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3"
            >
              <div class="min-w-0">
                <p class="truncate text-xs font-medium text-slate-800">{{ item.unitTitle }}</p>
                <p class="mt-0.5 truncate text-[10px] text-slate-400">{{ item.course.title }}</p>
              </div>
              <button
                type="button"
                class="shrink-0 rounded-md bg-slate-900 px-2 py-1 text-[10px] font-medium text-white"
                @click="goChatUnit(item.course.course_id, item.unitId)"
              >
                继续
              </button>
            </div>
          </div>
          <p v-else class="py-8 text-center text-xs text-slate-400">暂时没有待继续的单元。</p>
        </section>
      </div>
    </div>

    <section v-if="recent.length" class="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 class="text-sm font-semibold text-slate-900">近期问答与测试历程</h2>
        <span class="text-[10px] text-slate-400">演示数据</span>
      </div>
      <ul class="divide-y divide-slate-100">
        <li
          v-for="item in recent"
          :key="item.title"
          class="flex flex-wrap items-center justify-between gap-2 py-3 text-xs"
        >
          <div class="min-w-0">
            <p class="truncate font-medium text-slate-700">{{ item.title }}</p>
            <p class="mt-0.5 text-[10px] text-slate-400">{{ item.detail }}</p>
          </div>
          <span class="text-[10px] text-slate-400">{{ item.when }}</span>
        </li>
      </ul>
    </section>

    <div
      v-if="!progress.loading && progress.courses.length === 0"
      class="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center"
    >
      <AppIcon name="insights" class="mx-auto text-3xl text-slate-300" />
      <p class="mt-2 text-sm text-slate-500">还没有开始学习的课程。</p>
      <button
        type="button"
        class="mt-3 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white"
        @click="router.push('/knowledge')"
      >
        浏览课程
      </button>
    </div>
  </div>
</template>
