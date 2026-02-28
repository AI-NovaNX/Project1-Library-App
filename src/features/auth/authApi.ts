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

  const extracted = extractUserFromUnknown(inner);
  if (extracted) return extracted;

  throw new Error("Invalid /api/me response");
}

export async function meApiWithToken(token: string | null): Promise<User> {
  const res = await http.get<unknown>("/api/me", {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  const data = res.data;
  const inner: unknown = isApiEnvelope<unknown>(data)
    ? (data as ApiEnvelope<unknown>).data
    : data;

  const extracted = extractUserFromUnknown(inner);
  if (extracted) return extracted;

  throw new Error("Invalid /api/me response");
}

function extractUserFromUnknown(value: unknown): User | null {
  if (!value || typeof value !== "object") return null;

  // Common patterns: { user: {...} }, { data: {...} }, { me: {...} }
  if ("user" in value) {
    const inner = (value as { user?: unknown }).user;
    const fromUser = extractUserFromUnknown(inner);
    if (fromUser) return fromUser;
    if (inner && typeof inner === "object") return inner as User;
  }

  if ("data" in value) {
    const inner = (value as { data?: unknown }).data;
    const fromData = extractUserFromUnknown(inner);
    if (fromData) return fromData;
    if (inner && typeof inner === "object") return inner as User;
  }

  if ("me" in value) {
    const inner = (value as { me?: unknown }).me;
    const fromMe = extractUserFromUnknown(inner);
    if (fromMe) return fromMe;
    if (inner && typeof inner === "object") return inner as User;
  }

  // Direct user object
  const record = value as Partial<User>;
  if (record.id != null && typeof record.email === "string") {
    return value as User;
  }

  return null;
}
