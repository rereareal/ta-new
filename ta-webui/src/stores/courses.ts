import { computed, ref } from "vue";
import { defineStore } from "pinia";

import { getCourse, getUnit, listCourses } from "@/api/course.ts";
import type { CourseDetail, CourseSummary, CourseTreeNode, UnitDetail } from "@/types/index.ts";
import { errorMessage } from "@/utils/errors.ts";
import { isLoading, type LoadStatus } from "@/utils/status.ts";

function flattenUnits(tree: CourseTreeNode[]): CourseTreeNode[] {
  return tree.flatMap((node) => (node.kind === "unit" ? [node] : flattenUnits(node.children)));
}

export const useCoursesStore = defineStore("courses", () => {
  const courses = ref<CourseSummary[]>([]);
  const currentCourse = ref<CourseDetail | null>(null);
  const currentUnit = ref<UnitDetail | null>(null);
  const status = ref<LoadStatus>("idle");
  const error = ref<string | null>(null);
  const loading = computed(() => isLoading(status.value));

  const units = computed(() => (currentCourse.value ? flattenUnits(currentCourse.value.tree) : []));
  const currentUnitId = computed(() => currentUnit.value?.id ?? null);

  let courseSeq = 0;
  let unitSeq = 0;

  async function loadCourses(force = false): Promise<void> {
    if (!force && courses.value.length > 0) {
      return;
    }

    status.value = "loading";
    error.value = null;

    try {
      courses.value = await listCourses();
      status.value = "ready";
    } catch (cause) {
      error.value = errorMessage(cause);
      status.value = "error";
    }
  }

  async function loadCourse(courseId: string, unitId?: string): Promise<void> {
    const seq = ++courseSeq;
    unitSeq++;
    status.value = "loading";
    error.value = null;

    try {
      const course = await getCourse(courseId);
      if (seq !== courseSeq) {
        return;
      }

      currentCourse.value = course;
      const targetId = unitId ?? flattenUnits(course.tree)[0]?.id;
      const unit = targetId ? await getUnit(courseId, targetId) : null;
      if (seq !== courseSeq) {
        return;
      }

      currentUnit.value = unit;
      status.value = "ready";
    } catch (cause) {
      if (seq !== courseSeq) {
        return;
      }

      currentCourse.value = null;
      currentUnit.value = null;
      error.value = errorMessage(cause);
      status.value = "error";
    }
  }

  async function selectUnit(unitId: string): Promise<void> {
    if (!currentCourse.value) {
      return;
    }

    const seq = ++unitSeq;
    const courseId = currentCourse.value.id;
    status.value = "loading";
    error.value = null;

    try {
      const unit = await getUnit(courseId, unitId);
      if (seq !== unitSeq || currentCourse.value?.id !== courseId) {
        return;
      }

      currentUnit.value = unit;
      status.value = "ready";
    } catch (cause) {
      if (seq !== unitSeq) {
        return;
      }

      error.value = errorMessage(cause);
      status.value = "error";
    }
  }

  function clear(): void {
    courseSeq++;
    unitSeq++;
    courses.value = [];
    currentCourse.value = null;
    currentUnit.value = null;
    status.value = "idle";
    error.value = null;
  }

  return {
    courses,
    currentCourse,
    currentUnit,
    units,
    currentUnitId,
    status,
    loading,
    error,
    loadCourses,
    loadCourse,
    selectUnit,
    clear,
  };
});
