import { request } from "./client.ts";
import type { Credentials, TokenResponse } from "@/types/index.ts";

export type { Credentials };

export function login(credentials: Credentials): Promise<TokenResponse> {
  return request<TokenResponse>("/auth/login", { method: "POST", body: credentials });
}

export function register(credentials: Credentials): Promise<TokenResponse> {
  return request<TokenResponse>("/auth/register", { method: "POST", body: credentials });
}
