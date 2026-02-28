"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppSelector } from "@/app/store/hooks";
import { useBooksInfinite } from "@/features/books/booksHooks";
import { useCategories } from "@/features/categories/categoriesHooks";
import { useDebounce } from "@/shared/lib/useDebounce";

function BookCardSkeleton() {
  return (
    <Card>
      <CardContent className="flex gap-3 p-4">
        <Skeleton className="h-16 w-12 rounded" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BooksPage() {
  const router = useRouter();
  const token = useAppSelector((s) => s.auth.token);

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    if (!token) router.replace("/login");
  }, [router, token]);

  const categoriesQuery = useCategories({ enabled: Boolean(token) });
  const booksQuery = useBooksInfinite({
    search: debouncedSearch.trim() || undefined,
    categoryId: categoryId === "all" ? undefined : categoryId,
    limit: 10,
    enabled: Boolean(token),
  });

  const books = useMemo(
    () => booksQuery.data?.pages.flatMap((p) => p.books) ?? [],
    [booksQuery.data?.pages],
  );

  if (!token) {
    return (
      <div className="min-h-dvh bg-background px-4 py-10">
        <div className="mx-auto w-full max-w-96">
          <Skeleton className="h-6 w-32" />
          <div className="mt-6 space-y-3">
            <BookCardSkeleton />
            <BookCardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background px-4 py-10">
      <div className="mx-auto w-full max-w-96">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Books</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Search and borrow books.
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push("/profile")}>
            Profile
          </Button>
        </div>

        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title..."
            />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={categoryId} onValueChange={(v) => setCategoryId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {(categoriesQuery.data ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {categoriesQuery.isError ? (
              <p className="text-xs text-destructive">
                Failed to load categories.
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {booksQuery.isLoading ? (
            <>
              <BookCardSkeleton />
              <BookCardSkeleton />
              <BookCardSkeleton />
            </>
          ) : null}

          {booksQuery.isError ? (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-destructive">
                  Failed to load books.
                </p>
                <Button
                  className="mt-3"
                  variant="outline"
                  onClick={() => booksQuery.refetch()}
                >
                  Try again
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {!booksQuery.isLoading &&
          !booksQuery.isError &&
          books.length === 0 ? (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">No books found.</p>
              </CardContent>
            </Card>
          ) : null}

          {books.map((b) => (
            <Card key={b.id}>
              <CardContent className="flex gap-3 p-4">
                <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded bg-muted">
                  {b.coverImage ? (
                    <Image
                      src={b.coverImage}
                      alt={b.title}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium leading-5">
                    {b.title}
                  </p>
                  <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                    {b.author?.name ?? "-"} • {b.category?.name ?? "-"}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">
                      Available: {b.availableCopies ?? 0}
                    </Badge>
                    <Badge variant="outline">
                      ⭐{" "}
                      {typeof b.rating === "number" ? b.rating.toFixed(1) : "-"}
                      {typeof b.reviewCount === "number"
                        ? ` (${b.reviewCount})`
                        : ""}
                    </Badge>
                  </div>
                </div>

                <Button
                  className="shrink-0"
                  variant="outline"
                  onClick={() => router.push(`/books/${b.id}`)}
                >
                  Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6">
          <Button
            className="w-full"
            variant="secondary"
            disabled={!booksQuery.hasNextPage || booksQuery.isFetchingNextPage}
            onClick={() => booksQuery.fetchNextPage()}
          >
            {booksQuery.isFetchingNextPage
              ? "Loading..."
              : booksQuery.hasNextPage
                ? "Load more"
                : "No more"}
          </Button>
        </div>
      </div>
    </div>
  );
}
