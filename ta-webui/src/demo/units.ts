import type { UnitDetail } from "@/types/index.ts";

export const demoUnits: Record<string, UnitDetail> = {
  "array-list": {
    id: "array-list",
    title: "数组与链表",
    content_md: `## 数组与链表

数组和链表是两种最基础的线性结构，它们的差异几乎决定了后续所有结构的选择。

| 操作 | 数组 | 链表 |
| --- | --- | --- |
| 随机访问 | O(1) | O(n) |
| 头部插入 | O(n) | O(1) |
| 内存布局 | 连续 | 分散 |

> 先问自己：读多还是写多？答案通常就是选择的依据。`,
    prerequisites: [],
    successors: ["stack-queue"],
    resources: [
      {
        resource_id: "complexity-slides",
        title: "复杂度与线性结构 · 课堂讲义",
        type: "ppt",
        locator: "第 3–11 页",
      },
    ],
  },
  "stack-queue": {
    id: "stack-queue",
    title: "栈与队列",
    content_md: `## 栈与队列

- **栈**：后进先出，典型场景是函数调用、括号匹配、DFS。
- **队列**：先进先出，典型场景是 BFS、任务调度。

两者都可以用数组或链表实现，区别在于把哪一端当作“出口”。`,
    prerequisites: ["array-list"],
    successors: ["binary-tree"],
    resources: [],
  },
  "binary-tree": {
    id: "binary-tree",
    title: "二叉树基础",
    content_md: `## 二叉树基础

每个节点最多有两个孩子。三种深度优先遍历的区别只在于访问根的顺序：

1. 前序：根 → 左 → 右
2. 中序：左 → 根 → 右
3. 后序：左 → 右 → 根

中序遍历在二叉搜索树上会得到有序序列，这是后面理解 BST 的关键。`,
    prerequisites: ["stack-queue"],
    successors: ["bst"],
    resources: [],
  },
  bst: {
    id: "bst",
    title: "二叉搜索树",
    content_md: `## 二叉搜索树

**定义**：对任意节点，左子树所有键都小于它，右子树所有键都大于它。

\`\`\`text
        8
       / \\
      3   10
     / \\    \\
    1   6    14
\`\`\`

### 查找

从根开始比较：比当前节点小就往左，大就往右。树高为 \`h\` 时，查找是 **O(h)**。

### 删除

删除是 BST 最容易讲错的部分，分三种情况：

1. **叶子节点**：直接删除。
2. **只有一个孩子**：用孩子顶替当前位置。
3. **有两个孩子**：用中序后继（右子树最小节点）替换值，再删除后继。

> 中序后继保证了“替换后仍然满足 BST 性质”，而不是随便找一个孩子补上。

如果树退化成链表，\`h\` 会变成 \`n\`。这正是平衡树要解决的问题。`,
    prerequisites: ["binary-tree"],
    successors: ["avl"],
    resources: [
      {
        resource_id: "bst-slides",
        title: "二叉搜索树 · 课堂讲义",
        type: "ppt",
        locator: "第 12–18 页",
      },
      {
        resource_id: "bst-video",
        title: "BST 删除演示",
        type: "video",
        locator: "00:03:20–00:06:10",
      },
    ],
  },
  avl: {
    id: "avl",
    title: "平衡树",
    content_md: `## 平衡树

AVL 树通过旋转把左右子树高度差限制在 1 以内，从而保证 \`h = O(log n)\`。

四种失衡与旋转：

- LL：右旋
- RR：左旋
- LR：先左旋再右旋
- RL：先右旋再左旋

旋转的目标不是“把树变好看”，而是恢复高度不变量。`,
    prerequisites: ["bst"],
    successors: ["graph-repr"],
    resources: [],
  },
  "graph-repr": {
    id: "graph-repr",
    title: "图的表示",
    content_md: `## 图的表示

两种基础表示：

- **邻接矩阵**：查边 O(1)，空间 O(V²)，适合稠密图。
- **邻接表**：遍历邻居 O(deg)，空间 O(V+E)，适合稀疏图。

选择表示前先估计边数，不要默认邻接矩阵“更直观”。`,
    prerequisites: ["avl"],
    successors: ["shortest-path"],
    resources: [],
  },
  "shortest-path": {
    id: "shortest-path",
    title: "最短路径",
    content_md: `## 最短路径

- **BFS**：无权图的最短路径。
- **Dijkstra**：非负权图，配合优先队列是 O((V+E) log V)。
- **Bellman-Ford**：允许负权边，还能检测负环。

先说清楚图有没有负权，再决定算法。`,
    prerequisites: ["graph-repr"],
    successors: [],
    resources: [],
  },
  "sample-space": {
    id: "sample-space",
    title: "样本空间与事件",
    content_md: `## 样本空间与事件

样本空间 \`Ω\` 是所有可能结果的集合，事件是它的子集。

概率函数 \`P\` 满足：

1. \`P(Ω) = 1\`
2. \`P(A) ≥ 0\`
3. 互斥事件可加

先把样本空间写清楚，再谈概率。`,
    prerequisites: [],
    successors: ["conditional"],
    resources: [],
  },
  conditional: {
    id: "conditional",
    title: "条件概率",
    content_md: `## 条件概率

\`P(A|B) = P(A∩B) / P(B)\`，前提是 \`P(B) > 0\`。

它回答的是“已知 B 发生，A 的概率是多少”，不是“A 和 B 同时发生的概率”。

贝叶斯公式就是条件概率的两次应用。`,
    prerequisites: ["sample-space"],
    successors: ["discrete-rv"],
    resources: [
      {
        resource_id: "prob-slides",
        title: "条件概率 · 课堂讲义",
        type: "ppt",
        locator: "第 5–13 页",
      },
    ],
  },
  "discrete-rv": {
    id: "discrete-rv",
    title: "离散随机变量",
    content_md: `## 离散随机变量

离散随机变量取值可数，用概率质量函数 \`p(x) = P(X = x)\` 描述，且所有 \`p(x)\` 之和为 1。`,
    prerequisites: ["conditional"],
    successors: ["continuous-rv"],
    resources: [],
  },
  "continuous-rv": {
    id: "continuous-rv",
    title: "连续随机变量",
    content_md: `## 连续随机变量

连续随机变量用密度函数 \`f(x)\` 描述，单点概率为 0，区间概率是密度函数的积分。`,
    prerequisites: ["discrete-rv"],
    successors: ["expectation"],
    resources: [],
  },
  expectation: {
    id: "expectation",
    title: "期望与方差",
    content_md: `## 期望与方差

期望描述长期平均，方差描述波动。

- 离散：\`E[X] = Σ x·p(x)\`
- 连续：\`E[X] = ∫ x·f(x) dx\`
- \`Var(X) = E[X²] - (E[X])²\`

期望是线性的，方差不是：\`Var(aX+b) = a²Var(X)\`。`,
    prerequisites: ["continuous-rv"],
    successors: [],
    resources: [],
  },
};
