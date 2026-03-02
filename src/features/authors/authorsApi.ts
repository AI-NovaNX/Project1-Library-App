import type { ApiEnvelope, Pagination } from "@/shared/types/api";
import type { Book } from "@/shared/types/entities";
import { http } from "@/shared/api/http";

export type PopularAuthor = {
  id: number;
  name: string;
  bio?: string;
  bookCount: number;
  accumulatedScore?: number;
  // Backend may add these later; UI will use them if present.
  photo?: string | null;
  avatar?: string | null;
  image?: string | null;
  profilePhoto?: string | null;
};

export type GetPopularAuthorsResponse = {
  authors: PopularAuthor[];
};

export type AuthorBooksAuthor = {
  id: string | number;
  name: string;
  bookCount?: number;
  photo?: string | null;
  avatar?: string | null;
  image?: string | null;
  profilePhoto?: string | null;
};

export type GetAuthorBooksResponse = {
  author: AuthorBooksAuthor;
  books: Book[];
  pagination: Pagination;
};

export async function getPopularAuthorsApi(params?: {
  limit?: number;
}): Promise<GetPopularAuthorsResponse> {
  const res = await http.get<ApiEnvelope<GetPopularAuthorsResponse>>(
    "/api/authors/popular",
    {
      params: {
        limit: params?.limit,
      },
    },
  );

  return res.data.data;
}

export async function getAuthorBooksApi(params: {
  id: string | number;
  page: number;
  limit: number;
}): Promise<GetAuthorBooksResponse> {
  const res = await http.get<ApiEnvelope<GetAuthorBooksResponse>>(
    `/api/authors/${params.id}/books`,
    {
      params: {
        page: params.page,
        limit: params.limit,
      },
    },
  );

  return res.data.data;
}
