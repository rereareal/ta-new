import { demoMode } from "@/config.ts";
import { ApiError } from "@/types/errors.ts";
import type { CourseProgress, MasteryScore, RecentActivity } from "@/types/index.ts";
import { request } from "./client.ts";

export async function listProgress(): Promise<CourseProgress[]> {
  if (demoMode) {
    const { demoProgress } = await import("@/demo/progress.ts");
    return demoProgress.map((item) => ({
      ...item,
      units: item.units.map((unit) => ({ ...unit })),
    }));
  }

  return request<CourseProgress[]>("/learner/progress");
}

export async function getProgress(courseId: string): Promise<CourseProgress> {
  if (demoMode) {
    const { demoProgress } = await import("@/demo/progress.ts");
    const progress = demoProgress.find((item) => item.course_id === courseId);
    if (!progress) {
      throw new ApiError(404, "没有找到这门课的进度");
    }
    return {
      ...progress,
      units: progress.units.map((unit) => ({ ...unit })),
    };
  }

  return request<CourseProgress>(`/learner/progress/${courseId}`);
}

export async function getMastery(): Promise<MasteryScore[] | null> {
  if (demoMode) {
    const { demoMastery } = await import("@/demo/progress.ts");
    return demoMastery.map((item) => ({ ...item }));
  }

  return null;
}

export async function listRecentActivity(): Promise<RecentActivity[]> {
  if (demoMode) {
    const { demoRecentActivity } = await import("@/demo/progress.ts");
    return demoRecentActivity.map((item) => ({ ...item }));
  }

  return [];
}
