<script setup lang="ts">
defineProps<{
  eyebrow?: string;
  title: string;
  description?: string;
}>();
</script>

<template>
  <header class="flex flex-wrap items-end justify-between gap-4">
    <div class="min-w-0">
      <p
        v-if="eyebrow"
        class="mb-1 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400"
      >
        {{ eyebrow }}
      </p>
      <h1 class="text-2xl font-semibold tracking-tight text-slate-900">{{ title }}</h1>
      <p v-if="description" class="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
        {{ description }}
      </p>
    </div>
    <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2">
      <slot name="actions" />
    </div>
  </header>
</template>
