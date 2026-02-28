import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import {
  getBookByIdApi,
  getBooksApi,
  getRecommendedBooksApi,
} from "@/features/books/booksApi";

export function useBookById(params: {
  id?: string | number;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ["book", { id: params.id ?? null }],
    enabled: (params.enabled ?? true) && params.id !== undefined,
    queryFn: async () => {
      if (params.id === undefined) throw new Error("Missing book id");
      return getBookByIdApi(params.id);
    },
  });
}

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
