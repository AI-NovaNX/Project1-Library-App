export function getErrorMessage(err: unknown): string {
  const fromUnknown = (value: unknown): string | null => {
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    }

    if (Array.isArray(value)) {
      const parts = value
        .map((v) => fromUnknown(v))
        .filter((v): v is string => Boolean(v));
      if (parts.length > 0) return parts.join("\n");
    }

    if (value && typeof value === "object") {
      const record = value as Record<string, unknown>;

      // Common API patterns
      const direct =
        fromUnknown(record.message) ??
        fromUnknown(record.error) ??
        fromUnknown(record.detail);
      if (direct) return direct;

      // Sometimes: { errors: { field: [..] } }
      const errors = record.errors;
      if (errors && typeof errors === "object") {
        const errorsRecord = errors as Record<string, unknown>;
        const flattened: string[] = [];
        Object.values(errorsRecord).forEach((v) => {
          const msg = fromUnknown(v);
          if (msg) flattened.push(msg);
        });
        if (flattened.length > 0) return flattened.join("\n");
      }
    }

    return null;
  };

  // Prefer API-provided details when available (e.g. AxiosError.response.data),
  // otherwise fall back to the generic Error.message.
  if (typeof err === "object" && err) {
    const anyErr = err as { message?: unknown; response?: unknown };
    const response = anyErr.response as
      | { data?: unknown; status?: unknown }
      | undefined;

    const fromResponse = fromUnknown(response?.data);
    if (fromResponse) return fromResponse;

    const fromMessage = fromUnknown(anyErr.message);
    if (fromMessage) return fromMessage;
  }

  if (err instanceof Error) return err.message;

  return "Terjadi kesalahan";
}
