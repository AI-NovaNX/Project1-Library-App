import { Suspense } from "react";

import BookListPage from "./BookListPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <BookListPage />
    </Suspense>
  );
}
