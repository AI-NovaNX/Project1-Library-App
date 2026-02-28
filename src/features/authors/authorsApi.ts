import type { ApiEnvelope } from "@/shared/types/api";
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
