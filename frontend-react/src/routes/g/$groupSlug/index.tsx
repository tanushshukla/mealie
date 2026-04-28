import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod/v4";
import { useRecipes } from "../../../hooks/useRecipes";
import { RecipeCard } from "../../../components/recipe/RecipeCard";
import { RecipeGrid } from "../../../components/recipe/RecipeGrid";
import { FilterBar } from "../../../components/recipe/FilterBar";
import type { RecipeSummary } from "@api-client";

const searchSchema = z.object({
  q: z.string().optional(),
  tags: z.array(z.string()).optional(),
  page: z.number().optional(),
});

export const Route = createFileRoute("/g/$groupSlug/")({
  validateSearch: (s) => searchSchema.parse(s),
  component: RecipeSearchPage,
});

function RecipeSearchPage() {
  const { groupSlug } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [activeTag, setActiveTag] = useState(search.tags?.[0] ?? "All");
  const [maxTime, setMaxTime] = useState(120);
  const [view, setView] = useState<"grid" | "list">("grid");

  const params = {
    search: search.q,
    tags: activeTag !== "All" ? [activeTag] : undefined,
  };

  const { data, isLoading } = useRecipes(params);

  const handleOpen = (recipe: RecipeSummary) => {
    navigate({ to: `/g/${groupSlug}/r/${recipe.slug ?? ""}` });
  };

  const handleTagChange = (tag: string) => {
    setActiveTag(tag);
    navigate({ search: (prev) => ({ ...prev, tags: tag !== "All" ? [tag] : undefined }) });
  };

  return (
    <div className="px-8 py-7 max-w-[1320px] mx-auto">
      <div className="flex justify-between items-end mb-5 gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand mb-1">Cookbook</div>
          <h1 className="font-serif text-[52px] leading-none tracking-[-0.03em] max-w-[700px]">
            A small library of <em className="italic font-normal text-brand">good things</em>.
          </h1>
        </div>
        <button className="flex items-center gap-2 bg-brand text-brand-fg text-sm font-medium px-4 py-2.5 rounded-[999px] hover:bg-brand-ink transition-colors">
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
        <strong className="text-text">{data?.total ?? 0}</strong> recipes · sorted by recently added
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] rounded-[22px] bg-bg-muted animate-pulse" />
          ))}
        </div>
      ) : view === "grid" ? (
        <RecipeGrid>
          {data?.items.map((r) => <RecipeCard key={r.id ?? r.slug} recipe={r} onOpen={handleOpen} />)}
        </RecipeGrid>
      ) : (
        <div className="flex flex-col gap-2.5">
          {data?.items.map((r) => (
            <RecipeCard key={r.id ?? r.slug} recipe={r} onOpen={handleOpen} layout="row" />
          ))}
        </div>
      )}
    </div>
  );
}
