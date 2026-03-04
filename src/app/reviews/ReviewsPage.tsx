"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";

import { useAppSelector } from "@/app/store/hooks";
import { DesktopHeader, PageHeader } from "@/components/Header";
import { meApiWithToken } from "@/features/auth/authApi";
import { getBookByIdApi } from "@/features/books/booksApi";
import { useCategories } from "@/features/categories/categoriesHooks";
import { useAuthedImageUrl } from "@/shared/lib/useAuthedImageUrl";
import { http } from "@/shared/api/http";

const BACKEND_BASE = "https://library-backend-production-b9cf.up.railway.app";

function toAbsoluteAssetUrl(src?: string | null): string | null {
  if (!src) return null;
  const value = src.trim();
  if (!value) return null;
  if (value.startsWith("/data:")) return value.slice(1);
  if (value.startsWith("/blob:")) return value.slice(1);
  if (value.startsWith("data:")) return value;
  if (value.startsWith("blob:")) return value;
  if (value.startsWith("//")) return `https:${value}`;
  if (value.startsWith("http")) return value;
  const normalized = value.startsWith("/") ? value : `/${value}`;
  return `${BACKEND_BASE}${normalized}`;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function asNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const trimmed = v.trim();
    if (!trimmed) return null;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function clampStars(star: number): number {
  if (Number.isNaN(star)) return 0;
  return Math.max(0, Math.min(5, Math.round(star)));
}

type NormalizedMyReview = {
  key: string;
  id: number | null;
  star: number;
  comment: string;
  bookId: number | null;
  createdAt: string | null;
};

function extractReviewsArray(payload: unknown): unknown[] {
  if (!isRecord(payload)) return [];
  const level1 = isRecord(payload.data) ? payload.data : payload;

  const candidates: unknown[] = [];
  if (Array.isArray(level1)) candidates.push(level1);
  if (isRecord(level1)) {
    if (Array.isArray(level1.reviews)) candidates.push(level1.reviews);
    if (Array.isArray(level1.items)) candidates.push(level1.items);
    if (Array.isArray(level1.results)) candidates.push(level1.results);
    if (isRecord(level1.data)) {
      const level2 = level1.data;
      if (Array.isArray(level2)) candidates.push(level2);
      if (isRecord(level2)) {
        if (Array.isArray(level2.reviews)) candidates.push(level2.reviews);
        if (Array.isArray(level2.items)) candidates.push(level2.items);
        if (Array.isArray(level2.results)) candidates.push(level2.results);
      }
    }
  }

  return candidates.find(Array.isArray) ?? [];
}

function normalizeMyReview(
  raw: unknown,
  index: number,
): NormalizedMyReview | null {
  if (!isRecord(raw)) return null;

  const id = asNumber(raw.id);
  const bookId =
    asNumber(raw.bookId) ??
    asNumber(
      (raw as { book?: unknown }).book &&
        isRecord((raw as { book?: unknown }).book)
        ? ((raw as { book?: Record<string, unknown> }).book?.id ?? null)
        : null,
    );
  const star = clampStars(asNumber(raw.star) ?? 0);
  const comment =
    asString(raw.comment) ||
    asString(raw.content) ||
    asString(raw.review) ||
    "";
  const createdAt = asString(raw.createdAt) || asString(raw.created_at) || null;

  const key = id != null ? `review:${id}` : `review:${index}`;

  return {
    key,
    id,
    star,
    comment,
    bookId,
    createdAt,
  };
}

function formatReviewDateTime(value: string | null): string {
  if (!value) return "-";
  const d = dayjs(value);
  if (!d.isValid()) return "-";
  return d.format("D MMMM YYYY, HH:mm");
}

function StarsRow({ star }: { star: number }) {
  const clamped = clampStars(star);
  return (
    <div className="flex items-center gap-2xs">
      {Array.from({ length: 5 }).map((_, i) => (
        <Image
          key={i}
          src={
            i < clamped ? "/User-Review/Star.svg" : "/User-Review/Star-mute.svg"
          }
          alt=""
          width={16}
          height={16}
          className="h-4 w-4"
        />
      ))}
    </div>
  );
}

function Footer() {
  return (
    <footer className="px-xl pb-6xl">
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

function DesktopFooter() {
  return (
    <footer className="py-6xl text-center">
      <div className="flex items-center justify-center gap-lg">
        <Image
          src="/Login-Page/Logo.svg"
          alt="Booky logo"
          width={33}
          height={33}
          className="h-8.25 w-8.25"
        />
        <div className="font-sans text-[25.14px] font-bold leading-8.25 tracking-normal text-neutral-950">
          Booky
        </div>
      </div>

      <p className="mx-auto mt-lg w-full max-w-160 text-text-sm font-medium leading-6 text-neutral-600">
        Discover inspiring stories & timeless knowledge, ready to borrow
        anytime. Explore online or visit our nearest library branch.
      </p>

      <div className="mt-5xl text-text-sm font-semibold text-neutral-950">
        Follow on Social Media
      </div>

      <div className="mt-xl flex items-center justify-center gap-md">
        <button
          type="button"
          aria-label="Facebook"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-base-white"
        >
          <Image src="/Home/Facebook.svg" alt="" width={16} height={16} />
        </button>
        <button
          type="button"
          aria-label="Instagram"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-base-white"
        >
          <Image src="/Home/Instagram.svg" alt="" width={16} height={16} />
        </button>
        <button
          type="button"
          aria-label="LinkedIn"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-base-white"
        >
          <Image src="/Home/Linkedln.svg" alt="" width={16} height={16} />
        </button>
        <button
          type="button"
          aria-label="TikTok"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-base-white"
        >
          <Image src="/Home/TIKTOK.svg" alt="" width={16} height={16} />
        </button>
      </div>
    </footer>
  );
}

export default function ReviewsPage() {
  const router = useRouter();

  const [desktopSearchValue, setDesktopSearchValue] = useState("");
  const [search, setSearch] = useState("");

  const token = useAppSelector((s) => s.auth.token);
  const user = useAppSelector((s) => s.auth.user);
  const cartItemCount = useAppSelector((s) => s.cart.itemCount);

  const meQuery = useQuery({
    queryKey: ["me", token],
    queryFn: () => meApiWithToken(token),
    enabled: Boolean(token),
  });

  const meUser = meQuery.data ?? user ?? null;

  const myReviewsQuery = useQuery({
    queryKey: ["meReviews", token],
    enabled: Boolean(token),
    queryFn: async () => {
      const res = await http.get("/api/me/reviews", {
        params: { page: 1, limit: 50 },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      const rows = extractReviewsArray(res);
      return rows
        .map((v, idx) => normalizeMyReview(v, idx))
        .filter((v): v is NormalizedMyReview => v !== null);
    },
  });

  useEffect(() => {
    if (!token) router.replace("/login");
  }, [router, token]);

  const profilePhotoUrl = toAbsoluteAssetUrl(meUser?.profilePhoto ?? null);

  const profilePhotoSrc = useAuthedImageUrl({
    url: profilePhotoUrl,
    token,
    fallbackUrl: "/Home/Ellipse3.svg",
  });

  const avatarUnoptimized =
    profilePhotoSrc.startsWith("data:") || profilePhotoSrc.startsWith("blob:");

  const categoriesQuery = useCategories({ enabled: Boolean(token) });

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categoriesQuery.data ?? []) {
      map.set(String(c.id), c.name);
    }
    return map;
  }, [categoriesQuery.data]);

  const normalizedReviews = useMemo(
    () => myReviewsQuery.data ?? [],
    [myReviewsQuery.data],
  );

  const bookIds = useMemo(() => {
    const set = new Set<number>();
    for (const r of normalizedReviews) {
      if (typeof r.bookId === "number" && Number.isFinite(r.bookId))
        set.add(r.bookId);
    }
    return Array.from(set);
  }, [normalizedReviews]);

  const bookQueries = useQueries({
    queries: bookIds.map((bookId) => ({
      queryKey: ["book", { id: bookId }],
      enabled: Boolean(token),
      staleTime: 5 * 60 * 1000,
      queryFn: async () => getBookByIdApi(bookId),
    })),
  });

  const bookById = useMemo(() => {
    const map = new Map<number, unknown>();
    bookIds.forEach((bookId, index) => {
      const book = bookQueries[index]?.data;
      if (book) map.set(bookId, book);
    });
    return map;
  }, [bookIds, bookQueries]);

  const visibleReviews = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return normalizedReviews;

    return normalizedReviews.filter((r) => {
      if (r.comment.toLowerCase().includes(q)) return true;
      if (typeof r.bookId !== "number") return false;
      const book = bookById.get(r.bookId);
      if (!book || !isRecord(book)) return false;
      const title = asString(book.title).toLowerCase();
      const authorName = isRecord(book.author)
        ? asString((book.author as Record<string, unknown>).name).toLowerCase()
        : "";
      return title.includes(q) || authorName.includes(q);
    });
  }, [bookById, normalizedReviews, search]);

  if (!token) {
    return (
      <div className="min-h-dvh bg-neutral-50">
        <div className="md:hidden px-xl">
          <div className="mx-auto w-full max-w-96 pt-xl">
            <div className="h-10 w-40 rounded-xl bg-neutral-100" />
            <div className="mt-3xl h-64 rounded-3xl bg-neutral-100" />
          </div>
        </div>

        <div className="hidden md:block px-6xl">
          <div className="mx-auto w-full max-w-300 pt-6xl">
            <div className="h-12 w-64 rounded-xl bg-neutral-100" />
            <div className="mt-4xl h-80 rounded-3xl bg-neutral-100" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-neutral-50">
      {/* Mobile layout (default) */}
      <div className="md:hidden px-xl">
        <div className="mx-auto w-full max-w-96">
          <div className="sticky top-0 z-40 bg-neutral-50 pt-xl">
            <PageHeader
              onLogoClick={() => router.push("/")}
              onSearchClick={() => router.push("/book-list?openSearch=1")}
              onBagClick={() => router.push("/cart")}
              cartItemCount={cartItemCount}
              profilePhotoSrc={profilePhotoSrc}
              profileAlt={
                meUser?.name ? `${meUser.name} avatar` : "User avatar"
              }
              avatarUnoptimized={avatarUnoptimized}
              onProfileClick={() => router.push("/profile")}
            />

            <div className="mt-2xl rounded-full bg-neutral-100 p-xs">
              <div className="grid grid-cols-3 gap-xs">
                <button
                  type="button"
                  onClick={() => router.push("/profile")}
                  className="h-9 rounded-full text-text-xs font-semibold tracking-[-0.02em] text-neutral-500"
                >
                  Profile
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/borrowed-list")}
                  className="h-9 rounded-full text-text-xs font-semibold tracking-[-0.02em] text-neutral-500"
                >
                  Borrowed List
                </button>
                <button
                  type="button"
                  className="h-9 rounded-full bg-base-white text-text-xs font-semibold tracking-[-0.02em] text-neutral-950"
                  aria-current="page"
                >
                  Reviews
                </button>
              </div>
            </div>
          </div>

          <main className="pt-3xl">
            <div className="text-display-xs font-bold tracking-[-0.02em] text-neutral-950">
              Reviews
            </div>

            <div className="mt-xl">
              <div className="relative">
                <div className="pointer-events-none absolute left-lg top-1/2 -translate-y-1/2">
                  <Image
                    src="/Home/SearchMute.svg"
                    alt=""
                    width={18}
                    height={18}
                    className="h-4.5 w-4.5"
                  />
                </div>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search book"
                  className="h-11 w-full rounded-full border border-neutral-200 bg-base-white pl-10 pr-xl text-text-sm font-semibold tracking-[-0.02em] text-neutral-950 placeholder:text-neutral-400"
                  aria-label="Search book"
                />
              </div>
            </div>

            <div className="mt-2xl space-y-2xl">
              {myReviewsQuery.isLoading ? (
                <div className="space-y-xl">
                  <div className="h-48 rounded-3xl bg-neutral-100" />
                  <div className="h-48 rounded-3xl bg-neutral-100" />
                </div>
              ) : visibleReviews.length === 0 ? (
                <div className="rounded-3xl bg-base-white px-2xl py-3xl text-center text-text-sm font-semibold tracking-[-0.02em] text-neutral-500">
                  No reviews found.
                </div>
              ) : (
                visibleReviews.map((review) => {
                  const dateLabel = formatReviewDateTime(review.createdAt);
                  const book =
                    typeof review.bookId === "number"
                      ? bookById.get(review.bookId)
                      : null;

                  const bookRecord = book && isRecord(book) ? book : null;
                  const title = bookRecord
                    ? asString(bookRecord.title)
                    : "Book";
                  const authorName =
                    bookRecord && isRecord(bookRecord.author)
                      ? asString(
                          (bookRecord.author as Record<string, unknown>).name,
                        )
                      : "Author name";

                  const coverSrc =
                    toAbsoluteAssetUrl(
                      bookRecord && typeof bookRecord.coverImage === "string"
                        ? bookRecord.coverImage
                        : null,
                    ) ?? "/Home/image4.svg";

                  const coverUnoptimized =
                    coverSrc.startsWith("data:") ||
                    coverSrc.startsWith("blob:");

                  const categoryNameFromObj =
                    bookRecord && isRecord(bookRecord.category)
                      ? asString(
                          (bookRecord.category as Record<string, unknown>).name,
                        )
                      : "";

                  const categoryIdRaw = bookRecord
                    ? (bookRecord.categoryId ??
                      (isRecord(bookRecord.category)
                        ? (bookRecord.category as Record<string, unknown>).id
                        : null))
                    : null;

                  const categoryId =
                    typeof categoryIdRaw === "string" ||
                    typeof categoryIdRaw === "number"
                      ? String(categoryIdRaw)
                      : null;

                  const categoryName =
                    categoryNameFromObj ||
                    (categoryId
                      ? (categoryNameById.get(categoryId) ?? "")
                      : "") ||
                    "Category";

                  return (
                    <div
                      key={review.key}
                      className="rounded-3xl bg-base-white px-2xl py-2xl"
                    >
                      <div className="text-text-2xs font-semibold tracking-[-0.02em] text-neutral-500">
                        {dateLabel}
                      </div>

                      <div className="mt-xl flex gap-xl">
                        <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-2xl bg-neutral-100">
                          <Image
                            src={coverSrc}
                            alt={title}
                            fill
                            sizes="80px"
                            className="object-cover"
                            unoptimized={coverUnoptimized}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="inline-flex items-center rounded-full border border-neutral-200 bg-base-white px-md py-0.5 text-text-2xs font-semibold tracking-[-0.02em] text-neutral-600">
                            {categoryName}
                          </div>

                          <div className="mt-md text-text-xs font-semibold tracking-[-0.02em] text-neutral-500">
                            Book Name
                          </div>
                          <div className="mt-2xs truncate text-text-sm font-bold tracking-[-0.02em] text-neutral-950">
                            {title || "-"}
                          </div>
                          <div className="mt-2xs truncate text-text-xs font-medium tracking-[-0.02em] text-neutral-500">
                            {authorName || "-"}
                          </div>
                        </div>
                      </div>

                      <div className="mt-xl">
                        <StarsRow star={review.star} />
                      </div>

                      <p className="mt-lg text-text-xs font-medium leading-6 tracking-[-0.02em] text-neutral-600">
                        {review.comment || "-"}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            <div
              className="mt-7xl h-px w-screen bg-neutral-200 relative left-1/2 -translate-x-1/2"
              aria-hidden="true"
            />

            <div className="pt-6xl">
              <Footer />
            </div>
          </main>
        </div>
      </div>

      {/* Desktop layout (md+) */}
      <div className="hidden md:block px-6xl">
        <div className="mx-auto w-full max-w-300">
          <DesktopHeader
            onLogoClick={() => router.push("/home")}
            onBagClick={() => router.push("/cart")}
            cartItemCount={cartItemCount}
            searchValue={desktopSearchValue}
            onSearchValueChange={setDesktopSearchValue}
            onSearchSubmit={(q) => {
              const url = q
                ? `/book-list?q=${encodeURIComponent(q)}`
                : "/book-list";
              setDesktopSearchValue("");
              router.push(url);
            }}
            profilePhotoSrc={profilePhotoSrc}
            profileAlt={meUser?.name ? `${meUser.name} avatar` : "User"}
            avatarUnoptimized={avatarUnoptimized}
            userName={meUser?.name ?? "User"}
          />

          <div className="mt-2xl flex justify-center">
            <div className="w-full max-w-120 rounded-full bg-neutral-100 p-xs">
              <div className="grid grid-cols-3 gap-xs">
                <button
                  type="button"
                  onClick={() => router.push("/profile")}
                  className="h-9 rounded-full text-text-xs font-semibold tracking-[-0.02em] text-neutral-500"
                >
                  Profile
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/borrowed-list")}
                  className="h-9 rounded-full text-text-xs font-semibold tracking-[-0.02em] text-neutral-500"
                >
                  Borrowed List
                </button>
                <button
                  type="button"
                  className="h-9 rounded-full bg-base-white text-text-xs font-semibold tracking-[-0.02em] text-neutral-950"
                  aria-current="page"
                >
                  Reviews
                </button>
              </div>
            </div>
          </div>

          <main className="pt-4xl pb-6xl">
            <div className="mx-auto w-full max-w-160">
              <h1 className="text-display-sm font-bold tracking-[-0.02em] text-neutral-950">
                Reviews
              </h1>

              <div className="mt-2xl w-full max-w-120">
                <div className="relative">
                  <div className="pointer-events-none absolute left-lg top-1/2 -translate-y-1/2">
                    <Image
                      src="/Home/SearchMute.svg"
                      alt=""
                      width={18}
                      height={18}
                      className="h-4.5 w-4.5"
                    />
                  </div>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search Reviews"
                    className="h-11 w-full rounded-full border border-neutral-200 bg-base-white pl-10 pr-xl text-text-sm font-semibold tracking-[-0.02em] text-neutral-950 placeholder:text-neutral-400"
                    aria-label="Search Reviews"
                  />
                </div>
              </div>

              <div className="mt-4xl space-y-3xl">
                {myReviewsQuery.isLoading ? (
                  <div className="space-y-3xl">
                    <div className="h-56 rounded-3xl bg-neutral-100" />
                    <div className="h-56 rounded-3xl bg-neutral-100" />
                    <div className="h-56 rounded-3xl bg-neutral-100" />
                  </div>
                ) : visibleReviews.length === 0 ? (
                  <div className="rounded-3xl border border-neutral-200 bg-base-white px-4xl py-3xl text-center text-text-sm font-semibold tracking-[-0.02em] text-neutral-500">
                    No reviews found.
                  </div>
                ) : (
                  visibleReviews.map((review) => {
                    const dateLabel = formatReviewDateTime(review.createdAt);
                    const book =
                      typeof review.bookId === "number"
                        ? bookById.get(review.bookId)
                        : null;

                    const bookRecord = book && isRecord(book) ? book : null;
                    const title = bookRecord
                      ? asString(bookRecord.title)
                      : "Book";
                    const authorName =
                      bookRecord && isRecord(bookRecord.author)
                        ? asString(
                            (bookRecord.author as Record<string, unknown>).name,
                          )
                        : "Author name";

                    const coverSrc =
                      toAbsoluteAssetUrl(
                        bookRecord && typeof bookRecord.coverImage === "string"
                          ? bookRecord.coverImage
                          : null,
                      ) ?? "/Home/image4.svg";

                    const coverUnoptimized =
                      coverSrc.startsWith("data:") ||
                      coverSrc.startsWith("blob:");

                    const categoryNameFromObj =
                      bookRecord && isRecord(bookRecord.category)
                        ? asString(
                            (bookRecord.category as Record<string, unknown>)
                              .name,
                          )
                        : "";

                    const categoryIdRaw = bookRecord
                      ? (bookRecord.categoryId ??
                        (isRecord(bookRecord.category)
                          ? (bookRecord.category as Record<string, unknown>).id
                          : null))
                      : null;

                    const categoryId =
                      typeof categoryIdRaw === "string" ||
                      typeof categoryIdRaw === "number"
                        ? String(categoryIdRaw)
                        : null;

                    const categoryName =
                      categoryNameFromObj ||
                      (categoryId
                        ? (categoryNameById.get(categoryId) ?? "")
                        : "") ||
                      "Category";

                    return (
                      <article
                        key={review.key}
                        className="rounded-3xl border border-neutral-200 bg-base-white px-4xl py-3xl"
                      >
                        <div className="text-text-2xs font-semibold tracking-[-0.02em] text-neutral-500">
                          {dateLabel}
                        </div>

                        <div className="mt-xl flex gap-xl border-b border-neutral-100 pb-xl">
                          <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-2xl bg-neutral-100">
                            <Image
                              src={coverSrc}
                              alt={title}
                              fill
                              sizes="80px"
                              className="object-cover"
                              unoptimized={coverUnoptimized}
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="inline-flex items-center rounded-full border border-neutral-200 bg-base-white px-md py-0.5 text-text-2xs font-semibold tracking-[-0.02em] text-neutral-600">
                              {categoryName}
                            </div>

                            <div className="mt-md text-text-xs font-semibold tracking-[-0.02em] text-neutral-500">
                              Book Name
                            </div>
                            <div className="mt-2xs truncate text-text-sm font-bold tracking-[-0.02em] text-neutral-950">
                              {title || "-"}
                            </div>
                            <div className="mt-2xs truncate text-text-xs font-medium tracking-[-0.02em] text-neutral-500">
                              {authorName || "-"}
                            </div>
                          </div>
                        </div>

                        <div className="mt-xl">
                          <StarsRow star={review.star} />
                        </div>

                        <p className="mt-lg text-text-xs font-medium leading-6 tracking-[-0.02em] text-neutral-600">
                          {review.comment || "-"}
                        </p>
                      </article>
                    );
                  })
                )}
              </div>

              <div className="mt-7xl h-px w-full bg-neutral-200" aria-hidden />
              <DesktopFooter />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
