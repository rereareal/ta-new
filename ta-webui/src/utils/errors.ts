import { ApiError } from "@/types/errors.ts";

/**
 * 把任意异常收敛成一句可展示的中文。
 *
 * 只负责提示文案，不替调用方判断 status；需要区分错误类型时直接用 ApiError。
 * 第二个参数是"不是 Error 实例"时的兜底，不是覆盖 ApiError.message。
 */
export function errorMessage(error: unknown, fallback = "未知错误"): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

/**
 * 只展示服务端明确的业务文案（ApiError），其余异常一律用固定兜底。
 * 用于登录这类不能让内部错误直接暴露给用户的表单。
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}
