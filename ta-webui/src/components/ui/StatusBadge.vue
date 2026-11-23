<script setup lang="ts">
import type { StatusBadge } from "@/utils/labels.ts";

defineProps<{ badge: StatusBadge }>();
</script>

<template>
  <span class="rounded-full border px-2 py-0.5 text-[10px] font-medium" :class="badge.className">
    {{ badge.label }}
  </span>
</template>
