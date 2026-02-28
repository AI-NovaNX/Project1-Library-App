"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

import { addCartItemApi, getMyCartApi } from "@/features/cart/cartApi";

export function useMyCart({ enabled }: { enabled: boolean }) {
  return useQuery({
    queryKey: ["myCart"],
    queryFn: getMyCartApi,
    enabled,
    refetchOnWindowFocus: false,
  });
}

export function useAddToCart() {
  return useMutation({
    mutationFn: addCartItemApi,
  });
}
