<script setup lang="ts">
withDefaults(defineProps<{ size?: "sm" | "md" | "lg" }>(), { size: "sm" });
</script>

<template>
  <div
    class="flex shrink-0 items-center justify-center rounded-lg bg-slate-900 font-semibold tracking-tight text-white shadow-sm"
    :class="
      size === 'lg' ? 'h-10 w-10 text-sm' : size === 'md' ? 'h-8 w-8 text-xs' : 'h-7 w-7 text-xs'
    "
  >
    E
  </div>
</template>
