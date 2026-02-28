import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import type { User } from "@/shared/types/entities";

type AuthState = {
  token: string | null;
  user: User | null;
};

const initialState: AuthState = {
  token: null,
  user: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth(
      state,
      action: PayloadAction<{ token: string; user: User | null }>,
    ) {
      state.token = action.payload.token;
      state.user = action.payload.user;
    },
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload;
    },
    clearAuth(state) {
      state.token = null;
      state.user = null;
    },
    hydrateFromStorage(state, action: PayloadAction<AuthState>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
    },
  },
});

export const { setAuth, setUser, clearAuth, hydrateFromStorage } =
  authSlice.actions;

export default authSlice.reducer;
