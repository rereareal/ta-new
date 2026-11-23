<script setup lang="ts">
withDefaults(defineProps<{ tone?: "danger" | "warning" }>(), { tone: "danger" });
</script>

<template>
  <div
    class="rounded-xl border px-4 py-3 text-xs leading-5"
    :class="
      tone === 'warning'
        ? 'border-amber-200 bg-amber-50 text-amber-800'
        : 'border-red-200 bg-red-50 text-red-700'
    "
  >
    <slot />
  </div>
</template>
