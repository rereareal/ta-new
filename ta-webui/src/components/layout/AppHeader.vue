<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { demoMode } from "@/config.ts";
import { useCoursesStore } from "@/stores/courses.ts";
import { useSessionStore } from "@/stores/session.ts";
import { isPathActive } from "@/utils/nav.ts";
import AppIcon from "@/components/ui/AppIcon.vue";
import ApiStatus from "./ApiStatus.vue";
import AppLogo from "./AppLogo.vue";

const route = useRoute();
const router = useRouter();
const session = useSessionStore();
const courses = useCoursesStore();

const mobileOpen = ref(false);

const navItems = computed(() => {
  const items = [
    { label: "智能家教", path: "/" },
    { label: "知识库", path: "/knowledge" },
    { label: "学情诊断", path: "/progress" },
  ];

  if (session.isAdmin) {
    items.push({ label: "管理控制", path: "/admin" });
  }

  return items;
});

const contextTitle = computed(() => courses.currentCourse?.title ?? "AI 私人家教");

function goLogin(): void {
  mobileOpen.value = false;
  void router.push("/login");
}

function logout(): void {
  session.logout();
  mobileOpen.value = false;
  void router.push("/login");
}

watch(
  () => route.path,
  () => {
    mobileOpen.value = false;
  },
);
</script>

<template>
  <header
    class="sticky top-0 z-40 w-full border-b border-slate-200/70 bg-[#fafbfd]/90 backdrop-blur-md"
  >
    <div class="mx-auto flex h-14 w-full max-w-[1400px] items-center justify-between px-4 sm:px-6">
      <div class="flex min-w-0 items-center gap-7">
        <RouterLink to="/" class="flex items-center gap-2.5">
          <AppLogo />
          <span class="text-sm font-semibold tracking-tight text-slate-900">EduTutor</span>
          <span class="hidden text-[11px] font-normal text-slate-400 sm:inline">AI</span>
        </RouterLink>

        <nav class="hidden items-center gap-1 md:flex">
          <RouterLink
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="rounded-md px-3 py-1.5 text-xs font-medium transition"
            :class="
              isPathActive(item.path, route.path)
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-500 hover:bg-slate-100/70 hover:text-slate-900'
            "
          >
            {{ item.label }}
          </RouterLink>
        </nav>
      </div>

      <div class="flex items-center gap-2 sm:gap-3">
        <div
          class="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-600 xl:flex"
        >
          <span class="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span class="max-w-[180px] truncate">{{ contextTitle }}</span>
        </div>

        <span
          v-if="demoMode"
          class="hidden rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 sm:inline-flex"
        >
          演示
        </span>

        <ApiStatus />

        <details v-if="session.isAuthenticated" class="relative hidden md:block">
          <summary
            class="flex cursor-pointer list-none items-center gap-2 rounded-full p-0.5 pl-2 transition hover:bg-slate-100"
          >
            <span class="hidden text-xs font-medium text-slate-600 lg:inline">{{
              session.userName
            }}</span>
            <span
              class="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white"
            >
              {{ session.initial }}
            </span>
          </summary>
          <div
            class="absolute right-0 top-10 w-56 rounded-xl border border-slate-200 bg-white p-3 shadow-[0_12px_40px_rgba(15,23,42,0.12)]"
          >
            <p class="truncate text-xs font-medium text-slate-800">{{ session.email }}</p>
            <p class="mt-0.5 text-[10px] text-slate-400">
              {{ session.isAdmin ? "管理员" : "学习者" }}
            </p>
            <div class="mt-3 border-t border-slate-100 pt-2">
              <button
                type="button"
                class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-slate-600 transition hover:bg-slate-100"
                @click="logout"
              >
                <AppIcon name="logout" class="text-[16px]" />
                退出登录
              </button>
            </div>
          </div>
        </details>

        <button
          v-else
          type="button"
          class="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300"
          @click="goLogin"
        >
          登录
        </button>

        <button
          type="button"
          class="rounded-md p-1 text-slate-500 transition hover:bg-slate-100 md:hidden"
          aria-label="打开菜单"
          @click="mobileOpen = !mobileOpen"
        >
          <AppIcon :name="mobileOpen ? 'close' : 'menu'" class="text-[22px]" />
        </button>
      </div>
    </div>

    <div v-if="mobileOpen" class="border-t border-slate-100 bg-white px-4 py-3 md:hidden">
      <nav class="flex flex-col gap-1">
        <RouterLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="rounded-md px-3 py-2 text-sm transition"
          :class="
            isPathActive(item.path, route.path) ? 'bg-slate-100 text-slate-900' : 'text-slate-600'
          "
        >
          {{ item.label }}
        </RouterLink>
      </nav>
      <div class="mt-2 border-t border-slate-100 pt-2">
        <button
          v-if="session.isAuthenticated"
          type="button"
          class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-600"
          @click="logout"
        >
          <AppIcon name="logout" class="text-[18px]" />
          退出登录（{{ session.email }}）
        </button>
        <button
          v-else
          type="button"
          class="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white"
          @click="goLogin"
        >
          登录
        </button>
      </div>
    </div>
  </header>
</template>
