const DEFAULT_BASE_URL = "/api";
const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

export const apiBaseUrl = (configuredBaseUrl || DEFAULT_BASE_URL).replace(/\/+$/, "");

/**
 * 演示模式：开发环境默认开启，生产环境必须显式设置 VITE_DEMO_MODE=true。
 * 演示数据全部隔离在 src/demo/，通过 api 层动态按需加载，接入真实接口后可整目录删除。
 */
export const demoMode = import.meta.env.DEV
  ? import.meta.env.VITE_DEMO_MODE !== "false"
  : import.meta.env.VITE_DEMO_MODE === "true";
