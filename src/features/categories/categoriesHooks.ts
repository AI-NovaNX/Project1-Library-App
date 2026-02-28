import { useQuery } from "@tanstack/react-query";

import { getCategoriesApi } from "@/features/categories/categoriesApi";

export function useCategories(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["categories"],
    queryFn: getCategoriesApi,
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled ?? true,
  });
}
