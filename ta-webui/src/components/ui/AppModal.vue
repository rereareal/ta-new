<script setup lang="ts">
import AppIcon from "./AppIcon.vue";

defineProps<{
  open: boolean;
  title?: string;
  wide?: boolean;
}>();

const emit = defineEmits<{ close: [] }>();
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/40 p-4"
      @click.self="emit('close')"
    >
      <div
        class="flex max-h-[88vh] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        :class="wide ? 'max-w-4xl' : 'max-w-lg'"
      >
        <div class="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <h2 class="text-sm font-semibold text-slate-900">{{ title }}</h2>
          <button
            type="button"
            class="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="关闭"
            @click="emit('close')"
          >
            <AppIcon name="close" class="text-[18px]" />
          </button>
        </div>
        <div class="overflow-y-auto p-5">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>
