"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { clearAuth } from "@/features/auth/authSlice";
import {
  useBooksInfinite,
  useRecommendedBooksInfinite,
} from "@/features/books/booksHooks";
import { usePopularAuthors } from "@/features/authors/authorsHooks";
import { useDebounce } from "@/shared/lib/useDebounce";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type CategoryCard = {
  label: string;
  iconSrc: string;
};

const CATEGORIES: CategoryCard[] = [
  { label: "Fiction", iconSrc: "/Home/Fiksi.svg" },
  { label: "Non-Fiction", iconSrc: "/Home/Non-Fiction.svg" },
  { label: "Self-Improvement", iconSrc: "/Home/Self-Improvement.svg" },
  { label: "Finance", iconSrc: "/Home/FinanceAndBusiness.svg" },
  { label: "Science", iconSrc: "/Home/Science.svg" },
  { label: "Education", iconSrc: "/Home/Education.svg" },
];

export default function HomePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [pressedCta, setPressedCta] = useState<"login" | "register" | null>(
    null,
  );

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const debouncedSearchValue = useDebounce(searchValue, 300);
  const searchTerm = debouncedSearchValue.trim();
  const isSearchEmpty = isSearchOpen && searchTerm.length === 0;
  const isSearchMode = isSearchOpen && searchTerm.length > 0;

  const [recommendedCategoryId, setRecommendedCategoryId] = useState<
    number | undefined
  >(undefined);

  const emptyCategoryToastRef = useRef<{
    categoryId: number | null;
    shown: boolean;
  }>({
    categoryId: null,
    shown: false,
  });

  const recommendedBooksQuery = useRecommendedBooksInfinite({
    by: "rating",
    limit: 10,
    categoryId: recommendedCategoryId,
  });

  const searchedBooksQuery = useBooksInfinite({
    search: isSearchMode ? searchTerm : undefined,
    // Don't bind search results to the selected recommendation category.
    // Otherwise search may look "random" (or miss existing books) when a
    // category is active.
    limit: 10,
    enabled: isSearchMode,
  });

  const popularAuthorsQuery = usePopularAuthors({ limit: 4 });

  useEffect(() => {
    if (isSearchOpen) return;
    if (!recommendedCategoryId) {
      emptyCategoryToastRef.current = { categoryId: null, shown: false };
      return;
    }

    const totalBooks =
      recommendedBooksQuery.data?.pages.reduce(
        (acc, page) => acc + page.books.length,
        0,
      ) ?? 0;

    if (emptyCategoryToastRef.current.categoryId !== recommendedCategoryId) {
      emptyCategoryToastRef.current = {
        categoryId: recommendedCategoryId,
        shown: false,
      };
    }

    if (
      recommendedBooksQuery.isSuccess &&
      !recommendedBooksQuery.isFetching &&
      totalBooks === 0 &&
      !emptyCategoryToastRef.current.shown
    ) {
      toast("No books found in this category.");
      emptyCategoryToastRef.current.shown = true;
    }
  }, [
    isSearchOpen,
    recommendedCategoryId,
    recommendedBooksQuery.data,
    recommendedBooksQuery.isFetching,
    recommendedBooksQuery.isSuccess,
  ]);

  useEffect(() => {
    if (!isSearchOpen) return;
    const t = window.setTimeout(() => searchInputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [isSearchOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onResize = () => {
      if (window.innerWidth >= 768) {
        setIsSearchOpen(false);
        setSearchValue("");
      }
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const displayedBooksPages = isSearchEmpty
    ? undefined
    : isSearchMode
      ? searchedBooksQuery.data?.pages
      : recommendedBooksQuery.data?.pages;

  const displayedBooksRaw =
    displayedBooksPages?.flatMap((page) => page.books) ?? [];

  const displayedBooks = isSearchMode
    ? displayedBooksRaw.filter((book) => {
        const needle = searchTerm.toLowerCase();
        const title = (book.title ?? "").toLowerCase();
        const authorName = (book.author?.name ?? "").toLowerCase();

        return title.includes(needle) || authorName.includes(needle);
      })
    : displayedBooksRaw;

  const displayedBooksPageCount = displayedBooksPages?.length ?? 1;

  const displayedHasNextPage = isSearchEmpty
    ? false
    : isSearchMode
      ? searchedBooksQuery.hasNextPage
      : recommendedBooksQuery.hasNextPage;

  const displayedIsFetchingNextPage = isSearchEmpty
    ? false
    : isSearchMode
      ? searchedBooksQuery.isFetchingNextPage
      : recommendedBooksQuery.isFetchingNextPage;

  const fetchDisplayedNextPage = () => {
    if (isSearchEmpty) return;
    if (isSearchMode) {
      searchedBooksQuery.fetchNextPage();
      return;
    }

    recommendedBooksQuery.fetchNextPage();
  };

  const SHOW_BAG_BADGE = true;

  useEffect(() => {
    if (!isSearchMode) return;
    if (!searchedBooksQuery.hasNextPage) return;
    if (searchedBooksQuery.isFetching || searchedBooksQuery.isFetchingNextPage)
      return;

    // Backend may not strictly filter by `search`, so keep fetching pages
    // until we have at least 1 client-side match or pagination ends.
    if (displayedBooks.length === 0) {
      searchedBooksQuery.fetchNextPage();
    }
  }, [
    displayedBooks.length,
    isSearchMode,
    searchedBooksQuery,
    searchedBooksQuery.hasNextPage,
    searchedBooksQuery.isFetching,
    searchedBooksQuery.isFetchingNextPage,
  ]);

  const token = useAppSelector((s) => s.auth.token);
  const user = useAppSelector((s) => s.auth.user);
  const isLoggedIn = Boolean(token);

  const profilePhoto = user?.profilePhoto ?? null;

  const profilePhotoSrc = profilePhoto
    ? profilePhoto.startsWith("http")
      ? profilePhoto
      : `https://library-backend-production-b9cf.up.railway.app${profilePhoto.startsWith("/") ? "" : "/"}${profilePhoto}`
    : null;

  return (
    <div className="min-h-dvh bg-neutral-50 px-xl">
      <div className="mx-auto w-full max-w-96">
        <div className="sticky top-0 z-40 bg-neutral-50 pt-xl">
          <header className="flex items-center justify-between">
            <div
              className={`${isSearchOpen ? "hidden md:flex" : "flex"} w-full items-center justify-between`}
            >
              <Image
                src="/Login-Page/Logo.svg"
                alt="Booky logo"
                width={40}
                height={40}
                className="h-10 w-10"
                priority
              />

              <div className="flex items-center gap-3xl">
                <button
                  type="button"
                  aria-label="Search"
                  onClick={() => {
                    if (typeof window === "undefined") return;
                    if (window.innerWidth >= 768) return;

                    setIsMenuOpen(false);
                    setPressedCta(null);
                    setIsSearchOpen(true);
                  }}
                >
                  <Image
                    src="/Home/Search.svg"
                    alt=""
                    width={24}
                    height={24}
                    className="h-6 w-6"
                  />
                </button>

                <button type="button" aria-label="Bag" className="relative">
                  <Image
                    src="/Home/Bag.svg"
                    alt=""
                    width={28}
                    height={28}
                    className="h-7 w-7"
                  />
                  {SHOW_BAG_BADGE ? (
                    <Image
                      src="/Home/Frame92.svg"
                      alt=""
                      width={20}
                      height={20}
                      className="absolute -right-2 -top-2 h-5 w-5"
                    />
                  ) : null}
                </button>

                {isLoggedIn ? (
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <button type="button" aria-label="Profile menu">
                        <div className="relative h-10 w-10 overflow-hidden rounded-full bg-neutral-200">
                          {profilePhotoSrc ? (
                            <Image
                              src={profilePhotoSrc}
                              alt={
                                user?.name
                                  ? `${user.name} avatar`
                                  : "User avatar"
                              }
                              fill
                              sizes="40px"
                            />
                          ) : (
                            <Image
                              src="/Home/Ellipse3.svg"
                              alt="Avatar placeholder"
                              fill
                              sizes="40px"
                            />
                          )}
                        </div>
                      </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                      align="end"
                      sideOffset={12}
                      className="w-[calc(100vw-2rem)] max-w-96 rounded-2xl border border-neutral-200 bg-base-white p-xl shadow-md"
                    >
                      <div className="flex flex-col gap-xl">
                        <DropdownMenuItem
                          onSelect={() => router.push("/profile")}
                          className="px-0 py-0 text-text-sm font-semibold tracking-[-0.02em] text-neutral-950 focus:bg-transparent focus:text-neutral-950 data-highlighted:bg-transparent data-highlighted:text-neutral-950"
                        >
                          Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => {
                            // Not implemented yet; keep UX consistent without navigation.
                          }}
                          className="px-0 py-0 text-text-sm font-semibold tracking-[-0.02em] text-neutral-950 focus:bg-transparent focus:text-neutral-950 data-highlighted:bg-transparent data-highlighted:text-neutral-950"
                        >
                          Borrowed List
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => {
                            // Not implemented yet; keep UX consistent without navigation.
                          }}
                          className="px-0 py-0 text-text-sm font-semibold tracking-[-0.02em] text-neutral-950 focus:bg-transparent focus:text-neutral-950 data-highlighted:bg-transparent data-highlighted:text-neutral-950"
                        >
                          Reviews
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => {
                            dispatch(clearAuth());
                            router.push("/");
                          }}
                          className="px-0 py-0 text-text-sm font-semibold tracking-[-0.02em] text-accent-red focus:bg-transparent focus:text-accent-red data-highlighted:bg-transparent data-highlighted:text-accent-red"
                        >
                          Logout
                        </DropdownMenuItem>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <DropdownMenu
                    modal={false}
                    open={isMenuOpen}
                    onOpenChange={(open) => {
                      setIsMenuOpen(open);
                      if (!open) setPressedCta(null);
                    }}
                  >
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label={isMenuOpen ? "Close menu" : "Menu"}
                        aria-expanded={isMenuOpen}
                        className="md:hidden"
                      >
                        <Image
                          src={
                            isMenuOpen ? "/Home/IconX.svg" : "/Home/Menu.svg"
                          }
                          alt=""
                          width={isMenuOpen ? 16 : 24}
                          height={isMenuOpen ? 16 : 24}
                          className={isMenuOpen ? "h-3.5 w-3.5" : "h-6 w-6"}
                        />
                      </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                      align="end"
                      sideOffset={0}
                      className="hidden"
                    >
                      <div className="hidden" />
                    </DropdownMenuContent>

                    {isMenuOpen ? (
                      <div className="fixed bottom-0 left-0 right-0 top-15 z-30 flex w-screen flex-col md:hidden">
                        <div className="shrink-0 min-h-90.25 bg-neutral-50 px-xl py-lg">
                          <div className="flex w-full gap-3.5">
                            <button
                              type="button"
                              onClick={() => {
                                setPressedCta("login");
                                requestAnimationFrame(() => {
                                  router.push("/login");
                                });
                              }}
                              className={`min-w-0 flex-1 basis-0 rounded-full border border-neutral-300 bg-base-white py-sm font-sans text-text-md font-bold tracking-[-0.02em] text-neutral-950 transition-colors hover:border-primary-600 hover:bg-primary-600 hover:text-neutral-25 focus:border-primary-600 focus:bg-primary-600 focus:text-neutral-25 active:border-primary-600 active:bg-primary-600 active:text-neutral-25 ${pressedCta === "login" ? "border-primary-600 bg-primary-600 text-neutral-25" : ""}`}
                            >
                              Login
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setPressedCta("register");
                                requestAnimationFrame(() => {
                                  router.push("/register");
                                });
                              }}
                              className={`min-w-0 flex-1 basis-0 rounded-full border border-neutral-300 bg-base-white py-sm font-sans text-text-md font-bold tracking-[-0.02em] text-neutral-950 transition-colors hover:border-primary-600 hover:bg-primary-600 hover:text-neutral-25 focus:border-primary-600 focus:bg-primary-600 focus:text-neutral-25 active:border-primary-600 active:bg-primary-600 active:text-neutral-25 ${pressedCta === "register" ? "border-primary-600 bg-primary-600 text-neutral-25" : ""}`}
                            >
                              Register
                            </button>
                          </div>
                        </div>

                        <button
                          type="button"
                          aria-label="Close menu overlay"
                          onClick={() => {
                            setPressedCta(null);
                            setIsMenuOpen(false);
                          }}
                          className="w-full flex-1 bg-transparent"
                        />
                      </div>
                    ) : null}
                  </DropdownMenu>
                )}
              </div>
            </div>

            {isSearchOpen ? (
              <div className="flex w-full items-center gap-lg md:hidden">
                <Image
                  src="/Login-Page/Logo.svg"
                  alt="Booky logo"
                  width={40}
                  height={40}
                  className="h-10 w-10"
                  priority
                />

                <div className="relative flex-1">
                  <Image
                    src="/Home/SearchMute.svg"
                    alt=""
                    width={16}
                    height={16}
                    className="pointer-events-none absolute left-lg top-1/2 h-4 w-4 -translate-y-1/2"
                  />
                  <input
                    ref={searchInputRef}
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder="Search book"
                    className="h-10 w-full rounded-full border border-neutral-300 bg-base-white pl-4xl pr-xl text-text-sm font-medium text-neutral-950 placeholder:text-neutral-400 focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  aria-label="Close search"
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchValue("");
                  }}
                  className="shrink-0"
                >
                  <Image
                    src="/Home/IconX.svg"
                    alt=""
                    width={16}
                    height={16}
                    className="h-4 w-4"
                  />
                </button>
              </div>
            ) : null}
          </header>
        </div>

        <main className="pt-4xl">
          <div className="overflow-hidden rounded-2xl">
            <Image
              src="/Home/image4.svg"
              alt="Welcome to Booky"
              width={361}
              height={133}
              className="h-auto w-full"
              priority
            />
          </div>

          <div className="mt-lg flex justify-center gap-xs">
            <Image
              src="/Home/Ellipse4.svg"
              alt=""
              width={6}
              height={6}
              className="h-1.5 w-1.5"
            />
            <Image
              src="/Home/Ellipse5.svg"
              alt=""
              width={6}
              height={6}
              className="h-1.5 w-1.5"
            />
            <Image
              src="/Home/Ellipse5.svg"
              alt=""
              width={6}
              height={6}
              className="h-1.5 w-1.5"
            />
          </div>

          <section className="mt-4xl rounded-3xl border border-neutral-100 bg-base-white p-lg">
            <div className="grid grid-cols-3 gap-lg">
              {CATEGORIES.map((category) => (
                <div key={category.label}>
                  {category.label === "Fiction" ? (
                    <button
                      type="button"
                      aria-pressed={recommendedCategoryId === 4}
                      onClick={() => {
                        setRecommendedCategoryId((prev) =>
                          prev === 4 ? undefined : 4,
                        );
                      }}
                      className="w-full rounded-2xl border border-neutral-100 bg-base-white p-md"
                    >
                      <div className="flex items-center justify-center rounded-xl bg-primary-100 p-lg">
                        <Image
                          src={category.iconSrc}
                          alt=""
                          width={40}
                          height={40}
                          className="h-10 w-10"
                        />
                      </div>
                      <div className="pt-md text-text-xs font-semibold text-neutral-950">
                        {category.label}
                      </div>
                    </button>
                  ) : category.label === "Non-Fiction" ? (
                    <button
                      type="button"
                      aria-pressed={recommendedCategoryId === 10}
                      onClick={() => {
                        setRecommendedCategoryId((prev) =>
                          prev === 10 ? undefined : 10,
                        );
                      }}
                      className="w-full rounded-2xl border border-neutral-100 bg-base-white p-md"
                    >
                      <div className="flex items-center justify-center rounded-xl bg-primary-100 p-lg">
                        <Image
                          src={category.iconSrc}
                          alt=""
                          width={40}
                          height={40}
                          className="h-10 w-10"
                        />
                      </div>
                      <div className="pt-md text-text-xs font-semibold text-neutral-950">
                        {category.label}
                      </div>
                    </button>
                  ) : category.label === "Self-Improvement" ? (
                    <button
                      type="button"
                      aria-pressed={recommendedCategoryId === 7}
                      onClick={() => {
                        setRecommendedCategoryId((prev) =>
                          prev === 7 ? undefined : 7,
                        );
                      }}
                      className="w-full rounded-2xl border border-neutral-100 bg-base-white p-md"
                    >
                      <div className="flex items-center justify-center rounded-xl bg-primary-100 p-lg">
                        <Image
                          src={category.iconSrc}
                          alt=""
                          width={40}
                          height={40}
                          className="h-10 w-10"
                        />
                      </div>
                      <div className="pt-md text-text-xs font-semibold text-neutral-950">
                        {category.label}
                      </div>
                    </button>
                  ) : category.label === "Finance" ? (
                    <button
                      type="button"
                      aria-pressed={recommendedCategoryId === 9}
                      onClick={() => {
                        setRecommendedCategoryId((prev) =>
                          prev === 9 ? undefined : 9,
                        );
                      }}
                      className="w-full rounded-2xl border border-neutral-100 bg-base-white p-md"
                    >
                      <div className="flex items-center justify-center rounded-xl bg-primary-100 p-lg">
                        <Image
                          src={category.iconSrc}
                          alt=""
                          width={40}
                          height={40}
                          className="h-10 w-10"
                        />
                      </div>
                      <div className="pt-md text-text-xs font-semibold text-neutral-950">
                        {category.label}
                      </div>
                    </button>
                  ) : category.label === "Science" ? (
                    <button
                      type="button"
                      aria-pressed={recommendedCategoryId === 11}
                      onClick={() => {
                        setRecommendedCategoryId((prev) =>
                          prev === 11 ? undefined : 11,
                        );
                      }}
                      className="w-full rounded-2xl border border-neutral-100 bg-base-white p-md"
                    >
                      <div className="flex items-center justify-center rounded-xl bg-primary-100 p-lg">
                        <Image
                          src={category.iconSrc}
                          alt=""
                          width={40}
                          height={40}
                          className="h-10 w-10"
                        />
                      </div>
                      <div className="pt-md text-text-xs font-semibold text-neutral-950">
                        {category.label}
                      </div>
                    </button>
                  ) : category.label === "Education" ? (
                    <button
                      type="button"
                      aria-pressed={recommendedCategoryId === 8}
                      onClick={() => {
                        setRecommendedCategoryId((prev) =>
                          prev === 8 ? undefined : 8,
                        );
                      }}
                      className="w-full rounded-2xl border border-neutral-100 bg-base-white p-md"
                    >
                      <div className="flex items-center justify-center rounded-xl bg-primary-100 p-lg">
                        <Image
                          src={category.iconSrc}
                          alt=""
                          width={40}
                          height={40}
                          className="h-10 w-10"
                        />
                      </div>
                      <div className="pt-md text-text-xs font-semibold text-neutral-950">
                        {category.label}
                      </div>
                    </button>
                  ) : (
                    <div className="rounded-2xl border border-neutral-100 bg-base-white p-md">
                      <div className="flex items-center justify-center rounded-xl bg-primary-100 p-lg">
                        <Image
                          src={category.iconSrc}
                          alt=""
                          width={40}
                          height={40}
                          className="h-10 w-10"
                        />
                      </div>
                      <div className="pt-md text-text-xs font-semibold text-neutral-950">
                        {category.label}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="mt-3xl">
            <h2 className="text-text-xl font-semibold tracking-[-0.02em] text-neutral-950">
              Recommendation
            </h2>

            {isSearchEmpty ? (
              <div className="mt-lg rounded-2xl border border-neutral-100 bg-base-white p-4xl">
                <div className="flex flex-col items-center justify-center gap-md py-4xl text-center">
                  <Image
                    src="/Home/SearchMute.svg"
                    alt=""
                    width={20}
                    height={20}
                    className="h-5 w-5"
                  />
                  <div className="text-text-sm font-semibold tracking-[-0.02em] text-neutral-950">
                    Search book
                  </div>
                  <div className="text-text-xs text-neutral-600">
                    Type a keyword to search.
                  </div>
                </div>
              </div>
            ) : (
              <>
                {isSearchMode &&
                searchedBooksQuery.isSuccess &&
                displayedBooks.length === 0 &&
                !searchedBooksQuery.hasNextPage ? (
                  <div className="mt-lg rounded-2xl border border-neutral-100 bg-base-white p-4xl">
                    <div className="flex flex-col items-center justify-center gap-md py-4xl text-center">
                      <Image
                        src="/Home/SearchMute.svg"
                        alt=""
                        width={20}
                        height={20}
                        className="h-5 w-5"
                      />
                      <div className="text-text-sm font-semibold tracking-[-0.02em] text-neutral-950">
                        No results
                      </div>
                      <div className="text-text-xs text-neutral-600">
                        Try a different keyword.
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="mt-lg grid grid-cols-2 gap-lg">
                  {displayedBooks
                    .slice(0, 10 * displayedBooksPageCount)
                    .map((book) => (
                      <div
                        key={book.id}
                        className="overflow-hidden rounded-2xl border border-neutral-100 bg-base-white shadow-sm"
                      >
                        <div className="relative aspect-3/4 w-full bg-neutral-100">
                          {book.coverImage ? (
                            <Image
                              src={book.coverImage}
                              alt={book.title}
                              fill
                              sizes="(max-width: 430px) 50vw, 200px"
                              className="object-cover"
                              unoptimized={book.coverImage.startsWith("data:")}
                            />
                          ) : null}
                        </div>

                        <div className="p-md">
                          <div className="text-text-sm font-semibold tracking-[-0.02em] text-neutral-950">
                            {book.title ?? "-"}
                          </div>
                          <div className="mt-2xs text-text-xs text-neutral-500">
                            {book.author?.name ?? "-"}
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
                      </div>
                    ))}
                </div>

                {displayedHasNextPage ? (
                  <div className="mt-3xl flex justify-center">
                    <button
                      type="button"
                      onClick={fetchDisplayedNextPage}
                      disabled={displayedIsFetchingNextPage}
                      className="h-auto rounded-full border border-neutral-300 bg-base-white px-4xl py-sm text-text-sm font-semibold tracking-[-0.02em] text-neutral-950 disabled:opacity-50"
                    >
                      {displayedIsFetchingNextPage ? "Loading..." : "Load More"}
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </section>

          <section className="mt-4xl">
            <div className="w-full border-t border-neutral-300 opacity-100" />
            <div className="py-4xl">
              <h2 className="text-text-xl font-semibold tracking-[-0.02em] text-neutral-950">
                Popular Authors
              </h2>

              <div className="mt-lg space-y-lg">
                {(popularAuthorsQuery.data?.authors ?? []).map((author) => {
                  const rawAvatar =
                    author.photo ??
                    author.profilePhoto ??
                    author.avatar ??
                    author.image ??
                    null;

                  const avatarSrc =
                    typeof rawAvatar === "string" && rawAvatar.length > 0
                      ? rawAvatar.startsWith("http")
                        ? rawAvatar
                        : `https://library-backend-production-b9cf.up.railway.app${rawAvatar.startsWith("/") ? "" : "/"}${rawAvatar}`
                      : "/Home/Ellipse3.svg";

                  return (
                    <div
                      key={author.id}
                      className="flex items-center gap-lg rounded-2xl bg-base-white p-lg shadow-sm"
                    >
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-neutral-200">
                        <Image
                          src={avatarSrc}
                          alt=""
                          fill
                          sizes="48px"
                          className="object-cover"
                          unoptimized={avatarSrc.startsWith("data:")}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-text-sm font-semibold tracking-[-0.02em] text-neutral-950">
                          {author.name}
                        </div>

                        <div className="mt-2xs flex items-center gap-sm text-text-xs text-neutral-600">
                          <Image
                            src="/Home/BookIcon.svg"
                            alt=""
                            width={16}
                            height={16}
                            className="h-4 w-4"
                          />
                          <span className="font-medium text-neutral-950">
                            {author.bookCount} books
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="-mx-xl h-0 border-t border-neutral-300 opacity-100 md:mx-0" />
          </section>

          <section className="md:hidden">
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
          </section>
        </main>
      </div>
    </div>
  );
}
