import { computed, ref } from "vue";
import { defineStore } from "pinia";

import { listPrompts, listTools } from "@/api/agent.ts";
import type { PromptInfo, ToolInfo } from "@/types/index.ts";
import { errorMessage } from "@/utils/errors.ts";
import { isLoading, type LoadStatus } from "@/utils/status.ts";

export const useAgentStore = defineStore("agent", () => {
  const tools = ref<ToolInfo[]>([]);
  const prompts = ref<PromptInfo[]>([]);

  const status = ref<LoadStatus>("idle");
  const error = ref<string | null>(null);
  const loading = computed(() => isLoading(status.value));

  /**
   * 工具和提示词一起取；任意一个失败都算加载失败，但已成功的一边仍然可用。
   */
  async function load(): Promise<void> {
    status.value = "loading";
    error.value = null;

    const [toolResult, promptResult] = await Promise.allSettled([listTools(), listPrompts()]);

    if (toolResult.status === "fulfilled") {
      tools.value = toolResult.value;
    } else {
      error.value = errorMessage(toolResult.reason, "无法加载智能体配置");
    }

    if (promptResult.status === "fulfilled") {
      prompts.value = promptResult.value;
    } else if (error.value === null) {
      error.value = errorMessage(promptResult.reason, "无法加载智能体配置");
    }

    status.value = error.value === null ? "ready" : "error";
  }

  function clear(): void {
    tools.value = [];
    prompts.value = [];
    status.value = "idle";
    error.value = null;
  }

  return { tools, prompts, status, error, loading, load, clear };
});
