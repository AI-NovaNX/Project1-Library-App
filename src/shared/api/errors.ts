export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;

  if (typeof err === "object" && err) {
    const anyErr = err as { message?: unknown; response?: unknown };
    if (typeof anyErr.message === "string") return anyErr.message;

    const response = anyErr.response as
      | { data?: { message?: unknown } }
      | undefined;
    const msg = response?.data?.message;
    if (typeof msg === "string") return msg;
  }

  return "Terjadi kesalahan";
}
