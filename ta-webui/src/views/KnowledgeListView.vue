<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";

import AppIcon from "@/components/ui/AppIcon.vue";
import ErrorBanner from "@/components/ui/ErrorBanner.vue";
import PageHeader from "@/components/ui/PageHeader.vue";
import StatusBadge from "@/components/ui/StatusBadge.vue";
import { useCoursesStore } from "@/stores/courses.ts";
import { courseStatusBadge } from "@/utils/labels.ts";

const router = useRouter();
const courses = useCoursesStore();

onMounted(() => {
  void courses.loadCourses();
});
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      eyebrow="Knowledge"
      title="知识库"
      description="按课程浏览知识结构；进入单元可以看内容、先修关系和引用资源。"
    >
      <template #actions>
        <button
          type="button"
          class="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800"
          @click="router.push('/')"
        >
          去问导师
        </button>
      </template>
    </PageHeader>

    <ErrorBanner v-if="courses.error">{{ courses.error }}</ErrorBanner>

    <div v-if="courses.courses.length" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <button
        v-for="course in courses.courses"
        :key="course.id"
        type="button"
        class="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition hover:border-slate-300 hover:shadow-[0_8px_30px_rgba(15,23,42,0.06)]"
        @click="router.push(`/knowledge/${course.id}`)"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <h2 class="text-base font-semibold text-slate-900">{{ course.title }}</h2>
            <p class="mt-1 line-clamp-3 text-sm leading-6 text-slate-500">
              {{ course.description }}
            </p>
          </div>
          <StatusBadge :badge="courseStatusBadge(course.status)" class="shrink-0" />
        </div>

        <div class="mt-auto pt-5">
          <div class="flex items-center justify-between text-[11px] text-slate-400">
            <span>{{ course.unit_count }} 个知识单元</span>
            <span class="font-medium text-slate-600">{{ course.progress }}%</span>
          </div>
          <div class="mt-2 h-1 overflow-hidden rounded-full bg-slate-100">
            <div
              class="h-full rounded-full bg-slate-900"
              :style="{ width: `${course.progress}%` }"
            />
          </div>
        </div>
      </button>
    </div>

    <div
      v-else-if="!courses.loading"
      class="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center"
    >
      <AppIcon name="folder_open" class="mx-auto text-3xl text-slate-300" />
      <p class="mt-2 text-sm text-slate-500">还没有可访问的课程。</p>
    </div>
  </div>
</template>
