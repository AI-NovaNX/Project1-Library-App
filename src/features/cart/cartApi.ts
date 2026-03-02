import type { ApiEnvelope } from "@/shared/types/api";
import { http } from "@/shared/api/http";

export type MyCart = {
  cartId?: number;
  items?: unknown[];
  itemCount?: number;
};

export async function getMyCartApi(): Promise<MyCart> {
  const res = await http.get<ApiEnvelope<MyCart>>("/api/cart");
  return res.data.data;
}

export async function addCartItemApi(input: { bookId: number }): Promise<void> {
  await http.post("/api/cart/items", { bookId: input.bookId });
}

export async function removeCartItemApi(input: {
  itemId: number;
}): Promise<void> {
  await http.delete(`/api/cart/items/${input.itemId}`);
}

export async function clearMyCartApi(): Promise<void> {
  await http.delete("/api/cart");
}
