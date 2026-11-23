<script setup lang="ts">
import AppIcon from "@/components/ui/AppIcon.vue";
import type { CourseTreeNode, UnitStatus } from "@/types/index.ts";
import { unitStatusTone } from "@/utils/labels.ts";
import { dotClass } from "@/utils/tone.ts";

defineOptions({ name: "KnowledgeTree" });

defineProps<{
  nodes: CourseTreeNode[];
  activeId: string | null;
  statuses: Record<string, UnitStatus>;
}>();

const emit = defineEmits<{ select: [unitId: string] }>();

function statusDotClass(status: UnitStatus | undefined): string {
  return status === undefined ? "bg-slate-200" : dotClass(unitStatusTone(status));
}
</script>

<template>
  <ul class="space-y-1">
    <li v-for="node in nodes" :key="node.id">
      <button
        v-if="node.kind === 'unit'"
        type="button"
        class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition"
        :class="
          activeId === node.id
            ? 'bg-slate-100 font-medium text-slate-900'
            : 'text-slate-600 hover:bg-slate-50'
        "
        @click="emit('select', node.id)"
      >
        <span class="min-w-0 flex-1 truncate">{{ node.title }}</span>
        <span
          class="h-1.5 w-1.5 shrink-0 rounded-full"
          :class="statusDotClass(statuses[node.id])"
        />
      </button>

      <details v-else open class="group">
        <summary
          class="flex cursor-pointer list-none items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400 transition hover:bg-slate-50"
        >
          <AppIcon name="chevron_right" class="text-[14px] transition group-open:rotate-90" />
          {{ node.title }}
        </summary>
        <KnowledgeTree
          v-if="node.children.length"
          :nodes="node.children"
          :active-id="activeId"
          :statuses="statuses"
          class="ml-3 border-l border-slate-100 pl-2"
          @select="emit('select', $event)"
        />
      </details>
    </li>
  </ul>
</template>
