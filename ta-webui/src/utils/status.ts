/** 异步数据的加载状态。`idle` 也算"还没内容"，视图按加载态呈现。 */
export type LoadStatus = "idle" | "loading" | "ready" | "error";

export function isLoading(status: LoadStatus): boolean {
  return status === "idle" || status === "loading";
}
