"use client";

import { CheckIcon } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { HomeHeader } from "@/components/Header";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTrigger,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { clearAuth } from "@/features/auth/authSlice";
import { useAuthedImageUrl } from "@/shared/lib/useAuthedImageUrl";
import { useDebounce } from "@/shared/lib/useDebounce";
import { useBooksInfinite } from "@/features/books/booksHooks";

const BACKEND_BASE = "https://library-backend-production-b9cf.up.railway.app";

const CATEGORY_FILTERS: Array<{ label: string; id: number }> = [
  { label: "Fiction", id: 4 },
  { label: "Non-fiction", id: 10 },
  { label: "Self-Improve", id: 7 },
  { label: "Finance", id: 9 },
  { label: "Science", id: 11 },
  { label: "Education", id: 8 },
];

const RATING_FILTERS = [5, 4, 3, 2, 1] as const;

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

function Footer() {
  return (
    <footer className="md:hidden">
      <div className="py-6xl text-center">
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

        <p className="mx-auto mt-lg max-w-80 text-text-sm font-medium leading-6 text-neutral-600">
          Discover inspiring stories & timeless knowledge, ready to borrow
          anytime. Explore online or visit our nearest library branch.
        </p>

        <div className="mt-5xl text-text-sm font-semibold text-neutral-950">
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

      <p className="mx-auto mt-lg max-w-160 text-text-sm font-medium leading-6 text-neutral-600">
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

export default function BookListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedCategoryId, setSelectedCategoryId] = useState<
    number | undefined
  >(undefined);

  const [selectedRating, setSelectedRating] = useState<number | undefined>(
    undefined,
  );

  const [desktopSearchValue, setDesktopSearchValue] = useState(qParam);
  const debouncedDesktopSearchValue = useDebounce(desktopSearchValue, 300);

  useEffect(() => {
    const nextQ = debouncedDesktopSearchValue.trim();
    const currentQ = qParam;
    if (nextQ === currentQ) return;

    const url = nextQ
      ? `/book-list?q=${encodeURIComponent(nextQ)}`
      : "/book-list";
    router.replace(url);
  }, [debouncedDesktopSearchValue, qParam, router]);

  const qParam = (searchParams.get("q") ?? "").trim();
  const openSearchParam = (searchParams.get("openSearch") ?? "").trim();

  useEffect(() => {
    if (openSearchParam !== "1") return;
    const t = window.setTimeout(() => {
      setIsSearchOpen(true);
      searchInputRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(t);
  }, [openSearchParam]);

  useEffect(() => {
    if (!isSearchOpen) return;
    const t = window.setTimeout(() => searchInputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [isSearchOpen]);

  const drawerScopeKey = `${qParam}::${selectedCategoryId ?? "all"}::${selectedRating ?? "all"}`;

  const [drawerOpen, setDrawerOpen] = useState(false);

  const drawerInitialFetchRef = useRef<{ key: string; done: boolean }>({
    key: drawerScopeKey,
    done: false,
  });

  useEffect(() => {
    const t = window.setTimeout(() => setDrawerOpen(false), 0);
    drawerInitialFetchRef.current = { key: drawerScopeKey, done: false };
    return () => window.clearTimeout(t);
  }, [drawerScopeKey]);

  const token = useAppSelector((s) => s.auth.token);
  const user = useAppSelector((s) => s.auth.user);
  const cartItemCount = useAppSelector((s) => s.cart.itemCount);

  const profilePhoto = user?.profilePhoto ?? null;
  const profilePhotoUrl = toAbsoluteAssetUrl(profilePhoto);

  const profilePhotoSrc = useAuthedImageUrl({
    url: profilePhotoUrl,
    token,
    fallbackUrl: "/Home/Ellipse3.svg",
  });

  const avatarUnoptimized =
    profilePhotoSrc.startsWith("data:") || profilePhotoSrc.startsWith("blob:");

  const booksQuery = useBooksInfinite({
    search: qParam.length > 0 ? qParam : undefined,
    categoryId:
      typeof selectedCategoryId === "number"
        ? String(selectedCategoryId)
        : undefined,
    limit: 8,
    enabled: true,
  });

  const pages = booksQuery.data?.pages ?? [];

  const firstPagination = pages[0]?.pagination;
  const canLoadMoreFromFirst =
    typeof firstPagination?.page === "number" &&
    typeof firstPagination?.totalPages === "number"
      ? firstPagination.page < firstPagination.totalPages
      : Boolean(booksQuery.hasNextPage);

  const applyRatingFilter = <T extends { rating?: unknown }>(books: T[]) => {
    if (typeof selectedRating !== "number") return books;
    return books.filter((book) => {
      const value =
        typeof book.rating === "number" ? book.rating : Number(book.rating);
      if (!Number.isFinite(value)) return false;
      return value >= selectedRating;
    });
  };

  const firstBooks = applyRatingFilter(pages[0]?.books ?? []);

  const extraBooks = applyRatingFilter(
    pages.length <= 1 ? [] : pages.slice(1).flatMap((p) => p.books ?? []),
  );

  const ensureDrawerHasNextPage = () => {
    if (drawerInitialFetchRef.current.key !== drawerScopeKey) {
      drawerInitialFetchRef.current = { key: drawerScopeKey, done: false };
    }

    if (drawerInitialFetchRef.current.done) return;
    if (booksQuery.isFetchingNextPage) return;
    if (pages.length > 1) return;

    drawerInitialFetchRef.current.done = true;
    void booksQuery.fetchNextPage().catch(() => {
      drawerInitialFetchRef.current.done = false;
    });
  };

  return (
    <div className="min-h-dvh bg-neutral-50">
      {/* Mobile layout (unchanged) */}
      <div className="md:hidden px-xl">
        <div className="mx-auto w-full max-w-96">
          <div className="sticky top-0 z-40 bg-neutral-50 pt-xl">
            <HomeHeader
              isSearchOpen={isSearchOpen}
              setIsSearchOpen={setIsSearchOpen}
              searchValue={searchValue}
              setSearchValue={setSearchValue}
              searchInputRef={searchInputRef}
              cartItemCount={cartItemCount}
              showBagBadge
              isLoggedIn={Boolean(token)}
              profilePhotoSrc={profilePhotoSrc}
              profileAlt={user?.name ? `${user.name} avatar` : "User avatar"}
              avatarUnoptimized={avatarUnoptimized}
            />
          </div>

          <Drawer
            open={drawerOpen}
            onOpenChange={(next) => {
              if (next) ensureDrawerHasNextPage();
              setDrawerOpen(next);
            }}
          >
            <main className="pt-3xl pb-16">
              <div className="text-display-xs font-bold tracking-[-0.02em] text-neutral-950">
                Book List
              </div>

              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="mt-xl w-full rounded-2xl bg-base-white px-2xl py-xl text-left shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-text-xs font-bold tracking-[-0.02em] text-neutral-950">
                        FILTER
                      </div>
                      <Image
                        src="/Home/Filter.svg"
                        alt=""
                        width={20}
                        height={20}
                        className="h-5 w-5"
                      />
                    </div>
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="start"
                  sideOffset={8}
                  className="w-[calc(100vw-2rem)] max-w-96 rounded-2xl border border-neutral-200 bg-base-white p-0 shadow-md"
                >
                  <div className="px-xl pt-xl">
                    <div className="text-text-xs font-bold tracking-[-0.02em] text-neutral-950">
                      FILTER
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-0 px-xl pb-xl pt-lg">
                    <div className="pr-xl">
                      <div className="text-text-sm font-bold tracking-[-0.02em] text-neutral-950">
                        Category
                      </div>

                      <div className="mt-xl flex flex-col gap-xl">
                        {CATEGORY_FILTERS.map((c) => {
                          const checked = selectedCategoryId === c.id;
                          return (
                            <DropdownMenuItem
                              key={c.id}
                              onSelect={(e) => {
                                e.preventDefault();
                                setSelectedCategoryId((prev) =>
                                  prev === c.id ? undefined : c.id,
                                );
                              }}
                              className="cursor-pointer gap-xl px-0 py-0 text-text-sm font-medium tracking-[-0.02em] text-neutral-950 focus:bg-transparent focus:text-neutral-950 data-highlighted:bg-transparent data-highlighted:text-neutral-950"
                            >
                              <span
                                aria-hidden
                                className={`flex h-5 w-5 items-center justify-center rounded border ${
                                  checked
                                    ? "border-primary-600 bg-primary-600"
                                    : "border-neutral-300 bg-base-white"
                                }`}
                              >
                                {checked ? (
                                  <CheckIcon className="size-4 text-base-white" />
                                ) : null}
                              </span>
                              <span>{c.label}</span>
                            </DropdownMenuItem>
                          );
                        })}
                      </div>
                    </div>

                    <div className="border-l border-neutral-200 pl-xl">
                      <div className="text-text-sm font-bold tracking-[-0.02em] text-neutral-950">
                        Rating
                      </div>

                      <div className="mt-xl flex flex-col gap-xl">
                        {RATING_FILTERS.map((value) => {
                          const checked = selectedRating === value;
                          return (
                            <DropdownMenuItem
                              key={value}
                              onSelect={(e) => {
                                e.preventDefault();
                                setSelectedRating((prev) =>
                                  prev === value ? undefined : value,
                                );
                              }}
                              className="cursor-pointer gap-xl px-0 py-0 text-text-sm font-medium tracking-[-0.02em] text-neutral-950 focus:bg-transparent focus:text-neutral-950 data-highlighted:bg-transparent data-highlighted:text-neutral-950"
                            >
                              <span
                                aria-hidden
                                className={`flex h-5 w-5 items-center justify-center rounded border ${
                                  checked
                                    ? "border-primary-600 bg-primary-600"
                                    : "border-neutral-300 bg-base-white"
                                }`}
                              >
                                {checked ? (
                                  <CheckIcon className="size-4 text-base-white" />
                                ) : null}
                              </span>

                              <span className="flex items-center gap-md">
                                <Image
                                  src="/Home/Star.svg"
                                  alt=""
                                  width={18}
                                  height={17}
                                  className="h-4.5 w-4.5"
                                />
                                <span>{value}</span>
                              </span>
                            </DropdownMenuItem>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {booksQuery.isLoading ? (
                <div className="mt-xl grid grid-cols-2 gap-xl">
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="h-64 rounded-3xl bg-neutral-100"
                    />
                  ))}
                </div>
              ) : firstBooks.length === 0 ? (
                <div className="mt-xl rounded-3xl bg-base-white px-2xl py-3xl text-center text-text-sm font-semibold tracking-[-0.02em] text-neutral-500">
                  No books found.
                </div>
              ) : (
                <div className="mt-xl grid grid-cols-2 gap-xl">
                  {firstBooks.map((book) => {
                    const cover =
                      toAbsoluteAssetUrl(book.coverImage) ?? "/Home/image4.svg";
                    const coverUnoptimized =
                      cover.startsWith("data:") || cover.startsWith("blob:");

                    return (
                      <button
                        key={String(book.id)}
                        type="button"
                        onClick={() => router.push(`/books/${book.id}`)}
                        className="overflow-hidden rounded-3xl bg-base-white text-left shadow-sm"
                      >
                        <div className="relative aspect-3/4 w-full bg-neutral-100">
                          <Image
                            src={cover}
                            alt={book.title ?? "Book cover"}
                            fill
                            sizes="(max-width: 420px) 50vw, 200px"
                            className="object-cover"
                            unoptimized={coverUnoptimized}
                          />
                        </div>

                        <div className="p-lg">
                          <div className="truncate text-text-sm font-semibold tracking-[-0.02em] text-neutral-950">
                            {book.title ?? "Book Name"}
                          </div>
                          <div className="mt-2xs truncate text-text-xs font-medium text-neutral-600">
                            {book.author?.name ?? "Author name"}
                          </div>

                          <div className="mt-xs flex items-center gap-2xs">
                            <Image
                              src="/Home/Star.svg"
                              alt=""
                              width={16}
                              height={16}
                              className="h-4 w-4"
                            />
                            <span className="text-text-xs font-semibold text-neutral-950">
                              {typeof book.rating === "number"
                                ? book.rating.toFixed(1)
                                : "-"}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {canLoadMoreFromFirst ? (
                <div className="mt-3xl flex justify-center">
                  <DrawerTrigger asChild>
                    <button
                      type="button"
                      className="h-auto rounded-full border border-neutral-300 bg-base-white px-4xl py-sm text-text-sm font-semibold tracking-[-0.02em] text-neutral-950 disabled:opacity-50"
                    >
                      Load More
                    </button>
                  </DrawerTrigger>
                </div>
              ) : null}

              <Footer />
            </main>

            <DrawerContent>
              <DrawerHeader>
                <div className="flex items-center justify-between">
                  <DrawerTitle>More books</DrawerTitle>
                  <DrawerClose asChild>
                    <button
                      type="button"
                      aria-label="Close"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-base-white"
                    >
                      <Image
                        src="/Home/IconX.svg"
                        alt=""
                        width={16}
                        height={16}
                        className="h-4 w-4"
                      />
                    </button>
                  </DrawerClose>
                </div>
              </DrawerHeader>

              <div className="px-xl pb-xl overflow-auto">
                <div className="grid grid-cols-2 gap-xl">
                  {booksQuery.isFetchingNextPage && extraBooks.length === 0
                    ? Array.from({ length: 8 }).map((_, idx) => (
                        <div
                          key={idx}
                          className="h-64 rounded-3xl bg-neutral-100"
                        />
                      ))
                    : extraBooks.map((book) => {
                        const cover =
                          toAbsoluteAssetUrl(book.coverImage) ??
                          "/Home/image4.svg";
                        const coverUnoptimized =
                          cover.startsWith("data:") ||
                          cover.startsWith("blob:");

                        return (
                          <button
                            key={String(book.id)}
                            type="button"
                            onClick={() => {
                              setDrawerOpen(false);
                              router.push(`/books/${book.id}`);
                            }}
                            className="overflow-hidden rounded-3xl bg-base-white text-left shadow-sm"
                          >
                            <div className="relative aspect-3/4 w-full bg-neutral-100">
                              <Image
                                src={cover}
                                alt={book.title ?? "Book cover"}
                                fill
                                sizes="(max-width: 420px) 50vw, 200px"
                                className="object-cover"
                                unoptimized={coverUnoptimized}
                              />
                            </div>

                            <div className="p-lg">
                              <div className="truncate text-text-sm font-semibold tracking-[-0.02em] text-neutral-950">
                                {book.title ?? "Book Name"}
                              </div>
                              <div className="mt-2xs truncate text-text-xs font-medium text-neutral-600">
                                {book.author?.name ?? "Author name"}
                              </div>

                              <div className="mt-xs flex items-center gap-2xs">
                                <Image
                                  src="/Home/Star.svg"
                                  alt=""
                                  width={16}
                                  height={16}
                                  className="h-4 w-4"
                                />
                                <span className="text-text-xs font-semibold text-neutral-950">
                                  {typeof book.rating === "number"
                                    ? book.rating.toFixed(1)
                                    : "-"}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                </div>

                {booksQuery.hasNextPage ? (
                  <div className="mt-xl flex justify-center">
                    <button
                      type="button"
                      onClick={() => booksQuery.fetchNextPage()}
                      disabled={booksQuery.isFetchingNextPage}
                      className="h-auto rounded-full border border-neutral-300 bg-base-white px-4xl py-sm text-text-sm font-semibold tracking-[-0.02em] text-neutral-950 disabled:opacity-50"
                    >
                      {booksQuery.isFetchingNextPage
                        ? "Loading..."
                        : "Load More"}
                    </button>
                  </div>
                ) : null}
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>

      {/* Desktop layout (md+) */}
      <div className="hidden md:block px-6xl">
        <div className="mx-auto w-full max-w-300">
          <header className="sticky top-0 z-40 bg-neutral-50 py-4xl">
            <div className="flex items-center gap-4xl">
              <button
                type="button"
                aria-label="Home"
                onClick={() => router.push("/home")}
                className="flex items-center gap-lg"
              >
                <Image
                  src="/Login-Page/Logo.svg"
                  alt="Booky logo"
                  width={40}
                  height={40}
                  className="h-10 w-10"
                  priority
                />
                <span className="font-sans text-text-xl font-bold tracking-[-0.02em] text-neutral-950">
                  Booky
                </span>
              </button>

              <div className="flex flex-1 items-center justify-between gap-4xl">
                <div className="relative w-full max-w-128">
                  <Image
                    src="/Home/SearchMute.svg"
                    alt=""
                    width={16}
                    height={16}
                    className="pointer-events-none absolute left-lg top-1/2 h-4 w-4 -translate-y-1/2"
                  />
                  <input
                    value={desktopSearchValue}
                    onChange={(e) => setDesktopSearchValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      const q = desktopSearchValue.trim();
                      const url = q
                        ? `/book-list?q=${encodeURIComponent(q)}`
                        : "/book-list";
                      router.push(url);
                    }}
                    placeholder="Search book"
                    className="h-10 w-full rounded-full border border-neutral-300 bg-base-white pl-4xl pr-xl text-text-sm font-medium text-neutral-950 placeholder:text-neutral-400 focus:outline-none"
                  />
                </div>

                <div className="flex shrink-0 items-center gap-xl">
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

                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label="Profile menu"
                        className="flex items-center gap-md"
                      >
                        <div className="relative h-10 w-10 overflow-hidden rounded-full bg-neutral-200">
                          <Image
                            src={profilePhotoSrc}
                            alt={user?.name ? `${user.name} avatar` : "User"}
                            fill
                            sizes="40px"
                            unoptimized={avatarUnoptimized}
                          />
                        </div>
                        <span className="text-text-sm font-semibold tracking-[-0.02em] text-neutral-950">
                          {user?.name ?? "User"}
                        </span>
                      </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                      align="end"
                      sideOffset={12}
                      className="w-56 rounded-2xl border border-neutral-200 bg-base-white p-xl shadow-md"
                    >
                      <div className="flex flex-col gap-xl">
                        <DropdownMenuItem
                          onSelect={() => router.push("/profile")}
                          className="px-0 py-0 text-text-sm font-semibold tracking-[-0.02em] text-neutral-950 focus:bg-transparent focus:text-neutral-950 data-highlighted:bg-transparent data-highlighted:text-neutral-950"
                        >
                          Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => router.push("/borrowed-list")}
                          className="px-0 py-0 text-text-sm font-semibold tracking-[-0.02em] text-neutral-950 focus:bg-transparent focus:text-neutral-950 data-highlighted:bg-transparent data-highlighted:text-neutral-950"
                        >
                          Borrowed List
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => router.push("/reviews")}
                          className="px-0 py-0 text-text-sm font-semibold tracking-[-0.02em] text-neutral-950 focus:bg-transparent focus:text-neutral-950 data-highlighted:bg-transparent data-highlighted:text-neutral-950"
                        >
                          Reviews
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => {
                            router.replace("/home");
                            requestAnimationFrame(() => {
                              dispatch(clearAuth());
                            });
                          }}
                          className="px-0 py-0 text-text-sm font-semibold tracking-[-0.02em] text-accent-red focus:bg-transparent focus:text-accent-red data-highlighted:bg-transparent data-highlighted:text-accent-red"
                        >
                          Logout
                        </DropdownMenuItem>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </header>

          <main className="pb-6xl">
            <div className="text-display-xs font-bold tracking-[-0.02em] text-neutral-950">
              Book List
            </div>

            <div className="mt-3xl flex gap-4xl">
              <aside className="w-full max-w-80 rounded-2xl border border-neutral-100 bg-base-white p-xl shadow-sm">
                <div className="text-text-xs font-bold tracking-[-0.02em] text-neutral-950">
                  FILTER
                </div>

                <div className="mt-xl">
                  <div className="text-text-sm font-bold tracking-[-0.02em] text-neutral-950">
                    Category
                  </div>
                  <div className="mt-lg flex flex-col gap-lg">
                    {CATEGORY_FILTERS.map((c) => {
                      const checked = selectedCategoryId === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() =>
                            setSelectedCategoryId((prev) =>
                              prev === c.id ? undefined : c.id,
                            )
                          }
                          className="flex items-center gap-md text-left"
                        >
                          <span
                            aria-hidden
                            className={`flex h-5 w-5 items-center justify-center rounded border ${
                              checked
                                ? "border-primary-600 bg-primary-600"
                                : "border-neutral-300 bg-base-white"
                            }`}
                          >
                            {checked ? (
                              <CheckIcon className="size-4 text-base-white" />
                            ) : null}
                          </span>
                          <span className="text-text-sm font-medium tracking-[-0.02em] text-neutral-950">
                            {c.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4xl">
                  <div className="text-text-sm font-bold tracking-[-0.02em] text-neutral-950">
                    Rating
                  </div>
                  <div className="mt-lg flex flex-col gap-lg">
                    {RATING_FILTERS.map((value) => {
                      const checked = selectedRating === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() =>
                            setSelectedRating((prev) =>
                              prev === value ? undefined : value,
                            )
                          }
                          className="flex items-center gap-md text-left"
                        >
                          <span
                            aria-hidden
                            className={`flex h-5 w-5 items-center justify-center rounded border ${
                              checked
                                ? "border-primary-600 bg-primary-600"
                                : "border-neutral-300 bg-base-white"
                            }`}
                          >
                            {checked ? (
                              <CheckIcon className="size-4 text-base-white" />
                            ) : null}
                          </span>

                          <span className="flex items-center gap-sm">
                            <Image
                              src="/Home/Star.svg"
                              alt=""
                              width={16}
                              height={16}
                              className="h-4 w-4"
                            />
                            <span className="text-text-sm font-medium tracking-[-0.02em] text-neutral-950">
                              {value}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </aside>

              <section className="min-w-0 flex-1">
                {booksQuery.isLoading ? (
                  <div className="grid grid-cols-4 gap-xl">
                    {Array.from({ length: 8 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="aspect-3/4 rounded-2xl bg-neutral-100"
                      />
                    ))}
                  </div>
                ) : firstBooks.length === 0 ? (
                  <div className="rounded-2xl border border-neutral-100 bg-base-white p-4xl text-center text-text-sm font-semibold tracking-[-0.02em] text-neutral-500">
                    No books found.
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-xl">
                    {firstBooks.map((book) => {
                      const cover =
                        toAbsoluteAssetUrl(book.coverImage) ??
                        "/Home/image4.svg";
                      const coverUnoptimized =
                        cover.startsWith("data:") || cover.startsWith("blob:");

                      return (
                        <button
                          key={String(book.id)}
                          type="button"
                          onClick={() => router.push(`/books/${book.id}`)}
                          className="overflow-hidden rounded-2xl bg-base-white text-left shadow-sm"
                        >
                          <div className="relative aspect-3/4 w-full bg-neutral-100">
                            <Image
                              src={cover}
                              alt={book.title ?? "Book cover"}
                              fill
                              sizes="(max-width: 1024px) 20vw, 220px"
                              className="object-cover"
                              unoptimized={coverUnoptimized}
                            />
                          </div>

                          <div className="p-lg">
                            <div className="truncate text-text-sm font-semibold tracking-[-0.02em] text-neutral-950">
                              {book.title ?? "Book Name"}
                            </div>
                            <div className="mt-2xs truncate text-text-xs font-medium text-neutral-600">
                              {book.author?.name ?? "Author name"}
                            </div>

                            <div className="mt-xs flex items-center gap-2xs">
                              <Image
                                src="/Home/Star.svg"
                                alt=""
                                width={16}
                                height={16}
                                className="h-4 w-4"
                              />
                              <span className="text-text-xs font-semibold text-neutral-950">
                                {typeof book.rating === "number"
                                  ? book.rating.toFixed(1)
                                  : "-"}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            <DesktopFooter />
          </main>
        </div>
      </div>
    </div>
  );
}
