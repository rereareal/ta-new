import { describe, expect, it } from "vite-plus/test";

import { ApiError } from "@/types/errors.ts";
import { apiErrorMessage, errorMessage } from "@/utils/errors.ts";
import {
  courseStatusBadge,
  genreBadge,
  resourceStatusBadge,
  sideEffectBadge,
  unitStatusBadge,
  unitStatusTone,
} from "@/utils/labels.ts";
import { isPathActive } from "@/utils/nav.ts";
import { isLoading } from "@/utils/status.ts";
import { dotClass, surfaceClass } from "@/utils/tone.ts";

describe("utils/errors", () => {
  it("extracts messages from ApiError, Error, and unknown values", () => {
    expect(errorMessage(new ApiError(400, "参数错误"))).toBe("参数错误");
    expect(errorMessage(new Error("网络异常"))).toBe("网络异常");
    expect(errorMessage("oops", "兜底文案")).toBe("兜底文案");
  });

  it("exposes only ApiError messages via apiErrorMessage", () => {
    expect(apiErrorMessage(new ApiError(401, "密码错误"), "登录失败")).toBe("密码错误");
    expect(apiErrorMessage(new Error("TypeError: internal"), "登录失败")).toBe("登录失败");
    expect(apiErrorMessage(null, "登录失败")).toBe("登录失败");
  });
});

describe("utils/nav", () => {
  it("handles root, exact, and segment-prefix matching without false positives", () => {
    expect(isPathActive("/", "/")).toBe(true);
    expect(isPathActive("/", "/knowledge")).toBe(false);

    expect(isPathActive("/admin", "/admin", true)).toBe(true);
    expect(isPathActive("/admin", "/admin/resources", true)).toBe(false);

    expect(isPathActive("/admin/resources", "/admin/resources")).toBe(true);
    expect(isPathActive("/knowledge", "/knowledge/dsa")).toBe(true);
    expect(isPathActive("/admin", "/admin-other")).toBe(false);
  });
});

describe("utils/labels & tone & status", () => {
  it("maps domain statuses to expected labels and tones", () => {
    expect(courseStatusBadge("published").label).toBe("已发布");
    expect(courseStatusBadge("verified").label).toBe("已核对");
    expect(courseStatusBadge("draft").label).toBe("草稿");

    expect(resourceStatusBadge("ready").label).toBe("解析完成");
    expect(resourceStatusBadge("failed").className).toBe(surfaceClass("danger"));

    expect(sideEffectBadge("paid").label).toBe("付费");
    expect(genreBadge("例题").className).toBe(surfaceClass("warning"));

    expect(unitStatusBadge("completed", "mastery").label).toBe("已掌握");
    expect(unitStatusBadge("completed", "progress").label).toBe("已完成");
    expect(unitStatusTone("completed")).toBe("success");
    expect(unitStatusTone("in_progress")).toBe("warning");
    expect(unitStatusTone(undefined)).toBe("neutral");
    expect(dotClass("success")).toContain("bg-emerald-500");
  });

  it("checks loading status", () => {
    expect(isLoading("idle")).toBe(true);
    expect(isLoading("loading")).toBe(true);
    expect(isLoading("ready")).toBe(false);
    expect(isLoading("error")).toBe(false);
  });
});
