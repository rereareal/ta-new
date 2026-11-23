<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

import AppShell from "@/components/layout/AppShell.vue";
import ToastHost from "@/components/ui/ToastHost.vue";

const route = useRoute();
const bare = computed(() => route.meta.bare === true);
</script>

<template>
  <ToastHost />
  <RouterView v-if="bare" />
  <AppShell v-else />
</template>
