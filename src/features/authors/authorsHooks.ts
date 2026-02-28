import { useQuery } from "@tanstack/react-query";

import { getPopularAuthorsApi } from "@/features/authors/authorsApi";

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
