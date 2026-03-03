"use client";

import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { type RefObject, useEffect, useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppDispatch } from "@/app/store/hooks";
import { clearAuth } from "@/features/auth/authSlice";

type PageHeaderProps = {
  onLogoClick: () => void;
  onSearchClick?: () => void;
  onBagClick?: () => void;
  onProfileClick?: () => void;
  cartItemCount: number;
  showBagBadge?: boolean;
  profilePhotoSrc: string;
  profileAlt?: string;
  avatarUnoptimized?: boolean;
};

export function PageHeader({
  onLogoClick,
  onSearchClick,
  onBagClick,
  onProfileClick,
  cartItemCount,
  showBagBadge = true,
  profilePhotoSrc,
  profileAlt = "",
  avatarUnoptimized = false,
}: PageHeaderProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();

  return (
    <header className="flex items-center justify-between">
      <button type="button" aria-label="Home" onClick={onLogoClick}>
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
          onClick={() => {
            if (onSearchClick) onSearchClick();
            else router.push("/book-list?openSearch=1");
          }}
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
          onClick={onBagClick}
        >
          <Image
            src="/Home/Bag.svg"
            alt=""
            width={28}
            height={28}
            className="h-7 w-7"
          />
          {showBagBadge && cartItemCount > 0 ? (
            <div className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-red px-1 text-[10px] font-bold text-base-white">
              {cartItemCount}
            </div>
          ) : null}
        </button>

        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Profile menu"
              className="flex items-center gap-sm"
            >
              <div className="relative h-10 w-10 overflow-hidden rounded-full bg-neutral-200">
                <Image
                  src={profilePhotoSrc}
                  alt={profileAlt}
                  fill
                  sizes="40px"
                  unoptimized={avatarUnoptimized}
                />
              </div>
              <ChevronDown aria-hidden className="hidden h-5 w-5 md:block" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            sideOffset={12}
            className="w-[calc(100vw-2rem)] max-w-96 rounded-2xl border border-neutral-200 bg-base-white p-xl shadow-md"
          >
            <div className="flex flex-col gap-xl">
              <DropdownMenuItem
                onSelect={() => {
                  if (onProfileClick) onProfileClick();
                  else router.push("/profile");
                }}
                className="px-0 py-0 text-text-sm font-semibold tracking-[-0.02em] text-neutral-950 focus:bg-transparent focus:text-neutral-950 data-highlighted:bg-transparent data-highlighted:text-neutral-950"
              >
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  router.push("/borrowed-list");
                }}
                className="px-0 py-0 text-text-sm font-semibold tracking-[-0.02em] text-neutral-950 focus:bg-transparent focus:text-neutral-950 data-highlighted:bg-transparent data-highlighted:text-neutral-950"
              >
                Borrowed List
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  router.push("/reviews");
                }}
                className="px-0 py-0 text-text-sm font-semibold tracking-[-0.02em] text-neutral-950 focus:bg-transparent focus:text-neutral-950 data-highlighted:bg-transparent data-highlighted:text-neutral-950"
              >
                Reviews
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  router.replace("/home");
                  requestAnimationFrame(() => {
                    dispatch(clearAuth());
                  });
                }}
                className="px-0 py-0 text-text-sm font-semibold tracking-[-0.02em] text-accent-red focus:bg-transparent focus:text-accent-red data-highlighted:bg-transparent data-highlighted:text-accent-red"
              >
                Logout
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

type HomeHeaderProps = {
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  searchValue: string;
  setSearchValue: (value: string) => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
  cartItemCount: number;
  showBagBadge?: boolean;
  isLoggedIn: boolean;
  profilePhotoSrc: string;
  profileAlt?: string;
  avatarUnoptimized?: boolean;
};

