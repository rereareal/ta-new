import type { ChatMessage, MessageReply, Session, TutorContext } from "@/types/index.ts";
import { demoCourses, demoUnitTitle } from "./courses.ts";
import { demoUnits } from "./units.ts";

const sessions = new Map<string, ChatMessage[]>();

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function courseTitleOf(courseId: string | null): string {
  if (!courseId) {
    return "这门课";
  }
  return demoCourses.find((course) => course.id === courseId)?.title ?? "这门课";
}

function unitTitleOf(unitId: string | null): string {
  if (!unitId) {
    return "当前单元";
  }
  return demoUnitTitle(unitId);
}

function welcomeMessage(context: TutorContext): ChatMessage {
  const courseTitle = courseTitleOf(context.courseId);
  const unitTitle = unitTitleOf(context.unitId);
  return {
    id: "welcome",
    role: "assistant",
    content: `我是你的私人家教。今天想继续《${courseTitle}》的「${unitTitle}」，还是从别的地方开始？\n\n你可以直接打字，也可以按麦克风说话；我会把回答读出来，同时保留文字。`,
    created_at: new Date().toISOString(),
  };
}

export function createDemoSession(courseId?: string | null): Session {
  const id = `demo-${courseId ?? "general"}-${crypto.randomUUID().slice(0, 8)}`;
  sessions.set(id, []);
  return { id };
}

export function listDemoMessages(sessionId: string, context: TutorContext): ChatMessage[] {
  let history = sessions.get(sessionId);
  if (!history || history.length === 0) {
    history = [welcomeMessage(context)];
    sessions.set(sessionId, history);
  }
  return history.map((item) => ({ ...item }));
}

export async function sendDemoMessage(
  sessionId: string,
  text: string,
  context: TutorContext,
): Promise<MessageReply> {
  await delay(650);
  const history = sessions.get(sessionId) ?? [];
  history.push({
    id: crypto.randomUUID(),
    role: "user",
    content: text,
    created_at: new Date().toISOString(),
  });
  const reply: ChatMessage = {
    id: crypto.randomUUID(),
    role: "assistant",
    content: tutorReply(text, context),
    created_at: new Date().toISOString(),
  };
  history.push(reply);
  sessions.set(sessionId, history);
  return { message: { ...reply }, teaching_action: "explain" };
}

export function resetDemoSessions(): void {
  sessions.clear();
}

export function tutorReply(text: string, context: TutorContext): string {
  const normalized = text.trim();
  const courseTitle = courseTitleOf(context.courseId);
  const unitTitle = unitTitleOf(context.unitId);
  const unit = context.unitId ? demoUnits[context.unitId] : undefined;

  if (/你好|hi|hello|在吗/i.test(normalized)) {
    return `我在。我们现在的上下文是《${courseTitle}》的「${unitTitle}」。

你可以直接问我概念、让我出一道题，或者把你不确定的地方发给我。`;
  }

  if (normalized.includes("删除")) {
    return `删除 BST 节点要按孩子的数量分三种情况：

1. **叶子节点**：直接摘掉。
2. **只有一个孩子**：让孩子顶替自己的位置。
3. **有两个孩子**：用**中序后继**（右子树最小节点）替换值，再删除后继。

关键是第三种：中序后继是右子树里最小的节点，替换后仍然满足“左小右大”。不是随便挑一个孩子补上。

你更想先看一遍图示，还是自己做一道删除题？`;
  }

  if (normalized.includes("复杂度") || normalized.includes("O(")) {
    return `BST 的查找、插入、删除都是 **O(h)**，其中 \`h\` 是树高。

- 平衡时 \`h = O(log n)\`
- 退化成链表时 \`h = O(n)\`

所以“BST 很快”这句话只在树比较平衡时成立。下一步自然就是平衡树。

要我出一道让树退化的插入序列题吗？`;
  }

  if (normalized.includes("练习") || normalized.includes("题")) {
    return `来做一道小题，还是围绕「${unitTitle}」：

> 依次插入 8, 3, 10, 1, 6, 14, 4，画出最终的 BST，并写出中序遍历。

先别急着写代码，画完树再对照。你可以把答案发给我，我只指出第一个出问题的地方。`;
  }

  if (normalized.includes("提示") || normalized.includes("不会") || normalized.includes("不懂")) {
    return `先给一个不替你做完的提示：

${unit ? `回到「${unitTitle}」的定义，先写出不变量，再代入一个最小例子。` : "先写出定义和最小例子，再考虑一般情况。"}

你现在卡在哪一步：**读不懂定义**、**不知道从哪下手**，还是**写出来但边界条件错**？`;
  }

  if (normalized.includes("二叉搜索树") || /bst/i.test(normalized)) {
    return `二叉搜索树的核心只有一句：

> 对任意节点，左子树所有键都小于它，右子树所有键都大于它。

由此可以直接推出：

- 中序遍历得到有序序列
- 查找沿一条路径向下，代价是 \`O(h)\`
- 删除有两个孩子的节点时，用中序后继替换

你想先看定义、看删除，还是直接做题？`;
  }

  return `我们先把问题落回《${courseTitle}》的「${unitTitle}」。

你现在的卡点更像是哪一种？

1. 定义记不住
2. 看懂了但不会写
3. 知道思路，边界条件总出错

选一个，我就按那个方向展开；也可以直接把你的答案发给我。`;
}
