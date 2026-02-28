"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAppSelector } from "@/app/store/hooks";

export default function ProfilePlaceholderPage() {
  const router = useRouter();
  const token = useAppSelector((s) => s.auth.token);

  useEffect(() => {
    if (!token) router.replace("/login");
  }, [router, token]);

  return (
    <div className="min-h-dvh bg-background px-4 py-10">
      <div className="mx-auto w-full max-w-96">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">Profile</h1>
          <Button variant="outline" onClick={() => router.push("/")}>
            Back
          </Button>
        </div>

        <Card className="mt-6">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              The profile page will be sliced after the books list.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
