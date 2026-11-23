<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import AppLogo from "@/components/layout/AppLogo.vue";
import AppIcon, { type IconName } from "@/components/ui/AppIcon.vue";
import { useSessionStore } from "@/stores/session.ts";
import { useSystemStore } from "@/stores/system.ts";
import { apiErrorMessage } from "@/utils/errors.ts";

const route = useRoute();
const router = useRouter();
const session = useSessionStore();
const system = useSystemStore();

const mode = ref<"login" | "register">("login");
const submitting = ref(false);
const errorMessage = ref<string | null>(null);
const apiOnline = ref(false);
const form = reactive({ email: "", password: "" });

const isRegister = computed(() => mode.value === "register");
const next = computed(() => {
  const raw = route.query.next;
  const value = typeof raw === "string" ? raw : "/";
  return value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/login")
    ? value
    : "/";
});

const features: { icon: IconName; title: string; text: string }[] = [
  { icon: "chat_bubble", title: "对话优先", text: "文字始终保留" },
  { icon: "mic", title: "语音交流", text: "STT / TTS" },
  { icon: "account_tree", title: "知识结构", text: "课程与资源" },
];

function showError(message: string): void {
  errorMessage.value = message;
}

async function submit(): Promise<void> {
  const email = form.email.trim();
  const password = form.password;

  if (!email || !password) {
    showError("请填写邮箱和密码");
    return;
  }

  if (isRegister.value && password.length < 8) {
    showError("注册密码至少 8 位");
    return;
  }

  submitting.value = true;
  errorMessage.value = null;

  try {
    if (isRegister.value) {
      await session.register({ email, password });
    } else {
      await session.login({ email, password });
    }
    await router.replace(next.value);
  } catch (error) {
    showError(apiErrorMessage(error, "登录失败，请稍后重试"));
  } finally {
    submitting.value = false;
  }
}

onMounted(async () => {
  if (session.isAuthenticated) {
    await router.replace(next.value);
    return;
  }

  await system.refresh();
  apiOnline.value = system.health !== null;
});
</script>

<template>
  <div class="min-h-screen bg-[#fafbfd] text-slate-800 antialiased">
    <main class="flex min-h-screen items-center justify-center px-5 py-10">
      <div class="grid w-full max-w-[980px] items-stretch gap-8 lg:grid-cols-[1.1fr_1fr]">
        <section
          class="relative hidden flex-col justify-between overflow-hidden rounded-3xl bg-slate-900 p-10 text-white lg:flex"
        >
          <div class="relative z-10">
            <div class="flex items-center gap-3">
              <AppLogo size="lg" />
              <div>
                <p class="text-sm font-semibold tracking-tight">EduTutor</p>
                <p class="text-xs text-slate-400">私人家教 · AI</p>
              </div>
            </div>
            <h1 class="mt-14 text-3xl font-semibold leading-tight tracking-tight">
              把“没听懂”<br />变成“我来讲一遍”。
            </h1>
            <p class="mt-5 max-w-sm text-sm leading-7 text-slate-300">
              一个以对话为核心的教学智能体。它会调用课程结构、学习进度和资源切片，陪你一步一步把问题弄懂。
            </p>
          </div>

          <div class="relative z-10 grid grid-cols-3 gap-3 text-xs text-slate-300">
            <div
              v-for="feature in features"
              :key="feature.title"
              class="rounded-xl border border-white/10 bg-white/5 p-3"
            >
              <AppIcon :name="feature.icon" class="text-base text-slate-200" />
              <p class="mt-2 font-medium text-white">{{ feature.title }}</p>
              <p class="mt-1 text-slate-400">{{ feature.text }}</p>
            </div>
          </div>

          <div class="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
          <div
            class="absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl"
          />
        </section>

        <section
          class="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-9"
        >
          <div class="flex items-center gap-3">
            <AppLogo size="md" class="lg:hidden" />
            <div>
              <h2 class="text-lg font-semibold tracking-tight text-slate-900">
                {{ isRegister ? "创建账号" : "登录" }}
              </h2>
              <p class="mt-0.5 text-xs text-slate-500">使用邮箱和密码继续</p>
            </div>
          </div>

          <div class="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 text-xs font-medium">
            <button
              type="button"
              class="rounded-lg px-3 py-2 transition"
              :class="
                !isRegister
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              "
              @click="
                mode = 'login';
                errorMessage = null;
              "
            >
              登录
            </button>
            <button
              type="button"
              class="rounded-lg px-3 py-2 transition"
              :class="
                isRegister
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              "
              @click="
                mode = 'register';
                errorMessage = null;
              "
            >
              注册
            </button>
          </div>

          <form class="mt-6 space-y-4" @submit.prevent="submit">
            <label class="block">
              <span class="mb-1.5 block text-xs font-medium text-slate-600">邮箱</span>
              <input
                v-model="form.email"
                type="email"
                autocomplete="email"
                required
                placeholder="you@example.com"
                class="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
              />
            </label>

            <label class="block">
              <span class="mb-1.5 block text-xs font-medium text-slate-600">密码</span>
              <input
                v-model="form.password"
                type="password"
                :autocomplete="isRegister ? 'new-password' : 'current-password'"
                required
                :placeholder="isRegister ? '至少 8 位' : '请输入密码'"
                class="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
              />
            </label>

            <div
              v-if="errorMessage"
              class="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs leading-5 text-red-700"
            >
              {{ errorMessage }}
            </div>

            <button
              type="submit"
              :disabled="submitting"
              class="flex h-10 w-full items-center justify-center rounded-xl bg-slate-900 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-progress disabled:opacity-70"
            >
              {{
                submitting
                  ? isRegister
                    ? "注册中…"
                    : "登录中…"
                  : isRegister
                    ? "注册并登录"
                    : "登录"
              }}
            </button>
          </form>

          <div class="mt-6 flex items-center justify-between text-[11px] text-slate-400">
            <span class="flex items-center gap-1.5">
              <span
                class="h-1.5 w-1.5 rounded-full"
                :class="apiOnline ? 'bg-emerald-500' : 'bg-slate-300'"
              />
              <span>{{ apiOnline ? "FastAPI 在线" : "FastAPI 未连接" }}</span>
            </span>
            <span>JWT · role</span>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>
