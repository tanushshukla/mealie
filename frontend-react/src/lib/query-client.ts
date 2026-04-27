import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@api-client";
import { authStore } from "./auth-store";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status === 401) {
          authStore.clearToken();
          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
          return false;
        }
        return failureCount < 2;
      },
      staleTime: 1000 * 60 * 5,
    },
  },
});
