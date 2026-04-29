import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMe, useLogout } from "../../hooks/useAuth";
import { useCreateRecipeFromUrl, useCreateRecipeFromName } from "../../hooks/useRecipes";

interface SidebarProps {
  groupSlug: string;
  onClose?: () => void;
  mobile?: boolean;
  collapsed?: boolean;
}

type ImportTab = "url" | "name";

function ImportModal({ groupSlug, onClose }: { groupSlug: string; onClose: () => void }) {
  const [tab, setTab] = useState<ImportTab>("url");
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const fromUrl = useCreateRecipeFromUrl();
  const fromName = useCreateRecipeFromName();

  const isPending = fromUrl.isPending || fromName.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      let slug: string;
      if (tab === "url") {
        slug = await fromUrl.mutateAsync(url.trim());
      } else {
        slug = await fromName.mutateAsync(name.trim());
      }
      onClose();
      navigate({ to: "/g/$groupSlug/r/$slug", params: { groupSlug, slug } });
    } catch {
      setError(
        tab === "url"
          ? "Couldn't import that URL. Make sure it's a recipe page and try again."
          : "Failed to create recipe.",
      );
    }
  }

  const canSubmit = tab === "url" ? url.trim().length > 0 : name.trim().length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        className="bg-surface rounded-xl border border-border shadow-xl w-full max-w-sm p-6 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl text-text">New recipe</h2>
          <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-text rounded-lg">✕</button>
        </div>

        {/* Tab picker */}
        <div className="flex gap-1 bg-bg-elev border border-border rounded-full p-1">
          {(["url", "name"] as ImportTab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setTab(t); setError(null); }}
              className={`flex-1 py-1.5 rounded-full text-sm font-medium transition-colors ${
                tab === t
                  ? "bg-surface text-text shadow-sm border border-border"
                  : "text-text-muted hover:text-text"
              }`}
            >
              {t === "url" ? "Import from URL" : "Blank recipe"}
            </button>
          ))}
        </div>

        {tab === "url" ? (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-dim">
              Recipe URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/pasta-recipe"
              autoFocus
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-bg text-text text-sm placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-brand/25 focus:border-brand"
            />
            <p className="text-xs text-text-dim">
              Paste a URL from any cooking website. Mealie will scrape the recipe automatically.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-dim">
              Recipe name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Grandma's Lasagne"
              autoFocus
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-bg text-text text-sm placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-brand/25 focus:border-brand"
            />
            <p className="text-xs text-text-dim">
              Start with a blank recipe and fill in ingredients and steps yourself.
            </p>
          </div>
        )}

        {error && (
          <p className="text-xs text-danger bg-danger/8 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={isPending || !canSubmit}
          className="w-full py-2.5 rounded-full bg-brand text-brand-fg text-sm font-medium hover:bg-brand-ink transition-colors disabled:opacity-50"
        >
          {isPending
            ? tab === "url"
              ? "Importing…"
              : "Creating…"
            : tab === "url"
            ? "Import recipe"
            : "Create recipe"}
        </button>
      </form>
    </div>
  );
}

export function Sidebar({ groupSlug, onClose, mobile, collapsed }: SidebarProps) {
  const state = useRouterState();
  const path = state.location.pathname;
  const { data: me } = useMe();
  const logout = useLogout();
  const [importOpen, setImportOpen] = useState(false);
  const displayName = me?.fullName ?? me?.username ?? "Account";
  const initials = me?.fullName
    ? me.fullName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : (me?.username?.[0] ?? "U").toUpperCase();

  const navMain = [
    { id: "home", label: "Home", href: `/g/${groupSlug}/home`, icon: "🏠" },
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
        <button
          onClick={() => setImportOpen(true)}
          title="New recipe"
          className="w-10 h-10 rounded-[10px] flex items-center justify-center text-brand bg-brand-soft hover:bg-brand hover:text-brand-fg transition-colors text-lg mb-1"
        >
          +
        </button>
        {navMain.map((n) => {
          const exactOnly = n.href === `/g/${groupSlug}` || n.href === `/g/${groupSlug}/home`;
          const active = path === n.href || (!exactOnly && path.startsWith(n.href));
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
        <button
          onClick={logout}
          title="Sign out"
          className="mt-auto w-10 h-10 rounded-[10px] flex items-center justify-center text-base text-text-dim hover:text-danger hover:bg-danger/8 transition-colors"
        >
          ↩
        </button>
        {importOpen && (
          <ImportModal groupSlug={groupSlug} onClose={() => setImportOpen(false)} />
        )}
      </aside>
    );
  }

  return (
    <>
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

        <button
          onClick={() => setImportOpen(true)}
          className="flex items-center justify-center gap-2 bg-brand text-brand-fg text-sm font-medium py-2 rounded-full mx-1.5 mb-2 hover:bg-brand-ink transition-colors"
        >
          + New recipe
        </button>

        <div className="text-[11px] font-semibold uppercase tracking-widest text-text-dim px-2.5 mt-3 mb-1.5">Cook</div>
        {navMain.map((n) => {
          const exactOnly = n.href === `/g/${groupSlug}` || n.href === `/g/${groupSlug}/home`;
          const active = path === n.href || (!exactOnly && path.startsWith(n.href));
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

        <div className="mt-auto flex flex-col gap-1">
          <div className="flex items-center gap-2.5 p-2.5 rounded-[12px] bg-bg-elev border border-border">
            <div className="w-8 h-8 rounded-full bg-brand-soft flex items-center justify-center text-brand-ink text-xs font-semibold shrink-0">{initials}</div>
            <div className="flex flex-col leading-tight min-w-0 flex-1">
              <span className="text-sm font-semibold text-text truncate">{displayName}</span>
              <span className="text-xs text-text-muted truncate">{groupSlug}</span>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full text-left text-xs text-text-dim hover:text-danger px-2.5 py-1.5 rounded-[8px] hover:bg-danger/8 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {importOpen && (
        <ImportModal groupSlug={groupSlug} onClose={() => setImportOpen(false)} />
      )}
    </>
  );
}
