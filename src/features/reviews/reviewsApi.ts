import type { ApiEnvelope, Pagination } from "@/shared/types/api";
import { http } from "@/shared/api/http";

export type ReviewUser = {
  id: number;
  name: string;
};

export type Review = {
  id: number;
  star: number;
  comment: string;
  userId: number;
  bookId: number;
  createdAt: string;
  user: ReviewUser;
};

export type GetBookReviewsResponse = {
  bookId: number;
  reviews: Review[];
  pagination: Pagination;
};

export async function getBookReviewsApi(params: {
  bookId: string | number;
  page: number;
  limit: number;
}): Promise<GetBookReviewsResponse> {
  const res = await http.get<ApiEnvelope<GetBookReviewsResponse>>(
    `/api/reviews/book/${params.bookId}`,
    {
      params: {
        page: params.page,
        limit: params.limit,
      },
    },
  );

  return res.data.data;
}
