"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useAppSelector } from "@/app/store/hooks";
import { DesktopHeader, PageHeader } from "@/components/Header";
import { meApiWithToken } from "@/features/auth/authApi";
import { useAuthedImageUrl } from "@/shared/lib/useAuthedImageUrl";

const BACKEND_BASE = "https://library-backend-production-b9cf.up.railway.app";

function toAbsoluteAssetUrl(src?: string | null): string | null {
  if (!src) return null;
  const value = src.trim();
  if (!value) return null;
  // Sometimes backend may return data/blob URLs with a leading slash.
  if (value.startsWith("/data:")) return value.slice(1);
  if (value.startsWith("/blob:")) return value.slice(1);
  if (value.startsWith("data:")) return value;
  if (value.startsWith("blob:")) return value;
  if (value.startsWith("//")) return `https:${value}`;
  if (value.startsWith("http")) return value;
  const normalized = value.startsWith("/") ? value : `/${value}`;
  return `${BACKEND_BASE}${normalized}`;
}

function InfoRow(props: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-xl py-md text-text-xs font-medium tracking-[-0.02em]">
      <div className="text-neutral-500">{props.label}</div>
      <div className="font-bold text-neutral-950">{props.value}</div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="px-xl pb-6xl">
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

      <p className="mx-auto mt-lg w-full max-w-160 text-text-sm font-medium leading-6 text-neutral-600">
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

export default function ProfilePage() {
  const router = useRouter();

  const [desktopSearchValue, setDesktopSearchValue] = useState("");

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

  const profilePhotoUrl = toAbsoluteAssetUrl(meUser?.profilePhoto ?? null);

  const profilePhotoSrc = useAuthedImageUrl({
    url: profilePhotoUrl,
    token,
    fallbackUrl: "/Home/Ellipse3.svg",
  });

  const avatarUnoptimized =
    profilePhotoSrc.startsWith("data:") || profilePhotoSrc.startsWith("blob:");

  if (!token) {
    return (
      <div className="min-h-dvh bg-neutral-50">
        <div className="md:hidden px-xl">
          <div className="mx-auto w-full max-w-96 pt-xl">
            <div className="h-10 w-40 rounded-xl bg-neutral-100" />
            <div className="mt-3xl h-64 rounded-3xl bg-neutral-100" />
          </div>
        </div>

        <div className="hidden md:block px-6xl">
          <div className="mx-auto w-full max-w-300 pt-6xl">
            <div className="h-12 w-64 rounded-xl bg-neutral-100" />
            <div className="mt-4xl h-80 rounded-3xl bg-neutral-100" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-neutral-50">
      {/* Mobile layout (default) */}
      <div className="md:hidden px-xl">
        <div className="mx-auto w-full max-w-96">
          <div className="sticky top-0 z-40 bg-neutral-50 pt-xl">
            <PageHeader
              onLogoClick={() => router.push("/")}
              onSearchClick={() => router.push("/book-list?openSearch=1")}
              onBagClick={() => router.push("/cart")}
              cartItemCount={cartItemCount}
              profilePhotoSrc={profilePhotoSrc}
              profileAlt={
                meUser?.name ? `${meUser.name} avatar` : "User avatar"
              }
              avatarUnoptimized={avatarUnoptimized}
              onProfileClick={() => router.push("/profile")}
            />
          </div>

          <main className="pt-2xl">
            <div className="rounded-full bg-neutral-100 p-2xs">
              <div className="flex items-center">
                <button
                  type="button"
                  aria-current="page"
                  className="flex-1 rounded-full bg-base-white px-lg py-sm text-text-sm font-semibold tracking-[-0.02em] text-neutral-950"
                >
                  Profile
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/borrowed-list")}
                  className="flex-1 rounded-full px-lg py-sm text-text-sm font-medium tracking-[-0.02em] text-neutral-500"
                >
                  Borrowed List
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/reviews")}
                  className="flex-1 rounded-full px-lg py-sm text-text-sm font-medium tracking-[-0.02em] text-neutral-500"
                >
                  Reviews
                </button>
              </div>
            </div>

            <h1 className="mt-4xl text-display-sm font-bold tracking-[-0.02em] text-neutral-950">
              Profile
            </h1>

            <section className="mt-3xl overflow-hidden rounded-3xl border border-neutral-200 bg-base-white p-lg">
              <div className="flex items-center gap-lg">
                <div className="relative h-16 w-16 overflow-hidden rounded-full bg-neutral-200">
                  <Image
                    src={profilePhotoSrc}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                    unoptimized={avatarUnoptimized}
                  />
                </div>
              </div>

              <div className="mt-xl">
                <InfoRow
                  label="Name"
                  value={
                    meQuery.isLoading ? "Loading..." : (meUser?.name ?? "-")
                  }
                />
                <InfoRow
                  label="Email"
                  value={
                    meQuery.isLoading ? "Loading..." : (meUser?.email ?? "-")
                  }
                />
                <InfoRow
                  label="Nomor Handphone"
                  value={
                    meQuery.isLoading
                      ? "Loading..."
                      : meUser?.phone
                        ? String(meUser.phone)
                        : "-"
                  }
                />
              </div>

              <button
                type="button"
                className="mt-xl h-12 w-full rounded-full bg-primary-600 px-4xl text-text-sm font-bold tracking-[-0.02em] text-base-white"
              >
                Update Profile
              </button>
            </section>

            <div
              className="mt-7xl h-px w-screen bg-neutral-200 relative left-1/2 -translate-x-1/2"
              aria-hidden="true"
            />

            <div className="pt-6xl">
              <Footer />
            </div>
          </main>
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
              setDesktopSearchValue("");
              router.push(url);
            }}
            profilePhotoSrc={profilePhotoSrc}
            profileAlt={meUser?.name ? `${meUser.name} avatar` : "User"}
            avatarUnoptimized={avatarUnoptimized}
            userName={meUser?.name ?? "User"}
          />

          <div className="mt-2xl flex justify-center">
            <div className="w-full max-w-120 rounded-full bg-neutral-100 p-xs">
              <div className="grid grid-cols-3 gap-xs">
                <button
                  type="button"
                  className="h-9 rounded-full bg-base-white text-text-xs font-semibold tracking-[-0.02em] text-neutral-950"
                  aria-current="page"
                >
                  Profile
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/borrowed-list")}
                  className="h-9 rounded-full text-text-xs font-semibold tracking-[-0.02em] text-neutral-500"
                >
                  Borrowed List
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/reviews")}
                  className="h-9 rounded-full text-text-xs font-semibold tracking-[-0.02em] text-neutral-500"
                >
                  Reviews
                </button>
              </div>
            </div>
          </div>

          <main className="pt-4xl pb-6xl">
            <h1 className="text-display-sm font-bold tracking-[-0.02em] text-neutral-950">
              Profile
            </h1>

            <section className="mt-3xl w-full max-w-160 rounded-3xl border border-neutral-200 bg-base-white px-4xl py-3xl shadow-sm">
              <div className="flex items-center gap-lg">
                <div className="relative h-16 w-16 overflow-hidden rounded-full bg-neutral-200">
                  <Image
                    src={profilePhotoSrc}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                    unoptimized={avatarUnoptimized}
                  />
                </div>
              </div>

              <div className="mt-2xl">
                <InfoRow
                  label="Name"
                  value={
                    meQuery.isLoading ? "Loading..." : (meUser?.name ?? "-")
                  }
                />
                <InfoRow
                  label="Email"
                  value={
                    meQuery.isLoading ? "Loading..." : (meUser?.email ?? "-")
                  }
                />
                <InfoRow
                  label="Nomor Handphone"
                  value={
                    meQuery.isLoading
                      ? "Loading..."
                      : meUser?.phone
                        ? String(meUser.phone)
                        : "-"
                  }
                />
              </div>

              <button
                type="button"
                className="mt-2xl h-11 w-full rounded-full bg-primary-600 px-4xl text-text-sm font-bold tracking-[-0.02em] text-base-white"
              >
                Update Profile
              </button>
            </section>

            <div className="mt-7xl h-px w-full bg-neutral-200" aria-hidden />
            <DesktopFooter />
          </main>
        </div>
      </div>
    </div>
  );
}
