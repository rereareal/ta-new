<script setup lang="ts">
import { computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import KnowledgeTree from "@/components/knowledge/KnowledgeTree.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import ErrorBanner from "@/components/ui/ErrorBanner.vue";
import MarkdownContent from "@/components/ui/MarkdownContent.vue";
import PageHeader from "@/components/ui/PageHeader.vue";
import StatusBadge from "@/components/ui/StatusBadge.vue";
import { useCoursesStore } from "@/stores/courses.ts";
import { useProgressStore } from "@/stores/progress.ts";
import type { UnitStatus } from "@/types/index.ts";
import { courseStatusBadge, unitStatusBadge } from "@/utils/labels.ts";

const route = useRoute();
const router = useRouter();
const courses = useCoursesStore();
const progress = useProgressStore();

const courseId = computed(() => String(route.params.courseId ?? ""));
const course = computed(() => courses.currentCourse);
const unit = computed(() => courses.currentUnit);

const statuses = computed<Record<string, UnitStatus>>(() =>
  Object.fromEntries((progress.current?.units ?? []).map((item) => [item.unit_id, item.status])),
);

const unitStatus = computed(() => (unit.value ? statuses.value[unit.value.id] : undefined));
const titleById = computed(() => new Map(courses.units.map((item) => [item.id, item.title])));

function titleOf(id: string): string {
  return titleById.value.get(id) ?? id;
}

async function load(): Promise<void> {
  const queryUnit = typeof route.query.unit === "string" ? route.query.unit : undefined;
  await courses.loadCourse(courseId.value, queryUnit);
  await progress.loadCourse(courseId.value);
}

async function selectUnit(unitId: string): Promise<void> {
  await courses.selectUnit(unitId);
}

function goChat(): void {
  if (!unit.value) {
    return;
  }
  void router.push({
    path: "/",
    query: { course: courseId.value, unit: unit.value.id },
  });
}

watch(
  () => route.params.courseId,
  () => {
    void load();
  },
  { immediate: true },
);
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      eyebrow="Knowledge / Course"
      :title="course?.title ?? '课程'"
      :description="course?.description"
    >
      <template #actions>
        <button
          type="button"
          class="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300"
          @click="router.push('/knowledge')"
        >
          全部课程
        </button>
        <button
          type="button"
          class="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800 disabled:opacity-40"
          :disabled="!unit"
          @click="goChat"
        >
          问导师
        </button>
      </template>
    </PageHeader>

    <ErrorBanner v-if="courses.error">{{ courses.error }}</ErrorBanner>

    <div v-if="course" class="grid gap-4 lg:grid-cols-[340px_1fr]">
      <aside class="h-fit rounded-2xl border border-slate-200 bg-white p-4 lg:sticky lg:top-20">
        <div class="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <p class="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">
              Structure
            </p>
            <h2 class="mt-1 text-sm font-semibold text-slate-900">知识脉络</h2>
          </div>
          <StatusBadge :badge="courseStatusBadge(course.status)" />
        </div>

        <div v-if="progress.current" class="border-b border-slate-100 py-3">
          <div class="flex items-center justify-between text-[11px] text-slate-400">
            <span>课程进度</span>
            <span class="font-medium text-slate-700">{{ progress.current.percent }}%</span>
          </div>
          <div class="mt-2 h-1 overflow-hidden rounded-full bg-slate-100">
            <div
              class="h-full rounded-full bg-slate-900"
              :style="{ width: `${progress.current.percent}%` }"
            />
          </div>
        </div>

        <div class="pt-3">
          <KnowledgeTree
            :nodes="course.tree"
            :active-id="unit?.id ?? null"
            :statuses="statuses"
            @select="selectUnit"
          />
        </div>
      </aside>

      <section
        v-if="unit"
        class="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] sm:p-6"
      >
        <header
          class="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4"
        >
          <div class="min-w-0">
            <p class="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400">
              NODE {{ unit.id }}
            </p>
            <h2 class="mt-1 text-lg font-semibold tracking-tight text-slate-900">
              {{ unit.title }}
            </h2>
            <p class="mt-1 text-xs text-slate-400">内容与先修关系来自课程结构</p>
          </div>
          <StatusBadge :badge="unitStatusBadge(unitStatus, 'mastery')" />
        </header>

        <div class="py-5">
          <MarkdownContent :content="unit.content_md" />
        </div>

        <div
          v-if="unit.prerequisites.length || unit.successors.length"
          class="grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2"
        >
          <div v-if="unit.prerequisites.length">
            <p class="mb-2 text-[11px] font-medium text-slate-400">先修</p>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="item in unit.prerequisites"
                :key="item"
                type="button"
                class="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                @click="selectUnit(item)"
              >
                {{ titleOf(item) }}
              </button>
            </div>
          </div>
          <div v-if="unit.successors.length">
            <p class="mb-2 text-[11px] font-medium text-slate-400">后继</p>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="item in unit.successors"
                :key="item"
                type="button"
                class="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                @click="selectUnit(item)"
              >
                {{ titleOf(item) }}
              </button>
            </div>
          </div>
        </div>

        <div v-if="unit.resources.length" class="mt-5 border-t border-slate-100 pt-4">
          <p class="mb-2 text-[11px] font-medium text-slate-400">引用资源</p>
          <div class="grid gap-2 sm:grid-cols-2">
            <div
              v-for="resource in unit.resources"
              :key="resource.resource_id"
              class="rounded-xl border border-slate-200 bg-slate-50/60 p-3"
            >
              <div class="flex items-center gap-2">
                <span class="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                  {{ resource.type === "video" ? "VIDEO" : "SLIDE" }}
                </span>
                <span class="min-w-0 flex-1 truncate text-xs text-slate-700">
                  {{ resource.title }}
                </span>
              </div>
              <p v-if="resource.locator" class="mt-1.5 text-[10px] text-slate-400">
                {{ resource.locator }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div
        v-else
        class="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white"
      >
        <div class="text-center">
          <AppIcon name="account_tree" class="mx-auto text-3xl text-slate-300" />
          <p class="mt-2 text-sm text-slate-500">从左侧选择一个知识单元</p>
        </div>
      </div>
    </div>
  </div>
</template>
