import { QueryClient } from "@tanstack/react-query";
import { authStore } from "./auth-store";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof Error && "status" in error && (error as { status: number }).status === 401) {
          authStore.clearToken();
          window.location.href = "/login";
          return false;
        }
        return failureCount < 2;
      },
      staleTime: 1000 * 60 * 5,
    },
  },
});
