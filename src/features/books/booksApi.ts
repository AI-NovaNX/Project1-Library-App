import type { ApiEnvelope, Pagination } from "@/shared/types/api";
import type { Book } from "@/shared/types/entities";
import { http } from "@/shared/api/http";

export type GetBooksParams = {
  page: number;
  limit: number;
  search?: string;
  categoryId?: string;
};

export type GetRecommendedBooksParams = {
  page: number;
  limit: number;
  by?: "rating" | "popular";
  categoryId?: number;
};

export type GetBooksResponse = {
  books: Book[];
  pagination: Pagination;
};

export type GetRecommendedBooksResponse = {
  mode: string;
  books: Book[];
  pagination: Pagination;
};

export type GetBookByIdResponse = Book & {
  // Backend may include full reviews on this endpoint.
  reviews?: unknown[];
  // Some seeds/backends may include page count fields.
  pages?: number;
  pageCount?: number;
  totalPages?: number;
};

export async function getBooksApi(
  params: GetBooksParams,
): Promise<GetBooksResponse> {
  const res = await http.get<ApiEnvelope<GetBooksResponse>>("/api/books", {
    params: {
      page: params.page,
      limit: params.limit,
      search: params.search || undefined,
      categoryId: params.categoryId || undefined,
    },
  });

  return res.data.data;
}

export async function getRecommendedBooksApi(
  params: GetRecommendedBooksParams,
): Promise<GetRecommendedBooksResponse> {
  const res = await http.get<ApiEnvelope<GetRecommendedBooksResponse>>(
    "/api/books/recommend",
    {
      params: {
        page: params.page,
        limit: params.limit,
        by: params.by,
        categoryId: params.categoryId,
      },
    },
  );

  return res.data.data;
}

export async function getBookByIdApi(
  id: string | number,
): Promise<GetBookByIdResponse> {
  const res = await http.get<ApiEnvelope<GetBookByIdResponse>>(
    `/api/books/${id}`,
  );
  return res.data.data;
}
