import type { ResourceDetail, ResourceSummary } from "@/types/index.ts";

export const demoResources: ResourceSummary[] = [
  {
    id: "bst-slides",
    title: "二叉搜索树 · 课堂讲义",
    type: "ppt",
    status: "ready",
    size_bytes: 2_400_000,
    created_at: "2026-11-02T10:12:00+08:00",
  },
  {
    id: "bst-video",
    title: "BST 删除演示",
    type: "video",
    status: "ready",
    size_bytes: 88_000_000,
    created_at: "2026-11-03T15:30:00+08:00",
  },
  {
    id: "complexity-slides",
    title: "复杂度与线性结构 · 课堂讲义",
    type: "ppt",
    status: "ready",
    size_bytes: 1_800_000,
    created_at: "2026-10-28T09:00:00+08:00",
  },
  {
    id: "prob-slides",
    title: "条件概率 · 课堂讲义",
    type: "ppt",
    status: "parsing",
    size_bytes: 3_100_000,
    created_at: "2026-11-06T11:20:00+08:00",
  },
];

export const demoResourceDetails: Record<string, ResourceDetail> = {
  "bst-slides": {
    ...demoResources[0]!,
    fragments: [
      {
        id: "f1",
        text: "对任意节点，左子树所有键都小于它，右子树所有键都大于它。",
        locator: "第 12 页",
        genre: "讲解",
      },
      {
        id: "f2",
        text: "删除有两个孩子的节点时，用中序后继替换，再删除后继。",
        locator: "第 16 页",
        genre: "讲解",
      },
      {
        id: "f3",
        text: "给定序列 8, 3, 10, 1, 6, 14，画出插入后的 BST。",
        locator: "第 18 页",
        genre: "习题",
      },
    ],
  },
  "bst-video": {
    ...demoResources[1]!,
    fragments: [
      {
        id: "f4",
        text: "演示删除叶子节点、单孩子节点和双孩子节点三种情况。",
        locator: "00:03:20–00:06:10",
        genre: "例题",
      },
    ],
  },
  "complexity-slides": {
    ...demoResources[2]!,
    fragments: [
      {
        id: "f5",
        text: "数组随机访问 O(1)，链表头部插入 O(1)，选择取决于读写比例。",
        locator: "第 6 页",
        genre: "讲解",
      },
    ],
  },
  "prob-slides": {
    ...demoResources[3]!,
    fragments: [],
    parse_error: null,
  },
};

let localResources: ResourceSummary[] = demoResources.map((item) => ({ ...item }));
let localDetails: Record<string, ResourceDetail> = Object.fromEntries(
  Object.entries(demoResourceDetails).map(([key, value]) => [
    key,
    { ...value, fragments: value.fragments.map((fragment) => ({ ...fragment })) },
  ]),
);

export function listDemoResources(): ResourceSummary[] {
  return localResources.map((item) => ({ ...item }));
}

export function getDemoResource(resourceId: string): ResourceDetail | null {
  const detail = localDetails[resourceId];
  if (!detail) {
    return null;
  }
  return {
    ...detail,
    fragments: detail.fragments.map((fragment) => ({ ...fragment })),
  };
}

export function uploadDemoResource(file: File, title: string): ResourceSummary {
  const created: ResourceDetail = {
    id: crypto.randomUUID(),
    title: title || file.name,
    type: file.name.toLowerCase().endsWith(".mp4") ? "video" : "ppt",
    status: "parsing",
    size_bytes: file.size,
    created_at: new Date().toISOString(),
    fragments: [],
    parse_error: null,
  };
  localResources.unshift(created);
  localDetails[created.id] = created;
  return {
    id: created.id,
    title: created.title,
    type: created.type,
    status: created.status,
    size_bytes: created.size_bytes,
    created_at: created.created_at,
  };
}

export function resetDemoResources(): void {
  localResources = demoResources.map((item) => ({ ...item }));
  localDetails = Object.fromEntries(
    Object.entries(demoResourceDetails).map(([key, value]) => [
      key,
      { ...value, fragments: value.fragments.map((fragment) => ({ ...fragment })) },
    ]),
  );
}
