"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { meApiWithToken } from "@/features/auth/authApi";
import { setCartItemCount } from "@/features/cart/cartSlice";
import { getErrorMessage } from "@/shared/api/errors";
import { http } from "@/shared/api/http";
import { useAuthedImageUrl } from "@/shared/lib/useAuthedImageUrl";

const BACKEND_BASE = "https://library-backend-production-b9cf.up.railway.app";

type NormalizedCartItem = {
  key: string;
  itemId?: number;
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

  const token = useAppSelector((s) => s.auth.token);
  const user = useAppSelector((s) => s.auth.user);
  const cartItemCount = useAppSelector((s) => s.cart.itemCount);

  const meQuery = useQuery({
    queryKey: ["me", token],
    queryFn: () => meApiWithToken(token),
    enabled: Boolean(token),
  });

  const meUser = meQuery.data ?? user ?? null;

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
    selectedItemIds.length > 0 &&
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
          <header className="flex items-center justify-between">
            <button
              type="button"
              aria-label="Home"
              onClick={() => router.push("/")}
            >
              <Image
                src="/Login-Page/Logo.svg"
                alt="Booky logo"
                width={40}
                height={40}
                className="h-10 w-10"
                priority
              />
            </button>

            <div className="flex items-center gap-3xl">
              <button
                type="button"
                aria-label="Search"
                onClick={() => router.push("/")}
              >
                <Image
                  src="/Home/Search.svg"
                  alt=""
                  width={24}
                  height={24}
                  className="h-6 w-6"
                />
              </button>

              <button
                type="button"
                aria-label="Bag"
                className="relative"
                onClick={() => router.push("/cart")}
              >
                <Image
                  src="/Home/Bag.svg"
                  alt=""
                  width={28}
                  height={28}
                  className="h-7 w-7"
                />
                {cartItemCount > 0 ? (
                  <div className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-red px-1 text-[10px] font-bold text-base-white">
                    {cartItemCount}
                  </div>
                ) : null}
              </button>

              <button
                type="button"
                aria-label="Profile"
                onClick={() => router.push("/profile")}
              >
                <div className="relative h-10 w-10 overflow-hidden rounded-full bg-neutral-200">
                  <Image
                    src={profilePhotoSrc}
                    alt=""
                    fill
                    sizes="40px"
                    unoptimized={avatarUnoptimized}
                  />
                </div>
              </button>
            </div>
          </header>
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

                  if (selectedItemIds.length === 0) {
                    toast.error(
                      "Cart item tidak ditemukan. Silakan kembali ke Cart.",
                    );
                    return;
                  }

                  setConfirmPending(true);
                  try {
                    await http.post(
                      "/api/loans/from-cart",
                      {
                        itemIds: selectedItemIds,
                        days: durationDays,
                        borrowDate,
                      },
                      {
                        headers: token
                          ? { Authorization: `Bearer ${token}` }
                          : undefined,
                      },
                    );

                    if (typeof window !== "undefined") {
                      window.sessionStorage.removeItem(
                        "checkout:selectedItems",
                      );
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
