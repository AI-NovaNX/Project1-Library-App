"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { CheckIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { setCartItemCount } from "@/features/cart/cartSlice";
import { type MyCart } from "@/features/cart/cartApi";
import { useMyCart, useRemoveCartItem } from "@/features/cart/cartHooks";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { PageHeader } from "@/components/Header";
import { cn } from "@/lib/utils";
import { useAuthedImageUrl } from "@/shared/lib/useAuthedImageUrl";
import { getErrorMessage } from "@/shared/api/errors";

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

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
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

function asKeyPart(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function toAbsoluteAssetUrl(src?: string | null): string | null {
  if (!src) return null;
  if (src.startsWith("data:")) return src;
  if (src.startsWith("blob:")) return src;
  if (src.startsWith("//")) return `https:${src}`;
  if (src.startsWith("http")) return src;
  const normalized = src.startsWith("/") ? src : `/${src}`;
  return `${BACKEND_BASE}${normalized}`;
}

function normalizeCartItems(cart: MyCart | undefined): NormalizedCartItem[] {
  const rawItems = Array.isArray(cart?.items) ? cart.items : [];

  return rawItems
    .map((raw, index): NormalizedCartItem | null => {
      if (!isRecord(raw)) return null;

      const book = isRecord(raw.book) ? raw.book : undefined;
      const author = book && isRecord(book.author) ? book.author : undefined;
      const category =
        book && isRecord(book.category) ? book.category : undefined;

      const bookId = asNumber(book?.id) ?? asNumber(raw.bookId);
      const rawId =
        asKeyPart(raw.id) ??
        asKeyPart(raw.cartItemId) ??
        asKeyPart((raw as Record<string, unknown>).itemId) ??
        asKeyPart((raw as Record<string, unknown>)._id);

      const itemId =
        asInteger(raw.id) ??
        asInteger(raw.cartItemId) ??
        asInteger((raw as Record<string, unknown>).itemId) ??
        asInteger((raw as Record<string, unknown>)._id);

      const key = rawId
        ? `cart-item:${rawId}`
        : bookId != null
          ? `book:${bookId}:${index}`
          : `item:${index}`;

      const title =
        asString(book?.title) ||
        asString(raw.title) ||
        (bookId ? `Book #${bookId}` : "Book");

      const authorName =
        asString(author?.name) || asString(raw.authorName) || "Author name";

      const categoryName =
        asString(category?.name) || asString(raw.categoryName) || "Category";

      const coverImage =
        asString(book?.coverImage) || asString(raw.coverImage) || null;

      return {
        key,
        itemId,
        bookId,
        title,
        authorName,
        categoryName,
        coverImage,
      };
    })
    .filter((v): v is NormalizedCartItem => Boolean(v));
}

function Checkbox({
  checked,
  onClick,
  ariaLabel,
}: {
  checked: boolean;
  onClick: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={checked}
      onClick={onClick}
      className={cn(
        "flex h-5 w-5 items-center justify-center rounded border",
        checked
          ? "border-primary-600 bg-primary-600"
          : "border-neutral-300 bg-base-white",
      )}
    >
      {checked ? <CheckIcon className="h-3.5 w-3.5 text-base-white" /> : null}
    </button>
  );
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

export default function CartPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const token = useAppSelector((s) => s.auth.token);
  const user = useAppSelector((s) => s.auth.user);
  const cartItemCount = useAppSelector((s) => s.cart.itemCount);

  useEffect(() => {
    if (!token) router.replace("/login");
  }, [router, token]);

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

  const myCartQuery = useMyCart({ enabled: Boolean(token) });
  const removeCartItemMutation = useRemoveCartItem();

  const items = useMemo(
    () => normalizeCartItems(myCartQuery.data),
    [myCartQuery.data],
  );

  const [selectedBookIdSet, setSelectedBookIdSet] = useState<Set<number>>(
    () => new Set(),
  );

  const [editMode, setEditMode] = useState(false);
  const [actionPending, setActionPending] = useState(false);
  const actionInFlightRef = useRef(false);

  const [borrowPending, setBorrowPending] = useState(false);
  const borrowInFlightRef = useRef(false);

  const selectedItemIds = useMemo(() => {
    if (selectedBookIdSet.size === 0) return [] as number[];
    const ids: number[] = [];
    items.forEach((it) => {
      if (typeof it.bookId !== "number") return;
      if (!selectedBookIdSet.has(it.bookId)) return;
      if (typeof it.itemId === "number" && Number.isFinite(it.itemId)) {
        ids.push(it.itemId);
      }
    });
    return Array.from(new Set(ids));
  }, [items, selectedBookIdSet]);

  const selectableItems = useMemo(
    () => items.filter((it) => typeof it.bookId === "number"),
    [items],
  );

  const allSelected =
    selectableItems.length > 0 &&
    selectableItems.every((it) => selectedBookIdSet.has(it.bookId!));

  const selectedCount = useMemo(() => {
    if (selectedBookIdSet.size === 0) return 0;
    let count = 0;
    selectableItems.forEach((it) => {
      if (selectedBookIdSet.has(it.bookId!)) count += 1;
    });
    return count;
  }, [selectableItems, selectedBookIdSet]);

  const selectedBookIds = useMemo(() => {
    const ids: number[] = [];
    selectableItems.forEach((it) => {
      const bookId = it.bookId!;
      if (selectedBookIdSet.has(bookId)) ids.push(bookId);
    });
    return Array.from(new Set(ids));
  }, [selectableItems, selectedBookIdSet]);

  useEffect(() => {
    const cart = myCartQuery.data;
    if (!cart) return;

    const count =
      typeof cart.itemCount === "number"
        ? cart.itemCount
        : Array.isArray(cart.items)
          ? cart.items.length
          : 0;
    dispatch(setCartItemCount(count));
  }, [dispatch, myCartQuery.data]);

  const handleDeleteSelected = async () => {
    if (actionInFlightRef.current) return;
    if (selectedItemIds.length === 0) {
      toast.error("Cart item tidak ditemukan. Silakan refresh cart.");
      return;
    }

    actionInFlightRef.current = true;
    setActionPending(true);
    try {
      const results = await Promise.allSettled(
        selectedItemIds.map((itemId) =>
          removeCartItemMutation.mutateAsync({ itemId }),
        ),
      );

      const failed = results.filter((r) => r.status === "rejected");
      if (failed.length > 0) {
        const firstErr =
          failed[0].status === "rejected" ? failed[0].reason : null;
        toast.error(getErrorMessage(firstErr));
      } else {
        toast.success("Item berhasil dihapus dari cart.");
      }

      setSelectedBookIdSet(new Set());
      await myCartQuery.refetch();
    } finally {
      setActionPending(false);
      actionInFlightRef.current = false;
    }
  };

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
            cartItemCount={cartItemCount}
            profilePhotoSrc={profilePhotoSrc}
            profileAlt=""
            avatarUnoptimized={avatarUnoptimized}
            onProfileClick={() => router.push("/profile")}
          />
        </div>

        <main className={cn("pt-2xl", selectedCount > 0 && "pb-11xl")}>
          <div className="flex items-center justify-between">
            <h1 className="text-display-sm font-bold tracking-[-0.02em] text-neutral-950">
              My Cart
            </h1>

            <button
              type="button"
              aria-label={editMode ? "Done" : "Delete item from my cart"}
              onClick={() => {
                setEditMode((prev) => !prev);
                setSelectedBookIdSet(new Set());
              }}
              className="inline-flex h-10 w-10 items-center justify-center text-neutral-950"
            >
              {editMode ? (
                <span className="text-text-sm font-semibold tracking-[-0.02em]">
                  Done
                </span>
              ) : (
                <Trash2Icon className="h-5 w-5" />
              )}
            </button>
          </div>

          <div className="mt-3xl">
            <div className="flex items-center gap-lg py-md">
              <Checkbox
                checked={allSelected}
                ariaLabel={allSelected ? "Unselect all" : "Select all"}
                onClick={() => {
                  setSelectedBookIdSet((prev) => {
                    const next = new Set<number>();
                    if (selectableItems.length === 0) return next;
                    if (prev.size !== selectableItems.length) {
                      selectableItems.forEach((it) => next.add(it.bookId!));
                    }
                    return next;
                  });
                }}
              />
              <span className="text-text-sm font-medium tracking-[-0.02em] text-neutral-950">
                Select All
              </span>
            </div>

            <div className="h-px w-full bg-neutral-200" />

            {myCartQuery.isLoading ? (
              <div className="space-y-lg py-lg">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-lg">
                    <div className="h-5 w-5 rounded bg-neutral-100" />
                    <div className="h-20 w-14 rounded-xl bg-neutral-100" />
                    <div className="flex-1">
                      <div className="h-6 w-24 rounded bg-neutral-100" />
                      <div className="mt-sm h-5 w-44 rounded bg-neutral-100" />
                      <div className="mt-sm h-4 w-28 rounded bg-neutral-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : myCartQuery.isError ? (
              <div className="py-4xl text-center text-text-sm font-medium tracking-[-0.02em] text-neutral-500">
                Unable to load cart. Please sign in again.
              </div>
            ) : items.length === 0 ? (
              <div className="py-4xl text-center text-text-sm font-medium tracking-[-0.02em] text-neutral-500">
                Your cart is empty.
              </div>
            ) : (
              <div>
                {items.map((item, idx) => {
                  const bookId = item.bookId;
                  const checked =
                    typeof bookId === "number" && selectedBookIdSet.has(bookId);
                  const coverSrc = toAbsoluteAssetUrl(item.coverImage);
                  const coverIsDataUrl = Boolean(coverSrc?.startsWith("data:"));

                  return (
                    <div key={item.key}>
                      <div className="flex items-start gap-lg py-lg">
                        <Checkbox
                          checked={checked}
                          ariaLabel={checked ? "Unselect item" : "Select item"}
                          onClick={() => {
                            if (typeof bookId !== "number") return;
                            setSelectedBookIdSet((prev) => {
                              const next = new Set(prev);
                              if (next.has(bookId)) next.delete(bookId);
                              else next.add(bookId);
                              return next;
                            });
                          }}
                        />

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
          </div>

          <Footer />
        </main>
      </div>

      {selectedCount > 0 ? (
        <Drawer
          defaultOpen
          direction="bottom"
          dismissible={false}
          modal={false}
          shouldScaleBackground={false}
        >
          <DrawerContent
            side="bottom"
            hideHandle
            hideOverlay
            overlayClassName="bg-black/0"
            className="px-0 mb-0 rounded-b-none border-x-0 border-t-0"
          >
            <DrawerHeader className="sr-only">
              <DrawerTitle>Borrow Book</DrawerTitle>
            </DrawerHeader>

            <div className="border-b border-neutral-200 bg-base-white">
              <div className="mx-auto flex w-full max-w-96 items-center justify-between gap-xl px-xl pb-xl pt-[calc(16px+env(safe-area-inset-top))]">
                <div>
                  <div className="text-text-xs font-medium tracking-[-0.02em] text-neutral-500">
                    Total Book
                  </div>
                  <div className="mt-xxs text-text-sm font-bold tracking-[-0.02em] text-neutral-950">
                    {selectedCount} Items
                  </div>
                </div>

                <button
                  type="button"
                  disabled={editMode ? actionPending : borrowPending}
                  onClick={async () => {
                    if (editMode) {
                      await handleDeleteSelected();
                      return;
                    }

                    if (borrowInFlightRef.current) return;

                    if (selectedBookIds.length === 0) {
                      toast.error("Pilih minimal 1 buku.");
                      return;
                    }

                    borrowInFlightRef.current = true;
                    setBorrowPending(true);
                    try {
                      // Store only selected items for Checkout.
                      if (typeof window !== "undefined") {
                        const selectedItems = items
                          .filter(
                            (it) =>
                              typeof it.bookId === "number" &&
                              selectedBookIdSet.has(it.bookId),
                          )
                          .map((it) => ({
                            key: it.key,
                            itemId: it.itemId ?? null,
                            bookId: it.bookId,
                            title: it.title,
                            authorName: it.authorName,
                            categoryName: it.categoryName,
                            coverImage: it.coverImage ?? null,
                          }));

                        window.sessionStorage.setItem(
                          "checkout:selectedItems",
                          JSON.stringify(selectedItems),
                        );
                      }
                      setSelectedBookIdSet(new Set());
                      router.push("/checkout");
                    } finally {
                      setBorrowPending(false);
                      borrowInFlightRef.current = false;
                    }
                  }}
                  className={cn(
                    "h-10 min-w-38 rounded-full px-4xl text-text-sm font-bold tracking-[-0.02em] text-base-white",
                    editMode ? "bg-accent-red" : "bg-primary-600",
                    (editMode ? actionPending : borrowPending) &&
                      "cursor-not-allowed opacity-60",
                  )}
                >
                  {editMode
                    ? actionPending
                      ? "Deleting..."
                      : "Delete"
                    : borrowPending
                      ? "Processing..."
                      : "Borrow Book"}
                </button>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      ) : null}
    </div>
  );
}
