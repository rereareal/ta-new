<script setup lang="ts">
import { useRoute } from "vue-router";

import { isPathActive } from "@/utils/nav.ts";

const route = useRoute();

const items = [
  { label: "控制台", path: "/admin", exact: true },
  { label: "资源库", path: "/admin/resources", exact: false },
  { label: "智能体", path: "/admin/agent", exact: false },
];
</script>

<template>
  <div class="border-b border-slate-200 bg-white">
    <nav class="mx-auto flex w-full max-w-[1400px] items-center gap-1 px-4 sm:px-6">
      <RouterLink
        v-for="item in items"
        :key="item.path"
        :to="item.path"
        class="relative px-3 py-2.5 text-xs font-medium transition"
        :class="
          isPathActive(item.path, route.path, item.exact)
            ? 'text-slate-900 after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:bg-slate-900'
            : 'text-slate-500 hover:text-slate-800'
        "
      >
        {{ item.label }}
      </RouterLink>
    </nav>
  </div>
</template>
