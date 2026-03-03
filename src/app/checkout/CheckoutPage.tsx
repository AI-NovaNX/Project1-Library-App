"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { meApiWithToken } from "@/features/auth/authApi";
import { setCartItemCount } from "@/features/cart/cartSlice";
import { getMyCartApi } from "@/features/cart/cartApi";
import { getBookByIdApi } from "@/features/books/booksApi";
import { getErrorMessage } from "@/shared/api/errors";
import { http } from "@/shared/api/http";
import { useAuthedImageUrl } from "@/shared/lib/useAuthedImageUrl";
import { PageHeader } from "@/components/Header";
import { removeCartItemApi } from "@/features/cart/cartApi";

const BACKEND_BASE = "https://library-backend-production-b9cf.up.railway.app";

type NormalizedCartItem = {
  key: string;
  itemId?: number;
  bookId?: number;
  title: string;
  authorName: string;
  categoryName: string;
  coverImage?: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asInteger(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Number.isInteger(value) ? value : Math.trunc(value);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (/^\d+$/.test(trimmed)) return Number(trimmed);
  }
  return undefined;
}

function extractCartItemIds(cartItems: unknown[]): number[] {
  const ids: number[] = [];
  for (const raw of cartItems) {
    if (!isRecord(raw)) continue;
    const id =
      asInteger(raw.id) ??
      asInteger(raw.cartItemId) ??
      asInteger((raw as Record<string, unknown>).itemId) ??
      asInteger((raw as Record<string, unknown>)._id);
    if (typeof id === "number" && Number.isFinite(id)) ids.push(id);
  }
  return ids;
}

type BorrowFromCartEnvelope = {
  success: boolean;
  message?: string;
  data?: {
    loans?: unknown[];
  };
};

function extractCartItemIndex(cartItems: unknown[]): {
  itemIds: Set<number>;
  bookIdToItemId: Map<number, number>;
  itemIdToBookId: Map<number, number>;
} {
  const itemIds = new Set<number>();
  const bookIdToItemId = new Map<number, number>();
  const itemIdToBookId = new Map<number, number>();

  for (const raw of cartItems) {
    if (!isRecord(raw)) continue;

    const itemId =
      asInteger(raw.id) ??
      asInteger(raw.cartItemId) ??
      asInteger((raw as Record<string, unknown>).itemId) ??
      asInteger((raw as Record<string, unknown>)._id);

    if (typeof itemId === "number" && Number.isFinite(itemId)) {
      itemIds.add(itemId);
    } else {
      continue;
    }

    const book = isRecord(raw.book) ? raw.book : undefined;
    const bookId =
      (typeof book?.id === "number" && Number.isFinite(book.id)
        ? book.id
        : undefined) ?? asInteger(raw.bookId);

    if (typeof bookId === "number" && Number.isFinite(bookId)) {
      if (!bookIdToItemId.has(bookId)) bookIdToItemId.set(bookId, itemId);
      if (!itemIdToBookId.has(itemId)) itemIdToBookId.set(itemId, bookId);
    }
  }

  return { itemIds, bookIdToItemId, itemIdToBookId };
}

function toAbsoluteAssetUrl(src?: string | null): string | null {
  if (!src) return null;
  const value = src.trim();
  if (!value) return null;
  // Sometimes backend may return data/blob URLs with a leading slash.
  if (value.startsWith("/data:")) return value.slice(1);
  if (value.startsWith("/blob:")) return value.slice(1);
  if (value.startsWith("data:")) return value;
  if (value.startsWith("blob:")) return value;
  if (value.startsWith("//")) return `https:${value}`;
  if (value.startsWith("http")) return value;
  const normalized = value.startsWith("/") ? value : `/${value}`;
  return `${BACKEND_BASE}${normalized}`;
}

function InfoRow(props: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-xl py-md text-text-xs font-medium tracking-[-0.02em]">
      <div className="text-neutral-500">{props.label}</div>
      <div className="text-neutral-950">{props.value}</div>
    </div>
  );
}

function toLocalISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseISODate(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function Footer() {
  return (
    <footer className="mt-7xl px-xl pb-6xl">
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-md">
          <Image
            src="/Login-Page/Logo.svg"
            alt="Booky logo"
            width={40}
            height={40}
            className="h-10 w-10"
          />
          <span className="text-display-xs font-bold tracking-[-0.02em] text-neutral-950">
            Booky
          </span>
        </div>

        <p className="mt-xl max-w-80 text-center text-text-xs font-medium tracking-[-0.02em] text-neutral-500">
          Discover inspiring stories & timeless knowledge, ready to borrow
          anytime. Explore online or visit our nearest library branch.
        </p>

        <div className="mt-4xl text-text-xs font-semibold tracking-[-0.02em] text-neutral-950">
          Follow on Social Media
        </div>

        <div className="mt-xl flex items-center justify-center gap-lg">
          <button type="button" aria-label="Facebook">
            <Image
              src="/Home/Facebook.svg"
              alt=""
              width={40}
              height={40}
              className="h-10 w-10"
            />
          </button>

          <button type="button" aria-label="Instagram">
            <Image
              src="/Home/Instagram.svg"
              alt=""
              width={40}
              height={40}
              className="h-10 w-10"
            />
          </button>

          <button type="button" aria-label="LinkedIn">
            <Image
              src="/Home/Linkedln.svg"
              alt=""
              width={40}
              height={40}
              className="h-10 w-10"
            />
          </button>

          <button type="button" aria-label="TikTok">
            <Image
              src="/Home/TIKTOK.svg"
              alt=""
              width={40}
              height={40}
              className="h-10 w-10"
            />
          </button>
        </div>
      </div>
    </footer>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const token = useAppSelector((s) => s.auth.token);
  const user = useAppSelector((s) => s.auth.user);
  const cartItemCount = useAppSelector((s) => s.cart.itemCount);

  const meQuery = useQuery({
    queryKey: ["me", token],
    queryFn: () => meApiWithToken(token),
    enabled: Boolean(token),
  });

  const meUser = meQuery.data ?? user ?? null;

  const getOutOfStockMessage = async (
    bookId: number,
  ): Promise<string | null> => {
    if (!Number.isFinite(bookId)) return null;
    try {
      const book = await getBookByIdApi(bookId);
      const raw = (book as { availableCopies?: unknown }).availableCopies;
      const available =
        typeof raw === "number" && Number.isFinite(raw)
          ? raw
          : typeof raw === "string" && /^-?\d+$/.test(raw.trim())
            ? Number(raw.trim())
            : null;
      if (available !== null && available <= 0) {
        return "Out of stock: this book is currently borrowed by another user.";
      }
    } catch {
      // ignore
    }
    return null;
  };

  useEffect(() => {
    if (!token) router.replace("/login");
  }, [router, token]);

  const profilePhoto = meUser?.profilePhoto ?? null;
  const profilePhotoUrl = toAbsoluteAssetUrl(profilePhoto);

  const profilePhotoSrc = useAuthedImageUrl({
    url: profilePhotoUrl,
    token,
    fallbackUrl: "/Home/Ellipse3.svg",
  });

  const avatarUnoptimized =
    profilePhotoSrc.startsWith("data:") || profilePhotoSrc.startsWith("blob:");

  const [items, setItems] = useState<NormalizedCartItem[]>([]);
  const [itemsLoaded, setItemsLoaded] = useState(false);

  const [borrowDate, setBorrowDate] = useState<string>(() =>
    toLocalISODate(new Date()),
  );
  const [durationDays, setDurationDays] = useState<3 | 5 | 10>(3);
  const [agreeDueDate, setAgreeDueDate] = useState(false);
  const [agreePolicy, setAgreePolicy] = useState(false);
  const [confirmPending, setConfirmPending] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.sessionStorage.getItem("checkout:selectedItems");
      if (!raw) {
        setItems([]);
        return;
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        setItems([]);
        return;
      }
      const next: NormalizedCartItem[] = parsed
        .filter((v) => isRecord(v))
        .map((v, index) => ({
          key:
            asString(v.key).trim().length > 0
              ? asString(v.key)
              : `selected:${index}`,
          itemId:
            typeof v.itemId === "number"
              ? v.itemId
              : typeof v.itemId === "string" && /^\d+$/.test(v.itemId.trim())
                ? Number(v.itemId.trim())
                : undefined,
          bookId:
            typeof v.bookId === "number"
              ? v.bookId
              : typeof v.bookId === "string" && /^\d+$/.test(v.bookId.trim())
                ? Number(v.bookId.trim())
                : undefined,
          title: asString(v.title) || "Book",
          authorName: asString(v.authorName) || "-",
          categoryName: asString(v.categoryName) || "-",
          coverImage:
            typeof v.coverImage === "string" || v.coverImage === null
              ? v.coverImage
              : null,
        }));
      setItems(next);
    } catch {
      setItems([]);
    } finally {
      setItemsLoaded(true);
    }
  }, []);

  useEffect(() => {
    // Keep badge consistent without fetching cart here.
    dispatch(setCartItemCount(cartItemCount));
  }, [dispatch, cartItemCount]);

  const selectedItemIds = useMemo(() => {
    return items
      .map((it) => it.itemId)
      .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  }, [items]);

  const selectedBookIds = useMemo(() => {
    return items
      .map((it) => it.bookId)
      .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  }, [items]);

  const isBorrowDateValid = useMemo(() => {
    try {
      parseISODate(borrowDate);
      return true;
    } catch {
      return false;
    }
  }, [borrowDate]);

  const canConfirm =
    !confirmPending &&
    itemsLoaded &&
    (selectedItemIds.length > 0 || selectedBookIds.length > 0) &&
    isBorrowDateValid &&
    agreeDueDate &&
    agreePolicy;

  const borrowDateLabel = useMemo(() => {
    try {
      return formatLongDate(parseISODate(borrowDate));
    } catch {
      return "";
    }
  }, [borrowDate]);

  const returnDateLabel = useMemo(() => {
    try {
      const base = parseISODate(borrowDate);
      return formatLongDate(addDays(base, durationDays));
    } catch {
      return "-";
    }
  }, [borrowDate, durationDays]);

  if (!token) {
    return (
      <div className="min-h-dvh bg-neutral-50 px-xl">
        <div className="mx-auto w-full max-w-96 pt-xl">
          <div className="h-10 w-40 rounded-xl bg-neutral-100" />
          <div className="mt-3xl h-64 rounded-3xl bg-neutral-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-neutral-50 px-xl">
      <div className="mx-auto w-full max-w-96">
        <div className="sticky top-0 z-40 bg-neutral-50 pt-xl">
          <PageHeader
            onLogoClick={() => router.push("/")}
            onSearchClick={() => router.push("/book-list?openSearch=1")}
            onBagClick={() => router.push("/cart")}
            cartItemCount={cartItemCount}
            profilePhotoSrc={profilePhotoSrc}
            profileAlt=""
            avatarUnoptimized={avatarUnoptimized}
            onProfileClick={() => router.push("/profile")}
          />
        </div>

        <main className="pt-2xl">
          <h1 className="text-display-sm font-bold tracking-[-0.02em] text-neutral-950">
            Checkout
          </h1>

          <div className="mt-3xl">
            <div className="text-text-sm font-bold tracking-[-0.02em] text-neutral-950">
              User Information
            </div>

            <div className="mt-xl">
              <InfoRow
                label="Name"
                value={meQuery.isLoading ? "Loading..." : (meUser?.name ?? "-")}
              />
              <InfoRow
                label="Email"
                value={
                  meQuery.isLoading ? "Loading..." : (meUser?.email ?? "-")
                }
              />
              <InfoRow
                label="Nomor Handphone"
                value={
                  meQuery.isLoading
                    ? "Loading..."
                    : meUser?.phone
                      ? String(meUser.phone)
                      : "-"
                }
              />
            </div>

            <div className="mt-xl h-px w-full bg-neutral-200" />

            <div className="mt-2xl text-text-sm font-bold tracking-[-0.02em] text-neutral-950">
              Book List
            </div>

            {!itemsLoaded ? (
              <div className="space-y-lg py-lg">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-lg">
                    <div className="h-20 w-14 rounded-xl bg-neutral-100" />
                    <div className="flex-1">
                      <div className="h-6 w-24 rounded bg-neutral-100" />
                      <div className="mt-sm h-5 w-44 rounded bg-neutral-100" />
                      <div className="mt-sm h-4 w-28 rounded bg-neutral-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="py-4xl text-center text-text-sm font-medium tracking-[-0.02em] text-neutral-500">
                No selected books.
              </div>
            ) : (
              <div className="mt-lg">
                {items.map((item, idx) => {
                  const coverSrc = toAbsoluteAssetUrl(item.coverImage);
                  const coverIsDataUrl = Boolean(coverSrc?.startsWith("data:"));

                  return (
                    <div key={item.key}>
                      <div className="flex items-start gap-lg py-lg">
                        <div className="relative h-20 w-14 overflow-hidden rounded-xl bg-neutral-100">
                          {coverSrc ? (
                            <Image
                              src={coverSrc}
                              alt=""
                              fill
                              sizes="56px"
                              className="object-cover"
                              unoptimized={coverIsDataUrl}
                            />
                          ) : null}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="inline-flex items-center rounded-full border border-neutral-300 bg-base-white px-md py-0.5 text-text-xs font-semibold tracking-[-0.02em] text-neutral-600">
                            {item.categoryName}
                          </div>
                          <div className="mt-sm truncate text-text-sm font-bold tracking-[-0.02em] text-neutral-950">
                            {item.title}
                          </div>
                          <div className="mt-xs truncate text-text-xs font-medium tracking-[-0.02em] text-neutral-500">
                            {item.authorName}
                          </div>
                        </div>
                      </div>

                      {idx < items.length - 1 ? (
                        <div className="h-px w-full bg-neutral-200" />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-3xl rounded-3xl bg-base-white px-2xl py-3xl">
              <div className="text-text-sm font-bold tracking-[-0.02em] text-neutral-950">
                Complete Your Borrow Request
              </div>

              <div className="mt-2xl">
                <div className="text-text-xs font-semibold tracking-[-0.02em] text-neutral-950">
                  Borrow Date
                </div>

                <div className="mt-sm">
                  <input
                    type="date"
                    value={borrowDate}
                    onChange={(e) => setBorrowDate(e.target.value)}
                    className="h-11 w-full rounded-xl border border-neutral-200 bg-base-white px-lg text-text-sm font-semibold tracking-[-0.02em] text-neutral-950"
                    aria-label="Borrow Date"
                  />
                </div>

                {/* Keep the visible label consistent with the design (month name). */}
                <div className="sr-only">{borrowDateLabel}</div>
              </div>

              <div className="mt-2xl">
                <div className="text-text-xs font-semibold tracking-[-0.02em] text-neutral-950">
                  Borrow Duration
                </div>

                <div className="mt-lg space-y-lg">
                  {[3, 5, 10].map((d) => (
                    <label
                      key={d}
                      className="flex items-center gap-md text-text-xs font-medium tracking-[-0.02em] text-neutral-950"
                    >
                      <input
                        type="radio"
                        name="borrowDuration"
                        value={d}
                        checked={durationDays === d}
                        onChange={() => setDurationDays(d as 3 | 5 | 10)}
                        className="h-5 w-5 accent-primary-600"
                      />
                      {d} Days
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-2xl rounded-2xl bg-neutral-100 px-xl py-lg">
                <div className="text-text-xs font-bold tracking-[-0.02em] text-neutral-950">
                  Return Date
                </div>
                <div className="mt-sm text-text-xs font-medium tracking-[-0.02em] text-neutral-500">
                  Please return the book no later than
                </div>
                <div className="mt-xs text-text-xs font-bold tracking-[-0.02em] text-accent-red">
                  {returnDateLabel}
                </div>
              </div>

              <div className="mt-xl space-y-md">
                <label className="flex items-start gap-md">
                  <input
                    type="checkbox"
                    checked={agreeDueDate}
                    onChange={(e) => setAgreeDueDate(e.target.checked)}
                    className="mt-0.5 h-5 w-5 rounded border border-neutral-300 accent-primary-600"
                  />
                  <span className="text-text-xs font-medium tracking-[-0.02em] text-neutral-950">
                    I agree to return the book(s) before the due date.
                  </span>
                </label>

                <label className="flex items-start gap-md">
                  <input
                    type="checkbox"
                    checked={agreePolicy}
                    onChange={(e) => setAgreePolicy(e.target.checked)}
                    className="mt-0.5 h-5 w-5 rounded border border-neutral-300 accent-primary-600"
                  />
                  <span className="text-text-xs font-medium tracking-[-0.02em] text-neutral-950">
                    I accept the library borrowing policy.
                  </span>
                </label>
              </div>

              <button
                type="button"
                disabled={!canConfirm}
                onClick={async () => {
                  if (!token) {
                    router.replace("/login");
                    return;
                  }

                  if (!agreeDueDate) {
                    toast.error(
                      "Silakan centang persetujuan pengembalian sebelum jatuh tempo.",
                    );
                    return;
                  }

                  if (!agreePolicy) {
                    toast.error("Silakan setujui library borrowing policy.");
                    return;
                  }

                  if (
                    selectedItemIds.length === 0 &&
                    selectedBookIds.length === 0
                  ) {
                    toast.error("Buku tidak ditemukan. Silakan kembali.");
                    return;
                  }

                  setConfirmPending(true);
                  try {
                    const requestOptions = {
                      headers: token
                        ? { Authorization: `Bearer ${token}` }
                        : undefined,
                    };

                    // Direct-borrow flow (from Book Detail): do not require cart itemIds.
                    if (
                      selectedItemIds.length === 0 &&
                      selectedBookIds.length > 0
                    ) {
                      const results = await Promise.allSettled(
                        selectedBookIds.map((bookId) =>
                          http.post(
                            "/api/loans",
                            { bookId, days: durationDays },
                            requestOptions,
                          ),
                        ),
                      );

                      const successCount = results.filter(
                        (r) => r.status === "fulfilled",
                      ).length;

                      if (successCount === 0) {
                        const firstFailure = results.find(
                          (r) => r.status === "rejected",
                        ) as PromiseRejectedResult | undefined;
                        const rawMsg = firstFailure
                          ? getErrorMessage(firstFailure.reason)
                          : "Borrow gagal.";
                        if (/already\s+borrowed/i.test(rawMsg)) {
                          const firstBookId = selectedBookIds[0];
                          const outOfStockMsg =
                            await getOutOfStockMessage(firstBookId);
                          toast.error(
                            outOfStockMsg ??
                              "This book can't be borrowed right now. This usually happens when the book is currently borrowed by someone else, or the system still thinks you haven't returned it yet.",
                          );
                        } else {
                          toast.error(rawMsg);
                        }
                        return;
                      }

                      if (typeof window !== "undefined") {
                        try {
                          const titles = items
                            .map((it) => it.title)
                            .filter(
                              (t): t is string =>
                                typeof t === "string" && t.trim().length > 0,
                            );
                          window.sessionStorage.setItem(
                            "borrowed-list:expectedBookIds",
                            JSON.stringify(selectedBookIds),
                          );
                          window.sessionStorage.setItem(
                            "borrowed-list:expectedTitles",
                            JSON.stringify(titles),
                          );
                          window.sessionStorage.setItem(
                            "borrowed-list:triggeredAt",
                            String(Date.now()),
                          );
                        } catch {
                          // ignore
                        }

                        window.sessionStorage.removeItem(
                          "checkout:selectedItems",
                        );
                      }

                      await queryClient.invalidateQueries({
                        queryKey: ["meLoans"],
                      });

                      router.push(
                        `/success?returnBy=${encodeURIComponent(returnDateLabel)}`,
                      );
                      return;
                    }

                    // Source of truth for borrow: cart item ids that exist in the backend cart right now.
                    // This avoids cases where sessionStorage contains missing/stale itemIds.
                    let effectiveItemIds = selectedItemIds;
                    let itemIdToBookId: Map<number, number> | null = null;
                    try {
                      const cart = await getMyCartApi();
                      const rawItems = Array.isArray(cart.items)
                        ? cart.items
                        : [];
                      const {
                        itemIds: cartItemIdSet,
                        bookIdToItemId,
                        itemIdToBookId: nextItemIdToBookId,
                      } = extractCartItemIndex(rawItems);
                      itemIdToBookId = nextItemIdToBookId;

                      const allExistInCart =
                        effectiveItemIds.length > 0 &&
                        effectiveItemIds.every((id) => cartItemIdSet.has(id));

                      if (!allExistInCart && selectedBookIds.length > 0) {
                        const mapped: number[] = [];
                        for (const bookId of selectedBookIds) {
                          const mappedItemId = bookIdToItemId.get(bookId);
                          if (
                            typeof mappedItemId === "number" &&
                            Number.isFinite(mappedItemId)
                          ) {
                            mapped.push(mappedItemId);
                          }
                        }
                        const uniqueMapped = Array.from(new Set(mapped));
                        if (uniqueMapped.length > 0)
                          effectiveItemIds = uniqueMapped;
                      }
                    } catch {
                      // ignore; fall back to selectedItemIds
                    }

                    effectiveItemIds = Array.from(
                      new Set(
                        effectiveItemIds
                          .map((v) =>
                            Number.isFinite(v) ? Math.trunc(v) : NaN,
                          )
                          .filter(
                            (v): v is number =>
                              typeof v === "number" && Number.isFinite(v),
                          ),
                      ),
                    );

                    if (effectiveItemIds.length === 0) {
                      toast.error(
                        "Cart item tidak ditemukan. Silakan kembali ke Cart lalu pilih ulang bukunya.",
                      );
                      return;
                    }

                    const body = {
                      itemIds: effectiveItemIds,
                      days: durationDays,
                      borrowDate,
                    };

                    const res = await http.post<BorrowFromCartEnvelope>(
                      "/api/loans/from-cart",
                      body,
                      requestOptions,
                    );
                    const borrowRes: BorrowFromCartEnvelope | null =
                      res.data ?? null;
                    const lastMessage = borrowRes?.message;

                    const loans = Array.isArray(borrowRes?.data?.loans)
                      ? borrowRes?.data?.loans
                      : [];
                    const noBooksMessage =
                      typeof borrowRes?.message === "string" &&
                      borrowRes.message
                        .toLowerCase()
                        .includes("no books borrowed");

                    let borrowedViaFallback = false;

                    // If backend explicitly says no books were borrowed and it didn't return any loans,
                    // try fallback: borrow directly via POST /api/loans using bookId.
                    if (loans.length === 0 && noBooksMessage) {
                      let fallbackBookIds = selectedBookIds;
                      if (fallbackBookIds.length === 0 && itemIdToBookId) {
                        const mapped: number[] = [];
                        for (const itemId of effectiveItemIds) {
                          const bookId = itemIdToBookId.get(itemId);
                          if (
                            typeof bookId === "number" &&
                            Number.isFinite(bookId)
                          ) {
                            mapped.push(bookId);
                          }
                        }
                        fallbackBookIds = Array.from(new Set(mapped));
                      }

                      if (fallbackBookIds.length === 0) {
                        toast.error(lastMessage ?? "No books borrowed.");
                        return;
                      }

                      const results = await Promise.allSettled(
                        fallbackBookIds.map((bookId) =>
                          http.post(
                            "/api/loans",
                            { bookId, days: durationDays },
                            requestOptions,
                          ),
                        ),
                      );

                      const successCount = results.filter(
                        (r) => r.status === "fulfilled",
                      ).length;

                      if (successCount === 0) {
                        const firstFailure = results.find(
                          (r) => r.status === "rejected",
                        ) as PromiseRejectedResult | undefined;
                        const rawMsg = firstFailure
                          ? getErrorMessage(firstFailure.reason)
                          : (lastMessage ?? "No books borrowed.");
                        if (/already\s+borrowed/i.test(rawMsg)) {
                          const firstBookId = fallbackBookIds[0];
                          const outOfStockMsg =
                            await getOutOfStockMessage(firstBookId);
                          toast.error(
                            outOfStockMsg ??
                              "One or more books can't be borrowed right now. This usually happens when a book is currently borrowed by someone else, or the system still thinks you haven't returned it yet.",
                          );
                        } else {
                          toast.error(rawMsg);
                        }
                        return;
                      }

                      // Keep cart in sync after successful fallback borrow.
                      await Promise.allSettled(
                        effectiveItemIds.map((itemId) =>
                          removeCartItemApi({ itemId }),
                        ),
                      );
                      borrowedViaFallback = true;
                    }

                    // If backend didn't return loan objects, do a quick sanity check:
                    // consider it successful only if the selected cart items are no longer in the cart.
                    let consumedByBackend = false;
                    if (borrowedViaFallback) {
                      consumedByBackend = true;
                    } else {
                      try {
                        const cart = await getMyCartApi();
                        const rawItems = Array.isArray(cart.items)
                          ? cart.items
                          : [];
                        const remainingIds = new Set(
                          extractCartItemIds(rawItems),
                        );
                        consumedByBackend = effectiveItemIds.every(
                          (id) => !remainingIds.has(id),
                        );
                      } catch {
                        // ignore
                      }
                    }

                    if (
                      !borrowedViaFallback &&
                      loans.length === 0 &&
                      !consumedByBackend
                    ) {
                      toast.error(
                        lastMessage ??
                          "Borrow berhasil dipanggil, tapi tidak ada loan yang dibuat. Periksa payload itemIds/cartItemIds.",
                      );
                      return;
                    }

                    // Some backends don't automatically consume/remove cart items
                    // when borrowing from cart. Make it explicit to keep cart in sync.
                    if (!consumedByBackend) {
                      await Promise.allSettled(
                        effectiveItemIds.map((itemId) =>
                          removeCartItemApi({ itemId }),
                        ),
                      );
                    }

                    if (typeof window !== "undefined") {
                      try {
                        const bookIds = items
                          .map((it) => it.bookId)
                          .filter(
                            (id): id is number =>
                              typeof id === "number" && Number.isFinite(id),
                          );
                        const titles = items
                          .map((it) => it.title)
                          .filter(
                            (t): t is string =>
                              typeof t === "string" && t.trim().length > 0,
                          );
                        window.sessionStorage.setItem(
                          "borrowed-list:expectedBookIds",
                          JSON.stringify(bookIds),
                        );
                        window.sessionStorage.setItem(
                          "borrowed-list:expectedTitles",
                          JSON.stringify(titles),
                        );
                        window.sessionStorage.setItem(
                          "borrowed-list:triggeredAt",
                          String(Date.now()),
                        );
                      } catch {
                        // ignore
                      }

                      window.sessionStorage.removeItem(
                        "checkout:selectedItems",
                      );
                    }

                    // Ensure Borrowed List reflects the new loan without requiring a hard refresh.
                    await queryClient.invalidateQueries({
                      queryKey: ["meLoans"],
                    });

                    // Re-sync cart badge after borrowing (backend usually consumes cart items).
                    await queryClient.invalidateQueries({
                      queryKey: ["myCart"],
                    });
                    try {
                      const cart = await getMyCartApi();
                      const nextCount =
                        typeof cart.itemCount === "number"
                          ? cart.itemCount
                          : Array.isArray(cart.items)
                            ? cart.items.length
                            : 0;
                      dispatch(setCartItemCount(nextCount));
                    } catch {
                      // ignore
                    }

                    router.push(
                      `/success?returnBy=${encodeURIComponent(returnDateLabel)}`,
                    );
                  } catch (err) {
                    toast.error(getErrorMessage(err));
                  } finally {
                    setConfirmPending(false);
                  }
                }}
                className="mt-2xl h-11 w-full rounded-full bg-primary-600 px-4xl text-text-sm font-bold tracking-[-0.02em] text-base-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {confirmPending ? "Processing..." : "Confirm & Borrow"}
              </button>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
