"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";

import { Toaster } from "@/components/ui/sonner";
import { store } from "@/app/store/store";
import { AuthBootstrap } from "@/features/auth/AuthBootstrap";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AuthBootstrap />
        {children}
        <Toaster richColors />
      </QueryClientProvider>
    </Provider>
  );
}
