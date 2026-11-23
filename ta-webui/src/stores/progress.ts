import { computed, ref } from "vue";
import { defineStore } from "pinia";

import { getMastery, getProgress, listProgress, listRecentActivity } from "@/api/learner.ts";
import type { CourseProgress, MasteryScore, RecentActivity } from "@/types/index.ts";
import { errorMessage } from "@/utils/errors.ts";
import { isLoading, type LoadStatus } from "@/utils/status.ts";

export const useProgressStore = defineStore("progress", () => {
  /** 全部课程的进度，学情诊断页用。 */
  const courses = ref<CourseProgress[]>([]);
  /** 单门课程的进度，知识库详情页用。 */
  const current = ref<CourseProgress | null>(null);
  const mastery = ref<MasteryScore[] | null>(null);
  const recent = ref<RecentActivity[]>([]);

  const status = ref<LoadStatus>("idle");
  const error = ref<string | null>(null);
  const loading = computed(() => isLoading(status.value));

  let courseSeq = 0;

  async function loadAll(): Promise<void> {
    status.value = "loading";
    error.value = null;

    try {
      const [courseList, masteryScores, activityList] = await Promise.all([
        listProgress(),
        getMastery(),
        listRecentActivity(),
      ]);
      courses.value = courseList;
      mastery.value = masteryScores;
      recent.value = activityList;
      status.value = "ready";
    } catch (cause) {
      error.value = errorMessage(cause, "无法加载学习进度");
      status.value = "error";
    }
  }

  /**
   * 单门课程进度。读取失败只表示"拿不到进度"，不当作页面错误：
   * 知识库详情页在没有进度时仍然要正常展示课程内容。
   */
  async function loadCourse(courseId: string): Promise<void> {
    const seq = ++courseSeq;
    current.value = null;

    try {
      const progress = await getProgress(courseId);
      if (seq === courseSeq) {
        current.value = progress;
      }
    } catch {
      if (seq === courseSeq) {
        current.value = null;
      }
    }
  }

  function clear(): void {
    courseSeq++;
    courses.value = [];
    current.value = null;
    mastery.value = null;
    recent.value = [];
    status.value = "idle";
    error.value = null;
  }

  return { courses, current, mastery, recent, status, error, loading, loadAll, loadCourse, clear };
});
