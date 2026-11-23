import { computed, ref } from "vue";
import { defineStore } from "pinia";

import { getResource, listResources, uploadResource } from "@/api/resource.ts";
import type { ResourceDetail, ResourceSummary } from "@/types/index.ts";
import { errorMessage } from "@/utils/errors.ts";
import { isLoading, type LoadStatus } from "@/utils/status.ts";

export const useResourcesStore = defineStore("resources", () => {
  const items = ref<ResourceSummary[]>([]);
  const current = ref<ResourceDetail | null>(null);

  const status = ref<LoadStatus>("idle");
  const error = ref<string | null>(null);
  const loading = computed(() => isLoading(status.value));

  const detailLoading = ref(false);
  let detailSeq = 0;

  async function loadAll(): Promise<void> {
    status.value = "loading";
    error.value = null;

    try {
      items.value = await listResources();
      status.value = "ready";
    } catch (cause) {
      error.value = errorMessage(cause, "无法加载资源列表");
      status.value = "error";
    }
  }

  /** 上传后直接把返回的条目插到列表头部，与后端的创建顺序一致。 */
  async function upload(file: File, title: string): Promise<ResourceSummary> {
    const created = await uploadResource(file, title);
    items.value.unshift(created);
    return created;
  }

  /**
   * 读取单份材料详情。失败时抛出，由调用方决定提示和是否关闭弹窗。
   */
  async function loadDetail(resourceId: string): Promise<void> {
    const seq = ++detailSeq;
    detailLoading.value = true;
    current.value = null;

    try {
      const detail = await getResource(resourceId);
      if (seq === detailSeq) {
        current.value = detail;
      }
    } finally {
      if (seq === detailSeq) {
        detailLoading.value = false;
      }
    }
  }

  function clearDetail(): void {
    detailSeq++;
    current.value = null;
    detailLoading.value = false;
  }

  function clear(): void {
    clearDetail();
    items.value = [];
    status.value = "idle";
    error.value = null;
  }

  return {
    items,
    current,
    status,
    error,
    loading,
    detailLoading,
    loadAll,
    upload,
    loadDetail,
    clearDetail,
    clear,
  };
});
