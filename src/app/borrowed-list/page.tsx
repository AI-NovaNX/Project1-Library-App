"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  useInfiniteQuery,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { X } from "lucide-react";
import { toast } from "sonner";

import { useAppSelector } from "@/app/store/hooks";
import { meApiWithToken } from "@/features/auth/authApi";
import { getBookByIdApi } from "@/features/books/booksApi";
import { useCategories } from "@/features/categories/categoriesHooks";
import { Card } from "@/components/ui/card";
import { getErrorMessage } from "@/shared/api/errors";
import { http } from "@/shared/api/http";
import { useDebounce } from "@/shared/lib/useDebounce";
import { useAuthedImageUrl } from "@/shared/lib/useAuthedImageUrl";
import { PageHeader } from "@/components/Header";

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

function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function parseDateLike(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const d = new Date(trimmed);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function asKeyPart(v: unknown): string | null {
  if (typeof v === "string") {
    const trimmed = v.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
}

function asNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const trimmed = v.trim();
    if (!trimmed) return null;
    if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
      const n = Number(trimmed);
      return Number.isFinite(n) ? n : null;
    }
  }
  return null;
}

function utcDayStamp(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function computeDurationDays(
  borrowedAt: Date | null,
  dueAt: Date | null,
): number | null {
  if (!borrowedAt || !dueAt) return null;
  const msPerDay = 24 * 60 * 60 * 1000;
  const diffMs = utcDayStamp(dueAt) - utcDayStamp(borrowedAt);
  if (!Number.isFinite(diffMs)) return null;
  const diffDays = Math.round(diffMs / msPerDay);
  return diffDays < 0 ? 0 : diffDays;
}

type BorrowedFilter = "all" | "active" | "returned" | "overdue";

function matchesFilter(filter: BorrowedFilter, loan: NormalizedLoan): boolean {
  if (filter === "active") return loan.status === "ACTIVE";
  if (filter === "returned") return loan.status === "RETURNED";
  if (filter === "overdue") return loan.status === "OVERDUE";
  return true;
}

type NormalizedLoan = {
  key: string;
  status: "ACTIVE" | "RETURNED" | "OVERDUE";
  dueAt: Date | null;
  borrowedAt: Date | null;
  durationDays: number | null;
  bookId: number | null;
  title: string;
  authorName: string;
  categoryName: string;
  coverImage: string | null;
};

type ReviewModalState = {
  open: boolean;
  bookId: number | null;
  star: number;
  comment: string;
  pending: boolean;
};

type AfterBorrowMarker = {
  titles: string[];
  bookIds: number[];
  triggeredAt: number;
};

function extractLoansArray(payload: unknown): unknown[] {
  if (!isRecord(payload)) return [];

  // axios: { data: ... }
  const level1 = isRecord(payload.data) ? payload.data : payload;

  // common shapes: { data: { loans: [] } } or { data: [] }
  const candidates: unknown[] = [];

  if (Array.isArray(level1)) candidates.push(level1);
  if (isRecord(level1)) {
    if (Array.isArray(level1.loans)) candidates.push(level1.loans);
    if (Array.isArray(level1.items)) candidates.push(level1.items);
    if (Array.isArray(level1.results)) candidates.push(level1.results);

    if (isRecord(level1.data)) {
      const level2 = level1.data;
      if (Array.isArray(level2)) candidates.push(level2);
      if (isRecord(level2)) {
        if (Array.isArray(level2.loans)) candidates.push(level2.loans);
        if (Array.isArray(level2.items)) candidates.push(level2.items);
        if (Array.isArray(level2.results)) candidates.push(level2.results);
      }
    }
  }

  return candidates.find(Array.isArray) ?? [];
}

function extractPagination(payload: unknown): {
  page: number | null;
  totalPages: number | null;
} {
  if (!isRecord(payload)) return { page: null, totalPages: null };

  const level1 = isRecord(payload.data) ? payload.data : payload;
  const candidates: unknown[] = [];

  if (isRecord(level1)) {
    if (isRecord(level1.pagination)) candidates.push(level1.pagination);
    if (isRecord(level1.meta)) candidates.push(level1.meta);
    if (isRecord(level1.data)) {
      const level2 = level1.data;
      if (isRecord(level2.pagination)) candidates.push(level2.pagination);
      if (isRecord(level2.meta)) candidates.push(level2.meta);
      if (isRecord(level2)) candidates.push(level2);
    }
  }

  const first = candidates.find((c) => isRecord(c)) as
    | Record<string, unknown>
    | undefined;

  if (!first) return { page: null, totalPages: null };

  const page =
    asNumber(first.page) ??
    asNumber(first.currentPage) ??
    asNumber(first.current_page) ??
    asNumber(first.pageNumber) ??
    asNumber(first.page_number);

  const totalPages =
    asNumber(first.totalPages) ??
    asNumber(first.totalPage) ??
    asNumber(first.total_pages) ??
    asNumber(first.pageCount) ??
    asNumber(first.page_count) ??
    asNumber(first.lastPage) ??
    asNumber(first.last_page);

  return {
    page: page === null ? null : Math.max(1, Math.round(page)),
    totalPages:
      totalPages === null ? null : Math.max(1, Math.round(totalPages)),
  };
}

function normalizeLoan(raw: unknown, index: number): NormalizedLoan | null {
  if (!isRecord(raw)) return null;

  const book = isRecord(raw.book) ? raw.book : null;
  const author = book && isRecord(book.author) ? book.author : null;
  const category = book && isRecord(book.category) ? book.category : null;

  const bookId = asNumber(raw.bookId) ?? (book ? asNumber(book.id) : null);

  const title =
    (book ? asString(book.title) : "") || asString(raw.bookTitle) || "Book";

  const authorName =
    (author ? asString(author.name) : "") || asString(raw.authorName) || "-";

  const categoryName =
    (category ? asString(category.name) : "") ||
    asString(raw.categoryName) ||
    "Category";

  const coverImage =
    (book && (typeof book.coverImage === "string" || book.coverImage === null)
      ? book.coverImage
      : null) ??
    (typeof raw.coverImage === "string" || raw.coverImage === null
      ? raw.coverImage
      : null);

  const borrowedAt =
    parseDateLike(raw.borrowedAt) ??
    parseDateLike(raw.borrowDate) ??
    parseDateLike(raw.borrowedDate) ??
    parseDateLike(raw.createdAt);

  const returnedAt =
    parseDateLike((raw as Record<string, unknown>).returnedAt) ??
    parseDateLike((raw as Record<string, unknown>).returnedDate) ??
    parseDateLike((raw as Record<string, unknown>).returnedOn) ??
    parseDateLike((raw as Record<string, unknown>).returned_on);

  const dueAt =
    parseDateLike(raw.dueAt) ??
    parseDateLike(raw.dueDate) ??
    parseDateLike(raw.returnBy) ??
    parseDateLike(raw.returnDate);

  const statusRaw = asString(raw.status).toUpperCase();
  const isReturnedFromApi =
    statusRaw === "RETURNED" ||
    statusRaw === "RETURN" ||
    statusRaw === "DONE" ||
    statusRaw === "COMPLETED";

  const isOverdueFromApi =
    statusRaw === "LATE" || statusRaw === "OVERDUE" || statusRaw === "EXPIRED";

  const now = Date.now();
  const isOverdueFromDates =
    !returnedAt && dueAt ? dueAt.getTime() < now : false;

  const displayStatus: NormalizedLoan["status"] =
    returnedAt || isReturnedFromApi
      ? "RETURNED"
      : isOverdueFromApi || isOverdueFromDates
        ? "OVERDUE"
        : "ACTIVE";

  const durationFromApi =
    asNumber(raw.durationDays) ?? asNumber(raw.days) ?? asNumber(raw.duration);

  const durationDays =
    computeDurationDays(borrowedAt, dueAt) ??
    (durationFromApi === null
      ? null
      : Math.max(0, Math.round(durationFromApi)));

  const idPart =
    asKeyPart(raw.id) ??
    asKeyPart((raw as Record<string, unknown>).loanId) ??
    asKeyPart((raw as Record<string, unknown>)._id);

  const stamp =
    (borrowedAt ? borrowedAt.toISOString() : null) ??
    (dueAt ? dueAt.toISOString() : null) ??
    "na";

  const key = idPart
    ? `loan:${idPart}`
    : `loan:${bookId ?? "x"}:${stamp}:${index}`;

  return {
    key,
    status: displayStatus,
    dueAt,
    borrowedAt,
    durationDays,
    bookId,
    title,
    authorName,
    categoryName,
    coverImage,
  };
}

function statusBadgeClasses(status: NormalizedLoan["status"]) {
  if (status === "RETURNED") {
    return "bg-neutral-100 text-neutral-600";
  }
  if (status === "OVERDUE") {
    return "bg-accent-red/10 text-accent-red";
  }
  return "bg-accent-green/10 text-accent-green";
}

function statusLabel(status: NormalizedLoan["status"]) {
  if (status === "RETURNED") return "Returned";
  if (status === "OVERDUE") return "Overdue";
  return "Active";
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

export default function BorrowedListPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const noCacheHeaders = useMemo(() => {
    return {
      "Cache-Control": "no-store, no-cache, max-age=0",
      Pragma: "no-cache",
    } as const;
  }, []);

  const token = useAppSelector((s) => s.auth.token);
  const user = useAppSelector((s) => s.auth.user);
  const cartItemCount = useAppSelector((s) => s.cart.itemCount);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<BorrowedFilter>("all");

  const afterBorrowRef = useRef<AfterBorrowMarker | null>(null);
  const afterBorrowSyncRef = useRef(false);

  const debouncedSearch = useDebounce(search, 250);
  const apiQuery = useMemo(() => {
    const trimmed = debouncedSearch.trim();
    return trimmed.length > 0 ? trimmed : "";
  }, [debouncedSearch]);

  const [reviewModal, setReviewModal] = useState<ReviewModalState>({
    open: false,
    bookId: null,
    star: 0,
    comment: "",
    pending: false,
  });

  useEffect(() => {
    if (!reviewModal.open) return;
    if (typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [reviewModal.open]);

  useEffect(() => {
    if (!token) router.replace("/login");
  }, [router, token]);

  const meQuery = useQuery({
    queryKey: ["me", token],
    queryFn: () => meApiWithToken(token),
    enabled: Boolean(token),
  });

  const meUser = meQuery.data ?? user ?? null;

  const profilePhoto = meUser?.profilePhoto ?? null;
  const profilePhotoUrl = toAbsoluteAssetUrl(profilePhoto);

  const profilePhotoSrc = useAuthedImageUrl({
    url: profilePhotoUrl,
    token,
    fallbackUrl: "/Home/Ellipse3.svg",
  });

  const avatarUnoptimized =
    profilePhotoSrc.startsWith("data:") || profilePhotoSrc.startsWith("blob:");

  const loansQuery = useInfiniteQuery({
    queryKey: ["meLoans", token, apiQuery],
    enabled: Boolean(token),
    refetchOnMount: "always",
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const page =
        typeof pageParam === "number" && Number.isFinite(pageParam)
          ? pageParam
          : 1;
      const limit = 10;

      // Cache buster: avoid broken 304/ETag caching for this endpoint.
      // Keep it out of the queryKey so React Query caching still works.
      const cacheBust = Date.now();

      const res = await http.get("/api/loans/my", {
        params: {
          q: apiQuery || undefined,
          page,
          limit,
          _cb: cacheBust,
        },
        headers: {
          ...noCacheHeaders,
          ...(token ? { Authorization: `Bearer ${token}` } : null),
        },
      });

      const payload = res.data;
      const rows = extractLoansArray(payload);
      const offset = (page - 1) * limit;
      const loans = rows
        .map((v, idx) => normalizeLoan(v, offset + idx))
        .filter((v): v is NormalizedLoan => v !== null);

      const pag = extractPagination(payload);

      const nextPageFromMeta =
        typeof pag.page === "number" &&
        typeof pag.totalPages === "number" &&
        pag.page < pag.totalPages
          ? pag.page + 1
          : null;

      const nextPageFromHeuristic = rows.length >= limit ? page + 1 : null;

      return {
        loans,
        nextPage: nextPageFromMeta ?? nextPageFromHeuristic,
      };
    },
    getNextPageParam: (lastPage) => {
      return typeof lastPage?.nextPage === "number"
        ? lastPage.nextPage
        : undefined;
    },
  });

  const legacyLoansQuery = useQuery({
    queryKey: ["meLoansLegacy", token, apiQuery],
    enabled: Boolean(token),
    refetchOnMount: "always",
    queryFn: async () => {
      try {
        const params: Record<string, unknown> = {
          page: 1,
        };

        // Some backends don't support q/limit on this legacy endpoint.
        // Only send q when non-empty, and keep limit small.
        if (apiQuery) params.q = apiQuery;
        params.limit = 10;

        const res = await http.get("/api/me/loans", {
          params,
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        const payload = res.data;
        const rows = extractLoansArray(payload);
        return rows
          .map((v, idx) => normalizeLoan(v, 10_000 + idx))
          .filter((v): v is NormalizedLoan => v !== null);
      } catch {
        return [] as NormalizedLoan[];
      }
    },
  });

  const allLoans = useMemo(() => {
    const rows = loansQuery.data?.pages.flatMap((p) => p.loans) ?? [];
    const legacyRows = legacyLoansQuery.data ?? [];
    const merged = [...rows, ...legacyRows];
    const seen = new Set<string>();
    return merged.filter((loan) => {
      if (seen.has(loan.key)) return false;
      seen.add(loan.key);
      return true;
    });
  }, [legacyLoansQuery.data, loansQuery.data]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const rawBookIds = window.sessionStorage.getItem(
        "borrowed-list:expectedBookIds",
      );
      const rawTitles = window.sessionStorage.getItem(
        "borrowed-list:expectedTitles",
      );
      const rawTriggeredAt = window.sessionStorage.getItem(
        "borrowed-list:triggeredAt",
      );
      if (!rawTriggeredAt) return;

      const triggeredAt = Number(rawTriggeredAt);
      if (!Number.isFinite(triggeredAt)) return;

      // Only auto-sync shortly after a successful borrow.
      const maxAgeMs = 5 * 60 * 1000;
      if (Date.now() - triggeredAt > maxAgeMs) {
        window.sessionStorage.removeItem("borrowed-list:expectedBookIds");
        window.sessionStorage.removeItem("borrowed-list:expectedTitles");
        window.sessionStorage.removeItem("borrowed-list:triggeredAt");
        return;
      }

      const titles = (() => {
        if (!rawTitles) return [];
        const parsed = JSON.parse(rawTitles);
        return Array.isArray(parsed)
          ? parsed
              .filter((v) => typeof v === "string")
              .map((v) => v.trim())
              .filter((v) => v.length > 0)
          : [];
      })();

      const bookIds = (() => {
        if (!rawBookIds) return [];
        const parsed = JSON.parse(rawBookIds);
        return Array.isArray(parsed)
          ? parsed
              .map((v) => {
                if (typeof v === "number" && Number.isFinite(v)) {
                  return Math.round(v);
                }
                if (typeof v === "string") {
                  const trimmed = v.trim();
                  if (!trimmed) return null;
                  const n = Number(trimmed);
                  return Number.isFinite(n) ? Math.round(n) : null;
                }
                return null;
              })
              .filter((v): v is number => typeof v === "number")
              .filter((v) => v > 0)
          : [];
      })();

      if (titles.length === 0 && bookIds.length === 0) return;
      afterBorrowRef.current = { titles, bookIds, triggeredAt };
    } catch {
      // ignore
    }
  }, []);

  const markerMatchesLoans = (
    marker: AfterBorrowMarker,
    loans: NormalizedLoan[],
  ) => {
    if (marker.bookIds.length > 0) {
      const wanted = new Set(marker.bookIds);
      return loans.some(
        (loan) => typeof loan.bookId === "number" && wanted.has(loan.bookId),
      );
    }
    const wanted = new Set(
      marker.titles.map((t) => t.trim().toLowerCase()).filter(Boolean),
    );
    return loans.some((loan) => wanted.has(loan.title.trim().toLowerCase()));
  };

  const loansLoading = loansQuery.isLoading;
  const loansHasData = Boolean(loansQuery.data);
  const loansHasNextPage = Boolean(loansQuery.hasNextPage);
  const loansFetchingNextPage = loansQuery.isFetchingNextPage;
  const loansFetchNextPage = loansQuery.fetchNextPage;

  // Keep a stable-length dependency list for effects below.
  const filterDep1 = filter;
  const filterDep2 = filter;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!token) return;

    const marker = afterBorrowRef.current;
    if (!marker) return;
    if (afterBorrowSyncRef.current) return;
    if (loansLoading) return;
    if (!loansHasData) return;

    const clearMarker = () => {
      try {
        window.sessionStorage.removeItem("borrowed-list:expectedBookIds");
        window.sessionStorage.removeItem("borrowed-list:expectedTitles");
        window.sessionStorage.removeItem("borrowed-list:triggeredAt");
      } catch {
        // ignore
      }
      afterBorrowRef.current = null;
    };

    // If already present, just clear marker.
    const alreadyFound = markerMatchesLoans(marker, allLoans);
    if (alreadyFound) {
      clearMarker();
      return;
    }

    afterBorrowSyncRef.current = true;

    (async () => {
      try {
        // Use a larger limit for the sync scan so we can find a newly-borrowed
        // item even when the backend places ACTIVE loans far from page 1.
        const limit = 50;
        const queryKey = ["meLoans", token, apiQuery] as const;

        const mergeIntoCache = (
          incoming: NormalizedLoan[],
          pageParam: number,
        ) => {
          if (incoming.length === 0) return;
          queryClient.setQueryData(queryKey, (old) => {
            if (!isRecord(old)) return old;
            const pagesRaw = (old as { pages?: unknown }).pages;
            const pageParamsRaw = (old as { pageParams?: unknown }).pageParams;
            if (!Array.isArray(pagesRaw)) return old;

            const existingKeys = new Set<string>();
            for (const p of pagesRaw) {
              if (!isRecord(p)) continue;
              const loansRaw = (p as { loans?: unknown }).loans;
              if (!Array.isArray(loansRaw)) continue;
              for (const l of loansRaw) {
                if (isRecord(l) && typeof l.key === "string") {
                  existingKeys.add(l.key);
                }
              }
            }

            const toAdd = incoming.filter((l) => !existingKeys.has(l.key));
            if (toAdd.length === 0) return old;

            const nextPages = [...pagesRaw, { loans: toAdd, nextPage: null }];
            const nextPageParams = (() => {
              const prev = Array.isArray(pageParamsRaw) ? pageParamsRaw : [];
              if (prev.includes(pageParam)) return prev;
              return [...prev, pageParam];
            })();

            return {
              ...(old as object),
              pages: nextPages,
              pageParams: nextPageParams,
            };
          });
        };

        // Scan pages until we find the new loan or exhaust pagination.
        // Some backends sort loans oldest->newest, so the newly borrowed item may
        // land on the *last* page. We therefore probe both ends.
        const maxPagesToScan = 20;
        let totalPages: number | null = null;

        const fetchPage = async (page: number) => {
          const cacheBust = Date.now();
          const res = await http.get("/api/loans/my", {
            params: {
              q: apiQuery || undefined,
              page,
              limit,
              _cb: cacheBust,
            },
            headers: {
              ...noCacheHeaders,
              ...(token ? { Authorization: `Bearer ${token}` } : null),
            },
          });

          const payload = res.data;
          const rows = extractLoansArray(payload);
          const offset = (page - 1) * limit;
          const loans = rows
            .map((v, idx) => normalizeLoan(v, offset + idx))
            .filter((v): v is NormalizedLoan => v !== null);

          mergeIntoCache(loans, page);

          const pag = extractPagination(payload);
          if (typeof pag.totalPages === "number") totalPages = pag.totalPages;

          return { loans, rowsLen: rows.length };
        };

        const fetchedPages = new Set<number>();

        // Always start with page 1 to discover totalPages if available.
        fetchedPages.add(1);
        const first = await fetchPage(1);
        if (markerMatchesLoans(marker, first.loans)) {
          clearMarker();
          return;
        }

        // If we know totalPages, check from the end backwards.
        const pagesToTry: number[] = [];
        if (typeof totalPages === "number" && totalPages >= 1) {
          for (
            let p = totalPages;
            p >= 1 && pagesToTry.length < maxPagesToScan;
            p -= 1
          ) {
            if (!fetchedPages.has(p)) pagesToTry.push(p);
          }
        }

        // Fill remaining budget by going forward from page 2.
        for (let p = 2; pagesToTry.length < maxPagesToScan; p += 1) {
          if (!fetchedPages.has(p)) pagesToTry.push(p);
          if (typeof totalPages === "number" && p >= totalPages) break;
          // If we don't know totalPages, stop when we reach the scan budget.
          if (typeof totalPages !== "number" && p >= maxPagesToScan) break;
        }

        for (const p of pagesToTry) {
          fetchedPages.add(p);
          const res = await fetchPage(p);
          if (markerMatchesLoans(marker, res.loans)) {
            clearMarker();
            return;
          }

          // If pagination is unknown and we hit a short page, likely end reached.
          if (typeof totalPages !== "number" && res.rowsLen < limit) break;
        }

        clearMarker();
      } catch {
        clearMarker();
      }
    })();
  }, [
    allLoans,
    apiQuery,
    filterDep1,
    filterDep2,
    loansHasData,
    loansLoading,
    noCacheHeaders,
    queryClient,
    token,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const afterBorrow = afterBorrowRef.current;
    if (!afterBorrow) return;
    if (loansLoading) return;
    if (!loansHasData) return;
    if (loansFetchingNextPage) return;

    const found = markerMatchesLoans(afterBorrow, allLoans);

    const clearMarker = () => {
      try {
        window.sessionStorage.removeItem("borrowed-list:expectedBookIds");
        window.sessionStorage.removeItem("borrowed-list:expectedTitles");
        window.sessionStorage.removeItem("borrowed-list:triggeredAt");
      } catch {
        // ignore
      }
      afterBorrowRef.current = null;
    };

    if (found) {
      clearMarker();
      return;
    }

    if (loansHasNextPage) {
      loansFetchNextPage().catch((err) => {
        toast.error(getErrorMessage(err));
        clearMarker();
      });
      return;
    }

    // Exhausted pagination; stop trying.
    clearMarker();
  }, [
    allLoans,
    loansLoading,
    loansHasData,
    loansHasNextPage,
    loansFetchingNextPage,
    loansFetchNextPage,
  ]);

  const visibleLoans = useMemo(() => {
    const rows = allLoans.filter((loan) => matchesFilter(filter, loan));
    const q = search.trim().toLowerCase();
    const filtered = !q
      ? rows
      : rows.filter((it) => it.title.toLowerCase().includes(q));

    const sorted = [...filtered].sort((a, b) => {
      const aDue = a.dueAt ? a.dueAt.getTime() : Number.POSITIVE_INFINITY;
      const bDue = b.dueAt ? b.dueAt.getTime() : Number.POSITIVE_INFINITY;
      if (aDue !== bDue) return aDue - bDue;

      // Tie-breaker: most recent borrow first
      const aBorrow = a.borrowedAt ? a.borrowedAt.getTime() : 0;
      const bBorrow = b.borrowedAt ? b.borrowedAt.getTime() : 0;
      if (aBorrow !== bBorrow) return bBorrow - aBorrow;

      return a.key.localeCompare(b.key);
    });

    return sorted;
  }, [allLoans, filter, search]);

  const categoriesQuery = useCategories({ enabled: Boolean(token) });

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categoriesQuery.data ?? []) {
      map.set(String(c.id), c.name);
    }
    return map;
  }, [categoriesQuery.data]);

  const visibleBookIds = useMemo(() => {
    const set = new Set<number>();
    for (const loan of visibleLoans) {
      if (typeof loan.bookId === "number" && Number.isFinite(loan.bookId)) {
        set.add(loan.bookId);
      }
    }
    return Array.from(set);
  }, [visibleLoans]);

  const bookDetailQueries = useQueries({
    queries: visibleBookIds.map((bookId) => ({
      queryKey: ["book", { id: bookId }],
      enabled: Boolean(token),
      staleTime: 5 * 60 * 1000,
      queryFn: async () => getBookByIdApi(bookId),
    })),
  });

  const categoryNameByBookId = useMemo(() => {
    const map = new Map<number, string>();

    visibleBookIds.forEach((bookId, index) => {
      const query = bookDetailQueries[index];
      const book = query?.data;
      if (!book) return;

      const nameFromObj =
        typeof (book as { category?: { name?: unknown } }).category?.name ===
        "string"
          ? ((book as { category?: { name?: string } }).category?.name ?? "")
          : "";

      if (nameFromObj) {
        map.set(bookId, nameFromObj);
        return;
      }

      const categoryIdRaw =
        (book as { categoryId?: unknown }).categoryId ??
        (book as { category?: { id?: unknown } }).category?.id ??
        null;

      const categoryId =
        typeof categoryIdRaw === "string" || typeof categoryIdRaw === "number"
          ? String(categoryIdRaw)
          : null;

      if (!categoryId) return;
      const fromCategories = categoryNameById.get(categoryId);
      if (fromCategories) map.set(bookId, fromCategories);
    });

    return map;
  }, [bookDetailQueries, categoryNameById, visibleBookIds]);

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
            onBagClick={() => router.push("/cart")}
            cartItemCount={cartItemCount}
            profilePhotoSrc={profilePhotoSrc}
            profileAlt={meUser?.name ? `${meUser.name} avatar` : "User avatar"}
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
                className="h-9 rounded-full bg-base-white text-text-xs font-semibold tracking-[-0.02em] text-neutral-950"
                aria-current="page"
              >
                Borrowed List
              </button>
              <button
                type="button"
                onClick={() => {
                  router.push("/reviews");
                }}
                className="h-9 rounded-full text-text-xs font-semibold tracking-[-0.02em] text-neutral-500"
              >
                Reviews
              </button>
            </div>
          </div>
        </div>

        <main className="pt-3xl">
          <div className="text-display-xs font-bold tracking-[-0.02em] text-neutral-950">
            Borrowed List
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

          <div className="mt-xl flex items-center gap-sm">
            {(
              [
                { key: "all", label: "All" },
                { key: "active", label: "Active" },
                { key: "returned", label: "Returned" },
                { key: "overdue", label: "Overdue" },
              ] as const
            ).map((opt) => {
              const selected = filter === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setFilter(opt.key)}
                  className={
                    selected
                      ? "h-9 rounded-full border border-primary-600 bg-base-white px-xl text-text-xs font-semibold tracking-[-0.02em] text-primary-600"
                      : "h-9 rounded-full border border-neutral-200 bg-base-white px-xl text-text-xs font-semibold tracking-[-0.02em] text-neutral-500"
                  }
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div className="mt-2xl space-y-2xl">
            {loansQuery.isLoading ? (
              <div className="space-y-xl">
                <div className="h-40 rounded-3xl bg-neutral-100" />
                <div className="h-40 rounded-3xl bg-neutral-100" />
              </div>
            ) : visibleLoans.length === 0 ? (
              <div className="rounded-3xl bg-base-white px-2xl py-3xl text-center text-text-sm font-semibold tracking-[-0.02em] text-neutral-500">
                No borrowed books found.
              </div>
            ) : (
              visibleLoans.map((loan) => {
                const dueLabel = loan.dueAt ? formatLongDate(loan.dueAt) : "-";
                const borrowedLabel = loan.borrowedAt
                  ? formatLongDate(loan.borrowedAt)
                  : "-";
                const durationLabel =
                  loan.durationDays === null
                    ? "Duration -"
                    : `Duration ${loan.durationDays} Days`;

                const coverSrc =
                  toAbsoluteAssetUrl(loan.coverImage) ?? "/Home/image4.svg";
                const coverUnoptimized =
                  coverSrc.startsWith("data:") || coverSrc.startsWith("blob:");

                const bookDetailHref =
                  typeof loan.bookId === "number"
                    ? `/books/${loan.bookId}`
                    : null;

                return (
                  <div
                    key={loan.key}
                    className="rounded-3xl bg-base-white px-2xl py-2xl"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-text-xs font-semibold tracking-[-0.02em] text-neutral-600">
                        Status{" "}
                        <span
                          className={`ml-sm inline-flex items-center rounded-full px-md py-0.5 text-text-xs font-bold tracking-[-0.02em] ${statusBadgeClasses(loan.status)}`}
                        >
                          {statusLabel(loan.status)}
                        </span>
                      </div>

                      <div className="text-text-xs font-semibold tracking-[-0.02em] text-neutral-600">
                        Due Date{" "}
                        <span className="ml-sm inline-flex items-center rounded-full bg-accent-red/10 px-md py-0.5 text-text-xs font-bold tracking-[-0.02em] text-accent-red">
                          {dueLabel}
                        </span>
                      </div>
                    </div>

                    <div className="mt-xl flex gap-xl">
                      <button
                        type="button"
                        className="relative h-24 w-20 shrink-0 overflow-hidden rounded-2xl bg-neutral-100"
                        onClick={() => {
                          if (!bookDetailHref) {
                            toast.error("Book tidak ditemukan.");
                            return;
                          }
                          router.push(bookDetailHref);
                        }}
                        aria-label={
                          bookDetailHref
                            ? `Open details for ${loan.title}`
                            : "Book not found"
                        }
                      >
                        <Image
                          src={coverSrc}
                          alt={loan.title}
                          fill
                          sizes="80px"
                          className="object-cover"
                          unoptimized={coverUnoptimized}
                        />
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="text-text-xs font-semibold tracking-[-0.02em] text-neutral-500">
                          Category
                        </div>
                        <div className="mt-xs text-text-xs font-bold tracking-[-0.02em] text-neutral-950">
                          {typeof loan.bookId === "number"
                            ? (categoryNameByBookId.get(loan.bookId) ??
                              loan.categoryName)
                            : loan.categoryName}
                        </div>

                        <div className="mt-lg text-text-xs font-semibold tracking-[-0.02em] text-neutral-500">
                          Book Name
                        </div>
                        <button
                          type="button"
                          className="mt-xs block w-full truncate text-left text-text-sm font-bold tracking-[-0.02em] text-neutral-950"
                          onClick={() => {
                            if (!bookDetailHref) {
                              toast.error("Book tidak ditemukan.");
                              return;
                            }
                            router.push(bookDetailHref);
                          }}
                          aria-label={
                            bookDetailHref
                              ? `Open details for ${loan.title}`
                              : "Book not found"
                          }
                        >
                          {loan.title}
                        </button>
                        <div className="mt-xs truncate text-text-xs font-medium tracking-[-0.02em] text-neutral-500">
                          {loan.authorName}
                        </div>

                        <div className="mt-lg flex items-center gap-sm text-text-xs font-semibold tracking-[-0.02em] text-neutral-600">
                          <span>{borrowedLabel}</span>
                          <span className="text-neutral-300">·</span>
                          <span>{durationLabel}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="mt-xl h-11 w-full rounded-full bg-primary-600 px-4xl text-text-sm font-bold tracking-[-0.02em] text-base-white"
                      onClick={() => {
                        if (!token) {
                          router.push("/login");
                          return;
                        }

                        if (!loan.bookId) {
                          toast.error("Book tidak ditemukan.");
                          return;
                        }

                        setReviewModal({
                          open: true,
                          bookId: loan.bookId,
                          star: 0,
                          comment: "",
                          pending: false,
                        });
                      }}
                    >
                      Give Review
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {loansQuery.hasNextPage ? (
            <button
              type="button"
              disabled={loansQuery.isFetchingNextPage}
              onClick={() => loansQuery.fetchNextPage()}
              className="mt-2xl h-11 w-full rounded-full border border-neutral-200 bg-base-white text-text-sm font-bold tracking-[-0.02em] text-neutral-950 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loansQuery.isFetchingNextPage ? "Loading..." : "Load More"}
            </button>
          ) : null}
        </main>

        {reviewModal.open && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-xl"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget && !reviewModal.pending) {
                setReviewModal((prev) => ({ ...prev, open: false }));
              }
            }}
          >
            <Card className="w-full max-w-80 rounded-3xl border border-neutral-200 bg-base-white px-2xl py-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-text-sm font-bold tracking-[-0.02em] text-neutral-950">
                  Give Review
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  disabled={reviewModal.pending}
                  className="grid h-8 w-8 place-items-center rounded-full text-neutral-600 disabled:opacity-60"
                  onClick={() =>
                    setReviewModal((prev) => ({ ...prev, open: false }))
                  }
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-xl text-center text-text-xs font-semibold tracking-[-0.02em] text-neutral-700">
                Give Rating
              </div>

              <div className="mt-md flex items-center justify-center gap-md">
                {Array.from({ length: 5 }).map((_, idx) => {
                  const value = idx + 1;
                  const active = value <= reviewModal.star;
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-label={`Rate ${value} star`}
                      disabled={reviewModal.pending}
                      className="grid h-8 w-8 place-items-center disabled:opacity-60"
                      onClick={() =>
                        setReviewModal((prev) => ({ ...prev, star: value }))
                      }
                    >
                      <Image
                        src={
                          active
                            ? "/User-Review/Star.svg"
                            : "/User-Review/Star-mute.svg"
                        }
                        alt=""
                        width={20}
                        height={20}
                        className="h-5 w-5"
                      />
                    </button>
                  );
                })}
              </div>

              <textarea
                value={reviewModal.comment}
                onChange={(e) =>
                  setReviewModal((prev) => ({
                    ...prev,
                    comment: e.target.value,
                  }))
                }
                placeholder="Please share your thoughts about this book"
                className="mt-xl h-40 w-full resize-none rounded-3xl border border-neutral-200 bg-base-white px-xl py-xl text-text-xs font-medium tracking-[-0.02em] text-neutral-950 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-600/30"
                disabled={reviewModal.pending}
              />

              <button
                type="button"
                disabled={reviewModal.pending}
                className="mt-xl h-11 w-full rounded-full bg-primary-600 px-4xl text-text-sm font-bold tracking-[-0.02em] text-base-white disabled:cursor-not-allowed disabled:opacity-60"
                onClick={async () => {
                  if (!token) {
                    router.push("/login");
                    return;
                  }

                  if (!reviewModal.bookId) {
                    toast.error("Book tidak ditemukan.");
                    return;
                  }

                  if (reviewModal.star < 1 || reviewModal.star > 5) {
                    toast.error("Silakan pilih rating bintang (1-5).");
                    return;
                  }

                  setReviewModal((prev) => ({ ...prev, pending: true }));
                  try {
                    await http.post(
                      "/api/reviews",
                      {
                        bookId: reviewModal.bookId,
                        star: reviewModal.star,
                        comment: reviewModal.comment.trim(),
                      },
                      {
                        headers: token
                          ? { Authorization: `Bearer ${token}` }
                          : undefined,
                      },
                    );

                    toast.success("Review berhasil dikirim.");
                    setReviewModal({
                      open: false,
                      bookId: null,
                      star: 0,
                      comment: "",
                      pending: false,
                    });
                  } catch (err) {
                    toast.error(getErrorMessage(err));
                    setReviewModal((prev) => ({ ...prev, pending: false }));
                  }
                }}
              >
                {reviewModal.pending ? "Sending..." : "Send"}
              </button>
            </Card>
          </div>
        )}

        <Footer />
      </div>
    </div>
  );
}
