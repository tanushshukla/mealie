import { Link, useRouterState } from "@tanstack/react-router";

const TABS = [
  {
    label: "Recipes",
    href: (s: string) => `/g/${s}`,
    icon: "📖",
    matchFn: (path: string, s: string) => path === `/g/${s}` || path.startsWith(`/g/${s}/r/`),
  },
  {
    label: "Finder",
    href: (s: string) => `/g/${s}/recipes/finder`,
    icon: "✨",
    matchFn: (path: string, s: string) => path.startsWith(`/g/${s}/recipes/finder`),
  },
  {
    label: "Planner",
    href: (s: string) => `/g/${s}/planner`,
    icon: "📅",
    matchFn: (path: string, s: string) => path.startsWith(`/g/${s}/planner`),
  },
  {
    label: "Shopping",
    href: (s: string) => `/g/${s}/shopping`,
    icon: "🛒",
    matchFn: (path: string, s: string) => path.startsWith(`/g/${s}/shopping`),
  },
];

export function MobileTabbar({ groupSlug }: { groupSlug: string }) {
  const state = useRouterState();
  const path = state.location.pathname;
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border flex z-30">
      {TABS.map((t) => {
        const active = t.matchFn(path, groupSlug);
        return (
          <Link
            key={t.label}
            to={t.href(groupSlug) as string}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium ${
              active ? "text-brand" : "text-text-muted"
            }`}
          >
            <span className="text-xl">{t.icon}</span>
            <span>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
