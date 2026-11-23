<script setup lang="ts">
import { computed, onMounted } from "vue";

import PageHeader from "@/components/ui/PageHeader.vue";
import { apiBaseUrl } from "@/config.ts";
import { useSystemStore } from "@/stores/system.ts";
import { dotClass } from "@/utils/tone.ts";

const system = useSystemStore();

const docsUrl = `${apiBaseUrl}/docs`;
const lastChecked = computed(() =>
  system.lastCheckedAt ? system.lastCheckedAt.toLocaleTimeString("zh-CN") : "尚未检查",
);

function formatUptime(seconds: number | undefined): string {
  if (seconds === undefined) {
    return "—";
  }
  const total = Math.round(seconds);
  return total < 60 ? `${total} 秒` : `${Math.floor(total / 60)} 分 ${total % 60} 秒`;
}

onMounted(() => {
  void system.refresh();
});
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      eyebrow="System"
      title="系统状态"
      description="直接读取后端探针，不做本地缓存推断。"
    >
      <template #actions>
        <button
          type="button"
          class="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 disabled:opacity-60"
          :disabled="system.loading"
          @click="system.refresh()"
        >
          {{ system.loading ? "检查中…" : "重新检查" }}
        </button>
        <a
          :href="docsUrl"
          target="_blank"
          rel="noreferrer"
          class="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800"
        >
          接口文档
        </a>
      </template>
    </PageHeader>

    <div class="grid gap-4 md:grid-cols-2">
      <section class="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-semibold text-slate-900">API 健康</h2>
          <span class="flex items-center gap-2 text-[11px] text-slate-500">
            <span class="h-2 w-2 rounded-full" :class="dotClass(system.apiTone)" />
            {{ system.apiLabel }}
          </span>
        </div>
        <dl class="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs">
          <div class="flex justify-between gap-3">
            <dt class="text-slate-400">服务</dt>
            <dd class="text-slate-700">{{ system.health?.service ?? "—" }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-slate-400">运行时长</dt>
            <dd class="tabular-nums text-slate-700">
              {{ formatUptime(system.health?.uptimeSeconds) }}
            </dd>
          </div>
        </dl>
        <p
          v-if="system.healthError"
          class="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700"
        >
          {{ system.healthError }}
        </p>
      </section>

      <section class="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-semibold text-slate-900">数据库就绪</h2>
          <span class="flex items-center gap-2 text-[11px] text-slate-500">
            <span class="h-2 w-2 rounded-full" :class="dotClass(system.dbTone)" />
            {{ system.dbLabel }}
          </span>
        </div>
        <dl class="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs">
          <div class="flex justify-between gap-3">
            <dt class="text-slate-400">status</dt>
            <dd class="text-slate-700">{{ system.readiness?.status ?? "—" }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-slate-400">database</dt>
            <dd class="text-slate-700">{{ system.readiness?.checks?.database ?? "—" }}</dd>
          </div>
        </dl>
        <p
          v-if="system.readinessError"
          class="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800"
        >
          {{ system.readinessError }}
        </p>
      </section>
    </div>

    <section class="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 class="text-sm font-semibold text-slate-900">接口入口</h2>
      <div class="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <code class="rounded bg-slate-50 px-2 py-1">{{ apiBaseUrl }}</code>
        <span>·</span>
        <span>上次检查：{{ lastChecked }}</span>
      </div>
      <ul class="mt-4 divide-y divide-slate-100 text-xs">
        <li class="flex items-center gap-3 py-2.5">
          <span
            class="w-12 rounded bg-emerald-50 px-1.5 py-0.5 text-center text-[10px] text-emerald-700"
            >GET</span
          >
          <code class="text-slate-700">/health</code>
          <span class="text-slate-400">进程健康，不检查数据库</span>
        </li>
        <li class="flex items-center gap-3 py-2.5">
          <span
            class="w-12 rounded bg-emerald-50 px-1.5 py-0.5 text-center text-[10px] text-emerald-700"
            >GET</span
          >
          <code class="text-slate-700">/ready</code>
          <span class="text-slate-400">数据库就绪检查，未就绪返回 503</span>
        </li>
        <li class="flex items-center gap-3 py-2.5">
          <span
            class="w-12 rounded bg-amber-50 px-1.5 py-0.5 text-center text-[10px] text-amber-700"
            >POST</span
          >
          <code class="text-slate-700">/auth/login</code>
          <span class="text-slate-400">登录并返回 JWT + role</span>
        </li>
        <li class="flex items-center gap-3 py-2.5">
          <span
            class="w-12 rounded bg-slate-100 px-1.5 py-0.5 text-center text-[10px] text-slate-500"
            >501</span
          >
          <code class="text-slate-700">/agent /courses /learner /resources /speech</code>
          <span class="text-slate-400">占位接口</span>
        </li>
      </ul>
    </section>
  </div>
</template>
