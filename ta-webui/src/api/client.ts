import { apiBaseUrl } from "@/config.ts";
import { ApiError, type FieldError } from "@/types/errors.ts";

const REQUEST_TIMEOUT_MS = 15_000;

let authToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  signal?: AbortSignal;
  timeoutMs?: number;
}

interface RawOptions {
  method?: HttpMethod;
  body?: BodyInit;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeoutMs?: number;
}

interface ValidationDetail {
  loc?: (string | number)[];
  msg?: string;
}

interface ErrorBody {
  code?: string;
  detail?: string | ValidationDetail[];
}

function authHeaders(): Record<string, string> {
  return authToken !== null && authToken.length > 0 ? { Authorization: `Bearer ${authToken}` } : {};
}

function createCombinedSignal(
  external: AbortSignal | undefined,
  timeoutMs: number,
): { signal: AbortSignal; cleanup: () => void } {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  if (!external) {
    return { signal: timeoutSignal, cleanup: () => {} };
  }

  if (typeof AbortSignal.any === "function") {
    return { signal: AbortSignal.any([external, timeoutSignal]), cleanup: () => {} };
  }

  const controller = new AbortController();
  const abortFromExternal = () => controller.abort(external.reason);
  const abortFromTimeout = () => controller.abort(timeoutSignal.reason);

  if (external.aborted) {
    controller.abort(external.reason);
  } else if (timeoutSignal.aborted) {
    controller.abort(timeoutSignal.reason);
  } else {
    external.addEventListener("abort", abortFromExternal, { once: true });
    timeoutSignal.addEventListener("abort", abortFromTimeout, { once: true });
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      external.removeEventListener("abort", abortFromExternal);
      timeoutSignal.removeEventListener("abort", abortFromTimeout);
    },
  };
}

async function fetchResponse(path: string, options: RawOptions): Promise<Response> {
  const hadAuth = authToken !== null && authToken.length > 0;
  const { signal, cleanup } = createCombinedSignal(
    options.signal,
    options.timeoutMs ?? REQUEST_TIMEOUT_MS,
  );

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      method: options.method ?? "GET",
      headers: {
        Accept: "application/json",
        ...authHeaders(),
        ...options.headers,
      },
      body: options.body,
      signal,
    });
  } catch (error) {
    if (options.signal?.aborted) {
      throw new ApiError(0, "请求已取消");
    }
    const timedOut = error instanceof DOMException && error.name === "TimeoutError";
    throw new ApiError(
      0,
      timedOut ? "请求超时，请稍后重试" : "无法连接到 API，确认后端已在 8000 端口启动",
    );
  } finally {
    cleanup();
  }

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => undefined);
    const { message, fields, code } = readError(body, response.status);
    if (response.status === 401 && hadAuth) {
      unauthorizedHandler?.();
    }
    throw new ApiError(response.status, message, fields, code);
  }

  return response;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetchResponse(path, {
    method: options.method ?? "GET",
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    headers: options.body === undefined ? {} : { "Content-Type": "application/json" },
    signal: options.signal,
    timeoutMs: options.timeoutMs,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function requestForm<T>(
  path: string,
  form: FormData,
  options: Pick<RequestOptions, "signal" | "timeoutMs"> = {},
): Promise<T> {
  const response = await fetchResponse(path, {
    method: "POST",
    body: form,
    signal: options.signal,
    timeoutMs: options.timeoutMs,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function requestBlob(path: string, options: RequestOptions = {}): Promise<Blob> {
  const response = await fetchResponse(path, {
    method: options.method ?? "GET",
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    headers: options.body === undefined ? {} : { "Content-Type": "application/json" },
    signal: options.signal,
    timeoutMs: options.timeoutMs,
  });

  return response.blob();
}

function readError(
  body: unknown,
  status: number,
): { message: string; fields: FieldError[]; code?: string } {
  const errorBody = body as ErrorBody | undefined;
  const detail = errorBody?.detail;
  const code = typeof errorBody?.code === "string" ? errorBody.code : undefined;

  if (typeof detail === "string" && detail.length > 0) {
    return { message: detail, fields: [], code };
  }

  if (Array.isArray(detail)) {
    const fields = detail.map((item) => ({
      path:
        (item.loc ?? [])
          .filter((part) => part !== "body")
          .map(String)
          .join(".") || "(root)",
      message: item.msg ?? "输入不合法",
    }));

    return { message: "请检查表单填写", fields, code };
  }

  return { message: `请求失败（HTTP ${status}）`, fields: [], code };
}
