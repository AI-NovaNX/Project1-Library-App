import type { ApiEnvelope } from "@/shared/types/api";
import type { User } from "@/shared/types/entities";
import { http } from "@/shared/api/http";

export type LoginRequest = { email: string; password: string };
export type RegisterRequest = { name: string; email: string; password: string };

export type LoginResponse = {
  token: string;
  user: User;
};

function isApiEnvelope<T>(value: unknown): value is ApiEnvelope<T> {
  if (typeof value !== "object" || value === null) return false;
  if (!("data" in value)) return false;
  if (!("success" in value)) return false;
  return typeof (value as { success: unknown }).success === "boolean";
}

export async function loginApi(payload: LoginRequest): Promise<LoginResponse> {
  const res = await http.post<ApiEnvelope<LoginResponse> | LoginResponse>(
    "/api/auth/login",
    payload,
    { headers: { "content-type": "application/json" } },
  );

  // Backend sometimes may return directly; support both envelope and direct.
  const data = res.data;
  return isApiEnvelope<LoginResponse>(data) ? data.data : data;
}

export async function registerApi(payload: RegisterRequest): Promise<void> {
  await http.post("/api/auth/register", payload, {
    headers: { "content-type": "application/json" },
  });
}

export async function meApi(): Promise<User> {
  const res = await http.get<unknown>("/api/me");
  const data = res.data;

  const inner: unknown = isApiEnvelope<unknown>(data)
    ? (data as ApiEnvelope<unknown>).data
    : data;

  if (inner && typeof inner === "object") {
    if ("user" in inner) {
      return (inner as { user: User }).user;
    }
  }

  return inner as User;
}