export function HomeHeader({
  isSearchOpen,
  setIsSearchOpen,
  searchValue,
  setSearchValue,
  searchInputRef,
  cartItemCount,
  showBagBadge = true,
  isLoggedIn,
  profilePhotoSrc,
  profileAlt = "User avatar",
  avatarUnoptimized = false,
}: HomeHeaderProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [pressedCta, setPressedCta] = useState<"login" | "register" | null>(
    null,
  );
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setHasMounted(true), 0);
    return () => window.clearTimeout(t);
  }, []);

  // Avoid hydration mismatch when auth state only becomes available on the client.
  const showLoggedIn = hasMounted && isLoggedIn;

  return (
    <header className="flex items-center justify-between">
      <div
        className={`${isSearchOpen ? "hidden md:flex" : "flex"} w-full items-center justify-between`}
      >
        <button
          type="button"
          aria-label="Home"
          onClick={() => {
            setIsMenuOpen(false);
            setPressedCta(null);
            setIsSearchOpen(false);
            setSearchValue("");
            router.push("/home");
          }}
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
            onClick={() => {
              setIsMenuOpen(false);
              setPressedCta(null);
              setIsSearchOpen(false);
              setSearchValue("");
              router.push("/book-list?openSearch=1");
            }}
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
            onClick={() => {
              setIsMenuOpen(false);
              setPressedCta(null);
              setIsSearchOpen(false);
              router.push("/cart");
            }}
          >
            <Image
              src="/Home/Bag.svg"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7"
            />
            {showBagBadge && cartItemCount > 0 ? (
              <div className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-red px-1 text-[10px] font-bold text-base-white">
                {cartItemCount}
              </div>
            ) : null}
          </button>

          {showLoggedIn ? (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Profile menu"
                  className="flex items-center gap-sm"
                >
                  <div className="relative h-10 w-10 overflow-hidden rounded-full bg-neutral-200">
                    <Image
                      src={profilePhotoSrc}
                      alt={profileAlt}
                      fill
                      sizes="40px"
                      unoptimized={avatarUnoptimized}
                    />
                  </div>
                  <ChevronDown
                    aria-hidden
                    className="hidden h-5 w-5 md:block"
                  />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                sideOffset={12}
                className="w-[calc(100vw-2rem)] max-w-96 rounded-2xl border border-neutral-200 bg-base-white p-xl shadow-md"
              >
                <div className="flex flex-col gap-xl">
                  <DropdownMenuItem
                    onSelect={() => router.push("/profile")}
                    className="px-0 py-0 text-text-sm font-semibold tracking-[-0.02em] text-neutral-950 focus:bg-transparent focus:text-neutral-950 data-highlighted:bg-transparent data-highlighted:text-neutral-950"
                  >
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      router.push("/borrowed-list");
                    }}
                    className="px-0 py-0 text-text-sm font-semibold tracking-[-0.02em] text-neutral-950 focus:bg-transparent focus:text-neutral-950 data-highlighted:bg-transparent data-highlighted:text-neutral-950"
                  >
                    Borrowed List
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      router.push("/reviews");
                    }}
                    className="px-0 py-0 text-text-sm font-semibold tracking-[-0.02em] text-neutral-950 focus:bg-transparent focus:text-neutral-950 data-highlighted:bg-transparent data-highlighted:text-neutral-950"
                  >
                    Reviews
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      router.replace("/home");
                      requestAnimationFrame(() => {
                        dispatch(clearAuth());
                      });
                    }}
                    className="px-0 py-0 text-text-sm font-semibold tracking-[-0.02em] text-accent-red focus:bg-transparent focus:text-accent-red data-highlighted:bg-transparent data-highlighted:text-accent-red"
                  >
                    Logout
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <DropdownMenu
              modal={false}
              open={isMenuOpen}
              onOpenChange={(open) => {
                setIsMenuOpen(open);
                if (!open) setPressedCta(null);
              }}
            >
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Menu"
                  aria-expanded={isMenuOpen}
                  className="shrink-0"
                >
                  <Image
                    src="/Home/Menu.svg"
                    alt=""
                    width={24}
                    height={24}
                    className="h-6 w-6"
                  />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                sideOffset={0}
                className="hidden"
              >
                <div className="hidden" />
              </DropdownMenuContent>

              {isMenuOpen ? (
                <div className="fixed bottom-0 left-0 right-0 top-15 z-30 flex w-screen flex-col">
                  <div className="shrink-0 min-h-90.25 bg-neutral-50 px-xl py-lg">
                    <div className="flex w-full gap-3.5">
                      <button
                        type="button"
                        onClick={() => {
                          setPressedCta("login");
                          requestAnimationFrame(() => {
                            router.push("/login");
                          });
                        }}
                        className={`min-w-0 flex-1 basis-0 rounded-full border border-neutral-300 bg-base-white py-sm font-sans text-text-md font-bold tracking-[-0.02em] text-neutral-950 transition-colors hover:border-primary-600 hover:bg-primary-600 hover:text-neutral-25 focus:border-primary-600 focus:bg-primary-600 focus:text-neutral-25 active:border-primary-600 active:bg-primary-600 active:text-neutral-25 ${pressedCta === "login" ? "border-primary-600 bg-primary-600 text-neutral-25" : ""}`}
                      >
                        Login
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPressedCta("register");
                          requestAnimationFrame(() => {
                            router.push("/register");
                          });
                        }}
                        className={`min-w-0 flex-1 basis-0 rounded-full border border-neutral-300 bg-base-white py-sm font-sans text-text-md font-bold tracking-[-0.02em] text-neutral-950 transition-colors hover:border-primary-600 hover:bg-primary-600 hover:text-neutral-25 focus:border-primary-600 focus:bg-primary-600 focus:text-neutral-25 active:border-primary-600 active:bg-primary-600 active:text-neutral-25 ${pressedCta === "register" ? "border-primary-600 bg-primary-600 text-neutral-25" : ""}`}
                      >
                        Register
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-label="Close menu overlay"
                    onClick={() => {
                      setPressedCta(null);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex-1 bg-transparent"
                  />
                </div>
              ) : null}
            </DropdownMenu>
          )}
        </div>
      </div>

      {isSearchOpen ? (
        <div className="flex w-full items-center gap-lg md:hidden">
          <button
            type="button"
            aria-label="Home"
            onClick={() => {
              setIsMenuOpen(false);
              setPressedCta(null);
              setIsSearchOpen(false);
              setSearchValue("");
              router.push("/home");
            }}
            className="shrink-0"
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

          <div className="relative flex-1">
            <Image
              src="/Home/SearchMute.svg"
              alt=""
              width={16}
              height={16}
              className="pointer-events-none absolute left-lg top-1/2 h-4 w-4 -translate-y-1/2"
            />
            <input
              ref={searchInputRef}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                const q = searchValue.trim();
                const url = q
                  ? `/book-list?q=${encodeURIComponent(q)}`
                  : "/book-list";

                setIsSearchOpen(false);
                setSearchValue("");
                router.push(url);
              }}
              placeholder="Search book"
              className="h-10 w-full rounded-full border border-neutral-300 bg-base-white pl-4xl pr-xl text-text-sm font-medium text-neutral-950 placeholder:text-neutral-400 focus:outline-none"
            />
          </div>

          <button
            type="button"
            aria-label="Close search"
            onClick={() => {
              setIsSearchOpen(false);
              setSearchValue("");
            }}
            className="shrink-0"
          >
            <Image
              src="/Home/IconX.svg"
              alt=""
              width={16}
              height={16}
              className="h-4 w-4"
            />
          </button>
        </div>
      ) : null}
    </header>
  );
}

