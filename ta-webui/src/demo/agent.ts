import type { PromptInfo, ToolInfo } from "@/types/index.ts";

export const demoTools: ToolInfo[] = [
  {
    name: "course.get_unit",
    description: "读取当前课程单元的内容、先修和引用资源。",
    side_effect: "read",
    timeout_ms: 5_000,
  },
  {
    name: "learner.get_progress",
    description: "读取学习者在这门课的进度和最近活动。",
    side_effect: "read",
    timeout_ms: 5_000,
  },
  {
    name: "resources.get_fragments",
    description: "按材料与体裁取回解析片段，供讲解或出题引用。",
    side_effect: "read",
    timeout_ms: 8_000,
  },
  {
    name: "speech.transcribe",
    description: "把用户录音转写成文本。",
    side_effect: "paid",
    timeout_ms: 30_000,
  },
  {
    name: "speech.synthesize",
    description: "把导师回复合成为语音。",
    side_effect: "paid",
    timeout_ms: 30_000,
  },
];

export const demoPrompts: PromptInfo[] = [
  { version: "tutor.system.v3", description: "私人家教系统提示词（当前版本）" },
  { version: "tutor.hint.v2", description: "分级提示：先问思路，再给局部线索" },
  { version: "tutor.grade.v1", description: "评分执行：结构化 rubric 输出" },
];
