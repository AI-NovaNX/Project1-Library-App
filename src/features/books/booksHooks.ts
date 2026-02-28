import { useInfiniteQuery } from "@tanstack/react-query";

import { getBooksApi, getRecommendedBooksApi } from "@/features/books/booksApi";

export function useBooksInfinite(params: {
  search?: string;
  categoryId?: string;
  limit?: number;
  enabled?: boolean;
}) {
  const limit = params.limit ?? 10;

  return useInfiniteQuery({
    queryKey: [
      "books",
      {
        search: params.search ?? "",
        categoryId: params.categoryId ?? "",
        limit,
      },
    ],
    initialPageParam: 1,
    enabled: params.enabled ?? true,
    queryFn: async ({ pageParam }) => {
      return getBooksApi({
        page: Number(pageParam),
        limit,
        search: params.search,
        categoryId: params.categoryId,
      });
    },
    getNextPageParam: (lastPage) => {
      const next = lastPage.pagination.page + 1;
      return next <= lastPage.pagination.totalPages ? next : undefined;
    },
  });
}

export function useRecommendedBooksInfinite(params: {
  by?: "rating" | "popular";
  categoryId?: number;
  limit?: number;
  enabled?: boolean;
}) {
  const limit = params.limit ?? 10;

  return useInfiniteQuery({
    queryKey: [
      "books-recommend",
      {
        by: params.by ?? "rating",
        categoryId: params.categoryId ?? null,
        limit,
      },
    ],
    initialPageParam: 1,
    enabled: params.enabled ?? true,
    queryFn: async ({ pageParam }) => {
      return getRecommendedBooksApi({
        page: Number(pageParam),
        limit,
        by: params.by,
        categoryId: params.categoryId,
      });
    },
    getNextPageParam: (lastPage) => {
      const next = lastPage.pagination.page + 1;
      return next <= lastPage.pagination.totalPages ? next : undefined;
    },
  });
}
