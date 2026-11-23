import { useAgentStore } from "./agent.ts";
import { useChatStore } from "./chat.ts";
import { useCoursesStore } from "./courses.ts";
import { useProgressStore } from "./progress.ts";
import { useResourcesStore } from "./resources.ts";

export function resetDomainStores(): void {
  useChatStore().clear();
  useCoursesStore().clear();
  useProgressStore().clear();
  useResourcesStore().clear();
  useAgentStore().clear();
}
