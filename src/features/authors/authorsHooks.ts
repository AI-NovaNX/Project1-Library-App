import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import {
  getAuthorBooksApi,
  getPopularAuthorsApi,
} from "@/features/authors/authorsApi";

export function usePopularAuthors(params?: {
  limit?: number;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ["authors-popular", { limit: params?.limit ?? 10 }],
    enabled: params?.enabled ?? true,
    queryFn: async () => {
      return getPopularAuthorsApi({ limit: params?.limit });
    },
  });
}

export function useAuthorBooksInfinite(params: {
  id?: string | number;
  limit?: number;
  enabled?: boolean;
}) {
  const limit = params.limit ?? 8;

  return useInfiniteQuery({
    queryKey: ["author-books", { id: params.id ?? null, limit }],
    initialPageParam: 1,
    enabled: (params.enabled ?? true) && params.id !== undefined,
    queryFn: async ({ pageParam }) => {
      if (params.id === undefined) throw new Error("Missing author id");
      return getAuthorBooksApi({
        id: params.id,
        page: Number(pageParam),
        limit,
      });
    },
    getNextPageParam: (lastPage) => {
      const next = lastPage.pagination.page + 1;
      return next <= lastPage.pagination.totalPages ? next : undefined;
    },
  });
}
