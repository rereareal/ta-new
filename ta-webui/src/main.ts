import { createPinia } from "pinia";
import { createApp } from "vue";

import { setUnauthorizedHandler } from "@/api/client.ts";
import { useSessionStore } from "@/stores/session.ts";
import { useToastStore } from "@/stores/toast.ts";
import "./assets/styles.css";
import App from "./App.vue";
import { router } from "./router/index.ts";

const pinia = createPinia();

setUnauthorizedHandler(() => {
  const session = useSessionStore(pinia);
  if (!session.isAuthenticated) {
    return;
  }

  session.logout();
  useToastStore(pinia).show("登录已过期，请重新登录");

  if (router.currentRoute.value.path !== "/login") {
    void router.replace({
      path: "/login",
      query: { next: router.currentRoute.value.fullPath },
    });
  }
});

createApp(App).use(pinia).use(router).mount("#app");
