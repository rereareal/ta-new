<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import AppIcon from "@/components/ui/AppIcon.vue";
import AppModal from "@/components/ui/AppModal.vue";
import ErrorBanner from "@/components/ui/ErrorBanner.vue";
import PageHeader from "@/components/ui/PageHeader.vue";
import StatusBadge from "@/components/ui/StatusBadge.vue";
import { useResourcesStore } from "@/stores/resources.ts";
import { useToastStore } from "@/stores/toast.ts";
import { errorMessage } from "@/utils/errors.ts";
import { genreBadge, resourceStatusBadge } from "@/utils/labels.ts";

const toast = useToastStore();
const resources = useResourcesStore();

const typeFilter = ref("all");
const statusFilter = ref("all");

const uploadOpen = ref(false);
const uploadTitle = ref("");
const uploadFile = ref<File | null>(null);
const uploading = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const detailOpen = ref(false);
const detail = computed(() => resources.current);

const filtered = computed(() =>
  resources.items.filter((item) => {
    const typeMatches = typeFilter.value === "all" || item.type === typeFilter.value;
    const statusMatches = statusFilter.value === "all" || item.status === statusFilter.value;
    return typeMatches && statusMatches;
  }),
);

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${bytes} B`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function load(): void {
  void resources.loadAll();
}

function pickFile(event: Event): void {
  const target = event.target as HTMLInputElement;
  uploadFile.value = target.files?.[0] ?? null;
}

async function submitUpload(): Promise<void> {
  if (!uploadFile.value) {
    toast.show("请选择要上传的文件");
    return;
  }

  uploading.value = true;

  try {
    await resources.upload(uploadFile.value, uploadTitle.value.trim() || uploadFile.value.name);
    uploadOpen.value = false;
    uploadTitle.value = "";
    uploadFile.value = null;
    if (fileInput.value) {
      fileInput.value.value = "";
    }
    toast.show("材料已提交解析");
  } catch (cause) {
    toast.show(errorMessage(cause, "操作失败"));
  } finally {
    uploading.value = false;
  }
}

async function openDetail(resourceId: string): Promise<void> {
  detailOpen.value = true;

  try {
    await resources.loadDetail(resourceId);
  } catch (cause) {
    toast.show(errorMessage(cause, "操作失败"));
    detailOpen.value = false;
  }
}

function closeDetail(): void {
  detailOpen.value = false;
  resources.clearDetail();
}

onMounted(() => {
  load();
});
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      eyebrow="Admin / Resources"
      title="资源库"
      description="上传 PPT / 视频，查看解析状态与结构化片段。"
    >
      <template #actions>
        <button
          type="button"
          class="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300"
          @click="load"
        >
          刷新
        </button>
        <button
          type="button"
          class="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800"
          @click="uploadOpen = true"
        >
          上传材料
        </button>
      </template>
    </PageHeader>

    <ErrorBanner v-if="resources.error">{{ resources.error }}</ErrorBanner>

    <div class="flex flex-wrap items-center gap-2">
      <select
        v-model="typeFilter"
        class="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 outline-none focus:border-slate-400"
      >
        <option value="all">全部类型</option>
        <option value="ppt">PPT</option>
        <option value="video">视频</option>
      </select>
      <select
        v-model="statusFilter"
        class="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 outline-none focus:border-slate-400"
      >
        <option value="all">全部状态</option>
        <option value="ready">解析完成</option>
        <option value="parsing">解析中</option>
        <option value="failed">解析失败</option>
      </select>
      <span class="ml-auto text-[11px] text-slate-400">共 {{ filtered.length }} 份材料</span>
    </div>

    <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div
        class="hidden grid-cols-[2.2fr_0.7fr_0.8fr_0.7fr_0.5fr] gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-2.5 text-[10px] font-medium uppercase tracking-wide text-slate-400 md:grid"
      >
        <span>材料</span>
        <span>类型</span>
        <span>状态</span>
        <span>大小</span>
        <span class="text-right">操作</span>
      </div>

      <div v-if="resources.loading" class="space-y-3 p-4">
        <div v-for="index in 4" :key="index" class="h-10 animate-pulse rounded bg-slate-100" />
      </div>

      <div v-else-if="filtered.length === 0" class="px-6 py-12 text-center">
        <AppIcon name="folder_open" class="mx-auto text-3xl text-slate-300" />
        <p class="mt-2 text-sm text-slate-500">还没有材料</p>
      </div>

      <div v-else class="divide-y divide-slate-100">
        <button
          v-for="resource in filtered"
          :key="resource.id"
          type="button"
          class="grid w-full grid-cols-1 gap-2 px-4 py-3 text-left transition hover:bg-slate-50/70 md:grid-cols-[2.2fr_0.7fr_0.8fr_0.7fr_0.5fr] md:items-center md:gap-3"
          @click="openDetail(resource.id)"
        >
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-slate-800">{{ resource.title }}</p>
            <p class="text-[10px] text-slate-400">{{ formatDate(resource.created_at) }}</p>
          </div>
          <span
            class="w-fit rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-500"
          >
            {{ resource.type === "video" ? "VIDEO" : "SLIDE" }}
          </span>
          <StatusBadge :badge="resourceStatusBadge(resource.status)" class="w-fit" />
          <span class="text-[11px] text-slate-500">{{ formatBytes(resource.size_bytes) }}</span>
          <span class="text-right text-[11px] text-slate-400">详情</span>
        </button>
      </div>
    </div>

    <AppModal :open="uploadOpen" title="上传材料" @close="uploadOpen = false">
      <div class="space-y-4">
        <label class="block">
          <span class="mb-1.5 block text-xs font-medium text-slate-600">标题（可选）</span>
          <input
            v-model="uploadTitle"
            placeholder="不填则使用文件名"
            class="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-slate-400 focus:bg-white"
          />
        </label>

        <label class="block">
          <span class="mb-1.5 block text-xs font-medium text-slate-600">文件</span>
          <input
            ref="fileInput"
            type="file"
            accept=".ppt,.pptx,.mp4,.mov"
            class="block w-full rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-6 text-xs text-slate-500 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:text-white"
            @change="pickFile"
          />
          <span class="mt-1 block text-[10px] text-slate-400">支持 PPT / PPTX / MP4 / MOV</span>
        </label>

        <p class="text-[11px] leading-5 text-slate-400">
          上传后进入解析队列；当前后端接口返回 501，演示模式会生成一条“解析中”的材料。
        </p>

        <button
          type="button"
          class="flex h-10 w-full items-center justify-center rounded-lg bg-slate-900 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-progress disabled:opacity-60"
          :disabled="uploading"
          @click="submitUpload"
        >
          {{ uploading ? "上传中…" : "提交解析" }}
        </button>
      </div>
    </AppModal>

    <AppModal :open="detailOpen" :title="detail?.title ?? '材料详情'" wide @close="closeDetail">
      <div v-if="resources.detailLoading" class="space-y-3">
        <div v-for="index in 4" :key="index" class="h-8 animate-pulse rounded bg-slate-100" />
      </div>

      <div v-else-if="detail" class="space-y-4">
        <div class="flex flex-wrap items-center gap-2">
          <span
            class="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-500"
          >
            {{ detail.type === "video" ? "VIDEO" : "SLIDE" }}
          </span>
          <StatusBadge :badge="resourceStatusBadge(detail.status)" />
          <span class="text-[11px] text-slate-400">{{ formatBytes(detail.size_bytes) }}</span>
        </div>

        <ErrorBanner v-if="detail.parse_error">{{ detail.parse_error }}</ErrorBanner>

        <div>
          <p class="mb-2 text-[11px] font-medium text-slate-400">解析片段</p>
          <div v-if="detail.fragments.length" class="space-y-2">
            <div
              v-for="fragment in detail.fragments"
              :key="fragment.id"
              class="rounded-xl border border-slate-200 bg-slate-50/60 p-3"
            >
              <div class="mb-1 flex items-center gap-2">
                <StatusBadge :badge="genreBadge(fragment.genre)" />
                <span v-if="fragment.locator" class="text-[10px] text-slate-400">
                  {{ fragment.locator }}
                </span>
              </div>
              <p class="text-xs leading-5 text-slate-600">{{ fragment.text }}</p>
            </div>
          </div>
          <p
            v-else
            class="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-xs text-slate-400"
          >
            还没有解析片段
          </p>
        </div>
      </div>
    </AppModal>
  </div>
</template>
