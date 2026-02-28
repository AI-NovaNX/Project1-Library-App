import { useMutation } from "@tanstack/react-query";

import { useAppDispatch } from "@/app/store/hooks";
import { setAuth, setUser } from "@/features/auth/authSlice";
import {
  loginApi,
  meApi,
  registerApi,
  type LoginRequest,
  type RegisterRequest,
} from "@/features/auth/authApi";
import { getErrorMessage } from "@/shared/api/errors";

export function useLogin() {
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: async (payload: LoginRequest) => {
      try {
        return await loginApi(payload);
      } catch (err) {
        throw new Error(getErrorMessage(err));
      }
    },
    onSuccess: (data) => {
      dispatch(setAuth({ token: data.token, user: data.user }));
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: async (payload: RegisterRequest) => {
      try {
        await registerApi(payload);
      } catch (err) {
        throw new Error(getErrorMessage(err));
      }
    },
  });
}

export function useMe() {
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: async () => {
      try {
        return await meApi();
      } catch (err) {
        throw new Error(getErrorMessage(err));
      }
    },
    onSuccess: (user) => {
      dispatch(setUser(user));
    },
  });
}
