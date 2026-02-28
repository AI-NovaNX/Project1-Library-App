import { useInfiniteQuery } from "@tanstack/react-query";

import { getBookReviewsApi } from "@/features/reviews/reviewsApi";

export function useBookReviewsInfinite(params: {
  bookId?: string | number;
  limit?: number;
  enabled?: boolean;
}) {
  const limit = params.limit ?? 3;

  return useInfiniteQuery({
    queryKey: [
      "book-reviews",
      {
        bookId: params.bookId ?? null,
        limit,
      },
    ],
    initialPageParam: 1,
    enabled: (params.enabled ?? true) && params.bookId !== undefined,
    queryFn: async ({ pageParam }) => {
      if (params.bookId === undefined) throw new Error("Missing book id");
      return getBookReviewsApi({
        bookId: params.bookId,
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
