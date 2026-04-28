import { Link, useRouterState } from "@tanstack/react-router";

interface SidebarProps {
  groupSlug: string;
  onClose?: () => void;
  mobile?: boolean;
  collapsed?: boolean;
}

export function Sidebar({ groupSlug, onClose, mobile, collapsed }: SidebarProps) {
  const state = useRouterState();
  const path = state.location.pathname;

  const navMain = [
    { id: "recipes", label: "Recipes", href: `/g/${groupSlug}`, icon: "📖" },
    { id: "finder", label: "Recipe Finder", href: `/g/${groupSlug}/recipes/finder`, icon: "✨" },
    { id: "planner", label: "Meal Planner", href: `/g/${groupSlug}/planner`, icon: "📅" },
    { id: "shopping", label: "Shopping List", href: `/g/${groupSlug}/shopping`, icon: "🛒" },
  ];

  if (collapsed) {
    return (
      <aside className="bg-sidebar-bg border-r border-border flex flex-col items-center gap-1 py-4 h-full w-[72px]">
        <div className="w-9 h-9 rounded-lg bg-brand-soft flex items-center justify-center text-brand text-lg mb-3">
          🍴
        </div>
        {navMain.map((n) => {
          const active =
            path === n.href || (n.href !== `/g/${groupSlug}` && path.startsWith(n.href));
          return (
            <Link
              key={n.id}
              to={n.href as string}
              title={n.label}
              className={`w-10 h-10 rounded-[10px] flex items-center justify-center text-lg transition-colors ${
                active
                  ? "bg-bg-elev border border-border shadow-sm"
                  : "text-sidebar-text hover:bg-black/5"
              }`}
            >
              {n.icon}
            </Link>
          );
        })}
      </aside>
    );
  }

  return (
    <aside className="bg-sidebar-bg border-r border-border flex flex-col gap-1 p-4 h-full">
      <div className="flex items-center gap-2.5 px-2 pb-4">
        <div className="w-9 h-9 rounded-lg bg-brand-soft flex items-center justify-center text-brand text-lg">🍴</div>
        <span className="font-serif text-[19px] font-semibold tracking-tight text-text">
          ChopChop<em className="italic text-brand font-medium">Plan</em>
        </span>
        {mobile && (
          <button onClick={onClose} className="ml-auto w-8 h-8 flex items-center justify-center text-text-muted hover:text-text">✕</button>
        )}
      </div>

      <button className="flex items-center justify-center gap-2 bg-brand text-brand-fg text-sm font-medium py-2 rounded-full mx-1.5 mb-2 hover:bg-brand-ink transition-colors">
        + New recipe
      </button>

      <div className="text-[11px] font-semibold uppercase tracking-widest text-text-dim px-2.5 mt-3 mb-1.5">Cook</div>
      {navMain.map((n) => {
        const active =
          path === n.href || (n.href !== `/g/${groupSlug}` && path.startsWith(n.href));
        return (
          <Link
            key={n.id}
            to={n.href as string}
            onClick={onClose}
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] text-sm font-medium transition-colors ${
              active
                ? "bg-bg-elev text-brand-ink border border-border shadow-sm"
                : "text-sidebar-text hover:bg-black/5"
            }`}
          >
            <span className="text-base">{n.icon}</span>
            <span>{n.label}</span>
          </Link>
        );
      })}

      <div className="mt-auto">
        <div className="flex items-center gap-2.5 p-2.5 rounded-[12px] bg-bg-elev border border-border">
          <div className="w-8 h-8 rounded-full bg-brand-soft flex items-center justify-center text-brand-ink text-xs font-semibold">U</div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-text">Account</span>
            <span className="text-xs text-text-muted">{groupSlug}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
