import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";

import { useSessionStore } from "@/stores/session.ts";
import { useToastStore } from "@/stores/toast.ts";

const AuthView = () => import("../views/AuthView.vue");
const ChatView = () => import("../views/ChatView.vue");
const KnowledgeListView = () => import("../views/KnowledgeListView.vue");
const KnowledgeDetailView = () => import("../views/KnowledgeDetailView.vue");
const ProgressView = () => import("../views/ProgressView.vue");
const AdminView = () => import("../views/AdminView.vue");
const ResourceAdminView = () => import("../views/ResourceAdminView.vue");
const AgentAdminView = () => import("../views/AgentAdminView.vue");
const SystemView = () => import("../views/SystemView.vue");
const NotFoundView = () => import("../views/NotFoundView.vue");

declare module "vue-router" {
  interface RouteMeta {
    title?: string;
    fullBleed?: boolean;
    requiresAdmin?: boolean;
    bare?: boolean;
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "chat",
    component: ChatView,
    meta: { title: "智能家教", fullBleed: true },
  },
  {
    path: "/knowledge",
    name: "knowledge",
    component: KnowledgeListView,
    meta: { title: "知识库" },
  },
  {
    path: "/knowledge/:courseId",
    name: "knowledge-detail",
    component: KnowledgeDetailView,
    meta: { title: "知识库" },
  },
  { path: "/courses", redirect: "/knowledge" },
  { path: "/courses/:courseId", redirect: (to) => `/knowledge/${String(to.params.courseId)}` },
  {
    path: "/progress",
    name: "progress",
    component: ProgressView,
    meta: { title: "学情诊断" },
  },
  {
    path: "/admin",
    name: "admin",
    component: AdminView,
    meta: { title: "管理控制", requiresAdmin: true },
  },
  {
    path: "/admin/resources",
    name: "admin-resources",
    component: ResourceAdminView,
    meta: { title: "资源库", requiresAdmin: true },
  },
  {
    path: "/admin/agent",
    name: "admin-agent",
    component: AgentAdminView,
    meta: { title: "智能体", requiresAdmin: true },
  },
  {
    path: "/login",
    name: "login",
    component: AuthView,
    meta: { title: "登录", bare: true },
  },
  { path: "/system", name: "system", component: SystemView, meta: { title: "系统状态" } },
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: NotFoundView,
    meta: { title: "页面不存在" },
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

router.beforeEach((to) => {
  const session = useSessionStore();

  // 除登录页外，所有页面都必须先注册 / 登录。
  if (to.meta.bare !== true && !session.isAuthenticated) {
    return { path: "/login", query: { next: to.fullPath } };
  }

  if (to.meta.requiresAdmin && !session.isAdmin) {
    useToastStore().show("需要管理员权限");
    return { path: "/" };
  }

  return true;
});

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · EduTutor` : "EduTutor";
});
