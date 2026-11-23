import type {
  CourseStatus,
  Genre,
  ResourceStatus,
  ToolSideEffect,
  UnitStatus,
} from "@/types/index.ts";
import { surfaceClass, type Tone } from "./tone.ts";

/** 一个状态在界面上的完整呈现：文案 + 颜色；形状交给调用方的 class。 */
export interface StatusBadge {
  readonly label: string;
  readonly className: string;
}

function badge(label: string, tone: Tone): StatusBadge {
  return { label, className: surfaceClass(tone) };
}

/** 课程状态机见 docs/DOMAIN_MODEL.md：draft → verified → published。 */
export function courseStatusBadge(status: CourseStatus): StatusBadge {
  if (status === "published") {
    return badge("已发布", "success");
  }
  if (status === "verified") {
    return badge("已核对", "warning");
  }
  return badge("草稿", "neutral");
}

export function resourceStatusBadge(status: ResourceStatus): StatusBadge {
  if (status === "ready") {
    return badge("解析完成", "success");
  }
  if (status === "parsing") {
    return badge("解析中", "warning");
  }
  if (status === "failed") {
    return badge("解析失败", "danger");
  }
  return badge("已导入", "neutral");
}

export function sideEffectBadge(sideEffect: ToolSideEffect): StatusBadge {
  if (sideEffect === "read") {
    return badge("读取", "success");
  }
  if (sideEffect === "external") {
    return badge("外部请求", "warning");
  }
  return badge("付费", "danger");
}

/** 体裁本身就是文案，这里只补颜色。 */
export function genreBadge(genre: Genre): StatusBadge {
  if (genre === "讲解") {
    return badge(genre, "success");
  }
  if (genre === "例题" || genre === "习题") {
    return badge(genre, "warning");
  }
  return badge(genre, "neutral");
}

export function unitStatusTone(status: UnitStatus | undefined): Tone {
  if (status === "completed") {
    return "success";
  }
  if (status === "in_progress") {
    return "warning";
  }
  return "neutral";
}

/**
 * 单元状态徽标。
 *
 * `variant` 保留了两处现存文案差异：知识库页写「已掌握」，学情页写「已完成」。
 * 统一文案之前不要合并这两个分支。
 */
export function unitStatusBadge(
  status: UnitStatus | undefined,
  variant: "mastery" | "progress",
): StatusBadge {
  if (status === "completed") {
    return badge(variant === "mastery" ? "已掌握" : "已完成", "success");
  }
  if (status === "in_progress") {
    return badge("进行中", "warning");
  }
  return badge("未开始", "neutral");
}