type DesktopHeaderProps = {
  onLogoClick: () => void;
  onBagClick?: () => void;
  cartItemCount: number;
  showBagBadge?: boolean;
  showSearch?: boolean;
  searchValue?: string;
  onSearchValueChange?: (value: string) => void;
  onSearchSubmit?: (value: string) => void;
  searchPlaceholder?: string;
  profilePhotoSrc: string;
  profileAlt?: string;
  avatarUnoptimized?: boolean;
  userName?: string;
};

export function DesktopHeader({
  onLogoClick,
  onBagClick,
  cartItemCount,
  showBagBadge = true,
  showSearch = true,
  searchValue = "",
  onSearchValueChange,
  onSearchSubmit,
  searchPlaceholder = "Search book",
  profilePhotoSrc,
  profileAlt = "User",
  avatarUnoptimized = false,
  userName = "User",
}: DesktopHeaderProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();

  return (
    <header className="sticky top-0 z-40 bg-neutral-50 py-4xl">
      <div className="flex items-center gap-4xl">
        <button
          type="button"
          aria-label="Home"
          onClick={onLogoClick}
          className="flex items-center gap-lg"
        >
          <Image
            src="/Login-Page/Logo.svg"
            alt="Booky logo"
            width={40}
            height={40}
            className="h-10 w-10"
            priority
          />
          <span className="font-sans text-text-xl font-bold tracking-[-0.02em] text-neutral-950">
            Booky
          </span>
        </button>

        <div className="flex flex-1 items-center justify-between gap-4xl">
          {showSearch ? (
            <div className="relative w-full max-w-128">
              <Image
                src="/Home/SearchMute.svg"
                alt=""
                width={16}
                height={16}
                className="pointer-events-none absolute left-lg top-1/2 h-4 w-4 -translate-y-1/2"
              />
              <input
                value={searchValue}
                onChange={(e) => onSearchValueChange?.(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  const q = searchValue.trim();
                  if (onSearchSubmit) {
                    onSearchSubmit(q);
                    return;
                  }
                  const url = q
                    ? `/book-list?q=${encodeURIComponent(q)}`
                    : "/book-list";
                  router.push(url);
                }}
                placeholder={searchPlaceholder}
                className="h-10 w-full rounded-full border border-neutral-300 bg-base-white pl-4xl pr-xl text-text-sm font-medium text-neutral-950 placeholder:text-neutral-400 focus:outline-none"
              />
            </div>
          ) : (
            <div />
          )}

          <div className="flex shrink-0 items-center gap-xl">
            <button
              type="button"
              aria-label="Bag"
              className="relative"
              onClick={onBagClick}
            >
              <Image
                src="/Home/Bag.svg"
                alt=""
                width={28}
                height={28}
                className="h-7 w-7"
              />
              {showBagBadge && cartItemCount > 0 ? (
                <div className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-red px-1 text-[10px] font-bold text-base-white">
                  {cartItemCount}
                </div>
              ) : null}
            </button>

            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Profile menu"
                  className="flex items-center gap-md"
                >
                  <div className="relative h-10 w-10 overflow-hidden rounded-full bg-neutral-200">
                    <Image
                      src={profilePhotoSrc}
                      alt={profileAlt}
                      fill
                      sizes="40px"
                      unoptimized={avatarUnoptimized}
                    />
                  </div>
                  <span className="text-text-sm font-semibold tracking-[-0.02em] text-neutral-950">
                    {userName}
                  </span>
                  <ChevronDown aria-hidden className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                sideOffset={12}
                className="w-56 rounded-2xl border border-neutral-200 bg-base-white p-xl shadow-md"
              >
                <div className="flex flex-col gap-xl">
                  <DropdownMenuItem
                    onSelect={() => router.push("/profile")}
                    className="px-0 py-0 text-text-sm font-semibold tracking-[-0.02em] text-neutral-950 focus:bg-transparent focus:text-neutral-950 data-highlighted:bg-transparent data-highlighted:text-neutral-950"
                  >
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => router.push("/borrowed-list")}
                    className="px-0 py-0 text-text-sm font-semibold tracking-[-0.02em] text-neutral-950 focus:bg-transparent focus:text-neutral-950 data-highlighted:bg-transparent data-highlighted:text-neutral-950"
                  >
                    Borrowed List
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => router.push("/reviews")}
                    className="px-0 py-0 text-text-sm font-semibold tracking-[-0.02em] text-neutral-950 focus:bg-transparent focus:text-neutral-950 data-highlighted:bg-transparent data-highlighted:text-neutral-950"
                  >
                    Reviews
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      router.replace("/home");
                      requestAnimationFrame(() => {
                        dispatch(clearAuth());
                      });
                    }}
                    className="px-0 py-0 text-text-sm font-semibold tracking-[-0.02em] text-accent-red focus:bg-transparent focus:text-accent-red data-highlighted:bg-transparent data-highlighted:text-accent-red"
                  >
                    Logout
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
