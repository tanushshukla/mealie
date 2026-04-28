import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod/v4";
import { useRecipes } from "../../../../../hooks/useRecipes";
import { FinderFilters } from "../../../../../components/recipe/FinderFilters";
import { RecipeCard } from "../../../../../components/recipe/RecipeCard";
import { RecipeGrid } from "../../../../../components/recipe/RecipeGrid";
import type { RecipeSummary } from "@api-client";

const searchSchema = z.object({
  tags:       z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  foods:      z.array(z.string()).optional(),
  cookTime:   z.number().optional(),
});

export const Route = createFileRoute("/g/$groupSlug/recipes/finder/")({
  validateSearch: (s) => searchSchema.parse(s),
  component: RecipeFinderPage,
});

function RecipeFinderPage() {
  const { groupSlug } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const tags       = search.tags ?? [];
  const categories = search.categories ?? [];
  const foods      = search.foods ?? [];
  const cookTime   = search.cookTime ?? 60;

  const { data, isLoading } = useRecipes({
    tags:       tags.length ? tags : undefined,
    categories: categories.length ? categories : undefined,
    foods:      foods.length ? foods : undefined,
  });

  const updateSearch = (patch: Partial<typeof search>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }) });

  const handleOpen = (recipe: RecipeSummary) =>
    navigate({ to: `/g/${groupSlug}/r/${recipe.slug ?? ""}` });

  return (
    <div className="px-8 py-7 max-w-[1320px] mx-auto">
      <div className="mb-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand mb-1">Smart cooking</div>
        <h1 className="font-serif text-[48px] leading-none tracking-[-0.025em]">
          Find something to <em className="italic font-normal text-brand">make.</em>
        </h1>
        <p className="text-text-muted mt-2 max-w-[480px]">
          Filter by tags, categories, or ingredients — all filters are independent, select in any order.
        </p>
      </div>

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-[300px_1fr] items-start">
        <aside className="bg-surface border border-border rounded-[14px] p-5 lg:sticky lg:top-[80px]">
          <FinderFilters
            selectedTags={tags}
            selectedCategories={categories}
            selectedFoods={foods}
            cookTime={cookTime}
            onTagsChange={(t) => updateSearch({ tags: t.length ? t : undefined })}
            onCategoriesChange={(c) => updateSearch({ categories: c.length ? c : undefined })}
            onFoodsChange={(f) => updateSearch({ foods: f.length ? f : undefined })}
            onCookTimeChange={(t) => updateSearch({ cookTime: t })}
          />
          {(tags.length || categories.length || foods.length) ? (
            <button
              onClick={() => navigate({ search: {} })}
              className="mt-4 w-full text-sm text-text-muted hover:text-text py-2 border border-border rounded-[8px] transition-colors"
            >
              Clear all filters
            </button>
          ) : null}
        </aside>

        <div>
          <div className="text-[13px] text-text-muted mb-4">
            <strong className="text-text">{data?.total ?? 0}</strong> recipes match
          </div>
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[4/3] rounded-[22px] bg-bg-muted animate-pulse" />
              ))}
            </div>
          ) : data?.items.length === 0 ? (
            <div className="border border-border rounded-[14px] bg-surface p-12 text-center">
              <div className="text-4xl mb-3">🌿</div>
              <h3 className="font-serif text-xl text-text mb-1">Nothing matches yet</h3>
              <p className="text-text-muted text-sm">Try different tags, categories, or removing some filters.</p>
            </div>
          ) : (
            <RecipeGrid variant="lg">
              {data?.items.map((r) => (
                <RecipeCard key={r.id ?? r.slug} recipe={r} onOpen={handleOpen} />
              ))}
            </RecipeGrid>
          )}
        </div>
      </div>
    </div>
  );
}
