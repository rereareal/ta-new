<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from "vue";

import { useSystemStore } from "@/stores/system.ts";
import { dotClass } from "@/utils/tone.ts";

const system = useSystemStore();

const dot = computed(() => {
  if (system.loading && system.lastCheckedAt === null) {
    return "bg-slate-300 animate-pulse";
  }
  return dotClass(system.overallTone);
});

onMounted(() => {
  system.startPolling();
});

onBeforeUnmount(() => {
  system.stopPolling();
});
</script>

<template>
  <RouterLink
    to="/system"
    class="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-600 transition hover:border-slate-300 sm:flex"
    :title="system.healthError ?? system.readinessError ?? '查看系统状态'"
  >
    <span class="h-1.5 w-1.5 rounded-full" :class="dot" />
    <span>{{ system.overallLabel }}</span>
  </RouterLink>
</template>
