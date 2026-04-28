import {
  createRootRouteWithContext,
  Outlet,
  redirect,
  useRouterState,
} from "@tanstack/react-router";
import { useState, useEffect } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { authStore } from "../lib/auth-store";
import { setToken } from "@api-client";
import { useMe } from "../hooks/useAuth";
import { Sidebar } from "../components/layout/Sidebar";
import { Topbar } from "../components/layout/Topbar";
import { MobileTabbar } from "../components/layout/MobileTabbar";
import { MobileDrawer } from "../components/layout/MobileDrawer";

interface RouterContext {
  queryClient: QueryClient;
}

const PUBLIC_PATHS = ["/login", "/forgot-password"];

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: ({ location }) => {
    const token = authStore.getToken();
    if (token) setToken(token);
    const isPublic = PUBLIC_PATHS.some((p) => location.pathname.startsWith(p));
    if (!isPublic && !token) {
      throw redirect({ to: "/login" });
    }
  },
  component: RootLayout,
});

function RootLayout() {
  const { location } = useRouterState();
  const isPublic = PUBLIC_PATHS.some((p) => location.pathname.startsWith(p));
  if (isPublic) return <Outlet />;
  return <AppShell />;
}

function AppShell() {
  const { location } = useRouterState();
  const [theme, setTheme] = useState<"light" | "dark">(
    () => (localStorage.getItem("theme") === "dark" ? "dark" : "light"),
  );
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(
    window.innerWidth >= 768 && window.innerWidth < 1024,
  );
  const groupSlug = location.pathname.split("/")[2] ?? "home";
  const { data: me } = useMe();
  const userInitials = me?.fullName
    ? me.fullName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : (me?.username?.[0] ?? "U").toUpperCase();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const update = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const toggleTheme = () =>
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      localStorage.setItem("theme", next);
      return next;
    });

  return (
    <div
      className={`flex min-h-screen bg-bg ${isMobile ? "" : "grid"}`}
      style={
        !isMobile
          ? { gridTemplateColumns: isTablet ? "72px 1fr" : "240px 1fr" }
          : undefined
      }
    >
      {!isMobile && (
        <div className="sticky top-0 h-screen overflow-y-auto">
          <Sidebar groupSlug={groupSlug} collapsed={isTablet} />
        </div>
      )}
      <div className="flex flex-col min-w-0">
        <Topbar
          title="ChopChopPlan"
          theme={theme}
          onTheme={toggleTheme}
          mobile={isMobile}
          onMenu={() => setMobileNavOpen(true)}
          groupSlug={groupSlug}
          userInitials={userInitials}
        />
        <main className={`flex-1 ${isMobile ? "pb-20" : ""}`}>
          <Outlet />
        </main>
        {isMobile && <MobileTabbar groupSlug={groupSlug} />}
      </div>
      {isMobile && (
        <MobileDrawer
          open={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          groupSlug={groupSlug}
        />
      )}
    </div>
  );
}
