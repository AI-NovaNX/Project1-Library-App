"use client";

import { useSearchParams } from "next/navigation";

import SuccessPageClient from "./SuccessPageClient";

export default function SuccessReturnByFromQuery() {
  const searchParams = useSearchParams();
  const returnBy = searchParams.get("returnBy")?.trim() || "-";

  return <SuccessPageClient returnBy={returnBy} />;
}
