<script setup lang="ts">
import { onMounted } from "vue";

import AppIcon from "@/components/ui/AppIcon.vue";
import ErrorBanner from "@/components/ui/ErrorBanner.vue";
import PageHeader from "@/components/ui/PageHeader.vue";
import StatusBadge from "@/components/ui/StatusBadge.vue";
import { useAgentStore } from "@/stores/agent.ts";
import { sideEffectBadge } from "@/utils/labels.ts";

const agent = useAgentStore();

onMounted(() => {
  void agent.load();
});
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      eyebrow="Admin / Agent"
      title="智能体核心与工具编排"
      description="查看各模块注册的工具、提示词版本和调用边界。"
    >
      <template #actions>
        <button
          type="button"
          class="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300"
          @click="agent.load()"
        >
          刷新
        </button>
      </template>
    </PageHeader>

    <ErrorBanner v-if="agent.error">{{ agent.error }}</ErrorBanner>

    <div
      class="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-800"
    >
      这里是只读视图：提示词是随代码评审和发布的代码资产，不在线编辑；工具由各模块实现并通过
      ToolProvider 注入。
    </div>

    <div class="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
      <section class="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 class="text-sm font-semibold text-slate-900">已注册跨模块工具</h2>
          <span class="text-[11px] text-slate-400">{{ agent.tools.length }} 个</span>
        </div>

        <div v-if="agent.loading" class="mt-3 space-y-2">
          <div v-for="index in 4" :key="index" class="h-14 animate-pulse rounded-xl bg-slate-100" />
        </div>

        <div v-else-if="agent.tools.length === 0" class="py-10 text-center">
          <AppIcon name="smart_toy" class="mx-auto text-3xl text-slate-300" />
          <p class="mt-2 text-sm text-slate-500">还没有注册工具</p>
        </div>

        <div v-else class="divide-y divide-slate-100">
          <div v-for="tool in agent.tools" :key="tool.name" class="py-3 first:pt-4 last:pb-0">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <code class="text-xs font-medium text-slate-800">{{ tool.name }}</code>
              <div class="flex items-center gap-2">
                <StatusBadge :badge="sideEffectBadge(tool.side_effect)" />
                <span class="text-[10px] tabular-nums text-slate-400"
                  >{{ tool.timeout_ms }} ms</span
                >
              </div>
            </div>
            <p class="mt-1 text-xs leading-5 text-slate-500">{{ tool.description }}</p>
          </div>
        </div>
      </section>

      <section class="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 class="text-sm font-semibold text-slate-900">提示词版本</h2>
          <span
            class="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-500"
          >
            只读
          </span>
        </div>

        <div v-if="agent.loading" class="mt-3 space-y-2">
          <div v-for="index in 3" :key="index" class="h-10 animate-pulse rounded-lg bg-slate-100" />
        </div>

        <div v-else-if="agent.prompts.length === 0" class="py-10 text-center">
          <AppIcon name="description" class="mx-auto text-3xl text-slate-300" />
          <p class="mt-2 text-sm text-slate-500">还没有提示词记录</p>
        </div>

        <ul v-else class="divide-y divide-slate-100">
          <li
            v-for="prompt in agent.prompts"
            :key="prompt.version"
            class="py-3 first:pt-4 last:pb-0"
          >
            <code class="text-xs font-medium text-slate-800">{{ prompt.version }}</code>
            <p class="mt-1 text-xs leading-5 text-slate-500">{{ prompt.description }}</p>
          </li>
        </ul>
      </section>
    </div>

    <section class="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 class="text-sm font-semibold text-slate-900">教学规范与 System Prompt 核心</h2>
      <div class="mt-3 grid gap-3 sm:grid-cols-3">
        <div class="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
          <p class="text-[11px] font-medium text-slate-700">先问思路，再给答案</p>
          <p class="mt-1 text-[11px] leading-5 text-slate-500">
            避免把完整解答直接交给学生；先定位卡点。
          </p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
          <p class="text-[11px] font-medium text-slate-700">回答必须可追溯</p>
          <p class="mt-1 text-[11px] leading-5 text-slate-500">
            引用课程单元或资源切片，不凭空生成事实。
          </p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
          <p class="text-[11px] font-medium text-slate-700">工具失败不中断对话</p>
          <p class="mt-1 text-[11px] leading-5 text-slate-500">
            外部工具错误转成模型可读文本，并保留审计记录。
          </p>
        </div>
      </div>
    </section>
  </div>
</template>
