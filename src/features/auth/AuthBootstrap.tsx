"use client";

import { useEffect, useRef } from "react";

import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { hydrateFromStorage } from "@/features/auth/authSlice";
import { meApi } from "@/features/auth/authApi";
import type { User } from "@/shared/types/entities";

const STORAGE_KEY = "libraryapp.auth";

type StoredAuth = {
  token: string | null;
  user: User | null;
};

function safeParse(json: string): StoredAuth | null {
  try {
    const value = JSON.parse(json) as unknown;
    if (!value || typeof value !== "object") return null;

    const record = value as { token?: unknown; user?: unknown };
    const token = typeof record.token === "string" ? record.token : null;
    const user = (record.user ?? null) as User | null;

    return { token, user };
  } catch {
    return null;
  }
}

export function AuthBootstrap() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.token);
  const user = useAppSelector((s) => s.auth.user);
  const didFetchMe = useRef(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const parsed = safeParse(raw);
    if (!parsed) return;

    dispatch(hydrateFromStorage(parsed));
  }, [dispatch]);

  useEffect(() => {
    const toStore: StoredAuth = { token, user };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  }, [token, user]);

  useEffect(() => {
    if (!token) {
      didFetchMe.current = false;
      return;
    }
    if (didFetchMe.current) return;

    didFetchMe.current = true;
    meApi()
      .then((freshUser) => {
        dispatch(hydrateFromStorage({ token, user: freshUser }));
      })
      .catch(() => {
        // ignore - keep stored user (if any)
      });
  }, [dispatch, token]);

  return null;
}
