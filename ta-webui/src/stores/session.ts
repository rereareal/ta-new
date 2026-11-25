import { computed, ref } from "vue";
import { defineStore } from "pinia";

import * as authApi from "@/api/auth.ts";
import { setAuthToken } from "@/api/client.ts";
import { demoMode } from "@/config.ts";
import type { Credentials, Role } from "@/types/index.ts";
import { resetDomainStores } from "./reset.ts";

const STORAGE_KEY = "ta.session";

interface Session {
  readonly token: string;
  readonly email: string;
  readonly role: Role;
}

const DEMO_SESSION: Session = {
  token: "demo-token",
  email: "demo@edututor.local",
  role: "admin",
};

function loadSession(): Session | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) {
    return demoMode ? DEMO_SESSION : null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<Session>;
    if (typeof parsed.token === "string" && typeof parsed.email === "string") {
      return {
        token: parsed.token,
        email: parsed.email,
        role: parsed.role === "admin" ? "admin" : "learner",
      };
    }
  } catch {
    // 损坏的本地状态直接丢弃。
  }

  localStorage.removeItem(STORAGE_KEY);
  return demoMode ? DEMO_SESSION : null;
}

export const useSessionStore = defineStore("session", () => {
  const session = ref<Session | null>(loadSession());

  setAuthToken(session.value?.token ?? null);

  const email = computed(() => session.value?.email ?? null);
  const role = computed<Role>(() => session.value?.role ?? "learner");
  const isAuthenticated = computed(() => session.value !== null);
  const isAdmin = computed(() => session.value?.role === "admin");
  const userName = computed(() => session.value?.email.split("@")[0] ?? "学习者");
  const initial = computed(() => (userName.value.slice(0, 1) || "?").toUpperCase());

  function persist(next: Session | null): void {
    session.value = next;
    setAuthToken(next?.token ?? null);

    if (next === null) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  }

  function adopt(token: string, loginEmail: string, nextRole: Role): void {
    persist({ token, email: loginEmail, role: nextRole });
  }

  async function login(credentials: Credentials): Promise<void> {
    const result = await authApi.login(credentials);
    adopt(result.access_token, credentials.email, result.role);
  }

  async function register(credentials: Credentials): Promise<void> {
    const result = await authApi.register(credentials);
    adopt(result.access_token, credentials.email, result.role);
  }

  function enterDemo(): void {
    if (!demoMode) {
      return;
    }
    adopt(DEMO_SESSION.token, DEMO_SESSION.email, DEMO_SESSION.role);
  }

  function logout(): void {
    persist(null);
    resetDomainStores();
  }

  return {
    session,
    email,
    role,
    isAuthenticated,
    isAdmin,
    userName,
    initial,
    login,
    register,
    enterDemo,
    logout,
  };
});
