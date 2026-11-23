import { demoMode } from "@/config.ts";
import { ApiError } from "@/types/errors.ts";
import type { ResourceDetail, ResourceSummary } from "@/types/index.ts";
import { request, requestForm } from "./client.ts";

export async function listResources(): Promise<ResourceSummary[]> {
  if (demoMode) {
    const { listDemoResources } = await import("@/demo/resources.ts");
    return listDemoResources();
  }

  return request<ResourceSummary[]>("/resources");
}

export async function getResource(resourceId: string): Promise<ResourceDetail> {
  if (demoMode) {
    const { getDemoResource } = await import("@/demo/resources.ts");
    const resource = getDemoResource(resourceId);
    if (!resource) {
      throw new ApiError(404, "没有找到这份材料");
    }
    return resource;
  }

  return request<ResourceDetail>(`/resources/${resourceId}`);
}

export async function uploadResource(file: File, title: string): Promise<ResourceSummary> {
  if (demoMode) {
    const { uploadDemoResource } = await import("@/demo/resources.ts");
    return uploadDemoResource(file, title);
  }

  const form = new FormData();
  form.append("file", file);
  form.append("title", title);

  return requestForm<ResourceSummary>("/resources", form);
}
