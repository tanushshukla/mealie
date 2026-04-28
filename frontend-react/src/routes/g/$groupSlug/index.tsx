import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useEffect, useState } from "react";
import { z } from "zod/v4";
import { useInfiniteRecipes } from "../../../hooks/useRecipes";
import { RecipeCard } from "../../../components/recipe/RecipeCard";
import { RecipeGrid } from "../../../components/recipe/RecipeGrid";
import { FilterBar } from "../../../components/recipe/FilterBar";
import type { RecipeSummary } from "@api-client";

const searchSchema = z.object({
  q: z.string().optional(),
  tag: z.string().optional(),
});

export const Route = createFileRoute("/g/$groupSlug/")({
  validateSearch: (s) => searchSchema.parse(s),
  component: RecipeSearchPage,
});

function RecipeSearchPage() {
  const { groupSlug } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [maxTime, setMaxTime] = useState(120);
  const [view, setView] = useState<"grid" | "list">("grid");
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const activeTag = search.tag ?? "All";

  const params = {
    search: search.q,
    tags: activeTag !== "All" ? [activeTag] : undefined,
  };

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteRecipes(params);

  const allItems = data?.pages.flatMap((p) => p.items) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  const handleOpen = (recipe: RecipeSummary) => {
    navigate({ to: `/g/${groupSlug}/r/${recipe.slug ?? ""}` });
  };

  const handleTagChange = (slug: string) => {
    navigate({ search: (prev) => ({ ...prev, tag: slug !== "All" ? slug : undefined }) });
  };

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage(); },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="px-8 py-7 max-w-[1320px] mx-auto">
      <div className="flex justify-between items-end mb-5 gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand mb-1">Cookbook</div>
          <h1 className="font-serif text-[52px] leading-none tracking-[-0.03em] max-w-[700px]">
            A small library of <em className="italic font-normal text-brand">good things</em>.
          </h1>
        </div>
        <button className="flex items-center gap-2 bg-brand text-brand-fg text-sm font-medium px-4 py-2.5 rounded-full hover:bg-brand-ink transition-colors shrink-0">
          + Add recipe
        </button>
      </div>

      <FilterBar
        activeTag={activeTag}
        onTagChange={handleTagChange}
        maxTime={maxTime}
        onTimeChange={setMaxTime}
        view={view}
        onViewChange={setView}
      />

      <div className="text-[13px] text-text-muted mb-4">
        <strong className="text-text">{total}</strong> recipes · sorted by recently added
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] rounded-[22px] bg-bg-muted animate-pulse" />
          ))}
        </div>
      ) : view === "grid" ? (
        <RecipeGrid>
          {allItems.map((r) => <RecipeCard key={r.id ?? r.slug} recipe={r} onOpen={handleOpen} />)}
        </RecipeGrid>
      ) : (
        <div className="flex flex-col gap-2.5">
          {allItems.map((r) => (
            <RecipeCard key={r.id ?? r.slug} recipe={r} onOpen={handleOpen} layout="row" />
          ))}
        </div>
      )}

      <div ref={loadMoreRef} className="h-10 flex items-center justify-center mt-4">
        {isFetchingNextPage && (
          <div className="text-sm text-text-muted">Loading more…</div>
        )}
      </div>
    </div>
  );
}
