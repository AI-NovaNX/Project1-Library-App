import { Suspense } from "react";

import SuccessPageClient from "./SuccessPageClient";
import SuccessReturnByFromQuery from "./SuccessReturnByFromQuery";

export default function SuccessPage() {
  return (
    <Suspense fallback={<SuccessPageClient returnBy="-" />}>
      <SuccessReturnByFromQuery />
    </Suspense>
  );
}
