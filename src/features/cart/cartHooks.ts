"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

import {
  addCartItemApi,
  clearMyCartApi,
  getMyCartApi,
  removeCartItemApi,
} from "@/features/cart/cartApi";

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

export function useRemoveCartItem() {
  return useMutation({
    mutationFn: removeCartItemApi,
  });
}

export function useClearMyCart() {
  return useMutation({
    mutationFn: clearMyCartApi,
  });
}
