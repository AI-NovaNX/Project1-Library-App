"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { DesktopHeader, PageHeader } from "@/components/Header";
import { useAppSelector } from "@/app/store/hooks";
import { useAuthedImageUrl } from "@/shared/lib/useAuthedImageUrl";
import { useAuthorBooksInfinite } from "@/features/authors/authorsHooks";

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

export default function AuthorPage() {
  const router = useRouter();
  const params = useParams<{ authorId: string }>();

  const token = useAppSelector((s) => s.auth.token);
  const user = useAppSelector((s) => s.auth.user);
  const cartItemCount = useAppSelector((s) => s.cart.itemCount);

  const [desktopSearchValue, setDesktopSearchValue] = useState("");

  const authorIdRaw = params?.authorId;
  const authorId: string | number | undefined = useMemo(() => {
    if (!authorIdRaw) return undefined;
    const asNum = Number(authorIdRaw);
    return Number.isFinite(asNum) ? asNum : authorIdRaw;
  }, [authorIdRaw]);

  useEffect(() => {
    if (!token) router.replace("/login");
  }, [router, token]);

  const authorBooksQuery = useAuthorBooksInfinite({
    id: authorId,
    limit: 8,
    enabled: Boolean(token) && authorId !== undefined,
  });

  const pages = authorBooksQuery.data?.pages ?? [];
  const firstPage = pages[0] ?? null;
  const author = firstPage?.author ?? null;

  const rawAuthorAvatar =
    author?.photo ??
    author?.profilePhoto ??
    author?.avatar ??
    author?.image ??
    null;

  const authorAvatarSrc =
    typeof rawAuthorAvatar === "string" && rawAuthorAvatar.length > 0
      ? (toAbsoluteAssetUrl(rawAuthorAvatar) ?? "/Home/Ellipse3.svg")
      : "/Home/Ellipse3.svg";

  const authorAvatarUnoptimized =
    authorAvatarSrc.startsWith("data:") || authorAvatarSrc.startsWith("blob:");

  const books = pages.flatMap((p) => p.books ?? []);
  const totalBooksLabel =
    typeof author?.bookCount === "number"
      ? author.bookCount
      : (firstPage?.pagination?.total ?? books.length);

  const profilePhoto = user?.profilePhoto ?? null;
  const profilePhotoUrl = toAbsoluteAssetUrl(profilePhoto);

  const profilePhotoSrc = useAuthedImageUrl({
    url: profilePhotoUrl,
    token,
    fallbackUrl: "/Home/Ellipse3.svg",
  });

  const avatarUnoptimized =
    profilePhotoSrc.startsWith("data:") || profilePhotoSrc.startsWith("blob:");

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
    <div className="min-h-dvh bg-neutral-50">
      {/* Mobile layout (unchanged) */}
      <div className="md:hidden px-xl">
        <div className="mx-auto w-full max-w-96">
          <div className="sticky top-0 z-40 bg-neutral-50 pt-xl">
            <PageHeader
              onLogoClick={() => router.push("/")}
              onBagClick={() => router.push("/cart")}
              cartItemCount={cartItemCount}
              profilePhotoSrc={profilePhotoSrc}
              profileAlt={user?.name ? `${user.name} avatar` : "User avatar"}
              avatarUnoptimized={avatarUnoptimized}
              onProfileClick={() => router.push("/profile")}
            />
          </div>

          <main className="pt-3xl pb-16">
            <div className="rounded-3xl bg-base-white px-2xl py-2xl shadow-sm">
              <div className="flex items-center gap-lg">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-neutral-200">
                  <Image
                    src={authorAvatarSrc}
                    alt=""
                    fill
                    sizes="48px"
                    className="object-cover"
                    unoptimized={authorAvatarUnoptimized}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-text-sm font-semibold tracking-[-0.02em] text-neutral-950">
                    {author?.name ?? "Author name"}
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
                      {totalBooksLabel} books
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3xl text-display-xs font-bold tracking-[-0.02em] text-neutral-950">
              Book List
            </div>

            {authorBooksQuery.isLoading ? (
              <div className="mt-xl grid grid-cols-2 gap-xl">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <div key={idx} className="h-60 rounded-3xl bg-neutral-100" />
                ))}
              </div>
            ) : books.length === 0 ? (
              <div className="mt-xl rounded-3xl bg-base-white px-2xl py-3xl text-center text-text-sm font-semibold tracking-[-0.02em] text-neutral-500">
                No books found.
              </div>
            ) : (
              <>
                <div className="mt-xl grid grid-cols-2 gap-xl">
                  {books.map((book) => {
                    const cover =
                      toAbsoluteAssetUrl(book.coverImage) ?? "/Home/image4.svg";
                    const coverUnoptimized =
                      cover.startsWith("data:") || cover.startsWith("blob:");

                    const authorName = book.author?.name ?? "Author name";

                    return (
                      <button
                        key={String(book.id)}
                        type="button"
                        onClick={() => router.push(`/books/${book.id}`)}
                        className="overflow-hidden rounded-3xl bg-base-white text-left shadow-sm"
                      >
                        <div className="relative h-40 w-full bg-neutral-100">
                          <Image
                            src={cover}
                            alt={book.title}
                            fill
                            sizes="(max-width: 420px) 50vw, 200px"
                            className="object-cover"
                            unoptimized={coverUnoptimized}
                          />
                        </div>

                        <div className="p-lg">
                          <div className="truncate text-text-sm font-semibold tracking-[-0.02em] text-neutral-950">
                            {book.title || "Book Name"}
                          </div>
                          <div className="mt-2xs truncate text-text-xs font-medium text-neutral-600">
                            {authorName}
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

                {authorBooksQuery.hasNextPage ? (
                  <div className="mt-3xl flex justify-center">
                    <button
                      type="button"
                      onClick={() => authorBooksQuery.fetchNextPage()}
                      disabled={authorBooksQuery.isFetchingNextPage}
                      className="h-auto rounded-full border border-neutral-300 bg-base-white px-4xl py-sm text-text-sm font-semibold tracking-[-0.02em] text-neutral-950 disabled:opacity-50"
                    >
                      {authorBooksQuery.isFetchingNextPage
                        ? "Loading..."
                        : "Load More"}
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </main>

          <Footer />
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
              router.push(url);
            }}
            profilePhotoSrc={profilePhotoSrc}
            profileAlt={user?.name ? `${user.name} avatar` : "User"}
            avatarUnoptimized={avatarUnoptimized}
            userName={user?.name ?? "User"}
          />

          <main className="pb-6xl">
            <div className="rounded-2xl bg-base-white px-3xl py-xl shadow-sm">
              <div className="flex items-center gap-xl">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-neutral-200">
                  <Image
                    src={authorAvatarSrc}
                    alt=""
                    fill
                    sizes="48px"
                    className="object-cover"
                    unoptimized={authorAvatarUnoptimized}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-text-sm font-semibold tracking-[-0.02em] text-neutral-950">
                    {author?.name ?? "Author name"}
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
                      {totalBooksLabel} books
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5xl text-display-xs font-bold tracking-[-0.02em] text-neutral-950">
              Book List
            </div>

            {authorBooksQuery.isLoading ? (
              <div className="mt-4xl grid grid-cols-5 gap-xl">
                {Array.from({ length: 10 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="aspect-3/4 rounded-2xl bg-neutral-100"
                  />
                ))}
              </div>
            ) : books.length === 0 ? (
              <div className="mt-4xl rounded-2xl border border-neutral-100 bg-base-white p-4xl text-center text-text-sm font-semibold tracking-[-0.02em] text-neutral-500">
                No books found.
              </div>
            ) : (
              <>
                <div className="mt-4xl grid grid-cols-5 gap-xl">
                  {books.map((book) => {
                    const cover =
                      toAbsoluteAssetUrl(book.coverImage) ?? "/Home/image4.svg";
                    const coverUnoptimized =
                      cover.startsWith("data:") || cover.startsWith("blob:");

                    const authorName = book.author?.name ?? "Author name";

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
                            alt={book.title}
                            fill
                            sizes="(max-width: 1280px) 18vw, 220px"
                            className="object-cover"
                            unoptimized={coverUnoptimized}
                          />
                        </div>

                        <div className="p-lg">
                          <div className="truncate text-text-sm font-semibold tracking-[-0.02em] text-neutral-950">
                            {book.title || "Book Name"}
                          </div>
                          <div className="mt-2xs truncate text-text-xs font-medium text-neutral-600">
                            {authorName}
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

                {authorBooksQuery.hasNextPage ? (
                  <div className="mt-4xl flex justify-center">
                    <button
                      type="button"
                      onClick={() => authorBooksQuery.fetchNextPage()}
                      disabled={authorBooksQuery.isFetchingNextPage}
                      className="h-auto rounded-full border border-neutral-300 bg-base-white px-4xl py-sm text-text-sm font-semibold tracking-[-0.02em] text-neutral-950 disabled:opacity-50"
                    >
                      {authorBooksQuery.isFetchingNextPage
                        ? "Loading..."
                        : "Load More"}
                    </button>
                  </div>
                ) : null}
              </>
            )}

            <div className="mt-6xl border-t border-neutral-200" />
            <DesktopFooter />
          </main>
        </div>
      </div>
    </div>
  );
}
