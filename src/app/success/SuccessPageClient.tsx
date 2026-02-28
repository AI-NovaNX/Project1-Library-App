"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { useAppSelector } from "@/app/store/hooks";
import { meApiWithToken } from "@/features/auth/authApi";
import { useAuthedImageUrl } from "@/shared/lib/useAuthedImageUrl";

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

export default function SuccessPageClient({ returnBy }: { returnBy: string }) {
  const router = useRouter();

  const token = useAppSelector((s) => s.auth.token);
  const user = useAppSelector((s) => s.auth.user);
  const cartItemCount = useAppSelector((s) => s.cart.itemCount);

  const meQuery = useQuery({
    queryKey: ["me", token],
    queryFn: () => meApiWithToken(token),
    enabled: Boolean(token),
  });

  const meUser = meQuery.data ?? user ?? null;

  useEffect(() => {
    if (!token) router.replace("/login");
  }, [router, token]);

  const profilePhoto = meUser?.profilePhoto ?? null;
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
                  <Image
                    src={profilePhotoSrc}
                    alt={meUser?.name ? `${meUser.name} avatar` : "User avatar"}
                    fill
                    sizes="40px"
                    unoptimized={avatarUnoptimized}
                  />
                </div>
              </button>
            </div>
          </header>
        </div>

        <main className="pt-7xl">
          <div className="flex flex-col items-center">
            <div className="relative flex h-28 w-28 items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-neutral-200" />
              <div className="absolute inset-3 rounded-full border border-neutral-200" />
              <div className="absolute inset-6 rounded-full border border-neutral-200" />
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-600">
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M20 6L9 17L4 12"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            <div className="mt-4xl text-center">
              <div className="text-text-lg font-bold tracking-[-0.02em] text-neutral-950">
                Borrowing Successful!
              </div>

              <div className="mt-lg text-text-xs font-medium tracking-[-0.02em] text-neutral-500">
                Your book has been successfully borrowed.
              </div>

              <div className="mt-xs text-text-xs font-medium tracking-[-0.02em] text-neutral-500">
                Please return it by{" "}
                <span className="font-bold text-accent-red">{returnBy}</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  // Borrowed List page is not implemented yet in this project.
                  router.push("/home");
                }}
                className="mt-4xl h-11 w-full rounded-full bg-primary-600 px-4xl text-text-sm font-bold tracking-[-0.02em] text-base-white"
              >
                See Borrowed List
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
