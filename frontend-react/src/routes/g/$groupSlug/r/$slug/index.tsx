import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useRecipe } from "../../../../../hooks/useRecipes";
import { RecipeHero } from "../../../../../components/recipe/RecipeHero";
import { IngredientsList } from "../../../../../components/recipe/IngredientsList";
import { NutritionPanel } from "../../../../../components/recipe/NutritionPanel";
import { StepList } from "../../../../../components/recipe/StepList";

export const Route = createFileRoute("/g/$groupSlug/r/$slug/")({
  component: RecipeDetailPage,
});

function RecipeDetailPage() {
  const { groupSlug, slug } = Route.useParams();
  const { data: recipe, isLoading, isError } = useRecipe(slug);
  const [detailTab, setDetailTab] = useState<"ingredients" | "nutrition">("ingredients");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-text-muted">
        Loading recipe…
      </div>
    );
  }

  if (isError || !recipe) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-text-muted">
        <p>Recipe not found.</p>
        <Link to="/g/$groupSlug" params={{ groupSlug }} className="text-sm text-brand hover:underline">
          ← Back to recipes
        </Link>
      </div>
    );
  }

  const ingredients = recipe.recipeIngredient ?? [];
  const steps = recipe.recipeInstructions ?? [];
  const hasNutrition = !!recipe.nutrition && Object.values(recipe.nutrition).some((v) => v != null && v !== "");

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-6">
      <nav className="flex items-center gap-1.5 text-sm text-text-dim">
        <Link to="/g/$groupSlug" params={{ groupSlug }} className="hover:text-text">
          Recipes
        </Link>
        <span>›</span>
        <span className="text-text truncate">{recipe.name}</span>
      </nav>

      <RecipeHero recipe={recipe} />

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <div className="bg-surface rounded-lg border border-border overflow-hidden">
          <div className="flex border-b border-border">
            <button
              onClick={() => setDetailTab("ingredients")}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                detailTab === "ingredients"
                  ? "text-text border-b-2 border-brand -mb-px"
                  : "text-text-muted hover:text-text"
              }`}
            >
              Ingredients
            </button>
            {hasNutrition && (
              <button
                onClick={() => setDetailTab("nutrition")}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  detailTab === "nutrition"
                    ? "text-text border-b-2 border-brand -mb-px"
                    : "text-text-muted hover:text-text"
                }`}
              >
                Nutrition
              </button>
            )}
          </div>
          <div className="p-5">
            {detailTab === "ingredients" ? (
              <IngredientsList ingredients={ingredients} bare />
            ) : (
              recipe.nutrition && <NutritionPanel nutrition={recipe.nutrition} bare />
            )}
          </div>
        </div>

        <StepList steps={steps} />
      </div>

      {recipe.notes && recipe.notes.length > 0 && (
        <div className="bg-bg-sunken rounded-lg border border-border p-5 flex flex-col gap-3">
          <h2 className="font-serif text-xl text-text">Notes</h2>
          {recipe.notes.map((note, i) => (
            <div key={i} className="flex flex-col gap-1">
              {note.title && <h3 className="text-sm font-semibold text-text">{note.title}</h3>}
              <p className="text-sm text-text-muted leading-relaxed">{note.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
