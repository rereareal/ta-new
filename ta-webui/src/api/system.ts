import { ApiError } from "@/types/errors.ts";
import type { HealthResponse, ReadinessResponse } from "@/types/index.ts";
import { request } from "./client.ts";

export function fetchHealth(): Promise<HealthResponse> {
  return request<HealthResponse>("/health");
}

export async function fetchReadiness(): Promise<ReadinessResponse> {
  try {
    return await request<ReadinessResponse>("/ready");
  } catch (error) {
    // 503 是就绪探针的正常答案，不是传输失败。
    if (error instanceof ApiError && error.status === 503) {
      return { status: "not_ready" };
    }

    throw error;
  }
}
