"use client";

import { useAuthedImageUrl } from "@/shared/lib/useAuthedImageUrl";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useAppSelector } from "@/app/store/hooks";
import { useAppDispatch } from "@/app/store/hooks";
import { clearAuth } from "@/features/auth/authSlice";
import { useRecommendedBooksInfinite } from "@/features/books/booksHooks";
import { usePopularAuthors } from "@/features/authors/authorsHooks";
import { HomeHeader } from "@/components/Header";
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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [
    desktopRecommendationVisibleCount,
    setDesktopRecommendationVisibleCount,
  ] = useState(10);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

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

  const displayedBooks =
    recommendedBooksQuery.data?.pages.flatMap((page) => page.books) ?? [];

  const DESKTOP_RECOMMENDATION_PAGE_SIZE = 10;
  const displayedBooksDesktop = displayedBooks.slice(
    0,
    desktopRecommendationVisibleCount,
  );

  const displayedHasNextPage = recommendedBooksQuery.hasNextPage;
  const displayedIsFetchingNextPage = recommendedBooksQuery.isFetchingNextPage;

  const shouldShowDesktopLoadMore =
    displayedBooks.length > displayedBooksDesktop.length ||
    Boolean(displayedHasNextPage);

  const fetchDisplayedNextPage = () => {
    recommendedBooksQuery.fetchNextPage();
  };

  const onDesktopLoadMore = async () => {
    if (displayedIsFetchingNextPage) return;

    const nextVisibleCount =
      desktopRecommendationVisibleCount + DESKTOP_RECOMMENDATION_PAGE_SIZE;

    if (displayedBooks.length >= nextVisibleCount) {
      setDesktopRecommendationVisibleCount(nextVisibleCount);
      return;
    }

    if (displayedHasNextPage) {
      await recommendedBooksQuery.fetchNextPage();
      setDesktopRecommendationVisibleCount(nextVisibleCount);
      return;
    }

    if (displayedBooks.length > desktopRecommendationVisibleCount) {
      setDesktopRecommendationVisibleCount(displayedBooks.length);
    }
  };

  const SHOW_BAG_BADGE = true;

  const token = useAppSelector((s) => s.auth.token);
  const user = useAppSelector((s) => s.auth.user);
  const cartItemCount = useAppSelector((s) => s.cart.itemCount);
  const isLoggedIn = Boolean(token);

  const profilePhoto = user?.profilePhoto ?? null;

  const profilePhotoUrl = profilePhoto
    ? profilePhoto.startsWith("http")
      ? profilePhoto
      : `https://library-backend-production-b9cf.up.railway.app${profilePhoto.startsWith("/") ? "" : "/"}${profilePhoto}`
    : null;

  const profilePhotoSrc = useAuthedImageUrl({
    url: profilePhotoUrl,
    token,
    fallbackUrl: "/Home/Ellipse3.svg",
  });

  const avatarUnoptimized =
    profilePhotoSrc.startsWith("data:") || profilePhotoSrc.startsWith("blob:");

  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setHasMounted(true), 0);
    return () => window.clearTimeout(t);
  }, []);

  const showLoggedIn = hasMounted && isLoggedIn;

  const CATEGORY_ID_BY_LABEL: Record<string, number> = {
    Fiction: 4,
    "Non-Fiction": 10,
    "Self-Improvement": 7,
    Finance: 9,
    Science: 11,
    Education: 8,
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
              showBagBadge={SHOW_BAG_BADGE}
              isLoggedIn={isLoggedIn}
              profilePhotoSrc={profilePhotoSrc}
              profileAlt={user?.name ? `${user.name} avatar` : "User avatar"}
              avatarUnoptimized={avatarUnoptimized}
            />
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
                          setDesktopRecommendationVisibleCount(10);
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
                          setDesktopRecommendationVisibleCount(10);
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
                          setDesktopRecommendationVisibleCount(10);
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
                          setDesktopRecommendationVisibleCount(10);
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
                          setDesktopRecommendationVisibleCount(10);
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
                          setDesktopRecommendationVisibleCount(10);
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

              <div className="mt-lg grid grid-cols-2 gap-lg">
                {displayedBooks.map((book) => (
                  <button
                    key={book.id}
                    type="button"
                    onClick={() => router.push(`/books/${book.id}`)}
                    aria-label={`View details for ${book.title ?? "book"}`}
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
                  </button>
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
                      <button
                        key={author.id}
                        type="button"
                        onClick={() => router.push(`/authors/${author.id}`)}
                        className="flex w-full items-center gap-lg rounded-2xl bg-base-white p-lg text-left shadow-sm"
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
                      </button>
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
                  Discover inspiring stories & timeless knowledge, ready to
                  borrow anytime. Explore online or visit our nearest library
                  branch.
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

      {/* Desktop layout (md+) */}
      <div className="hidden md:block px-6xl">
        <div className="mx-auto w-full max-w-300">
          <header className="sticky top-0 z-40 bg-neutral-50 py-4xl">
            <div className="flex items-center gap-4xl">
              <button
                type="button"
                aria-label="Home"
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchValue("");
                  router.push("/home");
                }}
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

              <div
                className={`flex flex-1 items-center gap-4xl ${showLoggedIn ? "justify-between" : "justify-end"}`}
              >
                {showLoggedIn ? (
                  <div className="relative w-full max-w-128">
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
                      onKeyDown={(e) => {
                        if (e.key !== "Enter") return;
                        const q = searchValue.trim();
                        const url = q
                          ? `/book-list?q=${encodeURIComponent(q)}`
                          : "/book-list";

                        setSearchValue("");
                        router.push(url);
                      }}
                      placeholder="Search book"
                      className="h-10 w-full rounded-full border border-neutral-300 bg-base-white pl-4xl pr-xl text-text-sm font-medium text-neutral-950 placeholder:text-neutral-400 focus:outline-none"
                    />
                  </div>
                ) : null}

                <div className="flex shrink-0 items-center gap-xl">
                  {showLoggedIn ? (
                    <>
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
                        {SHOW_BAG_BADGE && cartItemCount > 0 ? (
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
                                alt={
                                  user?.name
                                    ? `${user.name} avatar`
                                    : "User avatar"
                                }
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
                    </>
                  ) : (
                    <div className="flex items-center gap-md">
                      <button
                        type="button"
                        onClick={() => router.push("/login")}
                        className="h-10 rounded-full border border-neutral-300 bg-base-white px-xl text-text-sm font-semibold tracking-[-0.02em] text-neutral-950"
                      >
                        Login
                      </button>
                      <button
                        type="button"
                        onClick={() => router.push("/register")}
                        className="h-10 rounded-full bg-primary-600 px-xl text-text-sm font-semibold tracking-[-0.02em] text-neutral-25"
                      >
                        Register
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          <main className="pb-6xl">
            <div className="overflow-hidden rounded-2xl">
              <Image
                src="/Home/image4.svg"
                alt="Welcome to Booky"
                width={1200}
                height={360}
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
              <div className="grid grid-cols-6 gap-lg">
                {CATEGORIES.map((category) => {
                  const categoryId = CATEGORY_ID_BY_LABEL[category.label];
                  const isSelected =
                    typeof categoryId === "number" &&
                    recommendedCategoryId === categoryId;

                  return (
                    <button
                      key={category.label}
                      type="button"
                      aria-pressed={
                        Boolean(categoryId) ? isSelected : undefined
                      }
                      onClick={() => {
                        if (!categoryId) return;
                        setDesktopRecommendationVisibleCount(10);
                        setRecommendedCategoryId((prev) =>
                          prev === categoryId ? undefined : categoryId,
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
                  );
                })}
              </div>
            </section>

            <section className="mt-3xl">
              <h2 className="text-text-xl font-semibold tracking-[-0.02em] text-neutral-950">
                Recommendation
              </h2>

              <div className="mt-lg grid grid-cols-5 gap-lg">
                {displayedBooksDesktop.map((book) => (
                  <button
                    key={book.id}
                    type="button"
                    onClick={() => router.push(`/books/${book.id}`)}
                    aria-label={`View details for ${book.title ?? "book"}`}
                    className="overflow-hidden rounded-2xl border border-neutral-100 bg-base-white shadow-sm"
                  >
                    <div className="relative aspect-3/4 w-full bg-neutral-100">
                      {book.coverImage ? (
                        <Image
                          src={book.coverImage}
                          alt={book.title}
                          fill
                          sizes="(max-width: 1024px) 20vw, 220px"
                          className="object-cover"
                          unoptimized={book.coverImage.startsWith("data:")}
                        />
                      ) : null}
                    </div>

                    <div className="p-md">
                      <div className="line-clamp-1 text-text-sm font-semibold tracking-[-0.02em] text-neutral-950">
                        {book.title ?? "-"}
                      </div>
                      <div className="mt-2xs line-clamp-1 text-text-xs text-neutral-500">
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
                  </button>
                ))}
              </div>

              {shouldShowDesktopLoadMore ? (
                <div className="mt-3xl flex justify-center">
                  <button
                    type="button"
                    onClick={onDesktopLoadMore}
                    disabled={displayedIsFetchingNextPage}
                    className="h-auto rounded-full border border-neutral-300 bg-base-white px-4xl py-sm text-text-sm font-semibold tracking-[-0.02em] text-neutral-950 disabled:opacity-50"
                  >
                    {displayedIsFetchingNextPage ? "Loading..." : "Load More"}
                  </button>
                </div>
              ) : null}
            </section>

            <section className="mt-4xl">
              <div className="w-full border-t border-neutral-300 opacity-100" />
              <div className="py-4xl">
                <h2 className="text-text-xl font-semibold tracking-[-0.02em] text-neutral-950">
                  Popular Authors
                </h2>

                <div className="mt-lg grid grid-cols-4 gap-lg">
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
                      <button
                        key={author.id}
                        type="button"
                        onClick={() => router.push(`/authors/${author.id}`)}
                        className="flex items-center gap-lg rounded-2xl bg-base-white p-lg text-left shadow-sm"
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

                        <div className="min-w-0">
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
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="h-0 border-t border-neutral-300 opacity-100" />
            </section>

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
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}
