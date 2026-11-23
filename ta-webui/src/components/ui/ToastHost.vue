<script setup lang="ts">
import { useToastStore } from "@/stores/toast.ts";

const toast = useToastStore();
</script>

<template>
  <Transition name="toast">
    <div
      v-if="toast.message"
      class="fixed left-1/2 top-4 z-[100] -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.12)]"
    >
      {{ toast.message }}
    </div>
  </Transition>
</template>
