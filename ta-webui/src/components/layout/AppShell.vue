<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

import AdminNav from "./AdminNav.vue";
import AppHeader from "./AppHeader.vue";

const route = useRoute();

const fullBleed = computed(() => route.meta.fullBleed === true);
const isAdminRoute = computed(() => route.path === "/admin" || route.path.startsWith("/admin/"));
</script>

<template>
  <div class="min-h-screen bg-[#fafbfd] text-slate-800">
    <AppHeader />
    <AdminNav v-if="isAdminRoute" />
    <main :class="fullBleed ? '' : 'mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8'">
      <RouterView />
    </main>
  </div>
</template>
