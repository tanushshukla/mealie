import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";

interface TopbarProps {
  title: string;
  eyebrow?: string;
  theme: "light" | "dark";
  onTheme: () => void;
  onMenu?: () => void;
  mobile?: boolean;
  groupSlug?: string;
}

export function Topbar({ title, eyebrow, theme, onTheme, onMenu, mobile, groupSlug }: TopbarProps) {
  const navigate = useNavigate();

  const handleSearch = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && groupSlug) {
        const q = (e.target as HTMLInputElement).value;
        navigate({ to: `/g/${groupSlug}` as string, search: { q } as Record<string, string> });
      }
    },
    [navigate, groupSlug],
  );

  return (
    <div
      className="sticky top-0 z-20 border-b border-border flex items-center gap-3 px-6 min-h-[64px]"
      style={{
        background: "color-mix(in oklab, var(--bg) 85%, transparent)",
        backdropFilter: "blur(12px)",
      }}
    >
      {mobile && (
        <button
          onClick={onMenu}
          className="w-9 h-9 rounded-[10px] flex items-center justify-center text-text-muted hover:bg-bg-elev"
        >
          ☰
        </button>
      )}
      <div className="flex flex-col min-w-0 flex-shrink-0">
        {eyebrow && (
          <div className="text-[11px] font-semibold uppercase tracking-widest text-text-dim">
            {eyebrow}
          </div>
        )}
        <h2 className="font-serif text-[22px] font-medium text-text truncate">{title}</h2>
      </div>
      {!mobile && groupSlug && (
        <div className="flex-1 max-w-[480px] mx-auto flex items-center gap-2 bg-bg-elev border border-border rounded-[999px] px-3.5 py-2 text-text-muted">
          <span className="text-sm">🔍</span>
          <input
            className="flex-1 bg-transparent border-0 outline-none text-text text-sm"
            placeholder="Search recipes, ingredients…"
            onKeyDown={handleSearch}
          />
          <kbd className="font-mono text-[11px] px-1.5 py-0.5 rounded border border-border bg-bg-sunken text-text-dim">
            ⌘K
          </kbd>
        </div>
      )}
      <div className="ml-auto flex items-center gap-1">
        <button
          onClick={onTheme}
          className="w-9 h-9 rounded-[10px] flex items-center justify-center text-text-muted hover:bg-bg-elev hover:border hover:border-border"
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
        <div className="w-8 h-8 rounded-full bg-brand-soft flex items-center justify-center text-brand-ink text-xs font-semibold ml-1">
          U
        </div>
      </div>
    </div>
  );
}
