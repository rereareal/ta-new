import { demoMode } from "@/config.ts";
import { ApiError } from "@/types/errors.ts";
import type { CourseDetail, CourseSummary, UnitDetail } from "@/types/index.ts";
import { request } from "./client.ts";

export async function listCourses(): Promise<CourseSummary[]> {
  if (demoMode) {
    const { demoCourses } = await import("@/demo/courses.ts");
    return demoCourses.map((course) => ({ ...course }));
  }

  return request<CourseSummary[]>("/courses");
}

export async function getCourse(courseId: string): Promise<CourseDetail> {
  if (demoMode) {
    const { demoCourseDetails } = await import("@/demo/courses.ts");
    const course = demoCourseDetails[courseId];
    if (!course) {
      throw new ApiError(404, "没有找到这门课程");
    }
    return { ...course };
  }

  return request<CourseDetail>(`/courses/${courseId}`);
}

export async function getUnit(courseId: string, unitId: string): Promise<UnitDetail> {
  if (demoMode) {
    const { demoUnits } = await import("@/demo/units.ts");
    const unit = demoUnits[unitId];
    if (!unit) {
      throw new ApiError(404, "没有找到这个知识单元");
    }
    return { ...unit };
  }

  return request<UnitDetail>(`/courses/${courseId}/units/${unitId}`);
}
