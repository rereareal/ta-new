<script setup lang="ts">
import { computed, onMounted } from "vue";

import AppIcon from "@/components/ui/AppIcon.vue";
import PageHeader from "@/components/ui/PageHeader.vue";
import { apiBaseUrl } from "@/config.ts";
import { useAgentStore } from "@/stores/agent.ts";
import { useResourcesStore } from "@/stores/resources.ts";
import { useSystemStore } from "@/stores/system.ts";
import { dotClass } from "@/utils/tone.ts";

const system = useSystemStore();
const resources = useResourcesStore();
const agent = useAgentStore();

const docsUrl = `${apiBaseUrl}/docs`;

const resourceCount = computed(() =>
  resources.status === "ready" ? resources.items.length : null,
);
const toolCount = computed(() => (agent.status === "ready" ? agent.tools.length : null));

onMounted(() => {
  void system.refresh();
  void resources.loadAll();
  void agent.load();
});
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      eyebrow="Admin"
      title="控制台与服务中枢"
      description="资源、智能体和后端服务的入口。所有数据都通过 FastAPI 读取。"
    />

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RouterLink
        to="/admin/resources"
        class="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-[0_8px_30px_rgba(15,23,42,0.06)]"
      >
        <div class="flex items-center justify-between">
          <AppIcon name="folder_open" class="text-[22px] text-slate-400" />
          <span class="text-[10px] text-slate-400">资源</span>
        </div>
        <p class="mt-5 text-2xl font-semibold tabular-nums text-slate-900">
          {{ resourceCount ?? "—" }}
        </p>
        <p class="mt-1 text-xs text-slate-500">多媒体资源与知识切片</p>
      </RouterLink>

      <RouterLink
        to="/admin/agent"
        class="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-[0_8px_30px_rgba(15,23,42,0.06)]"
      >
        <div class="flex items-center justify-between">
          <AppIcon name="smart_toy" class="text-[22px] text-slate-400" />
          <span class="text-[10px] text-slate-400">智能体</span>
        </div>
        <p class="mt-5 text-2xl font-semibold tabular-nums text-slate-900">
          {{ toolCount ?? "—" }}
        </p>
        <p class="mt-1 text-xs text-slate-500">已注册工具与提示词版本</p>
      </RouterLink>

      <RouterLink
        to="/system"
        class="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-[0_8px_30px_rgba(15,23,42,0.06)]"
      >
        <div class="flex items-center justify-between">
          <AppIcon name="dns" class="text-[22px] text-slate-400" />
          <span class="text-[10px] text-slate-400">API</span>
        </div>
        <div class="mt-5 flex items-center gap-2">
          <span class="h-2 w-2 rounded-full" :class="dotClass(system.apiTone)" />
          <span class="text-lg font-semibold text-slate-900">{{ system.apiLabel }}</span>
        </div>
        <p class="mt-1 text-xs text-slate-500">FastAPI · 8000</p>
      </RouterLink>

      <div class="rounded-2xl border border-slate-200 bg-white p-5">
        <div class="flex items-center justify-between">
          <AppIcon name="database" class="text-[22px] text-slate-400" />
          <span class="text-[10px] text-slate-400">数据库</span>
        </div>
        <div class="mt-5 flex items-center gap-2">
          <span class="h-2 w-2 rounded-full" :class="dotClass(system.dbTone)" />
          <span class="text-lg font-semibold text-slate-900">{{ system.dbLabel }}</span>
        </div>
        <p class="mt-1 text-xs text-slate-500">SQLite / PostgreSQL</p>
      </div>
    </div>

    <section class="grid gap-4 lg:grid-cols-2">
      <div class="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 class="text-sm font-semibold text-slate-900">服务说明</h2>
        <ul class="mt-3 space-y-2 text-xs leading-5 text-slate-500">
          <li class="flex gap-2">
            <AppIcon name="check_circle" class="text-[15px] text-slate-400" />
            认证、探针已经接通 FastAPI。
          </li>
          <li class="flex gap-2">
            <AppIcon name="pending" class="text-[15px] text-slate-400" />
            课程、进度、资源、智能体接口目前是 501 占位。
          </li>
          <li class="flex gap-2">
            <AppIcon name="info" class="text-[15px] text-slate-400" />
            管理员页面是前端拦截，后端尚未校验角色。
          </li>
        </ul>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 class="text-sm font-semibold text-slate-900">快速入口</h2>
        <div class="mt-3 flex flex-wrap gap-2">
          <RouterLink
            to="/admin/resources"
            class="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition hover:border-slate-300"
          >
            资源库
          </RouterLink>
          <RouterLink
            to="/admin/agent"
            class="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition hover:border-slate-300"
          >
            智能体
          </RouterLink>
          <RouterLink
            to="/system"
            class="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition hover:border-slate-300"
          >
            系统状态
          </RouterLink>
          <a
            :href="docsUrl"
            target="_blank"
            rel="noreferrer"
            class="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition hover:border-slate-300"
          >
            接口文档
          </a>
        </div>
      </div>
    </section>
  </div>
</template>
