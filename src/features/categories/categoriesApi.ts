import type { ApiEnvelope } from "@/shared/types/api";
import type { Category } from "@/shared/types/entities";
import { http } from "@/shared/api/http";

export async function getCategoriesApi(): Promise<Category[]> {
  const res =
    await http.get<ApiEnvelope<{ categories: Category[] }>>("/api/categories");
  return res.data.data.categories;
}
