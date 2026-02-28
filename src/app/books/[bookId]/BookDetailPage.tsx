"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { useInfiniteQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { useBookById } from "@/features/books/booksHooks";
import { getBooksApi, getRecommendedBooksApi } from "@/features/books/booksApi";
import { useBookReviewsInfinite } from "@/features/reviews/reviewsHooks";
import { useAddToCart } from "@/features/cart/cartHooks";
import { incrementCartItemCount } from "@/features/cart/cartSlice";
import { getErrorMessage } from "@/shared/api/errors";
import type { Book } from "@/shared/types/entities";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

function clampStars(star: number) {
  if (Number.isNaN(star)) return 0;
  return Math.max(0, Math.min(5, Math.round(star)));
}

function StatItem(props: {
  value: string;
  label: string;
  withDivider?: boolean;
}) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center justify-center px-lg py-md">
        <div className="text-text-md font-semibold tracking-[-0.02em] text-neutral-950">
          {props.value}
        </div>
        <div className="text-text-xs text-neutral-500">{props.label}</div>
      </div>
      {props.withDivider ? (
        <div className="h-10 w-px bg-neutral-200" aria-hidden="true" />
      ) : null}
    </div>
  );
}

export default function BookDetailPage() {
  const router = useRouter();
  const params = useParams<{ bookId: string }>();

  const dispatch = useAppDispatch();

  const [bookMenuOpen, setBookMenuOpen] = useState(false);
  const [relatedDrawerOpen, setRelatedDrawerOpen] = useState(false);

  const token = useAppSelector((s) => s.auth.token);
  const user = useAppSelector((s) => s.auth.user);
  const cartItemCount = useAppSelector((s) => s.cart.itemCount);

  const addToCartMutation = useAddToCart();

  useEffect(() => {
    if (!token) router.replace("/login");
  }, [router, token]);

  const bookId = params.bookId;
  const bookQuery = useBookById({ id: bookId, enabled: Boolean(token) });
  const reviewsQuery = useBookReviewsInfinite({
    bookId,
    limit: 3,
    enabled: Boolean(token),
  });

  const profilePhotoSrc = useMemo(() => {
    const profilePhoto = user?.profilePhoto ?? null;
    if (!profilePhoto) return "/Home/Ellipse3.svg";
    if (profilePhoto.startsWith("http")) return profilePhoto;

    return `https://library-backend-production-b9cf.up.railway.app${profilePhoto.startsWith("/") ? "" : "/"}${profilePhoto}`;
  }, [user?.profilePhoto]);

  const book = bookQuery.data ?? null;
  const categoryName = book?.category?.name ?? "Category";
  const title = book?.title ?? "-";
  const authorName = book?.author?.name ?? "-";
  const ratingText =
    typeof book?.rating === "number" ? book.rating.toFixed(1) : "-";
  const reviewsText =
    typeof book?.reviewCount === "number"
      ? String(book.reviewCount)
      : Array.isArray(book?.reviews)
        ? String(book.reviews.length)
        : "-";
  const pageText =
    typeof book?.pages === "number"
      ? String(book.pages)
      : typeof book?.pageCount === "number"
        ? String(book.pageCount)
        : typeof book?.totalPages === "number"
          ? String(book.totalPages)
          : "-";

  const reviews = reviewsQuery.data?.pages.flatMap((p) => p.reviews) ?? [];
  const reviewsTotal =
    book?.reviewCount ?? reviewsQuery.data?.pages?.[0]?.pagination.total ?? 0;

  const handleAddToCart = async () => {
    if (!book?.id) return;

    try {
      await addToCartMutation.mutateAsync({ bookId: Number(book.id) });
      dispatch(incrementCartItemCount(1));
      toast("Added to cart");
      setBookMenuOpen(false);
    } catch (err) {
      toast(getErrorMessage(err));
    }
  };

  const relatedBooksQuery = useInfiniteQuery({
    queryKey: [
      "related-books",
      {
        bookId: book?.id ?? bookId,
        categoryId: book?.category?.id ?? null,
        authorId: book?.author?.id ?? null,
      },
    ],
    enabled: Boolean(token) && Boolean(book?.id) && Boolean(book?.category?.id),
    initialPageParam: {
      batchIndex: 0,
      categoryPage: 1,
      authorPage: 1,
      recommendPage: 1,
      seenIds: [] as number[],
    },
    queryFn: async ({ pageParam }) => {
      if (!book?.id || !book?.category?.id) {
        throw new Error("Missing book/category for related books");
      }

      const batchSize = 6;
      const minFirstBatch = pageParam.batchIndex === 0 ? 5 : 0;

      const excludeId = Number(book.id);
      const categoryId = String(book.category.id);
      const authorId = book.author?.id;

      const seen = new Set<number>(pageParam.seenIds);
      if (!Number.isNaN(excludeId)) seen.add(excludeId);

      const collected: Book[] = [];

      let categoryPage = pageParam.categoryPage;
      let authorPage = pageParam.authorPage;
      let recommendPage = pageParam.recommendPage;

      let categoryExhausted = categoryPage === 0;
      let authorExhausted = authorPage === 0;
      let recommendExhausted = recommendPage === 0;

      const pushUnique = (candidate: Book) => {
        if (collected.length >= batchSize) return;
        const id = Number(candidate.id);
        if (Number.isNaN(id)) return;
        if (seen.has(id)) return;
        seen.add(id);
        collected.push(candidate);
      };

      const takeFromCategory = async () => {
        if (categoryExhausted) return;
        const res = await getBooksApi({
          page: categoryPage,
          limit: batchSize,
          categoryId,
        });

        for (const b of res.books) {
          pushUnique(b);
          if (collected.length >= batchSize) break;
        }

        if (res.pagination.page >= res.pagination.totalPages) {
          categoryExhausted = true;
          categoryPage = 0;
        } else {
          categoryPage += 1;
        }
      };

      const takeFromAuthor = async () => {
        if (authorExhausted) return;
        if (authorId === undefined) {
          authorExhausted = true;
          authorPage = 0;
          return;
        }

        const res = await getBooksApi({
          page: authorPage,
          limit: batchSize,
        });

        for (const b of res.books) {
          if (b.author?.id !== authorId) continue;
          pushUnique(b);
          if (collected.length >= batchSize) break;
        }

        if (res.pagination.page >= res.pagination.totalPages) {
          authorExhausted = true;
          authorPage = 0;
        } else {
          authorPage += 1;
        }
      };

      const takeFromRecommend = async () => {
        if (recommendExhausted) return;
        const res = await getRecommendedBooksApi({
          page: recommendPage,
          limit: batchSize,
          by: "rating",
        });

        for (const b of res.books) {
          pushUnique(b);
          if (collected.length >= batchSize) break;
        }

        if (res.pagination.page >= res.pagination.totalPages) {
          recommendExhausted = true;
          recommendPage = 0;
        } else {
          recommendPage += 1;
        }
      };

      let safety = 0;
      while (
        (collected.length < batchSize || collected.length < minFirstBatch) &&
        safety < 20
      ) {
        safety += 1;
        const before = collected.length;

        if (!categoryExhausted && collected.length < batchSize) {
          await takeFromCategory();
        }

        if (
          collected.length < 4 &&
          !authorExhausted &&
          collected.length < batchSize
        ) {
          await takeFromAuthor();
        }

        if (
          (collected.length < minFirstBatch || collected.length < batchSize) &&
          !recommendExhausted &&
          collected.length < batchSize
        ) {
          await takeFromRecommend();
        }

        const after = collected.length;
        const noSourceLeft =
          categoryExhausted && authorExhausted && recommendExhausted;
        if (after === before && noSourceLeft) break;
        if (after === before && safety > 10) break;
      }

      const hasMore = !(
        categoryPage === 0 &&
        authorPage === 0 &&
        recommendPage === 0
      );

      return {
        books: collected,
        nextPageParam: hasMore
          ? {
              batchIndex: pageParam.batchIndex + 1,
              categoryPage,
              authorPage,
              recommendPage,
              seenIds: Array.from(seen),
            }
          : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPageParam,
  });

  const {
    fetchNextPage: fetchNextRelatedPage,
    hasNextPage: relatedHasNextPage,
    isFetchingNextPage: relatedIsFetchingNextPage,
  } = relatedBooksQuery;

  const relatedFirstBatch = (
    relatedBooksQuery.data?.pages?.[0]?.books ?? []
  ).slice(0, 6);
  const relatedDrawerBooks =
    relatedBooksQuery.data?.pages?.slice(1).flatMap((p) => p.books) ?? [];

  useEffect(() => {
    if (!relatedDrawerOpen) return;
    if (!relatedHasNextPage) return;
    if (relatedDrawerBooks.length > 0) return;
    if (relatedIsFetchingNextPage) return;

    fetchNextRelatedPage();
  }, [
    fetchNextRelatedPage,
    relatedDrawerBooks.length,
    relatedDrawerOpen,
    relatedHasNextPage,
    relatedIsFetchingNextPage,
  ]);

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
                  <Image src={profilePhotoSrc} alt="" fill sizes="40px" />
                </div>
              </button>
            </div>
          </header>
        </div>

        <main className="pt-2xl">
          <div className="text-text-xs font-medium tracking-[-0.02em]">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="text-primary-600"
            >
              Home
            </button>
            <span className="px-xs text-neutral-400">&gt;</span>
            <span className="text-neutral-600">Category</span>
            <span className="px-xs text-neutral-400">&gt;</span>
            <span className="text-neutral-600">{title}</span>
          </div>

          <div className="mt-xl overflow-hidden rounded-3xl border border-neutral-200 bg-base-white p-lg">
            {bookQuery.isLoading ? (
              <>
                <div className="mx-auto aspect-3/4 w-full max-w-72 rounded-2xl bg-neutral-100" />
                <div className="mt-lg h-6 w-40 rounded bg-neutral-100" />
                <div className="mt-md h-8 w-full rounded bg-neutral-100" />
                <div className="mt-sm h-5 w-48 rounded bg-neutral-100" />
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setBookMenuOpen(true)}
                  className="relative mx-auto aspect-3/4 w-full max-w-72 overflow-hidden rounded-2xl bg-neutral-100"
                  aria-label="Open book actions"
                >
                  {book?.coverImage ? (
                    <Image
                      src={book.coverImage}
                      alt={title}
                      fill
                      sizes="(max-width: 430px) 80vw, 288px"
                      className="object-cover"
                      unoptimized={book.coverImage.startsWith("data:")}
                    />
                  ) : null}
                </button>

                <div className="mt-lg">
                  <div className="inline-flex items-center rounded-full bg-neutral-100 px-lg py-xs text-text-xs font-semibold text-neutral-700">
                    {categoryName}
                  </div>

                  <h1 className="mt-md text-display-xs font-semibold tracking-[-0.02em] text-neutral-950">
                    {title}
                  </h1>

                  <Drawer open={bookMenuOpen} onOpenChange={setBookMenuOpen}>
                    <DrawerContent>
                      <DrawerHeader className="sr-only">
                        <DrawerTitle>Book Action</DrawerTitle>
                      </DrawerHeader>
                      <div className="px-xl pb-xl pt-lg">
                        <div className="flex gap-lg">
                          <button
                            type="button"
                            onClick={handleAddToCart}
                            disabled={addToCartMutation.isPending}
                            className="min-w-0 flex-1 rounded-full border border-neutral-300 bg-base-white py-sm text-text-sm font-semibold tracking-[-0.02em] text-neutral-950 disabled:opacity-50"
                          >
                            {addToCartMutation.isPending
                              ? "Loading..."
                              : "Add to Cart"}
                          </button>
                          <button
                            type="button"
                            onClick={() => toast("Borrow Book belum tersedia")}
                            className="min-w-0 flex-1 rounded-full bg-primary-600 py-sm text-text-sm font-semibold tracking-[-0.02em] text-neutral-25"
                          >
                            Borrow Book
                          </button>
                        </div>
                      </div>
                    </DrawerContent>
                  </Drawer>
                  <div className="mt-2xs text-text-sm text-neutral-500">
                    {authorName}
                  </div>

                  <div className="mt-md flex items-center gap-2xs">
                    <Image
                      src="/Home/Star.svg"
                      alt=""
                      width={16}
                      height={16}
                      className="h-4 w-4"
                    />
                    <span className="text-text-sm font-semibold text-neutral-950">
                      {ratingText}
                    </span>
                  </div>

                  <div className="mt-lg flex w-full items-stretch justify-between rounded-2xl border border-neutral-200 bg-base-white">
                    <StatItem value={pageText} label="Page" withDivider />
                    <StatItem value={ratingText} label="Rating" withDivider />
                    <StatItem value={reviewsText} label="Reviews" />
                  </div>

                  <div className="mt-3xl">
                    <h2 className="text-text-lg font-semibold tracking-[-0.02em] text-neutral-950">
                      Description
                    </h2>
                    <p className="mt-md text-text-sm leading-6 text-neutral-600">
                      {book?.description ?? "-"}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {bookQuery.isError ? (
            <div className="mt-lg rounded-2xl border border-neutral-100 bg-base-white p-4xl">
              <div className="text-text-sm font-semibold text-neutral-950">
                Failed to load book.
              </div>
              <button
                type="button"
                onClick={() => bookQuery.refetch()}
                className="mt-md h-10 rounded-full border border-neutral-300 bg-base-white px-4xl text-text-sm font-semibold tracking-[-0.02em] text-neutral-950"
              >
                Try again
              </button>
            </div>
          ) : null}

          <div
            className="mt-3xl h-px w-screen bg-neutral-200 relative left-1/2 -translate-x-1/2"
            aria-hidden="true"
          />

          <section className="mt-3xl">
            <h2 className="text-text-xl font-semibold tracking-[-0.02em] text-neutral-950">
              Review
            </h2>

            <div className="mt-sm flex items-center gap-2xs">
              <Image
                src="/Home/Star.svg"
                alt=""
                width={16}
                height={16}
                className="h-4 w-4"
              />
              <div className="text-text-sm font-semibold text-neutral-950">
                {ratingText}
              </div>
              <div className="text-text-sm text-neutral-600">
                ({reviewsTotal} Ulasan)
              </div>
            </div>

            <div className="mt-lg space-y-lg">
              {reviews.map((review) => {
                const star = clampStars(review.star);
                return (
                  <div
                    key={review.id}
                    className="rounded-2xl border border-neutral-100 bg-base-white p-lg"
                  >
                    <div className="flex gap-md">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-neutral-200">
                        <Image
                          src="/Home/Ellipse3.svg"
                          alt=""
                          fill
                          sizes="48px"
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="text-text-sm font-semibold tracking-[-0.02em] text-neutral-950">
                          {review.user?.name ?? "-"}
                        </div>
                        <div className="mt-2xs text-text-xs text-neutral-500">
                          {dayjs(review.createdAt).format("D MMMM YYYY, HH:mm")}
                        </div>
                      </div>
                    </div>

                    <div className="mt-md flex items-center gap-2xs">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Image
                          key={i}
                          src="/Home/Star.svg"
                          alt=""
                          width={16}
                          height={16}
                          className={`h-4 w-4 ${i < star ? "opacity-100" : "opacity-20"}`}
                        />
                      ))}
                    </div>

                    <p className="mt-md text-text-sm leading-6 text-neutral-600">
                      {review.comment || "-"}
                    </p>
                  </div>
                );
              })}

              {reviewsQuery.isLoading ? (
                <>
                  <div className="h-28 rounded-2xl border border-neutral-100 bg-base-white" />
                  <div className="h-28 rounded-2xl border border-neutral-100 bg-base-white" />
                  <div className="h-28 rounded-2xl border border-neutral-100 bg-base-white" />
                </>
              ) : null}

              {reviewsQuery.isError ? (
                <div className="rounded-2xl border border-neutral-100 bg-base-white p-4xl">
                  <div className="text-text-sm font-semibold text-neutral-950">
                    Failed to load reviews.
                  </div>
                  <button
                    type="button"
                    onClick={() => reviewsQuery.refetch()}
                    className="mt-md h-10 rounded-full border border-neutral-300 bg-base-white px-4xl text-text-sm font-semibold tracking-[-0.02em] text-neutral-950"
                  >
                    Try again
                  </button>
                </div>
              ) : null}
            </div>

            {reviewsQuery.hasNextPage ? (
              <div className="mt-3xl flex justify-center">
                <button
                  type="button"
                  disabled={reviewsQuery.isFetchingNextPage}
                  onClick={() => reviewsQuery.fetchNextPage()}
                  className="h-10 rounded-full border border-neutral-200 bg-base-white px-6 text-text-sm font-semibold tracking-[-0.02em] text-neutral-950 disabled:opacity-60"
                >
                  Load More
                </button>
              </div>
            ) : null}

            <div
              className="mt-3xl h-px w-screen bg-neutral-200 relative left-1/2 -translate-x-1/2"
              aria-hidden="true"
            />
          </section>

          <section className="mt-3xl">
            <h2 className="text-text-xl font-semibold tracking-[-0.02em] text-neutral-950">
              Related Books
            </h2>

            <div className="mt-lg grid grid-cols-2 gap-lg">
              {relatedFirstBatch.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => router.push(`/books/${b.id}`)}
                  className="overflow-hidden rounded-2xl border border-neutral-100 bg-base-white shadow-sm text-left"
                  aria-label={`View details for ${b.title ?? "book"}`}
                >
                  <div className="relative h-36 w-full bg-neutral-100">
                    {b.coverImage ? (
                      <Image
                        src={b.coverImage}
                        alt={b.title}
                        fill
                        sizes="(max-width: 430px) 50vw, 200px"
                        className="object-cover"
                        unoptimized={b.coverImage.startsWith("data:")}
                      />
                    ) : null}
                  </div>

                  <div className="p-md">
                    <div className="text-text-sm font-semibold tracking-[-0.02em] text-neutral-950 line-clamp-1">
                      {b.title ?? "-"}
                    </div>
                    <div className="mt-2xs text-text-xs text-neutral-500 line-clamp-1">
                      {b.author?.name ?? "-"}
                    </div>

                    <div className="mt-sm flex items-center gap-2xs">
                      <Image
                        src="/Home/Star.svg"
                        alt=""
                        width={16}
                        height={16}
                        className="h-4 w-4"
                      />
                      <span className="text-text-xs font-semibold text-neutral-700">
                        {typeof b.rating === "number"
                          ? b.rating.toFixed(1)
                          : "-"}
                      </span>
                    </div>
                  </div>
                </button>
              ))}

              {relatedBooksQuery.isLoading ? (
                <>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="overflow-hidden rounded-2xl border border-neutral-100 bg-base-white shadow-sm"
                    >
                      <div className="h-36 w-full bg-neutral-100" />
                      <div className="p-md">
                        <div className="h-4 w-4/5 rounded bg-neutral-100" />
                        <div className="mt-2xs h-3 w-2/3 rounded bg-neutral-100" />
                        <div className="mt-sm h-3 w-12 rounded bg-neutral-100" />
                      </div>
                    </div>
                  ))}
                </>
              ) : null}
            </div>

            {relatedBooksQuery.isError ? (
              <div className="mt-lg rounded-2xl border border-neutral-100 bg-base-white p-4xl">
                <div className="text-text-sm font-semibold text-neutral-950">
                  Failed to load related books.
                </div>
                <button
                  type="button"
                  onClick={() => relatedBooksQuery.refetch()}
                  className="mt-md h-10 rounded-full border border-neutral-300 bg-base-white px-4xl text-text-sm font-semibold tracking-[-0.02em] text-neutral-950"
                >
                  Try again
                </button>
              </div>
            ) : null}

            <Drawer
              open={relatedDrawerOpen}
              onOpenChange={setRelatedDrawerOpen}
            >
              {(relatedFirstBatch.length === 6 ||
                relatedDrawerBooks.length > 0 ||
                relatedHasNextPage) && (
                <div className="mt-3xl flex justify-center">
                  <DrawerTrigger asChild>
                    <button
                      type="button"
                      className="h-10 rounded-full border border-neutral-200 bg-base-white px-6 text-text-sm font-semibold tracking-[-0.02em] text-neutral-950"
                    >
                      Load More
                    </button>
                  </DrawerTrigger>
                </div>
              )}

              <DrawerContent>
                <DrawerHeader>
                  <div className="flex items-center justify-between">
                    <DrawerTitle>Related Books</DrawerTitle>
                    <DrawerClose asChild>
                      <button
                        type="button"
                        className="text-text-sm font-semibold text-neutral-600"
                      >
                        Close
                      </button>
                    </DrawerClose>
                  </div>
                </DrawerHeader>

                <div className="px-xl pb-xl overflow-auto">
                  <div className="grid grid-cols-2 gap-lg">
                    {relatedDrawerBooks.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          setRelatedDrawerOpen(false);
                          router.push(`/books/${b.id}`);
                        }}
                        className="overflow-hidden rounded-2xl border border-neutral-100 bg-base-white shadow-sm text-left"
                        aria-label={`View details for ${b.title ?? "book"}`}
                      >
                        <div className="relative h-36 w-full bg-neutral-100">
                          {b.coverImage ? (
                            <Image
                              src={b.coverImage}
                              alt={b.title}
                              fill
                              sizes="(max-width: 430px) 50vw, 200px"
                              className="object-cover"
                              unoptimized={b.coverImage.startsWith("data:")}
                            />
                          ) : null}
                        </div>

                        <div className="p-md">
                          <div className="text-text-sm font-semibold tracking-[-0.02em] text-neutral-950 line-clamp-1">
                            {b.title ?? "-"}
                          </div>
                          <div className="mt-2xs text-text-xs text-neutral-500 line-clamp-1">
                            {b.author?.name ?? "-"}
                          </div>

                          <div className="mt-sm flex items-center gap-2xs">
                            <Image
                              src="/Home/Star.svg"
                              alt=""
                              width={16}
                              height={16}
                              className="h-4 w-4"
                            />
                            <span className="text-text-xs font-semibold text-neutral-700">
                              {typeof b.rating === "number"
                                ? b.rating.toFixed(1)
                                : "-"}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}

                    {relatedBooksQuery.isFetchingNextPage ? (
                      <>
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div
                            key={i}
                            className="overflow-hidden rounded-2xl border border-neutral-100 bg-base-white shadow-sm"
                          >
                            <div className="h-36 w-full bg-neutral-100" />
                            <div className="p-md">
                              <div className="h-4 w-4/5 rounded bg-neutral-100" />
                              <div className="mt-2xs h-3 w-2/3 rounded bg-neutral-100" />
                              <div className="mt-sm h-3 w-12 rounded bg-neutral-100" />
                            </div>
                          </div>
                        ))}
                      </>
                    ) : null}
                  </div>

                  {relatedBooksQuery.hasNextPage ? (
                    <div className="mt-3xl flex justify-center">
                      <button
                        type="button"
                        disabled={relatedBooksQuery.isFetchingNextPage}
                        onClick={() => relatedBooksQuery.fetchNextPage()}
                        className="h-10 rounded-full border border-neutral-200 bg-base-white px-6 text-text-sm font-semibold tracking-[-0.02em] text-neutral-950 disabled:opacity-60"
                      >
                        Load More
                      </button>
                    </div>
                  ) : null}
                </div>
              </DrawerContent>
            </Drawer>
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
