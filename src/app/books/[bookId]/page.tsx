"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

import { useAppSelector } from "@/app/store/hooks";
import { useBookById } from "@/features/books/booksHooks";

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

  const token = useAppSelector((s) => s.auth.token);
  const user = useAppSelector((s) => s.auth.user);

  useEffect(() => {
    if (!token) router.replace("/login");
  }, [router, token]);

  const bookId = params.bookId;
  const bookQuery = useBookById({ id: bookId, enabled: Boolean(token) });

  const profilePhotoSrc = useMemo(() => {
    const profilePhoto = user?.profilePhoto ?? null;
    if (!profilePhoto) return "/Home/Ellipse3.svg";
    if (profilePhoto.startsWith("http")) return profilePhoto;

    return `https://library-backend-production-b9cf.up.railway.app${profilePhoto.startsWith("/") ? "" : "/"}${profilePhoto}`;
  }, [user?.profilePhoto]);

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

  const book = bookQuery.data ?? null;
  const categoryName = book?.category?.name ?? "Category";
  const title = book?.title ?? "-";
  const authorName = book?.author?.name ?? "-";
  const ratingText =
    typeof book?.rating === "number" ? book.rating.toFixed(1) : "-";
  const reviewsText =
    typeof book?.reviewCount === "number"
      ? String(book.reviewCount)
      : Array.isArray((book as any)?.reviews)
        ? String(((book as any).reviews as unknown[]).length)
        : "-";
  const pageText =
    typeof (book as any)?.pages === "number"
      ? String((book as any).pages)
      : typeof (book as any)?.pageCount === "number"
        ? String((book as any).pageCount)
        : typeof (book as any)?.totalPages === "number"
          ? String((book as any).totalPages)
          : "-";

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

              <button type="button" aria-label="Bag" className="relative">
                <Image
                  src="/Home/Bag.svg"
                  alt=""
                  width={28}
                  height={28}
                  className="h-7 w-7"
                />
                <Image
                  src="/Home/Frame92.svg"
                  alt=""
                  width={20}
                  height={20}
                  className="absolute -right-2 -top-2 h-5 w-5"
                />
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
            <button
              type="button"
              onClick={() => router.push("/books")}
              className="text-primary-600"
            >
              Category
            </button>
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
                <div className="relative mx-auto aspect-3/4 w-full max-w-72 overflow-hidden rounded-2xl bg-neutral-100">
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
                </div>

                <div className="mt-lg">
                  <div className="inline-flex items-center rounded-full bg-neutral-100 px-lg py-xs text-text-xs font-semibold text-neutral-700">
                    {categoryName}
                  </div>

                  <h1 className="mt-md text-display-xs font-semibold tracking-[-0.02em] text-neutral-950">
                    {title}
                  </h1>
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
        </main>
      </div>
    </div>
  );
