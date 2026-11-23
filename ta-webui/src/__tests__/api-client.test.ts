import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { request, setAuthToken, setUnauthorizedHandler } from "@/api/client.ts";
import { ApiError } from "@/types/errors.ts";

describe("api/client", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    setAuthToken(null);
    setUnauthorizedHandler(null);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("injects Bearer token and supports 204 No Content", async () => {
    setAuthToken("jwt-123");
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 }));
    globalThis.fetch = fetchMock;

    const result = await request<void>("/items/1", { method: "DELETE" });

    expect(result).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0]!;
    expect(init?.method).toBe("DELETE");
    const headers = init?.headers as Record<string, string> | undefined;
    expect(headers?.Authorization).toBe("Bearer jwt-123");
  });

  it("parses backend { code, detail } and FastAPI 422 validation errors", async () => {
    globalThis.fetch = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ code: "INVALID_CREDENTIALS", detail: "用户名或密码错误" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(request("/auth/login", { method: "POST", body: {} })).rejects.toMatchObject({
      name: "ApiError",
      status: 400,
      code: "INVALID_CREDENTIALS",
      message: "用户名或密码错误",
    });

    globalThis.fetch = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          detail: [{ loc: ["body", "email"], msg: "invalid email" }],
        }),
        { status: 422, headers: { "Content-Type": "application/json" } },
      ),
    );

    await expect(request("/auth/register", { method: "POST", body: {} })).rejects.toMatchObject({
      status: 422,
      message: "请检查表单填写",
      fields: [{ path: "email", message: "invalid email" }],
    });
  });

  it("triggers unauthorized handler only when an authenticated request gets 401", async () => {
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);

    globalThis.fetch = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ detail: "未登录" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(request("/auth/login")).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).not.toHaveBeenCalled();

    setAuthToken("expired-token");
    await expect(request("/auth/me")).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it("maps timeout and network failures to ApiError(0)", async () => {
    globalThis.fetch = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new DOMException("Timed out", "TimeoutError"));

    await expect(request("/health")).rejects.toMatchObject({
      status: 0,
      message: "请求超时，请稍后重试",
    });

    globalThis.fetch = vi.fn<typeof fetch>().mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(request("/health")).rejects.toMatchObject({
      status: 0,
    });
  });
});
