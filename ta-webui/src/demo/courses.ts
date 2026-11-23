import type { CourseDetail, CourseSummary } from "@/types/index.ts";
import { demoUnits } from "./units.ts";

export const demoCourses: CourseSummary[] = [
  {
    id: "dsa",
    title: "数据结构与算法",
    description: "从线性结构到树与图，用可运行的例子理解复杂度、结构与取舍。",
    status: "published",
    unit_count: 7,
    progress: 42,
  },
  {
    id: "prob",
    title: "概率论与数理统计",
    description: "从样本空间出发，建立条件概率、随机变量与期望的直觉。",
    status: "verified",
    unit_count: 5,
    progress: 20,
  },
];

const dsaTree = [
  {
    id: "dsa-ch1",
    title: "第 1 章 线性结构",
    kind: "chapter" as const,
    children: [
      { id: "array-list", title: "数组与链表", kind: "unit" as const, children: [] },
      { id: "stack-queue", title: "栈与队列", kind: "unit" as const, children: [] },
    ],
  },
  {
    id: "dsa-ch2",
    title: "第 2 章 树",
    kind: "chapter" as const,
    children: [
      { id: "binary-tree", title: "二叉树基础", kind: "unit" as const, children: [] },
      { id: "bst", title: "二叉搜索树", kind: "unit" as const, children: [] },
      { id: "avl", title: "平衡树", kind: "unit" as const, children: [] },
    ],
  },
  {
    id: "dsa-ch3",
    title: "第 3 章 图",
    kind: "chapter" as const,
    children: [
      { id: "graph-repr", title: "图的表示", kind: "unit" as const, children: [] },
      { id: "shortest-path", title: "最短路径", kind: "unit" as const, children: [] },
    ],
  },
];

const probTree = [
  {
    id: "prob-ch1",
    title: "第 1 章 概率基础",
    kind: "chapter" as const,
    children: [
      { id: "sample-space", title: "样本空间与事件", kind: "unit" as const, children: [] },
      { id: "conditional", title: "条件概率", kind: "unit" as const, children: [] },
    ],
  },
  {
    id: "prob-ch2",
    title: "第 2 章 随机变量",
    kind: "chapter" as const,
    children: [
      { id: "discrete-rv", title: "离散随机变量", kind: "unit" as const, children: [] },
      { id: "continuous-rv", title: "连续随机变量", kind: "unit" as const, children: [] },
      { id: "expectation", title: "期望与方差", kind: "unit" as const, children: [] },
    ],
  },
];

export const demoCourseDetails: Record<string, CourseDetail> = {
  dsa: {
    id: "dsa",
    title: "数据结构与算法",
    description: demoCourses[0]?.description ?? "",
    status: "published",
    tree: dsaTree,
  },
  prob: {
    id: "prob",
    title: "概率论与数理统计",
    description: demoCourses[1]?.description ?? "",
    status: "verified",
    tree: probTree,
  },
};

export function demoUnitTitle(unitId: string): string {
  return demoUnits[unitId]?.title ?? unitId;
}
