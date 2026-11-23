import { demoMode } from "@/config.ts";
import type {
  ChatMessage,
  MessageReply,
  PromptInfo,
  Session,
  ToolInfo,
  TutorContext,
} from "@/types/index.ts";
import { request } from "./client.ts";

export async function createSession(courseId?: string | null): Promise<Session> {
  if (demoMode) {
    const { createDemoSession } = await import("@/demo/tutor.ts");
    return createDemoSession(courseId);
  }

  return request<Session>("/agent/sessions", {
    method: "POST",
    body: { course_id: courseId ?? null },
  });
}

export async function listMessages(
  sessionId: string,
  context: TutorContext = { courseId: null, unitId: null },
): Promise<ChatMessage[]> {
  if (demoMode) {
    const { listDemoMessages } = await import("@/demo/tutor.ts");
    return listDemoMessages(sessionId, context);
  }

  return request<ChatMessage[]>(`/agent/sessions/${sessionId}/messages`);
}

export async function sendMessage(
  sessionId: string,
  text: string,
  context: TutorContext,
): Promise<MessageReply> {
  if (demoMode) {
    const { sendDemoMessage } = await import("@/demo/tutor.ts");
    return sendDemoMessage(sessionId, text, context);
  }

  return request<MessageReply>(`/agent/sessions/${sessionId}/messages`, {
    method: "POST",
    body: { text },
  });
}

export async function listTools(): Promise<ToolInfo[]> {
  if (demoMode) {
    const { demoTools } = await import("@/demo/agent.ts");
    return demoTools.map((tool) => ({ ...tool }));
  }

  return request<ToolInfo[]>("/agent/tools");
}

export async function listPrompts(): Promise<PromptInfo[]> {
  if (demoMode) {
    const { demoPrompts } = await import("@/demo/agent.ts");
    return demoPrompts.map((prompt) => ({ ...prompt }));
  }

  return request<PromptInfo[]>("/agent/prompts");
}
