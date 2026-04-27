import { apiFetch, ApiError } from "./client";
import type { User } from "./types";

export interface LoginResult {
  access_token: string;
  token_type: string;
}

export async function login(
  username: string,
  password: string,
): Promise<LoginResult> {
  const body = new URLSearchParams({ username, password, grant_type: "password" });
  const res = await fetch("/api/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new ApiError(res.status, err, `Login failed: ${res.status}`);
  }
  return res.json() as Promise<LoginResult>;
}

export async function getMe(): Promise<User> {
  return apiFetch<User>("/api/users/self");
}
