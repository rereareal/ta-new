<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();
</script>

<template>
  <div class="flex min-h-[60vh] items-center justify-center">
    <div class="text-center">
      <p class="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-400">404</p>
      <h1 class="mt-2 text-2xl font-semibold tracking-tight text-slate-900">页面不存在</h1>
      <p class="mt-2 text-sm text-slate-500">这个地址可能已经移动或被移除。</p>
      <button
        type="button"
        class="mt-5 rounded-md bg-slate-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-slate-800"
        @click="router.push('/')"
      >
        返回智能家教
      </button>
    </div>
  </div>
</template>
