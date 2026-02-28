"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { CheckIcon } from "lucide-react";
import { toast } from "sonner";

import { useAppDispatch } from "@/app/store/hooks";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import type { MyCart } from "@/features/cart/cartApi";
import { useMyCart } from "@/features/cart/cartHooks";
import { setCartItemCount } from "@/features/cart/cartSlice";

const BACKEND_BASE = "https://library-backend-production-b9cf.up.railway.app";

type NormalizedCartItem = {
  key: string;
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
  const rawItems = Array.isArray(cart?.items) ? cart?.items : [];

  return rawItems
    .map((raw, index): NormalizedCartItem | null => {
      if (!isRecord(raw)) return null;

      const book = isRecord(raw.book) ? raw.book : undefined;
      const author = book && isRecord(book.author) ? book.author : undefined;
      const category =
        book && isRecord(book.category) ? book.category : undefined;

      const bookId = asNumber(book?.id) ?? asNumber(raw.bookId);
      const key = String(raw.id ?? raw.cartItemId ?? bookId ?? index);

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

      return { key, bookId, title, authorName, categoryName, coverImage };
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

export function CartDrawer({
  children,
  onBeforeOpen,
}: {
  children: React.ReactNode;
  onBeforeOpen?: () => void;
}) {
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const myCartQuery = useMyCart({ enabled: open });

  const items = useMemo(
    () => normalizeCartItems(myCartQuery.data),
    [myCartQuery.data],
  );

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const [actionOpen, setActionOpen] = useState(false);

  const allSelected = items.length > 0 && selectedKeys.size === items.length;
  const selectedCount = selectedKeys.size;

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

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (next) {
          if (onBeforeOpen) onBeforeOpen();
          setSelectedKeys(new Set());
          setActionOpen(false);
          myCartQuery.refetch();
        }
        setOpen(next);
      }}
    >
      <DrawerTrigger asChild>{children}</DrawerTrigger>

      <DrawerContent className="px-xl">
        <div className="flex max-h-[85dvh] flex-col">
          <DrawerHeader className="px-0 pb-lg pt-xl text-left">
            <DrawerTitle className="text-display-sm font-bold tracking-[-0.02em] text-neutral-950">
              My Cart
            </DrawerTitle>
          </DrawerHeader>

          <div className="flex-1 overflow-auto pb-xl">
            <div className="flex items-center gap-lg py-md">
              <Checkbox
                checked={allSelected}
                ariaLabel={allSelected ? "Unselect all" : "Select all"}
                onClick={() => {
                  setSelectedKeys((prev) => {
                    const next = new Set<string>();
                    if (items.length === 0) {
                      setActionOpen(false);
                      return next;
                    }

                    if (prev.size !== items.length) {
                      items.forEach((it) => next.add(it.key));
                    }

                    setActionOpen(next.size > 0);
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
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-lg">
                    <div className="h-5 w-5 rounded bg-neutral-100" />
                    <div className="h-20 w-14 rounded-xl bg-neutral-100" />
                    <div className="flex-1">
                      <div className="h-6 w-20 rounded bg-neutral-100" />
                      <div className="mt-sm h-5 w-40 rounded bg-neutral-100" />
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
                  const checked = selectedKeys.has(item.key);
                  const coverSrc = toAbsoluteAssetUrl(item.coverImage);
                  const coverIsDataUrl = Boolean(coverSrc?.startsWith("data:"));

                  return (
                    <div key={item.key}>
                      <div className="flex items-start gap-lg py-lg">
                        <Checkbox
                          checked={checked}
                          ariaLabel={checked ? "Unselect item" : "Select item"}
                          onClick={() => {
                            setSelectedKeys((prev) => {
                              const next = new Set(prev);
                              if (next.has(item.key)) next.delete(item.key);
                              else next.add(item.key);
                              setActionOpen(next.size > 0);
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
        </div>
      </DrawerContent>

      <Drawer
        open={actionOpen}
        onOpenChange={(next) => {
          if (!next) {
            setActionOpen(false);
            setSelectedKeys(new Set());
          }
        }}
      >
        <DrawerContent className="px-xl">
          <DrawerHeader className="sr-only">
            <DrawerTitle>Borrow Book</DrawerTitle>
          </DrawerHeader>

          <DrawerFooter className="mt-0 flex flex-row items-center justify-between gap-lg border-t border-neutral-200 bg-base-white px-0 pb-xl pt-lg">
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
              onClick={() => {
                toast.info("Borrow Book belum tersedia.");
              }}
              className="h-11 rounded-full bg-primary-600 px-4xl text-text-sm font-bold tracking-[-0.02em] text-base-white"
            >
              Borrow Book
            </button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Drawer>
  );
}
