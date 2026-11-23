import { computed, ref } from "vue";
import { defineStore } from "pinia";

import { fetchHealth, fetchReadiness } from "@/api/system.ts";
import type { HealthResponse, ReadinessResponse } from "@/types/index.ts";
import { errorMessage } from "@/utils/errors.ts";
import type { Tone } from "@/utils/tone.ts";

export const useSystemStore = defineStore("system", () => {
  const health = ref<HealthResponse | null>(null);
  const readiness = ref<ReadinessResponse | null>(null);
  const healthError = ref<string | null>(null);
  const readinessError = ref<string | null>(null);
  const loading = ref(false);
  const lastCheckedAt = ref<Date | null>(null);

  const apiTone = computed<Tone>(() => {
    if (healthError.value) {
      return "danger";
    }
    if (health.value) {
      return "success";
    }
    return "neutral";
  });

  const dbTone = computed<Tone>(() => {
    if (readinessError.value) {
      return "danger";
    }
    if (readiness.value?.status === "ready") {
      return "success";
    }
    if (readiness.value) {
      return "warning";
    }
    return "neutral";
  });

  const overallTone = computed<Tone>(() => {
    if (healthError.value || readinessError.value) {
      return "danger";
    }
    if (health.value && readiness.value?.status === "ready") {
      return "success";
    }
    if (health.value) {
      return "warning";
    }
    return "neutral";
  });

  const apiLabel = computed(() => {
    if (loading.value && !health.value && !healthError.value) {
      return "检查中";
    }
    if (healthError.value) {
      return "API 离线";
    }
    if (health.value) {
      return "API 正常";
    }
    return "未检查";
  });

  const dbLabel = computed(() => {
    if (loading.value && !readiness.value && !readinessError.value) {
      return "检查中";
    }
    if (readinessError.value) {
      return "数据库不可用";
    }
    if (readiness.value?.status === "ready") {
      return "数据库就绪";
    }
    if (readiness.value) {
      return "数据库未就绪";
    }
    return "未检查";
  });

  const overallLabel = computed(() => {
    if (loading.value && lastCheckedAt.value === null) {
      return "检查中";
    }
    if (healthError.value) {
      return "API 不可用";
    }
    if (readinessError.value) {
      return "数据库不可用";
    }
    if (health.value && readiness.value?.status === "ready") {
      return "运行正常";
    }
    if (health.value) {
      return "部分就绪";
    }
    return "状态未知";
  });

  let inFlight: Promise<void> | null = null;
  let pollTimer: number | null = null;
  let pollSubscribers = 0;

  function startPolling(intervalMs = 60_000): void {
    pollSubscribers += 1;
    if (lastCheckedAt.value === null) {
      void refresh();
    }
    if (pollTimer === null) {
      pollTimer = window.setInterval(() => {
        void refresh();
      }, intervalMs);
    }
  }

  function stopPolling(): void {
    pollSubscribers = Math.max(0, pollSubscribers - 1);
    if (pollSubscribers === 0 && pollTimer !== null) {
      window.clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  async function refresh(): Promise<void> {
    if (inFlight !== null) {
      return inFlight;
    }

    loading.value = true;
    inFlight = (async () => {
      await Promise.allSettled([loadHealth(), loadReadiness()]);
      lastCheckedAt.value = new Date();
      loading.value = false;
      inFlight = null;
    })();

    return inFlight;
  }

  async function loadHealth(): Promise<void> {
    healthError.value = null;

    try {
      health.value = await fetchHealth();
    } catch (error) {
      health.value = null;
      healthError.value = errorMessage(error);
    }
  }

  async function loadReadiness(): Promise<void> {
    readinessError.value = null;

    try {
      readiness.value = await fetchReadiness();
    } catch (error) {
      readiness.value = null;
      readinessError.value = errorMessage(error);
    }
  }

  return {
    health,
    readiness,
    healthError,
    readinessError,
    loading,
    lastCheckedAt,
    apiTone,
    dbTone,
    overallTone,
    apiLabel,
    dbLabel,
    overallLabel,
    refresh,
    startPolling,
    stopPolling,
  };
});
