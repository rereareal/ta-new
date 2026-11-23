/**
 * 界面状态的语义色。徽标和状态点都从这里取 class，
 * 避免同一组 emerald / amber / red / slate 在各页面各写一遍。
 */
export type Tone = "success" | "warning" | "danger" | "neutral";

const surfaces: Record<Tone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-red-200 bg-red-50 text-red-700",
  neutral: "border-slate-200 bg-slate-50 text-slate-500",
};

const dots: Record<Tone, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  neutral: "bg-slate-300",
};

/**
 * 徽标的颜色部分。形状（`rounded-full border px-2 py-0.5 text-[10px]`）
 * 留给调用方的 class，因为各处的尺寸和圆角并不相同。
 */
export function surfaceClass(tone: Tone): string {
  return surfaces[tone];
}

/** 状态圆点，尺寸由调用方给（`h-1.5 w-1.5` / `h-2 w-2`）。 */
export function dotClass(tone: Tone): string {
  return dots[tone];
}
