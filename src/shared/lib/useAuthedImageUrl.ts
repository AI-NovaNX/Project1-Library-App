"use client";

import { useEffect, useMemo, useState } from "react";

function isLikelyBackendUrl(url: string, backendHost: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname === backendHost;
  } catch {
    return false;
  }
}

export function useAuthedImageUrl({
  url,
  token,
  fallbackUrl,
  backendHost = "library-backend-production-b9cf.up.railway.app",
}: {
  url: string | null | undefined;
  token: string | null | undefined;
  fallbackUrl: string;
  backendHost?: string;
}): string {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  const shouldFetch = useMemo(() => {
    if (!url) return false;
    if (!token) return false;
    if (url.startsWith("data:") || url.startsWith("blob:")) return false;
    return isLikelyBackendUrl(url, backendHost);
  }, [backendHost, token, url]);

  useEffect(() => {
    if (!shouldFetch || !url) {
      setBlobUrl(null);
      return;
    }

    let revoked = false;
    let nextObjectUrl: string | null = null;

    (async () => {
      try {
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error(`Failed to load image (${res.status})`);

        const contentType = res.headers.get("content-type") || "";
        if (!contentType.startsWith("image/")) {
          throw new Error(`Unexpected content-type: ${contentType}`);
        }

        const blob = await res.blob();
        nextObjectUrl = URL.createObjectURL(blob);
        if (!revoked) setBlobUrl(nextObjectUrl);
      } catch {
        if (!revoked) setBlobUrl(null);
      }
    })();

    return () => {
      revoked = true;
      if (nextObjectUrl) URL.revokeObjectURL(nextObjectUrl);
    };
  }, [shouldFetch, token, url]);

  if (shouldFetch) return blobUrl ?? fallbackUrl;
  return url ?? fallbackUrl;
}
