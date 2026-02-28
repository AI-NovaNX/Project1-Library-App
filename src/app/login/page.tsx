"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin } from "@/features/auth/authHooks";

export default function LoginPage() {
  const router = useRouter();
  const login = useLogin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const emailError = attemptedSubmit && !email ? "Email is required." : "";
  const passwordError =
    attemptedSubmit && !password ? "Password is required." : "";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    setAttemptedSubmit(true);

    if (!email || !password) {
      return;
    }

    try {
      await login.mutateAsync({ email, password });
      toast.success("Signed in successfully.");
      router.replace("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign-in failed.";
      toast.error(message);
    }
  }

  return (
    <div className="min-h-dvh bg-background px-4xl pt-6xl">
      <div className="mx-auto w-full max-w-96">
        <div className="flex items-center gap-lg">
          <Image
            src="/Login-Page/Logo.svg"
            alt="Booky logo"
            width={33}
            height={33}
            className="h-8.25 w-8.25"
            priority
          />
          <div className="font-sans text-[25.14px] font-bold leading-8.25 tracking-normal text-neutral-950 md:font-display">
            Booky
          </div>
        </div>

        <div className="mt-5">
          <h1 className="font-sans text-display-xs font-bold tracking-normal text-neutral-950 md:font-display md:text-[28px] md:leading-9.5 md:tracking-[-0.02em] md:text-neutral-950">
            Login
          </h1>
          <p className="mt-sm text-text-sm font-semibold tracking-[-0.02em] text-neutral-700 md:font-sans md:text-[16px] md:leading-7.5 md:font-semibold md:tracking-[-0.02em] md:text-neutral-700">
            Sign in to manage your library account.
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-5">
          <div className="space-y-4xl">
            <div className="space-y-md">
              <Label
                className="text-text-sm font-bold tracking-[-0.02em] text-neutral-950 md:font-sans md:text-[14px] md:leading-7 md:font-bold md:tracking-[-0.02em] md:text-neutral-950"
                htmlFor="email"
              >
                Email
              </Label>
              <div
                className={`flex w-full aspect-324/48 items-center gap-md rounded-xl border bg-base-white px-xl py-md ${
                  emailError
                    ? "border-helper focus-within:border-helper"
                    : "border-neutral-300 focus-within:border-primary-600"
                }`}
              >
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  aria-describedby={emailError ? "email-help" : undefined}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-auto flex-1 border-0 bg-transparent p-0 text-text-md shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 md:font-sans md:text-[16px] md:leading-7.5 md:font-semibold md:tracking-[-0.02em] md:text-neutral-950"
                />
              </div>
              {emailError ? (
                <p
                  id="email-help"
                  className="text-helper text-[12px] leading-6 font-semibold tracking-[-0.02em] md:font-sans md:text-[14px] md:leading-7 md:font-medium md:tracking-[-0.03em]"
                >
                  {emailError}
                </p>
              ) : null}
            </div>

            <div className="space-y-md">
              <Label
                className="text-text-sm font-bold tracking-[-0.02em] text-neutral-950 md:font-sans md:text-[14px] md:leading-7 md:font-bold md:tracking-[-0.02em] md:text-neutral-950"
                htmlFor="password"
              >
                Password
              </Label>
              <div
                className={`flex w-full aspect-324/48 items-center gap-md rounded-xl border bg-base-white px-xl py-md ${
                  passwordError
                    ? "border-helper focus-within:border-helper"
                    : "border-neutral-300 focus-within:border-primary-600"
                }`}
              >
                <Input
                  id="password"
                  type={isPasswordVisible ? "text" : "password"}
                  autoComplete="current-password"
                  aria-describedby={passwordError ? "password-help" : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-auto flex-1 border-0 bg-transparent p-0 text-text-md shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 md:font-sans md:text-[16px] md:leading-7.5 md:font-semibold md:tracking-[-0.02em] md:text-neutral-950"
                />
                <button
                  type="button"
                  onClick={() => setIsPasswordVisible((v) => !v)}
                  className="text-neutral-900"
                  aria-label={
                    isPasswordVisible ? "Hide password" : "Show password"
                  }
                >
                  {isPasswordVisible ? (
                    <Image
                      src="/Login-Page/eye.svg"
                      alt=""
                      width={20}
                      height={20}
                      className="h-5 w-5"
                    />
                  ) : (
                    <Image
                      src="/Login-Page/eye-off.svg"
                      alt=""
                      width={20}
                      height={20}
                      className="h-5 w-5"
                    />
                  )}
                </button>
              </div>
              {passwordError ? (
                <p
                  id="password-help"
                  className="text-helper text-[12px] leading-6 font-semibold tracking-[-0.02em] md:font-sans md:text-[14px] md:leading-7 md:font-medium md:tracking-[-0.03em]"
                >
                  {passwordError}
                </p>
              ) : null}
            </div>
          </div>

          <Button
            className="mt-xl h-auto w-full aspect-324/48 gap-md rounded-full bg-primary-600 p-md text-text-md font-bold tracking-[-0.02em] text-neutral-25 shadow-none hover:bg-primary-600 md:aspect-400/48 md:font-sans md:text-[16px] md:leading-7.5 md:font-bold md:tracking-[-0.02em] md:text-neutral-25"
            type="submit"
            disabled={login.isPending}
          >
            {login.isPending ? "Logging in..." : "Login"}
          </Button>

          <p className="pt-2xl text-center text-text-sm font-semibold tracking-[-0.02em] text-neutral-950 md:font-sans md:text-[16px] md:leading-7.5 md:font-semibold md:tracking-[-0.02em] md:text-neutral-950">
            Don&apos;t have an account?{" "}
            <Link
              className="text-text-sm font-bold tracking-[-0.02em] text-primary-600 md:font-sans md:text-[16px] md:leading-7.5 md:font-bold md:tracking-[-0.02em] md:text-primary-600"
              href="/register"
            >
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
