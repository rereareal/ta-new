import type { CourseProgress, MasteryScore, RecentActivity } from "@/types/index.ts";

export const demoProgress: CourseProgress[] = [
  {
    course_id: "dsa",
    title: "数据结构与算法",
    percent: 42,
    completed_units: 3,
    total_units: 7,
    last_activity_at: "2026-11-07T20:42:00+08:00",
    units: [
      { unit_id: "array-list", title: "数组与链表", status: "completed" },
      { unit_id: "stack-queue", title: "栈与队列", status: "completed" },
      { unit_id: "binary-tree", title: "二叉树基础", status: "completed" },
      { unit_id: "bst", title: "二叉搜索树", status: "in_progress" },
      { unit_id: "avl", title: "平衡树", status: "not_started" },
      { unit_id: "graph-repr", title: "图的表示", status: "not_started" },
      { unit_id: "shortest-path", title: "最短路径", status: "not_started" },
    ],
  },
  {
    course_id: "prob",
    title: "概率论与数理统计",
    percent: 20,
    completed_units: 1,
    total_units: 5,
    last_activity_at: "2026-11-05T19:10:00+08:00",
    units: [
      { unit_id: "sample-space", title: "样本空间与事件", status: "completed" },
      { unit_id: "conditional", title: "条件概率", status: "in_progress" },
      { unit_id: "discrete-rv", title: "离散随机变量", status: "not_started" },
      { unit_id: "continuous-rv", title: "连续随机变量", status: "not_started" },
      { unit_id: "expectation", title: "期望与方差", status: "not_started" },
    ],
  },
];

export const demoMastery: MasteryScore[] = [
  { label: "理论", score: 90 },
  { label: "推导", score: 82 },
  { label: "实现", score: 75 },
  { label: "工程", score: 60 },
  { label: "边界", score: 55 },
];

export const demoRecentActivity: RecentActivity[] = [
  { title: "红黑树旋转节点归属", detail: "语音研讨 · 6 分钟", when: "今天 14:32" },
  { title: "AVL 树双旋转四种形态推演", detail: "95 分 · 12 分钟", when: "昨天 20:15" },
  { title: "算法精讲：图拓扑排序", detail: "完成思考题 3 道", when: "3 天前" },
  { title: "TCP 握手异常重传分析", detail: "90 分 · 8 分钟", when: "4 天前" },
];
