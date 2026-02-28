import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { clearAuth } from "@/features/auth/authSlice";

type CartState = {
  itemCount: number;
};

const initialState: CartState = {
  itemCount: 0,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setCartItemCount(state, action: PayloadAction<number>) {
      state.itemCount = Math.max(0, Number(action.payload) || 0);
    },
    incrementCartItemCount(state, action: PayloadAction<number | undefined>) {
      const delta = Math.max(1, Number(action.payload ?? 1) || 1);
      state.itemCount += delta;
    },
    resetCart(state) {
      state.itemCount = 0;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(clearAuth, () => initialState);
  },
});

export const { setCartItemCount, incrementCartItemCount, resetCart } =
  cartSlice.actions;

export default cartSlice.reducer;
