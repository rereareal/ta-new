import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { resetDemoResources } from "@/demo/resources.ts";
import { useAgentStore } from "@/stores/agent.ts";
import { useChatStore } from "@/stores/chat.ts";
import { useCoursesStore } from "@/stores/courses.ts";
import { useProgressStore } from "@/stores/progress.ts";
import { useResourcesStore } from "@/stores/resources.ts";
import { useSessionStore } from "@/stores/session.ts";

function installLocalStorageStub(): void {
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => {
        store.clear();
      },
    },
  });
}

describe("stores", () => {
  beforeEach(() => {
    installLocalStorageStub();
    resetDemoResources();
    setActivePinia(createPinia());
  });

  it("does not duplicate uploaded resources in demo mode", async () => {
    const resources = useResourcesStore();
    await resources.loadAll();
    const initialCount = resources.items.length;

    const file = new File(["hello"], "slides.pptx", { type: "application/octet-stream" });
    const created = await resources.upload(file, "测试讲义");

    expect(resources.items).toHaveLength(initialCount + 1);
    expect(resources.items[0]?.id).toBe(created.id);
    expect(resources.items.filter((item) => item.id === created.id)).toHaveLength(1);
  });

  it("clears all domain stores on session logout", async () => {
    const session = useSessionStore();
    const chat = useChatStore();
    const courses = useCoursesStore();
    const progress = useProgressStore();
    const resources = useResourcesStore();
    const agent = useAgentStore();

    await courses.loadCourses();
    await chat.init("dsa", "bst");
    await progress.loadAll();
    await resources.loadAll();
    await agent.load();

    expect(courses.courses.length).toBeGreaterThan(0);
    expect(chat.messages.length).toBeGreaterThan(0);
    expect(progress.courses.length).toBeGreaterThan(0);
    expect(resources.items.length).toBeGreaterThan(0);
    expect(agent.tools.length).toBeGreaterThan(0);

    session.logout();

    expect(courses.courses).toEqual([]);
    expect(courses.currentCourse).toBeNull();
    expect(chat.messages).toEqual([]);
    expect(chat.sessionId).toBeNull();
    expect(progress.courses).toEqual([]);
    expect(resources.items).toEqual([]);
    expect(agent.tools).toEqual([]);
  });

  it("ignores stale loadCourse responses when switching courses quickly", async () => {
    const coursesApi = await import("@/api/course.ts");
    const courses = useCoursesStore();

    let resolveFirst!: (value: Awaited<ReturnType<typeof coursesApi.getCourse>>) => void;
    const firstCoursePromise = new Promise<Awaited<ReturnType<typeof coursesApi.getCourse>>>(
      (resolve) => {
        resolveFirst = resolve;
      },
    );

    const spy = vi.spyOn(coursesApi, "getCourse");
    spy.mockImplementationOnce(() => firstCoursePromise);

    const firstLoad = courses.loadCourse("dsa");
    const secondLoad = courses.loadCourse("prob");

    await secondLoad;
    expect(courses.currentCourse?.id).toBe("prob");

    resolveFirst({
      id: "dsa",
      title: "数据结构与算法",
      description: "",
      status: "published",
      tree: [],
    });
    await firstLoad;

    expect(courses.currentCourse?.id).toBe("prob");
    spy.mockRestore();
  });

  it("auto-authenticates as demo admin when demoMode is enabled", () => {
    const session = useSessionStore();
    expect(session.isAuthenticated).toBe(true);
    expect(session.isAdmin).toBe(true);

    session.logout();
    expect(session.isAuthenticated).toBe(false);

    session.enterDemo();
    expect(session.isAuthenticated).toBe(true);
    expect(session.isAdmin).toBe(true);
  });
});
