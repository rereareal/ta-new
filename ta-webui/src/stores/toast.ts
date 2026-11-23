import { ref } from "vue";
import { defineStore } from "pinia";

export const useToastStore = defineStore("toast", () => {
  const message = ref<string | null>(null);
  let timer: ReturnType<typeof setTimeout> | null = null;

  function show(text: string): void {
    message.value = text;

    if (timer !== null) {
      clearTimeout(timer);
    }

    timer = setTimeout(() => {
      message.value = null;
      timer = null;
    }, 4_000);
  }

  function clear(): void {
    message.value = null;
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  }

  return { message, show, clear };
});
