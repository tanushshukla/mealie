import { createRootRouteWithContext, Outlet, redirect } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { authStore } from "../lib/auth-store";
import { setToken } from "@api-client";

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: ({ location }) => {
    const token = authStore.getToken();
    if (token) setToken(token);

    const publicPaths = ["/login", "/forgot-password"];
    const isPublic = publicPaths.some((p) => location.pathname.startsWith(p));
    if (!isPublic && !authStore.isAuthenticated()) {
      throw redirect({ to: "/login" });
    }
  },
  component: () => <Outlet />,
});
