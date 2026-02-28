"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAppSelector } from "@/app/store/hooks";

export default function BookDetailPlaceholderPage() {
  const router = useRouter();
  const params = useParams<{ bookId: string }>();
  const token = useAppSelector((s) => s.auth.token);

  useEffect(() => {
    if (!token) router.replace("/login");
  }, [router, token]);

  return (
    <div className="min-h-dvh bg-background px-4 py-10">
      <div className="mx-auto w-full max-w-96">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">Book Details</h1>
          <Button variant="outline" onClick={() => router.push("/books")}>
            Back
          </Button>
        </div>

        <Card className="mt-6">
          <CardContent className="space-y-2 p-4">
            <p className="text-sm text-muted-foreground">
              ID: <span className="font-mono">{params.bookId}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              The details + reviews + borrow flow will be sliced next.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
